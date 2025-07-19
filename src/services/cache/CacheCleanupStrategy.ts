import type { ICacheCleanup, ICacheStorage } from '@/services/interfaces/ICacheService';
import type { CacheItem } from '@/types';
import { CACHE_CONFIG } from '@/constants';

/**
 * Cache cleanup strategy implementation
 */
export class CacheCleanupStrategy implements ICacheCleanup {
  private lastCleanup: number = Date.now();
  private readonly cleanupInterval: number;
  private readonly maxCacheSize: number;

  constructor(
    private readonly storage: ICacheStorage,
    cleanupInterval: number = 60 * 1000, // 1 minute
    maxCacheSize: number = 50 * 1024 * 1024 // 50MB
  ) {
    this.cleanupInterval = cleanupInterval;
    this.maxCacheSize = maxCacheSize;
  }

  async cleanup(): Promise<void> {
    try {
      await this.cleanupExpiredItems();
      await this.cleanupBySize();
      this.lastCleanup = Date.now();
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  shouldCleanup(): boolean {
    const now = Date.now();
    return (now - this.lastCleanup) > this.cleanupInterval;
  }

  async getCacheSize(): Promise<number> {
    try {
      let totalSize = 0;
      const keys = this.storage.getAllKeys();
      
      keys.forEach(key => {
        const value = this.storage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // Approximate size in bytes
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Removes expired cache items
   */
  private async cleanupExpiredItems(): Promise<void> {
    const keys = this.storage.getAllKeys();
    const now = Date.now();
    
    for (const key of keys) {
      try {
        const value = this.storage.getItem(key);
        if (!value) continue;
        
        const cacheItem: CacheItem<unknown> = JSON.parse(value);
        
        if (this.isExpired(cacheItem, now)) {
          this.storage.removeItem(this.getKeyWithoutPrefix(key));
        }
      } catch (error) {
        // If we can't parse the item, remove it
        console.warn('Removing corrupted cache item:', key);
        this.storage.removeItem(this.getKeyWithoutPrefix(key));
      }
    }
  }

  /**
   * Removes items if cache size exceeds limit
   */
  private async cleanupBySize(): Promise<void> {
    const currentSize = await this.getCacheSize();
    
    if (currentSize <= this.maxCacheSize) {
      return;
    }
    
    // Get entries sorted by size (smallest first)
    const entries = this.getEntriesBySize();
    let sizeToRemove = currentSize - this.maxCacheSize;
    
    for (const entry of entries) {
      if (sizeToRemove <= 0) break;
      
      this.storage.removeItem(this.getKeyWithoutPrefix(entry.key));
      sizeToRemove -= entry.size;
    }
  }

  /**
   * Checks if a cache item is expired
   */
  private isExpired(cacheItem: CacheItem<unknown>, currentTime: number): boolean {
    return (currentTime - cacheItem.timestamp) > cacheItem.ttl;
  }

  /**
   * Gets entries sorted by size for cleanup
   */
  private getEntriesBySize(): Array<{ key: string; size: number }> {
    const entries: Array<{ key: string; size: number }> = [];
    const keys = this.storage.getAllKeys();
    
    keys.forEach(key => {
      const value = this.storage.getItem(key);
      if (value) {
        entries.push({
          key,
          size: value.length * 2
        });
      }
    });
    
    return entries.sort((a, b) => a.size - b.size);
  }

  /**
   * Removes prefix from key to get the original key
   */
  private getKeyWithoutPrefix(fullKey: string): string {
    const prefix = CACHE_CONFIG.STORAGE_KEY_PREFIX;
    return fullKey.startsWith(prefix) ? fullKey.slice(prefix.length) : fullKey;
  }

  /**
   * Forces immediate cleanup regardless of interval
   */
  async forceCleanup(): Promise<void> {
    await this.cleanup();
  }

  /**
   * Gets cleanup statistics
   */
  async getCleanupStats(): Promise<{
    lastCleanup: number;
    cacheSize: number;
    itemCount: number;
    nextCleanupIn: number;
  }> {
    const cacheSize = await this.getCacheSize();
    const itemCount = this.storage.getAllKeys().length;
    const nextCleanupIn = Math.max(0, this.cleanupInterval - (Date.now() - this.lastCleanup));
    
    return {
      lastCleanup: this.lastCleanup,
      cacheSize,
      itemCount,
      nextCleanupIn,
    };
  }
}