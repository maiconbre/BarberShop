/**
 * Script para iniciar o servidor principal + Health Check automaticamente
 * Ideal para deploy no Render, Railway, Heroku, etc.
 * 
 * Este script:
 * 1. Inicia o servidor principal (server.js)
 * 2. Aguarda 30 segundos para o servidor estabilizar
 * 3. Inicia o health check automatizado
 * 4. Gerencia ambos os processos
 */

const { spawn } = require('child_process');
const path = require('path');

// Configurações
const SERVER_SCRIPT = path.join(__dirname, '..', 'server.js');
const HEALTH_CHECK_SCRIPT = path.join(__dirname, 'health-check-auto.js');
const STARTUP_DELAY = 30000; // 30 segundos para o servidor inicializar

let serverProcess = null;
let healthCheckProcess = null;
let isShuttingDown = false;

/**
 * Log com timestamp
 */
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

/**
 * Inicia o servidor principal
 */
function startServer() {
  log('🚀 Iniciando servidor principal...');
  
  serverProcess = spawn('node', [SERVER_SCRIPT], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env }
  });
  
  serverProcess.on('error', (error) => {
    log(`❌ Erro no servidor: ${error.message}`, 'ERROR');
    if (!isShuttingDown) {
      process.exit(1);
    }
  });
  
  serverProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      log(`⚠️ Servidor finalizou inesperadamente (código: ${code}, sinal: ${signal})`, 'WARN');
      process.exit(code || 1);
    }
  });
  
  log('✅ Servidor principal iniciado');
}

/**
 * Inicia o health check
 */
function startHealthCheck() {
  log('🏥 Iniciando health check automatizado...');
  
  healthCheckProcess = spawn('node', [HEALTH_CHECK_SCRIPT], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env }
  });
  
  // Redirecionar saída do health check com prefixo
  healthCheckProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`[HEALTH] ${line}`);
    });
  });
  
  healthCheckProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`[HEALTH-ERROR] ${line}`);
    });
  });
  
  healthCheckProcess.on('error', (error) => {
    log(`❌ Erro no health check: ${error.message}`, 'ERROR');
    // Health check não é crítico, continua sem ele
  });
  
  healthCheckProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      log(`⚠️ Health check finalizou (código: ${code}, sinal: ${signal})`, 'WARN');
      // Tentar reiniciar health check após 60 segundos
      setTimeout(() => {
        if (!isShuttingDown) {
          log('🔄 Tentando reiniciar health check...');
          startHealthCheck();
        }
      }, 60000);
    }
  });
  
  log('✅ Health check iniciado');
}

/**
 * Para todos os processos graciosamente
 */
function shutdown() {
  if (isShuttingDown) return;
  
  isShuttingDown = true;
  log('🛑 Iniciando shutdown gracioso...');
  
  // Parar health check primeiro
  if (healthCheckProcess && !healthCheckProcess.killed) {
    log('🏥 Parando health check...');
    healthCheckProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (!healthCheckProcess.killed) {
        healthCheckProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  // Parar servidor
  if (serverProcess && !serverProcess.killed) {
    log('🚀 Parando servidor...');
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 10000);
  } else {
    process.exit(0);
  }
}

/**
 * Função principal
 */
function main() {
  log('🎯 Iniciando aplicação com health check integrado');
  log(`📍 Servidor: ${SERVER_SCRIPT}`);
  log(`🏥 Health Check: ${HEALTH_CHECK_SCRIPT}`);
  log(`⏱️ Delay de inicialização: ${STARTUP_DELAY / 1000}s`);
  log('=====================================');
  
  // Iniciar servidor
  startServer();
  
  // Aguardar servidor estabilizar e iniciar health check
  setTimeout(() => {
    if (!isShuttingDown) {
      startHealthCheck();
    }
  }, STARTUP_DELAY);
}

// Handlers para sinais do sistema
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGQUIT', shutdown);

// Handler para erros não capturados
process.on('uncaughtException', (error) => {
  log(`💥 Erro não capturado: ${error.message}`, 'ERROR');
  log(`Stack: ${error.stack}`, 'ERROR');
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Promise rejeitada: ${reason}`, 'ERROR');
  shutdown();
});

// Iniciar aplicação
if (require.main === module) {
  main();
}

module.exports = {
  startServer,
  startHealthCheck,
  shutdown
};