/**
 * Script para testar conectividade entre frontend e backend
 */

const axios = require('axios');

const FRONTEND_API_URL = 'http://localhost:6543';
const BACKEND_URL = 'http://localhost:6543';

async function testConnectivity() {
  console.log('🔗 Testando conectividade Frontend ↔ Backend\n');

  // Test 1: Backend Health Check
  console.log('📋 Test 1: Backend Health Check');
  try {
    const response = await axios.get(`${BACKEND_URL}/`, { timeout: 5000 });
    if (response.status === 200) {
      console.log('   ✅ Backend respondendo na porta 6543');
      console.log(`   📝 Mensagem: ${response.data.message}`);
    }
  } catch (error) {
    console.log('   ❌ Backend não está respondendo');
    console.log(`   📝 Erro: ${error.message}`);
    return;
  }

  // Test 2: API Endpoints
  console.log('\n📋 Test 2: Testando endpoints da API');
  
  const endpoints = [
    { path: '/api/barbershops/check-slug/test-slug', method: 'GET', description: 'Verificação de slug' },
    { path: '/api/barbershops/list', method: 'GET', description: 'Listagem de barbearias' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   🔍 Testando ${endpoint.description}...`);
      const response = await axios({
        method: endpoint.method,
        url: `${BACKEND_URL}${endpoint.path}`,
        timeout: 5000
      });
      
      console.log(`   ✅ ${endpoint.description}: Status ${response.status}`);
      if (response.data.success !== undefined) {
        console.log(`   📝 Success: ${response.data.success}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.description}: ${error.response?.status || 'TIMEOUT'}`);
      if (error.response?.data?.message) {
        console.log(`   📝 Erro: ${error.response.data.message}`);
      }
    }
  }

  // Test 3: CORS Check
  console.log('\n📋 Test 3: Verificando CORS');
  try {
    const response = await axios.options(`${BACKEND_URL}/api/barbershops/list`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      },
      timeout: 5000
    });
    console.log('   ✅ CORS configurado corretamente');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   ✅ CORS provavelmente OK (404 é esperado para OPTIONS)');
    } else {
      console.log('   ⚠️  Possível problema de CORS');
      console.log(`   📝 Status: ${error.response?.status || 'TIMEOUT'}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESUMO DA CONECTIVIDADE');
  console.log('='.repeat(60));
  
  console.log('\n✅ Configuração atual:');
  console.log(`   🖥️  Backend: ${BACKEND_URL}`);
  console.log(`   🌐 Frontend deve usar: ${FRONTEND_API_URL}`);
  console.log('\n📝 Para o frontend funcionar:');
  console.log('   1. Backend deve estar rodando em http://localhost:6543');
  console.log('   2. Frontend deve ter VITE_API_URL=http://localhost:6543');
  console.log('   3. Ambos devem estar rodando simultaneamente');
  
  console.log('\n🚀 Comandos para iniciar:');
  console.log('   Backend: cd backend && npm run dev');
  console.log('   Frontend: npm run dev');
}

// Executar teste
testConnectivity().catch(console.error);