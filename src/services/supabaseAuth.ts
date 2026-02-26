// Serviço de autenticação usando Supabase
import { supabase, auth } from '../config/supabaseConfig';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
  tenant_id?: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  tenantSlug?: string;
}

class SupabaseAuthService {
  private currentUser: AuthUser | null = null;
  private authListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Verificar se há uma sessão ativa
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = this.transformUser(session.user);
    }

    // Escutar mudanças de autenticação
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = this.transformUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
      }
      
      // Notificar listeners
      this.authListeners.forEach(listener => listener(this.currentUser));
    });
  }

  private transformUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      tenant_id: user.app_metadata?.default_tenant_id,
      role: user.app_metadata?.role || 'client'
    };
  }

  // Login com email e senha
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await auth.signIn(credentials.email, credentials.password);
      
      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        this.currentUser = this.transformUser(data.user);
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: 'Login failed' };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Registro de novo usuário
  async register(data: RegisterData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: authData, error } = await auth.signUp(
        data.email,
        data.password,
        {
          name: data.name,
          tenant_slug: data.tenantSlug
        }
      );
      
      if (error) {
        return { user: null, error: error.message };
      }

      if (authData.user) {
        this.currentUser = this.transformUser(authData.user);
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: 'Registration failed' };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Logout
  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await auth.signOut();
      
      if (error) {
        return { error: error.message };
      }

      this.currentUser = null;
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Obter usuário atual
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Obter token de acesso
  async getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // Atualizar tenant do usuário
  async setCurrentTenant(tenantId: string): Promise<{ error: string | null }> {
    try {
      // Atualizar app_metadata do usuário
      const { error } = await supabase.auth.updateUser({
        data: { default_tenant_id: tenantId }
      });

      if (error) {
        return { error: error.message };
      }

      // Atualizar usuário local
      if (this.currentUser) {
        this.currentUser.tenant_id = tenantId;
        this.currentUser.app_metadata.default_tenant_id = tenantId;
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Adicionar listener para mudanças de autenticação
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authListeners.push(callback);
    
    // Retornar função para remover o listener
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  // Resetar senha
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Atualizar senha
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Verificar se o usuário tem acesso a um tenant
  async checkTenantAccess(tenantId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tenant_members')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', this.currentUser?.id)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  // Obter tenants do usuário
  async getUserTenants(): Promise<{ tenants: any[]; error: string | null }> {
    try {
      if (!this.currentUser) {
        return { tenants: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('tenant_members')
        .select(`
          role,
          tenants (
            id,
            name,
            slug,
            created_at
          )
        `)
        .eq('user_id', this.currentUser.id);

      if (error) {
        return { tenants: [], error: error.message };
      }

      const tenants = data?.map(item => ({
        ...item.tenants,
        role: item.role
      })) || [];

      return { tenants, error: null };
    } catch (error) {
      return { tenants: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Instância singleton do serviço de autenticação
export const authService = new SupabaseAuthService();
export default authService;