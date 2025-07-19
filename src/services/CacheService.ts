import type { 
  ICacheService, 
  ICacheStorage, 
  ICacheCleanup, 
  ICacheFetcher 
} from '@/services/interfaces/ICacheService';
import type { CacheItem, CacheOptions } from '@/types';
import { CACHE_CONFIG } from '@/constants';
import { LocalStorageStrategy } from '@/services/cache/LocalStorageStrategy';
import { MemoryStorageStrategy } from '@/services/cache/MemoryStorageStrategy';
import { CacheCleanupStrategy } from '@/services/cache/CacheCleanupStrategy';

/**
 * Modern cache service implementation following SOLID principles
 */
class CacheService implements ICacheService, ICacheFetcher {
  private readonly memoryStorage: ICacheStorage;
  private readonly persistentStorage: ICacheStorage;
  private readonly cleanup: ICacheCleanup;
  private readonly defaultTTL: number;

  constructor(
    memoryStorage?: ICacheStorage,
    persistentStorage?: ICacheStorage,
    cleanup?: ICacheCleanup,
    defaultTTL: number = CACHE_CONFIG.DEFAULT_TTL
  ) {
    this.memoryStorage = memoryStorage || new MemoryStorageStrategy();
    this.persistentStorage = persistentStorage || new LocalStorageStrategy();
    this.cleanup = cleanup || new CacheCleanupStrategy(this.persistentStorage);
    this.defaultTTL = defaultTTL;
  }

  /**
   * Performs cleanup if needed
   */
  private async cleanupIfNeeded(): Promise<void> {
    if (this.cleanup.shouldCleanup()) {
      await this.cleanup.cleanup();
    }
  }

  /**
   * Sets data in cache with optional TTL
   */
  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    await this.cleanupIfNeeded();

    try {
      const ttl = options?.ttl ?? this.defaultTTL;
      const useLocalStorage = options?.useLocalStorage ?? true;
      
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      const serializedData = JSON.stringify(cacheItem);

      // Always save to memory cache
      this.memoryStorage.setItem(key, serializedData);

      // Optionally save to persistent storage
      if (useLocalStorage) {
        try {
          this.persistentStorage.setItem(key, serializedData);
        } catch (storageError) {
          // If storage fails, try cleanup and retry
          await this.cleanup.cleanup();
          this.persistentStorage.setItem(key, serializedData);
        }
      }
    } catch (error) {
      console.error('Error setting cache:', error);
      throw new Error('Failed to set cache data');
    }
  }

  /**
   * Gets data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    await this.cleanupIfNeeded();

    try {
      // Try memory cache first
      const memoryData = this.memoryStorage.getItem(key);
      if (memoryData) {
        const cacheItem: CacheItem<T> = JSON.parse(memoryData);
        if (!this.isExpired(cacheItem)) {
          return cacheItem.data;
        }
        // Remove expired item from memory
        this.memoryStorage.removeItem(key);
      }

      // Try persistent storage
      const persistentData = this.persistentStorage.getItem(key);
      if (persistentData) {
        const cacheItem: CacheItem<T> = JSON.parse(persistentData);
        
        if (this.isExpired(cacheItem)) {
          // Remove expired item
          this.persistentStorage.removeItem(key);
          return null;
        }

        // Update memory cache with fresh data
        this.memoryStorage.setItem(key, persistentData);
        return cacheItem.data;
      }

      return null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  /**
   * Checks if key exists in cache and is not expired
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Removes specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      this.memoryStorage.removeItem(key);
      this.persistentStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  }

  /**
   * Clears all cache data
   */
  async clear(): Promise<void> {
    try {
      this.memoryStorage.clear();
      this.persistentStorage.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Gets cache timestamp for a key
   */
  async getTimestamp(key: string): Promise<number | null> {
    try {
      const persistentData = this.persistentStorage.getItem(key);
      if (!persistentData) return null;

      const cacheItem: CacheItem<unknown> = JSON.parse(persistentData);
      return cacheItem.timestamp;
    } catch (error) {
      console.error('Error getting cache timestamp:', error);
      return null;
    }
  }

  /**
   * Updates cache timestamp for a key
   */
  async updateTimestamp(key: string, timestamp: number): Promise<void> {
    try {
      const persistentData = this.persistentStorage.getItem(key);
      if (!persistentData) return;

      const cacheItem: CacheItem<unknown> = JSON.parse(persistentData);
      cacheItem.timestamp = timestamp;
      
      const updatedData = JSON.stringify(cacheItem);
      this.persistentStorage.setItem(key, updatedData);
      this.memoryStorage.setItem(key, updatedData);
    } catch (error) {
      console.error('Error updating cache timestamp:', error);
    }
  }

  /**
   * Fetches data with cache fallback
   */
  async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions & { forceRefresh?: boolean }
  ): Promise<T> {
    const forceRefresh = options?.forceRefresh ?? false;

    if (!forceRefresh) {
      const cachedData = await this.get<T>(key);
      if (cachedData !== null) {
        return cachedData;
      }
    }
    
    // Busca dados frescos
    try {
      const data = await fetchFn();
      await this.set(key, data, options);
      return data;
    } catch (error) {
      // Try to use expired cache as fallback
      const fallbackData = await this.getExpiredCache<T>(key);
      if (fallbackData !== null) {
        console.warn('Using expired cache as fallback due to fetch error');
        return fallbackData;
      }
      throw error;
    }
  }

  /**
   * Updates cache with new data
   */
  async updateCache<T>(key: string, updateFn: (prev: T | null) => T): Promise<void> {
    try {
      const currentData = await this.get<T>(key);
      const updatedData = updateFn(currentData);
      await this.set(key, updatedData);
    } catch (error) {
      console.error('Error updating cache:', error);
      throw new Error('Failed to update cache');
    }
  }

  /**
   * Checks if a cache item is expired
   */
  private isExpired(cacheItem: CacheItem<unknown>): boolean {
    const now = Date.now();
    return (now - cacheItem.timestamp) > cacheItem.ttl;
  }

  /**
   * Gets expired cache data as fallback
   */
  private async getExpiredCache<T>(key: string): Promise<T | null> {
    try {
      // Try to get from persistent storage even if expired
      const persistentData = this.persistentStorage.getItem(key);
      if (!persistentData) return null;

      const cacheItem: CacheItem<T> = JSON.parse(persistentData);
      return cacheItem.data;
    } catch (error) {
      console.error('Error getting expired cache:', error);
      return null;
    }
  }

  /**
   * Gets cache statistics
   */
  async getCacheStats(): Promise<{
    memorySize: number;
    persistentSize: number;
    itemCount: number;
  }> {
    try {
      const persistentKeys = this.persistentStorage.getAllKeys();
      
      return {
        memorySize: await this.calculateStorageSize(this.memoryStorage),
        persistentSize: await this.calculateStorageSize(this.persistentStorage),
        itemCount: persistentKeys.length,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { memorySize: 0, persistentSize: 0, itemCount: 0 };
    }
  }

  /**
   * Calculates storage size
   */
  private async calculateStorageSize(storage: ICacheStorage): Promise<number> {
    let totalSize = 0;
    const keys = storage.getAllKeys();
    
    keys.forEach(key => {
      const value = storage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // Approximate size in bytes
      }
    });
    
    return totalSize;
  }

  /**
   * Forces cleanup
   */
  async forceCleanup(): Promise<void> {
    await this.cleanup.cleanup();
  }
}

// Create and export singleton instance
const cacheService = new CacheService();

// Legacy static methods for backward compatibility
export const LegacyCacheService = {
  setCache: <T>(key: string, data: T) => cacheService.set(key, data),
  getCache: <T>(key: string) => cacheService.get<T>(key),
  getCacheTimestamp: (key: string) => cacheService.getTimestamp(key),
  clearCache: () => cacheService.clear(),
  fetchWithCache: <T>(
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
  ) => cacheService.fetchWithCache(key, fetchFn, { forceRefresh }),
  updateCache: <T>(key: string, updateFn: (prev: T | null) => T) => 
    cacheService.updateCache(key, updateFn),
  getLastUpdateTime: (key: string) => cacheService.getTimestamp(key),
  setLastUpdateTime: (key: string, timestamp: number) => 
    cacheService.updateTimestamp(key, timestamp),
};

// Export both the class and singleton for flexibility
export { CacheService, cacheService };
export default cacheService;
