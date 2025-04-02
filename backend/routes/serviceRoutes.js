const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas públicas
router.get('/', serviceController.getAllServices);
router.get('/barber/:barberId', serviceController.getServicesByBarber);
router.get('/:id', serviceController.getServiceById);

// Rotas protegidas (requerem autenticação)
router.post('/', authMiddleware.protect, serviceController.createService);
router.patch('/:id', authMiddleware.protect, serviceController.updateService);
router.delete('/:id', authMiddleware.protect, serviceController.deleteService);
router.post('/:id/barbers', authMiddleware.protect, serviceController.associateBarbers);

module.exports = router;