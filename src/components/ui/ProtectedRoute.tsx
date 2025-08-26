import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { barbershopSlug } = useParams<{ barbershopSlug: string }>();
  const { isValidTenant, loading: tenantLoading, error: tenantError } = useTenant();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldCompleteProgress, setShouldCompleteProgress] = useState(false);

  useEffect(() => {
    // Aguardar o AuthContext e TenantContext inicializarem
    const timer = setTimeout(() => {
      if (isAuthenticated && (isValidTenant || !tenantLoading)) {
        setShouldCompleteProgress(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 200);
      } else if (!tenantLoading) {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isValidTenant, tenantLoading]);

  // Mostrar loading enquanto verifica autenticação e tenant
  if (isLoading || tenantLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="lg" 
        text={tenantLoading ? "Carregando contexto..." : "Verificando autenticação..."}
        showProgressBar={true}
        progressDuration={400}
        forceComplete={shouldCompleteProgress}
      />
    );
  }

  // Verificar autenticação
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se há erro no tenant ou tenant inválido
  if (tenantError || !isValidTenant) {
    // Se há um barbershopSlug na URL mas o tenant é inválido, redirecionar para a página da barbearia
    if (barbershopSlug) {
      return <Navigate to={`/${barbershopSlug}`} replace />;
    }
    // Caso contrário, redirecionar para a landing page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;