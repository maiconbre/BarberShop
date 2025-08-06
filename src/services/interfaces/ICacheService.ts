import type { CacheOptions } from '@/types';

/**
 * Interface for cache service following Interface Segregation Principle
 */
export interface ICacheService {
  /**
   * Sets data in cache with optional TTL
   */
  set<T>(key: string, data: T, options?: CacheOptions): Promise<void>;

  /**
   * Gets data from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Checks if key exists in cache and is not expired
   */
  has(key: string): Promise<boolean>;

  /**
   * Removes specific key from cache
   */
  delete(key: string): Promise<void>;

  /**
   * Clears all cache data
   */
  clear(): Promise<void>;

  /**
   * Gets cache timestamp for a key
   */
  getTimestamp(key: string): Promise<number | null>;

  /**
   * Updates cache timestamp for a key
   */
  updateTimestamp(key: string, timestamp: number): Promise<void>;
}

/**
 * Interface for cache storage strategy
 */
export interface ICacheStorage {
  /**
   * Sets item in storage
   */
  setItem(key: string, value: string): void;

  /**
   * Gets item from storage
   */
  getItem(key: string): string | null;

  /**
   * Removes item from storage
   */
  removeItem(key: string): void;

  /**
   * Clears all items from storage
   */
  clear(): void;

  /**
   * Gets all keys from storage
   */
  getAllKeys(): string[];
}

/**
 * Interface for cache cleanup strategy
 */
export interface ICacheCleanup {
  /**
   * Performs cleanup of expired items
   */
  cleanup(): Promise<void>;

  /**
   * Checks if cleanup is needed
   */
  shouldCleanup(): boolean;

  /**
   * Gets cache size information
   */
  getCacheSize(): Promise<number>;
}

/**
 * Interface for fetch with cache functionality
 */
export interface ICacheFetcher {
  /**
   * Fetches data with cache fallback
   */
  fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions & { forceRefresh?: boolean }
  ): Promise<T>;

  /**
   * Updates cache with new data
   */
  updateCache<T>(key: string, updateFn: (prev: T | null) => T): Promise<void>;
}