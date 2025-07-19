// Export all domain models
export { User } from './User';
export { Service } from './Service';
export { Appointment } from './Appointment';

// Re-export types for convenience
export type {
  User as UserType,
  Service as ServiceType,
  Appointment as AppointmentType,
  Barber,
  Comment,
  AppointmentStatus,
  WorkingHours,
  TimeSlot,
  LoginCredentials,
  RegisterData,
  BookingFormData,
  ServiceFormData,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  AuthTokens,
  CacheItem,
  CacheOptions,
  AppointmentFilters,
  SearchParams,
} from '@/types';