#!/usr/bin/env node

/**
 * Script de teste para verificar os novos limites de rate limiting
 * Este script testa os endpoints de comentários para garantir que os novos limites estão funcionando
 */

const https = require('https');
const http = require('http');

// Configuração do teste
const config = {
  baseUrl: process.env.API_URL || 'https://barber-backend-spm8.onrender.com',
  endpoints: {
    comments: '/api/comments?status=pending',
    commentsAll: '/api/comments',
    security: '/api/security/report'
  },
  tests: {
    normalUsage: {
      requests: 10,
      interval: 2000, // 2 segundos entre requisições
      description: 'Uso normal - deve funcionar sem bloqueios'
    },
    burstTest: {
      requests: 25,
      interval: 100, // 100ms entre requisições
      description: 'Teste de rajada - pode gerar alguns bloqueios'
    },
    heavyLoad: {
      requests: 50,
      interval: 50, // 50ms entre requisições
      description: 'Carga pesada - deve gerar bloqueios'
    }
  }
};

// Função para fazer requisição HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.get(url, {
      timeout: 10000,
      ...options
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Função para executar um teste
async function runTest(testName, testConfig) {
  console.log(`\n🧪 Executando teste: ${testConfig.description}`);
  console.log(`📊 Configuração: ${testConfig.requests} requisições, intervalo de ${testConfig.interval}ms`);
  
  const results = {
    total: testConfig.requests,
    success: 0,
    rateLimited: 0,
    errors: 0,
    responses: []
  };
  
  const startTime = Date.now();
  
  for (let i = 0; i < testConfig.requests; i++) {
    try {
      const url = config.baseUrl + config.endpoints.comments;
      const response = await makeRequest(url);
      
      results.responses.push({
        request: i + 1,
        statusCode: response.statusCode,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        results.success++;
        process.stdout.write('✅');
      } else if (response.statusCode === 429) {
        results.rateLimited++;
        process.stdout.write('⏰');
      } else {
        results.errors++;
        process.stdout.write('❌');
      }
      
      // Aguardar intervalo antes da próxima requisição
      if (i < testConfig.requests - 1) {
        await new Promise(resolve => setTimeout(resolve, testConfig.interval));
      }
      
    } catch (error) {
      results.errors++;
      results.responses.push({
        request: i + 1,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      process.stdout.write('💥');
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`\n\n📈 Resultados do teste "${testName}":`);  
  console.log(`⏱️  Duração total: ${duration}ms`);
  console.log(`✅ Sucessos: ${results.success}/${results.total} (${((results.success/results.total)*100).toFixed(1)}%)`);
  console.log(`⏰ Rate Limited (429): ${results.rateLimited}/${results.total} (${((results.rateLimited/results.total)*100).toFixed(1)}%)`);
  console.log(`❌ Erros: ${results.errors}/${results.total} (${((results.errors/results.total)*100).toFixed(1)}%)`);
  
  return results;
}

// Função para testar endpoint de segurança (se disponível)
async function testSecurityEndpoint() {
  console.log('\n🔒 Testando endpoint de segurança...');
  
  try {
    const url = config.baseUrl + config.endpoints.security;
    const response = await makeRequest(url);
    
    if (response.statusCode === 401) {
      console.log('🔐 Endpoint de segurança protegido corretamente (401 - Unauthorized)');
    } else if (response.statusCode === 403) {
      console.log('🔐 Endpoint de segurança protegido corretamente (403 - Forbidden)');
    } else {
      console.log(`⚠️  Endpoint de segurança retornou: ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao testar endpoint de segurança: ${error.message}`);
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes de Rate Limiting');
  console.log(`🌐 URL base: ${config.baseUrl}`);
  console.log('\nLegenda:');
  console.log('✅ = Sucesso (200-299)');
  console.log('⏰ = Rate Limited (429)');
  console.log('❌ = Erro (outros códigos)');
  console.log('💥 = Erro de conexão');
  
  const allResults = {};
  
  // Executar todos os testes
  for (const [testName, testConfig] of Object.entries(config.tests)) {
    allResults[testName] = await runTest(testName, testConfig);
    
    // Aguardar entre testes para evitar interferência
    if (testName !== Object.keys(config.tests).pop()) {
      console.log('\n⏳ Aguardando 5 segundos antes do próximo teste...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Testar endpoint de segurança
  await testSecurityEndpoint();
  
  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL DOS TESTES');
  console.log('='.repeat(60));
  
  for (const [testName, results] of Object.entries(allResults)) {
    const successRate = ((results.success / results.total) * 100).toFixed(1);
    const rateLimitRate = ((results.rateLimited / results.total) * 100).toFixed(1);
    
    console.log(`\n${testName.toUpperCase()}:`);
    console.log(`  ✅ Taxa de sucesso: ${successRate}%`);
    console.log(`  ⏰ Taxa de rate limit: ${rateLimitRate}%`);
    
    // Análise dos resultados
    if (testName === 'normalUsage' && results.rateLimited > 0) {
      console.log(`  ⚠️  ATENÇÃO: Uso normal não deveria gerar rate limits!`);
    } else if (testName === 'normalUsage' && results.rateLimited === 0) {
      console.log(`  ✅ ÓTIMO: Uso normal funcionando perfeitamente!`);
    }
    
    if (testName === 'heavyLoad' && results.rateLimited === 0) {
      console.log(`  ⚠️  ATENÇÃO: Carga pesada deveria gerar alguns rate limits!`);
    } else if (testName === 'heavyLoad' && results.rateLimited > 0) {
      console.log(`  ✅ ÓTIMO: Rate limiting funcionando na carga pesada!`);
    }
  }
  
  console.log('\n🎯 CONCLUSÕES:');
  
  const normalUsage = allResults.normalUsage;
  const heavyLoad = allResults.heavyLoad;
  
  if (normalUsage.rateLimited === 0 && heavyLoad.rateLimited > 0) {
    console.log('✅ Sistema de rate limiting está funcionando corretamente!');
    console.log('   - Usuários normais não são bloqueados');
    console.log('   - Carga excessiva é limitada adequadamente');
  } else if (normalUsage.rateLimited > 0) {
    console.log('⚠️  Limites podem estar muito restritivos para uso normal');
    console.log('   - Considere aumentar os limites em config/rateLimits.js');
  } else if (heavyLoad.rateLimited === 0) {
    console.log('⚠️  Limites podem estar muito permissivos');
    console.log('   - Sistema pode não estar protegido contra ataques');
  }
  
  console.log('\n📝 Para ajustar os limites, edite: config/rateLimits.js');
  console.log('🔍 Para monitorar segurança, acesse: /api/security/report (requer admin)');
  console.log('\n✨ Teste concluído!');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  });
}

module.exports = { makeRequest, runTest, main };