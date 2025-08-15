import { useState, useCallback, useMemo } from 'react';
import { useServiceRepository } from '../services/ServiceFactory';
import { useTenant } from '../contexts/TenantContext';
import { createTenantAwareRepository } from '../services/TenantAwareRepository';
import { createTenantAwareCache } from '../services/TenantAwareCache';
import type { Service } from '../types';
import type { ServiceStatistics } from '../services/repositories/ServiceRepository';
import type { SearchOptions } from '../services/interfaces/IRepository';

/**
 * Hook para gerenciamento de serviços baseado na estrutura real do backend
 * Automaticamente inclui contexto de tenant (barbershopId) em todas as operações
 * 
 * Estrutura real do backend:
 * - Campos: id(UUID), name, price
 * - Método findByBarber usando GET /api/services/barber/:barberId
 * - Método associateBarbers usando POST /api/services/:id/barbers (requer auth)
 * - Rate limiting generoso (300 req/min)
 * - Filtros frontend para campos não disponíveis no backend
 * - Multi-tenant: todas as operações incluem barbershopId automaticamente
 */
export const useServices = () => {
  const baseRepository = useServiceRepository();
  const { barbershopId, isValidTenant } = useTenant();

  // Create tenant-aware repository
  const tenantRepository = useMemo(() => {
    return createTenantAwareRepository(baseRepository, () => barbershopId);
  }, [baseRepository, barbershopId]);

  const tenantCache = useMemo(() => {
    return createTenantAwareCache(() => barbershopId);
  }, [barbershopId]);

  // State for services list
  const [services, setServices] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // State for create operations
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<Error | null>(null);

  // State for update operations
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<Error | null>(null);

  // State for delete operations
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<Error | null>(null);

  // State for association operations
  const [associating, setAssociating] = useState(false);
  const [associateError, setAssociateError] = useState<Error | null>(null);

  /**
   * Ensure tenant is valid before operations
   */
  const ensureTenant = useCallback(() => {
    if (!isValidTenant) {
      throw new Error('Valid tenant context is required for this operation');
    }
  }, [isValidTenant]);

  /**
   * Carrega todos os serviços com filtros opcionais (com contexto de tenant)
   * GET /api/services
   * Automaticamente inclui barbershopId
   */
  const loadServices = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        ensureTenant();
        setLoading(true);
        setError(null);

        const cacheKey = `services:${JSON.stringify(filters || {})}`;

        // Try cache first
        const cached = tenantCache.get<Service[]>(cacheKey);
        if (cached) {
          setServices(cached);
          return cached;
        }

        const result = await tenantRepository.findAll(filters);
        setServices(result);

        // Cache the result
        tenantCache.set(cacheKey, result, { ttl: 5 * 60 * 1000 }); // 5 minutes

        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Busca serviço por UUID (com contexto de tenant)
   * GET /api/services/:id
   */
  const getServiceById = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.findById(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca serviços ativos (com contexto de tenant)
   */
  const getActiveServices = useCallback(
    async () => {
      ensureTenant();
      return tenantRepository.findAll({ isActive: true });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca serviços por barbeiro (com contexto de tenant)
   * GET /api/services/barber/:barberId
   */
  const getServicesByBarber = useCallback(
    async (barberId: string) => {
      ensureTenant();

      const cacheKey = `services:barber:${barberId}`;
      const cached = tenantCache.get<Service[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await tenantRepository.findAll({ barberId });
      tenantCache.set(cacheKey, result, { ttl: 5 * 60 * 1000 });

      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Busca serviços por nome (com contexto de tenant)
   */
  const getServicesByName = useCallback(
    async (name: string) => {
      ensureTenant();
      return tenantRepository.findAll({ name });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca serviços por faixa de preço (com contexto de tenant)
   */
  const getServicesByPriceRange = useCallback(
    async (minPrice: number, maxPrice: number) => {
      ensureTenant();
      return tenantRepository.findAll({ minPrice, maxPrice });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca serviços por duração (com contexto de tenant)
   */
  const getServicesByDuration = useCallback(
    async (minDuration: number, maxDuration?: number) => {
      ensureTenant();
      return tenantRepository.findAll({ minDuration, maxDuration });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca serviços associados a um barbeiro específico (com contexto de tenant)
   */
  const getServicesByAssociatedBarber = useCallback(
    async (barberId: string) => {
      return getServicesByBarber(barberId);
    },
    [getServicesByBarber]
  );

  /**
   * Busca serviços com texto (com contexto de tenant)
   */
  const searchServices = useCallback(
    async (query: string, options?: SearchOptions) => {
      ensureTenant();
      return tenantRepository.search(query, {
        ...options
      });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Cria um novo serviço (com contexto de tenant)
   * POST /api/services (apenas name e price são suportados pelo backend)
   * Automaticamente inclui barbershopId
   */
  const createService = useCallback(
    async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        ensureTenant();
        setCreating(true);
        setCreateError(null);

        const newService = await tenantRepository.create(serviceData);

        // Clear cache to force refresh
        tenantCache.clearTenantCache();

        // Atualiza a lista local se existir
        if (services) {
          await loadServices();
        }

        return newService;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [tenantRepository, tenantCache, services, loadServices, ensureTenant]
  );

  /**
   * Atualiza um serviço existente (com contexto de tenant)
   * PATCH /api/services/:id (apenas name e price são suportados pelo backend)
   * Verifica se pertence ao tenant atual
   */
  const updateService = useCallback(
    async (id: string, updates: Partial<Service>) => {
      try {
        ensureTenant();
        setUpdating(true);
        setUpdateError(null);

        const updatedService = await tenantRepository.update(id, updates);

        // Clear cache to force refresh
        tenantCache.clearTenantCache();

        // Atualiza a lista local se existir
        if (services) {
          await loadServices();
        }

        return updatedService;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [tenantRepository, tenantCache, services, loadServices, ensureTenant]
  );

  /**
   * Remove um serviço (com contexto de tenant)
   * DELETE /api/services/:id
   * Verifica se pertence ao tenant atual
   */
  const deleteService = useCallback(
    async (id: string) => {
      try {
        ensureTenant();
        setDeleting(true);
        setDeleteError(null);

        await tenantRepository.delete(id);

        // Clear cache to force refresh
        tenantCache.clearTenantCache();

        // Atualiza a lista local se existir
        if (services) {
          await loadServices();
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setDeleteError(errorObj);
        throw errorObj;
      } finally {
        setDeleting(false);
      }
    },
    [tenantRepository, tenantCache, services, loadServices, ensureTenant]
  );

  /**
   * Verifica se um serviço existe (com contexto de tenant)
   */
  const checkServiceExists = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.exists(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Associa barbeiros a um serviço (com contexto de tenant)
   * POST /api/services/:id/barbers (requer autenticação)
   * Verifica se o serviço pertence ao tenant atual
   */
  const associateBarbers = useCallback(
    async (serviceId: string, barberIds: string[]) => {
      try {
        ensureTenant();
        setAssociating(true);
        setAssociateError(null);

        // First verify the service belongs to the current tenant
        const service = await tenantRepository.findById(serviceId);
        if (!service) {
          throw new Error('Serviço não encontrado ou acesso negado');
        }

        // Use the base repository's associateBarbers method
        // Note: We need to access the base repository method directly
        if ('associateBarbers' in baseRepository && typeof baseRepository.associateBarbers === 'function') {
          await baseRepository.associateBarbers(serviceId, barberIds);
        } else {
          throw new Error('Funcionalidade de associação de barbeiros não disponível');
        }

        // Clear cache to force refresh
        tenantCache.clearTenantCache();
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setAssociateError(errorObj);
        throw errorObj;
      } finally {
        setAssociating(false);
      }
    },
    [baseRepository, tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Ativa/desativa serviço (com contexto de tenant)
   */
  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      return updateService(id, { isActive } as Partial<Service>);
    },
    [updateService]
  );

  /**
   * Obtém estatísticas dos serviços (com contexto de tenant)
   */
  const getStatistics = useCallback(
    async (): Promise<ServiceStatistics> => {
      ensureTenant();

      const cacheKey = 'services:statistics';
      const cached = tenantCache.get<ServiceStatistics>(cacheKey);
      if (cached) {
        return cached;
      }

      // Calculate stats from all services
      const allServices = await tenantRepository.findAll();

      const prices = allServices.map(s => s.price || 0).filter(p => p > 0);
      const durations = allServices.map(s => (s as any).duration || 30).filter(d => d > 0);

      const stats: ServiceStatistics = {
        total: allServices.length,
        active: allServices.filter(s => (s as any).isActive !== false).length,
        inactive: allServices.filter(s => (s as any).isActive === false).length,
        averagePrice: prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0,
        averageDuration: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 30,
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 0
        },
        durationRange: {
          min: durations.length > 0 ? Math.min(...durations) : 15,
          max: durations.length > 0 ? Math.max(...durations) : 120
        },
        categoryDistribution: {
          quick: allServices.filter(s => (s as any).duration <= 30).length,
          standard: allServices.filter(s => (s as any).duration > 30 && (s as any).duration <= 60).length,
          long: allServices.filter(s => (s as any).duration > 60).length
        }
      };

      tenantCache.set(cacheKey, stats, { ttl: 5 * 60 * 1000 }); // 5 minutes

      return stats;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Obtém serviços mais populares (com contexto de tenant)
   */
  const getMostPopularServices = useCallback(
    async (limit: number = 10) => {
      ensureTenant();
      const allServices = await tenantRepository.findAll();
      return allServices.slice(0, limit); // Simplified implementation
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Obtém serviços por categoria de duração (com contexto de tenant)
   */
  const getServicesByCategory = useCallback(
    async (category: 'quick' | 'standard' | 'long') => {
      ensureTenant();
      return tenantRepository.findAll({ category });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Duplica um serviço existente (com contexto de tenant)
   */
  const duplicateService = useCallback(
    async (id: string, newName: string) => {
      try {
        ensureTenant();
        setCreating(true);
        setCreateError(null);

        // Get the original service
        const originalService = await tenantRepository.findById(id);
        if (!originalService) {
          throw new Error('Service not found');
        }

        // Create a duplicate with new name
        const duplicateData = {
          ...originalService,
          name: newName
        };
        delete (duplicateData as any).id;
        delete (duplicateData as any).createdAt;
        delete (duplicateData as any).updatedAt;

        const duplicatedService = await tenantRepository.create(duplicateData);

        // Clear cache to force refresh
        tenantCache.clearTenantCache();

        // Atualiza a lista local se existir
        if (services) {
          await loadServices();
        }

        return duplicatedService;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [tenantRepository, tenantCache, services, loadServices, ensureTenant]
  );

  return {
    // Data
    services,

    // Loading states
    loading,
    creating,
    updating,
    deleting,
    associating,

    // Error states
    error,
    createError,
    updateError,
    deleteError,
    associateError,

    // Tenant context
    isValidTenant,
    barbershopId,

    // Actions - Basic CRUD (tenant-aware)
    loadServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    checkServiceExists,

    // Actions - Backend-specific operations (tenant-aware)
    getServicesByBarber, // Uses GET /api/services/barber/:barberId + tenant context
    associateBarbers, // Uses POST /api/services/:id/barbers + tenant context

    // Actions - Frontend filtering (tenant-aware, optimized for backend structure)
    getActiveServices,
    getServicesByName, // Frontend filter + tenant context
    getServicesByPriceRange, // Frontend filter optimized + tenant context
    getServicesByDuration, // Frontend filter + tenant context
    getServicesByAssociatedBarber, // Uses findByBarber internally + tenant context
    searchServices,

    // Actions - Advanced operations (tenant-aware)
    toggleActive,
    duplicateService,
    getMostPopularServices,
    getServicesByCategory,

    // Actions - Statistics (tenant-aware)
    getStatistics,
  };
};