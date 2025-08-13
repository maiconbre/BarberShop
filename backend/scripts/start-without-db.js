/**
 * Script para iniciar o servidor sem conectar ao banco de dados
 * Útil para testar endpoints que não dependem do banco
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env' });

const app = express();

// Importar configuração do CORS
const corsConfig = require('../config/cors');

// Configuração do CORS baseada no ambiente atual
app.use(cors(corsConfig));

// Middleware para processar JSON
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Middleware global para logar todas as requisições HTTP
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const requestId = Date.now();
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress;
  const method = req.method;
  const url = req.originalUrl;
  
  console.log(`[${new Date().toISOString()}] [HTTP:${requestId}] ${method} ${url} - INÍCIO - IP: ${ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    console.log(`[${new Date().toISOString()}] [HTTP:${requestId}] ${method} ${url} - FIM - Status: ${status} - Duração: ${duration}ms`);
  });
  
  next();
});

// Importar rotas mock que não dependem do banco
try {
  const barbershopRoutes = require('../routes/barbershopRoutes.mock');
  app.use('/api/barbershops', barbershopRoutes);
  console.log('✅ Rotas de barbearia (MOCK) carregadas');
} catch (error) {
  console.log('❌ Erro ao carregar rotas de barbearia:', error.message);
}

// Rota principal
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor de teste - Endpoints de Barbearia',
    description: 'Servidor rodando sem conexão com banco de dados para testes',
    version: '1.0.0',
    endpoints: {
      barbershops: {
        base: '/api/barbershops',
        routes: {
          'POST /register': 'Registrar nova barbearia (requer banco)',
          'GET /check-slug/:slug': 'Verificar disponibilidade de slug (requer banco)',
          'GET /current': 'Obter barbearia atual (requer banco e auth)',
          'GET /list': 'Listar barbearias (requer banco)'
        }
      }
    },
    note: 'Endpoints que requerem banco de dados retornarão erro até a conexão ser configurada'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro no servidor:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

const PORT = process.env.PORT || 6543;
const HOST = process.env.HOST || '0.0.0.0';

// Iniciar servidor sem banco de dados
const server = app.listen(PORT, HOST, () => {
  console.log('\n🚀 Servidor de teste iniciado!');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log('⚠️  ATENÇÃO: Rodando SEM conexão com banco de dados');
  console.log('📝 Para testar endpoints que não dependem do banco');
  console.log('\n✅ Endpoints disponíveis:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   POST http://localhost:${PORT}/api/barbershops/register (requer banco)`);
  console.log(`   GET  http://localhost:${PORT}/api/barbershops/check-slug/:slug (requer banco)`);
  console.log('\n💡 Para conectar ao banco, configure DATABASE_URL no .env');
});

// Tratamento de encerramento gracioso
process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

module.exports = app;