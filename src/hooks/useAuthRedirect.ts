import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { isAuthenticated } = useAuth();
  const { loadTenant } = useTenant();

  useEffect(() => {
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
            navigate('/register-barbershop', { replace: true });
          }
        } catch (error) {
          console.error('Erro ao carregar tenant para redirecionamento:', error);
          // Em caso de erro, redireciona para login
          navigate('/login', { replace: true });
        }
      };
      
      redirectToTenantDashboard();
    }
  }, [isAuthenticated, navigate, enabled, loadTenant]);

  return { isAuthenticated };
};

export default useAuthRedirect;