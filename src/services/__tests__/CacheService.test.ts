import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cacheService } from '../CacheService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console.log para evitar logs durante os testes
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('CacheService', () => {
  beforeEach(() => {
    // Limpar cache antes de cada teste
    cacheService.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get data from cache', () => {
      const testData = { name: 'Test', value: 123 };
      const key = 'test-key';

      cacheService.set(key, testData);
      const result = cacheService.get(key);

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const result = cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check if key exists in cache', () => {
      const key = 'test-key';
      const testData = 'test-value';

      expect(cacheService.has(key)).toBe(false);
      
      cacheService.set(key, testData);
      expect(cacheService.has(key)).toBe(true);
    });

    it('should delete specific key from cache', () => {
      const key = 'test-key';
      const testData = 'test-value';

      cacheService.set(key, testData);
      expect(cacheService.has(key)).toBe(true);

      cacheService.delete(key);
      expect(cacheService.has(key)).toBe(false);
    });

    it('should remove specific key from cache (alias for delete)', () => {
      const key = 'test-key';
      const testData = 'test-value';

      cacheService.set(key, testData);
      expect(cacheService.has(key)).toBe(true);

      cacheService.remove(key);
      expect(cacheService.has(key)).toBe(false);
    });

    it('should clear all cache data', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);
      expect(cacheService.has('key3')).toBe(true);

      cacheService.clear();

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
      expect(cacheService.has('key3')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect custom TTL', async () => {
      const key = 'ttl-test';
      const testData = 'test-value';
      const shortTTL = 100; // 100ms

      cacheService.set(key, testData, { ttl: shortTTL });
      expect(cacheService.has(key)).toBe(true);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, shortTTL + 50));
      
      // Item should be expired and return null
      expect(cacheService.get(key)).toBeNull();
    });

    it('should use default TTL when no custom TTL provided', () => {
      const key = 'default-ttl-test';
      const testData = 'test-value';

      cacheService.set(key, testData);
      expect(cacheService.has(key)).toBe(true);
      expect(cacheService.get(key)).toEqual(testData);
    });
  });

  describe('Cache with Fetcher', () => {
    it('should fetch and cache data when not in cache', async () => {
      const key = 'fetch-test';
      const expectedData = { id: 1, name: 'Test Data' };
      const fetcher = vi.fn().mockResolvedValue(expectedData);

      const result = await cacheService.fetchWithCache(key, fetcher);

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedData);
      expect(cacheService.get(key)).toEqual(expectedData);
    });

    it('should return cached data without calling fetcher', async () => {
      const key = 'cached-fetch-test';
      const cachedData = { id: 1, name: 'Cached Data' };
      const fetcher = vi.fn().mockResolvedValue({ id: 2, name: 'New Data' });

      // Pre-populate cache
      cacheService.set(key, cachedData);

      const result = await cacheService.fetchWithCache(key, fetcher);

      expect(fetcher).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should handle fetcher errors gracefully', async () => {
      const key = 'error-fetch-test';
      const error = new Error('Fetch failed');
      const fetcher = vi.fn().mockRejectedValue(error);

      await expect(cacheService.fetchWithCache(key, fetcher)).rejects.toThrow('Fetch failed');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(cacheService.has(key)).toBe(false);
    });
  });

  describe('getOrFetch method', () => {
    it('should work as alias for fetchWithCache', async () => {
      const key = 'get-or-fetch-test';
      const expectedData = { id: 1, name: 'Test Data' };
      const fetcher = vi.fn().mockResolvedValue(expectedData);

      const result = await cacheService.getOrFetch(key, fetcher);

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedData);
      expect(cacheService.get(key)).toEqual(expectedData);
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      const stats = cacheService.getStats();

      expect(stats).toHaveProperty('memoryItems');
      expect(stats).toHaveProperty('storageItems');
      expect(typeof stats.memoryItems).toBe('number');
      expect(typeof stats.storageItems).toBe('number');
    });
  });

  describe('Force Cleanup', () => {
    it('should force cleanup of expired items', () => {
      // This test verifies that forceCleanup method exists and can be called
      expect(() => cacheService.forceCleanup()).not.toThrow();
    });
  });

  describe('Data Types', () => {
    it('should handle different data types', () => {
      const testCases = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: true },
        { key: 'array', value: [1, 2, 3] },
        { key: 'object', value: { name: 'test', nested: { value: 123 } } },
        { key: 'null', value: null }
      ];

      testCases.forEach(({ key, value }) => {
        cacheService.set(key, value);
        expect(cacheService.get(key)).toEqual(value);
      });
    });
  });
});