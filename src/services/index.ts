/**
 * Services exports
 */
export { cacheService } from './CacheService';
export { default as CacheService } from './CacheService';

// Cache strategies and interfaces
export * from './cache';
export * from './interfaces/ICacheService';

// Re-export types
export type {
  CacheItem,
  CacheOptions,
  FetchWithCacheOptions
} from '@/types';