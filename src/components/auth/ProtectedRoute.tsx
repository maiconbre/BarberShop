import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, getCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Usar a nova estrutura de autenticação com Supabase
      const user = getCurrentUser();
      
      if (!user) {
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
      }
      
      setIsLoading(false);
    };

    // Pequeno delay para permitir que o AuthContext inicialize
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, [getCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0B35B]"></div>
      </div>
    );
  }

  if (shouldRedirect || !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;