const { Barbershop } = require('../models');

/**
 * Middleware para detectar e injetar tenant (barbershop) no contexto da requisição
 * Captura o slug da URL no formato /app/:barbershopSlug/* e busca o barbershopId correspondente
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.detectTenant = async (req, res, next) => {
  try {
    // Extract barbershop slug from URL path
    // Expected format: /app/:barbershopSlug/* or /api/app/:barbershopSlug/*
    const urlPath = req.path;
    const slugMatch = urlPath.match(/\/(?:api\/)?app\/([a-z0-9-]+)/);
    
    if (!slugMatch) {
      // If no slug in URL, this might be a non-tenant route (like auth, registration)
      // Allow the request to continue without tenant context
      return next();
    }
    
    const barbershopSlug = slugMatch[1];
    
    // Find barbershop by slug
    const barbershop = await Barbershop.findOne({
      where: { slug: barbershopSlug },
      attributes: ['id', 'name', 'slug', 'plan_type', 'settings']
    });
    
    if (!barbershop) {
      return res.status(404).json({
        success: false,
        message: `Barbershop not found: ${barbershopSlug}`,
        code: 'TENANT_NOT_FOUND'
      });
    }
    
    // Inject tenant context into request
    req.tenant = {
      barbershopId: barbershop.id,
      slug: barbershop.slug,
      name: barbershop.name,
      planType: barbershop.plan_type,
      settings: barbershop.settings
    };
    
    // Log tenant detection for debugging
    console.log(`[TENANT] Detected: ${barbershop.name} (${barbershop.slug}) - ID: ${barbershop.id}`);
    
    next();
  } catch (error) {
    console.error('Tenant detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting tenant',
      code: 'TENANT_DETECTION_ERROR'
    });
  }
};

/**
 * Middleware para garantir que uma requisição tenha contexto de tenant
 * Deve ser usado após detectTenant em rotas que requerem isolamento por tenant
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.requireTenant = (req, res, next) => {
  if (!req.tenant || !req.tenant.barbershopId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant context required but not found',
      code: 'TENANT_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware para verificar se o usuário pertence ao tenant atual
 * Deve ser usado após auth middleware e tenant middleware
 */
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.validateTenantAccess = async (req, res, next) => {
  try {
    if (!req.user || !req.tenant) {
      return res.status(401).json({
        success: false,
        message: 'Authentication and tenant context required',
        code: 'AUTH_TENANT_REQUIRED'
      });
    }
    
    // Check if user belongs to the current tenant
    if (req.user.barbershopId !== req.tenant.barbershopId) {
      console.warn(`[SECURITY] Cross-tenant access attempt: User ${req.user.id} (tenant: ${req.user.barbershopId}) tried to access tenant ${req.tenant.barbershopId}`);
      
      return res.status(403).json({
        success: false,
        message: 'Access denied: User does not belong to this barbershop',
        code: 'CROSS_TENANT_ACCESS_DENIED'
      });
    }
    
    next();
  } catch (error) {
    console.error('Tenant access validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating tenant access',
      code: 'TENANT_ACCESS_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware para verificar limites do plano do tenant
 */
/**
 * @param {string} feature
 * @returns {function}
 */
exports.checkPlanLimits = (feature) => {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required for plan validation',
        code: 'TENANT_REQUIRED_FOR_PLAN'
      });
    }
    
    const planType = req.tenant.planType;
    
    // Define plan limits
    const planLimits = {
      free: {
        barbers: 1,
        appointments_per_month: 20,
        services: 5
      },
      pro: {
        barbers: Infinity,
        appointments_per_month: Infinity,
        services: Infinity
      }
    };
    
    const limits = planLimits[planType] || planLimits.free;
    
    // Store limits in request for use in controllers
    req.planLimits = limits;
    
    // Log plan check
    console.log(`[PLAN] ${req.tenant.name} (${planType}): Checking ${feature} limits`);
    
    next();
  };
};