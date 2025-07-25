import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [shouldCompleteProgress, setShouldCompleteProgress] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Verificar se há token no localStorage
      const token = localStorage.getItem('authToken');
      const expirationTime = localStorage.getItem('tokenExpiration');
      
      if (token && expirationTime) {
        const now = Date.now();
        const expiration = parseInt(expirationTime, 10);
        
        if (now < expiration) {
          setHasValidToken(true);
          // Token válido, completa a barra de progresso e depois remove o loading
          setShouldCompleteProgress(true);
          setTimeout(() => {
            setIsLoading(false);
          }, 400); // Pequeno delay para mostrar a barra completando
        } else {
          // Token expirado, limpar dados
          localStorage.removeItem('authToken');
          localStorage.removeItem('tokenExpiration');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
          setHasValidToken(false);
          setIsLoading(false);
        }
      } else {
        setHasValidToken(false);
        setIsLoading(false);
      }
    };

    // Pequeno delay para permitir que o AuthContext inicialize
    const timer = setTimeout(checkAuth, 1200);
    
    return () => clearTimeout(timer);
  }, []);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="lg" 
        text="Verificando autenticação..." 
        showProgressBar={true}
        progressDuration={1200}
        forceComplete={shouldCompleteProgress}
      />
    );
  }

  // Verificar tanto o contexto quanto o token local
  if (!isAuthenticated && !hasValidToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;