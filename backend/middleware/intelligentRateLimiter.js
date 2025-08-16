const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('redis');
const { logRateLimit, logSuspiciousActivity } = require('./securityLogger');

// Configuração do Redis
let redisClient;
try {
  redisClient = Redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.warn('Redis não disponível, usando memória como fallback');
        return undefined;
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });
} catch (error) {
  console.warn('Redis não disponível, usando limitação de memória');
}

// Rate limiter para endpoints públicos (mais permissivo)
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em um minuto.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Permitir requisições com cache 304 e OPTIONS
    return req.method === 'OPTIONS' || (req.method === 'GET' && req.get('If-None-Match'));
  }
});

// Rate limiter para endpoints de serviços (services)
const servicesApiLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 segundos
  max: 50, // 50 requisições por 30 segundos
  message: {
    success: false,
    message: 'Limite de requisições para serviços excedido.',
    retryAfter: 30
  },
  keyGenerator: (req) => {
    // Usar combinação IP + User-Agent para identificação mais precisa
    return `${req.ip}:${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
  }
});

// Rate limiter para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por 15 minutos
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: 900
  }
});

// Rate limiter para comentários (moderado)
const commentsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // 20 comentários por IP
  message: {
    success: false,
    message: 'Limite de comentários excedido. Aguarde 5 minutos.',
    retryAfter: 300
  }
});

// Rate limiter para agendamentos
const appointmentsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 agendamentos por minuto
  message: {
    success: false,
    message: 'Limite de agendamentos excedido. Tente novamente em um minuto.',
    retryAfter: 60
  }
});

// Sistema inteligente de detecção de padrões
class IntelligentRateLimiter {
  constructor() {
    this.requestHistory = new Map();
    this.suspiciousPatterns = new Map();
  }

  analyzeRequest(req) {
    const key = `${req.ip}:${req.url}`;
    const now = Date.now();
    
    if (!this.requestHistory.has(key)) {
      this.requestHistory.set(key, []);
    }
    
    const history = this.requestHistory.get(key);
    
    // Limpar histórico antigo (últimos 60 segundos)
    const recentRequests = history.filter(timestamp => now - timestamp < 60000);
    this.requestHistory.set(key, recentRequests);
    
    // Adicionar requisição atual
    recentRequests.push(now);
    
    return this.detectSuspiciousActivity(key, recentRequests, req);
  }

  detectSuspiciousActivity(key, requests, req) {
    const patterns = [];
    
    // Padrão 1: Mais de 20 requisições por minuto (ajustado de 100)
    if (requests.length > 20) {
      patterns.push('highFrequency');
    }
    
    // Padrão 2: Rapid fire (mais de 5 requisições em 5 segundos) - ajustado de 10
    const last5Seconds = requests.filter(t => Date.now() - t < 5000);
    if (last5Seconds.length > 5) {
      patterns.push('rapidFire');
    }
    
    // Padrão 3: Requisições idênticas repetitivas - ajustado para ser mais permissivo
    const identicalRequests = requests.filter(t => Date.now() - t < 10000);
    if (identicalRequests.length > 8 && req.method === 'GET') {
      patterns.push('repetitive');
    }
    
    // Padrão 4: User-Agent suspeito
    const userAgent = req.get('User-Agent') || '';
    const suspiciousUserAgents = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python/i, /java/i];
    if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
      patterns.push('suspiciousUserAgent');
    }
    
    return {
      shouldBlock: patterns.length > 1, // Bloquear apenas com múltiplos padrões
      patterns,
      severity: this.calculateSeverity(patterns)
    };
  }

  calculateSeverity(patterns) {
    if (patterns.includes('rapidFire') && patterns.includes('highFrequency')) {
      return 'HIGH';
    }
    if (patterns.includes('suspiciousUserAgent')) {
      return 'HIGH';
    }
    if (patterns.length > 0) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  middleware() {
    return (req, res, next) => {
      const analysis = this.analyzeRequest(req);
      
      if (analysis.shouldBlock) {
        logSuspiciousActivity(req, {
          pattern: 'RATE_LIMIT_EXCEEDED',
          details: {
            patterns: analysis.patterns,
            severity: analysis.severity,
            url: req.url,
            method: req.method
          }
        });
        
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          patterns: analysis.patterns,
          retryAfter: 60
        });
      }
      
      next();
    };
  }
}

// Middleware de fallback para quando Redis não está disponível
const memoryRateLimiter = (options = {}) => {
  const { windowMs = 60000, max = 100, message = 'Muitas requisições. Tente novamente mais tarde.' } = options;
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const ipRequests = requests.get(ip);
    const validRequests = ipRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(ip, validRequests);
    next();
  };
};

module.exports = {
  publicApiLimiter,
  servicesApiLimiter,
  authLimiter,
  commentsLimiter,
  appointmentsLimiter,
  IntelligentRateLimiter,
  memoryRateLimiter
};