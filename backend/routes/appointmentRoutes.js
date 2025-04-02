const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// Rota para listar agendamentos
router.get('/', async (req, res) => {
  try {
    const { barberId } = req.query;
    const appointments = await Appointment.findAll({
      where: barberId ? { barberId } : {},
      order: [['date', 'DESC'], ['time', 'ASC']]
    });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Rota para criar agendamentos
router.post('/', async (req, res) => {
  try {
    const appointment = await Appointment.create({
      id: Date.now().toString(),
      ...req.body
    });
    
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Atualizar status do agendamento
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    await appointment.update({ status });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Excluir agendamento
router.delete('/:id', async (req, res) => {
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