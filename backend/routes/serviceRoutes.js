const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');
const { limitRepeatedRequests } = require('../middleware/requestLimitMiddleware');

// Middleware para logar todas as requisições de serviços
const logServiceRequests = (req, res, next) => {
  const requestId = Date.now();
  const endpoint = req.originalUrl;
  const method = req.method;
  
  console.log(`[${new Date().toISOString()}] [SERVICE-ROUTE:${requestId}] ${method} ${endpoint} - INÍCIO`);
  
  // Capturar o momento em que a resposta é enviada
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] [SERVICE-ROUTE:${requestId}] ${method} ${endpoint} - FIM (status: ${res.statusCode})`);
    return originalSend.call(this, body);
  };
  
  next();
};

// Aplicar middleware de logging a todas as rotas
router.use(logServiceRequests);

// Configurações otimizadas para diferentes tipos de operações
const readLimiter = limitRepeatedRequests({
  maxRepeatedRequests: 300, // Limite muito alto para serviços (dados estáticos)
  burstLimit: 100, // Permite muitas rajadas para carregamento inicial
  windowMs: 60000,
  blockTimeMs: 30000, // Bloqueio muito curto para leitura de serviços
  gracePeriodMs: 1000, // Período mínimo entre requisições
  message: {
    success: false,
    message: 'Muitas consultas de serviços. Aguarde um momento.'
  }
});

const writeLimiter = limitRepeatedRequests({
  maxRepeatedRequests: 10, // Limite baixo para modificações de serviços
  burstLimit: 3,
  windowMs: 60000,
  blockTimeMs: 180000, // Bloqueio maior para operações administrativas
  gracePeriodMs: 5000,
  message: {
    success: false,
    message: 'Muitas operações administrativas. Aguarde antes de tentar novamente.'
  }
});

// Rotas públicas com limitador otimizado para leitura
router.get('/', readLimiter, serviceController.getAllServices);
router.get('/barber/:barberId', readLimiter, serviceController.getServicesByBarber);
router.get('/:id', readLimiter, serviceController.getServiceById);

// Rotas protegidas (requerem autenticação) com limitador para escrita
router.post('/', authMiddleware.protect, writeLimiter, serviceController.createService);
router.patch('/:id', authMiddleware.protect, writeLimiter, serviceController.updateService);
router.delete('/:id', authMiddleware.protect, writeLimiter, serviceController.deleteService);
router.post('/:id/barbers', authMiddleware.protect, writeLimiter, serviceController.associateBarbers);

module.exports = router;