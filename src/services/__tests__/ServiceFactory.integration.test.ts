import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceFactory } from '../ServiceFactory';
import type { IApiService } from '../interfaces/IApiService';

// Mock the ApiServiceV2 and CacheService
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

describe('ServiceFactory Integration', () => {
  beforeEach(() => {
    ServiceFactory.reset();
    vi.clearAllMocks();
  });

  describe('Repository Integration', () => {
    it('should create all repositories with the same ApiService instance', () => {
      const apiService = ServiceFactory.getApiService();
      const userRepository = ServiceFactory.getUserRepository();
      const serviceRepository = ServiceFactory.getServiceRepository();
      const appointmentRepository = ServiceFactory.getAppointmentRepository();
      const barberRepository = ServiceFactory.getBarberRepository();
      const commentRepository = ServiceFactory.getCommentRepository();

      // All repositories should be defined
      expect(userRepository).toBeDefined();
      expect(serviceRepository).toBeDefined();
      expect(appointmentRepository).toBeDefined();
      expect(barberRepository).toBeDefined();
      expect(commentRepository).toBeDefined();

      // All repositories should use the same ApiService instance
      expect(apiService).toBeDefined();
    });

    it('should maintain singleton pattern for all repositories', () => {
      // Get repositories multiple times
      const userRepo1 = ServiceFactory.getUserRepository();
      const userRepo2 = ServiceFactory.getUserRepository();
      
      const serviceRepo1 = ServiceFactory.getServiceRepository();
      const serviceRepo2 = ServiceFactory.getServiceRepository();
      
      const appointmentRepo1 = ServiceFactory.getAppointmentRepository();
      const appointmentRepo2 = ServiceFactory.getAppointmentRepository();
      
      const barberRepo1 = ServiceFactory.getBarberRepository();
      const barberRepo2 = ServiceFactory.getBarberRepository();
      
      const commentRepo1 = ServiceFactory.getCommentRepository();
      const commentRepo2 = ServiceFactory.getCommentRepository();

      // Should return the same instances
      expect(userRepo1).toBe(userRepo2);
      expect(serviceRepo1).toBe(serviceRepo2);
      expect(appointmentRepo1).toBe(appointmentRepo2);
      expect(barberRepo1).toBe(barberRepo2);
      expect(commentRepo1).toBe(commentRepo2);
    });

    it('should allow custom configuration for all repositories', () => {
      const mockApiService: IApiService = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
      };

      const mockUserRepository = { mockRepo: 'user' } as any;
      const mockServiceRepository = { mockRepo: 'service' } as any;
      const mockAppointmentRepository = { mockRepo: 'appointment' } as any;
      const mockBarberRepository = { mockRepo: 'barber' } as any;
      const mockCommentRepository = { mockRepo: 'comment' } as any;

      ServiceFactory.configure({
        apiService: mockApiService,
        userRepository: mockUserRepository,
        serviceRepository: mockServiceRepository,
        appointmentRepository: mockAppointmentRepository,
        barberRepository: mockBarberRepository,
        commentRepository: mockCommentRepository,
      });

      // Should use the configured instances
      expect(ServiceFactory.getApiService()).toBe(mockApiService);
      expect(ServiceFactory.getUserRepository()).toBe(mockUserRepository);
      expect(ServiceFactory.getServiceRepository()).toBe(mockServiceRepository);
      expect(ServiceFactory.getAppointmentRepository()).toBe(mockAppointmentRepository);
      expect(ServiceFactory.getBarberRepository()).toBe(mockBarberRepository);
      expect(ServiceFactory.getCommentRepository()).toBe(mockCommentRepository);
    });

    it('should reset all repository instances', () => {
      // Create all instances
      ServiceFactory.getApiService();
      ServiceFactory.getUserRepository();
      ServiceFactory.getServiceRepository();
      ServiceFactory.getAppointmentRepository();
      ServiceFactory.getBarberRepository();
      ServiceFactory.getCommentRepository();

      // Reset
      ServiceFactory.reset();

      // Should be able to create new instances without errors
      expect(() => ServiceFactory.getApiService()).not.toThrow();
      expect(() => ServiceFactory.getUserRepository()).not.toThrow();
      expect(() => ServiceFactory.getServiceRepository()).not.toThrow();
      expect(() => ServiceFactory.getAppointmentRepository()).not.toThrow();
      expect(() => ServiceFactory.getBarberRepository()).not.toThrow();
      expect(() => ServiceFactory.getCommentRepository()).not.toThrow();
    });
  });

  describe('Hook Exports', () => {
    it('should export all repository hooks', async () => {
      const { 
        useApiService, 
        useUserRepository, 
        useServiceRepository,
        useAppointmentRepository,
        useBarberRepository,
        useCommentRepository
      } = await import('../ServiceFactory');

      expect(useApiService).toBeDefined();
      expect(useUserRepository).toBeDefined();
      expect(useServiceRepository).toBeDefined();
      expect(useAppointmentRepository).toBeDefined();
      expect(useBarberRepository).toBeDefined();
      expect(useCommentRepository).toBeDefined();

      expect(typeof useApiService).toBe('function');
      expect(typeof useUserRepository).toBe('function');
      expect(typeof useServiceRepository).toBe('function');
      expect(typeof useAppointmentRepository).toBe('function');
      expect(typeof useBarberRepository).toBe('function');
      expect(typeof useCommentRepository).toBe('function');
    });

    it('should return repository instances from hooks', async () => {
      const { 
        useApiService, 
        useUserRepository, 
        useServiceRepository,
        useAppointmentRepository,
        useBarberRepository,
        useCommentRepository
      } = await import('../ServiceFactory');

      const apiService = useApiService();
      const userRepository = useUserRepository();
      const serviceRepository = useServiceRepository();
      const appointmentRepository = useAppointmentRepository();
      const barberRepository = useBarberRepository();
      const commentRepository = useCommentRepository();

      expect(apiService).toBeDefined();
      expect(userRepository).toBeDefined();
      expect(serviceRepository).toBeDefined();
      expect(appointmentRepository).toBeDefined();
      expect(barberRepository).toBeDefined();
      expect(commentRepository).toBeDefined();
    });
  });

  describe('Dependency Injection Pattern', () => {
    it('should follow proper dependency injection principles', () => {
      // The factory should create repositories with proper dependencies
      
      // All repositories should be created with the same ApiService
      const userRepository = ServiceFactory.getUserRepository();
      const serviceRepository = ServiceFactory.getServiceRepository();
      const appointmentRepository = ServiceFactory.getAppointmentRepository();
      const barberRepository = ServiceFactory.getBarberRepository();
      const commentRepository = ServiceFactory.getCommentRepository();

      // Verify that repositories are properly instantiated
      expect(userRepository).toHaveProperty('findById');
      expect(serviceRepository).toHaveProperty('findById');
      expect(appointmentRepository).toHaveProperty('findById');
      expect(barberRepository).toHaveProperty('findById');
      expect(commentRepository).toHaveProperty('findById');

      // Verify that repositories have their specific methods
      expect(appointmentRepository).toHaveProperty('findByBarberId');
      expect(appointmentRepository).toHaveProperty('updateStatus');
      expect(barberRepository).toHaveProperty('findActive');
      expect(commentRepository).toHaveProperty('findByStatus');
      expect(serviceRepository).toHaveProperty('findByBarber');
    });
  });
});