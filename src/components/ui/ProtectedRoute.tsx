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
  const [shouldCompleteProgress, setShouldCompleteProgress] = useState(false);

  useEffect(() => {
    // Aguardar o AuthContext inicializar e depois verificar autenticação
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        setShouldCompleteProgress(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 200);
      } else {
        setIsLoading(false);
      }
    }, 400); // Reduzido para 400ms

    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="lg" 
        text="Verificando autenticação..." 
        showProgressBar={true}
        progressDuration={400}
        forceComplete={shouldCompleteProgress}
      />
    );
  }

  // Verificar apenas o contexto de autenticação
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;