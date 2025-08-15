import { CURRENT_ENV } from '../config/environmentConfig';
import axios from 'axios';

// Interfaces para o setup inicial
export interface InitialSetupData {
  barbershopId: string;
  adminUserId: string;
  services: {
    name: string;
    price: number;
    duration: number;
    description: string;
  }[];
}

export interface SetupResponse {
  success: boolean;
  message: string;
  data: {
    services: Array<{
      id: string;
      name: string;
      price: number;
      duration: number;
    }>;
    admin: {
      id: string;
      username: string;
      name: string;
    };
  };
}

// Configuração do axios
const axiosInstance = axios.create({
  timeout: 30000,
  baseURL: `${CURRENT_ENV.apiUrl}/api`
});

/**
 * Configurar estrutura inicial da barbearia após registro
 * Cria serviços básicos: Militar ($45) e Tesoura ($50)
 */
export const setupInitialBarbershopData = async (barbershopId: string, token: string): Promise<SetupResponse> => {
  try {
    console.log('Configurando estrutura inicial da barbearia:', barbershopId);

    // Serviços básicos padrão
    const defaultServices = [
      {
        name: 'Militar',
        price: 45,
        duration: 30,
        description: 'Corte militar clássico, prático e elegante'
      },
      {
        name: 'Tesoura',
        price: 50,
        duration: 45,
        description: 'Corte tradicional com tesoura, acabamento perfeito'
      }
    ];

    const response = await axiosInstance.post<SetupResponse>('/barbershops/setup-initial', {
      barbershopId,
      services: defaultServices
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Erro ao configurar estrutura inicial');
    }

    console.log('Estrutura inicial configurada com sucesso');
    return response.data;

  } catch (error: unknown) {
    console.error('Erro ao configurar estrutura inicial:', error);

    // Se o endpoint não existir ainda, simular sucesso com dados mock
    if ((error as { response?: { status: number } }).response?.status === 404) {
      console.log('Endpoint de setup não encontrado, simulando configuração inicial...');
      
      return {
        success: true,
        message: 'Estrutura inicial configurada (simulado)',
        data: {
          services: [
            { id: 'mock-service-1', name: 'Militar', price: 45, duration: 30 },
            { id: 'mock-service-2', name: 'Tesoura', price: 50, duration: 45 }
          ],
          admin: {
            id: 'mock-admin-1',
            username: 'admin',
            name: 'Administrador'
          }
        }
      };
    }

    // Tratar outros erros
    if ((error as { response?: { data?: { message?: string } } }).response?.data?.message) {
      throw new Error((error as { response: { data: { message: string } } }).response.data.message);
    }

    throw new Error('Erro ao configurar estrutura inicial da barbearia');
  }
};

/**
 * Verificar se o onboarding foi completado
 */
export const isOnboardingCompleted = (): boolean => {
  return localStorage.getItem('onboarding_completed') === 'true';
};

/**
 * Marcar onboarding como completado
 */
export const markOnboardingCompleted = (): void => {
  localStorage.setItem('onboarding_completed', 'true');
};

/**
 * Resetar status do onboarding (para desenvolvimento/testes)
 */
export const resetOnboardingStatus = (): void => {
  localStorage.removeItem('onboarding_completed');
};

/**
 * Verificar se é o primeiro acesso após registro
 */
export const isFirstAccess = (): boolean => {
  const firstAccess = localStorage.getItem('first_access');
  return firstAccess === 'true';
};

/**
 * Marcar como primeiro acesso (usado após registro)
 */
export const markFirstAccess = (): void => {
  localStorage.setItem('first_access', 'true');
};

/**
 * Limpar flag de primeiro acesso
 */
export const clearFirstAccess = (): void => {
  localStorage.removeItem('first_access');
};