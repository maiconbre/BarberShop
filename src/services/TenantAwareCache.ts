import { cacheService } from './CacheService';
import type { CacheOptions } from '@/types';

/**
 * Tenant-aware cache service that isolates cache data by tenant
 * Automatically prefixes cache keys with tenant ID
 */
export class TenantAwareCache {
  constructor(private getTenantId: () => string | null) {}

  /**
   * Generate tenant-specific cache key
   */
  private getTenantKey(key: string): string {
    const tenantId = this.getTenantId();
    
    if (!tenantId) {
      throw new Error('Tenant context is required for cache operations');
    }

    return `tenant:${tenantId}:${key}`;
  }

  /**
   * Get cached data for current tenant
   */
  get<T>(key: string): T | null {
    try {
      return cacheService.get<T>(this.getTenantKey(key));
    } catch (error) {
      // If tenant context is not available, return null instead of throwing
      if (error instanceof Error && error.message.includes('Tenant context is required')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Set cached data for current tenant
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    try {
      cacheService.set(this.getTenantKey(key), data, options);
    } catch (error) {
      // If tenant context is not available, silently fail
      if (error instanceof Error && error.message.includes('Tenant context is required')) {
        return;
      }
      throw error;
    }
  }

  /**
   * Remove cached data for current tenant
   */
  remove(key: string): void {
    try {
      cacheService.delete(this.getTenantKey(key));
    } catch (error) {
      // If tenant context is not available, silently fail
      if (error instanceof Error && error.message.includes('Tenant context is required')) {
        return;
      }
      throw error;
    }
  }

  /**
   * Delete cached data for current tenant (alias for remove to match ICacheService interface)
   */
  async delete(key: string): Promise<void> {
    try {
      cacheService.delete(this.getTenantKey(key));
    } catch (error) {
      // If tenant context is not available, silently fail
      if (error instanceof Error && error.message.includes('Tenant context is required')) {
        return;
      }
      throw error;
    }
  }

  /**
   * Check if data exists in cache for current tenant
   */
  has(key: string): boolean {
    try {
      return cacheService.has(this.getTenantKey(key));
    } catch (error) {
      // If tenant context is not available, return false
      if (error instanceof Error && error.message.includes('Tenant context is required')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Clear all cache data for current tenant
   */
  clearTenantCache(): void {
    const tenantId = this.getTenantId();
    
    if (!tenantId) {
      return; // Nothing to clear if no tenant context
    }

    const tenantPrefix = `tenant:${tenantId}:`;
    
    // Clear from memory cache
    cacheService.clearByPrefix(tenantPrefix);
    
    // Clear from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(tenantPrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Fetch data with cache fallback for current tenant
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      return await cacheService.getOrFetch<T>(this.getTenantKey(key), fetcher, options);
    } catch (error) {
      // If tenant context is not available, execute fetcher directly
      if (error instanceof Error && error.message.includes('Tenant context is required')) {
        return await fetcher();
      }
      throw error;
    }
  }

  /**
   * Get cache statistics for current tenant
   */
  getStats(): { keys: number; memoryUsage: number } {
    const tenantId = this.getTenantId();
    
    if (!tenantId) {
      return { keys: 0, memoryUsage: 0 };
    }

    return cacheService.getStatsByPrefix(`tenant:${tenantId}:`);
  }
}

/**
 * Factory function to create tenant-aware cache
 */
export function createTenantAwareCache(getTenantId: () => string | null): TenantAwareCache {
  return new TenantAwareCache(getTenantId);
}