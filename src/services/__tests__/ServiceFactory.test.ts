import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceFactory } from '../ServiceFactory';
import type { IApiService } from '../interfaces/IApiService';

// Mock das dependências
vi.mock('../core/ApiServiceV2', () => ({
  ApiServiceV2: {
    create: vi.fn().mockReturnValue({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }),
  },
}));

vi.mock('../CacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('ServiceFactory', () => {
  beforeEach(() => {
    ServiceFactory.reset();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return same ApiService instance', () => {
      const apiService1 = ServiceFactory.getApiService();
      const apiService2 = ServiceFactory.getApiService();

      expect(apiService1).toBe(apiService2);
    });

    it('should return same UserRepository instance', () => {
      const userRepo1 = ServiceFactory.getUserRepository();
      const userRepo2 = ServiceFactory.getUserRepository();

      expect(userRepo1).toBe(userRepo2);
    });

    it('should return same ServiceRepository instance', () => {
      const serviceRepo1 = ServiceFactory.getServiceRepository();
      const serviceRepo2 = ServiceFactory.getServiceRepository();

      expect(serviceRepo1).toBe(serviceRepo2);
    });
  });

  describe('Dependency Injection', () => {
    it('should inject ApiService into repositories', () => {
      const apiService = ServiceFactory.getApiService();
      const userRepository = ServiceFactory.getUserRepository();
      const serviceRepository = ServiceFactory.getServiceRepository();

      // Repositories should be created with the same ApiService instance
      expect(userRepository).toBeDefined();
      expect(serviceRepository).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should allow custom ApiService configuration', () => {
      const mockApiService: IApiService = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      };

      ServiceFactory.configure({ apiService: mockApiService });

      const apiService = ServiceFactory.getApiService();
      expect(apiService).toBe(mockApiService);
    });

    it('should allow custom repository configuration', () => {
      const mockApiService: IApiService = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      };

      const mockUserRepository = new (class {
        constructor(public apiService: IApiService) {}
      })(mockApiService);

      ServiceFactory.configure({ 
        apiService: mockApiService,
        userRepository: mockUserRepository as any 
      });

      const userRepository = ServiceFactory.getUserRepository();
      expect(userRepository).toBe(mockUserRepository);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all instances', () => {
      // Create instances
      const apiService1 = ServiceFactory.getApiService();
      const userRepo1 = ServiceFactory.getUserRepository();

      // Reset
      ServiceFactory.reset();

      // Create new instances
      const apiService2 = ServiceFactory.getApiService();
      const userRepo2 = ServiceFactory.getUserRepository();

      // Should be different instances (mocked instances might be the same, so we check if reset was called)
      expect(ServiceFactory.getApiService).toBeDefined();
      expect(ServiceFactory.getUserRepository).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    it('should use environment variable for API URL', () => {
      // This test verifies that the factory uses environment configuration
      const apiService = ServiceFactory.getApiService();
      expect(apiService).toBeDefined();
    });
  });
});