import { useState, useCallback, useMemo } from 'react';
import { useAppointmentRepository } from '@/services/ServiceFactory';
import { useTenant } from '../contexts/TenantContext';
import { createTenantAwareRepository } from '../services/TenantAwareRepository';
import { createTenantAwareCache } from '../services/TenantAwareCache';
import type { Appointment, AppointmentStatus } from '@/types';
import type { AppointmentStatistics } from '@/services/repositories/AppointmentRepository';

/**
 * Hook para gerenciamento de agendamentos baseado na estrutura real do backend
 * Automaticamente inclui contexto de tenant (barbershopId) em todas as operações
 * 
 * Estrutura real do backend:
 * - Campos: clientName, serviceName, date, time, status, barberId, barberName, price, wppclient
 * - Filtros por barberId, data, status implementados no frontend
 * - Rate limiting otimizado: 200 req/min leitura, 20 req/min escrita
 * - Multi-tenant: todas as operações incluem barbershopId automaticamente
 */
export const useAppointments = () => {
  const baseRepository = useAppointmentRepository();
  const { barbershopId, isValidTenant } = useTenant();
  
  // Create tenant-aware repository and cache
  const tenantRepository = useMemo(() => {
    return createTenantAwareRepository(baseRepository, () => barbershopId);
  }, [baseRepository, barbershopId]);

  const tenantCache = useMemo(() => {
    return createTenantAwareCache(() => barbershopId);
  }, [barbershopId]);
  
  // State for appointments list
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
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
   * Carrega todos os agendamentos com filtros opcionais
   * Automaticamente inclui barbershopId do contexto atual
   * Suporta filtro por barberId via query parameter da API
   */
  const loadAppointments = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        ensureTenant();
        setLoading(true);
        setError(null);
        
        const cacheKey = `appointments:${JSON.stringify(filters || {})}`;
        
        // Try cache first
        const cached = tenantCache.get<Appointment[]>(cacheKey);
        if (cached) {
          const rehydrated = cached.map(app => ({
            ...app,
            date: new Date(app.date),
            createdAt: app.createdAt ? new Date(app.createdAt) : new Date(),
            updatedAt: app.updatedAt ? new Date(app.updatedAt) : new Date()
          })) as Appointment[];
          setAppointments(rehydrated);
          return rehydrated;
        }
        
        const result = await tenantRepository.findAll(filters);
        setAppointments(result);
        
        // Cache the result (no persistence for real-time F5 updates)
        tenantCache.set(cacheKey, result, { ttl: 30 * 1000, persist: false }); // 30 seconds
        
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
   * Busca agendamento por ID (com contexto de tenant)
   */
  const getAppointmentById = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.findById(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca agendamentos por barbeiro (com contexto de tenant)
   * GET /api/appointments?barberId=X
   */
  const getAppointmentsByBarberId = useCallback(
    async (barberId: string) => {
      ensureTenant();
      
      const cacheKey = `appointments:barber:${barberId}`;
      const cached = tenantCache.get<Appointment[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const result = await tenantRepository.findAll({ barberId });
      tenantCache.set(cacheKey, result, { ttl: 30 * 1000, persist: false });
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Busca agendamentos por status (com contexto de tenant)
   */
  const getAppointmentsByStatus = useCallback(
    async (status: AppointmentStatus) => {
      ensureTenant();
      
      const cacheKey = `appointments:status:${status}`;
      const cached = tenantCache.get<Appointment[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const result = await tenantRepository.findAll({ status });
      tenantCache.set(cacheKey, result, { ttl: 30 * 1000, persist: false });
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Busca agendamentos por data (com contexto de tenant)
   */
  const getAppointmentsByDate = useCallback(
    async (date: Date) => {
      ensureTenant();
      
      const dateStr = date.toISOString().split('T')[0];
      const cacheKey = `appointments:date:${dateStr}`;
      const cached = tenantCache.get<Appointment[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const result = await tenantRepository.findAll({ date: dateStr });
      tenantCache.set(cacheKey, result, { ttl: 30 * 1000, persist: false });
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Busca agendamentos por faixa de datas (com contexto de tenant)
   */
  const getAppointmentsByDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      ensureTenant();
      return tenantRepository.findAll({ 
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca agendamentos por nome do cliente (com contexto de tenant)
   */
  const getAppointmentsByClientName = useCallback(
    async (clientName: string) => {
      ensureTenant();
      return tenantRepository.findAll({ clientName });
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Busca agendamentos próximos (com contexto de tenant)
   */
  const getUpcomingAppointments = useCallback(
    async () => {
      ensureTenant();
      
      const cacheKey = 'appointments:upcoming';
      const cached = tenantCache.get<Appointment[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const result = await tenantRepository.findAll({ 
        startDate: today.toISOString().split('T')[0],
        endDate: tomorrow.toISOString().split('T')[0]
      });
      
      tenantCache.set(cacheKey, result, { ttl: 30 * 1000, persist: false }); // 30 seconds
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Busca agendamentos pendentes (com contexto de tenant)
   */
  const getPendingAppointments = useCallback(
    async () => {
      ensureTenant();
      return getAppointmentsByStatus('pending' as AppointmentStatus);
    },
    [getAppointmentsByStatus, ensureTenant]
  );

  /**
   * Busca agendamentos confirmados para um barbeiro em uma data específica (com contexto de tenant)
   */
  const getConfirmedAppointmentsByBarberAndDate = useCallback(
    async (barberId: string, date: Date) => {
      ensureTenant();
      
      const dateStr = date.toISOString().split('T')[0];
      const cacheKey = `appointments:confirmed:${barberId}:${dateStr}`;
      const cached = tenantCache.get<Appointment[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const result = await tenantRepository.findAll({ 
        barberId, 
        date: dateStr, 
        status: 'confirmed' 
      });
      
      tenantCache.set(cacheKey, result, { ttl: 30 * 1000, persist: false });
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Cria um novo agendamento (com contexto de tenant)
   * POST /api/appointments (cria com id = Date.now().toString())
   * Automaticamente inclui barbershopId
   */
  const createAppointment = useCallback(
    async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        ensureTenant();
        setCreating(true);
        setCreateError(null);
        
        const newAppointment = await tenantRepository.create(appointmentData);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
        
        return newAppointment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [tenantRepository, tenantCache, appointments, loadAppointments, ensureTenant]
  );

  /**
   * Cria agendamento com dados específicos do backend (com contexto de tenant)
   * Usa a estrutura real: clientName, serviceName, barberName, price, wppclient
   * Automaticamente inclui barbershopId
   */
  const createWithBackendData = useCallback(
    async (data: {
      clientName: string;
      serviceName: string;
      date: Date;
      time: string;
      barberId: string;
      barberName: string;
      price: number;
      wppclient: string;
      status?: AppointmentStatus;
    }) => {
      try {
        ensureTenant();
        setCreating(true);
        setCreateError(null);
        
        // Note: This method would need to be implemented in the tenant-aware repository
        // For now, we'll use the regular create method with the data structure
        const appointmentData = {
          clientName: data.clientName,
          serviceName: data.serviceName,
          date: data.date,
          time: data.time,
          barberId: data.barberId,
          barberName: data.barberName,
          price: data.price,
          wppclient: data.wppclient,
          status: data.status || 'pending'
        } as unknown as Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;
        
        const newAppointment = await tenantRepository.create(appointmentData);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
        
        return newAppointment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [tenantRepository, tenantCache, appointments, loadAppointments, ensureTenant]
  );

  /**
   * Atualiza um agendamento existente (com contexto de tenant)
   * Verifica se o agendamento pertence ao tenant atual
   */
  const updateAppointment = useCallback(
    async (id: string, updates: Partial<Appointment>) => {
      try {
        ensureTenant();
        setUpdating(true);
        setUpdateError(null);
        
        const updatedAppointment = await tenantRepository.update(id, updates);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
        
        return updatedAppointment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [tenantRepository, tenantCache, appointments, loadAppointments, ensureTenant]
  );

  /**
   * Atualiza apenas o status do agendamento (com contexto de tenant)
   * PATCH /api/appointments/:id
   */
  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      return updateAppointment(id, { status });
    },
    [updateAppointment]
  );

  /**
   * Remove um agendamento (com contexto de tenant)
   * DELETE /api/appointments/:id
   * Verifica se o agendamento pertence ao tenant atual
   */
  const deleteAppointment = useCallback(
    async (id: string) => {
      try {
        ensureTenant();
        setDeleting(true);
        setDeleteError(null);
        
        await tenantRepository.delete(id);
        
        // Clear cache to force refresh
        tenantCache.clearTenantCache();
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setDeleteError(errorObj);
        throw errorObj;
      } finally {
        setDeleting(false);
      }
    },
    [tenantRepository, tenantCache, appointments, loadAppointments, ensureTenant]
  );

  /**
   * Verifica se um agendamento existe (com contexto de tenant)
   */
  const checkAppointmentExists = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.exists(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Obtém estatísticas de agendamentos (com contexto de tenant)
   */
  const getStatistics = useCallback(
    async (): Promise<AppointmentStatistics> => {
      ensureTenant();
      
      const cacheKey = 'appointments:statistics';
      const cached = tenantCache.get<AppointmentStatistics>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Note: This would need to be implemented in the tenant-aware repository
      // For now, we'll simulate it by getting all appointments and calculating stats
      const allAppointments = await tenantRepository.findAll();
      
      const stats: AppointmentStatistics = {
        total: allAppointments.length,
        pending: allAppointments.filter(a => a.status === 'pending').length,
        confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
        completed: allAppointments.filter(a => a.status === 'completed').length,
        cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
        today: allAppointments.filter(a => {
          const todayStr = new Date().toISOString().split('T')[0];
          const appDate = a.date instanceof Date ? a.date : new Date(a.date);
          return appDate.toISOString().split('T')[0] === todayStr;
        }).length,
        upcoming: allAppointments.filter(a => {
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const appDate = a.date instanceof Date ? a.date : new Date(a.date);
          const appDateStr = appDate.toISOString().split('T')[0];
          const todayStr = today.toISOString().split('T')[0];
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          
          return appDateStr === todayStr || appDateStr === tomorrowStr;
        }).length,
        byStatus: allAppointments.reduce((acc, appointment) => {
          acc[appointment.status] = (acc[appointment.status] || 0) + 1;
          return acc;
        }, {} as Record<AppointmentStatus, number>)
      };
      
      tenantCache.set(cacheKey, stats, { ttl: 30 * 1000, persist: false }); // 30 seconds
      
      return stats;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  return {
    // Data
    appointments,
    
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
    loadAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkAppointmentExists,
    
    // Actions - Backend-specific (tenant-aware)
    createWithBackendData,
    updateAppointmentStatus,
    
    // Actions - Filtering (tenant-aware, based on real backend structure)
    getAppointmentsByBarberId, // Uses API query parameter + tenant context
    getAppointmentsByStatus, // Frontend filter + tenant context
    getAppointmentsByDate, // Frontend filter + tenant context
    getAppointmentsByDateRange, // Combined filter + tenant context
    getAppointmentsByClientName, // Frontend filter + tenant context
    getUpcomingAppointments, // Frontend filter + tenant context
    getPendingAppointments, // Frontend filter + tenant context
    getConfirmedAppointmentsByBarberAndDate, // Combined filter + tenant context
    
    // Actions - Statistics (tenant-aware)
    getStatistics,
  };
};