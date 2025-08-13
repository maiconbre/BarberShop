/**
 * Rotas mock para barbearias - funcionam sem banco de dados
 */

const express = require('express');
const router = express.Router();

// Usar controller mock em vez do controller real
const barbershopController = require('../controllers/barbershopController.mock');

/**
 * Rotas mock para gerenciamento de barbearias
 */

// Rotas públicas (não requerem autenticação nem tenant)
router.post('/register', barbershopController.registerBarbershop);
router.get('/check-slug/:slug', barbershopController.checkSlugAvailability);

// Rota de desenvolvimento
router.get('/list', barbershopController.listBarbershops);

// Rotas que requerem autenticação (mock - retornam erro)
router.get('/current', barbershopController.getCurrentBarbershop);
router.put('/current', barbershopController.updateCurrentBarbershop);

module.exports = router;