// Hook personalizado para gerenciar autenticação com Supabase
import { useState, useEffect, useCallback } from 'react';
import { authService, type AuthUser, type LoginCredentials, type RegisterData } from '../services/supabaseAuth';
import { tenantService } from '../services/supabaseTenant';

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setCurrentTenant: (tenantId: string) => Promise<{ success: boolean; error?: string }>;
  checkTenantAccess: (tenantId: string) => Promise<boolean>;
  getUserTenants: () => Promise<{ tenants: any[]; error?: string }>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças de autenticação
    const unsubscribe = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const { user: loggedUser, error } = await authService.login(credentials);
      
      if (error) {
        return { success: false, error };
      }

      setUser(loggedUser);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Registro
  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    try {
      const { user: registeredUser, error } = await authService.register(data);
      
      if (error) {
        return { success: false, error };
      }

      setUser(registeredUser);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await authService.logout();
      
      if (error) {
        return { success: false, error };
      }

      setUser(null);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset de senha
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await authService.resetPassword(email);
      
      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Atualizar senha
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await authService.updatePassword(newPassword);
      
      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Definir tenant atual
  const setCurrentTenant = useCallback(async (tenantId: string) => {
    try {
      const { error } = await authService.setCurrentTenant(tenantId);
      
      if (error) {
        return { success: false, error };
      }

      // Atualizar usuário local
      if (user) {
        setUser({
          ...user,
          tenant_id: tenantId,
          app_metadata: {
            ...user.app_metadata,
            default_tenant_id: tenantId
          }
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set tenant';
      return { success: false, error: errorMessage };
    }
  }, [user]);

  // Verificar acesso ao tenant
  const checkTenantAccess = useCallback(async (tenantId: string) => {
    try {
      return await authService.checkTenantAccess(tenantId);
    } catch (error) {
      console.error('Error checking tenant access:', error);
      return false;
    }
  }, []);

  // Obter tenants do usuário
  const getUserTenants = useCallback(async () => {
    try {
      const { tenants, error } = await authService.getUserTenants();
      
      if (error) {
        return { tenants: [], error };
      }

      return { tenants };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user tenants';
      return { tenants: [], error: errorMessage };
    }
  }, []);

  // Atualizar dados do usuário
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    setCurrentTenant,
    checkTenantAccess,
    getUserTenants,
    refreshUser
  };
};

export default useAuth;