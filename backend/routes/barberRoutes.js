const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');
const sequelize = require('../models/database');
const { limitRepeatedRequests } = require('../middleware/requestLimitMiddleware');
const { checkBarberLimits } = require('../middleware/planLimitsMiddleware');

// Configurações otimizadas para diferentes tipos de operações
const readLimiter = limitRepeatedRequests({
  maxRepeatedRequests: 150, // Limite alto para consulta de barbeiros
  burstLimit: 30, // Permite rajadas para carregamento de listas
  windowMs: 60000,
  blockTimeMs: 45000, // Bloqueio curto para leitura
  gracePeriodMs: 1500,
  message: {
    success: false,
    message: 'Muitas consultas de barbeiros. Aguarde um momento.'
  }
});

const writeLimiter = limitRepeatedRequests({
  maxRepeatedRequests: 15, // Limite moderado para operações de barbeiros
  burstLimit: 5,
  windowMs: 60000,
  blockTimeMs: 150000, // Bloqueio maior para modificações
  gracePeriodMs: 4000,
  message: {
    success: false,
    message: 'Muitas operações de modificação. Aguarde antes de tentar novamente.'
  }
});

// Rota para listar todos os barbeiros com limitador otimizado para leitura
router.get('/', readLimiter, /** @param {import('express').Request} req @param {import('express').Response} res */ async (req, res) => {
  try {
    let whereClause = {};
    
    // Se há contexto de tenant, filtrar por barbearia
    if (req.tenant && req.tenant.barbershopId) {
      whereClause.barbershopId = req.tenant.barbershopId;
    }
    // Se não há tenant, buscar todos os barbeiros (modo público)

    // Buscar barbeiros com join nos usuários
    const barbers = await Barber.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          where: { role: ['barber', 'admin'] }, // Incluir admins que também podem ser barbeiros
          required: false
        }
      ]
    });
    
    // Mapear os barbeiros para incluir o username
    const barbersWithUsername = barbers.map(barber => ({
      id: barber.id,
      name: barber.name,
      username: barber.user ? barber.user.username : null,
      whatsapp: barber.whatsapp,
      pix: barber.pix
    }));
    
    res.json({
      success: true,
      data: barbersWithUsername
    });
  } catch (error) {
    console.error('Erro ao listar barbeiros:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rota para obter detalhes de um barbeiro específico com limitador para leitura
router.get('/:id', readLimiter, /** @param {import('express').Request} req @param {import('express').Response} res */ async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o contexto de tenant está disponível
    const barbershopId = req.tenant?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado'
      });
    }
    
    // Buscar barbeiro da barbearia específica com join no usuário
    const barber = await Barber.findOne({
      where: { 
        id: id,
        barbershopId 
      },
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'barber' },
          required: false
        }
      ]
    });
    
    // Log para debug
    console.log('Busca por barbeiro:', {
      idBuscado: id,
      barbeiro: barber ? 'Encontrado' : 'Não encontrado'
    });

    // Se encontrou o barbeiro, retornar os dados
    if (barber) {
      return res.json({
        success: true,
        data: {
          id: barber.id,
          name: barber.name,
          username: barber.user ? barber.user.username : null,
          whatsapp: barber.whatsapp,
          pix: barber.pix
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Barbeiro não encontrado'
    });

  } catch (error) {
    console.error('Erro ao buscar barbeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar barbeiro',
      error: error.message
    });
  }
});

// Rota para atualizar barbeiro com limitador para escrita
router.patch('/:id', writeLimiter, /** @param {import('express').Request} req @param {import('express').Response} res */ async (req, res) => {
  try {
    const { id } = req.params;

    console.log('ID recebido:', id);

    // Verificar se o contexto de tenant está disponível
    const barbershopId = req.tenant?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado'
      });
    }

    const { name, username, password, whatsapp, pix } = req.body;

    // Buscar barbeiro com join no usuário
    const barber = await Barber.findOne({
      where: { 
        id: id,
        barbershopId 
      },
      include: [
        {
          model: User,
          as: 'user',
          required: true
        }
      ]
    });

    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barbeiro não encontrado'
      });
    }

    const user = barber.user;

    // Verificar se o novo username já existe (se foi fornecido)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Nome de usuário já existe'
        });
      }
    }

    // Atualizar usuário
    const userUpdateData = {
      name: name || user.name,
      username: username || user.username
    };

    if (password) {
      userUpdateData.password = password;
    }

    await user.update(userUpdateData);

    // Atualizar barbeiro
    await barber.update({
      name: name || barber.name,
      whatsapp: whatsapp || barber.whatsapp,
      pix: pix || barber.pix
    });

    res.json({
      success: true,
      message: 'Barbeiro atualizado com sucesso',
      data: {
        id: barber.id,
        name: barber.name,
        username: user.username,
        whatsapp: barber.whatsapp,
        pix: barber.pix
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar barbeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar barbeiro'
    });
  }
});

// Rota para criar novo barbeiro com limitador para escrita e verificação de limites do plano
router.post('/', writeLimiter, checkBarberLimits, /** @param {import('express').Request} req @param {import('express').Response} res */ async (req, res) => {
  try {
    const { name, username, password, whatsapp, pix } = req.body;

    // Verificar se o contexto de tenant está disponível
    const barbershopId = req.tenant?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado'
      });
    }

    // Verificar se o username já existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário já existe'
      });
    }

    // Criar usuário
    const user = await User.create({
      username,
      password,
      name,
      role: 'barber',
      barbershopId
    });

    // Criar barbeiro com userId e barbershopId
    const barber = await Barber.create({
      name,
      whatsapp,
      pix,
      userId: user.id,
      barbershopId
    });

    res.status(201).json({
      success: true,
      data: {
        id: barber.id,
        name: barber.name,
        username: user.username,
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

// Rota para excluir barbeiro com limitador para escrita
router.delete('/:id', writeLimiter, /** @param {import('express').Request} req @param {import('express').Response} res */ async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o contexto de tenant está disponível
    const barbershopId = req.tenant?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado'
      });
    }

    // Buscar o barbeiro da barbearia específica com o usuário associado
    const barber = await Barber.findOne({
      where: { 
        id: id,
        barbershopId 
      },
      include: [
        {
          model: User,
          as: 'user',
          required: false
        }
      ]
    });
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

    // Excluir o usuário associado se existir
    if (barber.user) {
      await barber.user.destroy();
      console.log(`Usuário ${barber.user.name} excluído com sucesso`);
    }

    // Excluir o barbeiro
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