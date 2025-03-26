const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Barber = require('../models/Barber');

// Rota para listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id','username','role', 'name', 'password']
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários'
    });
  }
});

// Endpoint para alterar senha
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body;

    // Busca o usuário no banco de dados
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verifica se a senha atual está correta
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Atualiza a senha
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
});

// Rota para obter usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Garantir que o ID esteja no formato correto (com zero à esquerda se necessário)
    const formattedId = String(id).length === 1 ? `0${id}` : String(id);
    
    const user = await User.findByPk(formattedId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário'
    });
  }
});

// Rota para atualizar usuário
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Garantir que o ID esteja no formato correto (com zero à esquerda se necessário)
    const formattedId = String(id).length === 1 ? `0${id}` : String(id);
    
    const { name, username, password } = req.body;

    // Verificar se o usuário existe
    const user = await User.findByPk(formattedId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
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

    // Se for um barbeiro, também atualizar os dados do barbeiro
    let barberData = null;
    if (user.role === 'barber') {
      const barber = await Barber.findByPk(formattedId);
      if (barber) {
        const { whatsapp, pix } = req.body;
        await barber.update({
          name: name || barber.name,
          whatsapp: whatsapp || barber.whatsapp,
          pix: pix || barber.pix
        });
        barberData = {
          whatsapp: barber.whatsapp,
          pix: barber.pix
        };
      }
    }

    const responseData = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    };

    if (barberData) {
      responseData.whatsapp = barberData.whatsapp;
      responseData.pix = barberData.pix;
    }

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: responseData
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário'
    });
  }
});

module.exports = router;