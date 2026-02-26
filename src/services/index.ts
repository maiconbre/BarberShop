/**
 * Services exports
 */
export { cacheService } from './CacheService';
export { default as CacheService } from './CacheService';

// New SOLID architecture exports
// export { HttpClient } from './core/HttpClient'; // MOVED TO TRASH
// export { ErrorHandler } from './core/ErrorHandler'; // MOVED TO TRASH
// export { ApiMetrics } from './core/ApiMetrics'; // MOVED TO TRASH
// export { ApiServiceV2 } from './core/ApiServiceV2'; // MOVED TO TRASH

// Repositories
export { UserRepository } from './repositories/UserRepository';
export { ServiceRepository } from './repositories/ServiceRepository';

// Cache strategies and interfaces
export * from './cache';
export * from './interfaces/ICacheService';
// export * from './interfaces/IApiService'; // REMOVED
// export * from './interfaces/IHttpClient'; // REMOVED
export * from './interfaces/IRepository';

// Re-export types
export type {
  CacheItem,
  CacheOptions,
  FetchWithCacheOptions
} from '@/types';