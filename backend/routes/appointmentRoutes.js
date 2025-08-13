const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { limitRepeatedRequests } = require('../middleware/requestLimitMiddleware');

// Configurações otimizadas para diferentes tipos de operações
const readLimiter = limitRepeatedRequests({
  maxRepeatedRequests: 200, // Limite alto para leitura
  burstLimit: 50, // Permite rajadas para componentes que fazem múltiplas chamadas
  windowMs: 60000, // Janela de 1 minuto
  blockTimeMs: 60000, // Bloqueio curto de 1 minuto
  gracePeriodMs: 2000, // Período de graça de 2s entre requisições
  message: {
    success: false,
    message: 'Muitas consultas em pouco tempo. Aguarde um momento.'
  }
});

const writeLimiter = limitRepeatedRequests({
  maxRepeatedRequests: 20, // Limite menor para operações de escrita
  burstLimit: 5, // Rajadas menores para escrita
  windowMs: 60000,
  blockTimeMs: 120000, // Bloqueio maior para escrita
  gracePeriodMs: 3000, // Período maior entre escritas
  message: {
    success: false,
    message: 'Muitas operações de modificação. Aguarde antes de tentar novamente.'
  }
});

// Rota para listar agendamentos com limitador otimizado para leitura
router.get('/', readLimiter, async (req, res) => {
  try {
    const { barberId } = req.query;
    
    // Build where clause with tenant context if available
    const whereClause = {};
    
    // Add tenant filter if available
    if (req.tenant && req.tenant.barbershopId) {
      whereClause.barbershopId = req.tenant.barbershopId;
    }
    
    // Add barberId filter if provided
    if (barberId) {
      whereClause.barberId = barberId;
    }
    
    const appointments = await Appointment.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['time', 'ASC']]
    });

    res.json(appointments); // Return array directly for compatibility
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Rota para criar agendamentos com limitador para escrita
router.post('/', writeLimiter, async (req, res) => {
  try {
    const appointmentData = {
      id: Date.now().toString(),
      ...req.body
    };
    
    // Add tenant context if available
    if (req.tenant && req.tenant.barbershopId) {
      appointmentData.barbershopId = req.tenant.barbershopId;
    }
    
    const appointment = await Appointment.create(appointmentData);
    
    res.status(201).json(appointment); // Return appointment directly for compatibility
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Atualizar status do agendamento com limitador para escrita
router.patch('/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Build where clause with tenant context
    const whereClause = { id };
    if (req.tenant && req.tenant.barbershopId) {
      whereClause.barbershopId = req.tenant.barbershopId;
    }
    
    const appointment = await Appointment.findOne({ where: whereClause });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    await appointment.update({ status });
    res.json(appointment); // Return appointment directly for compatibility
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Excluir agendamento com limitador para escrita
router.delete('/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    await appointment.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;