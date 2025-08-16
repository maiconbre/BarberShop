import axios from 'axios';
import { CURRENT_ENV } from '../config/environmentConfig';
import { BarbershopConfiguration, BarbershopUpdateData, BarbershopUpdateResponse } from '../types/barbershop';

// Configuração do axios
const axiosInstance = axios.create({
  timeout: 30000,
  baseURL: `${CURRENT_ENV.apiUrl}/api`
});

// Função para retry de requisições
const retryRequest = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries === 0) throw error;
    
    const isTimeoutError = (error as { code?: string }).code === 'ECONNABORTED' ||
                          (error as { message?: string }).message?.includes('timeout');
    
    if (isTimeoutError) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Obter configurações da barbearia atual
 */
export const getCurrentBarbershopSettings = async (): Promise<BarbershopConfiguration> => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await retryRequest(() =>
      axiosInstance.get<BarbershopUpdateResponse>('/barbershops/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    );

    if (!response.data || !response.data.success) {
      throw new Error('Erro ao obter configurações da barbearia');
    }

    return response.data.data;

  } catch (error: unknown) {
    console.error('Erro ao obter configurações da barbearia:', error);

    // Tratar erros de timeout
    if ((error as { code?: string }).code === 'ECONNABORTED' || 
        (error as { message?: string }).message?.includes('timeout')) {
      throw new Error('Tempo de resposta do servidor excedido. Tente novamente.');
    }

    // Tratar erros de autenticação
    if ((error as { response?: { status: number } }).response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Tratar erro de permissão
    if ((error as { response?: { status: number } }).response?.status === 403) {
      throw new Error('Você não tem permissão para acessar essas configurações.');
    }

    // Tratar erro de barbearia não encontrada
    if ((error as { response?: { status: number } }).response?.status === 404) {
      throw new Error('Barbearia não encontrada.');
    }

    // Tratar erros de resposta da API
    if ((error as { response?: { data?: { message?: string } } }).response?.data?.message) {
      throw new Error((error as { response: { data: { message: string } } }).response.data.message);
    }

    throw new Error('Erro ao obter configurações da barbearia');
  }
};

/**
 * Atualizar configurações da barbearia
 */
export const updateBarbershopSettings = async (updateData: BarbershopUpdateData): Promise<BarbershopConfiguration> => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    console.log('Atualizando configurações da barbearia:', updateData);

    const response = await retryRequest(() =>
      axiosInstance.put<BarbershopUpdateResponse>('/barbershops/current', updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Erro ao atualizar configurações da barbearia');
    }

    console.log('Configurações atualizadas com sucesso');
    return response.data.data;

  } catch (error: unknown) {
    console.error('Erro ao atualizar configurações da barbearia:', error);

    // Tratar erros de timeout
    if ((error as { code?: string }).code === 'ECONNABORTED' || 
        (error as { message?: string }).message?.includes('timeout')) {
      throw new Error('Tempo de resposta do servidor excedido. Tente novamente.');
    }

    // Tratar erros de autenticação
    if ((error as { response?: { status: number } }).response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Tratar erro de permissão
    if ((error as { response?: { status: number } }).response?.status === 403) {
      throw new Error('Apenas administradores podem atualizar configurações da barbearia.');
    }

    // Tratar erro de barbearia não encontrada
    if ((error as { response?: { status: number } }).response?.status === 404) {
      throw new Error('Barbearia não encontrada.');
    }

    // Tratar erros de resposta da API
    if ((error as { response?: { data?: { message?: string; code?: string } } }).response?.data) {
      const errorData = (error as { response: { data: { message?: string; code?: string } } }).response.data;
      
      switch (errorData.code) {
        case 'ADMIN_REQUIRED':
          throw new Error('Apenas administradores podem atualizar configurações da barbearia.');
        case 'NO_UPDATE_DATA':
          throw new Error('Nenhum dado para atualizar.');
        case 'TENANT_CONTEXT_MISSING':
          throw new Error('Contexto da barbearia não encontrado. Tente recarregar a página.');
        default:
          throw new Error(errorData.message || 'Erro ao atualizar configurações da barbearia');
      }
    }

    throw new Error('Erro inesperado ao atualizar configurações da barbearia. Tente novamente.');
  }
};

/**
 * Upload de logo da barbearia (usando Supabase storage)
 */
export const uploadBarbershopLogo = async (file: File): Promise<string> => {
  try {
    // Validar arquivo
    if (!file) {
      throw new Error('Arquivo é obrigatório');
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.');
    }

    // Validar tamanho (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 2MB.');
    }

    // TODO: Implementar upload para Supabase storage
    // Por enquanto, retornar URL mock
    const mockUrl = `https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=${encodeURIComponent(file.name.substring(0, 2).toUpperCase())}`;
    
    console.log('Upload de logo simulado:', file.name);
    
    // Simular delay de upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockUrl;

  } catch (error: unknown) {
    console.error('Erro ao fazer upload do logo:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erro inesperado ao fazer upload do logo');
  }
};

/**
 * Validar configurações antes de salvar
 */
export const validateBarbershopSettings = (settings: BarbershopUpdateData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar nome
  if (settings.name !== undefined) {
    if (!settings.name || settings.name.trim().length === 0) {
      errors.push('Nome da barbearia é obrigatório');
    } else if (settings.name.trim().length < 2) {
      errors.push('Nome da barbearia deve ter pelo menos 2 caracteres');
    } else if (settings.name.trim().length > 100) {
      errors.push('Nome da barbearia deve ter no máximo 100 caracteres');
    }
  }

  // Validar horários de funcionamento
  if (settings.settings?.workingHours) {
    const workingHours = settings.settings.workingHours;
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const [day, hours] of Object.entries(workingHours)) {
      if (!validDays.includes(day)) {
        errors.push(`Dia inválido: ${day}`);
        continue;
      }

      if (hours.closed) {
        continue; // Dia fechado é válido
      }

      if (!hours.start || !hours.end) {
        errors.push(`Horário de funcionamento incompleto para ${day}`);
        continue;
      }

      // Validar formato de horário (HH:mm)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(hours.start)) {
        errors.push(`Horário de início inválido para ${day}: ${hours.start}`);
      }
      if (!timeRegex.test(hours.end)) {
        errors.push(`Horário de fim inválido para ${day}: ${hours.end}`);
      }

      // Validar se horário de início é antes do fim
      if (hours.start && hours.end && hours.start >= hours.end) {
        errors.push(`Horário de início deve ser antes do horário de fim para ${day}`);
      }
    }
  }

  // Validar cores de branding
  if (settings.settings?.branding) {
    const branding = settings.settings.branding;
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (branding.primaryColor && !colorRegex.test(branding.primaryColor)) {
      errors.push('Cor primária deve estar no formato hexadecimal (#RRGGBB)');
    }
    
    if (branding.secondaryColor && !colorRegex.test(branding.secondaryColor)) {
      errors.push('Cor secundária deve estar no formato hexadecimal (#RRGGBB)');
    }
  }

  // Validar informações de contato
  if (settings.settings?.contact) {
    const contact = settings.settings.contact;
    
    if (contact.phone) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(contact.phone)) {
        errors.push('Telefone deve estar no formato (XX) XXXXX-XXXX');
      }
    }
    
    if (contact.website) {
      try {
        new URL(contact.website);
      } catch {
        errors.push('URL do website inválida');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};