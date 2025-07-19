import type { ICacheStorage } from '@/services/interfaces/ICacheService';

/**
 * In-memory implementation of cache storage strategy
 */
export class MemoryStorageStrategy implements ICacheStorage {
  private readonly storage = new Map<string, string>();
  private readonly prefix: string;

  constructor(prefix: string = 'memory_') {
    this.prefix = prefix;
  }

  setItem(key: string, value: string): void {
    this.storage.set(this.getFullKey(key), value);
  }

  getItem(key: string): string | null {
    return this.storage.get(this.getFullKey(key)) || null;
  }

  removeItem(key: string): void {
    this.storage.delete(this.getFullKey(key));
  }

  clear(): void {
    const keysToRemove = this.getAllKeys();
    keysToRemove.forEach(key => {
      this.storage.delete(key);
    });
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys()).filter(key => 
      key.startsWith(this.prefix)
    );
  }

  /**
   * Gets the total size of cached data in bytes (approximate)
   */
  getTotalSize(): number {
    let totalSize = 0;
    const keys = this.getAllKeys();
    
    keys.forEach(key => {
      const value = this.storage.get(key);
      if (value) {
        totalSize += value.length * 2; // Approximate size in bytes
      }
    });
    
    return totalSize;
  }

  /**
   * Gets entries sorted by size for cleanup purposes
   */
  getEntriesBySize(): Array<{ key: string; size: number }> {
    const entries: Array<{ key: string; size: number }> = [];
    const keys = this.getAllKeys();
    
    keys.forEach(key => {
      const value = this.storage.get(key);
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
   * Gets the number of items in cache
   */
  getItemCount(): number {
    return this.getAllKeys().length;
  }

  /**
   * Checks if storage has reached capacity
   */
  hasReachedCapacity(maxItems: number): boolean {
    return this.getItemCount() >= maxItems;
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}