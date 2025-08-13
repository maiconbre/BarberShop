/**
 * Script para testar se o servidor inicia corretamente
 * Verifica se todas as rotas estão carregando sem erros
 */

console.log('🚀 Testando inicialização do servidor...\n');

try {
  // Testar se os módulos principais carregam sem erro
  console.log('📋 Test 1: Carregando módulos principais');
  
  // Testar carregamento do servidor
  console.log('   - Carregando express...');
  const express = require('express');
  console.log('   ✅ Express carregado');
  
  console.log('   - Carregando cors...');
  const cors = require('cors');
  console.log('   ✅ CORS carregado');
  
  console.log('   - Carregando dotenv...');
  require('dotenv').config({ path: '.env' });
  console.log('   ✅ Dotenv carregado');
  
  // Testar carregamento das rotas
  console.log('\n📋 Test 2: Carregando rotas');
  
  console.log('   - Carregando authRoutes...');
  const authRoutes = require('../routes/authRoutes');
  console.log('   ✅ authRoutes carregado');
  
  console.log('   - Carregando barbershopRoutes...');
  const barbershopRoutes = require('../routes/barbershopRoutes');
  console.log('   ✅ barbershopRoutes carregado');
  
  console.log('   - Carregando qrCodeRoutes...');
  const qrCodeRoutes = require('../routes/qrCodeRoutes');
  console.log('   ✅ qrCodeRoutes carregado');
  
  // Testar carregamento dos controllers
  console.log('\n📋 Test 3: Carregando controllers');
  
  console.log('   - Carregando authController...');
  const authController = require('../controllers/authController');
  console.log('   ✅ authController carregado');
  
  console.log('   - Carregando barbershopController...');
  const barbershopController = require('../controllers/barbershopController');
  console.log('   ✅ barbershopController carregado');
  
  // Testar carregamento dos middlewares
  console.log('\n📋 Test 4: Carregando middlewares');
  
  console.log('   - Carregando tenantMiddleware...');
  const tenantMiddleware = require('../middleware/tenantMiddleware');
  console.log('   ✅ tenantMiddleware carregado');
  
  console.log('   - Carregando authMiddleware...');
  const authMiddleware = require('../middleware/authMiddleware');
  console.log('   ✅ authMiddleware carregado');
  
  // Testar carregamento dos modelos (sem conectar ao banco)
  console.log('\n📋 Test 5: Carregando modelos');
  
  console.log('   - Carregando Barbershop model...');
  const Barbershop = require('../models/Barbershop');
  console.log('   ✅ Barbershop model carregado');
  
  console.log('   - Carregando User model...');
  const User = require('../models/User');
  console.log('   ✅ User model carregado');
  
  // Testar configurações
  console.log('\n📋 Test 6: Verificando configurações');
  
  console.log('   - NODE_ENV:', process.env.NODE_ENV || 'não definido');
  console.log('   - PORT:', process.env.PORT || 'não definido');
  console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? 'configurado' : 'não configurado');
  console.log('   - SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'configurado' : 'não configurado');
  console.log('   - DATABASE_URL:', process.env.DATABASE_URL ? 'configurado' : 'não configurado');
  
  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO DOS TESTES');
  console.log('='.repeat(60));
  
  console.log('\n✅ Todos os módulos carregaram com sucesso!');
  console.log('\n📋 Componentes testados:');
  console.log('   ✅ Express e middlewares básicos');
  console.log('   ✅ Rotas (auth, barbershop, qrCode)');
  console.log('   ✅ Controllers (auth, barbershop)');
  console.log('   ✅ Middlewares (tenant, auth)');
  console.log('   ✅ Modelos (Barbershop, User)');
  console.log('   ✅ Configurações de ambiente');
  
  console.log('\n🎯 Servidor pronto para inicialização!');
  console.log('\n📝 Para iniciar o servidor:');
  console.log('   npm run dev (desenvolvimento)');
  console.log('   npm start (produção)');
  
  console.log('\n💡 Próximos passos:');
  console.log('   1. Configurar banco de dados PostgreSQL');
  console.log('   2. Executar npm run seed:reset');
  console.log('   3. Testar endpoints de barbearia');
  
} catch (error) {
  console.error('\n❌ Erro durante o teste de inicialização:');
  console.error('Módulo:', error.message);
  console.error('Stack:', error.stack);
  
  console.log('\n🔧 Possíveis soluções:');
  console.log('   1. Verificar se todas as dependências estão instaladas: npm install');
  console.log('   2. Verificar se o arquivo .env está configurado corretamente');
  console.log('   3. Verificar se não há erros de sintaxe nos arquivos');
  
  process.exit(1);
}

console.log('\n✨ Teste de inicialização concluído com sucesso!');
process.exit(0);