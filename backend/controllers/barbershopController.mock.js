/**
 * Controller mock para barbearias - funciona sem banco de dados
 * Para testes e desenvolvimento quando o banco não está disponível
 */

const jwt = require('jsonwebtoken');

// Mock data storage (em memória)
const mockBarbershops = new Map();
const mockUsers = new Map();

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, barbershopId: user.barbershopId },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '1d' }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, barbershopId: user.barbershopId },
    process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret',
    { expiresIn: '7d' }
  );
};

/**
 * Registrar nova barbearia (MOCK)
 */
exports.registerBarbershop = async (req, res) => {
  try {
    const { name, slug, ownerEmail, ownerName, ownerUsername, ownerPassword, planType = 'free' } = req.body;

    console.log('[MOCK] Tentativa de registro de barbearia:', { name, slug, ownerEmail, ownerUsername });

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

    // Verificar se slug já existe (mock)
    if (mockBarbershops.has(slug)) {
      return res.status(409).json({
        success: false,
        message: 'Este nome de barbearia já está em uso',
        code: 'SLUG_ALREADY_EXISTS'
      });
    }

    // Verificar se username já existe (mock)
    const existingUser = Array.from(mockUsers.values()).find(u => u.username === ownerUsername);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este nome de usuário já está em uso',
        code: 'USERNAME_ALREADY_EXISTS'
      });
    }

    // Criar barbearia (mock)
    const barbershopId = `barbershop-${Date.now()}`;
    const barbershop = {
      id: barbershopId,
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
        }
      },
      created_at: new Date().toISOString()
    };

    mockBarbershops.set(slug, barbershop);

    console.log('[MOCK] Barbearia criada:', barbershop.id);

    // Criar usuário administrador (mock)
    const userId = `admin-${barbershopId}-${Date.now()}`;
    const adminUser = {
      id: userId,
      username: ownerUsername.trim(),
      role: 'admin',
      name: ownerName.trim(),
      barbershopId: barbershopId
    };

    mockUsers.set(userId, adminUser);

    console.log('[MOCK] Usuário admin criado:', adminUser.id);

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

    console.log('[MOCK] Registro de barbearia concluído com sucesso');

    res.status(201).json({
      success: true,
      message: 'Barbearia registrada com sucesso (MOCK)',
      data: responseData
    });

  } catch (error) {
    console.error('[MOCK] Erro no registro de barbearia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Verificar disponibilidade de slug (MOCK)
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

    // Verificar se slug já existe (mock)
    const exists = mockBarbershops.has(slug);

    console.log('[MOCK] Verificação de slug:', { slug, exists });

    res.json({
      success: true,
      available: !exists,
      slug,
      message: exists ? 'Slug já está em uso (MOCK)' : 'Slug disponível (MOCK)'
    });

  } catch (error) {
    console.error('[MOCK] Erro ao verificar slug:', error);
    res.status(500).json({
      success: false,
      available: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Listar todas as barbearias (MOCK)
 */
exports.listBarbershops = async (req, res) => {
  try {
    const barbershops = Array.from(mockBarbershops.values()).map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      ownerEmail: b.owner_email,
      planType: b.plan_type,
      createdAt: b.created_at
    }));

    console.log('[MOCK] Listando barbearias:', barbershops.length);

    res.json({
      success: true,
      data: barbershops,
      message: `${barbershops.length} barbearias encontradas (MOCK)`
    });

  } catch (error) {
    console.error('[MOCK] Erro ao listar barbearias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Obter dados da barbearia atual (MOCK)
 */
exports.getCurrentBarbershop = async (req, res) => {
  try {
    res.status(501).json({
      success: false,
      message: 'Endpoint requer autenticação e contexto de tenant - não disponível no modo MOCK',
      code: 'MOCK_NOT_IMPLEMENTED'
    });
  } catch (error) {
    console.error('[MOCK] Erro ao obter barbearia atual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Atualizar configurações da barbearia (MOCK)
 */
exports.updateCurrentBarbershop = async (req, res) => {
  try {
    res.status(501).json({
      success: false,
      message: 'Endpoint requer autenticação e contexto de tenant - não disponível no modo MOCK',
      code: 'MOCK_NOT_IMPLEMENTED'
    });
  } catch (error) {
    console.error('[MOCK] Erro ao atualizar barbearia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};