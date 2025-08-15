const express = require('express');
const router = express.Router();
const barbershopController = require('../controllers/barbershopController');
const { protect } = require('../middleware/authMiddleware');
const { detectTenant, requireTenant, validateTenantAccess } = require('../middleware/tenantMiddleware');

/**
 * Rotas para gerenciamento de barbearias (tenants)
 */

// Rotas públicas (não requerem autenticação nem tenant)
router.post('/verify-email', barbershopController.initiateEmailVerification);
router.post('/verify-code', barbershopController.verifyEmailCode);
router.post('/register', barbershopController.registerBarbershop);
router.get('/check-slug/:slug', barbershopController.checkSlugAvailability);

// Rota de desenvolvimento (apenas em desenvolvimento)
router.get('/list', barbershopController.listBarbershops);

// Rota para obter barbearia do usuário autenticado (sem tenant context)
router.get('/my-barbershop', protect, barbershopController.getMyBarbershop);

// Rotas que requerem tenant context
router.use('/current', detectTenant);
router.use('/current', requireTenant);

// Rotas que requerem autenticação e validação de tenant
router.use('/current', protect);
router.use('/current', validateTenantAccess);

// Rotas protegidas para gerenciar barbearia atual
router.get('/current', barbershopController.getCurrentBarbershop);
router.put('/current', barbershopController.updateCurrentBarbershop);

module.exports = router;