/**
 * Middleware de segurança específico para multi-tenant
 * Implementa logs de segurança, validação de acesso e prevenção de vazamento de dados
 */

const fs = require('fs');
const path = require('path');

// Cria o diretório de logs se não existir
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Arquivo de log específico para segurança multi-tenant
const tenantSecurityLogFile = path.join(logsDir, 'tenant-security.log');

// Cache para rastrear tentativas de acesso por IP
const accessAttempts = new Map();

/**
 * Função para obter informações detalhadas do cliente
 * @param {import('express').Request} req
 * @returns {object}
 */
const getClientInfo = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;
  
  return {
    ip,
    userAgent: req.headers['user-agent'] || 'Unknown',
    referer: req.headers.referer || 'Direct',
    method: req.method,
    url: req.originalUrl || req.url,
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID || 'no-session',
    userId: req.user?.id || 'anonymous',
    tenantId: req.tenant?.barbershopId || 'no-tenant',
    tenantSlug: req.tenant?.slug || 'no-slug'
  };
};

/**
 * Função para log de eventos de segurança multi-tenant
 * @param {import('express').Request} req
 * @param {string} eventType
 * @param {object} details
 */
const logTenantSecurityEvent = (req, eventType, details = {}) => {
  const clientInfo = getClientInfo(req);
  
  const logEntry = {
    timestamp: clientInfo.timestamp,
    eventType,
    severity: determineSeverity(eventType, details),
    clientInfo,
    tenantInfo: {
      barbershopId: req.tenant?.barbershopId,
      slug: req.tenant?.slug,
      name: req.tenant?.name,
      planType: req.tenant?.planType
    },
    userInfo: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role,
      barbershopId: req.user?.barbershopId
    },
    details
  };
  
  // Log no console para desenvolvimento
  console.log(`🔒 [TENANT-SECURITY] ${eventType}:`, {
    ip: clientInfo.ip,
    tenant: req.tenant?.slug || 'no-tenant',
    user: req.user?.username || 'anonymous',
    severity: logEntry.severity
  });
  
  // Salva no arquivo de log
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(tenantSecurityLogFile, logLine);
  
  return logEntry;
};

/**
 * Determina a severidade do evento baseado no tipo e detalhes
 */
const determineSeverity = (eventType, details) => {
  const highSeverityEvents = [
    'CROSS_TENANT_ACCESS_ATTEMPT',
    'TENANT_NOT_FOUND_SUSPICIOUS',
    'UNAUTHORIZED_ADMIN_ACCESS',
    'DATA_BREACH_ATTEMPT'
  ];
  
  const mediumSeverityEvents = [
    'TENANT_NOT_FOUND',
    'INVALID_TENANT_ACCESS',
    'PLAN_LIMIT_EXCEEDED'
  ];
  
  if (highSeverityEvents.includes(eventType)) return 'HIGH';
  if (mediumSeverityEvents.includes(eventType)) return 'MEDIUM';
  return 'LOW';
};

/**
 * Middleware para bloquear queries sem tenant válido
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.blockQueriesWithoutTenant = (req, res, next) => {
  // Skip para rotas que não requerem tenant (auth, registration, etc.)
  const publicRoutes = ['/api/auth', '/api/barbershops/register', '/api/barbershops/check-slug'];
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  
  if (isPublicRoute) {
    return next();
  }
  
  // Verificar se há contexto de tenant
  if (!req.tenant || !req.tenant.barbershopId) {
    logTenantSecurityEvent(req, 'QUERY_WITHOUT_TENANT', {
      attemptedPath: req.path,
      method: req.method
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied: Valid tenant context required',
      code: 'TENANT_CONTEXT_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware para detectar tentativas de acesso cross-tenant
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.detectCrossTenantAccess = (req, res, next) => {
  if (!req.user || !req.tenant) {
    return next();
  }
  
  // Verificar se usuário pertence ao tenant
  if (req.user.barbershopId !== req.tenant.barbershopId) {
    logTenantSecurityEvent(req, 'CROSS_TENANT_ACCESS_ATTEMPT', {
      userTenant: req.user.barbershopId,
      requestedTenant: req.tenant.barbershopId,
      attemptedResource: req.path
    });
    
    // Incrementar contador de tentativas suspeitas
    const clientInfo = getClientInfo(req);
    const key = `${clientInfo.ip}-${req.user.id}`;
    const attempts = accessAttempts.get(key) || 0;
    accessAttempts.set(key, attempts + 1);
    
    // Se muitas tentativas, bloquear temporariamente
    if (attempts > 3) {
      logTenantSecurityEvent(req, 'IP_BLOCKED_CROSS_TENANT', {
        attempts: attempts + 1,
        blockDuration: '1 hour'
      });
      
      return res.status(429).json({
        success: false,
        message: 'Too many unauthorized access attempts. Access temporarily blocked.',
        code: 'CROSS_TENANT_BLOCKED'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied: User does not belong to this barbershop',
      code: 'CROSS_TENANT_ACCESS_DENIED'
    });
  }
  
  next();
};

/**
 * Middleware para log de queries executadas por tenant
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.logTenantQueries = (req, res, next) => {
  if (req.tenant) {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log da query executada
      logTenantSecurityEvent(req, 'TENANT_QUERY_EXECUTED', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseSize: data ? data.length : 0,
        executionTime: Date.now() - req.startTime
      });
      
      originalSend.call(this, data);
    };
    
    req.startTime = Date.now();
  }
  
  next();
};

/**
 * Middleware para detectar tentativas de acesso a tenants inexistentes
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.detectSuspiciousTenantAccess = (req, res, next) => {
  const urlPath = req.path;
  const slugMatch = urlPath.match(/\/(?:api\/)?app\/([a-z0-9-]+)/);
  
  if (slugMatch) {
    const slug = slugMatch[1];
    
    // Detectar padrões suspeitos no slug
    const suspiciousPatterns = [
      /admin/i,
      /test/i,
      /debug/i,
      /api/i,
      /\.\./, // Path traversal
      /<script/i, // XSS attempt
      /select.*from/i, // SQL injection attempt
      /union.*select/i // SQL injection attempt
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(slug));
    
    if (isSuspicious) {
      logTenantSecurityEvent(req, 'TENANT_NOT_FOUND_SUSPICIOUS', {
        suspiciousSlug: slug,
        patterns: suspiciousPatterns.filter(pattern => pattern.test(slug)).map(p => p.toString())
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid barbershop identifier',
        code: 'INVALID_TENANT_IDENTIFIER'
      });
    }
  }
  
  next();
};

/**
 * Middleware para validar limites do plano e log de tentativas de excesso
 */
/**
 * @param {string} resource
 * @returns {function}
 */
exports.validatePlanLimits = (resource) => {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  return async (req, res, next) => {
    if (!req.tenant) {
      return next();
    }
    
    const planType = req.tenant.planType || 'free';
    const planLimits = {
      free: {
        barbers: 1,
        appointments_per_month: 20,
        services: 5,
        storage_mb: 100
      },
      pro: {
        barbers: Infinity,
        appointments_per_month: Infinity,
        services: Infinity,
        storage_mb: 1000
      }
    };
    
    const limits = planLimits[planType] || planLimits.free;
    const limit = limits[resource];
    
    if (limit !== Infinity) {
      // Aqui você implementaria a verificação real do uso atual
      // Por enquanto, apenas log da tentativa
      logTenantSecurityEvent(req, 'PLAN_LIMIT_CHECK', {
        resource,
        planType,
        limit,
        currentUsage: 'to-be-implemented'
      });
    }
    
    req.planLimits = limits;
    next();
  };
};

/**
 * Função para gerar relatório de segurança por tenant
 */
/**
 * @param {string|null} barbershopId
 * @returns {object}
 */
exports.generateTenantSecurityReport = (barbershopId = null) => {
  try {
    if (!fs.existsSync(tenantSecurityLogFile)) {
      return { message: 'Nenhum log de segurança multi-tenant encontrado' };
    }
    
    const logs = fs.readFileSync(tenantSecurityLogFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    // Filtrar por tenant se especificado
    const filteredLogs = barbershopId 
      ? logs.filter(log => log.tenantInfo?.barbershopId === barbershopId)
      : logs;
    
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentLogs = filteredLogs.filter(log => 
      new Date(log.timestamp).getTime() > last24Hours
    );
    
    const tenantStats = {};
    const securityEvents = {};
    const crossTenantAttempts = [];
    
    recentLogs.forEach(log => {
      const tenantId = log.tenantInfo?.barbershopId || 'unknown';
      
      if (!tenantStats[tenantId]) {
        tenantStats[tenantId] = {
          name: log.tenantInfo?.name || 'Unknown',
          slug: log.tenantInfo?.slug || 'unknown',
          events: 0,
          highSeverityEvents: 0
        };
      }
      
      tenantStats[tenantId].events++;
      if (log.severity === 'HIGH') {
        tenantStats[tenantId].highSeverityEvents++;
      }
      
      securityEvents[log.eventType] = (securityEvents[log.eventType] || 0) + 1;
      
      if (log.eventType === 'CROSS_TENANT_ACCESS_ATTEMPT') {
        crossTenantAttempts.push({
          timestamp: log.timestamp,
          ip: log.clientInfo.ip,
          user: log.userInfo?.username,
          fromTenant: log.details?.userTenant,
          toTenant: log.details?.requestedTenant
        });
      }
    });
    
    return {
      totalEvents: recentLogs.length,
      tenantStats,
      securityEvents,
      crossTenantAttempts,
      highSeverityCount: recentLogs.filter(log => log.severity === 'HIGH').length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de segurança multi-tenant:', error);
    return { error: 'Erro ao gerar relatório' };
  }
};

/**
 * Limpar tentativas de acesso antigas (executar periodicamente)
 */
/**
 * @returns {void}
 */
exports.cleanupAccessAttempts = () => {
  accessAttempts.clear();
  console.log('[TENANT-SECURITY] Access attempts cache cleared');
};