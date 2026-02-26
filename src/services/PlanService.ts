import ApiService from './ApiService';
import { 
  getBarbershopBySlug, 
  getCurrentBarbershop 
} from './BarbershopService';
import { 
  PlanUsage, 
  PlanInfo, 
  UpgradeRequest, 
  UpgradeResponse, 
  PlanHistoryResponse,
  PlanError,
  PlanType 
} from '../types/plan';
import { barbershopService } from './supabaseBarbershop';

// Helper removed, using ApiService directly


/**
 * Obter estatísticas de uso do plano atual
 */
export const getUsageStats = async (slug?: string): Promise<PlanUsage> => {
  try {
    console.log('Obtendo estatísticas de uso do plano...', { slug });
    
    // Fallback imediato para dados locais, pois o backend /api ainda não existe
    // Se no futuro existir, podemos descomentar o bloco try/catch abaixo
    /*
    try {
      // Try to get real usage stats from the backend (public endpoint)
      const url = slug ? `/api/plans/public/usage?slug=${encodeURIComponent(slug)}` : '/api/plans/public/usage';
      const response = await ApiService.get<PlanUsage>(url);
      console.log('Estatísticas de uso obtidas:', response);
      return response;
    } catch (error) {
       // ...
    }
    */

    // Simulação de delay de rede
    // await new Promise(resolve => setTimeout(resolve, 500));
      
    // Get current barbershop to determine plan type
    const currentPlan = await getCurrentPlan(slug);
    const planType = currentPlan.planType || 'free';
      
    // Definir limites baseados no plano
    const limits = {
      free: { barbers: 1, appointments: 15, services: Infinity, storage: 100 },
      start: { barbers: 1, appointments: 60, services: Infinity, storage: 500 },
      pro: { barbers: 6, appointments: 1000, services: Infinity, storage: 1024 }
    };
    
    // Obter limites do plano atual (fallback para free)
    const currentLimits = limits[planType as keyof typeof limits] || limits.free;

    // Obter barbeiros reais via Supabase
    let realBarberCount = 1;
    let realAppointmentCount = 0;
    
    try {
        const { barbers } = await barbershopService.getTenantBarbers();
        if (barbers) {
            realBarberCount = barbers.length;
        }
        
        // Se a RPC falhar ou retornar 404/406, capturamos aqui para não quebrar o dashboard
        try {
            const { appointments } = await barbershopService.getTenantAppointments();
            if (appointments) {
                realAppointmentCount = appointments.length;
            }
        } catch (innerError) {
            console.warn('RPC de agendamentos indisponível ou erro de acesso:', innerError);
        }
    } catch (e) {
        console.warn('Erro ao buscar dados reais para limites, usando fallbacks:', e);
    }

    const fallbackData: PlanUsage = {
        planType: planType,
        limits: {
          barbers: currentLimits.barbers,
          appointments_per_month: currentLimits.appointments,
          services: currentLimits.services,
          storage_mb: currentLimits.storage
        },
        usage: {
          barbers: {
            current: realBarberCount,
            limit: currentLimits.barbers,
            remaining: Math.max(0, currentLimits.barbers - realBarberCount),
            percentage: getUsagePercentage(realBarberCount, currentLimits.barbers),
            nearLimit: realBarberCount >= currentLimits.barbers
          },
          appointments: {
            current: realAppointmentCount,
            limit: currentLimits.appointments,
            remaining: Math.max(0, currentLimits.appointments - realAppointmentCount),
            percentage: getUsagePercentage(realAppointmentCount, currentLimits.appointments),
            nearLimit: (realAppointmentCount / currentLimits.appointments) > 0.8
          }
        },
        upgradeRecommended: (realAppointmentCount / currentLimits.appointments) > 0.8,
        upgradeRequired: (realAppointmentCount >= currentLimits.appointments)
    };
      
    console.log('Estatísticas de uso (local):', fallbackData);
    return fallbackData;

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
    
    // Usar diretamente o BarbershopService que consulta o Supabase
    // Evitando chamadas para /api que não existem
    
    let barbershopData;
    
    if (slug) {
        barbershopData = await getBarbershopBySlug(slug);
    } else {
        barbershopData = await getCurrentBarbershop();
    }
    
    const planInfo: PlanInfo = {
        barbershopId: barbershopData.id,
        name: barbershopData.name,
        slug: barbershopData.slug,
        planType: (barbershopData.planType as PlanType) || 'free',
        settings: barbershopData.settings || {
            theme: 'default',
            timezone: 'America/Sao_Paulo'
        },
        createdAt: barbershopData.createdAt
    };
      
    console.log('Informações do plano (via Supabase):', planInfo);
    return planInfo;
    
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
    
    try {
      // Try to upgrade using real API
      const response = await ApiService.post<UpgradeResponse>('/api/plans/upgrade', request);
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
    
    try {
      // Try to get real transaction history from the backend
      const response = await ApiService.get<PlanHistoryResponse>('/api/plans/history');
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
    
    if (!usage || !usage.usage) {
      return true; // Fail-safe: permitir operação se dados não estão disponíveis
    }
    
    switch (feature) {
      case 'barbers':
        return (usage.usage.barbers?.remaining ?? 1) > 0;
      case 'appointments':
        return (usage.usage.appointments?.remaining ?? 1) > 0;
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