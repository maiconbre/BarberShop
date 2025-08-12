/**
 * Services exports
 */
export { cacheService } from './CacheService';
export { default as CacheService } from './CacheService';

// New SOLID architecture exports
export { HttpClient } from './core/HttpClient';
export { ErrorHandler } from './core/ErrorHandler';
export { ApiMetrics } from './core/ApiMetrics';
export { ApiServiceV2 } from './core/ApiServiceV2';

// Repositories
export { UserRepository } from './repositories/UserRepository';
export { ServiceRepository } from './repositories/ServiceRepository';

// Cache strategies and interfaces
export * from './cache';
export * from './interfaces/ICacheService';
export * from './interfaces/IApiService';
export * from './interfaces/IHttpClient';
export * from './interfaces/IRepository';

// Re-export types
export type {
  CacheItem,
  CacheOptions,
  FetchWithCacheOptions
} from '@/types';