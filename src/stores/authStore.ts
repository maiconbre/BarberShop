/**
 * Authentication store using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';
import { API_CONFIG, AUTH_CONFIG, API_ENDPOINTS } from '@/constants';

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Authentication store
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Replace with actual API call
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            throw new Error('Credenciais inválidas');
          }

          const data = await response.json();
          const { user, tokens } = data;

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao fazer login',
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Replace with actual API call
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.REGISTER}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Erro ao criar conta');
          }

          const responseData = await response.json();
          const { user, tokens } = responseData;

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao criar conta',
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        });
        
        // Clear any stored tokens from localStorage
        localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
      },

      refreshToken: async () => {
        const { tokens } = get();
        
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          // TODO: Replace with actual API call
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }

          const data = await response.json();
          const newTokens = data.tokens;

          set({
            tokens: newTokens,
          });
        } catch (error) {
          // If refresh fails, logout the user
          get().logout();
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        
        if (user) {
          set({
            user: { ...user, ...userData },
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for better performance
export const useAuth = () => {
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearError,
    setLoading,
  } = useAuthStore();

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearError,
    setLoading,
  };
};

// Specific selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);