import { useState, useCallback, useMemo } from 'react';
import { useAppointmentRepository } from '@/services/ServiceFactory';
import { useTenant } from '@/contexts/TenantContext';
import { createTenantAwareRepository } from '@/services/TenantAwareRepository';
import { createTenantAwareCache } from '@/services/TenantAwareCache';
import type { Appointment, AppointmentStatus } from '@/types';
// Removed unused import: AppointmentStatistics

/**
 * Tenant-aware hook for appointment management
 * Automatically includes barbershopId in all operations
 */
export const useTenantAwareAppointments = () => {
  const baseRepository = useAppointmentRepository();
  const { barbershopId, isValidTenant } = useTenant();
  
  // Create tenant-aware repository
  const tenantRepository = useMemo(() => {
    return createTenantAwareRepository(baseRepository, () => barbershopId);
  }, [baseRepository, barbershopId]);

  // Create tenant-aware cache
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
   * Load appointments with tenant context
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
          setAppointments(cached);
          return cached;
        }
        
        const result = await tenantRepository.findAll(filters);
        setAppointments(result);
        
        // Cache the result
        tenantCache.set(cacheKey, result, { ttl: 2 * 60 * 1000 }); // 2 minutes
        
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
   * Get appointment by ID with tenant context
   */
  const getAppointmentById = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.findById(id);
    },
    [tenantRepository, ensureTenant]
  );

  /**
   * Create appointment with tenant context
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
        
        // Refresh appointments list if it exists
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
   * Update appointment with tenant context
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
        
        // Refresh appointments list if it exists
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
   * Delete appointment with tenant context
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
        
        // Refresh appointments list if it exists
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
   * Update appointment status with tenant context
   */
  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      return updateAppointment(id, { status });
    },
    [updateAppointment]
  );

  /**
   * Get appointments by barber with tenant context
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
      tenantCache.set(cacheKey, result, { ttl: 2 * 60 * 1000 });
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Get appointments by status with tenant context
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
      tenantCache.set(cacheKey, result, { ttl: 2 * 60 * 1000 });
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Get appointments by date with tenant context
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
      tenantCache.set(cacheKey, result, { ttl: 2 * 60 * 1000 });
      
      return result;
    },
    [tenantRepository, tenantCache, ensureTenant]
  );

  /**
   * Check if appointment exists with tenant context
   */
  const checkAppointmentExists = useCallback(
    async (id: string) => {
      ensureTenant();
      return tenantRepository.exists(id);
    },
    [tenantRepository, ensureTenant]
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
    
    // Actions - Status management (tenant-aware)
    updateAppointmentStatus,
    
    // Actions - Filtering (tenant-aware)
    getAppointmentsByBarberId,
    getAppointmentsByStatus,
    getAppointmentsByDate,
  };
};