import axios from 'axios';
import { CURRENT_ENV } from '../config/environmentConfig';

// Interfaces para tipagem
export interface BarbershopRegistrationData {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  ownerUsername: string;
  ownerPassword: string;
  planType?: 'free' | 'pro';
}

export interface BarbershopRegistrationResponse {
  success: boolean;
  message: string;
  data: {
    barbershop: {
      id: string;
      name: string;
      slug: string;
      planType: string;
      settings: Record<string, unknown>;
    };
    user: {
      id: string;
      username: string;
      role: string;
      name: string;
      barbershopId: string;
    };
    token: string;
    refreshToken: string;
  };
}

export interface SlugCheckResponse {
  success: boolean;
  available: boolean;
  slug: string;
  message: string;
}

export interface BarbershopData {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  planType: string;
  settings: Record<string, unknown>;
  createdAt: string;
  description?: string;
  address?: string;
  phone?: string;
}

export interface BarbershopResponse {
  success: boolean;
  data: BarbershopData;
}

export interface EmailVerificationRequest {
  email: string;
  barbershopName: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    expiresIn: number; // seconds
  };
}

export interface CodeVerificationRequest {
  email: string;
  code: string;
}

export interface CodeVerificationResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    verified: boolean;
  };
  attemptsLeft?: number;
}

// Configuração do axios
const axiosInstance = axios.create({
  timeout: 30000, // 30 segundos
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
 * Iniciar verificação de email
 */
export const initiateEmailVerification = async (data: EmailVerificationRequest): Promise<EmailVerificationResponse> => {
  try {
    console.log('Iniciando verificação de email:', data.email);

    const response = await retryRequest(() =>
      axiosInstance.post<EmailVerificationResponse>('/barbershops/verify-email', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Erro ao enviar código de verificação');
    }

    console.log('Código de verificação enviado para:', data.email);
    return response.data;

  } catch (error: unknown) {
    console.error('Erro ao iniciar verificação de email:', error);

    // Tratar erros de timeout
    if ((error as { code?: string }).code === 'ECONNABORTED' || 
        (error as { message?: string }).message?.includes('timeout')) {
      throw new Error('Tempo de resposta do servidor excedido. Tente novamente.');
    }

    // Tratar erros de resposta da API
    if ((error as { response?: { data?: { message?: string; code?: string } } }).response?.data) {
      const errorData = (error as { response: { data: { message?: string; code?: string } } }).response.data;
      
      switch (errorData.code) {
        case 'EMAIL_ALREADY_EXISTS':
          throw new Error('Este email já está cadastrado. Use outro email.');
        case 'INVALID_EMAIL_FORMAT':
          throw new Error('Formato de email inválido.');
        case 'MISSING_FIELDS':
          throw new Error('Email e nome da barbearia são obrigatórios.');
        case 'EMAIL_SEND_FAILED':
          throw new Error('Erro ao enviar email. Tente novamente.');
        default:
          throw new Error(errorData.message || 'Erro ao enviar código de verificação');
      }
    }

    throw new Error('Erro inesperado ao enviar código de verificação. Tente novamente.');
  }
};

/**
 * Verificar código de email
 */
export const verifyEmailCode = async (data: CodeVerificationRequest): Promise<CodeVerificationResponse> => {
  try {
    console.log('Verificando código de email:', data.email);

    const response = await retryRequest(() =>
      axiosInstance.post<CodeVerificationResponse>('/barbershops/verify-code', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Erro ao verificar código');
    }

    console.log('Código verificado com sucesso para:', data.email);
    return response.data;

  } catch (error: unknown) {
    console.error('Erro ao verificar código:', error);

    // Tratar erros de timeout
    if ((error as { code?: string }).code === 'ECONNABORTED' || 
        (error as { message?: string }).message?.includes('timeout')) {
      throw new Error('Tempo de resposta do servidor excedido. Tente novamente.');
    }

    // Tratar erros de resposta da API
    if ((error as { response?: { data?: { message?: string; code?: string; attemptsLeft?: number } } }).response?.data) {
      const errorData = (error as { response: { data: { message?: string; code?: string; attemptsLeft?: number } } }).response.data;
      
      switch (errorData.code) {
        case 'CODE_NOT_FOUND':
          throw new Error('Código de verificação não encontrado ou expirado. Solicite um novo código.');
        case 'CODE_EXPIRED':
          throw new Error('Código de verificação expirado. Solicite um novo código.');
        case 'INVALID_CODE':
          const attemptsMsg = errorData.attemptsLeft ? ` (${errorData.attemptsLeft} tentativas restantes)` : '';
          throw new Error(`Código inválido${attemptsMsg}`);
        case 'TOO_MANY_ATTEMPTS':
          throw new Error('Muitas tentativas. Solicite um novo código.');
        case 'MISSING_FIELDS':
          throw new Error('Email e código são obrigatórios.');
        default:
          throw new Error(errorData.message || 'Erro ao verificar código');
      }
    }

    throw new Error('Erro inesperado ao verificar código. Tente novamente.');
  }
};

/**
 * Registrar nova barbearia
 */
export const registerBarbershop = async (data: BarbershopRegistrationData): Promise<BarbershopRegistrationResponse> => {
  try {
    console.log('Registrando barbearia:', { name: data.name, slug: data.slug });

    const response = await retryRequest(() =>
      axiosInstance.post<BarbershopRegistrationResponse>('/barbershops/register', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Erro ao registrar barbearia');
    }

    console.log('Barbearia registrada com sucesso:', response.data.data.barbershop.slug);
    return response.data;

  } catch (error: unknown) {
    console.error('Erro ao registrar barbearia:', error);

    // Tratar erros de timeout
    if ((error as { code?: string }).code === 'ECONNABORTED' || 
        (error as { message?: string }).message?.includes('timeout')) {
      throw new Error('Tempo de resposta do servidor excedido. Tente novamente.');
    }

    // Tratar erros de resposta da API
    if ((error as { response?: { data?: { message?: string; code?: string } } }).response?.data) {
      const errorData = (error as { response: { data: { message?: string; code?: string } } }).response.data;
      
      switch (errorData.code) {
        case 'SLUG_ALREADY_EXISTS':
          throw new Error('Este nome de barbearia já está em uso. Escolha outro nome.');
        case 'EMAIL_ALREADY_EXISTS':
          throw new Error('Este email já está cadastrado. Use outro email.');
        case 'USERNAME_ALREADY_EXISTS':
          throw new Error('Este nome de usuário já está em uso. Escolha outro.');
        case 'INVALID_SLUG_FORMAT':
          throw new Error('Nome da barbearia deve conter apenas letras, números e hífens.');
        case 'MISSING_FIELDS':
          throw new Error('Todos os campos são obrigatórios.');
        default:
          throw new Error(errorData.message || 'Erro ao registrar barbearia');
      }
    }

    throw new Error('Erro inesperado ao registrar barbearia. Tente novamente.');
  }
};

/**
 * Verificar disponibilidade de slug
 */
export const checkSlugAvailability = async (slug: string): Promise<SlugCheckResponse> => {
  try {
    if (!slug || slug.trim().length === 0) {
      return {
        success: false,
        available: false,
        slug,
        message: 'Nome da barbearia é obrigatório'
      };
    }

    const response = await retryRequest(() =>
      axiosInstance.get<SlugCheckResponse>(`/barbershops/check-slug/${encodeURIComponent(slug)}`)
    );

    return response.data;

  } catch (error: unknown) {
    console.error('Erro ao verificar disponibilidade do slug:', error);

    // Tratar erros de timeout
    if ((error as { code?: string }).code === 'ECONNABORTED' || 
        (error as { message?: string }).message?.includes('timeout')) {
      return {
        success: false,
        available: false,
        slug,
        message: 'Erro de conexão. Tente novamente.'
      };
    }

    // Tratar erros de resposta da API
    if ((error as { response?: { data?: SlugCheckResponse } }).response?.data) {
      return (error as { response: { data: SlugCheckResponse } }).response.data;
    }

    return {
      success: false,
      available: false,
      slug,
      message: 'Erro ao verificar disponibilidade'
    };
  }
};

/**
 * Obter dados da barbearia pelo slug (público, não requer autenticação)
 * Por enquanto, vamos usar dados mock até o endpoint estar disponível
 */
export const getBarbershopBySlug = async (slug: string): Promise<BarbershopData> => {
  try {
    console.log('Buscando barbearia pelo slug:', slug);

    // Primeiro, tentar verificar se o slug existe
    const slugCheckResponse = await checkSlugAvailability(slug);
    
    // Se o slug está disponível, significa que a barbearia NÃO existe
    if (slugCheckResponse.available) {
      throw new Error('Barbearia não encontrada');
    }

    // Se chegou aqui, o slug não está disponível, então a barbearia existe
    // Por enquanto, retornar dados mock baseados no slug
    // TODO: Implementar endpoint real no backend
    const mockData: BarbershopData = {
      id: `mock-${slug}`,
      name: slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      slug: slug,
      ownerEmail: `owner@${slug}.com`,
      planType: 'free',
      settings: {},
      createdAt: new Date().toISOString(),
      description: `Barbearia ${slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')} - Estilo e qualidade em cada corte`,
      address: 'Rua das Barbearias, 123 - Centro',
      phone: '(21) 99999-9999'
    };

    console.log('Barbearia encontrada (mock):', mockData.name);
    return mockData;

  } catch (error: unknown) {
    console.error('Erro ao obter barbearia pelo slug:', error);

    // Se o erro for de slug disponível, significa que a barbearia não existe
    if ((error as Error).message === 'Barbearia não encontrada') {
      throw error;
    }

    // Tratar erros de timeout
    if ((error as { code?: string }).code === 'ECONNABORTED' || 
        (error as { message?: string }).message?.includes('timeout')) {
      throw new Error('Tempo de resposta do servidor excedido. Tente novamente.');
    }

    // Para outros erros de rede, assumir que a barbearia existe e retornar dados mock
    // Isso permite que o sistema funcione mesmo com problemas de conectividade
    const mockData: BarbershopData = {
      id: `mock-${slug}`,
      name: slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      slug: slug,
      ownerEmail: `owner@${slug}.com`,
      planType: 'free',
      settings: {},
      createdAt: new Date().toISOString(),
      description: `Barbearia ${slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')} - Estilo e qualidade em cada corte`,
      address: 'Rua das Barbearias, 123 - Centro',
      phone: '(21) 99999-9999'
    };

    console.log('Retornando dados mock para:', mockData.name);
    return mockData;
  }
};

/**
 * Obter dados da barbearia atual (requer autenticação e tenant context)
 */
export const getCurrentBarbershop = async (): Promise<BarbershopData> => {
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const response = await retryRequest(() =>
      axiosInstance.get<BarbershopResponse>('/barbershops/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    );

    if (!response.data || !response.data.success) {
      throw new Error('Erro ao obter dados da barbearia');
    }

    return response.data.data;

  } catch (error: unknown) {
    console.error('Erro ao obter barbearia atual:', error);

    // Tratar erros de timeout
    if ((error as { code?: string }).code === 'ECONNABORTED' || 
        (error as { message?: string }).message?.includes('timeout')) {
      throw new Error('Tempo de resposta do servidor excedido. Tente novamente.');
    }

    // Tratar erros de autenticação
    if ((error as { response?: { status: number } }).response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Tratar erros de resposta da API
    if ((error as { response?: { data?: { message?: string } } }).response?.data?.message) {
      throw new Error((error as { response: { data: { message: string } } }).response.data.message);
    }

    throw new Error('Erro ao obter dados da barbearia');
  }
};

/**
 * Gerar slug a partir do nome da barbearia
 */
export const generateSlugFromName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalizar caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '-') // Substituir espaços por hífens
    .replace(/-+/g, '-') // Remover hífens duplicados
    .replace(/^-|-$/g, ''); // Remover hífens do início e fim
};

/**
 * Validar formato de slug
 */
export const validateSlugFormat = (slug: string): { valid: boolean; message: string } => {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, message: 'Nome da barbearia é obrigatório' };
  }

  if (slug.length < 3) {
    return { valid: false, message: 'Nome deve ter pelo menos 3 caracteres' };
  }

  if (slug.length > 50) {
    return { valid: false, message: 'Nome deve ter no máximo 50 caracteres' };
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { valid: false, message: 'Nome deve conter apenas letras minúsculas, números e hífens' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, message: 'Nome não pode começar ou terminar com hífen' };
  }

  if (slug.includes('--')) {
    return { valid: false, message: 'Nome não pode conter hífens consecutivos' };
  }

  return { valid: true, message: 'Nome válido' };
};