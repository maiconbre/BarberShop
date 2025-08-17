const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { Barbershop } = require('../models');
const { limitRepeatedRequests } = require('../middleware/requestLimitMiddleware');
const { checkAppointmentLimits } = require('../middleware/planLimitsMiddleware');

// Limitador específico para agendamentos públicos (mais restritivo)
const publicAppointmentLimiter = limitRepeatedRequests({
  maxRepeatedRequests: 10, // Limite baixo para evitar spam
  burstLimit: 3, // Rajadas pequenas
  windowMs: 60000, // Janela de 1 minuto
  blockTimeMs: 300000, // Bloqueio de 5 minutos
  gracePeriodMs: 5000, // 5 segundos entre requisições
  message: {
    success: false,
    message: 'Muitas tentativas de agendamento. Aguarde alguns minutos antes de tentar novamente.'
  }
});

/**
 * Middleware para resolver o tenant baseado no slug da barbearia
 */
const resolveTenantBySlug = async (req, res, next) => {
  try {
    const { barbershopSlug } = req.params;
    
    if (!barbershopSlug) {
      return res.status(400).json({
        success: false,
        message: 'Slug da barbearia é obrigatório',
        code: 'BARBERSHOP_SLUG_REQUIRED'
      });
    }
    
    // Buscar barbearia pelo slug
    const barbershop = await Barbershop.findOne({
      where: { slug: barbershopSlug }
    });
    
    if (!barbershop) {
      return res.status(404).json({
        success: false,
        message: 'Barbearia não encontrada',
        code: 'BARBERSHOP_NOT_FOUND'
      });
    }
    
    // Adicionar informações do tenant ao request
    req.tenant = {
      barbershopId: barbershop.id,
      name: barbershop.name,
      planType: barbershop.planType || 'free',
      slug: barbershop.slug
    };
    
    next();
  } catch (error) {
    console.error('Error resolving tenant by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Rota pública para criar agendamentos
 * POST /api/public/:barbershopSlug/appointments
 */
router.post('/:barbershopSlug/appointments', 
  publicAppointmentLimiter,
  resolveTenantBySlug,
  checkAppointmentLimits,
  async (req, res) => {
    try {
      // Validar dados obrigatórios
      const {
        clientName,
        wppclient,
        serviceName,
        date,
        time,
        barberId,
        barberName,
        price
      } = req.body;
      
      // Validações básicas
      if (!clientName || !wppclient || !serviceName || !date || !time || !barberId || !barberName) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios não fornecidos',
          code: 'MISSING_REQUIRED_FIELDS',
          required: ['clientName', 'wppclient', 'serviceName', 'date', 'time', 'barberId', 'barberName']
        });
      }
      
      // Validar formato do WhatsApp (apenas números)
      const whatsappRegex = /^\d{10,15}$/;
      if (!whatsappRegex.test(wppclient.replace(/\D/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Número de WhatsApp inválido',
          code: 'INVALID_WHATSAPP'
        });
      }
      
      // Validar formato da data (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de data inválido. Use YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT'
        });
      }
      
      // Validar formato do horário (HH:MM)
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(time)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de horário inválido. Use HH:MM',
          code: 'INVALID_TIME_FORMAT'
        });
      }
      
      // Verificar se a data não é no passado
      const appointmentDate = new Date(`${date}T${time}:00`);
      const now = new Date();
      if (appointmentDate < now) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível agendar para datas passadas',
          code: 'PAST_DATE_NOT_ALLOWED'
        });
      }
      
      // Verificar se já existe agendamento para o mesmo horário e barbeiro
      const existingAppointment = await Appointment.findOne({
        where: {
          barbershopId: req.tenant.barbershopId,
          barberId,
          date,
          time,
          status: ['pending', 'confirmed'] // Não considerar cancelados
        }
      });
      
      if (existingAppointment) {
        return res.status(409).json({
          success: false,
          message: 'Horário já ocupado',
          code: 'TIME_SLOT_OCCUPIED'
        });
      }
      
      // Criar o agendamento
      const appointmentData = {
        id: Date.now().toString(),
        clientName,
        wppclient: wppclient.replace(/\D/g, ''), // Limpar formatação
        serviceName,
        date,
        time,
        barberId,
        barberName,
        price: parseFloat(price) || 0,
        status: 'pending',
        barbershopId: req.tenant.barbershopId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const appointment = await Appointment.create(appointmentData);
      
      console.log(`[PUBLIC APPOINTMENT] Created appointment ${appointment.id} for ${req.tenant.name}`);
      
      res.status(201).json({
        success: true,
        data: appointment,
        message: 'Agendamento criado com sucesso'
      });
      
    } catch (error) {
      console.error('Error creating public appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

/**
 * Rota pública para verificar disponibilidade de horários
 * GET /api/public/:barbershopSlug/appointments/availability?date=YYYY-MM-DD&barberId=id
 */
router.get('/:barbershopSlug/appointments/availability',
  resolveTenantBySlug,
  async (req, res) => {
    try {
      const { date, barberId } = req.query;
      
      if (!date || !barberId) {
        return res.status(400).json({
          success: false,
          message: 'Data e ID do barbeiro são obrigatórios',
          code: 'MISSING_REQUIRED_PARAMS'
        });
      }
      
      // Buscar agendamentos existentes para a data e barbeiro
      const existingAppointments = await Appointment.findAll({
        where: {
          barbershopId: req.tenant.barbershopId,
          barberId,
          date,
          status: ['pending', 'confirmed']
        },
        attributes: ['time']
      });
      
      // Horários padrão disponíveis
      const availableSlots = [
        '09:00', '10:00', '11:00', '14:00', '15:00',
        '16:00', '17:00', '18:00', '19:00', '20:00'
      ];
      
      // Remover horários já ocupados
      const occupiedTimes = existingAppointments.map(apt => apt.time);
      const freeSlots = availableSlots.filter(slot => !occupiedTimes.includes(slot));
      
      res.json({
        success: true,
        data: {
          date,
          barberId,
          availableSlots: freeSlots,
          occupiedSlots: occupiedTimes
        }
      });
      
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

module.exports = router;