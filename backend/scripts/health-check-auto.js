/**
 * Script de Health Check Automatizado 24/7
 * 
 * Regras:
 * 🕕 Entre 06:00 e 22:00 → ping a cada 10 minutos
 * 🌙 Entre 22:00 e 06:00 → ping a cada 30 minutos
 * 
 * Execução: node scripts/health-check-auto.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  API_URL: process.env.API_URL || 'https://barber-backend-spm8.onrender.com',
  ENDPOINTS: [
    '/api/barbers',
    '/api/comments?status=approved',
    '/api/services'
  ],
  INTERVALS: {
    DAY: 10 * 60 * 1000,   // 10 minutos (06:00 - 22:00)
    NIGHT: 30 * 60 * 1000  // 30 minutos (22:00 - 06:00)
  },
  TIMEOUT: 30000, // 30 segundos
  LOG_FILE: path.join(__dirname, 'health-check.log')
};

// Estado do script
let currentTimeout = null;
let isRunning = false;
let stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  startTime: new Date(),
  lastCheck: null
};

/**
 * Função para determinar se é horário diurno ou noturno
 * @returns {boolean} true se for horário diurno (06:00 - 22:00)
 */
function isDayTime() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 6 && hour < 22;
}

/**
 * Função para obter o intervalo atual baseado no horário
 * @returns {number} Intervalo em milissegundos
 */
function getCurrentInterval() {
  return isDayTime() ? CONFIG.INTERVALS.DAY : CONFIG.INTERVALS.NIGHT;
}

/**
 * Função para formatar data/hora
 * @param {Date} date 
 * @returns {string}
 */
function formatDateTime(date) {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Função para log com timestamp
 * @param {string} message 
 * @param {string} level 
 */
function log(message, level = 'INFO') {
  const timestamp = formatDateTime(new Date());
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // Salvar no arquivo de log
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
  } catch (error) {
    console.error('Erro ao escrever no arquivo de log:', error.message);
  }
}

/**
 * Função para fazer ping em um endpoint
 * @param {string} endpoint 
 * @returns {Promise<Object>}
 */
async function pingEndpoint(endpoint) {
  const url = `${CONFIG.API_URL}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const response = await axios.get(url, {
      timeout: CONFIG.TIMEOUT,
      headers: {
        'User-Agent': 'Health-Check-Bot/1.0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      endpoint,
      status: response.status,
      responseTime,
      dataSize: JSON.stringify(response.data).length
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      endpoint,
      error: error.message,
      responseTime,
      status: error.response?.status || 'TIMEOUT'
    };
  }
}

/**
 * Função principal de health check
 */
async function performHealthCheck() {
  const checkTime = new Date();
  const period = isDayTime() ? 'DIURNO' : 'NOTURNO';
  const interval = getCurrentInterval() / 1000 / 60; // em minutos
  
  log(`🔍 Iniciando health check - Período: ${period} (${interval}min)`);
  
  const results = [];
  
  // Testar todos os endpoints
  for (const endpoint of CONFIG.ENDPOINTS) {
    const result = await pingEndpoint(endpoint);
    results.push(result);
    
    stats.totalRequests++;
    
    if (result.success) {
      stats.successfulRequests++;
      log(`✅ ${endpoint} - Status: ${result.status} - Tempo: ${result.responseTime}ms`);
    } else {
      stats.failedRequests++;
      log(`❌ ${endpoint} - Erro: ${result.error} - Status: ${result.status}`, 'ERROR');
    }
  }
  
  // Calcular estatísticas do check
  const successCount = results.filter(r => r.success).length;
  const totalEndpoints = results.length;
  const successRate = ((successCount / totalEndpoints) * 100).toFixed(1);
  
  stats.lastCheck = checkTime;
  
  log(`📊 Health check concluído - Sucesso: ${successCount}/${totalEndpoints} (${successRate}%)`);
  
  // Se houver falhas, log adicional
  if (successCount < totalEndpoints) {
    log(`⚠️  Alguns endpoints falharam. Verifique os logs acima.`, 'WARN');
  }
  
  return results;
}

/**
 * Função para agendar o próximo health check
 */
function scheduleNextCheck() {
  if (!isRunning) return;
  
  const interval = getCurrentInterval();
  const nextCheckTime = new Date(Date.now() + interval);
  
  log(`⏰ Próximo check agendado para: ${formatDateTime(nextCheckTime)}`);
  
  currentTimeout = setTimeout(async () => {
    if (isRunning) {
      await performHealthCheck();
      scheduleNextCheck();
    }
  }, interval);
}

/**
 * Função para exibir estatísticas
 */
function showStats() {
  const uptime = Math.floor((Date.now() - stats.startTime.getTime()) / 1000 / 60); // em minutos
  const successRate = stats.totalRequests > 0 ? 
    ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) : '0.0';
  
  log('📈 === ESTATÍSTICAS ===');
  log(`   Tempo ativo: ${uptime} minutos`);
  log(`   Total de requests: ${stats.totalRequests}`);
  log(`   Sucessos: ${stats.successfulRequests}`);
  log(`   Falhas: ${stats.failedRequests}`);
  log(`   Taxa de sucesso: ${successRate}%`);
  log(`   Último check: ${stats.lastCheck ? formatDateTime(stats.lastCheck) : 'Nenhum'}`);
  log('========================');
}

/**
 * Função para parar o script graciosamente
 */
function stopScript() {
  log('🛑 Parando health check...');
  isRunning = false;
  
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }
  
  showStats();
  log('✅ Health check parado com sucesso.');
  process.exit(0);
}

/**
 * Função principal para iniciar o script
 */
async function startHealthCheck() {
  log('🚀 Iniciando Health Check Automatizado 24/7');
  log(`📍 API URL: ${CONFIG.API_URL}`);
  log(`🕕 Intervalo diurno (06:00-22:00): ${CONFIG.INTERVALS.DAY / 1000 / 60} minutos`);
  log(`🌙 Intervalo noturno (22:00-06:00): ${CONFIG.INTERVALS.NIGHT / 1000 / 60} minutos`);
  log('=====================================');
  
  isRunning = true;
  
  // Primeiro health check imediato
  await performHealthCheck();
  
  // Agendar próximos checks
  scheduleNextCheck();
  
  // Exibir estatísticas a cada hora
  setInterval(showStats, 60 * 60 * 1000);
}

// Handlers para sinais do sistema
process.on('SIGINT', stopScript);
process.on('SIGTERM', stopScript);
process.on('SIGQUIT', stopScript);

// Handler para erros não capturados
process.on('uncaughtException', (error) => {
  log(`💥 Erro não capturado: ${error.message}`, 'ERROR');
  log(`Stack: ${error.stack}`, 'ERROR');
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Promise rejeitada: ${reason}`, 'ERROR');
});

// Iniciar o script
if (require.main === module) {
  startHealthCheck().catch(error => {
    log(`💥 Erro ao iniciar health check: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  startHealthCheck,
  stopScript,
  showStats,
  stats
};