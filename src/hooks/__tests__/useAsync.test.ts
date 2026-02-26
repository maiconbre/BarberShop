import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsync, useAsyncWithRetry, useAsyncQueue } from '../useAsync';

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAsync());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should execute async function successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      const asyncFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it('should handle async function errors', async () => {
      const error = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });

    it('should set loading state during execution', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      const asyncFn = vi.fn().mockReturnValue(promise);

      const { result } = renderHook(() => useAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      await act(async () => {
        resolvePromise!('test data');
        await promise;
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe('test data');
    });

    it('should execute immediately when immediate is true', async () => {
      const mockData = 'immediate data';
      const asyncFn = vi.fn().mockResolvedValue(mockData);

      await act(async () => {
        renderHook(() => useAsync(asyncFn, true));
      });

      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to async function', async () => {
      const asyncFn = vi.fn().mockResolvedValue('result');

      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute('arg1', 'arg2', 123);
      });

      expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should reset state correctly', () => {
      const { result } = renderHook(() => useAsync());

      act(() => {
        result.current.setData('test data');
        result.current.setError(new Error('test error'));
      });

      expect(result.current.data).toBe('test data');
      expect(result.current.error).toBeInstanceOf(Error);

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set data manually', () => {
      const { result } = renderHook(() => useAsync());
      const testData = { id: 1, name: 'Manual data' };

      act(() => {
        result.current.setData(testData);
      });

      expect(result.current.data).toEqual(testData);
    });

    it('should set error manually', () => {
      const { result } = renderHook(() => useAsync());
      const testError = new Error('Manual error');

      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.error).toEqual(testError);
      expect(result.current.loading).toBe(false);
    });

    it('should warn when no async function is provided', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const { result } = renderHook(() => useAsync());

      await act(async () => {
        const result_value = await result.current.execute();
        expect(result_value).toBeUndefined();
      });

      expect(consoleSpy).toHaveBeenCalledWith('No async function provided to useAsync');
      
      consoleSpy.mockRestore();
    });
  });

  describe('race condition handling', () => {
    it('should handle race conditions correctly', async () => {
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;
      
      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      const asyncFn = vi.fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => useAsync(asyncFn));

      // Start first execution
      act(() => {
        result.current.execute();
      });

      // Start second execution before first completes
      act(() => {
        result.current.execute();
      });

      // Resolve first promise (should be ignored)
      await act(async () => {
        resolveFirst!('first result');
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Resolve second promise (should be used)
      await act(async () => {
        resolveSecond!('second result');
        await secondPromise;
      });

      expect(result.current.data).toBe('second result');
    });
  });
});

describe('useAsyncWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retry failed operations', async () => {
    const asyncFn = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('Success');

    const { result } = renderHook(() => useAsyncWithRetry(asyncFn, 2, 10)); // Short delay for testing

    await act(async () => {
      await result.current.execute();
    });

    expect(asyncFn).toHaveBeenCalledTimes(3);
    expect(result.current.data).toBe('Success');
    expect(result.current.error).toBeNull();
  });

  it('should fail after max retries', async () => {
    const error = new Error('Persistent failure');
    const asyncFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useAsyncWithRetry(asyncFn, 1, 10)); // Short delay for testing

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // Expected to throw
      }
    });

    expect(asyncFn).toHaveBeenCalledTimes(2); // Initial + 1 retry
    expect(result.current.error).toEqual(error);
  });

  it('should retry with last arguments', async () => {
    const asyncFn = vi.fn()
      .mockRejectedValueOnce(new Error('Failure'))
      .mockResolvedValueOnce('Success');

    const { result } = renderHook(() => useAsyncWithRetry(asyncFn, 0, 10)); // No automatic retries

    await act(async () => {
      try {
        await result.current.execute('arg1', 'arg2');
      } catch {
        // Expected to fail first time
      }
    });

    expect(result.current.error).toBeTruthy();

    await act(async () => {
      await result.current.retry();
    });

    expect(asyncFn).toHaveBeenNthCalledWith(1, 'arg1', 'arg2');
    expect(asyncFn).toHaveBeenNthCalledWith(2, 'arg1', 'arg2');
    expect(result.current.data).toBe('Success');
    expect(result.current.error).toBeNull();
  });
});

describe('useAsyncQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty queue', () => {
    const { result } = renderHook(() => useAsyncQueue());

    expect(result.current.queue).toEqual([]);
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.errorCount).toBe(0);
    expect(result.current.isProcessing).toBe(false);
  });

  it('should add and track async operations', async () => {
    const { result } = renderHook(() => useAsyncQueue<string>());

    const asyncFn1 = vi.fn().mockResolvedValue('result1');
    const asyncFn2 = vi.fn().mockResolvedValue('result2');

    await act(async () => {
      result.current.addToQueue('task1', asyncFn1);
      result.current.addToQueue('task2', asyncFn2);
    });

    expect(result.current.queue).toHaveLength(2);
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.completedCount).toBe(2);
    expect(result.current.errorCount).toBe(0);
  });

  it('should handle failed operations', async () => {
    const { result } = renderHook(() => useAsyncQueue<string>());

    const error = new Error('Task failed');
    const asyncFn = vi.fn().mockRejectedValue(error);

    await act(async () => {
      try {
        await result.current.addToQueue('failedTask', asyncFn);
      } catch {
        // Expected to throw
      }
    });

    expect(result.current.errorCount).toBe(1);
    expect(result.current.queue[0].status).toBe('rejected');
    expect(result.current.queue[0].error).toEqual(error);
  });

  it('should remove items from queue', async () => {
    const { result } = renderHook(() => useAsyncQueue<string>());

    const asyncFn = vi.fn().mockResolvedValue('result');

    await act(async () => {
      result.current.addToQueue('task1', asyncFn);
    });

    expect(result.current.queue).toHaveLength(1);

    act(() => {
      result.current.removeFromQueue('task1');
    });

    expect(result.current.queue).toHaveLength(0);
  });

  it('should clear entire queue', async () => {
    const { result } = renderHook(() => useAsyncQueue<string>());

    const asyncFn = vi.fn().mockResolvedValue('result');

    await act(async () => {
      result.current.addToQueue('task1', asyncFn);
      result.current.addToQueue('task2', asyncFn);
    });

    expect(result.current.queue).toHaveLength(2);

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.queue).toHaveLength(0);
  });
});