const express = require('express');
const authController = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User'); // Adicionar esta importação no topo

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/validate-token', authController.validateToken);

// Protected routes
router.post('/register', protect, admin, authController.register);

// rota para verificar a senha do admin
router.post('/verify-admin', async (req, res) => {
  try {
    const { password } = req.body;

    const admin = await User.findOne({
      where: {
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador não encontrado'
      });
    }

    // Verificar a senha
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    res.json({
      success: true,
      message: 'Senha verificada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar senha',
      error: error.message
    });
  }
});

// Rota para listar todos os usuários (apenas para depuração)
router.get('/users', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'name', 'createdAt', 'updatedAt']
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

module.exports = router;
