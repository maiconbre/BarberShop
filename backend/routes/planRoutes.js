const express = require('express');
const router = express.Router();
const { Barbershop } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const { detectTenant, requireTenant, validateTenantAccess } = require('../middleware/tenantMiddleware');
const { getUsageStats, handleUsageStats } = require('../middleware/planLimitsMiddleware');

/**
 * GET /api/plans/usage
 * Obter estatísticas de uso do plano atual (requer autenticação)
 */
router.get('/usage', 
  detectTenant,
  requireTenant,
  protect,
  validateTenantAccess,
  getUsageStats,
  handleUsageStats
);

/**
 * GET /api/plans/public/usage
 * Obter estatísticas de uso do plano atual (acesso público)
 */
router.get('/public/usage', 
  async (req, res) => {
    try {
      console.log('Getting public usage stats:', { query: req.query });
      
      // Obter barbershopId dos parâmetros da query ou usar um ID padrão para fallback
      const barbershopId = req.query.barbershopId || 'default';
      
      // Para rotas públicas, usar dados mockados ou buscar por slug
      const barbershopSlug = req.query.slug;
      let barbershop = null;
      
      if (barbershopSlug) {
        console.log('Searching by slug:', barbershopSlug);
        barbershop = await Barbershop.findOne({
          where: { slug: barbershopSlug },
          attributes: ['id', 'name', 'slug', 'plan_type', 'created_at']
        });
      } else {
        console.log('Searching by ID:', barbershopId);
        barbershop = await Barbershop.findByPk(barbershopId, {
          attributes: ['id', 'name', 'slug', 'plan_type', 'created_at']
        });
      }
      
      console.log('Barbershop found:', barbershop ? barbershop.toJSON() : 'none');
      
      // Se não encontrar barbearia, usar configuração padrão (free)
      const planType = barbershop && barbershop.plan_type ? barbershop.plan_type : 'free';
      const isProPlan = planType === 'pro';
      
      res.json({
        success: true,
        data: {
          planType: barbershop.plan_type,
          limits: {
            barbers: isProPlan ? Infinity : 1,
            appointments_per_month: isProPlan ? Infinity : 20,
            services: isProPlan ? Infinity : 5,
            storage_mb: isProPlan ? 1024 : 100
          },
          usage: {
            barbers: {
              current: 1,
              limit: isProPlan ? Infinity : 1,
              remaining: isProPlan ? Infinity : 0,
              percentage: isProPlan ? 0 : 100,
              nearLimit: !isProPlan
            },
            appointments: {
              current: 18,
              limit: isProPlan ? Infinity : 20,
              remaining: isProPlan ? Infinity : 2,
              percentage: isProPlan ? 0 : 90,
              nearLimit: !isProPlan
            }
          },
          upgradeRecommended: !isProPlan,
          upgradeRequired: false
        }
      });
      
    } catch (error) {
      console.error('Error getting public usage stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving usage statistics',
        code: 'USAGE_STATS_ERROR'
      });
    }
  }
);

/**
 * POST /api/plans/upgrade
 * Simular upgrade de plano (fake payment)
 */
router.post('/upgrade', 
  detectTenant,
  requireTenant,
  protect,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { barbershopId } = req.tenant;
      const { planType = 'pro' } = req.body;
      
      // Validar plano
      if (!['free', 'pro'].includes(planType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan type. Must be "free" or "pro"',
          code: 'INVALID_PLAN_TYPE'
        });
      }
      
      // Buscar barbearia
      const barbershop = await Barbershop.findByPk(barbershopId);
      if (!barbershop) {
        return res.status(404).json({
          success: false,
          message: 'Barbershop not found',
          code: 'BARBERSHOP_NOT_FOUND'
        });
      }
      
      // Verificar se já está no plano solicitado
      if (barbershop.plan_type === planType) {
        return res.status(400).json({
          success: false,
          message: `Barbershop is already on ${planType} plan`,
          code: 'ALREADY_ON_PLAN'
        });
      }
      
      // Simular processamento de pagamento (fake)
      console.log(`[FAKE PAYMENT] Processing upgrade for ${barbershop.name} to ${planType} plan`);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar plano
      await barbershop.update({
        plan_type: planType,
        settings: {
          ...barbershop.settings,
          lastUpgrade: new Date().toISOString(),
          paymentMethod: 'fake_mercado_pago',
          transactionId: `fake_${Date.now()}`
        }
      });
      
      console.log(`[PLAN UPGRADE] ${barbershop.name} upgraded to ${planType} plan`);
      
      res.json({
        success: true,
        message: `Plan upgraded to ${planType} successfully`,
        data: {
          barbershopId: barbershop.id,
          name: barbershop.name,
          slug: barbershop.slug,
          planType: barbershop.plan_type,
          upgradedAt: new Date().toISOString(),
          transactionId: `fake_${Date.now()}`,
          paymentMethod: 'mercado_pago_simulation'
        }
      });
      
    } catch (error) {
      console.error('Error upgrading plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing plan upgrade',
        code: 'PLAN_UPGRADE_ERROR'
      });
    }
  }
);

/**
 * GET /api/plans/current
 * Obter informações do plano atual (requer autenticação)
 */
router.get('/current',
  detectTenant,
  requireTenant,
  protect,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { barbershopId } = req.tenant;
      
      const barbershop = await Barbershop.findByPk(barbershopId, {
        attributes: ['id', 'name', 'slug', 'plan_type', 'settings', 'created_at']
      });
      
      if (!barbershop) {
        return res.status(404).json({
          success: false,
          message: 'Barbershop not found',
          code: 'BARBERSHOP_NOT_FOUND'
        });
      }
      
      res.json({
        success: true,
        data: {
          barbershopId: barbershop.id,
          name: barbershop.name,
          slug: barbershop.slug,
          planType: barbershop.plan_type,
          settings: barbershop.settings,
          createdAt: barbershop.created_at
        }
      });
      
    } catch (error) {
      console.error('Error getting current plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving plan information',
        code: 'PLAN_INFO_ERROR'
      });
    }
  }
);

/**
 * GET /api/plans/public/current
 * Obter informações do plano atual (acesso público)
 */
router.get('/public/current',
  async (req, res) => {
    try {
      // Obter barbershopId dos parâmetros da query ou usar um ID padrão para fallback
      const barbershopId = req.query.barbershopId || 'default';
      
      // Para rotas públicas, usar dados mockados ou buscar por slug
      const barbershopSlug = req.query.slug;
      let barbershop = null;
      
      if (barbershopSlug) {
        barbershop = await Barbershop.findOne({
          where: { slug: barbershopSlug },
          attributes: ['id', 'name', 'slug', 'plan_type', 'created_at']
        });
      } else {
        barbershop = await Barbershop.findByPk(barbershopId, {
          attributes: ['id', 'name', 'slug', 'plan_type', 'created_at']
        });
      }
      
      // Usar dados padrão se barbearia não for encontrada
      const planType = barbershop && barbershop.plan_type ? barbershop.plan_type : 'free';
      const responseData = barbershop ? {
        barbershopId: barbershop.id,
        name: barbershop.name,
        slug: barbershop.slug,
        planType: planType,
        settings: {
          theme: 'default',
          timezone: 'America/Sao_Paulo'
        },
        createdAt: barbershop.created_at
      } : {
        barbershopId: 'default',
        name: 'Barbearia Demo',
        slug: 'demo',
        planType: planType,
        settings: {
          theme: 'default',
          timezone: 'America/Sao_Paulo'
        },
        createdAt: new Date().toISOString()
      };
        
        res.json({
          success: true,
          data: responseData
        });
      
    } catch (error) {
      console.error('Error getting public current plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving plan information',
        code: 'PLAN_INFO_ERROR'
      });
    }
  }
);

/**
 * GET /api/plans/history
 * Obter histórico de transações/upgrades (simulado)
 */
router.get('/history',
  detectTenant,
  requireTenant,
  protect,
  validateTenantAccess,
  async (req, res) => {
    try {
      const { barbershopId } = req.tenant;
      
      const barbershop = await Barbershop.findByPk(barbershopId, {
        attributes: ['id', 'name', 'plan_type', 'settings', 'created_at']
      });
      
      if (!barbershop) {
        return res.status(404).json({
          success: false,
          message: 'Barbershop not found',
          code: 'BARBERSHOP_NOT_FOUND'
        });
      }
      
      // Simular histórico baseado nas configurações
      const history = [];
      
      // Sempre adicionar registro de criação
      history.push({
        id: `creation_${barbershop.id}`,
        type: 'plan_activation',
        planType: 'free',
        amount: 0,
        status: 'completed',
        description: 'Plano gratuito ativado na criação da conta',
        createdAt: barbershop.created_at,
        paymentMethod: null,
        transactionId: null
      });
      
      // Se há registro de upgrade nas configurações
      if (barbershop.settings?.lastUpgrade) {
        history.push({
          id: barbershop.settings.transactionId || `upgrade_${Date.now()}`,
          type: 'plan_upgrade',
          planType: barbershop.plan_type,
          amount: barbershop.plan_type === 'pro' ? 39.90 : 0,
          status: 'completed',
          description: `Upgrade para plano ${barbershop.plan_type}`,
          createdAt: barbershop.settings.lastUpgrade,
          paymentMethod: barbershop.settings.paymentMethod || 'mercado_pago',
          transactionId: barbershop.settings.transactionId
        });
      }
      
      // Ordenar por data (mais recente primeiro)
      history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      res.json({
        success: true,
        data: {
          barbershopId: barbershop.id,
          currentPlan: barbershop.plan_type,
          transactions: history
        }
      });
      
    } catch (error) {
      console.error('Error getting plan history:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving plan history',
        code: 'PLAN_HISTORY_ERROR'
      });
    }
  }
);

module.exports = router;