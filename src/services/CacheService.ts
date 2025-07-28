import type { CacheItem, CacheOptions } from '@/types';
import { CACHE_CONFIG } from '@/constants';
import { LogConfig } from '../config/logConfig';

// Simplified cache logger
class CacheLogger {
  private static counter = 0;

  static log(operation: string, key: string, details?: any) {
    if (!LogConfig.shouldLog()) return;
    
    this.counter++;
    console.log(`🗄️ [CACHE #${this.counter}] ${operation} - ${key}`, details || '');
  }
}

/**
 * Simplified cache service implementation
 */
class CacheService {
  private memoryCache = new Map<string, string>();
  private readonly defaultTTL: number;
  private lastCleanup = 0;
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes

  constructor(defaultTTL: number = CACHE_CONFIG.DEFAULT_TTL) {
    this.defaultTTL = defaultTTL;
  }

  /**
   * Simple cleanup of expired items
   */
  private cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) return;
    
    this.lastCleanup = now;
    
    // Clean memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      try {
        const item: CacheItem<any> = JSON.parse(value);
        if (this.isExpired(item)) {
          this.memoryCache.delete(key);
        }
      } catch {
        this.memoryCache.delete(key);
      }
    }
    
    // Clean localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        const item: CacheItem<any> = JSON.parse(value);
        if (item.timestamp && item.ttl && this.isExpired(item)) {
          keysToRemove.push(key);
        }
      } catch {
        // Invalid cache item, remove it
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Sets an item in cache
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    try {
      const ttl = options?.ttl || this.defaultTTL;
      const persist = options?.persist !== false; // Default to true
      
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      const serialized = JSON.stringify(item);
      
      // Store in memory
      this.memoryCache.set(key, serialized);
      
      // Store in localStorage if requested
      if (persist) {
        try {
          localStorage.setItem(key, serialized);
        } catch (storageError) {
          console.warn('Failed to save to localStorage:', storageError);
        }
      }
      
      CacheLogger.log('SET', key, { ttl: `${Math.round(ttl / 1000)}s`, persist });
      
      this.cleanupIfNeeded();
    } catch (error) {
      CacheLogger.log('SET_ERROR', key, error);
    }
  }

  /**
   * Gets data from cache
   */
  get<T>(key: string): T | null {
    this.cleanupIfNeeded();
    
    try {
      // Try memory first
      const memoryValue = this.memoryCache.get(key);
      if (memoryValue) {
        const item: CacheItem<T> = JSON.parse(memoryValue);
        if (!this.isExpired(item)) {
          CacheLogger.log('GET_HIT_MEMORY', key);
          return item.data;
        }
        this.memoryCache.delete(key);
      }

      // Try localStorage
      const storageValue = localStorage.getItem(key);
      if (storageValue) {
        const item: CacheItem<T> = JSON.parse(storageValue);
        if (!this.isExpired(item)) {
          // Store back in memory for faster access
          this.memoryCache.set(key, storageValue);
          CacheLogger.log('GET_HIT_STORAGE', key);
          return item.data;
        }
        localStorage.removeItem(key);
      }

      CacheLogger.log('GET_MISS', key);
      return null;
    } catch (error) {
      CacheLogger.log('GET_ERROR', key, error);
      return null;
    }
  }

  /**
   * Checks if key exists in cache and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Removes an item from cache
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(key);
    CacheLogger.log('DELETE', key);
  }

  /**
   * Alias for delete - for backward compatibility
   */
  remove(key: string): void {
    this.delete(key);
  }

  /**
   * Clears all cache
   */
  clear(): void {
    this.memoryCache.clear();
    
    // Clear only cache items from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        const item = JSON.parse(value);
        if (item.timestamp && item.ttl) {
          keysToRemove.push(key);
        }
      } catch {
        // Not a cache item, skip
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    CacheLogger.log('CLEAR', 'all');
  }

  /**
   * Fetch with cache - simplified version
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Check cache first
      const cached = this.get<T>(key);
      if (cached !== null) {
        CacheLogger.log('FETCH_CACHE_HIT', key);
        return cached;
      }

      // Not in cache, fetch the data
      CacheLogger.log('FETCH_CACHE_MISS', key);
      const data = await fetcher();
      
      // Store in cache for future use
      this.set(key, data, options);
      
      CacheLogger.log('FETCH_COMPLETE', key);
      return data;
    } catch (error) {
      CacheLogger.log('FETCH_ERROR', key, error);
      throw error;
    }
  }

  /**
   * Alias for fetchWithCache - for backward compatibility
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    return this.fetchWithCache(key, fetcher, options);
  }

  /**
   * Checks if a cache item is expired
   */
  private isExpired(cacheItem: CacheItem<unknown>): boolean {
    if (!cacheItem.timestamp || !cacheItem.ttl) {
      return true;
    }
    return Date.now() > (cacheItem.timestamp + cacheItem.ttl);
  }

  /**
   * Gets basic cache statistics
   */
  getStats(): {
    memoryItems: number;
    storageItems: number;
  } {
    let storageItems = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const item = JSON.parse(value);
              if (item.timestamp && item.ttl) {
                storageItems++;
              }
            }
          } catch {
            // Invalid cache item, ignore
          }
        }
      }
    } catch {
      // localStorage access error
    }
    
    return {
      memoryItems: this.memoryCache.size,
      storageItems
    };
  }

  /**
   * Force cleanup of expired items
   */
  forceCleanup(): void {
    this.lastCleanup = 0; // Force cleanup on next operation
    this.cleanupIfNeeded();
    CacheLogger.log('FORCE_CLEANUP', 'all');
  }
}

// Create and export singleton instance
const cacheService = new CacheService();

export { cacheService };
export default cacheService;
