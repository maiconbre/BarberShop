import { CURRENT_ENV } from '../config/environmentConfig';
import { 
  PlanUsage, 
  PlanInfo, 
  UpgradeRequest, 
  UpgradeResponse, 
  PlanHistoryResponse,
  PlanError,
  PlanType 
} from '../types/plan';

// Mock storage for plan state (in real app, this would be in backend)
let mockPlanState: {
  planType: PlanType;
  upgradedAt?: string;
  transactionId?: string;
} = {
  planType: 'free'
};

// Configuração do serviço
const API_BASE_URL = `${CURRENT_ENV.apiUrl}/api`;

/**
 * Fazer requisição autenticada para a API
 * Currently unused as we're using mock data, but kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const makeAuthenticatedRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Tratar erros específicos de plano
    if (errorData.code) {
      const planError: PlanError = {
        code: errorData.code,
        message: errorData.message || 'Erro na operação do plano',
        data: errorData.data
      };
      throw planError;
    }
    
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
};

/**
 * Obter estatísticas de uso do plano atual
 */
export const getUsageStats = async (): Promise<PlanUsage> => {
  try {
    console.log('Obtendo estatísticas de uso do plano...');
    
    // For now, return mock data since the backend endpoint is not implemented yet
    // TODO: Replace with real API call when backend is ready
    const isProPlan = mockPlanState.planType === 'pro';
    
    const mockData: PlanUsage = {
      planType: mockPlanState.planType,
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
    };
    
    console.log('Estatísticas de uso obtidas (mock):', mockData);
    return mockData;
    
  } catch (error) {
    console.error('Erro ao obter estatísticas de uso:', error);
    throw error;
  }
};

/**
 * Obter informações do plano atual
 */
export const getCurrentPlan = async (): Promise<PlanInfo> => {
  try {
    console.log('Obtendo informações do plano atual...');
    
    // For now, return mock data since the backend endpoint is not implemented yet
    // TODO: Replace with real API call when backend is ready
    const mockData: PlanInfo = {
      barbershopId: 'mock-barbershop-id',
      name: 'Barbearia Teste',
      slug: 'barbearia-teste',
      planType: mockPlanState.planType,
      settings: {
        theme: 'default',
        timezone: 'America/Sao_Paulo'
      },
      createdAt: new Date().toISOString()
    };
    
    console.log('Informações do plano obtidas (mock):', mockData);
    return mockData;
    
  } catch (error) {
    console.error('Erro ao obter informações do plano:', error);
    throw error;
  }
};

/**
 * Fazer upgrade do plano (simulação de pagamento)
 */
export const upgradePlan = async (request: UpgradeRequest): Promise<UpgradeResponse> => {
  try {
    console.log('Iniciando upgrade do plano:', request);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update mock state
    const transactionId = `txn_${Date.now()}`;
    const upgradedAt = new Date().toISOString();
    
    mockPlanState = {
      planType: request.planType,
      upgradedAt,
      transactionId
    };
    
    // For now, return mock success response since the backend endpoint is not implemented yet
    // TODO: Replace with real API call when backend is ready
    const mockResponse: UpgradeResponse = {
      barbershopId: 'mock-barbershop-id',
      name: 'Barbearia Teste',
      slug: 'barbearia-teste',
      planType: request.planType,
      upgradedAt,
      transactionId,
      paymentMethod: 'mercado_pago_simulation'
    };
    
    console.log('Upgrade realizado com sucesso (mock):', mockResponse);
    return mockResponse;
    
  } catch (error) {
    console.error('Erro ao fazer upgrade do plano:', error);
    throw error;
  }
};

/**
 * Obter histórico de transações
 */
export const getPlanHistory = async (): Promise<PlanHistoryResponse> => {
  try {
    console.log('Obtendo histórico de transações...');
    
    // For now, return mock data since the backend endpoint is not implemented yet
    // TODO: Replace with real API call when backend is ready
    const transactions = [
      {
        id: 'txn_001',
        type: 'plan_activation' as const,
        planType: 'free' as const,
        amount: 0,
        status: 'completed' as const,
        description: 'Ativação do plano gratuito',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: null,
        transactionId: null
      }
    ];

    // Add upgrade transaction if it exists
    if (mockPlanState.planType === 'pro' && mockPlanState.upgradedAt && mockPlanState.transactionId) {
      transactions.push({
        id: mockPlanState.transactionId,
        type: 'plan_upgrade' as const,
        planType: 'pro' as const,
        amount: 39.90,
        status: 'completed' as const,
        description: 'Upgrade para Plano Pro',
        createdAt: mockPlanState.upgradedAt,
        paymentMethod: 'mercado_pago_simulation',
        transactionId: mockPlanState.transactionId
      });
    }

    const mockData: PlanHistoryResponse = {
      barbershopId: 'mock-barbershop-id',
      currentPlan: mockPlanState.planType,
      transactions
    };
    
    console.log('Histórico obtido (mock):', mockData);
    return mockData;
    
  } catch (error) {
    console.error('Erro ao obter histórico de transações:', error);
    throw error;
  }
};

/**
 * Verificar se uma operação pode ser realizada baseada nos limites do plano
 */
export const checkPlanLimits = async (feature: 'barbers' | 'appointments'): Promise<boolean> => {
  try {
    const usage = await getUsageStats();
    
    switch (feature) {
      case 'barbers':
        return usage.usage.barbers.remaining > 0;
      case 'appointments':
        return usage.usage.appointments.remaining > 0;
      default:
        return true;
    }
    
  } catch (error) {
    console.error('Erro ao verificar limites do plano:', error);
    // Em caso de erro, permitir a operação (fail-safe)
    return true;
  }
};

/**
 * Obter mensagem de limite atingido
 */
export const getLimitMessage = (error: PlanError): string => {
  switch (error.code) {
    case 'BARBER_LIMIT_EXCEEDED':
      return `Limite de barbeiros atingido (${error.data?.current}/${error.data?.limit}). Faça upgrade para o plano Pro para adicionar mais barbeiros.`;
    case 'APPOINTMENT_LIMIT_EXCEEDED':
      return `Limite de agendamentos mensais atingido (${error.data?.current}/${error.data?.limit}). Faça upgrade para o plano Pro para agendamentos ilimitados.`;
    default:
      return error.message || 'Limite do plano atingido';
  }
};

/**
 * Verificar se deve mostrar notificação de upgrade
 */
export const shouldShowUpgradeNotification = (usage: PlanUsage): boolean => {
  return usage.upgradeRecommended && usage.planType === 'free';
};

/**
 * Obter porcentagem de uso para exibição
 */
export const getUsagePercentage = (current: number, limit: number): number => {
  if (limit === Infinity || limit === 0) return 0;
  return Math.min((current / limit) * 100, 100);
};

/**
 * Formatar valor monetário
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formatar data para exibição
 */
export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};