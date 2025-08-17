/**
 * Script para testar conexão com Supabase em produção
 * Valida configurações e conectividade
 */

require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testSupabaseConnection() {
  log('\n🔍 TESTE DE CONEXÃO COM SUPABASE', 'bold');
  log('=' * 50, 'blue');

  // 1. Verificar variáveis de ambiente
  logInfo('1. Verificando variáveis de ambiente...');
  
  const requiredVars = [
    'DATABASE_URL',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY'
  ];

  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      logSuccess(`${varName}: Configurada`);
    }
  });

  if (missingVars.length > 0) {
    logError(`Variáveis faltando: ${missingVars.join(', ')}`);
    return false;
  }

  // 2. Testar conexão Sequelize
  logInfo('\n2. Testando conexão Sequelize...');
  
  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        // Configurações para resolver erro SCRAM
        application_name: 'barbershop_test',
        options: '--search_path=public'
      },
      pool: {
        max: 1,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: false
    });

    await sequelize.authenticate();
    logSuccess('Conexão Sequelize estabelecida com sucesso');
    
    // Testar query simples
    const [results] = await sequelize.query('SELECT version();');
    logSuccess(`PostgreSQL Version: ${results[0].version}`);
    
    await sequelize.close();
    
  } catch (error) {
    logError(`Erro na conexão Sequelize: ${error.message}`);
    return false;
  }

  // 3. Testar cliente Supabase
  logInfo('\n3. Testando cliente Supabase...');
  
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    // Testar conexão básica
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (error) {
      logError(`Erro no cliente Supabase: ${error.message}`);
      return false;
    }

    logSuccess('Cliente Supabase conectado com sucesso');
    
  } catch (error) {
    logError(`Erro no cliente Supabase: ${error.message}`);
    return false;
  }

  // 4. Verificar configurações de produção
  logInfo('\n4. Verificando configurações de produção...');
  
  const prodChecks = {
    'NODE_ENV': process.env.NODE_ENV === 'production',
    'SQL_LOGGING': process.env.SQL_LOGGING !== 'true',
    'JWT_SECRET': process.env.JWT_SECRET && process.env.JWT_SECRET.length > 32,
    'CORS_ORIGIN': process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes('https')
  };

  Object.entries(prodChecks).forEach(([check, passed]) => {
    if (passed) {
      logSuccess(`${check}: OK`);
    } else {
      logWarning(`${check}: Verificar configuração`);
    }
  });

  // 5. Informações da conexão
  logInfo('\n5. Informações da conexão:');
  
  const dbUrl = new URL(process.env.DATABASE_URL);
  log(`   Host: ${dbUrl.hostname}`, 'blue');
  log(`   Porta: ${dbUrl.port}`, 'blue');
  log(`   Database: ${dbUrl.pathname.slice(1)}`, 'blue');
  log(`   SSL: Habilitado`, 'blue');
  
  const supabaseUrl = new URL(process.env.VITE_SUPABASE_URL);
  log(`   Supabase: ${supabaseUrl.hostname}`, 'blue');

  logSuccess('\n🎉 Todos os testes passaram! Supabase configurado corretamente.');
  return true;
}

async function main() {
  try {
    const success = await testSupabaseConnection();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logError(`Erro inesperado: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testSupabaseConnection };