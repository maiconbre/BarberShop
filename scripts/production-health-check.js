#!/usr/bin/env node

/**
 * Script de Health Check para Produção
 * 
 * Verifica se todos os serviços estão funcionando corretamente
 * em ambiente de produção.
 */

const https = require('https');
const http = require('http');

// Configurações
const config = {
  frontend: {
    url: process.env.FRONTEND_URL || 'https://barbershop-saas.onrender.com',
    timeout: 10000
  },
  backend: {
    url: process.env.BACKEND_URL || 'https://barber-backend-spm8.onrender.com',
    timeout: 10000
  },
  database: {
    // Será testado via endpoint do backend
    healthEndpoint: '/api/health'
  }
};

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          data: data,
          responseTime: responseTime,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
  });
}

async function checkFrontend() {
  log('\n🌐 Checking Frontend...', 'blue');
  
  try {
    const response = await makeRequest(config.frontend.url, config.frontend.timeout);
    
    if (response.statusCode === 200) {
      log(`✅ Frontend is UP (${response.responseTime}ms)`, 'green');
      
      // Verificar se é uma SPA válida
      if (response.data.includes('<div id="root">') || response.data.includes('<!DOCTYPE html>')) {
        log('✅ Frontend serving valid HTML', 'green');
      } else {
        log('⚠️  Frontend HTML structure may be invalid', 'yellow');
      }
      
      return true;
    } else {
      log(`❌ Frontend returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkBackend() {
  log('\n🔧 Checking Backend...', 'blue');
  
  try {
    // Check main endpoint
    const response = await makeRequest(config.backend.url, config.backend.timeout);
    
    if (response.statusCode === 200) {
      log(`✅ Backend is UP (${response.responseTime}ms)`, 'green');
    } else {
      log(`❌ Backend returned status ${response.statusCode}`, 'red');
      return false;
    }
    
    // Check health endpoint
    try {
      const healthResponse = await makeRequest(
        config.backend.url + config.database.healthEndpoint,
        config.backend.timeout
      );
      
      if (healthResponse.statusCode === 200) {
        const healthData = JSON.parse(healthResponse.data);
        log(`✅ Health check passed (${healthResponse.responseTime}ms)`, 'green');
        
        if (healthData.database) {
          log('✅ Database connection is healthy', 'green');
        } else {
          log('⚠️  Database status unknown', 'yellow');
        }
        
        return true;
      } else {
        log(`❌ Health check failed with status ${healthResponse.statusCode}`, 'red');
        return false;
      }
    } catch (healthError) {
      log(`⚠️  Health endpoint not available: ${healthError.message}`, 'yellow');
      return true; // Main endpoint is working
    }
    
  } catch (error) {
    log(`❌ Backend check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkCriticalEndpoints() {
  log('\n🔍 Checking Critical Endpoints...', 'blue');
  
  const endpoints = [
    '/api/auth/validate-token',
    '/api/barbershops',
    '/api/appointments',
    '/api/services',
    '/api/barbers'
  ];
  
  let passedCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(
        config.backend.url + endpoint,
        5000
      );
      
      // Accept various status codes (200, 401, 403, etc.)
      // The important thing is that the endpoint responds
      if (response.statusCode < 500) {
        log(`✅ ${endpoint} is responding (${response.statusCode})`, 'green');
        passedCount++;
      } else {
        log(`❌ ${endpoint} returned ${response.statusCode}`, 'red');
      }
    } catch (error) {
      log(`❌ ${endpoint} failed: ${error.message}`, 'red');
    }
  }
  
  const successRate = (passedCount / endpoints.length) * 100;
  log(`\n📊 Endpoint Success Rate: ${successRate.toFixed(1)}%`, 
      successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  return successRate >= 80;
}

async function checkPerformance() {
  log('\n⚡ Performance Check...', 'blue');
  
  const performanceTests = [
    { name: 'Frontend Load Time', url: config.frontend.url, threshold: 3000 },
    { name: 'Backend Response Time', url: config.backend.url, threshold: 2000 },
    { name: 'API Health Check', url: config.backend.url + '/api/health', threshold: 1000 }
  ];
  
  let performanceIssues = 0;
  
  for (const test of performanceTests) {
    try {
      const response = await makeRequest(test.url, 15000);
      
      if (response.responseTime <= test.threshold) {
        log(`✅ ${test.name}: ${response.responseTime}ms (good)`, 'green');
      } else {
        log(`⚠️  ${test.name}: ${response.responseTime}ms (slow, threshold: ${test.threshold}ms)`, 'yellow');
        performanceIssues++;
      }
    } catch (error) {
      log(`❌ ${test.name}: Failed - ${error.message}`, 'red');
      performanceIssues++;
    }
  }
  
  return performanceIssues === 0;
}

async function checkSSL() {
  log('\n🔒 SSL/Security Check...', 'blue');
  
  const urls = [config.frontend.url, config.backend.url];
  
  for (const url of urls) {
    if (url.startsWith('https://')) {
      log(`✅ ${url} is using HTTPS`, 'green');
    } else {
      log(`⚠️  ${url} is not using HTTPS`, 'yellow');
    }
  }
  
  return true;
}

async function generateReport(results) {
  log('\n📋 HEALTH CHECK REPORT', 'blue');
  log('=' .repeat(50), 'blue');
  
  const timestamp = new Date().toISOString();
  log(`Timestamp: ${timestamp}`);
  
  let overallHealth = 'HEALTHY';
  let issueCount = 0;
  
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${check}: ${status}`, color);
    
    if (!passed) {
      issueCount++;
      if (check === 'Frontend' || check === 'Backend') {
        overallHealth = 'CRITICAL';
      } else if (overallHealth === 'HEALTHY') {
        overallHealth = 'WARNING';
      }
    }
  });
  
  log('\n' + '=' .repeat(50), 'blue');
  
  const healthColor = overallHealth === 'HEALTHY' ? 'green' : 
                     overallHealth === 'WARNING' ? 'yellow' : 'red';
  
  log(`Overall Health: ${overallHealth}`, healthColor);
  log(`Issues Found: ${issueCount}`);
  
  if (overallHealth === 'CRITICAL') {
    log('\n🚨 CRITICAL ISSUES DETECTED!', 'red');
    log('Immediate attention required.', 'red');
    process.exit(1);
  } else if (overallHealth === 'WARNING') {
    log('\n⚠️  Some issues detected.', 'yellow');
    log('Monitor closely and consider investigation.', 'yellow');
    process.exit(0);
  } else {
    log('\n🎉 All systems operational!', 'green');
    process.exit(0);
  }
}

async function main() {
  log('🏥 Production Health Check Starting...', 'blue');
  log(`Frontend: ${config.frontend.url}`);
  log(`Backend: ${config.backend.url}`);
  
  const results = {};
  
  try {
    results.Frontend = await checkFrontend();
    results.Backend = await checkBackend();
    results['Critical Endpoints'] = await checkCriticalEndpoints();
    results.Performance = await checkPerformance();
    results['SSL/Security'] = await checkSSL();
    
    await generateReport(results);
    
  } catch (error) {
    log(`\n❌ Health check failed with error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n⏹️  Health check interrupted', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n\n⏹️  Health check terminated', 'yellow');
  process.exit(143);
});

// Run the health check
if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  checkFrontend,
  checkBackend,
  checkCriticalEndpoints,
  checkPerformance,
  checkSSL
};