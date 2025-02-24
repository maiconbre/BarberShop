import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeMockAppointments } from '../data/mockAppointments';
import { authenticateUser } from '../services/auth'

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
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
    const expiryTime = localStorage.getItem('sessionExpiry') || sessionStorage.getItem('sessionExpiry');
    if (!expiryTime) return false;

    const currentTime = new Date().getTime();
    return currentTime < parseInt(expiryTime);
  };

  const updateSessionExpiry = (storage: Storage) => {
    const expiryTime = new Date().getTime() + SESSION_EXPIRY;
    storage.setItem('sessionExpiry', expiryTime.toString());
  };

  useEffect(() => {
    const validateSession = () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token && checkSessionValidity()) {
        setIsAuthenticated(true);
        // Update expiry time when session is still valid
        if (localStorage.getItem('authToken')) {
          updateSessionExpiry(localStorage);
        } else if (sessionStorage.getItem('authToken')) {
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

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const user = await authenticateUser(email, password)
      const storage = rememberMe ? localStorage : sessionStorage;
      
      storage.setItem('user', JSON.stringify(user));
      storage.setItem('authToken', 'true');
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentBarberId');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionExpiry');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentBarberId');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sessionExpiry');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};