import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { getCurrentBarbershop } from '../services/BarbershopService';

/**
 * Hook personalizado para redirecionar usuários autenticados
 * Útil para páginas como login que não devem ser acessadas por usuários já logados
 * Agora usa rotas tenant-aware por padrão
 * 
 * @param enabled - Se o redirecionamento está habilitado (padrão: true)
 */
export const useAuthRedirect = (enabled: boolean = true) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { loadTenant } = useTenant();

  useEffect(() => {
    // Não redirecionar se estiver em rotas admin
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    if (isAdminRoute) {
      console.log('useAuthRedirect - Rota admin detectada, pulando redirecionamento');
      return;
    }

    if (enabled && isAuthenticated) {
      const redirectToTenantDashboard = async () => {
        try {
          const barbershopData = await getCurrentBarbershop();
          
          if (barbershopData && barbershopData.slug) {
            await loadTenant(barbershopData.slug);
            const redirectTo = `/app/${barbershopData.slug}/dashboard`;
            console.log(`useAuthRedirect - Usuário já autenticado, redirecionando para ${redirectTo}`);
            navigate(redirectTo, { replace: true });
          } else {
            // Se não há barbearia, redireciona para registro
            console.log('useAuthRedirect - Sem barbearia associada, redirecionando para registro');
            navigate('/register-barbershop', { replace: true });
          }
        } catch (error) {
          console.error('Erro ao carregar tenant para redirecionamento:', error);
          
          // Se o erro for que o usuário não tem barbearia, redirecionar para registro
          if (error instanceof Error && error.message.includes('não possui barbearia')) {
            console.log('useAuthRedirect - Usuário sem barbearia, redirecionando para registro');
            navigate('/register-barbershop', { replace: true });
          } else {
            // Para outros erros, manter na página atual (não redirecionar)
            console.warn('useAuthRedirect - Erro ao verificar barbearia, mantendo na página atual');
          }
        }
      };
      
      redirectToTenantDashboard();
    }
  }, [isAuthenticated, navigate, enabled, loadTenant, location.pathname]);

  return { isAuthenticated };
};

export default useAuthRedirect;