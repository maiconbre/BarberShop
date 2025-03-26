const express = require('express');
const router = express.Router();
const BarberSchedule = require('../models/BarberSchedule');
const { protect, admin, barber } = require('../middleware/authMiddleware');

// Rota para obter configurações de horários de um barbeiro específico
router.get('/:barberId', protect, async (req, res) => {
  try {
    const { barberId } = req.params;
    
    // Verificar permissões: apenas o próprio barbeiro ou um admin pode ver as configurações
    if (req.user.role !== 'admin' && req.user.id !== barberId) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a visualizar configurações de outro barbeiro'
      });
    }

    // Buscar configurações de horários do barbeiro
    const schedules = await BarberSchedule.findAll({
      where: { barberId },
      order: [['date', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Erro ao buscar configurações de horários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações de horários'
    });
  }
});

// Rota para salvar configurações de horários de um barbeiro
router.post('/:barberId', protect, async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date, timeSlots } = req.body;
    
    // Verificar permissões: apenas o próprio barbeiro ou um admin pode modificar as configurações
    if (req.user.role !== 'admin' && req.user.id !== barberId) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar configurações de outro barbeiro'
      });
    }

    // Verificar se já existe uma configuração para esta data
    let schedule = await BarberSchedule.findOne({
      where: { barberId, date }
    });

    if (schedule) {
      // Atualizar configuração existente
      schedule.timeSlots = timeSlots;
      await schedule.save();
    } else {
      // Criar nova configuração
      schedule = await BarberSchedule.create({
        barberId,
        date,
        timeSlots
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Erro ao salvar configurações de horários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configurações de horários'
    });
  }
});

// Rota para salvar múltiplas configurações de horários de um barbeiro
router.post('/:barberId/batch', protect, async (req, res) => {
  try {
    const { barberId } = req.params;
    const { schedules } = req.body;
    
    // Verificar permissões: apenas o próprio barbeiro ou um admin pode modificar as configurações
    if (req.user.role !== 'admin' && req.user.id !== barberId) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar configurações de outro barbeiro'
      });
    }

    const results = [];

    // Processar cada configuração de horário
    for (const schedule of schedules) {
      const { date, timeSlots } = schedule;
      
      // Verificar se já existe uma configuração para esta data
      let existingSchedule = await BarberSchedule.findOne({
        where: { barberId, date }
      });

      if (existingSchedule) {
        // Atualizar configuração existente
        existingSchedule.timeSlots = timeSlots;
        await existingSchedule.save();
        results.push(existingSchedule);
      } else {
        // Criar nova configuração
        const newSchedule = await BarberSchedule.create({
          barberId,
          date,
          timeSlots
        });
        results.push(newSchedule);
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Erro ao salvar configurações de horários em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar configurações de horários em lote'
    });
  }
});

module.exports = router;