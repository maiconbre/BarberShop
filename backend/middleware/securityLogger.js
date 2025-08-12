const fs = require('fs');
const path = require('path');

// Cria o diretório de logs se não existir
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Arquivo de log para atividades suspeitas
const securityLogFile = path.join(logsDir, 'security.log');

// Função para formatar timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Função para obter informações do IP
const getClientInfo = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const referer = req.headers.referer || 'Direct';
  
  return {
    ip,
    userAgent,
    referer,
    method: req.method,
    url: req.originalUrl || req.url,
    timestamp: getTimestamp()
  };
};

// Função para detectar padrões suspeitos
const detectSuspiciousActivity = (clientInfo, requestCount, timeWindow) => {
  const suspiciousPatterns = {
    highFrequency: requestCount > 100, // Mais de 100 requests em pouco tempo
    botUserAgent: /bot|crawler|spider|scraper/i.test(clientInfo.userAgent),
    emptyUserAgent: !clientInfo.userAgent || clientInfo.userAgent === 'Unknown',
    rapidFire: timeWindow < 1000, // Requests muito rápidos (menos de 1 segundo)
    suspiciousReferer: clientInfo.referer.includes('suspicious') || clientInfo.referer.includes('attack')
  };
  
  return Object.entries(suspiciousPatterns)
    .filter(([_, isMatch]) => isMatch)
    .map(([pattern]) => pattern);
};

// Função principal de logging de segurança
const logSecurityEvent = (req, eventType, details = {}) => {
  const clientInfo = getClientInfo(req);
  const suspiciousPatterns = detectSuspiciousActivity(
    clientInfo, 
    details.requestCount || 0, 
    details.timeWindow || 0
  );
  
  const logEntry = {
    timestamp: clientInfo.timestamp,
    eventType,
    severity: suspiciousPatterns.length > 0 ? 'HIGH' : 'MEDIUM',
    clientInfo,
    suspiciousPatterns,
    details
  };
  
  // Log no console para desenvolvimento
  console.log(`🚨 [SECURITY] ${eventType}:`, {
    ip: clientInfo.ip,
    severity: logEntry.severity,
    patterns: suspiciousPatterns,
    url: clientInfo.url
  });
  
  // Salva no arquivo de log
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(securityLogFile, logLine);
  
  return logEntry;
};

// Função para log de rate limiting
const logRateLimit = (req, details) => {
  return logSecurityEvent(req, 'RATE_LIMIT_EXCEEDED', {
    requestCount: details.requestCount,
    timeWindow: details.timeWindow,
    blockDuration: details.blockDuration,
    endpoint: req.originalUrl || req.url
  });
};

// Função para log de atividade suspeita
const logSuspiciousActivity = (req, activityType, details) => {
  return logSecurityEvent(req, 'SUSPICIOUS_ACTIVITY', {
    activityType,
    ...details
  });
};

// Função para log de bloqueio de IP
const logIPBlock = (req, reason, duration) => {
  return logSecurityEvent(req, 'IP_BLOCKED', {
    reason,
    blockDuration: duration,
    timestamp: getTimestamp()
  });
};

// Função para analisar logs e gerar relatório
const generateSecurityReport = () => {
  try {
    if (!fs.existsSync(securityLogFile)) {
      return { message: 'Nenhum log de segurança encontrado' };
    }
    
    const logs = fs.readFileSync(securityLogFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(log => 
      new Date(log.timestamp).getTime() > last24Hours
    );
    
    const ipStats = {};
    const eventTypes = {};
    
    recentLogs.forEach(log => {
      const ip = log.clientInfo.ip;
      if (!ipStats[ip]) {
        ipStats[ip] = { count: 0, events: [], severity: 'LOW' };
      }
      ipStats[ip].count++;
      ipStats[ip].events.push(log.eventType);
      if (log.severity === 'HIGH') ipStats[ip].severity = 'HIGH';
      
      eventTypes[log.eventType] = (eventTypes[log.eventType] || 0) + 1;
    });
    
    return {
      totalEvents: recentLogs.length,
      uniqueIPs: Object.keys(ipStats).length,
      topOffenders: Object.entries(ipStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 10),
      eventTypes,
      lastUpdated: getTimestamp()
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de segurança:', error);
    return { error: 'Erro ao gerar relatório' };
  }
};

module.exports = {
  logSecurityEvent,
  logRateLimit,
  logSuspiciousActivity,
  logIPBlock,
  generateSecurityReport,
  getClientInfo
};