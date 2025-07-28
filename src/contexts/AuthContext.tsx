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
    const authToken = localStorage.getItem('authToken');
    const token = localStorage.getItem('token');
    const finalToken = authToken || token;
    const expiryTime = localStorage.getItem('tokenExpiration') || localStorage.getItem('sessionExpiry');
    const user = localStorage.getItem('user');
    const rememberMe = localStorage.getItem('rememberMe');
    
    // Log detalhado para debug
    console.log('AuthContext - Verificando sessão (detalhado):', {
      authToken: authToken ? 'presente' : 'ausente',
      token: token ? 'presente' : 'ausente',
      finalToken: finalToken ? 'presente' : 'ausente',
      tokenExpiration: localStorage.getItem('tokenExpiration') ? 'presente' : 'ausente',
      sessionExpiry: localStorage.getItem('sessionExpiry') ? 'presente' : 'ausente',
      user: user ? 'presente' : 'ausente',
      rememberMe: rememberMe,
      allLocalStorageKeys: Object.keys(localStorage),
      currentTime: new Date().toISOString()
    });
    
    // Se não há dados básicos de autenticação, retornar false
    if (!finalToken || !expiryTime || !user) {
      console.log('AuthContext - Dados básicos ausentes:', {
        missingToken: !finalToken,
        missingExpiryTime: !expiryTime,
        missingUser: !user
      });
      return false;
    }

    // Verificar se a sessão expirou
    const currentTime = new Date().getTime();
    const expirationTime = parseInt(expiryTime);
    const isTokenValid = currentTime < expirationTime;
    
    // Log para debug da expiração
    const timeUntilExpiry = expirationTime - currentTime;
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
    console.log('AuthContext - Verificação de expiração:', {
      currentTime: new Date(currentTime).toISOString(),
      expirationTime: new Date(expirationTime).toISOString(),
      isTokenValid,
      hoursUntilExpiry: hoursUntilExpiry.toFixed(2)
    });
    
    // Se o token expirou, retornar false
    if (!isTokenValid) {
      console.log('AuthContext - Token expirado, invalidando sessão');
      return false;
    }
    
    // Simplificar lógica do rememberMe - se não está definido, assumir true por padrão
    // Isso evita logout desnecessário quando o usuário não escolheu explicitamente
    const shouldRemember = rememberMe !== 'false'; // true por padrão, false apenas se explicitamente definido
    
    if (!shouldRemember) {
      // Verificar se é uma nova sessão do navegador apenas se rememberMe for explicitamente false
      const sessionStart = sessionStorage.getItem('sessionStart');
      if (!sessionStart) {
        console.log('AuthContext - Nova sessão detectada e usuário não quer manter-se logado');
        return false;
      }
    }
    
    console.log('AuthContext - Sessão válida');
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
      console.log('AuthContext - Executando validação de sessão');
      const isValid = checkSessionValidity();
      
      if (isValid) {
        if (!isAuthenticated) {
          console.log('AuthContext - Sessão válida, definindo como autenticado');
          setIsAuthenticated(true);
        }
        // Verificar se o token precisa ser renovado
        checkTokenRenewal();
      } else {
        // Só limpar dados se o usuário estava previamente autenticado
        // Isso evita limpar dados válidos durante a inicialização
        if (isAuthenticated || isInitialized.current) {
          console.log('AuthContext - Sessão inválida, fazendo logout');
          setIsAuthenticated(false);
          // Limpar dados sem chamar logout() para evitar loops
          const items = ['token', 'authToken', 'currentBarberId', 'user', 'sessionExpiry', 'tokenExpiration', 'rememberMe'];
          items.forEach(item => {
            localStorage.removeItem(item);
            sessionStorage.removeItem(item);
          });
          sessionStorage.removeItem('sessionStart');
        } else {
          console.log('AuthContext - Sessão inválida na inicialização, mas não limpando dados ainda');
        }
      }
    };

    // Validação inicial apenas uma vez
    if (!isInitialized.current) {
      console.log('AuthContext - Executando validação inicial');
      validateSession();
      isInitialized.current = true;
    }
    
    // Verificar a cada 15 minutos para reduzir overhead
    const interval = setInterval(() => {
      console.log('AuthContext - Verificação periódica de sessão');
      validateSession();
    }, 15 * 60 * 1000);
    
    // Listener para detectar mudanças de aba/janela e revalidar sessão
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('AuthContext - Aba ficou visível, validando sessão');
        validateSession();
      }
    };
    
    // Listener para detectar foco na janela (menos agressivo)
    const handleFocus = () => {
      // Só validar se passou mais de 5 minutos desde a última validação
      const lastValidation = localStorage.getItem('lastSessionValidation');
      const now = Date.now();
      if (!lastValidation || (now - parseInt(lastValidation)) > 5 * 60 * 1000) {
        console.log('AuthContext - Janela focada após 5+ minutos, validando sessão');
        localStorage.setItem('lastSessionValidation', now.toString());
        validateSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]); // Adicionar isAuthenticated como dependência

  const clearUserSpecificCache = async (userId?: string) => {
    try {
      // Limpar cache específico do usuário anterior
      if (userId) {
        cacheService.remove(`schedule_appointments_${userId}`);
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

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
    try {
      console.log('AuthContext - Iniciando login:', { username, rememberMe });
      
      // Obter usuário atual antes do login para limpar seu cache
      const currentUser = getCurrentUser();
      const previousUserId = currentUser?.id;
      
      const user = await authenticateUser(username, password);
      
      console.log('AuthContext - Usuário autenticado:', { userId: user.id, role: user.role });
      
      // Limpar cache do usuário anterior se for diferente
      if (previousUserId && previousUserId !== user.id) {
        await clearUserSpecificCache(previousUserId.toString());
      }
      
      // Sempre usar localStorage para persistência (6 horas)
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('rememberMe', rememberMe.toString());
      
      // Marcar início da sessão no sessionStorage para controle de F5
      sessionStorage.setItem('sessionStart', new Date().getTime().toString());
      
      // Token já é armazenado no localStorage pelo authenticateUser
      // Definir expiração de 6 horas
      updateSessionExpiry(localStorage);
      
      console.log('AuthContext - Configuração de sessão:', {
        rememberMe: rememberMe.toString(),
        sessionStart: sessionStorage.getItem('sessionStart'),
        tokenExpiration: localStorage.getItem('tokenExpiration')
      });

      if (user.role === 'barber') {
        localStorage.setItem('currentBarberId', user.id.toString());
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
      if (!currentUser) {
        console.log('AuthContext - Não é possível renovar token: usuário não encontrado');
        return false;
      }
      
      console.log('AuthContext - Renovando token para usuário:', currentUser.id);
      
      // Aqui você pode implementar uma chamada para renovar o token
      // Por enquanto, apenas estendemos o tempo de expiração
      updateSessionExpiry(localStorage);
      
      console.log('AuthContext - Token renovado com sucesso');
      return true;
    } catch (error) {
      console.error('AuthContext - Erro ao renovar token:', error);
      return false;
    }
  };
  
  // Função para verificar se o token precisa ser renovado
  const checkTokenRenewal = () => {
    const expiryTime = localStorage.getItem('tokenExpiration');
    if (!expiryTime) return;
    
    const currentTime = new Date().getTime();
    const expirationTime = parseInt(expiryTime);
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Renovar token se faltam menos de 30 minutos para expirar
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (timeUntilExpiry > 0 && timeUntilExpiry < thirtyMinutes) {
      console.log('AuthContext - Token próximo do vencimento, renovando automaticamente');
      renewToken();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;