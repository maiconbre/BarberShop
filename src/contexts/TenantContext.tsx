import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getBarbershopBySlug, type BarbershopData } from '../services/BarbershopService';
import { logger } from '../utils/logger';

interface TenantContextType {
  // Tenant data
  barbershopId: string | null;
  slug: string | null;
  barbershopData: BarbershopData | null;
  settings: Record<string, unknown> | null;
  
  // Loading states
  loading: boolean;
  error: Error | null;
  
  // Actions
  loadTenant: (slug: string) => Promise<void>;
  clearTenant: () => void;
  updateSettings: (newSettings: Record<string, unknown>) => void;
  
  // Utility
  isValidTenant: boolean;
}

interface TenantProviderProps {
  children: React.ReactNode;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = React.memo<TenantProviderProps>(({ children }) => {
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [barbershopData, setBarbershopData] = useState<BarbershopData | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current tenant is valid
  const isValidTenant = Boolean(barbershopId && slug && barbershopData);

  /**
   * Load tenant data from backend
   */
  const loadTenant = useCallback(async (tenantSlug: string) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.componentInfo('TenantContext', `Loading tenant data for slug: ${tenantSlug}`);
      
      // Store slug immediately
      setSlug(tenantSlug);
      
      // Get barbershop data from backend using public endpoint
      const data = await getBarbershopBySlug(tenantSlug);
      
      setBarbershopId(data.id);
      setBarbershopData(data);
      
      // Store barbershopId in localStorage for API requests
      localStorage.setItem('barbershopId', data.id);
      
      // Load settings (default for now, can be extended)
      const defaultSettings = {
        theme: 'default',
        timezone: 'America/Sao_Paulo',
        workingHours: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' },
          saturday: { start: '09:00', end: '16:00' },
          sunday: { start: '10:00', end: '14:00' }
        }
      };
      
      setSettings(defaultSettings);
      
      logger.componentInfo('TenantContext', `Tenant loaded successfully: ${data.name} (${data.slug})`);
      
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      logger.componentError('TenantContext', 'Failed to load tenant:', errorObj);
      
      // Clear tenant data on error
      setBarbershopId(null);
      setBarbershopData(null);
      setSettings(null);
      
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear tenant data
   */
  const clearTenant = useCallback(() => {
    setBarbershopId(null);
    setSlug(null);
    setBarbershopData(null);
    setSettings(null);
    setError(null);
    
    // Clear barbershopId from localStorage
    localStorage.removeItem('barbershopId');
    
    logger.componentInfo('TenantContext', 'Tenant data cleared');
  }, []);

  /**
   * Update tenant settings
   */
  const updateSettings = useCallback((newSettings: Record<string, unknown>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    
    logger.componentInfo('TenantContext', 'Settings updated:', newSettings);
  }, []);

  /**
   * Auto-load tenant when slug changes in URL
   */
  useEffect(() => {
    // Skip tenant loading for public routes
    const publicRoutes = [
      '/', '/showcase', '/about', '/services', '/contacts', '/login', '/register-barbershop', '/verify-email'
    ];
    
    const isPublicRoute = publicRoutes.includes(location.pathname);
    const isAppRoute = location.pathname.startsWith('/app/');
    
    if (isPublicRoute) {
      console.log('TenantContext - Public route detected, skipping tenant loading');
      clearTenant();
      return;
    }
    
    // Capturar slug tanto de /app/:barbershopSlug quanto de /:barbershopSlug
    let urlSlug = params.barbershopSlug;
    
    // Para rotas diretas como /:barbershopSlug, capturar do pathname
    if (!urlSlug && !isAppRoute) {
      const pathMatch = location.pathname.match(/^\/([a-zA-Z0-9-]+)$/);
      if (pathMatch) {
        const potentialSlug = pathMatch[1];
        // Verificar se não é uma rota pública conhecida
        const publicSlugs = [
          'about', 'services', 'contacts', 'login', 'register-barbershop', 'verify-email',
          'showcase', 'dashboard', 'agenda', 'analytics', 'trocar-senha', 'register',
          'gerenciar-comentarios', 'servicos', 'gerenciar-horarios'
        ];
        if (!publicSlugs.includes(potentialSlug)) {
          urlSlug = potentialSlug;
        }
      }
    }
    
    console.log('TenantContext useEffect - Debug:', {
      urlSlug,
      currentSlug: slug,
      pathname: location.pathname,
      paramsSlug: params.barbershopSlug,
      isPublicRoute,
      isAppRoute
    });

    if (urlSlug && urlSlug !== slug) {
      logger.componentInfo('TenantContext', `URL slug changed to: ${urlSlug}`);
      console.log('TenantContext - Carregando tenant para slug:', urlSlug);
      
      loadTenant(urlSlug).catch(error => {
        logger.componentError('TenantContext', 'Auto-load tenant failed:', error);
        console.error('TenantContext - Erro ao carregar tenant:', error);
        // Removido redirecionamento automático para permitir acesso direto
      });
    } else if (!urlSlug && slug && !isAppRoute) {
      // Clear tenant if no slug in URL, but not for app routes during navigation
      console.log('TenantContext - Limpando tenant (sem slug na URL)');
      clearTenant();
    } else {
      console.log('TenantContext - Nenhuma ação necessária');
    }
  }, [params.barbershopSlug, location.pathname, slug, loadTenant, clearTenant, navigate]);

  const contextValue: TenantContextType = {
    // Tenant data
    barbershopId,
    slug,
    barbershopData,
    settings,
    
    // Loading states
    loading,
    error,
    
    // Actions
    loadTenant,
    clearTenant,
    updateSettings,
    
    // Utility
    isValidTenant
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
});

TenantProvider.displayName = 'TenantProvider';

export default TenantContext;