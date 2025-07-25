import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateUser } from '../services/auth';
import cacheService from '../services/CacheService';

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

const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkSessionValidity = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const expiryTime = localStorage.getItem('sessionExpiry') || sessionStorage.getItem('sessionExpiry');
    if (!token || !expiryTime) return false;

    const currentTime = new Date().getTime();
    return currentTime < parseInt(expiryTime);
  };

  const updateSessionExpiry = (storage: Storage) => {
    const expiryTime = new Date().getTime() + SESSION_EXPIRY;
    storage.setItem('sessionExpiry', expiryTime.toString());
  };

  useEffect(() => {
    const validateSession = () => {
      if (checkSessionValidity()) {
        setIsAuthenticated(true);
        // Update expiry time when session is still valid
        if (localStorage.getItem('token')) {
          updateSessionExpiry(localStorage);
        } else if (sessionStorage.getItem('token')) {
          updateSessionExpiry(sessionStorage);
        }
      } else {
        // Clear session if expired
        logout();
      }
    };

    validateSession();
    const interval = setInterval(validateSession, 60000); // Check every minute

    return () => clearInterval(interval);
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

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      // Obter usuário atual antes do login para limpar seu cache
      const currentUser = getCurrentUser();
      const previousUserId = currentUser?.id;
      
      const user = await authenticateUser(username, password);
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Limpar cache do usuário anterior se for diferente
      if (previousUserId && previousUserId !== user.id) {
        await clearUserSpecificCache(previousUserId.toString());
      }
      
      // Store user in the selected storage
      storage.setItem('user', JSON.stringify(user));
      
      // Token is already stored in both localStorage and sessionStorage by authenticateUser
      // Just update the session expiry in the appropriate storage
      updateSessionExpiry(storage);

      if (user.role === 'barber') {
        storage.setItem('currentBarberId', user.id.toString());
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
    const items = ['token', 'authToken', 'currentBarberId', 'user', 'sessionExpiry'];
    items.forEach(item => {
      localStorage.removeItem(item);
      sessionStorage.removeItem(item);
    });
    
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
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;