const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');
const { Op } = require('sequelize');

// Rota para criar novo barbeiro
router.post('/', async (req, res) => {
  try {
    const { name, username, password, whatsapp, pix } = req.body;

    // Verificar se o username já existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário já existe'
      });
    }

    // Buscar o último ID de barbeiro
    const lastBarber = await Barber.findOne({
      order: [['id', 'DESC']]
    });

    // Gerar novo ID sequencial
    const newId = lastBarber ? 
      String(parseInt(lastBarber.id) + 1).padStart(2, '0') : 
      '01';

    // Criar usuário
    const user = await User.create({
      id: newId,
      username,
      password,
      name,
      role: 'barber'
    });

    // Criar barbeiro
    const barber = await Barber.create({
      id: newId,
      name,
      whatsapp,
      pix
    });

    res.status(201).json({
      success: true,
      data: {
        id: barber.id,
        name: barber.name,
        whatsapp: barber.whatsapp,
        pix: barber.pix
      }
    });
  } catch (error) {
    console.error('Erro ao criar barbeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar barbeiro'
    });
  }
});

// Rota para excluir barbeiro
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Excluir o barbeiro
    const barber = await Barber.findByPk(id);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barbeiro não encontrado'
      });
    }

    // Excluir todos os agendamentos associados ao barbeiro
    await Appointment.destroy({
      where: { barberId: id }
    });

    // Excluir o usuário associado
    const user = await User.findByPk(id);
    if (user) {
      await user.destroy();
    }

    await barber.destroy();

    res.json({
      success: true,
      message: 'Barbeiro e seus agendamentos foram excluídos com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir barbeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir barbeiro'
    });
  }
});

module.exports = router;