import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth as useSupabaseAuth, type UseAuthReturn } from '../hooks/useAuth';
import { authService } from '../services/supabaseAuth';

interface AuthContextType extends UseAuthReturn {
  initialized: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useSupabaseAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Aguardar a inicialização da autenticação
    const initializeAuth = async () => {
      try {
        // Aguardar um pouco para garantir que o Supabase foi inicializado
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verificar se há uma sessão ativa
        const currentUser = authService.getCurrentUser();

        if (currentUser) {
          console.log('User authenticated:', currentUser.email);
        } else {
          console.log('No authenticated user found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Aguardar a inicialização antes de renderizar
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const contextValue: AuthContextType = {
    ...auth,
    initialized
  };
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};