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
router.get('/', readLimiter, async (req, res) => {
  try {
    // Verificar se o contexto de tenant está disponível
    const barbershopId = req.tenant?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado'
      });
    }

    // Buscar barbeiros da barbearia específica
    const barbers = await Barber.findAll({
      where: { barbershopId }
    });
    
    // Buscar usuários com role 'barber' da mesma barbearia
    const barberIds = barbers.map(b => b.id);
    const users = await User.findAll({
      where: { 
        role: 'barber',
        id: barberIds
      }
    });
    
    // Mapear os barbeiros para incluir o username
    const barbersWithUsername = barbers.map(barber => {
      const user = users.find(u => u.id === barber.id);
      return {
        id: barber.id,
        name: barber.name,
        username: user ? user.username : null,
        whatsapp: barber.whatsapp,
        pix: barber.pix
      };
    });
    
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
router.get('/:id', readLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const formattedId = String(id).padStart(2, '0');
    
    // Verificar se o contexto de tenant está disponível
    const barbershopId = req.tenant?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado'
      });
    }
    
    // Buscar barbeiro da barbearia específica
    const barber = await Barber.findOne({
      where: { 
        id: formattedId,
        barbershopId 
      }
    });
    const user = await User.findByPk(formattedId);
    
    // Log para debug
    console.log('Busca por barbeiro:', {
      idBuscado: formattedId,
      barbeiro: barber ? 'Encontrado' : 'Não encontrado',
      usuario: user ? 'Encontrado' : 'Não encontrado'
    });

    // Se encontrou o barbeiro, retornar os dados
    if (barber) {
      return res.json({
        success: true,
        data: {
          id: barber.id,
          name: barber.name,
          username: user ? user.username : null,
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
router.patch('/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    // Garantir que o ID esteja no formato correto (com zero à esquerda se necessário)
    const formattedId = String(id).length === 1 ? `0${id}` : String(id);

    console.log('ID recebido:', id);
    console.log('ID formatado:', formattedId);

    // Verificar se o contexto de tenant está disponível
    const barbershopId = req.tenant?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado'
      });
    }

    const { name, username, password, whatsapp, pix } = req.body;

    // Verificar se o barbeiro existe na barbearia específica
    let barber = await Barber.findOne({
      where: { 
        id: formattedId,
        barbershopId 
      }
    });
    let user = await User.findByPk(formattedId);

    // Se não encontrar com o ID formatado, tentar buscar com o ID original
    if (!barber) {
      console.log('Barbeiro não encontrado com ID formatado, tentando com ID original');
      barber = await Barber.findOne({
        where: { 
          id: id,
          barbershopId 
        }
      });
    }

    if (!user) {
      console.log('Usuário não encontrado com ID formatado, tentando com ID original');
      user = await User.findByPk(id);
    }

    if (!barber || !user) {
      return res.status(404).json({
        success: false,
        message: 'Barbeiro não encontrado'
      });
    }

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
router.post('/', writeLimiter, checkBarberLimits, async (req, res) => {
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

    // Buscar o último ID de barbeiro da barbearia específica
    const lastBarber = await Barber.findOne({
      where: { barbershopId },
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

    // Criar barbeiro com barbershopId
    const barber = await Barber.create({
      id: newId,
      name,
      whatsapp,
      pix,
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
router.delete('/:id', writeLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const formattedId = String(id).length === 1 ? `0${id}` : String(id);

    // Verificar se o contexto de tenant está disponível
    const barbershopId = req.tenant?.barbershopId;
    if (!barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado'
      });
    }

    // Buscar o barbeiro da barbearia específica
    const barber = await Barber.findOne({
      where: { 
        id: formattedId,
        barbershopId 
      }
    });
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barbeiro não encontrado'
      });
    }

    // Excluir todos os agendamentos associados ao barbeiro
    await Appointment.destroy({
      where: { barberId: formattedId }
    });

    // Buscar e excluir o usuário pelo ID
    const user = await User.findByPk(formattedId);

    if (user) {
      await user.destroy();
      console.log(`Usuário ${user.name} excluído com sucesso`);
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