import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorHandler } from '../core/ErrorHandler';

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    apiError: vi.fn(),
  },
}));

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler(3, 1000, 30000);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle generic errors', () => {
      const error = new Error('Test error');
      
      expect(() => errorHandler.handleError(error, 'test-context')).not.toThrow();
    });

    it('should handle network errors', () => {
      const networkError = new TypeError('Failed to fetch');
      
      expect(() => errorHandler.handleError(networkError, 'network-test')).not.toThrow();
    });

    it('should handle HTTP errors', () => {
      const httpError = Object.assign(new Error('HTTP Error'), { status: 500 });
      
      expect(() => errorHandler.handleError(httpError, 'http-test')).not.toThrow();
    });

    it('should handle non-Error objects', () => {
      const stringError = 'String error';
      
      expect(() => errorHandler.handleError(stringError, 'string-test')).not.toThrow();
    });
  });

  describe('Retryable Error Detection', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new TypeError('Failed to fetch');
      
      expect(errorHandler.isRetryableError(networkError)).toBe(true);
    });

    it('should identify 5xx errors as retryable', () => {
      const serverError = Object.assign(new Error('Server Error'), { status: 500 });
      
      expect(errorHandler.isRetryableError(serverError)).toBe(true);
    });

    it('should identify rate limiting as retryable', () => {
      const rateLimitError = Object.assign(new Error('Too Many Requests'), { status: 429 });
      
      expect(errorHandler.isRetryableError(rateLimitError)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'AbortError';
      
      expect(errorHandler.isRetryableError(timeoutError)).toBe(true);
    });

    it('should not identify 4xx client errors as retryable', () => {
      const clientError = Object.assign(new Error('Bad Request'), { status: 400 });
      
      expect(errorHandler.isRetryableError(clientError)).toBe(false);
    });

    it('should not identify authentication errors as retryable', () => {
      const authError = Object.assign(new Error('Unauthorized'), { status: 401 });
      
      expect(errorHandler.isRetryableError(authError)).toBe(false);
    });

    it('should not identify forbidden errors as retryable', () => {
      const forbiddenError = Object.assign(new Error('Forbidden'), { status: 403 });
      
      expect(errorHandler.isRetryableError(forbiddenError)).toBe(false);
    });
  });

  describe('Retry Delay Calculation', () => {
    it('should calculate exponential backoff delay', () => {
      const delay1 = errorHandler.getRetryDelay(1);
      const delay2 = errorHandler.getRetryDelay(2);
      const delay3 = errorHandler.getRetryDelay(3);
      
      expect(delay1).toBeGreaterThanOrEqual(1000); // Base delay
      expect(delay2).toBeGreaterThanOrEqual(2000); // 2x base delay
      expect(delay3).toBeGreaterThanOrEqual(4000); // 4x base delay
      
      // Should include jitter
      expect(delay1).toBeLessThanOrEqual(1100); // Base + 10% jitter
      expect(delay2).toBeLessThanOrEqual(2200); // 2x base + 10% jitter
    });

    it('should respect maximum delay', () => {
      const shortMaxErrorHandler = new ErrorHandler(10, 1000, 5000);
      
      const delay = shortMaxErrorHandler.getRetryDelay(10); // Would be 1024000ms without max
      
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should add jitter to prevent thundering herd', () => {
      const delays = Array.from({ length: 10 }, () => errorHandler.getRetryDelay(1));
      
      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('Error Information Extraction', () => {
    it('should extract network error information', () => {
      const networkError = new TypeError('Failed to fetch');
      
      expect(errorHandler.isRetryableError(networkError)).toBe(true);
    });

    it('should extract timeout error information', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      
      expect(errorHandler.isRetryableError(timeoutError)).toBe(true);
    });

    it('should extract HTTP error information', () => {
      const httpError = Object.assign(new Error('Not Found'), { status: 404 });
      
      expect(errorHandler.isRetryableError(httpError)).toBe(false);
    });
  });

  describe('Custom Configuration', () => {
    it('should use custom retry configuration', () => {
      const customErrorHandler = new ErrorHandler(5, 500, 10000);
      
      const delay1 = customErrorHandler.getRetryDelay(1);
      const delay2 = customErrorHandler.getRetryDelay(2);
      
      expect(delay1).toBeGreaterThanOrEqual(500);
      expect(delay2).toBeGreaterThanOrEqual(1000);
      
      const maxDelay = customErrorHandler.getRetryDelay(20);
      expect(maxDelay).toBeLessThanOrEqual(10000);
    });
  });
});