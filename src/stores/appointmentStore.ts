/**
 * Appointment store using Zustand
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Appointment, BookingFormData, AppointmentFilters } from '@/types';
import { API_CONFIG, API_ENDPOINTS, PAGINATION } from '@/constants';
import { Appointment as AppointmentModel } from '@/models';

interface AppointmentState {
  // State
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;
  filters: AppointmentFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // Actions
  fetchAppointments: (filters?: AppointmentFilters) => Promise<void>;
  fetchAppointmentById: (id: string) => Promise<void>;
  createAppointment: (data: BookingFormData) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDateTime: string) => Promise<void>;
  completeAppointment: (id: string, notes?: string) => Promise<void>;
  setFilters: (filters: Partial<AppointmentFilters>) => void;
  clearFilters: () => void;
  setCurrentAppointment: (appointment: Appointment | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  loadMore: () => Promise<void>;
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
 * Appointment store
 */
export const useAppointmentStore = create<AppointmentState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    appointments: [],
    currentAppointment: null,
    isLoading: false,
    error: null,
    filters: initialFilters,
    pagination: {
      page: 1,
      limit: PAGINATION.DEFAULT_LIMIT,
      total: 0,
      hasMore: false,
    },

    // Actions
    fetchAppointments: async (filters?: AppointmentFilters) => {
      set({ isLoading: true, error: null });
      
      try {
        const currentFilters = filters || get().filters;
        const { pagination } = get();
        
        const queryParams = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...Object.fromEntries(
            Object.entries(currentFilters).filter(([, value]) => value !== undefined)
          ),
        });

        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.APPOINTMENTS}?${queryParams}`
        );

        if (!response.ok) {
          throw new Error('Failed to load appointments');
        }

        const data = await response.json();
        const appointments = data.appointments.map((apt: Appointment) => 
          AppointmentModel.fromApiData(apt).toJSON()
        );

        set({
          appointments: pagination.page === 1 ? appointments : [...get().appointments, ...appointments],
          pagination: {
            ...pagination,
            total: data.total,
            hasMore: data.hasMore,
          },
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
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.APPOINTMENTS}/${id}`
        );

        if (!response.ok) {
          throw new Error('Appointment not found');
        }

        const data = await response.json();
        const appointment = AppointmentModel.fromApiData(data).toJSON();

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
      set({ isLoading: true, error: null });
      
      try {
        // Get client ID from authentication or state
        const clientId = 'current-user-id'; // This should be replaced with actual client ID
        
        // Get service duration from service data
        const serviceDuration = 60; // This should be replaced with actual service duration
        
        // Use the correct fromBookingForm method with all required parameters
        const appointmentData = AppointmentModel.fromBookingForm(data, clientId, serviceDuration);
        
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.APPOINTMENTS}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create appointment');
        }

        const responseData = await response.json();
        const newAppointment = AppointmentModel.fromApiData(responseData).toJSON();

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
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.APPOINTMENTS}/${id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update appointment');
        }

        const responseData = await response.json();
        const updatedAppointment = AppointmentModel.fromApiData(responseData).toJSON();

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

    cancelAppointment: async (id: string, reason?: string) => {
      const appointment = get().appointments.find(apt => apt.id === id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const appointmentModel = AppointmentModel.fromApiData(appointment);
      if (!appointmentModel.canBeCancelled()) {
        throw new Error('This appointment cannot be cancelled');
      }

      await get().updateAppointment(id, {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
      });
    },

    confirmAppointment: async (id: string) => {
      const appointment = get().appointments.find(apt => apt.id === id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const appointmentModel = AppointmentModel.fromApiData(appointment);
      if (!appointmentModel.canBeConfirmed()) {
        throw new Error('This appointment cannot be confirmed');
      }

      await get().updateAppointment(id, {
        status: 'confirmed',
      });
    },

    rescheduleAppointment: async (id: string, newDateTime: string) => {
      const appointment = get().appointments.find(apt => apt.id === id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Parse the newDateTime to get date and time
      const [dateStr, timeStr] = newDateTime.split('T');
      const newDate = new Date(dateStr);
      const newTime = timeStr.substring(0, 5); // Extract HH:MM format
      
      // Get service duration from the current appointment
      const appointmentModel = AppointmentModel.fromApiData(appointment);
      const serviceDuration = appointmentModel.getDurationMinutes();
      
      // Use the correct reschedule method with all required parameters
      const rescheduledAppointment = appointmentModel.reschedule(newDate, newTime, serviceDuration);

      await get().updateAppointment(id, rescheduledAppointment.toJSON());
    },

    completeAppointment: async (id: string, notes?: string) => {
      const appointment = get().appointments.find(apt => apt.id === id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const appointmentModel = AppointmentModel.fromApiData(appointment);
      if (!appointmentModel.canBeCompleted()) {
        throw new Error('This appointment cannot be completed');
      }

      await get().updateAppointment(id, {
        status: 'completed',
        notes: notes || appointment.notes,
      });
    },

    setFilters: (filters: Partial<AppointmentFilters>) => {
      set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1 },
      }));
    },

    clearFilters: () => {
      set({
        filters: initialFilters,
        pagination: { ...get().pagination, page: 1 },
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

    loadMore: async () => {
      const { pagination } = get();
      
      if (!pagination.hasMore || get().isLoading) {
        return;
      }

      set((state) => ({
        pagination: { ...state.pagination, page: state.pagination.page + 1 },
      }));

      await get().fetchAppointments();
    },
  }))
);

// Selectors
export const useAppointments = () => {
  const store = useAppointmentStore();
  return { ...store };
};

// Specific selectors
export const useAppointmentList = () => useAppointmentStore((state) => state.appointments);
export const useCurrentAppointment = () => useAppointmentStore((state) => state.currentAppointment);
export const useAppointmentLoading = () => useAppointmentStore((state) => state.isLoading);
export const useAppointmentError = () => useAppointmentStore((state) => state.error);
export const useAppointmentFilters = () => useAppointmentStore((state) => state.filters);