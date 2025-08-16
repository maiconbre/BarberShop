const User = require('../models/User');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// Helper function to generate JWT token
/**
 * @param {any} user
 * @returns {string}
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

// Helper function to generate refresh token
/**
 * @param {any} user
 * @returns {string}
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );
};

// Login controller
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.login = async (req, res) => {
  try {
    console.log('Corpo da requisição recebido:', req.body);
    
    // Verificar se o corpo da requisição contém username e password
    // Aceita {username, password} 
    const username = req.body.username ;
    const password = req.body.password;
    
    if (!username || !password) {
      console.log('Credenciais incompletas:', { username, password });
      return res.status(400).json({
        success: false,
        message: 'User e senha são obrigatórios'
      });
    }
    
    console.log('Tentativa de login com:', { username });
    
    // Buscar usuário pelo username/
    const user = await User.findOne({
      where: {
        username: username  // Busca pelo campo username usando o valor de 
      }
    });
    
    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');
    
    if (!user) {
      console.log('Usuário não encontrado para:', username);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isMatch = await user.comparePassword(password);
    console.log('Senha corresponde:', isMatch ? 'Sim' : 'Não');
    
    if (!isMatch) {
      console.log('Senha incorreta para usuário:', username);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Retornar dados do usuário e tokens (excluindo senha)
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    };

    console.log('Login bem-sucedido para usuário:', username);
    
    res.json({
      success: true,
      data: {
        user: userData,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// Refresh token controller
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token é obrigatório'
      });
    }
    
    // Verificar refresh token
    jwt.verify(refreshToken, jwtConfig.refreshSecret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido ou expirado'
        });
      }
      
      try {
        // Buscar usuário pelo ID decodificado
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        
        // Gerar novo token de acesso
        const newToken = generateToken(user);
        
        // Retornar novo token
        res.json({
          success: true,
          data: {
            token: newToken
          }
        });
      } catch (error) {
        console.error('Erro ao processar refresh token:', error);
        res.status(500).json({
          success: false,
          message: 'Erro no servidor'
        });
      }
    });
  } catch (error) {
    console.error('Erro no refresh token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// Validate token controller
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    };

    res.json({
      success: true,
      data: {
        user: userData,
        token: generateToken(user) // Generate new token to extend session
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Register controller (for admin use)
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.register = async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const user = await User.create({
      id: Date.now().toString(),
      username,
      password,
      name,
      role: role || 'client'
    });

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    };

    res.status(201).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// FUNÇÃO REMOVIDA: seedUsers
// O sistema agora inicia com banco limpo
// Usuários são criados apenas através do registro de barbearias
