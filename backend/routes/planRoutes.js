const express = require('express');
const router = express.Router();
const { Barbershop } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { detectTenant, requireTenant, validateTenantAccess } = require('../middleware/tenantMiddleware');
const { getUsageStats, handleUsageStats } = require('../middleware/planLimitsMiddleware');

/**
 * GET /api/plans/usage
 * Obter estatísticas de uso do plano atual
 */
router.get('/usage', 
  detectTenant,
  requireTenant,
  authenticateToken,
  validateTenantAccess,
  getUsageStats,
  handleUsageStats
);

/**
 * POST /api/plans/upgrade
 * Simular upgrade de plano (fake payment)
 */
router.post('/upgrade', 
  detectTenant,
  requireTenant,
  authenticateToken,
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
 * Obter informações do plano atual
 */
router.get('/current',
  detectTenant,
  requireTenant,
  authenticateToken,
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
 * GET /api/plans/history
 * Obter histórico de transações/upgrades (simulado)
 */
router.get('/history',
  detectTenant,
  requireTenant,
  authenticateToken,
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