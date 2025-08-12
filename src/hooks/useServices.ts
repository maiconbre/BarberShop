import { useState, useCallback } from 'react';
import { useServiceRepository } from '@/services/ServiceFactory';
import type { Service } from '@/types';
import type { ServiceStatistics } from '@/services/repositories/ServiceRepository';
import type { SearchOptions } from '@/services/interfaces/IRepository';

/**
 * Hook para gerenciamento de serviços baseado na estrutura real do backend
 * 
 * Estrutura real do backend:
 * - Campos: id(UUID), name, price
 * - Método findByBarber usando GET /api/services/barber/:barberId
 * - Método associateBarbers usando POST /api/services/:id/barbers (requer auth)
 * - Rate limiting generoso (300 req/min)
 * - Filtros frontend para campos não disponíveis no backend
 */
export const useServices = () => {
  const serviceRepository = useServiceRepository();
  
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
   * Carrega todos os serviços com filtros opcionais
   * GET /api/services
   */
  const loadServices = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        setLoading(true);
        setError(null);
        const result = await serviceRepository.findAll(filters);
        setServices(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [serviceRepository]
  );

  /**
   * Busca serviço por UUID
   * GET /api/services/:id
   */
  const getServiceById = useCallback(
    async (id: string) => {
      return serviceRepository.findById(id);
    },
    [serviceRepository]
  );

  /**
   * Busca serviços ativos (filtro frontend)
   */
  const getActiveServices = useCallback(
    async () => {
      return serviceRepository.findActive();
    },
    [serviceRepository]
  );

  /**
   * Busca serviços por barbeiro usando endpoint específico
   * GET /api/services/barber/:barberId
   */
  const getServicesByBarber = useCallback(
    async (barberId: string) => {
      return serviceRepository.findByBarber(barberId);
    },
    [serviceRepository]
  );

  /**
   * Busca serviços por nome (filtro frontend otimizado)
   */
  const getServicesByName = useCallback(
    async (name: string) => {
      return serviceRepository.findByName(name);
    },
    [serviceRepository]
  );

  /**
   * Busca serviços por faixa de preço (filtro frontend otimizado)
   */
  const getServicesByPriceRange = useCallback(
    async (minPrice: number, maxPrice: number) => {
      return serviceRepository.findByPriceRange(minPrice, maxPrice);
    },
    [serviceRepository]
  );

  /**
   * Busca serviços por duração (filtro frontend)
   */
  const getServicesByDuration = useCallback(
    async (minDuration: number, maxDuration?: number) => {
      return serviceRepository.findByDuration(minDuration, maxDuration);
    },
    [serviceRepository]
  );

  /**
   * Busca serviços associados a um barbeiro específico (filtro frontend)
   */
  const getServicesByAssociatedBarber = useCallback(
    async (barberId: string) => {
      return serviceRepository.findByAssociatedBarber(barberId);
    },
    [serviceRepository]
  );

  /**
   * Busca serviços com texto (search)
   */
  const searchServices = useCallback(
    async (query: string, options?: SearchOptions) => {
      return serviceRepository.search(query, options);
    },
    [serviceRepository]
  );

  /**
   * Cria um novo serviço
   * POST /api/services (apenas name e price são suportados pelo backend)
   */
  const createService = useCallback(
    async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setCreating(true);
        setCreateError(null);
        const newService = await serviceRepository.create(serviceData);
        
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
    [serviceRepository, services, loadServices]
  );

  /**
   * Atualiza um serviço existente
   * PATCH /api/services/:id (apenas name e price são suportados pelo backend)
   */
  const updateService = useCallback(
    async (id: string, updates: Partial<Service>) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedService = await serviceRepository.update(id, updates);
        
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
    [serviceRepository, services, loadServices]
  );

  /**
   * Remove um serviço
   * DELETE /api/services/:id
   */
  const deleteService = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);
        setDeleteError(null);
        await serviceRepository.delete(id);
        
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
    [serviceRepository, services, loadServices]
  );

  /**
   * Verifica se um serviço existe
   */
  const checkServiceExists = useCallback(
    async (id: string) => {
      return serviceRepository.exists(id);
    },
    [serviceRepository]
  );

  /**
   * Associa barbeiros a um serviço usando endpoint específico
   * POST /api/services/:id/barbers (requer autenticação)
   */
  const associateBarbers = useCallback(
    async (serviceId: string, barberIds: string[]) => {
      try {
        setAssociating(true);
        setAssociateError(null);
        await serviceRepository.associateBarbers(serviceId, barberIds);
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setAssociateError(errorObj);
        throw errorObj;
      } finally {
        setAssociating(false);
      }
    },
    [serviceRepository]
  );

  /**
   * Ativa/desativa serviço (operação frontend)
   */
  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedService = await serviceRepository.toggleActive(id, isActive);
        
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
    [serviceRepository, services, loadServices]
  );

  /**
   * Obtém estatísticas dos serviços
   */
  const getStatistics = useCallback(
    async (): Promise<ServiceStatistics> => {
      return serviceRepository.getStatistics();
    },
    [serviceRepository]
  );

  /**
   * Obtém serviços mais populares
   */
  const getMostPopularServices = useCallback(
    async (limit: number = 10) => {
      return serviceRepository.getMostPopular(limit);
    },
    [serviceRepository]
  );

  /**
   * Obtém serviços por categoria de duração
   */
  const getServicesByCategory = useCallback(
    async (category: 'quick' | 'standard' | 'long') => {
      return serviceRepository.getByCategory(category);
    },
    [serviceRepository]
  );

  /**
   * Duplica um serviço existente
   */
  const duplicateService = useCallback(
    async (id: string, newName: string) => {
      try {
        setCreating(true);
        setCreateError(null);
        const duplicatedService = await serviceRepository.duplicate(id, newName);
        
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
    [serviceRepository, services, loadServices]
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
    
    // Actions - Basic CRUD
    loadServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    checkServiceExists,
    
    // Actions - Backend-specific operations
    getServicesByBarber, // Uses GET /api/services/barber/:barberId
    associateBarbers, // Uses POST /api/services/:id/barbers
    
    // Actions - Frontend filtering (optimized for backend structure)
    getActiveServices,
    getServicesByName, // Frontend filter
    getServicesByPriceRange, // Frontend filter optimized
    getServicesByDuration, // Frontend filter
    getServicesByAssociatedBarber, // Uses findByBarber internally
    searchServices,
    
    // Actions - Advanced operations
    toggleActive,
    duplicateService,
    getMostPopularServices,
    getServicesByCategory,
    
    // Actions - Statistics
    getStatistics,
  };
};