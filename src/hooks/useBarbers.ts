import { useState, useCallback, useMemo } from 'react';
import { useBarberRepository } from '@/services/ServiceFactory';
import { useTenant } from '../contexts/TenantContext';
import { createTenantAwareRepository } from '../services/TenantAwareRepository';
import { createTenantAwareCache } from '../services/TenantAwareCache';
import type { Barber } from '@/types';

/**
 * Hook para gerenciamento de barbeiros baseado na estrutura real do backend
 * Automaticamente inclui contexto de tenant (barbershopId) em todas as operações
 * 
 * Estrutura real do backend:
 * - Campos: id(string), name, whatsapp, pix + username do User relacionado
 * - IDs formatados ("01", "02", etc.)
 * - Operações CUD com User relacionado (coordenadas)
 * - GET /api/barbers (retorna barber + username)
 * - POST /api/barbers (cria User + Barber com ID sequencial)
 * - PATCH /api/barbers/:id (atualiza User + Barber)
 * - DELETE /api/barbers/:id (remove User + Barber + Appointments)
 * - Multi-tenant: todas as operações incluem barbershopId automaticamente
 */
export const useBarbers = () => {
  const baseRepository = useBarberRepository();
  const { barbershopId, isValidTenant } = useTenant();
  
  // Create tenant-aware repository and cache
  const tenantRepository = useMemo(() => {
    return createTenantAwareRepository(baseRepository, () => barbershopId);
  }, [baseRepository, barbershopId]);

  const tenantCache = useMemo(() => {
    return createTenantAwareCache(() => barbershopId);
  }, [barbershopId]);
  
  // State for barbers list
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
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

  /**
   * Ensure tenant is valid before operations
   */
  const ensureTenant = useCallback(() => {
    if (!isValidTenant) {
      throw new Error('Valid tenant context is required for this operation');
    }
  }, [isValidTenant]);

  /**
   * Carrega todos os barbeiros com filtros opcionais (com contexto de tenant)
   * GET /api/barbers (retorna barber + username do User relacionado)
   * Automaticamente inclui barbershopId
   */
  const loadBarbers = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        ensureTenant();
        setLoading(true);
        setError(null);
        
        const cacheKey = `barbers:${JSON.stringify(filters || {})}`;
        
        // Try cache first
        const cached = tenantCache.get<Barber[]>(cacheKey);
        if (cached) {
          setBarbers(cached);
          return cached;
        }
        
        const result = await tenantRepository.findAll(filters);
        setBarbers(result);
        
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
   * Busca barbeiro por ID formatado ("01", "02", etc.) (com contexto de tenant)
   * GET /api/barbers/:id
   */
  const getBarberById = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.findById(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca barbeiros ativos (com contexto de tenant)
   */
  const getActiveBarbers = useCallback(
    async () => {
      ensureTenant();
      return tenantRepository.findAll({ isActive: true });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca barbeiros por serviço (com contexto de tenant)
   */
  const getBarbersByService = useCallback(
    async (serviceId: string) => {
      ensureTenant();
      return tenantRepository.findAll({ serviceId });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca barbeiros por nome (com contexto de tenant)
   */
  const getBarbersByName = useCallback(
    async (name: string) => {
      ensureTenant();
      return tenantRepository.findAll({ name });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca barbeiros por especialidade (com contexto de tenant)
   */
  const getBarbersBySpecialty = useCallback(
    async (specialty: string) => {
      ensureTenant();
      return tenantRepository.findAll({ specialty });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Cria um novo barbeiro (com contexto de tenant)
   * POST /api/barbers (cria User + Barber com ID sequencial)
   * Requer autenticação e automaticamente inclui barbershopId
   */
  const createBarber = useCallback(
    async (barberData: Omit<Barber, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        ensureTenant();
        setCreating(true);
        setCreateError(null);
        
        const newBarber = await tenantRepository.create(barberData);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
        
        return newBarber;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [tenantRepository, tenantCache, barbers, loadBarbers, ensureTenant]
  );

  /**
   * Atualiza um barbeiro existente (com contexto de tenant)
   * PATCH /api/barbers/:id (atualiza User + Barber)
   * Requer autenticação e verifica se pertence ao tenant atual
   */
  const updateBarber = useCallback(
    async (id: string, updates: Partial<Barber>) => {
      try {
        ensureTenant();
        setUpdating(true);
        setUpdateError(null);
        
        const updatedBarber = await tenantRepository.update(id, updates);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
        
        return updatedBarber;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [tenantRepository, tenantCache, barbers, loadBarbers, ensureTenant]
  );

  /**
   * Remove um barbeiro (com contexto de tenant)
   * DELETE /api/barbers/:id (remove User + Barber + Appointments)
   * Requer autenticação e verifica se pertence ao tenant atual
   */
  const deleteBarber = useCallback(
    async (id: string) => {
      try {
        ensureTenant();
        setDeleting(true);
        setDeleteError(null);
        
        await tenantRepository.delete(id);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (barbers) {
          await loadBarbers();
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setDeleteError(errorObj);
        throw errorObj;
      } finally {
        setDeleting(false);
      }
    },
    [tenantRepository, tenantCache, barbers, loadBarbers, ensureTenant]
  );

  /**
   * Verifica se um barbeiro existe (com contexto de tenant)
   */
  const checkBarberExists = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.exists(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Atualiza informações de contato do barbeiro (com contexto de tenant)
   * Atualiza o campo whatsapp no backend
   */
  const updateContact = useCallback(
    async (id: string, whatsapp: string) => {
      return updateBarber(id, { whatsapp } as Partial<Barber>);
    },
    [updateBarber]
  );

  /**
   * Atualiza informações de pagamento do barbeiro (com contexto de tenant)
   * Atualiza o campo pix no backend
   */
  const updatePaymentInfo = useCallback(
    async (id: string, pix: string) => {
      return updateBarber(id, { pix } as Partial<Barber>);
    },
    [updateBarber]
  );

  /**
   * Ativa/desativa barbeiro (com contexto de tenant)
   * Backend não tem campo isActive, simulado no frontend
   */
  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      return updateBarber(id, { isActive } as Partial<Barber>);
    },
    [updateBarber]
  );

  /**
   * Obtém estatísticas dos barbeiros (com contexto de tenant)
   */
  const getStatistics = useCallback(
    async () => {
      ensureTenant();
      
      const cacheKey = 'barbers:statistics';
      const cached = tenantCache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Calculate stats from all barbers
      const allBarbers = await tenantRepository.findAll();
      
      const stats = {
        total: allBarbers.length,
        active: allBarbers.filter(b => (b as any).isActive !== false).length,
        inactive: allBarbers.filter(b => (b as any).isActive === false).length,
      };
      
      tenantCache.set(cacheKey, stats, { ttl: 5 * 60 * 1000 }); // 5 minutes
      
      return stats;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  return {
    // Data
    barbers,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    createError,
    updateError,
    deleteError,
    
    // Tenant context
    isValidTenant,
    barbershopId,
    
    // Actions - Basic CRUD (tenant-aware)
    loadBarbers,
    getBarberById,
    createBarber,
    updateBarber,
    deleteBarber,
    checkBarberExists,
    
    // Actions - Filtering (tenant-aware, frontend filters)
    getActiveBarbers,
    getBarbersByService,
    getBarbersByName,
    getBarbersBySpecialty,
    
    // Actions - Backend-specific operations (tenant-aware)
    updateContact, // Updates whatsapp field
    updatePaymentInfo, // Updates pix field
    toggleActive, // Frontend-only operation
    
    // Actions - Statistics (tenant-aware)
    getStatistics,
  };
};