/**
 * Custom hook for cache management
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService } from '@/services';
import type { CacheOptions, FetchWithCacheOptions } from '@/types';

interface UseCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
  updateCache: (updateFn: (prev: T | null) => T) => Promise<void>;
}

/**
 * Hook for managing cached data with automatic fetching
 */
export const useCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions & FetchWithCacheOptions = {}
): UseCacheReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);

  const mountedRef = useRef(true);
  const { ttl = 300000, forceRefresh = false } = options;

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await cacheService.getOrFetch(
        key,
        fetchFn
      );

      if (mountedRef.current) {
        setData(result);
        setLastUpdated(Date.now());
        setIsStale(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, fetchFn, options]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    cacheService.remove(key);
    setData(null);
    setLastUpdated(null);
    setIsStale(true);
  }, [key]);

  const updateCache = useCallback(async (updateFn: (prev: T | null) => T) => {
    const currentData = cacheService.get<T>(key);
    const updatedData = updateFn(currentData);
    cacheService.set(key, updatedData);
    if (mountedRef.current) {
      setData(updatedData);
      setLastUpdated(Date.now());
    }
  }, [key]);

  // Check if data is stale
  useEffect(() => {
    if (lastUpdated && ttl) {
      const checkStale = () => {
        const now = Date.now();
        const isDataStale = (now - lastUpdated) > ttl;
        setIsStale(isDataStale);
      };

      checkStale();
      const interval = setInterval(checkStale, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [lastUpdated, ttl]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData, forceRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isStale,
    lastUpdated,
    refetch,
    invalidate,
    updateCache,
  };
};

/**
 * Hook for managing cache with manual control
 */
export const useCacheManual = <T>(key: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const get = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await cacheService.get<T>(key);
      setData(result);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, [key]);

  const set = useCallback(async (value: T, options?: CacheOptions) => {
    setLoading(true);
    setError(null);

    try {
      await cacheService.set(key, value, options);
      setData(value);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, [key]);

  const remove = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      cacheService.remove(key);
      setData(null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, [key]);

  const exists = useCallback(async () => {
    return await cacheService.has(key);
  }, [key]);

  return {
    data,
    loading,
    error,
    get,
    set,
    remove,
    exists,
  };
};

/**
 * Hook for cache statistics
 */
export const useCacheStats = () => {
  const [stats, setStats] = useState({
    memorySize: 0,
    persistentSize: 0,
    itemCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    try {
      // Como getCacheStats não existe mais, vamos simular estatísticas básicas
      const stats = {
        memorySize: 0, // Não temos acesso ao tamanho da memória
        persistentSize: 0, // Não temos acesso ao tamanho do localStorage
        itemCount: 0 // Não temos acesso à contagem de itens
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    await cacheService.clear();
    await refreshStats();
  }, [refreshStats]);

  const forceCleanup = useCallback(async () => {
    await cacheService.forceCleanup();
    await refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    refreshStats,
    clearCache,
    forceCleanup,
  };
};