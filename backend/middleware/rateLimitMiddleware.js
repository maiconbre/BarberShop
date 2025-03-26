const rateLimit = require('express-rate-limit');

// Armazenamento para controlar requisições por IP
const requestStore = new Map();

// Middleware para limitar requisições com cooldown
const createRateLimiter = (options = {}) => {
  // Configurações padrão
  const config = {
    windowMs: options.windowMs || 5000, // 5 segundos padrão
    maxRequests: options.maxRequests || 3, // 3 requisições padrão
    message: options.message || {
      success: false,
      message: 'Muitas requisições. Por favor, aguarde alguns segundos antes de tentar novamente.'
    }
  };

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Inicializa o contador para este IP se não existir
    if (!requestStore.has(ip)) {
      requestStore.set(ip, {
        count: 0,
        firstRequest: Date.now(),
        blocked: false,
        blockExpires: 0
      });
    }
    
    const record = requestStore.get(ip);
    const now = Date.now();
    
    // Verifica se o IP está bloqueado
    if (record.blocked) {
      if (now < record.blockExpires) {
        // Ainda está no período de cooldown
        const remainingTime = Math.ceil((record.blockExpires - now) / 1000);
        return res.status(429).json({
          success: false,
          message: `Muitas requisições. Por favor, aguarde ${remainingTime} segundos antes de tentar novamente.`
        });
      } else {
        // Período de cooldown terminou, reseta o contador
        record.blocked = false;
        record.count = 1;
        record.firstRequest = now;
        requestStore.set(ip, record);
        return next();
      }
    }
    
    // Verifica se estamos dentro da janela de tempo
    if (now - record.firstRequest > config.windowMs) {
      // Reseta o contador se a janela de tempo expirou
      record.count = 1;
      record.firstRequest = now;
    } else {
      // Incrementa o contador
      record.count += 1;
      
      // Verifica se excedeu o limite
      if (record.count > config.maxRequests) {
        // Bloqueia o IP por 5 segundos
        record.blocked = true;
        record.blockExpires = now + config.windowMs;
        requestStore.set(ip, record);
        
        return res.status(429).json(config.message);
      }
    }
    
    requestStore.set(ip, record);
    next();
  };
};

// Limpa o armazenamento periodicamente para evitar vazamento de memória
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestStore.entries()) {
    if (now - record.firstRequest > 3600000) { // 1 hora
      requestStore.delete(ip);
    }
  }
}, 3600000); // Limpa a cada hora

module.exports = { createRateLimiter };