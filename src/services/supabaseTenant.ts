// Serviço para operações de tenants usando Supabase
import { supabase, rpc } from '../config/supabaseConfig';
import type { Tenant, TenantMember } from '../config/supabaseConfig';

export interface CreateTenantData {
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface InviteMemberData {
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'client';
  tenantId: string;
}

export interface UpdateMemberRoleData {
  memberId: string;
  role: 'admin' | 'manager' | 'employee' | 'client';
}

class SupabaseTenantService {
  // Operações de Tenant
  async createTenant(data: CreateTenantData): Promise<{ tenant: Tenant | null; error: string | null }> {
    try {
      const { data: tenant, error } = await rpc.createTenant(data.name, data.slug);

      if (error) {
        return { tenant: null, error: error.message };
      }

      return { tenant: tenant as Tenant, error: null };
    } catch (error) {
      return { tenant: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTenantBySlug(slug: string): Promise<{ tenant: Tenant | null; error: string | null }> {
    try {
      const { data: tenant, error } = await rpc.getTenantBySlug(slug);

      if (error) {
        return { tenant: null, error: error.message };
      }

      return { tenant: tenant as Tenant, error: null };
    } catch (error) {
      return { tenant: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCurrentTenant(): Promise<{ tenant: Tenant | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        return { tenant: null, error: error.message };
      }

      return { tenant: data, error: null };
    } catch (error) {
      return { tenant: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateTenant(id: string, data: Partial<CreateTenantData>): Promise<{ tenant: Tenant | null; error: string | null }> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.settings !== undefined) updateData.settings = data.settings;

      const { data: tenant, error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { tenant: null, error: error.message };
      }

      return { tenant, error: null };
    } catch (error) {
      return { tenant: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Operações de Membros do Tenant
  async getTenantMembers(tenantId?: string): Promise<{ members: TenantMember[]; error: string | null }> {
    try {
      let query = supabase
        .from('tenant_members')
        .select(`
          *,
          Users(
            id,
            email,
            user_metadata
          )
        `);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return { members: [], error: error.message };
      }

      return { members: data || [], error: null };
    } catch (error) {
      return { members: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async inviteMember(data: InviteMemberData): Promise<{ member: TenantMember | null; error: string | null }> {
    try {
      // Primeiro, verificar se o usuário já existe
      const { data: existingUser, error: userError } = await supabase
        .from('Users')
        .select('id')
        .eq('email', data.email)
        .single();

      let userId: string;

      if (userError && userError.code === 'PGRST116') {
        // Usuário não existe, criar convite
        // Por enquanto, vamos apenas criar um registro pendente
        const { data: member, error } = await supabase
          .from('tenant_members')
          .insert({
            tenant_id: data.tenantId,
            user_id: null, // Será preenchido quando o usuário se registrar
            role: data.role,
            status: 'pending',
            invited_email: data.email
          })
          .select()
          .single();

        if (error) {
          return { member: null, error: error.message };
        }

        return { member, error: null };
      } else if (existingUser) {
        // Usuário existe, adicionar diretamente
        userId = existingUser.id;

        const { data: member, error } = await supabase
          .from('tenant_members')
          .insert({
            tenant_id: data.tenantId,
            user_id: userId,
            role: data.role,
            status: 'active'
          })
          .select()
          .single();

        if (error) {
          return { member: null, error: error.message };
        }

        return { member, error: null };
      } else {
        return { member: null, error: userError?.message || 'Error checking user' };
      }
    } catch (error) {
      return { member: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateMemberRole(data: UpdateMemberRoleData): Promise<{ member: TenantMember | null; error: string | null }> {
    try {
      const { data: member, error } = await supabase
        .from('tenant_members')
        .update({ role: data.role })
        .eq('id', data.memberId)
        .select()
        .single();

      if (error) {
        return { member: null, error: error.message };
      }

      return { member, error: null };
    } catch (error) {
      return { member: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async removeMember(memberId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('tenant_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCurrentUserRole(tenantId?: string): Promise<{ role: string | null; error: string | null }> {
    try {
      let query = supabase
        .from('tenant_members')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.single();

      if (error) {
        return { role: null, error: error.message };
      }

      return { role: data?.role || null, error: null };
    } catch (error) {
      return { role: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Verificações de permissão
  async canManageMembers(tenantId?: string): Promise<boolean> {
    try {
      const { role } = await this.getCurrentUserRole(tenantId);
      return role === 'admin' || role === 'manager';
    } catch {
      return false;
    }
  }

  async canManageBarbershops(tenantId?: string): Promise<boolean> {
    try {
      const { role } = await this.getCurrentUserRole(tenantId);
      return role === 'admin' || role === 'manager';
    } catch {
      return false;
    }
  }

  async canManageAppointments(tenantId?: string): Promise<boolean> {
    try {
      const { role } = await this.getCurrentUserRole(tenantId);
      return role === 'admin' || role === 'manager' || role === 'employee';
    } catch {
      return false;
    }
  }

  async isAdmin(tenantId?: string): Promise<boolean> {
    try {
      const { role } = await this.getCurrentUserRole(tenantId);
      return role === 'admin';
    } catch {
      return false;
    }
  }

  // Configurações do tenant
  async getTenantSettings(tenantId?: string): Promise<{ settings: Record<string, any>; error: string | null }> {
    try {
      let query = supabase
        .from('tenants')
        .select('settings');

      if (tenantId) {
        query = query.eq('id', tenantId);
      }

      const { data, error } = await query.single();

      if (error) {
        return { settings: {}, error: error.message };
      }

      return { settings: data?.settings || {}, error: null };
    } catch (error) {
      return { settings: {}, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateTenantSettings(settings: Record<string, any>, tenantId?: string): Promise<{ error: string | null }> {
    try {
      let query = supabase
        .from('tenants')
        .update({ settings });

      if (tenantId) {
        query = query.eq('id', tenantId);
      }

      const { error } = await query;

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Estatísticas do tenant
  async getTenantStats(_tenantId?: string): Promise<{ stats: Record<string, number>; error: string | null }> {
    try {
      const stats: Record<string, number> = {};

      // Contar barbearias
      const { count: barbershopsCount, error: barbershopsError } = await supabase
        .from('Barbershops')
        .select('*', { count: 'exact', head: true });

      if (barbershopsError) {
        return { stats: {}, error: barbershopsError.message };
      }

      stats.barbershops = barbershopsCount || 0;

      // Contar barbeiros
      const { count: barbersCount, error: barbersError } = await supabase
        .from('Barbers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (barbersError) {
        return { stats: {}, error: barbersError.message };
      }

      stats.barbers = barbersCount || 0;

      // Contar serviços
      const { count: servicesCount, error: servicesError } = await supabase
        .from('Services')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (servicesError) {
        return { stats: {}, error: servicesError.message };
      }

      stats.services = servicesCount || 0;

      // Contar agendamentos do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const { count: appointmentsCount, error: appointmentsError } = await supabase
        .from('Appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_for', startOfMonth.toISOString())
        .lte('scheduled_for', endOfMonth.toISOString());

      if (appointmentsError) {
        return { stats: {}, error: appointmentsError.message };
      }

      stats.appointmentsThisMonth = appointmentsCount || 0;

      // Contar membros
      const { count: membersCount, error: membersError } = await supabase
        .from('tenant_members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (membersError) {
        return { stats: {}, error: membersError.message };
      }

      stats.members = membersCount || 0;

      return { stats, error: null };
    } catch (error) {
      return { stats: {}, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Instância singleton do serviço de tenant
export const tenantService = new SupabaseTenantService();
export default tenantService;