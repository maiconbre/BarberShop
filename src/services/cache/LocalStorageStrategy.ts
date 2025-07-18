import type { ICacheStorage } from '@/services/interfaces/ICacheService';
import { CACHE_CONFIG } from '@/constants';

/**
 * LocalStorage implementation of cache storage strategy
 */
export class LocalStorageStrategy implements ICacheStorage {
  private readonly prefix: string;

  constructor(prefix: string = CACHE_CONFIG.STORAGE_KEY_PREFIX) {
    this.prefix = prefix;
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(this.getFullKey(key), value);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
      throw new Error('Failed to store data in localStorage');
    }
  }

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(this.getFullKey(key));
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.getFullKey(key));
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }

  clear(): void {
    try {
      const keysToRemove = this.getAllKeys();
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('Error getting all keys from localStorage:', error);
      return [];
    }
  }

  /**
   * Gets the total size of cached data in bytes (approximate)
   */
  getTotalSize(): number {
    try {
      let totalSize = 0;
      const keys = this.getAllKeys();
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // Approximate size in bytes
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
      return 0;
    }
  }

  /**
   * Gets entries sorted by size for cleanup purposes
   */
  getEntriesBySize(): Array<{ key: string; size: number }> {
    try {
      const entries: Array<{ key: string; size: number }> = [];
      const keys = this.getAllKeys();
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          entries.push({
            key,
            size: value.length * 2
          });
        }
      });
      
      return entries.sort((a, b) => a.size - b.size);
    } catch (error) {
      console.error('Error getting entries by size:', error);
      return [];
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}