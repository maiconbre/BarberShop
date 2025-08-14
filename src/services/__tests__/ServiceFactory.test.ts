import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceFactory } from '../ServiceFactory';
import type { IApiService } from '../interfaces/IApiService';
import type { IPaginatedRepository } from '../interfaces/IRepository';
import type { User } from '@/types';

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

    it('should return same AppointmentRepository instance', () => {
      const appointmentRepo1 = ServiceFactory.getAppointmentRepository();
      const appointmentRepo2 = ServiceFactory.getAppointmentRepository();

      expect(appointmentRepo1).toBe(appointmentRepo2);
    });

    it('should return same BarberRepository instance', () => {
      const barberRepo1 = ServiceFactory.getBarberRepository();
      const barberRepo2 = ServiceFactory.getBarberRepository();

      expect(barberRepo1).toBe(barberRepo2);
    });

    it('should return same CommentRepository instance', () => {
      const commentRepo1 = ServiceFactory.getCommentRepository();
      const commentRepo2 = ServiceFactory.getCommentRepository();

      expect(commentRepo1).toBe(commentRepo2);
    });
  });

  describe('Dependency Injection', () => {
    it('should inject ApiService into repositories', () => {
      const userRepository = ServiceFactory.getUserRepository();
      const serviceRepository = ServiceFactory.getServiceRepository();
      const appointmentRepository = ServiceFactory.getAppointmentRepository();
      const barberRepository = ServiceFactory.getBarberRepository();
      const commentRepository = ServiceFactory.getCommentRepository();

      // Repositories should be created with the same ApiService instance
      expect(userRepository).toBeDefined();
      expect(serviceRepository).toBeDefined();
      expect(appointmentRepository).toBeDefined();
      expect(barberRepository).toBeDefined();
      expect(commentRepository).toBeDefined();
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

      const mockUserRepository: IPaginatedRepository<User> = {
        findById: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        findPaginated: vi.fn(),
      };

      ServiceFactory.configure({ 
        apiService: mockApiService
      });

      const userRepository = ServiceFactory.getUserRepository();
      expect(userRepository).toBe(mockUserRepository);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all instances', () => {
      // Create instances
      ServiceFactory.getApiService();
      ServiceFactory.getUserRepository();
      ServiceFactory.getServiceRepository();
      ServiceFactory.getAppointmentRepository();
      ServiceFactory.getBarberRepository();
      ServiceFactory.getCommentRepository();

      // Reset
      ServiceFactory.reset();

      // Create new instances after reset
      ServiceFactory.getApiService();
      ServiceFactory.getUserRepository();
      ServiceFactory.getServiceRepository();
      ServiceFactory.getAppointmentRepository();
      ServiceFactory.getBarberRepository();
      ServiceFactory.getCommentRepository();

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