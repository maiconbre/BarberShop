/**
 * Stores exports
 */
export { useAuthStore, useAuth, useUser, useIsAuthenticated, useAuthLoading, useAuthError } from './authStore';
export {
  useAppointmentStore,
  useAppointments,
  useAppointmentList,
  useCurrentAppointment,
  useAppointmentLoading,
  useAppointmentError,
  useAppointmentFilters
} from './appointmentStore';

// Re-export types
export type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  Appointment,
  BookingFormData,
  AppointmentFilters
} from '@/types';