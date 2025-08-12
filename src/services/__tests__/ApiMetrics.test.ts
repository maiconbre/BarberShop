import { describe, it, expect, beforeEach } from 'vitest';
import { ApiMetrics } from '../core/ApiMetrics';

describe('ApiMetrics', () => {
  let metrics: ApiMetrics;

  beforeEach(() => {
    metrics = new ApiMetrics();
  });

  describe('Request Recording', () => {
    it('should record requests correctly', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordRequest('/api/users', 'POST');
      metrics.recordRequest('/api/services', 'GET');

      const globalMetrics = metrics.getMetrics();
      expect(globalMetrics.totalRequests).toBe(3);
    });

    it('should track requests per endpoint', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordRequest('/api/services', 'GET');

      const usersMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      const servicesMetrics = metrics.getEndpointMetrics('/api/services', 'GET');

      expect(usersMetrics?.totalRequests).toBe(2);
      expect(servicesMetrics?.totalRequests).toBe(1);
    });
  });

  describe('Response Recording', () => {
    it('should record successful responses', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordResponse('/api/users', 'GET', 150, 200);

      const globalMetrics = metrics.getMetrics();
      expect(globalMetrics.successfulRequests).toBe(1);
      expect(globalMetrics.failedRequests).toBe(0);
      expect(globalMetrics.averageResponseTime).toBe(150);
    });

    it('should record failed responses', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordResponse('/api/users', 'GET', 200, 500);

      const globalMetrics = metrics.getMetrics();
      expect(globalMetrics.successfulRequests).toBe(0);
      expect(globalMetrics.failedRequests).toBe(1);
    });

    it('should calculate average response time correctly', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordRequest('/api/users', 'GET');
      
      metrics.recordResponse('/api/users', 'GET', 100, 200);
      metrics.recordResponse('/api/users', 'GET', 200, 200);

      const globalMetrics = metrics.getMetrics();
      expect(globalMetrics.averageResponseTime).toBe(150);
    });

    it('should track status codes per endpoint', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordRequest('/api/users', 'GET');

      metrics.recordResponse('/api/users', 'GET', 100, 200);
      metrics.recordResponse('/api/users', 'GET', 150, 201);
      metrics.recordResponse('/api/users', 'GET', 200, 404);

      const endpointMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      
      expect(endpointMetrics?.statusCodes[200]).toBe(2); // 200 and 201 both map to 200
      expect(endpointMetrics?.statusCodes[400]).toBe(1); // 404 maps to 400
    });
  });

  describe('Error Recording', () => {
    it('should record errors', () => {
      const error = new Error('Test error');
      
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordError('/api/users', 'GET', error);

      const globalMetrics = metrics.getMetrics();
      expect(globalMetrics.failedRequests).toBe(1);

      const endpointMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      expect(endpointMetrics?.recentErrors).toHaveLength(1);
      expect(endpointMetrics?.recentErrors[0].error).toBe('Error: Test error');
    });

    it('should limit error history to prevent memory leaks', () => {
      metrics.recordRequest('/api/users', 'GET');

      // Record 150 errors (more than the 100 limit)
      for (let i = 0; i < 150; i++) {
        metrics.recordError('/api/users', 'GET', new Error(`Error ${i}`));
      }

      const endpointMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      
      // Should only keep the last 50 errors after cleanup
      expect(endpointMetrics?.recentErrors.length).toBeLessThanOrEqual(50);
    });

    it('should handle different error types', () => {
      metrics.recordRequest('/api/users', 'GET');
      
      metrics.recordError('/api/users', 'GET', new Error('Error object'));
      metrics.recordError('/api/users', 'GET', 'String error');
      metrics.recordError('/api/users', 'GET', { message: 'Object error' });

      const endpointMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      expect(endpointMetrics?.recentErrors).toHaveLength(3);
    });
  });

  describe('Cache Hit Recording', () => {
    it('should record cache hits', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordCacheHit('/api/users', 'GET');

      const globalMetrics = metrics.getMetrics();
      expect(globalMetrics.cacheHitRate).toBe(100);

      const endpointMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      expect(endpointMetrics?.cacheHitRate).toBe(100);
    });

    it('should calculate cache hit rate correctly', () => {
      // 2 requests, 1 cache hit = 50% hit rate
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordCacheHit('/api/users', 'GET');

      const globalMetrics = metrics.getMetrics();
      expect(globalMetrics.cacheHitRate).toBe(50);
    });
  });

  describe('Endpoint Metrics', () => {
    it('should return null for non-existent endpoint', () => {
      const endpointMetrics = metrics.getEndpointMetrics('/api/nonexistent', 'GET');
      expect(endpointMetrics).toBeNull();
    });

    it('should return detailed endpoint metrics', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordResponse('/api/users', 'GET', 150, 200);
      metrics.recordCacheHit('/api/users', 'GET');

      const endpointMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      
      expect(endpointMetrics).toEqual({
        endpoint: '/api/users',
        method: 'GET',
        totalRequests: 1,
        successfulRequests: 1,
        failedRequests: 0,
        averageResponseTime: 150,
        cacheHitRate: 100,
        statusCodes: { 200: 1 },
        recentErrors: [],
      });
    });

    it('should return all endpoint metrics', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordRequest('/api/services', 'POST');
      
      metrics.recordResponse('/api/users', 'GET', 100, 200);
      metrics.recordResponse('/api/services', 'POST', 200, 201);

      const allMetrics = metrics.getAllEndpointMetrics();
      
      expect(allMetrics).toHaveLength(2);
      expect(allMetrics.some(m => m.endpoint === '/api/users' && m.method === 'GET')).toBe(true);
      expect(allMetrics.some(m => m.endpoint === '/api/services' && m.method === 'POST')).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      metrics.recordRequest('/api/users', 'GET');
      metrics.recordResponse('/api/users', 'GET', 150, 200);
      metrics.recordError('/api/users', 'GET', new Error('Test'));

      let globalMetrics = metrics.getMetrics();
      expect(globalMetrics.totalRequests).toBe(1);

      metrics.reset();

      globalMetrics = metrics.getMetrics();
      expect(globalMetrics.totalRequests).toBe(0);
      expect(globalMetrics.successfulRequests).toBe(0);
      expect(globalMetrics.failedRequests).toBe(0);
      expect(globalMetrics.averageResponseTime).toBe(0);
      expect(globalMetrics.cacheHitRate).toBe(0);

      const endpointMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      expect(endpointMetrics).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero requests gracefully', () => {
      const globalMetrics = metrics.getMetrics();
      
      expect(globalMetrics.totalRequests).toBe(0);
      expect(globalMetrics.averageResponseTime).toBe(0);
      expect(globalMetrics.cacheHitRate).toBe(0);
    });

    it('should handle division by zero in averages', () => {
      // Record response without recording request first
      metrics.recordResponse('/api/users', 'GET', 150, 200);

      const endpointMetrics = metrics.getEndpointMetrics('/api/users', 'GET');
      expect(endpointMetrics?.averageResponseTime).toBe(0);
      expect(endpointMetrics?.cacheHitRate).toBe(0);
    });
  });
});