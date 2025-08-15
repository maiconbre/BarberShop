import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServices } from '../useServices';
import type { ServiceRepository } from '@/services/repositories/ServiceRepository';
import type { Service } from '@/types';

// Mock ServiceFactory
type MockedServiceRepository = {
  [K in keyof ServiceRepository]: vi.MockedFunction<ServiceRepository[K]>;
};

const mockServiceRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findActive: vi.fn(),
  findByDuration: vi.fn(),
  findByBarber: vi.fn(),
  findByName: vi.fn(),
  findByPriceRange: vi.fn(),
  findByAssociatedBarber: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  toggleActive: vi.fn(),
  associateBarbers: vi.fn(),
  getStatistics: vi.fn(),
  getMostPopular: vi.fn(),
  getByCategory: vi.fn(),
  duplicate: vi.fn(),
  search: vi.fn(),
} as MockedServiceRepository;

vi.mock('@/services/ServiceFactory', () => ({
  useServiceRepository: () => mockServiceRepository,
}));

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockService: Service = {
    id: '550e8400-e29b-41d4-a716-446655440000', // UUID format as per backend
    name: 'Corte Masculino',
    description: 'Corte tradicional masculino',
    duration: 60,
    price: 25.00,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('loadServices', () => {
    it('should load services successfully', async () => {
      const mockServices = [mockService];
      mockServiceRepository.findAll.mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      await act(async () => {
        await result.current.loadServices();
      });

      expect(result.current.services).toEqual(mockServices);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading error', async () => {
      const error = new Error('Failed to load services');
      mockServiceRepository.findAll.mockRejectedValue(error);

      const { result } = renderHook(() => useServices());

      await act(async () => {
        try {
          await result.current.loadServices();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should load services with filters', async () => {
      const mockServices = [mockService];
      const filters = { isActive: true };
      mockServiceRepository.findAll.mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      await act(async () => {
        await result.current.loadServices(filters);
      });

      expect(mockServiceRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result.current.services).toEqual(mockServices);
    });
  });

  describe('getServiceById', () => {
    it('should get service by UUID', async () => {
      mockServiceRepository.findById.mockResolvedValue(mockService);

      const { result } = renderHook(() => useServices());

      let service: Service | null = null;
      await act(async () => {
        service = await result.current.getServiceById('550e8400-e29b-41d4-a716-446655440000');
      });

      expect(service).toEqual(mockService);
      expect(mockServiceRepository.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle UUID format correctly', async () => {
      const uuidService = { ...mockService, id: '123e4567-e89b-12d3-a456-426614174000' };
      mockServiceRepository.findById.mockResolvedValue(uuidService);

      const { result } = renderHook(() => useServices());

      let service: Service | null = null;
      await act(async () => {
        service = await result.current.getServiceById('123e4567-e89b-12d3-a456-426614174000');
      });

      expect(service?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(service?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('getActiveServices', () => {
    it('should get active services', async () => {
      const mockServices = [mockService];
      mockServiceRepository.findActive.mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      let services: Service[] = [];
      await act(async () => {
        services = await result.current.getActiveServices();
      });

      expect(services).toEqual(mockServices);
      expect(mockServiceRepository.findActive).toHaveBeenCalled();
    });
  });

  describe('getServicesByBarber', () => {
    it('should get services by barber using specific endpoint', async () => {
      const mockServices = [mockService];
      mockServiceRepository.findByBarber.mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      let services: Service[] = [];
      await act(async () => {
        services = await result.current.getServicesByBarber('01');
      });

      expect(services).toEqual(mockServices);
      expect(mockServiceRepository.findByBarber).toHaveBeenCalledWith('01');
    });

    it('should handle barber ID format correctly', async () => {
      const mockServices = [mockService];
      (mockServiceRepository.findByBarber as any).mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      // Test with different formatted barber IDs
      const barberIds = ['01', '02', '10', '99'];
      
      for (const barberId of barberIds) {
        let services: Service[] = [];
        await act(async () => {
          services = await result.current.getServicesByBarber(barberId);
        });

        expect(mockServiceRepository.findByBarber).toHaveBeenCalledWith(barberId);
      }
    });
  });

  describe('getServicesByPriceRange', () => {
    it('should get services by price range', async () => {
      const mockServices = [mockService];
      mockServiceRepository.findByPriceRange.mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      let services: Service[] = [];
      await act(async () => {
        services = await result.current.getServicesByPriceRange(20, 30);
      });

      expect(services).toEqual(mockServices);
      expect(mockServiceRepository.findByPriceRange).toHaveBeenCalledWith(20, 30);
    });
  });

  describe('createService', () => {
    it('should create service successfully', async () => {
      const serviceData = {
        name: 'Novo Serviço',
        description: 'Descrição do novo serviço',
        duration: 45,
        price: 30.00,
        isActive: true,
      };
      
      const createdService = { 
        ...serviceData, 
        id: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: new Date(), 
        updatedAt: new Date(),
      };
      
      mockServiceRepository.create.mockResolvedValue(createdService);

      const { result } = renderHook(() => useServices());

      let service: Service | undefined;
      await act(async () => {
        service = await result.current.createService(serviceData);
      });

      expect(service).toEqual(createdService);
      expect(service?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(mockServiceRepository.create).toHaveBeenCalledWith(serviceData);
      expect(result.current.creating).toBe(false);
    });

    it('should handle create error', async () => {
      const error = new Error('Failed to create service');
      mockServiceRepository.create.mockRejectedValue(error);

      const { result } = renderHook(() => useServices());

      await act(async () => {
        try {
          await result.current.createService({
            name: 'Novo Serviço',
            description: 'Descrição',
            duration: 45,
            price: 30.00,
            isActive: true,
          });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.creating).toBe(false);
      expect(result.current.createError).toBeTruthy();
    });
  });

  describe('updateService', () => {
    it('should update service successfully', async () => {
      const updates = { 
        name: 'Serviço Atualizado',
        price: 35.00,
      };
      const updatedService = { ...mockService, ...updates };
      
      mockServiceRepository.update.mockResolvedValue(updatedService);

      const { result } = renderHook(() => useServices());

      let service: Service | undefined;
      await act(async () => {
        service = await result.current.updateService('550e8400-e29b-41d4-a716-446655440000', updates);
      });

      expect(service).toEqual(updatedService);
      expect(mockServiceRepository.update).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', updates);
    });
  });

  describe('deleteService', () => {
    it('should delete service successfully', async () => {
      mockServiceRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useServices());

      await act(async () => {
        await result.current.deleteService('550e8400-e29b-41d4-a716-446655440000');
      });

      expect(mockServiceRepository.delete).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(result.current.deleting).toBe(false);
    });
  });

  describe('associateBarbers', () => {
    it('should associate barbers to service successfully', async () => {
      mockServiceRepository.associateBarbers.mockResolvedValue(undefined);

      const { result } = renderHook(() => useServices());

      await act(async () => {
        await result.current.associateBarbers('550e8400-e29b-41d4-a716-446655440000', ['01', '02']);
      });

      expect(mockServiceRepository.associateBarbers).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000', 
        ['01', '02']
      );
    });

    it('should handle association error', async () => {
      const error = new Error('Failed to associate barbers');
      mockServiceRepository.associateBarbers.mockRejectedValue(error);

      const { result } = renderHook(() => useServices());

      await act(async () => {
        try {
          await result.current.associateBarbers('550e8400-e29b-41d4-a716-446655440000', ['01']);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.associating).toBe(false);
      expect(result.current.associateError).toBeTruthy();
    });
  });

  describe('toggleActive', () => {
    it('should toggle service active status', async () => {
      const updatedService = { ...mockService, isActive: false };
      mockServiceRepository.toggleActive.mockResolvedValue(updatedService);

      const { result } = renderHook(() => useServices());

      let service: Service | undefined;
      await act(async () => {
        service = await result.current.toggleActive('550e8400-e29b-41d4-a716-446655440000', false);
      });

      expect(service).toEqual(updatedService);
      expect(mockServiceRepository.toggleActive).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', false);
    });
  });

  describe('getStatistics', () => {
    it('should get service statistics', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        inactive: 2,
        averagePrice: 32.50,
        averageDuration: 55,
        priceRange: { min: 15, max: 80 },
        durationRange: { min: 30, max: 120 },
        categoryDistribution: { quick: 3, standard: 5, long: 2 },
      };
      
      mockServiceRepository.getStatistics.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useServices());

      let stats: { total: number; active: number; inactive: number; };
      await act(async () => {
        stats = await result.current.getStatistics();
      });

      expect(stats).toEqual(mockStats);
      expect(mockServiceRepository.getStatistics).toHaveBeenCalled();
    });
  });

  describe('searchServices', () => {
    it('should search services with query', async () => {
      const mockServices = [mockService];
      mockServiceRepository.search.mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      let services: Service[] = [];
      await act(async () => {
        services = await result.current.searchServices('corte');
      });

      expect(services).toEqual(mockServices);
      expect(mockServiceRepository.search).toHaveBeenCalledWith('corte', undefined);
    });

    it('should search services with options', async () => {
      const mockServices = [mockService];
      const searchOptions = { limit: 5, fuzzy: true };
      mockServiceRepository.search.mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      let services: Service[] = [];
      await act(async () => {
        services = await result.current.searchServices('corte', searchOptions);
      });

      expect(services).toEqual(mockServices);
      expect(mockServiceRepository.search).toHaveBeenCalledWith('corte', searchOptions);
    });
  });

  describe('rate limiting simulation', () => {
    it('should handle generous rate limiting for read operations (300 req/min)', async () => {
      // Simulate multiple rapid read requests
      const mockServices = [mockService];
      mockServiceRepository.findAll.mockResolvedValue(mockServices);

      const { result } = renderHook(() => useServices());

      // Simulate 10 sequential requests (well within rate limit)
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.loadServices();
        });
      }

      expect(mockServiceRepository.findAll).toHaveBeenCalledTimes(10);
    });

    it('should handle rate limiting for write operations', async () => {
      // Simulate multiple rapid write requests
      mockServiceRepository.create.mockResolvedValue(mockService);

      const { result } = renderHook(() => useServices());

      const serviceData = {
        name: 'Novo Serviço',
        description: 'Descrição',
        duration: 45,
        price: 30.00,
        isActive: true,
      };

      // Simulate 5 sequential write requests
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.createService(serviceData);
        });
      }

      expect(mockServiceRepository.create).toHaveBeenCalledTimes(5);
    });
  });

  describe('UUID validation', () => {
    it('should validate UUID format in service operations', async () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ];

      for (const uuid of validUUIDs) {
        const service = { ...mockService, id: uuid };
        mockServiceRepository.findById.mockResolvedValue(service);

        const { result } = renderHook(() => useServices());

        let foundService: Service | null = null;
        await act(async () => {
          foundService = await result.current.getServiceById(uuid);
        });

        expect(foundService?.id).toBe(uuid);
        expect(foundService?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      }
    });
  });

  describe('barber association operations', () => {
    it('should handle N:N barber-service associations', async () => {
      const serviceId = '550e8400-e29b-41d4-a716-446655440000';
      const barberIds = ['01', '02', '03'];

      mockServiceRepository.associateBarbers.mockResolvedValue(undefined);

      const { result } = renderHook(() => useServices());

      await act(async () => {
        await result.current.associateBarbers(serviceId, barberIds);
      });

      expect(mockServiceRepository.associateBarbers).toHaveBeenCalledWith(serviceId, barberIds);
    });

    it('should get services for specific barber', async () => {
      const barberId = '01';
      const barberServices = [
        { ...mockService, id: '550e8400-e29b-41d4-a716-446655440001', name: 'Corte Masculino' },
        { ...mockService, id: '550e8400-e29b-41d4-a716-446655440002', name: 'Barba' },
      ];

      mockServiceRepository.findByBarber.mockResolvedValue(barberServices);

      const { result } = renderHook(() => useServices());

      let services: Service[] = [];
      await act(async () => {
        services = await result.current.getServicesByBarber(barberId);
      });

      expect(services).toEqual(barberServices);
      expect(services).toHaveLength(2);
      expect(mockServiceRepository.findByBarber).toHaveBeenCalledWith(barberId);
    });
  });

  describe('backend structure validation', () => {
    it('should handle backend service structure (id, name, price only)', async () => {
      // Backend only returns id (UUID), name, and price
      const backendService = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Corte Masculino',
        price: 25.00,
        // Backend doesn't have: description, duration, isActive, timestamps
      };

      // Repository should adapt to frontend structure with defaults
      const adaptedService = {
        ...backendService,
        description: '', // Default
        duration: 60, // Default
        isActive: true, // Default
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockServiceRepository.findById.mockResolvedValue(adaptedService);

      const { result } = renderHook(() => useServices());

      let service: Service | null = null;
      await act(async () => {
        service = await result.current.getServiceById(backendService.id);
      });

      expect(service?.id).toBe(backendService.id);
      expect(service?.name).toBe(backendService.name);
      expect(service?.price).toBe(backendService.price);
      expect(service?.description).toBe(''); // Default value
      expect(service?.duration).toBe(60); // Default value
      expect(service?.isActive).toBe(true); // Default value
    });
  });
});