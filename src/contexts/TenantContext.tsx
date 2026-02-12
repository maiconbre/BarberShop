import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getBarbershopBySlug, type BarbershopData } from '../services/BarbershopService';
import { ServiceFactory } from '../services/ServiceFactory';
import { logger } from '../utils/logger';

interface TenantContextType {
  // Tenant data
  barbershopId: string | null;
  tenantId: string | null;
  slug: string | null;
  barbershopData: BarbershopData | null;
  settings: Record<string, unknown> | null;
  planType: string | null; // 'free' or 'premium'

  // Loading states
  loading: boolean;
  error: Error | null;

  // Actions
  loadTenant: (slug: string) => Promise<void>;
  clearTenant: () => void;
  refreshTenant: () => Promise<void>; // Invalidar cache e recarregar
  updateSettings: (newSettings: Record<string, unknown>) => void;

  // Utility
  isValidTenant: boolean;
  isFreePlan: boolean;
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
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [barbershopData, setBarbershopData] = useState<BarbershopData | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const params = useParams<{ barbershopSlug: string }>();
  const location = useLocation();

  // Check if current tenant is valid
  const isValidTenant = Boolean(barbershopId && slug && barbershopData);

  /**
   * Load tenant data from backend (with cache)
   */
  const loadTenant = useCallback(async (tenantSlug: string) => {
    try {
      setLoading(true);
      setError(null);

      logger.componentInfo('TenantContext', `Loading tenant data for slug: ${tenantSlug}`);

      // Store slug immediately
      setSlug(tenantSlug);

      // ========================================
      // PASSO 1: Verificar cache primeiro
      // ========================================
      const { TenantCacheService } = await import('../services/TenantCacheService');
      const cachedData = TenantCacheService.get(tenantSlug);

      if (cachedData) {
        logger.componentInfo('TenantContext', `Using cached data for slug: ${tenantSlug}`);

        setBarbershopId(cachedData.id);
        setTenantId(cachedData.tenantId || null);
        setBarbershopData(cachedData);
        setPlanType(cachedData.planType || 'free'); // Set plan type from cache

        // Store barbershopId and barbershopSlug in localStorage for API requests
        localStorage.setItem('barbershopId', cachedData.id);
        if (cachedData.tenantId) {
          localStorage.setItem('tenantId', cachedData.tenantId);
        }
        localStorage.setItem('barbershopSlug', tenantSlug);
        localStorage.setItem('planType', cachedData.planType || 'free'); // Save plan type

        // Update ServiceFactory with new tenant context
        ServiceFactory.updateTenantContext(cachedData.id);

        // Load settings from cached data or use defaults
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
          },
          ...(cachedData.settings || {})
        };

        setSettings(defaultSettings);

        logger.componentInfo('TenantContext', `Tenant loaded from cache: ${cachedData.name} (${cachedData.slug})`);
        setLoading(false);
        return;
      }

      // ========================================
      // PASSO 2: Buscar do backend se não estiver em cache
      // ========================================
      logger.componentInfo('TenantContext', `Cache miss, fetching from backend for slug: ${tenantSlug}`);

      // Get barbershop data from backend using public endpoint
      const data = await getBarbershopBySlug(tenantSlug);

      setBarbershopId(data.id);
      setTenantId(data.tenantId || null);
      setBarbershopData(data);
      setPlanType(data.planType || 'free'); // Set plan type

      // Store barbershopId and barbershopSlug in localStorage for API requests
      localStorage.setItem('barbershopId', data.id);
      if (data.tenantId) {
        localStorage.setItem('tenantId', data.tenantId);
      }
      localStorage.setItem('barbershopSlug', tenantSlug);
      localStorage.setItem('planType', data.planType || 'free'); // Save plan type

      // Update ServiceFactory with new tenant context
      ServiceFactory.updateTenantContext(data.id);

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
        },
        ...(data.settings || {})
      };

      setSettings(defaultSettings);

      // ========================================
      // PASSO 3: Salvar no cache
      // ========================================
      TenantCacheService.set(tenantSlug, data);

      logger.componentInfo('TenantContext', `Tenant loaded successfully from backend: ${data.name} (${data.slug})`);

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
   * Clear tenant data (including cache)
   */
  const clearTenant = useCallback(async () => {
    // Clear barbershopId and barbershopSlug from localStorage
    localStorage.removeItem('barbershopId');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('barbershopSlug');

    // Clear cache
    const { TenantCacheService } = await import('../services/TenantCacheService');
    TenantCacheService.clear();

    // Reset ServiceFactory to clear tenant-specific services
    ServiceFactory.reset();

    logger.componentInfo('TenantContext', 'Tenant data and cache cleared');
  }, []);

  /**
   * Refresh tenant data (invalidate cache and reload)
   */
  const refreshTenant = useCallback(async () => {
    if (!slug) {
      logger.componentWarn('TenantContext', 'Cannot refresh: no slug available');
      return;
    }

    logger.componentInfo('TenantContext', `Refreshing tenant data for slug: ${slug}`);

    // Invalidar cache
    const { TenantCacheService } = await import('../services/TenantCacheService');
    TenantCacheService.invalidate(slug);

    // Recarregar
    await loadTenant(slug);
  }, [slug, loadTenant]);

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
   * Force localStorage sync whenever barbershopId or tenantId changes
   */
  useEffect(() => {
    if (barbershopId) {
      console.log('🔄 TenantContext - Syncing localStorage with barbershopId:', barbershopId);
      localStorage.setItem('barbershopId', barbershopId);
    }
    if (tenantId) {
      console.log('🔄 TenantContext - Syncing localStorage with tenantId:', tenantId);
      localStorage.setItem('tenantId', tenantId);
    }
    if (slug) {
      console.log('🔄 TenantContext - Syncing localStorage with slug:', slug);
      localStorage.setItem('barbershopSlug', slug);
    }
  }, [barbershopId, tenantId, slug]);

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

    // Capturar slug de forma mais robusta
    let urlSlug: string | null = null;

    // Primeiro, tentar usar params.barbershopSlug (funciona quando as rotas estão bem definidas)
    if (params.barbershopSlug) {
      urlSlug = params.barbershopSlug;
    }
    // Se params não funcionar, extrair diretamente do pathname
    else if (isAppRoute) {
      const appRouteMatch = location.pathname.match(/^\/app\/([a-zA-Z0-9-]+)/);
      if (appRouteMatch) {
        urlSlug = appRouteMatch[1];
      }
    }
    // Para rotas diretas como /:barbershopSlug
    else {
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
      isAppRoute,
      paramsObject: params
    });

    if (urlSlug && urlSlug !== slug) {
      logger.componentInfo('TenantContext', `URL slug changed to: ${urlSlug}`);
      console.log('TenantContext - Carregando tenant para slug:', urlSlug);

      loadTenant(urlSlug).catch(error => {
        logger.componentError('TenantContext', 'Auto-load tenant failed:', error);
        console.error('TenantContext - Erro ao carregar tenant:', error);
      });
    } else if (!urlSlug && slug && !isAppRoute) {
      // Clear tenant if no slug in URL, but not for app routes during navigation
      console.log('TenantContext - Limpando tenant (sem slug na URL)');
      clearTenant();
    } else {
      console.log('TenantContext - Nenhuma ação necessária');
    }
  }, [params.barbershopSlug, location.pathname, slug, loadTenant, clearTenant]);

  const contextValue: TenantContextType = React.useMemo(() => ({
    // Tenant data
    barbershopId,
    tenantId,
    slug,
    barbershopData,
    settings,

    // Loading states
    loading,
    error,

    // Actions
    loadTenant,
    clearTenant,
    refreshTenant,
    updateSettings,

    // Utility
    isValidTenant,
    planType,
    isFreePlan: planType === 'free'
  }), [
    barbershopId,
    tenantId,
    slug,
    barbershopData,
    settings,
    loading,
    error,
    loadTenant,
    clearTenant,
    refreshTenant,
    updateSettings,
    isValidTenant
  ]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
});

TenantProvider.displayName = 'TenantProvider';

export default TenantContext;