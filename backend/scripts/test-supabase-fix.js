/**
 * Script alternativo para testar conexão com Supabase
 * Inclui fixes específicos para erro SCRAM-SERVER-FINAL-MESSAGE
 */

require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const { Sequelize } = require('sequelize');

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

async function testWithPgClient() {
  logInfo('Testando com cliente pg nativo...');
  
  const dbUrl = new URL(process.env.DATABASE_URL);
  
  const client = new Client({
    host: dbUrl.hostname,
    port: dbUrl.port,
    database: dbUrl.pathname.slice(1),
    user: dbUrl.username,
    password: dbUrl.password,
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    application_name: 'barbershop_pg_test',
    statement_timeout: 30000,
    query_timeout: 30000,
    connectionTimeoutMillis: 30000,
    idle_in_transaction_session_timeout: 30000
  });

  try {
    await client.connect();
    logSuccess('Conexão pg estabelecida com sucesso');
    
    const result = await client.query('SELECT version();');
    logSuccess(`PostgreSQL Version: ${result.rows[0].version}`);
    
    // Testar query simples
    const timeResult = await client.query('SELECT NOW() as current_time;');
    logSuccess(`Hora do servidor: ${timeResult.rows[0].current_time}`);
    
    await client.end();
    return true;
    
  } catch (error) {
    logError(`Erro na conexão pg: ${error.message}`);
    if (error.code) {
      logError(`Código do erro: ${error.code}`);
    }
    return false;
  }
}

async function testWithSequelizeAlternative() {
  logInfo('Testando com Sequelize (configuração alternativa)...');
  
  const dbUrl = new URL(process.env.DATABASE_URL);
  
  const sequelize = new Sequelize({
    host: dbUrl.hostname,
    port: dbUrl.port,
    database: dbUrl.pathname.slice(1),
    username: dbUrl.username,
    password: dbUrl.password,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      application_name: 'barbershop_sequelize_alt',
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
      connect_timeout: 30
    },
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false,
    retry: {
      max: 3,
      match: [/SequelizeConnectionError/, /SCRAM/],
      backoffBase: 1000,
      backoffExponent: 2
    }
  });

  try {
    await sequelize.authenticate();
    logSuccess('Conexão Sequelize alternativa estabelecida');
    
    const [results] = await sequelize.query('SELECT version();');
    logSuccess(`PostgreSQL Version: ${results[0].version}`);
    
    await sequelize.close();
    return true;
    
  } catch (error) {
    logError(`Erro na conexão Sequelize alternativa: ${error.message}`);
    return false;
  }
}

async function testConnectionString() {
  logInfo('Testando string de conexão...');
  
  const dbUrl = process.env.DATABASE_URL;
  logInfo(`URL: ${dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')}`);
  
  // Verificar formato da URL
  try {
    const url = new URL(dbUrl);
    logSuccess(`Host: ${url.hostname}`);
    logSuccess(`Porta: ${url.port}`);
    logSuccess(`Database: ${url.pathname.slice(1)}`);
    logSuccess(`Usuário: ${url.username}`);
    logSuccess(`Senha: ${url.password ? '***configurada***' : 'NÃO CONFIGURADA'}`);
    return true;
  } catch (error) {
    logError(`URL inválida: ${error.message}`);
    return false;
  }
}

async function main() {
  log('\n🔧 TESTE ALTERNATIVO DE CONEXÃO SUPABASE', 'bold');
  log('=' * 50, 'blue');
  
  let success = true;
  
  // 1. Testar string de conexão
  logInfo('\n1. Verificando string de conexão...');
  success = await testConnectionString() && success;
  
  // 2. Testar com cliente pg nativo
  logInfo('\n2. Testando com cliente pg nativo...');
  success = await testWithPgClient() && success;
  
  // 3. Testar com Sequelize alternativo
  logInfo('\n3. Testando com Sequelize alternativo...');
  success = await testWithSequelizeAlternative() && success;
  
  if (success) {
    logSuccess('\n🎉 Todos os testes passaram! Conexão funcionando.');
  } else {
    logError('\n❌ Alguns testes falharam. Verificar configurações.');
    
    logInfo('\n💡 Dicas para resolver:');
    log('   1. Verificar se a URL do DATABASE_URL está correta', 'yellow');
    log('   2. Verificar se o usuário/senha estão corretos', 'yellow');
    log('   3. Verificar se o Supabase está online', 'yellow');
    log('   4. Tentar regenerar a senha no painel do Supabase', 'yellow');
    log('   5. Verificar se o IP está na whitelist (se aplicável)', 'yellow');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    logError(`Erro inesperado: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { testWithPgClient, testWithSequelizeAlternative };