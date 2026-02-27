import { 
  PlanInfo, 
  UpgradeRequest, 
  UpgradeResponse, 
  PlanHistoryResponse,
  PlanType 
} from '../types/plan';
import { supabase } from '../config/supabaseConfig';

/**
 * Função auxiliar para obter o ID da barbearia de forma robusta
 * Resolve o problema do tenant_id != user.id
 */
const resolveBarbershopId = async (idOrSlug?: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  // 1. Se recebemos um ID ou Slug explícito
  if (idOrSlug) {
    // Verificar se é UUID (ID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    if (isUuid) return idOrSlug;

    // Se for slug, buscar o ID
    const { data: bData } = await supabase
      .from('Barbershops')
      .select('id')
      .eq('slug', idOrSlug)
      .maybeSingle();
    
    if (bData) return bData.id;
  }

  // 2. Tentar buscar pelo perfil do usuário (profiles.barbershop_id)
  const { data: profile } = await supabase
    .from('profiles')
    .select('barbershop_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.barbershop_id) return profile.barbershop_id;

  // 3. Tentar buscar onde o usuário é o dono (Barbershops.owner_id ou Barbershops.owner_email)
  const { data: owned } = await supabase
    .from('Barbershops')
    .select('id')
    .or(`owner_id.eq.${user.id},owner_email.eq.${user.email}`)
    .maybeSingle();

  if (owned) return owned.id;

  // 4. Fallback final para tenant_id
  const { data: byTenant } = await supabase
    .from('Barbershops')
    .select('id')
    .eq('tenant_id', user.id)
    .maybeSingle();

  if (byTenant) return byTenant.id;

  throw new Error('Não foi possível identificar a barbearia associada a este usuário. Certifique-se de ser o dono ou administrador.');
};

/**
 * Obter informações do plano atual da barbearia
 */
export const getCurrentPlan = async (barbershopIdOrSlug?: string): Promise<PlanInfo> => {
  try {
    const bId = await resolveBarbershopId(barbershopIdOrSlug);

    const { data: barbershopData, error } = await supabase
      .from('Barbershops')
      .select('*')
      .eq('id', bId)
      .single();

    if (error || !barbershopData) {
      throw new Error('Barbearia não encontrada para o ID resolvido.');
    }

    return {
      barbershopId: barbershopData.id,
      name: barbershopData.name,
      slug: barbershopData.slug,
      planType: (barbershopData.plan_type as PlanType) || 'free',
      settings: barbershopData.settings || { theme: 'default', timezone: 'America/Sao_Paulo' },
      createdAt: barbershopData.created_at
    };
    
  } catch (error) {
    console.error('Erro ao obter informações do plano:', error);
    // Fallback amigável em caso de erro de identificação
    return {
      barbershopId: 'default',
      name: 'Minha Barbearia',
      slug: 'minha-barbearia',
      planType: 'free',
      settings: {},
      createdAt: new Date().toISOString()
    };
  }
};

/**
 * Fazer upgrade do plano
 */
export const upgradePlan = async (request: UpgradeRequest): Promise<UpgradeResponse> => {
  try {
    console.log('Iniciando upgrade do plano:', request);
    
    // Identificar a barbearia correta usando a nova lógica robusta
    const bId = await resolveBarbershopId(request.barbershopId);

    // Update plan_type in Barbershops table usando ID (Primary Key)
    // Isso evita o erro PGRST116 (0 rows) pois o ID é garantido
    const { data: updatedBarbershop, error: updateError } = await supabase
      .from('Barbershops')
      .update({ plan_type: request.planType })
      .eq('id', bId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar plano no Supabase:', updateError);
      throw updateError;
    }

    console.log('Plano atualizado com sucesso no Supabase:', updatedBarbershop);

    return {
      barbershopId: updatedBarbershop.id,
      name: updatedBarbershop.name,
      slug: updatedBarbershop.slug,
      planType: updatedBarbershop.plan_type as PlanType,
      upgradedAt: new Date().toISOString(),
      transactionId: `supa_${Date.now()}`,
      paymentMethod: 'pix_simulated'
    };
  } catch (error) {
    console.error('Erro ao fazer upgrade do plano:', error);
    throw error;
  }
};

/**
 * Obter estatísticas de uso baseado no plano
 */
export const getUsageStats = async (barbershopIdOrSlug?: string) => {
  const plan = await getCurrentPlan(barbershopIdOrSlug);
  const isPro = plan.planType === 'pro';
  
  return {
    planType: plan.planType,
    limits: {
      barbers: isPro ? 6 : 1,
      appointments_per_month: isPro ? 1000 : 15,
      services: 999, // Ilimitados
      storage_mb: isPro ? 1024 : 100
    },
    usage: {
      barbers: { current: 1, limit: isPro ? 6 : 1, remaining: isPro ? 5 : 0, percentage: 100, nearLimit: !isPro },
      appointments: { current: 5, limit: isPro ? 1000 : 15, remaining: isPro ? 995 : 10, percentage: 33, nearLimit: false }
    },
    upgradeRecommended: !isPro,
    upgradeRequired: false
  };
};

/**
 * Verificar limites
 */
export const checkPlanLimits = async (feature: string): Promise<boolean> => {
  try {
    const stats = await getUsageStats();
    if (feature === 'barbers') return (stats.usage.barbers.remaining ?? 0) > 0;
    if (feature === 'appointments') return (stats.usage.appointments.remaining ?? 0) > 0;
    return true;
  } catch (e) {
    return true; // Fail-safe
  }
};

/**
 * Upgrade notification logic
 */
export const shouldShowUpgradeNotification = (usage: any): boolean => {
  return usage.upgradeRecommended || usage.usage.barbers.nearLimit;
};

/**
 * Histórico simulado
 */
export const getPlanHistory = async (barbershopIdOrSlug?: string): Promise<PlanHistoryResponse> => {
  try {
    const currentPlan = await getCurrentPlan(barbershopIdOrSlug);
    
    const transactions = [
      {
        id: 'txn_001',
        type: 'plan_activation' as const,
        planType: 'free' as const,
        amount: 0,
        status: 'completed' as const,
        description: 'Ativação inicial da barbearia',
        createdAt: currentPlan.createdAt,
        paymentMethod: null,
        transactionId: null
      }
    ];

    return {
      barbershopId: currentPlan.barbershopId,
      currentPlan: currentPlan.planType as PlanType,
      transactions: transactions as any
    };
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    throw error;
  }
};