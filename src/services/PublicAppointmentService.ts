import ApiService from './ApiService';
import { logger } from '../utils/logger';

// Interface para agendamento público
interface PublicAppointmentData {
  clientName: string;
  wppclient: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  barberId: string;
  barberName: string;
  price: number;
}

// Interface para resposta da API
interface PublicAppointmentResponse {
  success: boolean;
  data?: any;
  message?: string;
  code?: string;
}

// Interface para verificação de disponibilidade
interface AvailabilityResponse {
  success: boolean;
  data?: {
    date: string;
    barberId: string;
    availableSlots: string[];
    occupiedSlots: string[];
  };
  message?: string;
  code?: string;
}

/**
 * Serviço para agendamentos públicos (sem autenticação)
 * Usado nas páginas públicas das barbearias
 */
export class PublicAppointmentService {
  /**
   * Cria um agendamento público
   */
  static async createAppointment(
    barbershopSlug: string,
    appointmentData: PublicAppointmentData
  ): Promise<PublicAppointmentResponse> {
    try {
      logger.apiInfo('Criando agendamento público', { barbershopSlug, appointmentData });
      
      // Validações básicas
      if (!barbershopSlug) {
        throw new Error('Slug da barbearia é obrigatório');
      }
      
      if (!appointmentData.clientName || !appointmentData.wppclient || 
          !appointmentData.serviceName || !appointmentData.date || 
          !appointmentData.time || !appointmentData.barberId || 
          !appointmentData.barberName) {
        throw new Error('Dados obrigatórios não fornecidos');
      }
      
      // Limpar formatação do WhatsApp
      const cleanedData = {
        ...appointmentData,
        wppclient: appointmentData.wppclient.replace(/\D/g, ''),
        price: parseFloat(appointmentData.price.toString()) || 0
      };
      
      const response = await ApiService.post<any>(
        `/api/public/${barbershopSlug}/appointments`,
        cleanedData
      );
      
      logger.apiInfo('Agendamento público criado com sucesso', response);
      
      return {
        success: true,
        data: response,
        message: 'Agendamento criado com sucesso'
      };
      
    } catch (error: any) {
      logger.apiError('Erro ao criar agendamento público:', error);
      
      // Tratar erros específicos da API
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Erro ao criar agendamento',
          code: error.response.data.code
        };
      }
      
      return {
        success: false,
        message: error.message || 'Erro desconhecido ao criar agendamento'
      };
    }
  }
  
  /**
   * Verifica disponibilidade de horários para um barbeiro em uma data
   */
  static async checkAvailability(
    barbershopSlug: string,
    date: string,
    barberId: string
  ): Promise<AvailabilityResponse> {
    try {
      logger.apiInfo('Verificando disponibilidade', { barbershopSlug, date, barberId });
      
      if (!barbershopSlug || !date || !barberId) {
        throw new Error('Parâmetros obrigatórios não fornecidos');
      }
      
      const response = await ApiService.get<any>(
        `/api/public/${barbershopSlug}/appointments/availability?date=${date}&barberId=${barberId}`
      );
      
      logger.apiInfo('Disponibilidade verificada com sucesso', response);
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error: any) {
      logger.apiError('Erro ao verificar disponibilidade:', error);
      
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Erro ao verificar disponibilidade',
          code: error.response.data.code
        };
      }
      
      return {
        success: false,
        message: error.message || 'Erro desconhecido ao verificar disponibilidade'
      };
    }
  }
  
  /**
   * Valida dados do agendamento antes de enviar
   */
  static validateAppointmentData(data: PublicAppointmentData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar nome do cliente
    if (!data.clientName || data.clientName.trim().length < 2) {
      errors.push('Nome do cliente deve ter pelo menos 2 caracteres');
    }
    
    // Validar WhatsApp
    const cleanWhatsapp = data.wppclient.replace(/\D/g, '');
    if (!cleanWhatsapp || cleanWhatsapp.length < 10 || cleanWhatsapp.length > 15) {
      errors.push('Número de WhatsApp inválido');
    }
    
    // Validar serviço
    if (!data.serviceName || data.serviceName.trim().length < 2) {
      errors.push('Nome do serviço é obrigatório');
    }
    
    // Validar data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!data.date || !dateRegex.test(data.date)) {
      errors.push('Data deve estar no formato YYYY-MM-DD');
    } else {
      const appointmentDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        errors.push('Não é possível agendar para datas passadas');
      }
    }
    
    // Validar horário
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!data.time || !timeRegex.test(data.time)) {
      errors.push('Horário deve estar no formato HH:MM');
    }
    
    // Validar barbeiro
    if (!data.barberId || !data.barberName) {
      errors.push('Barbeiro é obrigatório');
    }
    
    // Validar preço
    if (data.price < 0) {
      errors.push('Preço não pode ser negativo');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Formata mensagem para WhatsApp
   */
  static formatWhatsappMessage(data: {
    clientName: string;
    serviceName: string;
    barberName: string;
    date: string;
    time: string;
    price: number;
  }): string {
    const formattedDate = new Date(data.date).toLocaleDateString('pt-BR');
    
    const message = `Olá! Gostaria de confirmar meu agendamento:

` +
      `👤 Nome: ${data.clientName}\n` +
      `✂️ Serviço: ${data.serviceName}\n` +
      `💇‍♂️ Barbeiro: ${data.barberName}\n` +
      `📅 Data: ${formattedDate}\n` +
      `🕐 Horário: ${data.time}\n` +
      `💰 Valor: R$ ${data.price.toFixed(2)}\n\n` +
      `Aguardo a confirmação. Obrigado!`;
    
    return encodeURIComponent(message);
  }
}

export default PublicAppointmentService;