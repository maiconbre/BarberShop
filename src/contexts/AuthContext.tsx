import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authenticateUser } from '../services/auth';
import { cacheService } from '../services/CacheService';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => unknown | null;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const SESSION_EXPIRY = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isInitialized = useRef(false);

  const checkSessionValidity = () => {
    console.log('AuthContext - Validação inicial');
    
    // Verificar dados básicos de autenticação
    const authToken = localStorage.getItem('authToken');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const expiryTime = localStorage.getItem('tokenExpiration');
    
    console.log('AuthContext - Valores do localStorage:', {
      authToken: authToken ? 'presente' : 'ausente',
      token: token ? 'presente' : 'ausente',
      user: user ? 'presente' : 'ausente',
      tokenExpiration: expiryTime ? 'presente' : 'ausente'
    });
    
    const hasToken = !!(authToken || token);
    const hasUser = !!user;
    const hasExpiry = !!expiryTime;
    
    console.log('AuthContext - Verificando sessão:', {
      hasToken,
      hasUser,
      hasExpiry
    });
    
    // Se não há dados básicos, retornar false
    if (!hasToken || !hasUser) {
      console.log('AuthContext - Dados básicos ausentes');
      return false;
    }

    // Se não há tempo de expiração, criar um novo (12 horas a partir de agora)
    if (!hasExpiry) {
      console.log('AuthContext - Criando nova expiração de 12 horas');
      updateSessionExpiry();
      return true;
    }

    // Verificar se a sessão expirou
    const currentTime = Date.now();
    const expirationTime = parseInt(expiryTime);
    const isValid = currentTime < expirationTime;
    
    console.log('AuthContext - Verificando expiração:', {
      now: new Date(currentTime).toLocaleString(),
      expiry: new Date(expirationTime).toLocaleString(),
      isExpired: !isValid
    });
    
    if (!isValid) {
      console.log('AuthContext - Sessão expirada');
      return false;
    }
    
    console.log('AuthContext - Sessão válida');
    return true;
  };

  const updateSessionExpiry = () => {
    const expiryTime = Date.now() + SESSION_EXPIRY;
    localStorage.setItem('tokenExpiration', expiryTime.toString());
    console.log('AuthContext - Sessão atualizada para 12 horas');
  };

  useEffect(() => {
    const validateSession = () => {
      const isValid = checkSessionValidity();
      
      if (isValid) {
        if (!isAuthenticated) {
          console.log('AuthContext - Sessão válida, autenticando usuário');
          setIsAuthenticated(true);
        }
      } else {
        if (isAuthenticated) {
          console.log('AuthContext - Sessão inválida, fazendo logout');
          setIsAuthenticated(false);
          // Limpar dados de autenticação
          const items = ['token', 'authToken', 'currentBarberId', 'user', 'tokenExpiration', 'rememberMe'];
          items.forEach(item => localStorage.removeItem(item));
        }
      }
    };

    // Validação inicial apenas uma vez
    if (!isInitialized.current) {
      console.log('AuthContext - Validação inicial');
      validateSession();
      isInitialized.current = true;
    }
    
    // Verificar a cada 30 minutos (menos agressivo)
    const interval = setInterval(validateSession, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const clearUserSpecificCache = async (userId?: string) => {
    try {
      // Limpar cache específico do usuário anterior
      if (userId) {
        cacheService.remove(`schedule_appointments_${userId}`);
        cacheService.remove(`/api/appointments_user_${userId}`);
      }
      
      // Limpar outros caches relacionados a agendamentos
      cacheService.remove('/api/appointments');
      cacheService.remove('appointments');
      
      // Limpar localStorage de agendamentos
      localStorage.removeItem('appointments');
      
      // Limpar caches específicos de agendamentos
      // Como não temos getAllKeys, vamos limpar caches conhecidos
      const commonCacheKeys = [
        'schedule_appointments_',
        '/api/appointments',
        'barbers',
        'services'
      ];
      
      for (const key of commonCacheKeys) {
        cacheService.remove(key);
      }
      
      console.log('Cache específico do usuário limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar cache específico do usuário:', error);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('AuthContext - Iniciando login:', { username });
      
      // Obter usuário atual antes do login para limpar seu cache
      const currentUser = getCurrentUser();
      const previousUserId = currentUser?.id;
      
      const user = await authenticateUser(username, password);
      
      console.log('AuthContext - Authenticated user:', { 
        userId: (user as { id: string | number }).id, 
        role: (user as { role: string }).role 
      });
      
      // Limpar cache do usuário anterior se for diferente
      if (previousUserId && previousUserId !== (user as { id: string | number }).id) {
        await clearUserSpecificCache(previousUserId.toString());
      }
      
      // Armazenar dados do usuário no localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Token já é armazenado no localStorage pelo authenticateUser
      // Definir expiração de 12 horas
      updateSessionExpiry();
      
      if ((user as { role: string }).role === 'barber') {
        localStorage.setItem('currentBarberId', ((user as { id: string | number }).id).toString());
      }

      setIsAuthenticated(true);
      console.log('AuthContext - Login concluído com sucesso');
      return true;
    } catch (error) {
      console.error('AuthContext - Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    // Obter usuário atual antes de limpar para poder limpar seu cache
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id;
    
    setIsAuthenticated(false);
    
    // Limpar dados de autenticação do localStorage
    const items = ['token', 'authToken', 'currentBarberId', 'user', 'tokenExpiration'];
    items.forEach(item => localStorage.removeItem(item));
    
    // Limpar cache específico do usuário
    if (currentUserId) {
      await clearUserSpecificCache(currentUserId.toString());
    }
    
    console.log('AuthContext - Logout realizado com sucesso');
  };

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;