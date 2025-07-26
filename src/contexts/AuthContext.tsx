import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authenticateUser } from '../services/auth';
import { cacheService } from '../services/CacheService';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => any | null;
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

const SESSION_EXPIRY = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isInitialized = useRef(false);

  const checkSessionValidity = () => {
    // Priorizar localStorage para persistência
    // Usar 'authToken' como chave principal para consistência
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    const expiryTime = localStorage.getItem('tokenExpiration') || localStorage.getItem('sessionExpiry') || sessionStorage.getItem('tokenExpiration') || sessionStorage.getItem('sessionExpiry');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const sessionStart = sessionStorage.getItem('sessionStart');
    
    // Se não há dados básicos de autenticação, retornar false
    if (!token || !expiryTime || !user) {
      return false;
    }

    // Verificar se a sessão expirou
    const currentTime = new Date().getTime();
    const isTokenValid = currentTime < parseInt(expiryTime);
    
    // Se o token expirou, retornar false
    if (!isTokenValid) {
      return false;
    }
    
    // Se não escolheu manter-se logado, verificar se é uma nova sessão do navegador
    if (!rememberMe) {
      if (!sessionStart) {
        // Nova sessão detectada e usuário não quer manter-se logado - deslogar
        return false;
      }
    }
    
    // Se o token está válido mas só existe no sessionStorage, migrar para localStorage
    if (isTokenValid && !localStorage.getItem('authToken') && !localStorage.getItem('token')) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('token', token); // Manter compatibilidade
      localStorage.setItem('tokenExpiration', expiryTime);
      localStorage.setItem('sessionExpiry', expiryTime); // Manter compatibilidade
      localStorage.setItem('user', user);
      
      // Migrar currentBarberId se existir
      const barberId = sessionStorage.getItem('currentBarberId');
      if (barberId) {
        localStorage.setItem('currentBarberId', barberId);
      }
    }
    
    return true;
  };

  const updateSessionExpiry = (storage: Storage = localStorage) => {
    const expiryTime = new Date().getTime() + SESSION_EXPIRY;
    // Sempre usar localStorage para persistência
    // Usar 'tokenExpiration' como chave principal para consistência
    localStorage.setItem('tokenExpiration', expiryTime.toString());
    localStorage.setItem('sessionExpiry', expiryTime.toString()); // Manter compatibilidade
    // Manter compatibilidade com sessionStorage se necessário
    if (storage === sessionStorage) {
      sessionStorage.setItem('tokenExpiration', expiryTime.toString());
      sessionStorage.setItem('sessionExpiry', expiryTime.toString());
    }
  };

  useEffect(() => {
    const validateSession = () => {
      const isValid = checkSessionValidity();
      
      if (isValid) {
        setIsAuthenticated(true);
        // Sempre atualizar no localStorage para persistência
        updateSessionExpiry(localStorage);
      } else {
        // Clear session if expired or invalid
        setIsAuthenticated(false);
        // Limpar dados sem chamar logout() para evitar loops
        const items = ['token', 'authToken', 'currentBarberId', 'user', 'sessionExpiry', 'tokenExpiration', 'rememberMe'];
        items.forEach(item => {
          localStorage.removeItem(item);
          sessionStorage.removeItem(item);
        });
        sessionStorage.removeItem('sessionStart');
      }
    };

    // Validação inicial apenas uma vez
    if (!isInitialized.current) {
      validateSession();
      isInitialized.current = true;
    }
    
    // Verificar a cada 5 minutos para otimizar performance
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    // Listener para detectar mudanças de aba/janela e revalidar sessão
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        validateSession();
      }
    };
    
    // Listener para detectar foco na janela
    const handleFocus = () => {
      validateSession();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const clearUserSpecificCache = async (userId?: string) => {
    try {
      // Limpar cache específico do usuário anterior
      if (userId) {
        await cacheService.delete(`schedule_appointments_${userId}`);
      }
      
      // Limpar outros caches relacionados a agendamentos
      await cacheService.delete('/api/appointments');
      await cacheService.delete('appointments');
      
      // Limpar localStorage de agendamentos
      localStorage.removeItem('appointments');
      
      // Limpar todos os caches que começam com 'schedule_appointments_'
      const allKeys = await cacheService.getAllKeys();
      const keysToDelete = allKeys.filter(key => {
        // Remove o prefixo para verificar a chave real
        const keyWithoutPrefix = key.replace(/^cache_/, '');
        return keyWithoutPrefix.startsWith('schedule_appointments_');
      });
      
      for (const key of keysToDelete) {
        // Remove o prefixo para deletar a chave correta
        const keyWithoutPrefix = key.replace(/^cache_/, '');
        await cacheService.delete(keyWithoutPrefix);
      }
      
      console.log('Cache específico do usuário limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar cache específico do usuário:', error);
    }
  };

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
    try {
      // Obter usuário atual antes do login para limpar seu cache
      const currentUser = getCurrentUser();
      const previousUserId = currentUser?.id;
      
      const user = await authenticateUser(username, password);
      
      // Limpar cache do usuário anterior se for diferente
      if (previousUserId && previousUserId !== user.id) {
        await clearUserSpecificCache(previousUserId.toString());
      }
      
      // Sempre usar localStorage para persistência (6 horas)
      // O parâmetro rememberMe agora controla se o usuário permanece logado após F5
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('rememberMe', rememberMe.toString());
      
      // Marcar início da sessão no sessionStorage para controle de F5
      sessionStorage.setItem('sessionStart', new Date().getTime().toString());
      
      // Token já é armazenado no localStorage pelo authenticateUser
      // Definir expiração de 6 horas
      updateSessionExpiry(localStorage);

      if (user.role === 'barber') {
        localStorage.setItem('currentBarberId', user.id.toString());
      }

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    // Obter usuário atual antes de limpar para poder limpar seu cache
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id;
    
    setIsAuthenticated(false);
    
    // Clear all auth-related items from both storages
    const items = ['token', 'authToken', 'currentBarberId', 'user', 'sessionExpiry', 'tokenExpiration', 'rememberMe'];
    items.forEach(item => {
      localStorage.removeItem(item);
      sessionStorage.removeItem(item);
    });
    
    // Limpar também o marcador de sessão
    sessionStorage.removeItem('sessionStart');
    
    // Limpar cache específico do usuário
    if (currentUserId) {
      await clearUserSpecificCache(currentUserId.toString());
    }
    
    // Limpar todo o cache para garantir limpeza completa
    try {
      await cacheService.clear();
      console.log('Cache completamente limpo no logout');
    } catch (error) {
      console.error('Erro ao limpar cache no logout:', error);
    }
  };

  const getCurrentUser = () => {
    // Priorizar localStorage para persistência
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };
  
  // Função para renovar token automaticamente
  const renewToken = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return false;
      
      // Aqui você pode implementar uma chamada para renovar o token
      // Por enquanto, apenas estendemos o tempo de expiração
      updateSessionExpiry(localStorage);
      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;