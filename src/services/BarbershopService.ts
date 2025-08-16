import { ServiceFactory } from './ServiceFactory';

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

export interface EmailCodeVerificationRequest {
  email: string;
  code: string;
}

export interface EmailCodeVerificationResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    verified: boolean;
  };
}

// Get API service instance with proper error handling
const getApiService = () => ServiceFactory.getApiService();

/**
 * Iniciar processo de verificação de email
 */
export const initiateEmailVerification = async (data: EmailVerificationRequest): Promise<EmailVerificationResponse> => {
  try {
    console.log('Iniciando verificação de email:', data.email);

    const apiService = getApiService();
    const response = await apiService.post<EmailVerificationResponse>('/api/barbershops/verify-email', data);

    if (!response || !response.success) {
      throw new Error(response?.message || 'Erro ao enviar código de verificação');
    }

    console.log('Código de verificação enviado para:', data.email);
    return response;

  } catch (error: unknown) {
    console.error('Erro ao iniciar verificação de email:', error);

    // The ApiService already handles timeout and network errors with proper retry logic
    // We just need to handle specific business logic errors
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('EMAIL_ALREADY_EXISTS')) {
        throw new Error('Este email já está cadastrado. Use outro email.');
      }
      if (message.includes('INVALID_EMAIL_FORMAT')) {
        throw new Error('Formato de email inválido.');
      }
      if (message.includes('MISSING_FIELDS')) {
        throw new Error('Email e nome da barbearia são obrigatórios.');
      }
      if (message.includes('EMAIL_SEND_FAILED')) {
        throw new Error('Erro ao enviar email. Tente novamente.');
      }
      
      // Re-throw the error as-is if it's already user-friendly
      throw error;
    }

    throw new Error('Erro inesperado ao enviar código de verificação. Tente novamente.');
  }
};

/**
 * Verificar código de email
 */
export const verifyEmailCode = async (data: EmailCodeVerificationRequest): Promise<EmailCodeVerificationResponse> => {
  try {
    console.log('Verificando código de email:', data.email);

    const apiService = getApiService();
    const response = await apiService.post<EmailCodeVerificationResponse>('/api/barbershops/verify-code', data);

    if (!response || !response.success) {
      throw new Error(response?.message || 'Erro ao verificar código');
    }

    console.log('Código verificado com sucesso para:', data.email);
    return response;

  } catch (error: unknown) {
    console.error('Erro ao verificar código:', error);

    // The ApiService already handles timeout and network errors with proper retry logic
    // We just need to handle specific business logic errors
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('CODE_NOT_FOUND')) {
        throw new Error('Código de verificação não encontrado ou expirado. Solicite um novo código.');
      }
      if (message.includes('CODE_EXPIRED')) {
        throw new Error('Código de verificação expirado. Solicite um novo código.');
      }
      if (message.includes('INVALID_CODE')) {
        // Extract attempts left if available
        const attemptsMatch = message.match(/(\d+) tentativas restantes/);
        const attemptsMsg = attemptsMatch ? ` (${attemptsMatch[1]} tentativas restantes)` : '';
        throw new Error(`Código inválido${attemptsMsg}`);
      }
      if (message.includes('TOO_MANY_ATTEMPTS')) {
        throw new Error('Muitas tentativas. Solicite um novo código.');
      }
      if (message.includes('MISSING_FIELDS')) {
        throw new Error('Email e código são obrigatórios.');
      }
      
      // Re-throw the error as-is if it's already user-friendly
      throw error;
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

    const apiService = getApiService();
    const response = await apiService.post<BarbershopRegistrationResponse>('/api/barbershops/register', data);

    if (!response || !response.success) {
      throw new Error(response?.message || 'Erro ao registrar barbearia');
    }

    console.log('Barbearia registrada com sucesso:', response.data.barbershop.slug);
    return response;

  } catch (error: unknown) {
    console.error('Erro ao registrar barbearia:', error);

    // The ApiService already handles timeout and network errors with proper retry logic
    // We just need to handle specific business logic errors
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('SLUG_ALREADY_EXISTS')) {
        throw new Error('Este nome de barbearia já está em uso. Escolha outro nome.');
      }
      if (message.includes('EMAIL_ALREADY_EXISTS')) {
        throw new Error('Este email já está cadastrado. Use outro email.');
      }
      if (message.includes('USERNAME_ALREADY_EXISTS')) {
        throw new Error('Este nome de usuário já está em uso. Escolha outro.');
      }
      if (message.includes('INVALID_SLUG_FORMAT')) {
        throw new Error('Nome da barbearia deve conter apenas letras, números e hífens.');
      }
      if (message.includes('MISSING_FIELDS')) {
        throw new Error('Todos os campos são obrigatórios.');
      }
      
      // Re-throw the error as-is if it's already user-friendly
      throw error;
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

    const apiService = getApiService();
    const response = await apiService.get<SlugCheckResponse>(`/api/barbershops/check-slug/${encodeURIComponent(slug)}`);

    return response;

  } catch (error: unknown) {
    console.error('Erro ao verificar disponibilidade do slug:', error);

    // The ApiService already handles timeout and network errors with proper retry logic
    // For this endpoint, we want to return a safe response on any error
    return {
      success: false,
      available: false,
      slug,
      message: error instanceof Error ? error.message : 'Erro ao verificar disponibilidade'
    };
  }
};

/**
 * Obter dados da barbearia pelo slug (público, não requer autenticação)
 */
export const getBarbershopBySlug = async (slug: string): Promise<BarbershopData> => {
  try {
    console.log('Buscando barbearia pelo slug:', slug);

    // Validar formato do slug
    const slugValidation = validateSlugFormat(slug);
    if (!slugValidation.valid) {
      throw new Error(`Slug inválido: ${slugValidation.message}`);
    }

    const apiService = getApiService();
    const response = await apiService.get<BarbershopResponse>(`/api/barbershops/slug/${encodeURIComponent(slug)}`);

    if (!response || !response.success) {
      throw new Error(response?.message || 'Barbearia não encontrada');
    }

    console.log('Barbearia encontrada:', response.data.name);
    return response.data;

  } catch (error: unknown) {
    console.error('Erro ao obter barbearia pelo slug:', error);

    // Re-throw validation errors
    if (error instanceof Error && error.message?.includes('Slug inválido')) {
      throw error;
    }

    // The ApiService already handles timeout and network errors with proper retry logic
    // We just need to handle specific business logic errors
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('BARBERSHOP_NOT_FOUND') || message.includes('404')) {
        throw new Error('Barbearia não encontrada');
      }
      if (message.includes('MISSING_SLUG')) {
        throw new Error('Slug é obrigatório');
      }
      
      // Re-throw the error as-is if it's already user-friendly
      throw error;
    }

    throw new Error('Erro ao conectar com o servidor. Verifique sua conexão.');
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

    const apiService = getApiService();
    const response = await apiService.get<BarbershopResponse>('/api/barbershops/my-barbershop');

    if (!response || !response.success) {
      throw new Error('Erro ao obter dados da barbearia');
    }

    return response.data;

  } catch (error: unknown) {
    console.error('Erro ao obter barbearia atual:', error);

    // The ApiService already handles timeout, network errors, and 401 authentication errors
    // We just need to handle specific business logic errors
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('401') || message.includes('Unauthorized')) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (message.includes('404') || message.includes('Not Found')) {
        throw new Error('Usuário não possui barbearia associada');
      }
      
      // Re-throw the error as-is if it's already user-friendly
      throw error;
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