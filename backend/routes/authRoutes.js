const express = require('express');
const authController = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const { limitRepeatedRequests } = require('../middleware/requestLimitMiddleware');
const User = require('../models/User'); // Adicionar esta importação no topo

const router = express.Router();

// Configuração do limitador de chamadas repetidas para autenticação
// Mais restritivo para rotas de autenticação (apenas 2 tentativas)
const authLimiter = limitRepeatedRequests({
  maxRepeatedRequests: 2, // Limita a 2 chamadas idênticas
  blockTimeMs: 600000, // Bloqueia por 10 minutos (600000ms)
  message: {
    success: false,
    message: 'Muitas tentativas de autenticação. Esta operação está temporariamente bloqueada.'
  }
});

// Public routes com limitador
router.post('/login', authLimiter, authController.login);
router.post('/validate-token', authLimiter, authController.validateToken);
router.post('/refresh-token', authLimiter, authController.refreshToken);

// Protected routes com limitador
router.post('/register', protect, admin, authLimiter, authController.register);

// rota para verificar a senha do admin com limitador
router.post('/verify-admin', authLimiter, async (req, res) => {
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

// Rota para listar todos os usuários (apenas para depuração) com limitador
router.get('/users', authLimiter, async (req, res) => {
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
