import { supabase } from '../config/supabaseConfig';

interface GlobalMetrics {
  totalBarbershops: number;
  activeBarbershops: number;
  trialBarbershops: number;
  freePlanCount: number;
  proPlanCount: number;
  enterprisePlanCount: number;
  totalAppointments: number;
  totalBarbers: number;
  revenue: number;
  mrr: number;
}

interface BarbershopListItem {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  planType: string;
  planStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, unknown>;
  createdAt: string;
  adminUser?: {
    id: string;
    role: string;
  };
}

/**
 * Serviço para funcionalidades do Admin Central
 */
export class AdminService {
  /**
   * Verificar se usuário é admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      console.log('[AdminService.isAdmin] Verificando admin para userId:', userId);
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, role, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      console.log('[AdminService.isAdmin] Resultado da query:', { data, error });

      if (error) {
        console.error('[AdminService.isAdmin] Erro na query:', error);
        return false;
      }

      if (!data) {
        console.warn('[AdminService.isAdmin] Nenhum registro encontrado para userId:', userId);
        return false;
      }

      console.log('[AdminService.isAdmin] Usuário É admin! Role:', data.role);
      return true;
    } catch (error) {
      console.error('[AdminService.isAdmin] Erro ao verificar admin:', error);
      return false;
    }
  }

  /**
   * Obter métricas globais
   */
  static async getGlobalMetrics(): Promise<GlobalMetrics> {
    try {
      // Buscar métricas do dia atual
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('global_metrics')
        .select('*')
        .eq('metric_date', today)
        .maybeSingle();

      if (error || !data) {
        // Se não houver métricas de hoje, calcular em tempo real
        return await this.calculateRealtimeMetrics();
      }

      return {
        totalBarbershops: data.total_barbershops,
        activeBarbershops: data.active_barbershops,
        trialBarbershops: data.trial_barbershops,
        freePlanCount: data.free_plan_count,
        proPlanCount: data.pro_plan_count,
        enterprisePlanCount: data.enterprise_plan_count,
        totalAppointments: data.total_appointments,
        totalBarbers: data.total_barbers,
        revenue: parseFloat(data.revenue || 0),
        mrr: parseFloat(data.mrr || 0)
      };
    } catch (error) {
      console.error('Erro ao obter métricas globais:', error);
      throw error;
    }
  }

  /**
   * Calcular métricas em tempo real
   */
  private static async calculateRealtimeMetrics(): Promise<GlobalMetrics> {
    try {
      // Contar barbearias
      const { count: totalBarbershops } = await supabase
        .from('Barbershops')
        .select('*', { count: 'exact', head: true });

      const { count: activeBarbershops } = await supabase
        .from('Barbershops')
        .select('*', { count: 'exact', head: true })
        .eq('plan_status', 'active');

      const { count: trialBarbershops } = await supabase
        .from('Barbershops')
        .select('*', { count: 'exact', head: true })
        .eq('plan_status', 'trial');

      // Contar por plano
      const { count: freePlanCount } = await supabase
        .from('Barbershops')
        .select('*', { count: 'exact', head: true })
        .eq('plan_type', 'free')
        .eq('plan_status', 'active');

      const { count: proPlanCount } = await supabase
        .from('Barbershops')
        .select('*', { count: 'exact', head: true })
        .eq('plan_type', 'pro')
        .eq('plan_status', 'active');

      const { count: enterprisePlanCount } = await supabase
        .from('Barbershops')
        .select('*', { count: 'exact', head: true })
        .eq('plan_type', 'enterprise')
        .eq('plan_status', 'active');

      // Contar agendamentos (mês atual)
      const firstDay = new Date();
      firstDay.setDate(1);
      const { count: totalAppointments } = await supabase
        .from('Appointments')
        .select('*', { count: 'exact', head: true })
        .gte('date', firstDay.toISOString().split('T')[0]);

      // Contar barbeiros
      const { count: totalBarbers } = await supabase
        .from('Barbers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Calcular MRR (simplified)
      const pricePerPlan = { pro: 49.90, enterprise: 149.90 };
      const mrr = (proPlanCount || 0) * pricePerPlan.pro + 
                  (enterprisePlanCount || 0) * pricePerPlan.enterprise;

      return {
        totalBarbershops: totalBarbershops || 0,
        activeBarbershops: activeBarbershops || 0,
        trialBarbershops: trialBarbershops || 0,
        freePlanCount: freePlanCount || 0,
        proPlanCount: proPlanCount || 0,
        enterprisePlanCount: enterprisePlanCount || 0,
        totalAppointments: totalAppointments || 0,
        totalBarbers: totalBarbers || 0,
        revenue: mrr,
        mrr
      };
    } catch (error) {
      console.error('Erro ao calcular métricas em tempo real:', error);
      throw error;
    }
  }

  /**
   * Listar todas as barbearias
   */
  static async listAllBarbershops(
    filters?: {
      planType?: string;
      planStatus?: string;
      search?: string;
    }
  ): Promise<BarbershopListItem[]> {
    try {
      let query = supabase
        .from('Barbershops')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.planType) {
        query = query.eq('plan_type', filters.planType);
      }

      if (filters?.planStatus) {
        query = query.eq('plan_status', filters.planStatus);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,owner_email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(shop => ({
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        ownerEmail: shop.owner_email,
        planType: shop.plan_type,
        planStatus: shop.plan_status || 'active',
        createdAt: shop.created_at,
        updatedAt: shop.updated_at
      }));
    } catch (error) {
      console.error('Erro ao listar barbearias:', error);
      throw error;
    }
  }

  /**
   * Atualizar plano de uma barbearia
   */
  static async updateBarbershopPlan(
    barbershopId: string,
    planType: string,
    adminUserId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('Barbershops')
        .update({
          plan_type: planType,
          updated_at: new Date().toISOString()
        })
        .eq('id', barbershopId);

      if (error) {
        throw error;
      }

      // Registrar log de auditoria
      await this.logAction({
        adminUserId,
        action: 'update_plan',
        resourceType: 'barbershop',
        resourceId: barbershopId,
        changes: { plan_type: planType }
      });
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      throw error;
    }
  }

  /**
   * Registrar ação de auditoria
   */
  static async logAction(params: {
    adminUserId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    changes: Record<string, unknown>;
  }): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        admin_user_id: params.adminUserId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        changes: params.changes
      });
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }

  /**
   * Obter logs de auditoria
   */
  static async getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admin_users (
            id,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []).map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        changes: log.changes,
        createdAt: log.created_at,
        adminUser: log.admin_users ? {
          id: log.admin_users.id,
          role: log.admin_users.role
        } : undefined
      }));
    } catch (error) {
      console.error('Erro ao obter logs de auditoria:', error);
      throw error;
    }
  }

  /**
   * Atualizar status de uma barbearia
   */
  static async updateBarbershopStatus(
    barbershopId: string,
    status: 'active' | 'suspended' | 'cancelled',
    adminUserId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('Barbershops')
        .update({
          plan_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', barbershopId);

      if (error) {
        throw error;
      }

      await this.logAction({
        adminUserId,
        action: 'update_status',
        resourceType: 'barbershop',
        resourceId: barbershopId,
        changes: { plan_status: status }
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }
}
