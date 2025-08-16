const { User, Appointment, Barbershop } = require('../models');
const { Op } = require('sequelize');

/**
 * Middleware para verificar e aplicar limites do plano por tenant
 */

// Definir limites por plano
const PLAN_LIMITS = {
  free: {
    barbers: 1, // Apenas o admin pode ser barbeiro no plano free
    appointments_per_month: 20,
    services: 5,
    storage_mb: 100
  },
  pro: {
    barbers: Infinity,
    appointments_per_month: Infinity,
    services: Infinity,
    storage_mb: 1000
  }
};

/**
 * Obter limites do plano atual
 */
const getPlanLimits = (planType) => {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free;
};

/**
 * Contar barbeiros ativos por tenant
 */
const countActiveBarbers = async (barbershopId) => {
  try {
    const count = await User.count({
      where: {
        barbershopId,
        role: 'barber',
        // Considerar apenas usuários ativos (não deletados)
        deletedAt: null
      }
    });
    
    return count;
  } catch (error) {
    console.error('Error counting active barbers:', error);
    return 0;
  }
};

/**
 * Contar agendamentos do mês atual por tenant
 */
const countMonthlyAppointments = async (barbershopId) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const count = await Appointment.count({
      where: {
        barbershopId,
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });
    
    return count;
  } catch (error) {
    console.error('Error counting monthly appointments:', error);
    return 0;
  }
};

/**
 * Middleware para verificar limites antes de criar barbeiro
 */
const checkBarberLimits = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required',
        code: 'TENANT_REQUIRED'
      });
    }
    
    const { barbershopId, planType } = req.tenant;
    const limits = getPlanLimits(planType);
    
    // Contar barbeiros ativos
    const currentBarbers = await countActiveBarbers(barbershopId);
    
    // Verificar se excede o limite
    if (currentBarbers >= limits.barbers) {
      return res.status(403).json({
        success: false,
        message: `Limite de barbeiros atingido para o plano ${planType}. Máximo: ${limits.barbers}`,
        code: 'BARBER_LIMIT_EXCEEDED',
        data: {
          current: currentBarbers,
          limit: limits.barbers,
          planType,
          upgradeRequired: planType === 'free'
        }
      });
    }
    
    // Adicionar informações de uso ao request
    req.usage = {
      barbers: {
        current: currentBarbers,
        limit: limits.barbers,
        remaining: limits.barbers - currentBarbers
      }
    };
    
    console.log(`[PLAN LIMITS] Barber creation allowed: ${currentBarbers}/${limits.barbers} for ${req.tenant.name}`);
    
    next();
  } catch (error) {
    console.error('Error checking barber limits:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking plan limits',
      code: 'PLAN_LIMITS_CHECK_ERROR'
    });
  }
};

/**
 * Middleware para verificar limites antes de criar agendamento
 */
const checkAppointmentLimits = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required',
        code: 'TENANT_REQUIRED'
      });
    }
    
    const { barbershopId, planType } = req.tenant;
    const limits = getPlanLimits(planType);
    
    // Contar agendamentos do mês
    const currentAppointments = await countMonthlyAppointments(barbershopId);
    
    // Verificar se excede o limite
    if (currentAppointments >= limits.appointments_per_month) {
      return res.status(403).json({
        success: false,
        message: `Limite de agendamentos mensais atingido para o plano ${planType}. Máximo: ${limits.appointments_per_month}`,
        code: 'APPOINTMENT_LIMIT_EXCEEDED',
        data: {
          current: currentAppointments,
          limit: limits.appointments_per_month,
          planType,
          upgradeRequired: planType === 'free'
        }
      });
    }
    
    // Adicionar informações de uso ao request
    req.usage = {
      appointments: {
        current: currentAppointments,
        limit: limits.appointments_per_month,
        remaining: limits.appointments_per_month - currentAppointments
      }
    };
    
    console.log(`[PLAN LIMITS] Appointment creation allowed: ${currentAppointments}/${limits.appointments_per_month} for ${req.tenant.name}`);
    
    next();
  } catch (error) {
    console.error('Error checking appointment limits:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking plan limits',
      code: 'PLAN_LIMITS_CHECK_ERROR'
    });
  }
};

/**
 * Middleware para obter estatísticas de uso atual
 */
const getUsageStats = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant context required',
        code: 'TENANT_REQUIRED'
      });
    }
    
    const { barbershopId, planType } = req.tenant;
    const limits = getPlanLimits(planType);
    
    // Obter contadores atuais
    const [currentBarbers, currentAppointments] = await Promise.all([
      countActiveBarbers(barbershopId),
      countMonthlyAppointments(barbershopId)
    ]);
    
    // Calcular percentuais de uso
    const barbersUsagePercent = limits.barbers === Infinity ? 0 : (currentBarbers / limits.barbers) * 100;
    const appointmentsUsagePercent = limits.appointments_per_month === Infinity ? 0 : (currentAppointments / limits.appointments_per_month) * 100;
    
    // Determinar se está próximo do limite (>= 80%)
    const nearBarbersLimit = barbersUsagePercent >= 80;
    const nearAppointmentsLimit = appointmentsUsagePercent >= 80;
    
    req.usageStats = {
      planType,
      limits,
      usage: {
        barbers: {
          current: currentBarbers,
          limit: limits.barbers,
          remaining: limits.barbers === Infinity ? Infinity : limits.barbers - currentBarbers,
          percentage: barbersUsagePercent,
          nearLimit: nearBarbersLimit
        },
        appointments: {
          current: currentAppointments,
          limit: limits.appointments_per_month,
          remaining: limits.appointments_per_month === Infinity ? Infinity : limits.appointments_per_month - currentAppointments,
          percentage: appointmentsUsagePercent,
          nearLimit: nearAppointmentsLimit
        }
      },
      upgradeRecommended: nearBarbersLimit || nearAppointmentsLimit,
      upgradeRequired: planType === 'free' && (currentBarbers >= limits.barbers || currentAppointments >= limits.appointments_per_month)
    };
    
    next();
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting usage statistics',
      code: 'USAGE_STATS_ERROR'
    });
  }
};

/**
 * Endpoint para obter estatísticas de uso
 */
const handleUsageStats = (req, res) => {
  try {
    if (!req.usageStats) {
      return res.status(500).json({
        success: false,
        message: 'Usage stats not available',
        code: 'USAGE_STATS_NOT_AVAILABLE'
      });
    }
    
    res.json({
      success: true,
      data: req.usageStats
    });
  } catch (error) {
    console.error('Error handling usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving usage statistics',
      code: 'USAGE_STATS_HANDLER_ERROR'
    });
  }
};

module.exports = {
  checkBarberLimits,
  checkAppointmentLimits,
  getUsageStats,
  handleUsageStats,
  getPlanLimits,
  countActiveBarbers,
  countMonthlyAppointments
};