#!/usr/bin/env node

/**
 * Health check script for production monitoring
 * This script can be run periodically to check system health
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  // Frontend health check
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
    timeout: 10000,
  },
  // Backend health check
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:8000',
    timeout: 10000,
  },
  // Database health check (if applicable)
  database: {
    enabled: process.env.DB_HEALTH_CHECK === 'true',
    url: process.env.DB_HEALTH_URL,
  }
};

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: data.substring(0, 1000), // Limit data size
        });
      });
    });
    
    req.on('error', (error) => {
      reject({
        error: error.message,
        responseTime: Date.now() - startTime,
      });
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        responseTime: timeout,
      });
    });
  });
}

/**
 * Check frontend health
 */
async function checkFrontend() {
  try {
    console.log('🔍 Checking frontend health...');
    const result = await makeRequest(config.frontend.url, config.frontend.timeout);
    
    if (result.statusCode === 200) {
      console.log(`✅ Frontend is healthy (${result.responseTime}ms)`);
      return { status: 'healthy', responseTime: result.responseTime };
    } else {
      console.log(`⚠️  Frontend returned status ${result.statusCode} (${result.responseTime}ms)`);
      return { status: 'warning', responseTime: result.responseTime, statusCode: result.statusCode };
    }
  } catch (error) {
    console.log(`❌ Frontend health check failed: ${error.error || error.message}`);
    return { status: 'critical', error: error.error || error.message };
  }
}

/**
 * Check backend health
 */
async function checkBackend() {
  try {
    console.log('🔍 Checking backend health...');
    const healthUrl = `${config.backend.url}/health`;
    const result = await makeRequest(healthUrl, config.backend.timeout);
    
    if (result.statusCode === 200) {
      console.log(`✅ Backend is healthy (${result.responseTime}ms)`);
      return { status: 'healthy', responseTime: result.responseTime };
    } else {
      console.log(`⚠️  Backend returned status ${result.statusCode} (${result.responseTime}ms)`);
      return { status: 'warning', responseTime: result.responseTime, statusCode: result.statusCode };
    }
  } catch (error) {
    console.log(`❌ Backend health check failed: ${error.error || error.message}`);
    return { status: 'critical', error: error.error || error.message };
  }
}

/**
 * Check database health (if enabled)
 */
async function checkDatabase() {
  if (!config.database.enabled || !config.database.url) {
    return { status: 'skipped', message: 'Database health check disabled' };
  }
  
  try {
    console.log('🔍 Checking database health...');
    const result = await makeRequest(config.database.url, 5000);
    
    if (result.statusCode === 200) {
      console.log(`✅ Database is healthy (${result.responseTime}ms)`);
      return { status: 'healthy', responseTime: result.responseTime };
    } else {
      console.log(`⚠️  Database returned status ${result.statusCode} (${result.responseTime}ms)`);
      return { status: 'warning', responseTime: result.responseTime, statusCode: result.statusCode };
    }
  } catch (error) {
    console.log(`❌ Database health check failed: ${error.error || error.message}`);
    return { status: 'critical', error: error.error || error.message };
  }
}

/**
 * Generate health report
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    services: results,
    summary: {
      healthy: 0,
      warning: 0,
      critical: 0,
      skipped: 0,
    }
  };
  
  // Calculate overall status
  results.forEach(result => {
    report.summary[result.status]++;
    
    if (result.status === 'critical') {
      report.overall = 'critical';
    } else if (result.status === 'warning' && report.overall !== 'critical') {
      report.overall = 'warning';
    }
  });
  
  return report;
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  console.log('🏥 Starting health check...\n');
  
  const results = [];
  
  // Check frontend
  const frontendResult = await checkFrontend();
  results.push({ service: 'frontend', ...frontendResult });
  
  console.log('');
  
  // Check backend
  const backendResult = await checkBackend();
  results.push({ service: 'backend', ...backendResult });
  
  console.log('');
  
  // Check database (if enabled)
  const databaseResult = await checkDatabase();
  results.push({ service: 'database', ...databaseResult });
  
  console.log('');
  
  // Generate report
  const report = generateReport(results);
  
  // Print summary
  console.log('📊 Health Check Summary:');
  console.log(`Overall Status: ${report.overall.toUpperCase()}`);
  console.log(`✅ Healthy: ${report.summary.healthy}`);
  console.log(`⚠️  Warning: ${report.summary.warning}`);
  console.log(`❌ Critical: ${report.summary.critical}`);
  console.log(`⏭️  Skipped: ${report.summary.skipped}`);
  
  // Save report to file (optional)
  if (process.env.SAVE_REPORT === 'true') {
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = path.join(__dirname, '..', 'logs', 'health-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, `health-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportFile}`);
  }
  
  // Exit with appropriate code
  if (report.overall === 'critical') {
    process.exit(1);
  } else if (report.overall === 'warning') {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

// Run health check if called directly
if (require.main === module) {
  runHealthCheck().catch((error) => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { runHealthCheck, checkFrontend, checkBackend, checkDatabase };