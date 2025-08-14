import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceRepository } from '../repositories/ServiceRepository';
import type { IApiService } from '../interfaces/IApiService';
import type { Service } from '@/types';
import type { BackendService } from '@/types/backend';

interface MockApiService extends IApiService {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

// Mock ApiService
const mockApiService: MockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
} as MockApiService;

describe('ServiceRepository', () => {
  let serviceRepository: ServiceRepository;

  beforeEach(() => {
    serviceRepository = new ServiceRepository(mockApiService);
    vi.clearAllMocks();
  });

  // Mock data
  const mockBackendService: BackendService = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Corte de Cabelo',
    price: 25.0,
  };

  const mockFrontendService: Service = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Corte de Cabelo',
    description: '',
    duration: 60,
    price: 25.0,
    isActive: true,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };

  describe('findById', () => {
    it('should return service when found', async () => {
      mockApiService.get.mockResolvedValue(mockBackendService);

      const result = await serviceRepository.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockFrontendService);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/services/123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return null when service not found', async () => {
      const notFoundError = Object.assign(new Error('Not Found'), { status: 404 });
      mockApiService.get.mockRejectedValue(notFoundError);

      const result = await serviceRepository.findById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      const serverError = Object.assign(new Error('Server Error'), { status: 500 });
      mockApiService.get.mockRejectedValue(serverError);

      await expect(serviceRepository.findById('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow('Server Error');
    });
  });

  describe('findAll', () => {
    it('should return all services without filters', async () => {
      const mockBackendServices: BackendService[] = [mockBackendService];
      mockApiService.get.mockResolvedValue(mockBackendServices);

      const result = await serviceRepository.findAll();

      expect(result).toEqual([mockFrontendService]);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/services');
    });

    it('should return services with filters', async () => {
      const mockBackendServices: BackendService[] = [mockBackendService];
      mockApiService.get.mockResolvedValue(mockBackendServices);

      const result = await serviceRepository.findAll({ name: 'Corte' });

      expect(result).toEqual([mockFrontendService]);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/services?name=Corte');
    });

    it('should return empty array when API returns non-array', async () => {
      mockApiService.get.mockResolvedValue(null);

      const result = await serviceRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByBarber', () => {
    it('should return services for a specific barber', async () => {
      const mockBackendServices: BackendService[] = [mockBackendService];
      mockApiService.get.mockResolvedValue(mockBackendServices);

      const result = await serviceRepository.findByBarber('barber-123');

      expect(result).toEqual([mockFrontendService]);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/services/barber/barber-123');
    });

    it('should return empty array when barber has no services', async () => {
      mockApiService.get.mockResolvedValue([]);

      const result = await serviceRepository.findByBarber('barber-456');

      expect(result).toEqual([]);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/services/barber/barber-456');
    });

    it('should return empty array when barber not found', async () => {
      const notFoundError = Object.assign(new Error('Not Found'), { status: 404 });
      mockApiService.get.mockRejectedValue(notFoundError);

      const result = await serviceRepository.findByBarber('nonexistent-barber');

      expect(result).toEqual([]);
    });

    it('should throw error for other API errors', async () => {
      const serverError = Object.assign(new Error('Server Error'), { status: 500 });
      mockApiService.get.mockRejectedValue(serverError);

      await expect(serviceRepository.findByBarber('barber-123')).rejects.toThrow('Server Error');
    });

    it('should handle non-array response from API', async () => {
      mockApiService.get.mockResolvedValue(null);

      const result = await serviceRepository.findByBarber('barber-123');

      expect(result).toEqual([]);
    });
  });

  describe('associateBarbers', () => {
    it('should associate barbers to a service successfully', async () => {
      mockApiService.post.mockResolvedValue(undefined);

      await serviceRepository.associateBarbers('service-123', ['barber-1', 'barber-2']);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/services/service-123/barbers', {
        barberIds: ['barber-1', 'barber-2']
      });
    });

    it('should handle authentication errors', async () => {
      const authError = Object.assign(new Error('Unauthorized'), { status: 401 });
      mockApiService.post.mockRejectedValue(authError);

      await expect(
        serviceRepository.associateBarbers('service-123', ['barber-1'])
      ).rejects.toThrow('Erro ao associar barbeiros ao serviço: Unauthorized');
    });

    it('should handle server errors', async () => {
      const serverError = Object.assign(new Error('Internal Server Error'), { status: 500 });
      mockApiService.post.mockRejectedValue(serverError);

      await expect(
        serviceRepository.associateBarbers('service-123', ['barber-1'])
      ).rejects.toThrow('Erro ao associar barbeiros ao serviço: Internal Server Error');
    });

    it('should handle unknown errors', async () => {
      mockApiService.post.mockRejectedValue('Unknown error');

      await expect(
        serviceRepository.associateBarbers('service-123', ['barber-1'])
      ).rejects.toThrow('Erro ao associar barbeiros ao serviço: Erro desconhecido');
    });
  });

  describe('findByName', () => {
    it('should filter services by name (case insensitive)', async () => {
      const mockServices: BackendService[] = [
        { id: '1', name: 'Corte de Cabelo', price: 25.0 },
        { id: '2', name: 'Barba', price: 15.0 },
        { id: '3', name: 'Corte + Barba', price: 35.0 },
      ];
      mockApiService.get.mockResolvedValue(mockServices);

      const result = await serviceRepository.findByName('corte');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Corte de Cabelo');
      expect(result[1].name).toBe('Corte + Barba');
    });

    it('should return empty array when no services match', async () => {
      const mockServices: BackendService[] = [
        { id: '1', name: 'Barba', price: 15.0 },
      ];
      mockApiService.get.mockResolvedValue(mockServices);

      const result = await serviceRepository.findByName('manicure');

      expect(result).toEqual([]);
    });
  });

  describe('findByPriceRange', () => {
    it('should filter services by price range', async () => {
      const mockServices: BackendService[] = [
        { id: '1', name: 'Corte Simples', price: 20.0 },
        { id: '2', name: 'Corte Premium', price: 50.0 },
        { id: '3', name: 'Barba', price: 15.0 },
      ];
      mockApiService.get.mockResolvedValue(mockServices);

      const result = await serviceRepository.findByPriceRange(15.0, 25.0);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Corte Simples');
      expect(result[1].name).toBe('Barba');
    });

    it('should return empty array when no services in price range', async () => {
      const mockServices: BackendService[] = [
        { id: '1', name: 'Corte Premium', price: 50.0 },
      ];
      mockApiService.get.mockResolvedValue(mockServices);

      const result = await serviceRepository.findByPriceRange(10.0, 20.0);

      expect(result).toEqual([]);
    });

    it('should include services at exact price boundaries', async () => {
      const mockServices: BackendService[] = [
        { id: '1', name: 'Service Min', price: 20.0 },
        { id: '2', name: 'Service Max', price: 30.0 },
        { id: '3', name: 'Service Out', price: 35.0 },
      ];
      mockApiService.get.mockResolvedValue(mockServices);

      const result = await serviceRepository.findByPriceRange(20.0, 30.0);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Service Min');
      expect(result[1].name).toBe('Service Max');
    });
  });

  describe('findByAssociatedBarber', () => {
    it('should delegate to findByBarber method', async () => {
      const mockBackendServices: BackendService[] = [mockBackendService];
      mockApiService.get.mockResolvedValue(mockBackendServices);

      const result = await serviceRepository.findByAssociatedBarber('barber-123');

      expect(result).toEqual([mockFrontendService]);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/services/barber/barber-123');
    });
  });

  describe('create', () => {
    it('should create new service with backend adaptation', async () => {
      const serviceData = {
        name: 'Novo Serviço',
        description: 'Descrição do serviço',
        duration: 45,
        price: 30.0,
        isActive: true,
      };

      const expectedBackendData = {
        name: 'Novo Serviço',
        price: 30.0,
      };

      const createdBackendService: BackendService = {
        id: 'new-service-id',
        name: 'Novo Serviço',
        price: 30.0,
      };

      mockApiService.post.mockResolvedValue(createdBackendService);

      const result = await serviceRepository.create(serviceData);

      expect(result).toEqual({
        id: 'new-service-id',
        name: 'Novo Serviço',
        description: '',
        duration: 60,
        price: 30.0,
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockApiService.post).toHaveBeenCalledWith('/api/services', expectedBackendData);
    });
  });

  describe('update', () => {
    it('should update service with backend adaptation', async () => {
      const updates = {
        name: 'Nome Atualizado',
        description: 'Nova descrição',
        price: 35.0,
        duration: 90,
      };

      const expectedBackendUpdates = {
        name: 'Nome Atualizado',
        price: 35.0,
      };

      const updatedBackendService: BackendService = {
        id: 'service-123',
        name: 'Nome Atualizado',
        price: 35.0,
      };

      mockApiService.patch.mockResolvedValue(updatedBackendService);

      const result = await serviceRepository.update('service-123', updates);

      expect(result).toEqual({
        id: 'service-123',
        name: 'Nome Atualizado',
        description: '',
        duration: 60,
        price: 35.0,
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockApiService.patch).toHaveBeenCalledWith('/api/services/service-123', expectedBackendUpdates);
    });

    it('should handle partial updates', async () => {
      const updates = { name: 'Apenas Nome' };
      const expectedBackendUpdates = { name: 'Apenas Nome' };

      const updatedBackendService: BackendService = {
        id: 'service-123',
        name: 'Apenas Nome',
        price: 25.0,
      };

      mockApiService.patch.mockResolvedValue(updatedBackendService);

      await serviceRepository.update('service-123', updates);

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/services/service-123', expectedBackendUpdates);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should handle rate limiting for read operations', async () => {
      const rateLimitError = Object.assign(new Error('Too Many Requests'), { status: 429 });
      mockApiService.get.mockRejectedValue(rateLimitError);

      await expect(serviceRepository.findAll()).rejects.toThrow('Too Many Requests');
    });

    it('should handle rate limiting for write operations', async () => {
      const rateLimitError = Object.assign(new Error('Too Many Requests'), { status: 429 });
      mockApiService.post.mockRejectedValue(rateLimitError);

      const serviceData = {
        name: 'Test Service',
        description: 'Test description with enough characters',
        duration: 60,
        price: 25.0,
        isActive: true,
      };

      await expect(serviceRepository.create(serviceData)).rejects.toThrow('Too Many Requests');
    });

    it('should handle rate limiting for barber association', async () => {
      const rateLimitError = Object.assign(new Error('Too Many Requests'), { status: 429 });
      mockApiService.post.mockRejectedValue(rateLimitError);

      await expect(
        serviceRepository.associateBarbers('service-123', ['barber-1'])
      ).rejects.toThrow('Erro ao associar barbeiros ao serviço: Too Many Requests');
    });
  });

  describe('Backend Structure Adaptation', () => {
    it('should adapt backend service structure to frontend format', async () => {
      const backendService: BackendService = {
        id: 'uuid-123',
        name: 'Test Service',
        price: 42.5,
      };

      mockApiService.get.mockResolvedValue(backendService);

      const result = await serviceRepository.findById('uuid-123');

      expect(result).toEqual({
        id: 'uuid-123',
        name: 'Test Service',
        price: 42.5,
        description: '', // Default value
        duration: 60, // Default value
        isActive: true, // Default value
        createdAt: expect.any(Date), // Default value
        updatedAt: expect.any(Date), // Default value
      });
    });

    it('should handle UUID format for service IDs', async () => {
      const uuidService: BackendService = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'UUID Service',
        price: 25.0,
      };

      mockApiService.get.mockResolvedValue([uuidService]);

      const result = await serviceRepository.findAll();

      expect(result[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });
});