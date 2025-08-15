const { Barbershop, User } = require('../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// In-memory store for email verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Helper function to generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send email via n8n webhook
const sendVerificationEmail = async (email, code, barbershopName) => {
  try {
    console.log(`Sending verification email to ${email} with code ${code} for barbershop ${barbershopName}`);
    
    // For development, just log the code
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 VERIFICATION CODE for ${email}: ${code}`);
      return { success: true };
    }

    // Production: Send via n8n webhook
    const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('N8N_EMAIL_WEBHOOK_URL not configured, falling back to console log');
      console.log(`🔐 VERIFICATION CODE for ${email}: ${code}`);
      return { success: true };
    }

    // Use dynamic import for node-fetch (ESM module)
    const fetch = (await import('node-fetch')).default;
    
    const webhookPayload = {
      to: email,
      subject: `Código de verificação - ${barbershopName}`,
      template: 'email-verification',
      data: {
        barbershopName,
        verificationCode: code,
        email,
        expiresIn: '15 minutos'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
      timeout: 10000 // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Email sent successfully via n8n:', result);
    
    return { success: true, webhookResponse: result };
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    
    // Fallback: log the code if webhook fails
    console.log(`🔐 FALLBACK - VERIFICATION CODE for ${email}: ${code}`);
    
    return { 
      success: true, // Still return success so registration can continue
      error: error.message,
      fallback: true 
    };
  }
};

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
 * Iniciar processo de verificação de email
 * POST /api/barbershops/verify-email
 */
exports.initiateEmailVerification = async (req, res) => {
  try {
    const { email, barbershopName } = req.body;

    if (!email || !barbershopName) {
      return res.status(400).json({
        success: false,
        message: 'Email e nome da barbearia são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Check if email is already registered
    const existingBarbershop = await Barbershop.findOne({ where: { owner_email: email.toLowerCase() } });
    if (existingBarbershop) {
      return res.status(409).json({
        success: false,
        message: 'Este email já está cadastrado',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store verification code
    verificationCodes.set(email.toLowerCase(), {
      code,
      expiresAt,
      barbershopName: barbershopName.trim(),
      attempts: 0
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, code, barbershopName);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar email de verificação',
        code: 'EMAIL_SEND_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Código de verificação enviado para seu email',
      data: {
        email: email.toLowerCase(),
        expiresIn: 15 * 60 // 15 minutes in seconds
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar verificação de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Verificar código de email
 * POST /api/barbershops/verify-code
 */
exports.verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email e código são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    const verification = verificationCodes.get(email.toLowerCase());
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Código de verificação não encontrado ou expirado',
        code: 'CODE_NOT_FOUND'
      });
    }

    // Check if code is expired
    if (Date.now() > verification.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(410).json({
        success: false,
        message: 'Código de verificação expirado',
        code: 'CODE_EXPIRED'
      });
    }

    // Check attempts limit
    if (verification.attempts >= 3) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(429).json({
        success: false,
        message: 'Muitas tentativas. Solicite um novo código',
        code: 'TOO_MANY_ATTEMPTS'
      });
    }

    // Verify code
    if (verification.code !== code.toString()) {
      verification.attempts++;
      return res.status(400).json({
        success: false,
        message: 'Código de verificação inválido',
        code: 'INVALID_CODE',
        attemptsLeft: 3 - verification.attempts
      });
    }

    // Code is valid - mark as verified
    verification.verified = true;

    res.json({
      success: true,
      message: 'Email verificado com sucesso',
      data: {
        email: email.toLowerCase(),
        verified: true
      }
    });

  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
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

    // Check if email was verified
    const verification = verificationCodes.get(ownerEmail.toLowerCase());
    if (!verification || !verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Email deve ser verificado antes do cadastro',
        code: 'EMAIL_NOT_VERIFIED'
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

    // Clean up verification code after successful registration
    verificationCodes.delete(ownerEmail.toLowerCase());

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
 * Obter barbearia por slug (público)
 * GET /api/barbershops/slug/:slug
 */
exports.getBarbershopBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug é obrigatório',
        code: 'MISSING_SLUG'
      });
    }

    const barbershop = await Barbershop.findOne({ 
      where: { slug },
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
    console.error('Erro ao obter barbearia por slug:', error);
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