/**
 * Custom hooks exports
 */
export { useFormValidation } from './useFormValidation';
export { useForm } from './useForm';
export { useAsync, useAsyncWithRetry, useAsyncQueue } from './useAsync';
export { useCache, useCacheManual, useCacheStats } from './useCache';
export { useCountdown } from './useCountdown';
export { useAuthRedirect } from './useAuthRedirect';

// Repository-based hooks (SOLID architecture)
export { useUsers, useBarbers as useUsersBarbers, useClients } from './useUsers';
export { useAppointments } from './useAppointments';
export { useBarbers } from './useBarbers';
export { useServices } from './useServices';
export { useComments } from './useComments';

// Tenant-aware repository hooks
export {
  useTenantRepositories,
  useTenantApiService,
  useTenantUserRepository,
  useTenantServiceRepository,
  useTenantAppointmentRepository,
  useTenantBarberRepository,
  useTenantCommentRepository
} from './useTenantRepositories';

// Re-export types
export type {
  CacheOptions,
  FetchWithCacheOptions
} from '@/types';