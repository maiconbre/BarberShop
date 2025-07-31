import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para redirecionar usuários autenticados
 * Útil para páginas como login que não devem ser acessadas por usuários já logados
 * 
 * @param redirectTo - Rota para onde redirecionar (padrão: '/dashboard')
 * @param enabled - Se o redirecionamento está habilitado (padrão: true)
 */
export const useAuthRedirect = (redirectTo: string = '/dashboard', enabled: boolean = true) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (enabled && isAuthenticated) {
      console.log(`useAuthRedirect - Usuário já autenticado, redirecionando para ${redirectTo}`);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo, enabled]);

  return { isAuthenticated };
};

export default useAuthRedirect;