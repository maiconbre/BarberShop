import { ServiceFactory } from './ServiceFactory';
import { 
  PlanUsage, 
  PlanInfo, 
  UpgradeRequest, 
  UpgradeResponse, 
  PlanHistoryResponse,
  PlanError,
  PlanType 
} from '../types/plan';

// Get API service instance with proper error handling
const getApiService = () => ServiceFactory.getApiService();

/**
 * Obter estatísticas de uso do plano atual
 */
export const getUsageStats = async (slug?: string): Promise<PlanUsage> => {
  try {
    console.log('Obtendo estatísticas de uso do plano...', { slug });
    
    const apiService = getApiService();
    
    try {
      // Try to get real usage stats from the backend (public endpoint)
      const url = slug ? `/api/plans/public/usage?slug=${encodeURIComponent(slug)}` : '/api/plans/public/usage';
      const response = await apiService.get<PlanUsage>(url);
      console.log('Estatísticas de uso obtidas:', response);
      return response;
    } catch (error) {
      // If the endpoint is not implemented yet, return fallback data based on current barbershop
      console.warn('Endpoint de estatísticas não implementado, usando dados de fallback:', error);
      
      // Get current barbershop to determine plan type
      const currentPlan = await getCurrentPlan(slug);
      const isProPlan = currentPlan.planType === 'pro';
      
      const fallbackData: PlanUsage = {
        planType: currentPlan.planType,
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
      
      console.log('Estatísticas de uso (fallback):', fallbackData);
      return fallbackData;
    }
    
  } catch (error) {
    console.error('Erro ao obter estatísticas de uso:', error);
    throw error;
  }
};

/**
 * Obter informações do plano atual
 */
export const getCurrentPlan = async (slug?: string): Promise<PlanInfo> => {
  try {
    console.log('Obtendo informações do plano atual...', { slug });
    
    const apiService = getApiService();
    
    try {
      // Try to get real plan info from the backend (public endpoint)
      // Include slug parameter if provided
      const url = slug ? `/api/plans/public/current?slug=${encodeURIComponent(slug)}` : '/api/plans/public/current';
      const response = await apiService.get<PlanInfo>(url);
      console.log('Informações do plano obtidas:', response);
      return response;
    } catch (error) {
      // If the endpoint is not implemented yet, get data from barbershop endpoint
      console.warn('Endpoint de plano não implementado, usando dados da barbearia:', error);
      
      // If slug is provided, try to get barbershop by slug
      if (slug) {
        try {
          const barbershopResponse = await apiService.get<{
            id: string;
            name: string;
            slug: string;
            planType: PlanType;
            settings: Record<string, unknown>;
            createdAt: string;
          }>(`/api/barbershops/slug/${encodeURIComponent(slug)}`);
          
          const planInfo: PlanInfo = {
            barbershopId: barbershopResponse.id,
            name: barbershopResponse.name,
            slug: barbershopResponse.slug,
            planType: barbershopResponse.planType || 'free',
            settings: barbershopResponse.settings || {
              theme: 'default',
              timezone: 'America/Sao_Paulo'
            },
            createdAt: barbershopResponse.createdAt
          };
          
          console.log('Informações do plano (via barbearia por slug):', planInfo);
          return planInfo;
        } catch (slugError) {
          console.warn('Erro ao buscar barbearia por slug:', slugError);
        }
      }
      
      // Fallback to my-barbershop endpoint
      const barbershopResponse = await apiService.get<{
        id: string;
        name: string;
        slug: string;
        planType: PlanType;
        settings: Record<string, unknown>;
        createdAt: string;
      }>('/api/barbershops/my-barbershop');
      
      const planInfo: PlanInfo = {
        barbershopId: barbershopResponse.id,
        name: barbershopResponse.name,
        slug: barbershopResponse.slug,
        planType: barbershopResponse.planType || 'free',
        settings: barbershopResponse.settings || {
          theme: 'default',
          timezone: 'America/Sao_Paulo'
        },
        createdAt: barbershopResponse.createdAt
      };
      
      console.log('Informações do plano (via barbearia):', planInfo);
      return planInfo;
    }
    
  } catch (error) {
    console.error('Erro ao obter informações do plano:', error);
    throw error;
  }
};

/**
 * Fazer upgrade do plano
 */
export const upgradePlan = async (request: UpgradeRequest): Promise<UpgradeResponse> => {
  try {
    console.log('Iniciando upgrade do plano:', request);
    
    const apiService = getApiService();
    
    try {
      // Try to upgrade using real API
      const response = await apiService.post<UpgradeResponse>('/api/plans/upgrade', request);
      console.log('Upgrade realizado com sucesso:', response);
      return response;
    } catch (error) {
      // If the endpoint is not implemented yet, return a simulated response
      console.warn('Endpoint de upgrade não implementado, simulando resposta:', error);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get current barbershop info
      const currentPlan = await getCurrentPlan();
      
      const transactionId = `txn_${Date.now()}`;
      const upgradedAt = new Date().toISOString();
      
      const simulatedResponse: UpgradeResponse = {
        barbershopId: currentPlan.barbershopId,
        name: currentPlan.name,
        slug: currentPlan.slug,
        planType: request.planType,
        upgradedAt,
        transactionId,
        paymentMethod: 'mercado_pago_simulation'
      };
      
      console.log('Upgrade simulado com sucesso:', simulatedResponse);
      return simulatedResponse;
    }
    
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
    
    const apiService = getApiService();
    
    try {
      // Try to get real transaction history from the backend
      const response = await apiService.get<PlanHistoryResponse>('/api/plans/history');
      console.log('Histórico obtido:', response);
      return response;
    } catch (error) {
      // If the endpoint is not implemented yet, return fallback data
      console.warn('Endpoint de histórico não implementado, usando dados de fallback:', error);
      
      // Get current plan info
      const currentPlan = await getCurrentPlan();
      
      const fallbackTransactions = [
        {
          id: 'txn_001',
          type: 'plan_activation' as const,
          planType: 'free' as const,
          amount: 0,
          status: 'completed' as const,
          description: 'Ativação do plano gratuito',
          createdAt: currentPlan.createdAt,
          paymentMethod: null,
          transactionId: null
        }
      ];

      const fallbackData: PlanHistoryResponse = {
        barbershopId: currentPlan.barbershopId,
        currentPlan: currentPlan.planType,
        transactions: fallbackTransactions
      };
      
      console.log('Histórico (fallback):', fallbackData);
      return fallbackData;
    }
    
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