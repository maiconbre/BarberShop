import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { getCurrentBarbershop } from '../../services/BarbershopService';
import { logger } from '../../utils/logger';

interface LoginRedirectHandlerProps {
  children: React.ReactNode;
}

/**
 * Component that handles redirection after login to tenant-aware routes
 * Automatically redirects authenticated users to their barbershop dashboard
 */
export const LoginRedirectHandler: React.FC<LoginRedirectHandlerProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { barbershopId, slug, loadTenant } = useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLoginRedirect = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        // If we already have tenant context, redirect to tenant dashboard
        if (barbershopId && slug) {
          logger.componentInfo('LoginRedirectHandler', `Redirecting to tenant dashboard: /app/${slug}/dashboard`);
          navigate(`/app/${slug}/dashboard`, { replace: true });
          return;
        }

        // If authenticated but no tenant context, load it from backend
        logger.componentInfo('LoginRedirectHandler', 'Loading tenant context for authenticated user');
        
        const barbershopData = await getCurrentBarbershop();
        
        if (barbershopData && barbershopData.slug) {
          // Load tenant context
          await loadTenant(barbershopData.slug);
          
          // Redirect to tenant dashboard
          logger.componentInfo('LoginRedirectHandler', `Redirecting to loaded tenant dashboard: /app/${barbershopData.slug}/dashboard`);
          navigate(`/app/${barbershopData.slug}/dashboard`, { replace: true });
        } else {
          // No barbershop found, redirect to registration
          logger.componentWarn('LoginRedirectHandler', 'No barbershop found for authenticated user, redirecting to registration');
          navigate('/register-barbershop', { replace: true });
        }

      } catch (error) {
        logger.componentError('LoginRedirectHandler', 'Failed to handle login redirect:', error);
        
        // If there's an error loading tenant context, redirect to registration
        navigate('/register-barbershop', { replace: true });
      }
    };

    handleLoginRedirect();
  }, [isAuthenticated, barbershopId, slug, loadTenant, navigate]);

  return <>{children}</>;
};

export default LoginRedirectHandler;