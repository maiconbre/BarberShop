import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HttpClient, HttpError } from '../core/HttpClient';
import type { IRequestInterceptor, IResponseInterceptor } from '../interfaces/IHttpClient';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient('https://api.example.com', 5000);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic HTTP Operations', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.request({
        url: '/users/1',
        method: 'GET',
      });

      expect(result.data).toEqual({ id: 1, name: 'Test' });
      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
          mode: 'cors',
        })
      );
    });

    it('should make POST request with body', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ id: 2, name: 'New User' }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const requestData = { name: 'New User', email: 'user@example.com' };
      const result = await httpClient.request({
        url: '/users',
        method: 'POST',
        body: requestData,
      });

      expect(result.data).toEqual({ id: 2, name: 'New User' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        httpClient.request({
          url: '/users/999',
          method: 'GET',
        })
      ).rejects.toThrow(HttpError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network error'));

      await expect(
        httpClient.request({
          url: '/users',
          method: 'GET',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('URL Building', () => {
    it('should build URL correctly with base URL', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({}),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.request({
        url: '/users',
        method: 'GET',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('should handle absolute URLs', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({}),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.request({
        url: 'https://other-api.com/data',
        method: 'GET',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://other-api.com/data',
        expect.any(Object)
      );
    });
  });

  describe('Request Interceptors', () => {
    it('should apply request interceptors', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({}),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const interceptor: IRequestInterceptor = {
        onRequest: vi.fn().mockImplementation((config) => ({
          ...config,
          headers: {
            ...config.headers,
            'X-Custom-Header': 'test-value',
          },
        })),
        onRequestError: vi.fn(),
      };

      httpClient.addRequestInterceptor(interceptor);

      await httpClient.request({
        url: '/users',
        method: 'GET',
      });

      expect(interceptor.onRequest).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'test-value',
          }),
        })
      );
    });

    it('should handle request interceptor errors', async () => {
      const interceptor: IRequestInterceptor = {
        onRequest: vi.fn().mockRejectedValue(new Error('Interceptor error')),
        onRequestError: vi.fn().mockImplementation(async (error) => {
          throw error;
        }),
      };

      httpClient.addRequestInterceptor(interceptor);

      await expect(
        httpClient.request({
          url: '/users',
          method: 'GET',
        })
      ).rejects.toThrow('Interceptor error');

      expect(interceptor.onRequestError).toHaveBeenCalled();
    });
  });

  describe('Response Interceptors', () => {
    it('should apply response interceptors', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ id: 1 }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const interceptor: IResponseInterceptor = {
        onResponse: vi.fn().mockImplementation((response) => ({
          ...response,
          data: { ...response.data, intercepted: true },
        })),
        onResponseError: vi.fn(),
      };

      httpClient.addResponseInterceptor(interceptor);

      const result = await httpClient.request({
        url: '/users/1',
        method: 'GET',
      });

      expect(interceptor.onResponse).toHaveBeenCalled();
      expect(result.data).toEqual({ id: 1, intercepted: true });
    });

    it('should handle response interceptor errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const interceptor: IResponseInterceptor = {
        onResponse: vi.fn(),
        onResponseError: vi.fn().mockImplementation(async () => {
          throw new Error('Custom error handling');
        }),
      };

      httpClient.addResponseInterceptor(interceptor);

      await expect(
        httpClient.request({
          url: '/users',
          method: 'GET',
        })
      ).rejects.toThrow('Custom error handling');

      expect(interceptor.onResponseError).toHaveBeenCalled();
    });
  });

  describe('Timeout Handling', () => {
    it('should handle request timeout', async () => {
      // Mock AbortController for timeout simulation
      const mockAbortController = {
        signal: { aborted: false },
        abort: vi.fn(),
      };
      
      global.AbortController = vi.fn(() => mockAbortController) as unknown as typeof AbortController;
      
      // Mock fetch to simulate timeout
      mockFetch.mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 10);
        });
      });

      const shortTimeoutClient = new HttpClient('https://api.example.com', 100);

      await expect(
        shortTimeoutClient.request({
          url: '/users',
          method: 'GET',
          timeout: 50,
        })
      ).rejects.toThrow();
    });
  });

  describe('Content Type Handling', () => {
    it('should handle text responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'text/plain']]),
        text: vi.fn().mockResolvedValue('Plain text response'),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.request({
        url: '/text',
        method: 'GET',
      });

      expect(result.data).toBe('Plain text response');
    });

    it('should handle JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ message: 'JSON response' }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.request({
        url: '/json',
        method: 'GET',
      });

      expect(result.data).toEqual({ message: 'JSON response' });
    });
  });
});