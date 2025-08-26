// Hook personalizado para gerenciar operações de tenants com Supabase
import { useState, useEffect, useCallback } from 'react';
import { 
  tenantService, 
  type CreateTenantData, 
  type InviteMemberData, 
  type UpdateMemberRoleData 
} from '../services/supabaseTenant';
import { supabase } from '../config/supabaseConfig';
import type { Tenant, TenantMember } from '../config/supabaseConfig';

export interface UseTenantReturn {
  // Estados
  currentTenant: Tenant | null;
  tenantMembers: TenantMember[];
  userRole: string | null;
  tenantStats: Record<string, number>;
  tenantSettings: Record<string, any>;
  loading: boolean;
  error: string | null;

  // Operações de Tenant
  createTenant: (data: CreateTenantData) => Promise<{ success: boolean; tenant?: Tenant; error?: string }>;
  getTenantBySlug: (slug: string) => Promise<{ tenant?: Tenant; error?: string }>;
  getCurrentTenant: () => Promise<void>;
  updateTenant: (id: string, data: Partial<CreateTenantData>) => Promise<{ success: boolean; tenant?: Tenant; error?: string }>;
  setCurrentTenant: (tenantId: string) => Promise<{ success: boolean; error?: string }>;

  // Operações de Membros
  getTenantMembers: (tenantId?: string) => Promise<void>;
  inviteMember: (data: InviteMemberData) => Promise<{ success: boolean; invite?: any; error?: string }>;
  acceptInvite: (token: string) => Promise<{ success: boolean; tenant?: Tenant; error?: string }>;
  updateMemberRole: (data: UpdateMemberRoleData) => Promise<{ success: boolean; member?: TenantMember; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  getCurrentUserRole: (tenantId?: string) => Promise<void>;

  // Verificações de Permissão
  canManageMembers: (tenantId?: string) => Promise<boolean>;
  canManageBarbershops: (tenantId?: string) => Promise<boolean>;
  canManageAppointments: (tenantId?: string) => Promise<boolean>;
  isAdmin: (tenantId?: string) => Promise<boolean>;

  // Configurações
  getTenantSettings: (tenantId?: string) => Promise<void>;
  updateTenantSettings: (settings: Record<string, any>, tenantId?: string) => Promise<{ success: boolean; error?: string }>;

  // Estatísticas
  getTenantStats: (tenantId?: string) => Promise<void>;

  // Utilitários
  clearError: () => void;
  refreshTenantData: () => Promise<void>;
}

export const useTenant = (): UseTenantReturn => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenantMembers, setTenantMembers] = useState<TenantMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [tenantStats, setTenantStats] = useState<Record<string, number>>({});
  const [tenantSettings, setTenantSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Operações de Tenant
  const createTenant = useCallback(async (data: CreateTenantData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const response = await supabase.functions.invoke('create-tenant', {
        body: data,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        setError(response.error.message);
        return { success: false, error: response.error.message };
      }

      if (response.data?.success && response.data?.tenant) {
        setCurrentTenant(response.data.tenant);
        return { success: true, tenant: response.data.tenant };
      }

      const errorMessage = response.data?.error || 'Failed to create tenant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantBySlug = useCallback(async (slug: string) => {
    try {
      const { tenant, error: fetchError } = await tenantService.getTenantBySlug(slug);
      
      if (fetchError) {
        return { error: fetchError };
      }

      return { tenant };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { error: errorMessage };
    }
  }, []);

  const getCurrentTenant = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { tenant, error: fetchError } = await tenantService.getCurrentTenant();
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setCurrentTenant(tenant);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTenant = useCallback(async (id: string, data: Partial<CreateTenantData>) => {
    setLoading(true);
    setError(null);
    try {
      const { tenant, error: updateError } = await tenantService.updateTenant(id, data);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      if (tenant) {
        setCurrentTenant(tenant);
        return { success: true, tenant };
      }

      return { success: false, error: 'Failed to update tenant' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Operações de Membros
  const getTenantMembers = useCallback(async (tenantId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { members, error: fetchError } = await tenantService.getTenantMembers(tenantId);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setTenantMembers(members);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const inviteMember = useCallback(async (data: InviteMemberData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const response = await supabase.functions.invoke('send-invite', {
        body: {
          email: data.email,
          tenant_id: data.tenantId,
          role: data.role,
          message: data.message
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        setError(response.error.message);
        return { success: false, error: response.error.message };
      }

      if (response.data?.success && response.data?.invite) {
        // Refresh tenant members to show pending invite
        await getTenantMembers(data.tenantId);
        return { success: true, invite: response.data.invite };
      }

      const errorMessage = response.data?.error || 'Failed to send invite';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getTenantMembers]);

  const updateMemberRole = useCallback(async (data: UpdateMemberRoleData) => {
    setLoading(true);
    setError(null);
    try {
      const { member, error: updateError } = await tenantService.updateMemberRole(data);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      if (member) {
        setTenantMembers(prev => prev.map(m => m.id === data.memberId ? member : m));
        return { success: true, member };
      }

      return { success: false, error: 'Failed to update member role' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMember = useCallback(async (memberId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: removeError } = await tenantService.removeMember(memberId);
      
      if (removeError) {
        setError(removeError);
        return { success: false, error: removeError };
      }

      setTenantMembers(prev => prev.filter(m => m.id !== memberId));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentUserRole = useCallback(async (tenantId?: string) => {
    try {
      const { role, error: roleError } = await tenantService.getCurrentUserRole(tenantId);
      
      if (roleError) {
        setError(roleError);
        return;
      }

      setUserRole(role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, []);

  const setCurrentTenant = useCallback(async (tenantId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const response = await supabase.functions.invoke('set-tenant', {
        body: { tenant_id: tenantId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        setError(response.error.message);
        return { success: false, error: response.error.message };
      }

      if (response.data?.success && response.data?.tenant) {
        setCurrentTenant(response.data.tenant);
        setUserRole(response.data.tenant.role);
        return { success: true };
      }

      const errorMessage = response.data?.error || 'Failed to set current tenant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvite = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const response = await supabase.functions.invoke('accept-invite', {
        body: { token },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        setError(response.error.message);
        return { success: false, error: response.error.message };
      }

      if (response.data?.success && response.data?.tenant) {
        setCurrentTenant(response.data.tenant);
        setUserRole(response.data.tenant.role);
        return { success: true, tenant: response.data.tenant };
      }

      const errorMessage = response.data?.error || 'Failed to accept invite';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificações de Permissão
  const canManageMembers = useCallback(async (tenantId?: string) => {
    try {
      return await tenantService.canManageMembers(tenantId);
    } catch (err) {
      console.error('Error checking member management permission:', err);
      return false;
    }
  }, []);

  const canManageBarbershops = useCallback(async (tenantId?: string) => {
    try {
      return await tenantService.canManageBarbershops(tenantId);
    } catch (err) {
      console.error('Error checking barbershop management permission:', err);
      return false;
    }
  }, []);

  const canManageAppointments = useCallback(async (tenantId?: string) => {
    try {
      return await tenantService.canManageAppointments(tenantId);
    } catch (err) {
      console.error('Error checking appointment management permission:', err);
      return false;
    }
  }, []);

  const isAdmin = useCallback(async (tenantId?: string) => {
    try {
      return await tenantService.isAdmin(tenantId);
    } catch (err) {
      console.error('Error checking admin permission:', err);
      return false;
    }
  }, []);

  // Configurações
  const getTenantSettings = useCallback(async (tenantId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { settings, error: fetchError } = await tenantService.getTenantSettings(tenantId);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setTenantSettings(settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTenantSettings = useCallback(async (settings: Record<string, any>, tenantId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await tenantService.updateTenantSettings(settings, tenantId);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      setTenantSettings(prev => ({ ...prev, ...settings }));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Estatísticas
  const getTenantStats = useCallback(async (tenantId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { stats, error: fetchError } = await tenantService.getTenantStats(tenantId);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setTenantStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar todos os dados do tenant
  const refreshTenantData = useCallback(async () => {
    await Promise.all([
      getCurrentTenant(),
      getTenantMembers(),
      getCurrentUserRole(),
      getTenantSettings(),
      getTenantStats()
    ]);
  }, [getCurrentTenant, getTenantMembers, getCurrentUserRole, getTenantSettings, getTenantStats]);

  // Carregar dados iniciais quando o componente monta
  useEffect(() => {
    refreshTenantData();
  }, []);

  return {
    // Estados
    currentTenant,
    tenantMembers,
    userRole,
    tenantStats,
    tenantSettings,
    loading,
    error,

    // Operações de Tenant
    createTenant,
    getTenantBySlug,
    getCurrentTenant,
    updateTenant,
    setCurrentTenant,

    // Operações de Membros
    getTenantMembers,
    inviteMember,
    acceptInvite,
    updateMemberRole,
    removeMember,
    getCurrentUserRole,

    // Verificações de Permissão
    canManageMembers,
    canManageBarbershops,
    canManageAppointments,
    isAdmin,

    // Configurações
    getTenantSettings,
    updateTenantSettings,

    // Estatísticas
    getTenantStats,

    // Utilitários
    clearError,
    refreshTenantData
  };
};

export default useTenant;