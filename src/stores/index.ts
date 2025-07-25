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
export {
  useCommentStore,
  useComments,
  useCommentLoading,
  useCommentError,
  useCommentActions
} from './commentStore';

// Re-export types
export type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  Appointment,
  BookingFormData,
  AppointmentFilters,
  PublicComment,
  CommentFilters
} from '@/types';