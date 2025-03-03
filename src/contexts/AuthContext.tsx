import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateUser } from '../services/auth'

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

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      const user = await authenticateUser(username, password);
      const storage = rememberMe ? localStorage : sessionStorage;
      
      storage.setItem('user', JSON.stringify(user));
      storage.setItem('token', user.token);
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

  const logout = () => {
    setIsAuthenticated(false);
    
    // Clear all auth-related items from both storages
    const items = ['token', 'authToken', 'currentBarberId', 'user', 'sessionExpiry'];
    items.forEach(item => {
      localStorage.removeItem(item);
      sessionStorage.removeItem(item);
    });
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