const { Barbershop, User } = require('../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Controller para gerenciar barbearias (tenants)
 */

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, barbershopId: user.barbershopId },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, barbershopId: user.barbershopId },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );
};

/**
 * Registrar nova barbearia
 * POST /api/barbershops/register
 */
exports.registerBarbershop = async (req, res) => {
  try {
    const { name, slug, ownerEmail, ownerName, ownerUsername, ownerPassword, planType = 'free' } = req.body;

    console.log('Tentativa de registro de barbearia:', { name, slug, ownerEmail, ownerUsername });

    // Validações básicas
    if (!name || !slug || !ownerEmail || !ownerName || !ownerUsername || !ownerPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    // Validar formato do slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug deve conter apenas letras minúsculas, números e hífens',
        code: 'INVALID_SLUG_FORMAT'
      });
    }

    // Verificar se slug já existe
    const existingBarbershop = await Barbershop.findOne({ where: { slug } });
    if (existingBarbershop) {
      return res.status(409).json({
        success: false,
        message: 'Este nome de barbearia já está em uso',
        code: 'SLUG_ALREADY_EXISTS'
      });
    }

    // Verificar se email já está em uso
    const existingEmail = await Barbershop.findOne({ where: { owner_email: ownerEmail } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Este email já está cadastrado',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Verificar se username já existe
    const existingUser = await User.findOne({ where: { username: ownerUsername } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este nome de usuário já está em uso',
        code: 'USERNAME_ALREADY_EXISTS'
      });
    }

    // Criar barbearia
    const barbershop = await Barbershop.create({
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      owner_email: ownerEmail.toLowerCase().trim(),
      plan_type: planType,
      settings: {
        theme: 'default',
        workingHours: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '18:00' },
          saturday: { start: '08:00', end: '16:00' },
          sunday: { closed: true }
        },
        notifications: {
          email: true,
          whatsapp: false
        }
      }
    });

    console.log('Barbearia criada:', barbershop.id);

    // Criar usuário administrador da barbearia
    const adminUser = await User.create({
      id: `admin-${barbershop.id}-${Date.now()}`,
      username: ownerUsername.trim(),
      password: ownerPassword,
      role: 'admin',
      name: ownerName.trim(),
      barbershopId: barbershop.id
    });

    console.log('Usuário admin criado:', adminUser.id);

    // Gerar tokens para login automático
    const token = generateToken(adminUser);
    const refreshToken = generateRefreshToken(adminUser);

    // Retornar dados da barbearia e usuário criados
    const responseData = {
      barbershop: {
        id: barbershop.id,
        name: barbershop.name,
        slug: barbershop.slug,
        planType: barbershop.plan_type,
        settings: barbershop.settings
      },
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        name: adminUser.name,
        barbershopId: adminUser.barbershopId
      },
      token,
      refreshToken
    };

    console.log('Registro de barbearia concluído com sucesso');

    res.status(201).json({
      success: true,
      message: 'Barbearia registrada com sucesso',
      data: responseData
    });

  } catch (error) {
    console.error('Erro no registro de barbearia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Verificar disponibilidade de slug
 * GET /api/barbershops/check-slug/:slug
 */
exports.checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.params;

    // Validar formato do slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Slug deve conter apenas letras minúsculas, números e hífens',
        code: 'INVALID_SLUG_FORMAT'
      });
    }

    // Verificar se slug já existe
    const existingBarbershop = await Barbershop.findOne({ where: { slug } });

    res.json({
      success: true,
      available: !existingBarbershop,
      slug,
      message: existingBarbershop ? 'Slug já está em uso' : 'Slug disponível'
    });

  } catch (error) {
    console.error('Erro ao verificar slug:', error);
    res.status(500).json({
      success: false,
      available: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obter dados da barbearia atual (baseado no tenant context)
 * GET /api/barbershops/current
 */
exports.getCurrentBarbershop = async (req, res) => {
  try {
    if (!req.tenant || !req.tenant.barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado',
        code: 'TENANT_CONTEXT_MISSING'
      });
    }

    const barbershop = await Barbershop.findByPk(req.tenant.barbershopId, {
      attributes: ['id', 'name', 'slug', 'owner_email', 'plan_type', 'settings', 'created_at']
    });

    if (!barbershop) {
      return res.status(404).json({
        success: false,
        message: 'Barbearia não encontrada',
        code: 'BARBERSHOP_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        id: barbershop.id,
        name: barbershop.name,
        slug: barbershop.slug,
        ownerEmail: barbershop.owner_email,
        planType: barbershop.plan_type,
        settings: barbershop.settings,
        createdAt: barbershop.created_at
      }
    });

  } catch (error) {
    console.error('Erro ao obter barbearia atual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Atualizar configurações da barbearia
 * PUT /api/barbershops/current
 */
exports.updateCurrentBarbershop = async (req, res) => {
  try {
    if (!req.tenant || !req.tenant.barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado',
        code: 'TENANT_CONTEXT_MISSING'
      });
    }

    // Verificar se usuário é admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem atualizar configurações da barbearia',
        code: 'ADMIN_REQUIRED'
      });
    }

    const { name, settings } = req.body;
    const updateData = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (settings && typeof settings === 'object') {
      updateData.settings = settings;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum dado para atualizar',
        code: 'NO_UPDATE_DATA'
      });
    }

    const [updatedRows] = await Barbershop.update(updateData, {
      where: { id: req.tenant.barbershopId }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Barbearia não encontrada',
        code: 'BARBERSHOP_NOT_FOUND'
      });
    }

    // Buscar dados atualizados
    const updatedBarbershop = await Barbershop.findByPk(req.tenant.barbershopId, {
      attributes: ['id', 'name', 'slug', 'owner_email', 'plan_type', 'settings', 'updated_at']
    });

    res.json({
      success: true,
      message: 'Barbearia atualizada com sucesso',
      data: {
        id: updatedBarbershop.id,
        name: updatedBarbershop.name,
        slug: updatedBarbershop.slug,
        ownerEmail: updatedBarbershop.owner_email,
        planType: updatedBarbershop.plan_type,
        settings: updatedBarbershop.settings,
        updatedAt: updatedBarbershop.updated_at
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar barbearia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Listar todas as barbearias (apenas para desenvolvimento/debug)
 * GET /api/barbershops/list
 */
exports.listBarbershops = async (req, res) => {
  try {
    // Esta rota deve ser protegida em produção
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Rota não disponível em produção',
        code: 'PRODUCTION_RESTRICTED'
      });
    }

    const barbershops = await Barbershop.findAll({
      attributes: ['id', 'name', 'slug', 'owner_email', 'plan_type', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: barbershops.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        ownerEmail: b.owner_email,
        planType: b.plan_type,
        createdAt: b.created_at
      }))
    });

  } catch (error) {
    console.error('Erro ao listar barbearias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};