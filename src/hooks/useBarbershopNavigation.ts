import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

export const useBarbershopNavigation = () => {
  const navigate = useNavigate();
  const { barbershopSlug } = useParams<{ barbershopSlug: string }>();
  const { slug } = useTenant();

  // Usar o slug do contexto ou do parâmetro da URL
  const currentSlug = slug || barbershopSlug;

  /**
   * Navegar para a página inicial da barbearia
   */
  const goToHome = () => {
    if (currentSlug) {
      navigate(`/${currentSlug}`);
    } else {
      navigate('/');
    }
  };

  /**
   * Navegar para o dashboard da barbearia
   */
  const goToDashboard = () => {
    if (currentSlug) {
      navigate(`/app/${currentSlug}/dashboard`);
    }
  };

  /**
   * Navegar para uma página específica da barbearia
   */
  const goToPage = (page: string) => {
    if (currentSlug) {
      navigate(`/app/${currentSlug}/${page}`);
    }
  };

  /**
   * Gerar URL para a página inicial da barbearia
   */
  const getHomeUrl = (slug?: string) => {
    const targetSlug = slug || currentSlug;
    return targetSlug ? `/${targetSlug}` : '/';
  };

  /**
   * Gerar URL para uma página específica da barbearia
   */
  const getPageUrl = (page: string, slug?: string) => {
    const targetSlug = slug || currentSlug;
    return targetSlug ? `/app/${targetSlug}/${page}` : `/${page}`;
  };

  /**
   * Verificar se estamos em uma página da barbearia
   */
  const isInBarbershop = Boolean(currentSlug);

  /**
   * Verificar se estamos na página inicial da barbearia
   */
  const isOnHomePage = window.location.pathname === `/${currentSlug}`;

  /**
   * Verificar se estamos em uma página administrativa da barbearia
   */
  const isOnAdminPage = window.location.pathname.startsWith(`/app/${currentSlug}/`);

  return {
    currentSlug,
    goToHome,
    goToDashboard,
    goToPage,
    getHomeUrl,
    getPageUrl,
    isInBarbershop,
    isOnHomePage,
    isOnAdminPage
  };
};

export default useBarbershopNavigation;