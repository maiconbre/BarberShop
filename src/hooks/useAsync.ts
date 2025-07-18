/**
 * Custom hook for managing async operations
 */
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: Error | null) => void;
}

/**
 * Hook for managing async operations with loading, error, and data states
 */
export const useAsync = <T = any>(
  asyncFunction?: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): UseAsyncReturn<T> => {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mountedRef = useRef(true);
  const pendingPromiseRef = useRef<Promise<T> | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      if (!asyncFunction) {
        console.warn('No async function provided to useAsync');
        return;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        
        const promise = asyncFunction(...args);
        pendingPromiseRef.current = promise;
        
        const data = await promise;
        
        // Only update state if component is still mounted and this is the latest promise
        if (mountedRef.current && pendingPromiseRef.current === promise) {
          setState({ data, loading: false, error: null });
          return data;
        }
      } catch (error) {
        // Only update state if component is still mounted
        if (mountedRef.current) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          setState((prev) => ({ ...prev, loading: false, error: errorObj }));
        }
        throw error;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
    pendingPromiseRef.current = null;
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && asyncFunction) {
      execute();
    }
  }, [immediate, execute, asyncFunction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    setData,
    setError,
  };
};

/**
 * Hook for managing async operations with automatic retry
 */
export const useAsyncWithRetry = <T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): UseAsyncReturn<T> & { retry: () => Promise<void> } => {
  const [retryCount, setRetryCount] = useState(0);
  const lastArgsRef = useRef<any[]>([]);

  const wrappedAsyncFunction = useCallback(
    async (...args: any[]): Promise<T> => {
      lastArgsRef.current = args;
      let lastError: Error;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await asyncFunction(...args);
          setRetryCount(0); // Reset retry count on success
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < maxRetries) {
            setRetryCount(attempt + 1);
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          }
        }
      }

      throw lastError!;
    },
    [asyncFunction, maxRetries, retryDelay]
  );

  const asyncHook = useAsync(wrappedAsyncFunction);

  const retry = useCallback(async () => {
    await asyncHook.execute(...lastArgsRef.current);
  }, [asyncHook]);

  return {
    ...asyncHook,
    retry,
  };
};

/**
 * Hook for managing multiple async operations
 */
export const useAsyncQueue = <T = any>() => {
  const [queue, setQueue] = useState<Array<{
    id: string;
    promise: Promise<T>;
    status: 'pending' | 'fulfilled' | 'rejected';
    result?: T;
    error?: Error;
  }>>([]);

  const addToQueue = useCallback(
    (id: string, asyncFunction: () => Promise<T>) => {
      const promise = asyncFunction();
      
      setQueue(prev => [
        ...prev,
        { id, promise, status: 'pending' }
      ]);

      promise
        .then(result => {
          setQueue(prev => 
            prev.map(item => 
              item.id === id 
                ? { ...item, status: 'fulfilled' as const, result }
                : item
            )
          );
        })
        .catch(error => {
          setQueue(prev => 
            prev.map(item => 
              item.id === id 
                ? { ...item, status: 'rejected' as const, error }
                : item
            )
          );
        });

      return promise;
    },
    []
  );

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const pendingCount = queue.filter(item => item.status === 'pending').length;
  const completedCount = queue.filter(item => item.status === 'fulfilled').length;
  const errorCount = queue.filter(item => item.status === 'rejected').length;

  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    pendingCount,
    completedCount,
    errorCount,
    isProcessing: pendingCount > 0,
  };
};