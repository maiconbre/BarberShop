/**
 * Appointment store using Zustand with multi-tenant support
 * @deprecated Use useAppointments hook from hooks/useAppointments.ts instead
 * This store is kept for backward compatibility but should not be used in new code
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Appointment, BookingFormData, AppointmentFilters, AppointmentStatus } from '@/types';
import { useAppointmentRepository } from '@/services/ServiceFactory';
import { createTenantAwareRepository } from '@/services/TenantAwareRepository';
import { createTenantAwareCache } from '@/services/TenantAwareCache';

interface AppointmentState {
  // State
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;
  filters: AppointmentFilters;
  
  // Multi-tenant state
  barbershopId: string | null;
  tenantRepository: any | null;
  tenantCache: any | null;

  // Actions
  initializeTenant: (barbershopId: string) => void;
  fetchAppointments: (filters?: AppointmentFilters) => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<void>;
  createAppointment: (data: BookingFormData) => Promise<Appointment>;
  createWithBackendData: (data: {
    clientName: string;
    serviceName: string;
    date: Date;
    time: string;
    barberId: string;
    barberName: string;
    price: number;
    wppclient: string;
    status?: AppointmentStatus;
  }) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDateTime: string) => Promise<void>;
  completeAppointment: (id: string, notes?: string) => Promise<void>;
  
  // Multi-tenant filtering actions
  fetchByBarberId: (barberId: string) => Promise<void>;
  fetchByStatus: (status: AppointmentStatus) => Promise<void>;
  fetchByDate: (date: Date) => Promise<void>;
  fetchByClientName: (clientName: string) => Promise<void>;
  fetchUpcoming: () => Promise<void>;
  fetchPending: () => Promise<void>;
  
  setFilters: (filters: Partial<AppointmentFilters>) => void;
  clearFilters: () => void;
  setCurrentAppointment: (appointment: Appointment | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  clearTenantCache: () => void;
}

const initialFilters: AppointmentFilters = {
  status: undefined,
  barberId: undefined,
  serviceId: undefined,
  startDate: undefined,
  endDate: undefined,
  search: undefined,
};

/**
 * @deprecated Use useAppointments hook from hooks/useAppointments.ts instead
 * This store is kept for backward compatibility but should not be used in new code
 * 
 * Multi-tenant appointment store with repository pattern
 */
export const useAppointmentStore = create<AppointmentState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    appointments: [],
    currentAppointment: null,
    isLoading: false,
    error: null,
    filters: initialFilters,
    
    // Multi-tenant state
    barbershopId: null,
    tenantRepository: null,
    tenantCache: null,

    // Actions
    initializeTenant: (barbershopId: string) => {
      const baseRepository = useAppointmentRepository();
      const tenantRepository = createTenantAwareRepository(baseRepository, () => barbershopId);
      const tenantCache = createTenantAwareCache(() => barbershopId);
      
      set({
        barbershopId,
        tenantRepository,
        tenantCache,
      });
    },

    fetchAppointments: async (filters?: AppointmentFilters) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const currentFilters = filters || get().filters;
        const cacheKey = `appointments:${JSON.stringify(currentFilters)}`;
        
        // Try cache first
        const cached = tenantCache?.get(cacheKey);
        if (cached) {
          set({ appointments: cached, isLoading: false });
          return;
        }
        
        const appointments = await tenantRepository.findAll(currentFilters);
        
        // Cache the result
        tenantCache?.set(cacheKey, appointments, { ttl: 2 * 60 * 1000 }); // 2 minutes
        
        set({
          appointments,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load appointments',
        });
      }
    },

    fetchAppointmentById: async (id: string) => {
      const { tenantRepository, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const appointment = await tenantRepository.findById(id);
        
        if (!appointment) {
          throw new Error('Appointment not found');
        }

        set({
          currentAppointment: appointment,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load appointment',
        });
      }
    },

    createAppointment: async (data: BookingFormData) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        throw new Error('Tenant not initialized');
      }
      
      set({ isLoading: true, error: null });
      
      try {
        // Convert BookingFormData to Appointment format
        const appointmentData = {
          clientId: data.clientName || 'unknown',
          serviceId: data.serviceId,
          barberId: data.barberId,
          date: new Date(data.date),
          startTime: data.time,
          status: 'scheduled' as AppointmentStatus,
          notes: data.notes,
          // Backend-specific data
          _backendData: {
            clientName: data.clientName,
            serviceName: data.serviceName || '',
            barberName: data.barberName || '',
            price: data.price || 0,
            wppclient: data.phone || '',
          }
        } as Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;

        const newAppointment = await tenantRepository.create(appointmentData);

        // Clear cache to force refresh
        tenantCache?.clearTenantCache();

        set((state) => ({
          appointments: [newAppointment, ...state.appointments],
          isLoading: false,
          error: null,
        }));

        return newAppointment;
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to create appointment',
        });
        throw error;
      }
    },

    createWithBackendData: async (data: {
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
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        throw new Error('Tenant not initialized');
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const appointmentData = {
          clientId: data.clientName,
          serviceId: data.serviceName,
          barberId: data.barberId,
          date: data.date,
          startTime: data.time,
          status: data.status || 'scheduled' as AppointmentStatus,
          // Backend-specific data
          _backendData: {
            clientName: data.clientName,
            serviceName: data.serviceName,
            barberName: data.barberName,
            price: data.price,
            wppclient: data.wppclient,
          }
        } as Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;

        const newAppointment = await tenantRepository.create(appointmentData);

        // Clear cache to force refresh
        tenantCache?.clearTenantCache();

        set((state) => ({
          appointments: [newAppointment, ...state.appointments],
          isLoading: false,
          error: null,
        }));

        return newAppointment;
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to create appointment',
        });
        throw error;
      }
    },

    updateAppointment: async (id: string, data: Partial<Appointment>) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const updatedAppointment = await tenantRepository.update(id, data);

        // Clear cache to force refresh
        tenantCache?.clearTenantCache();

        set((state) => ({
          appointments: state.appointments.map((apt) =>
            apt.id === id ? updatedAppointment : apt
          ),
          currentAppointment: state.currentAppointment?.id === id ? updatedAppointment : state.currentAppointment,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to update appointment',
        });
        throw error;
      }
    },

    updateAppointmentStatus: async (id: string, status: AppointmentStatus) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const updatedAppointment = await tenantRepository.updateStatus(id, status);

        // Clear cache to force refresh
        tenantCache?.clearTenantCache();

        set((state) => ({
          appointments: state.appointments.map((apt) =>
            apt.id === id ? updatedAppointment : apt
          ),
          currentAppointment: state.currentAppointment?.id === id ? updatedAppointment : state.currentAppointment,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to update appointment status',
        });
        throw error;
      }
    },

    cancelAppointment: async (id: string, reason?: string) => {
      await get().updateAppointmentStatus(id, 'cancelled');
      
      if (reason) {
        await get().updateAppointment(id, {
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        });
      }
    },

    confirmAppointment: async (id: string) => {
      await get().updateAppointmentStatus(id, 'confirmed');
    },

    rescheduleAppointment: async (id: string, newDateTime: string) => {
      // Parse the newDateTime to get date and time
      const [dateStr, timeStr] = newDateTime.split('T');
      const newDate = new Date(dateStr);
      const newTime = timeStr.substring(0, 5); // Extract HH:MM format

      await get().updateAppointment(id, {
        date: newDate,
        startTime: newTime,
      });
    },

    completeAppointment: async (id: string, notes?: string) => {
      await get().updateAppointmentStatus(id, 'completed');
      
      if (notes) {
        await get().updateAppointment(id, { notes });
      }
    },

    // Multi-tenant filtering actions
    fetchByBarberId: async (barberId: string) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const cacheKey = `appointments:barber:${barberId}`;
        
        // Try cache first
        const cached = tenantCache?.get(cacheKey);
        if (cached) {
          set({ appointments: cached, isLoading: false });
          return;
        }
        
        const appointments = await tenantRepository.findByBarberId(barberId);
        
        // Cache the result
        tenantCache?.set(cacheKey, appointments, { ttl: 2 * 60 * 1000 });
        
        set({
          appointments,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load appointments by barber',
        });
      }
    },

    fetchByStatus: async (status: AppointmentStatus) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const cacheKey = `appointments:status:${status}`;
        
        // Try cache first
        const cached = tenantCache?.get(cacheKey);
        if (cached) {
          set({ appointments: cached, isLoading: false });
          return;
        }
        
        const appointments = await tenantRepository.findByStatus(status);
        
        // Cache the result
        tenantCache?.set(cacheKey, appointments, { ttl: 2 * 60 * 1000 });
        
        set({
          appointments,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load appointments by status',
        });
      }
    },

    fetchByDate: async (date: Date) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const dateStr = date.toISOString().split('T')[0];
        const cacheKey = `appointments:date:${dateStr}`;
        
        // Try cache first
        const cached = tenantCache?.get(cacheKey);
        if (cached) {
          set({ appointments: cached, isLoading: false });
          return;
        }
        
        const appointments = await tenantRepository.findByDate(date);
        
        // Cache the result
        tenantCache?.set(cacheKey, appointments, { ttl: 2 * 60 * 1000 });
        
        set({
          appointments,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load appointments by date',
        });
      }
    },

    fetchByClientName: async (clientName: string) => {
      const { tenantRepository, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const appointments = await tenantRepository.findByClientName(clientName);
        
        set({
          appointments,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load appointments by client name',
        });
      }
    },

    fetchUpcoming: async () => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const cacheKey = 'appointments:upcoming';
        
        // Try cache first
        const cached = tenantCache?.get(cacheKey);
        if (cached) {
          set({ appointments: cached, isLoading: false });
          return;
        }
        
        const appointments = await tenantRepository.findUpcoming();
        
        // Cache the result
        tenantCache?.set(cacheKey, appointments, { ttl: 5 * 60 * 1000 }); // 5 minutes
        
        set({
          appointments,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load upcoming appointments',
        });
      }
    },

    fetchPending: async () => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const cacheKey = 'appointments:pending';
        
        // Try cache first
        const cached = tenantCache?.get(cacheKey);
        if (cached) {
          set({ appointments: cached, isLoading: false });
          return;
        }
        
        const appointments = await tenantRepository.findPending();
        
        // Cache the result
        tenantCache?.set(cacheKey, appointments, { ttl: 2 * 60 * 1000 });
        
        set({
          appointments,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load pending appointments',
        });
      }
    },

    setFilters: (filters: Partial<AppointmentFilters>) => {
      set((state) => ({
        filters: { ...state.filters, ...filters },
      }));
    },

    clearFilters: () => {
      set({
        filters: initialFilters,
      });
    },

    setCurrentAppointment: (appointment: Appointment | null) => {
      set({ currentAppointment: appointment });
    },

    clearError: () => {
      set({ error: null });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    clearTenantCache: () => {
      const { tenantCache } = get();
      tenantCache?.clearTenantCache();
    },
  }))
);

// Selectors for backward compatibility
export const useAppointmentList = () => useAppointmentStore((state) => state.appointments);
export const useCurrentAppointment = () => useAppointmentStore((state) => state.currentAppointment);
export const useAppointmentLoading = () => useAppointmentStore((state) => state.isLoading);
export const useAppointmentError = () => useAppointmentStore((state) => state.error);
export const useAppointmentFilters = () => useAppointmentStore((state) => state.filters);

// Multi-tenant selectors
export const useAppointmentTenant = () => useAppointmentStore((state) => ({
  barbershopId: state.barbershopId,
  isInitialized: Boolean(state.barbershopId && state.tenantRepository)
}));

// Actions for backward compatibility
export const useAppointmentActions = () => ({
  initializeTenant: useAppointmentStore.getState().initializeTenant,
  fetchAppointments: useAppointmentStore.getState().fetchAppointments,
  createAppointment: useAppointmentStore.getState().createAppointment,
  updateAppointment: useAppointmentStore.getState().updateAppointment,
  clearError: useAppointmentStore.getState().clearError,
  clearTenantCache: useAppointmentStore.getState().clearTenantCache
});