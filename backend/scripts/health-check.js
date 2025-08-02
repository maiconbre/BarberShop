/**
 * Script de verificação de saúde da aplicação
 * Verifica se todos os componentes estão funcionando corretamente
 */

const http = require('http');
const https = require('https');
require('dotenv').config();

// Configurações
const config = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 8000,
  timeout: 10000, // 10 segundos
  isProduction: process.env.NODE_ENV === 'production'
};

// Função para fazer requisição HTTP/HTTPS
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https://') ? https : http;
    const startTime = Date.now();
    
    const req = lib.get(url, (res) => {
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
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Timeout após ${timeout}ms`));
    });
  });
}

// Função para verificar a saúde da API
async function checkAPIHealth() {
  console.log('🔍 Verificando saúde da API...');
  
  try {
    const baseUrl = config.isProduction 
      ? process.env.API_URL || `https://barber-backend-api.onrender.com`
      : `http://${config.host}:${config.port}`;
    
    console.log(`📡 Testando: ${baseUrl}`);
    
    // Teste 1: Endpoint principal
    console.log('\n1️⃣ Testando endpoint principal (/)...');
    const mainResponse = await makeRequest(`${baseUrl}/`, config.timeout);
    
    if (mainResponse.statusCode === 200) {
      console.log(`✅ Endpoint principal OK (${mainResponse.responseTime}ms)`);
    } else {
      console.log(`❌ Endpoint principal falhou: ${mainResponse.statusCode}`);
      return false;
    }
    
    // Teste 2: Endpoint de serviços
    console.log('\n2️⃣ Testando endpoint de serviços (/api/services)...');
    const servicesResponse = await makeRequest(`${baseUrl}/api/services`, config.timeout);
    
    if (servicesResponse.statusCode === 200) {
      console.log(`✅ Endpoint de serviços OK (${servicesResponse.responseTime}ms)`);
    } else {
      console.log(`❌ Endpoint de serviços falhou: ${servicesResponse.statusCode}`);
      return false;
    }
    
    // Teste 3: Endpoint de barbeiros
    console.log('\n3️⃣ Testando endpoint de barbeiros (/api/barbers)...');
    const barbersResponse = await makeRequest(`${baseUrl}/api/barbers`, config.timeout);
    
    if (barbersResponse.statusCode === 200) {
      console.log(`✅ Endpoint de barbeiros OK (${barbersResponse.responseTime}ms)`);
    } else {
      console.log(`❌ Endpoint de barbeiros falhou: ${barbersResponse.statusCode}`);
      return false;
    }
    
    // Teste 4: Verificar headers de segurança
    console.log('\n4️⃣ Verificando headers de segurança...');
    const headers = mainResponse.headers;
    
    if (headers['access-control-allow-credentials']) {
      console.log('✅ CORS configurado corretamente');
    } else {
      console.log('⚠️ Headers CORS podem estar ausentes');
    }
    
    // Resumo
    console.log('\n📊 Resumo da verificação:');
    console.log(`🌐 URL Base: ${baseUrl}`);
    console.log(`⏱️ Tempo médio de resposta: ${Math.round((mainResponse.responseTime + servicesResponse.responseTime + barbersResponse.responseTime) / 3)}ms`);
    console.log(`🔒 Ambiente: ${config.isProduction ? 'Produção' : 'Desenvolvimento'}`);
    
    return true;
    
  } catch (error) {
    console.log(`\n❌ Erro na verificação de saúde: ${error.message}`);
    return false;
  }
}

// Função para verificar variáveis de ambiente
function checkEnvironmentVariables() {
  console.log('\n🔧 Verificando variáveis de ambiente...');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET'
  ];
  
  const optionalVars = [
    'PORT',
    'HOST',
    'NODE_ENV',
    'JWT_EXPIRES_IN',
    'REFRESH_TOKEN_EXPIRES_IN'
  ];
  
  let allRequired = true;
  
  // Verificar variáveis obrigatórias
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configurado`);
    } else {
      console.log(`❌ ${varName}: AUSENTE (obrigatório)`);
      allRequired = false;
    }
  });
  
  // Verificar variáveis opcionais
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`⚠️ ${varName}: Usando valor padrão`);
    }
  });
  
  return allRequired;
}

// Função principal
async function main() {
  console.log('🏥 VERIFICAÇÃO DE SAÚDE - BARBER BACKEND API');
  console.log('=' .repeat(50));
  
  const envCheck = checkEnvironmentVariables();
  const apiCheck = await checkAPIHealth();
  
  console.log('\n' + '=' .repeat(50));
  
  if (envCheck && apiCheck) {
    console.log('🎉 TODAS AS VERIFICAÇÕES PASSARAM!');
    console.log('✅ A aplicação está funcionando corretamente.');
    process.exit(0);
  } else {
    console.log('🚨 ALGUMAS VERIFICAÇÕES FALHARAM!');
    if (!envCheck) {
      console.log('❌ Variáveis de ambiente ausentes');
    }
    if (!apiCheck) {
      console.log('❌ API não está respondendo corretamente');
    }
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro inesperado:', error);
    process.exit(1);
  });
}

module.exports = {
  checkAPIHealth,
  checkEnvironmentVariables
};