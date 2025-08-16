#!/usr/bin/env node

/**
 * Script de Validação para Produção
 * 
 * Executa todas as verificações necessárias antes do deploy em produção
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

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

async function checkEnvironmentVariables() {
  log('\n🔧 Checking Environment Variables...', 'blue');
  
  const requiredVars = [
    'VITE_API_URL',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const envFile = '.env.production';
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envFile, 'utf8');
  } catch (error) {
    log(`❌ ${envFile} not found`, 'red');
    return false;
  }
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    if (regex.test(envContent)) {
      log(`✅ ${varName} is configured`, 'green');
    } else {
      log(`❌ ${varName} is missing or empty`, 'red');
      allPresent = false;
    }
  }
  
  // Check for development-only values
  if (envContent.includes('VITE_DEV_MODE=true')) {
    log('❌ VITE_DEV_MODE should be false in production', 'red');
    allPresent = false;
  }
  
  if (envContent.includes('VITE_DEBUG_API=true')) {
    log('❌ VITE_DEBUG_API should be false in production', 'red');
    allPresent = false;
  }
  
  return allPresent;
}

async function runTests() {
  log('\n🧪 Running Tests...', 'blue');
  
  try {
    const { stdout, stderr } = await execAsync('npm run test:run');
    
    // Parse test results
    const testResults = stdout.match(/Tests\s+(\d+)\s+passed/);
    const failedResults = stdout.match(/(\d+)\s+failed/);
    
    if (failedResults && parseInt(failedResults[1]) > 0) {
      log(`❌ ${failedResults[1]} tests failed`, 'red');
      return false;
    }
    
    if (testResults) {
      log(`✅ ${testResults[1]} tests passed`, 'green');
    }
    
    return true;
  } catch (error) {
    log(`❌ Tests failed: ${error.message}`, 'red');
    return false;
  }
}

async function runLinting() {
  log('\n🔍 Running Linting...', 'blue');
  
  try {
    await execAsync('npm run lint');
    log('✅ No linting errors', 'green');
    return true;
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || '';
    
    // Count errors and warnings
    const errorCount = (errorOutput.match(/error/g) || []).length;
    const warningCount = (errorOutput.match(/warning/g) || []).length;
    
    if (errorCount > 0) {
      log(`❌ ${errorCount} linting errors found`, 'red');
      return false;
    }
    
    if (warningCount > 0) {
      log(`⚠️  ${warningCount} linting warnings found`, 'yellow');
    }
    
    return true;
  }
}

async function buildProduction() {
  log('\n🏗️  Building for Production...', 'blue');
  
  try {
    const { stdout } = await execAsync('npm run build:prod');
    
    // Check if build was successful
    if (fs.existsSync('dist/index.html')) {
      log('✅ Production build successful', 'green');
      
      // Check build size
      const stats = fs.statSync('dist');
      log(`📦 Build output created in dist/`, 'blue');
      
      return true;
    } else {
      log('❌ Build output not found', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkDependencies() {
  log('\n📦 Checking Dependencies...', 'blue');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for development dependencies in production
    const prodDeps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    
    log(`✅ ${Object.keys(prodDeps).length} production dependencies`, 'green');
    log(`📝 ${Object.keys(devDeps).length} development dependencies`, 'blue');
    
    // Check for security vulnerabilities
    try {
      await execAsync('npm audit --audit-level=high --production');
      log('✅ No high-severity vulnerabilities', 'green');
    } catch (auditError) {
      log('⚠️  Security vulnerabilities found, check npm audit', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Dependency check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkBackendConfiguration() {
  log('\n🔧 Checking Backend Configuration...', 'blue');
  
  const backendEnvFile = 'backend/.env.render';
  
  if (!fs.existsSync(backendEnvFile)) {
    log(`⚠️  ${backendEnvFile} not found`, 'yellow');
    return true; // Not critical for frontend validation
  }
  
  try {
    const envContent = fs.readFileSync(backendEnvFile, 'utf8');
    
    const requiredBackendVars = [
      'NODE_ENV=production',
      'JWT_SECRET',
      'REFRESH_TOKEN_SECRET',
      'DATABASE_URL'
    ];
    
    let allPresent = true;
    
    for (const varPattern of requiredBackendVars) {
      if (envContent.includes(varPattern.split('=')[0])) {
        log(`✅ ${varPattern.split('=')[0]} is configured`, 'green');
      } else {
        log(`❌ ${varPattern.split('=')[0]} is missing`, 'red');
        allPresent = false;
      }
    }
    
    return allPresent;
  } catch (error) {
    log(`❌ Backend configuration check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkDocumentation() {
  log('\n📚 Checking Documentation...', 'blue');
  
  const requiredDocs = [
    'docs/production/PRODUCTION_SETUP.md',
    'docs/production/DEPLOYMENT_CHECKLIST.md',
    'README.md'
  ];
  
  let allPresent = true;
  
  for (const docPath of requiredDocs) {
    if (fs.existsSync(docPath)) {
      log(`✅ ${docPath} exists`, 'green');
    } else {
      log(`❌ ${docPath} is missing`, 'red');
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function generateValidationReport(results) {
  log('\n📋 PRODUCTION VALIDATION REPORT', 'blue');
  log('=' .repeat(50), 'blue');
  
  const timestamp = new Date().toISOString();
  log(`Timestamp: ${timestamp}`);
  
  let overallStatus = 'READY';
  let criticalIssues = 0;
  let warnings = 0;
  
  Object.entries(results).forEach(([check, result]) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? 'green' : 'red';
    
    log(`${check}: ${status}`, color);
    
    if (!result.passed) {
      if (result.critical) {
        criticalIssues++;
        overallStatus = 'NOT READY';
      } else {
        warnings++;
        if (overallStatus === 'READY') {
          overallStatus = 'READY WITH WARNINGS';
        }
      }
    }
  });
  
  log('\n' + '=' .repeat(50), 'blue');
  
  const statusColor = overallStatus === 'READY' ? 'green' : 
                     overallStatus === 'READY WITH WARNINGS' ? 'yellow' : 'red';
  
  log(`Overall Status: ${overallStatus}`, statusColor);
  log(`Critical Issues: ${criticalIssues}`);
  log(`Warnings: ${warnings}`);
  
  if (overallStatus === 'NOT READY') {
    log('\n🚨 CRITICAL ISSUES DETECTED!', 'red');
    log('Fix critical issues before deploying to production.', 'red');
    return false;
  } else if (overallStatus === 'READY WITH WARNINGS') {
    log('\n⚠️  Some warnings detected.', 'yellow');
    log('Review warnings but deployment can proceed.', 'yellow');
    return true;
  } else {
    log('\n🎉 Ready for production deployment!', 'green');
    return true;
  }
}

async function main() {
  log('🚀 Production Validation Starting...', 'blue');
  
  const results = {};
  
  try {
    results['Environment Variables'] = {
      passed: await checkEnvironmentVariables(),
      critical: true
    };
    
    results['Tests'] = {
      passed: await runTests(),
      critical: true
    };
    
    results['Linting'] = {
      passed: await runLinting(),
      critical: false
    };
    
    results['Production Build'] = {
      passed: await buildProduction(),
      critical: true
    };
    
    results['Dependencies'] = {
      passed: await checkDependencies(),
      critical: false
    };
    
    results['Backend Configuration'] = {
      passed: await checkBackendConfiguration(),
      critical: false
    };
    
    results['Documentation'] = {
      passed: await checkDocumentation(),
      critical: false
    };
    
    const isReady = await generateValidationReport(results);
    
    process.exit(isReady ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Validation failed with error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n⏹️  Validation interrupted', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\n\n⏹️  Validation terminated', 'yellow');
  process.exit(143);
});

// Run the validation
if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  checkEnvironmentVariables,
  runTests,
  runLinting,
  buildProduction,
  checkDependencies
};