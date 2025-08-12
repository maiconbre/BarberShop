import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BarberRepository } from '@/services/repositories/BarberRepository';
import type { IApiService } from '@/services/interfaces/IApiService';
import type { BackendBarber } from '@/types/backend';

// Mock API Service
const mockApiService: IApiService = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

describe('BarberRepository', () => {
  let barberRepository: BarberRepository;
  let mockBackendBarber: BackendBarber;

  beforeEach(() => {
    vi.clearAllMocks();
    barberRepository = new BarberRepository(mockApiService);
    
    mockBackendBarber = {
      id: '01',
      name: 'João Silva',
      whatsapp: '+5511999999999',
      pix: 'joao@email.com',
      username: 'joao.silva',
    };
  });

  describe('findById', () => {
    it('should find barber by id successfully', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue(mockBackendBarber);

      const result = await barberRepository.findById('01');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/barbers/01');
      expect(result).toMatchObject({
        id: '01',
        name: 'João Silva',
        email: 'joao.silva',
        phone: '+5511999999999',
      });
    });

    it('should return null when barber not found', async () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      vi.mocked(mockApiService.get).mockRejectedValue(notFoundError);

      const result = await barberRepository.findById('999');

      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      const apiError = new Error('Server error');
      vi.mocked(mockApiService.get).mockRejectedValue(apiError);

      await expect(barberRepository.findById('01')).rejects.toThrow('Server error');
    });
  });

  describe('findAll', () => {
    it('should find all barbers successfully', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([mockBackendBarber]);

      const result = await barberRepository.findAll();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/barbers');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '01',
        name: 'João Silva',
        phone: '+5511999999999',
      });
    });

    it('should apply frontend filters', async () => {
      const barbers = [
        mockBackendBarber,
        { ...mockBackendBarber, id: '02', name: 'Maria Santos' },
      ];
      vi.mocked(mockApiService.get).mockResolvedValue(barbers);

      const result = await barberRepository.findAll({ isActive: true });

      expect(result).toHaveLength(2); // All barbers default to active
    });

    it('should return empty array when no barbers found', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([]);

      const result = await barberRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should find only active barbers', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([mockBackendBarber]);

      const result = await barberRepository.findActive();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/barbers');
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should find barbers by name', async () => {
      const barbers = [
        mockBackendBarber,
        { ...mockBackendBarber, id: '02', name: 'Maria Santos' },
      ];
      vi.mocked(mockApiService.get).mockResolvedValue(barbers);

      const result = await barberRepository.findByName('João');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('João Silva');
    });

    it('should be case insensitive', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue([mockBackendBarber]);

      const result = await barberRepository.findByName('joão');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('João Silva');
    });
  });

  describe('create', () => {
    it('should create barber successfully', async () => {
      const newBarberData = {
        name: 'Carlos Oliveira',
        email: 'carlos@email.com',
        phone: '+5511888888888',
        specialties: ['Corte', 'Barba'],
        isActive: true,
        workingHours: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      };

      const createdBackendBarber = {
        id: '03',
        name: 'Carlos Oliveira',
        whatsapp: '+5511888888888',
        pix: '',
        username: 'carlos@email.com',
      };

      vi.mocked(mockApiService.post).mockResolvedValue(createdBackendBarber);

      const result = await barberRepository.create(newBarberData);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/barbers', {
        name: 'Carlos Oliveira',
        whatsapp: '+5511888888888',
        pix: '',
      });
      expect(result.name).toBe('Carlos Oliveira');
      expect(result.phone).toBe('+5511888888888');
    });
  });

  describe('update', () => {
    it('should update barber successfully', async () => {
      const updates = { name: 'João Santos Silva' };
      const updatedBackendBarber = { ...mockBackendBarber, ...updates };
      
      vi.mocked(mockApiService.patch).mockResolvedValue(updatedBackendBarber);

      const result = await barberRepository.update('01', updates);

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/barbers/01', { name: 'João Santos Silva' });
      expect(result.name).toBe('João Santos Silva');
    });

    it('should update phone (whatsapp)', async () => {
      const updates = { phone: '+5511777777777' };
      const updatedBackendBarber = { ...mockBackendBarber, whatsapp: '+5511777777777' };
      
      vi.mocked(mockApiService.patch).mockResolvedValue(updatedBackendBarber);

      const result = await barberRepository.update('01', updates);

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/barbers/01', { whatsapp: '+5511777777777' });
      expect(result.phone).toBe('+5511777777777');
    });
  });

  describe('delete', () => {
    it('should delete barber successfully', async () => {
      vi.mocked(mockApiService.delete).mockResolvedValue(undefined);

      await barberRepository.delete('01');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/barbers/01');
    });
  });

  describe('exists', () => {
    it('should return true when barber exists', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue(mockBackendBarber);

      const result = await barberRepository.exists('01');

      expect(result).toBe(true);
    });

    it('should return false when barber does not exist', async () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      vi.mocked(mockApiService.get).mockRejectedValue(notFoundError);

      const result = await barberRepository.exists('999');

      expect(result).toBe(false);
    });
  });

  describe('updateContact', () => {
    it('should update barber contact information', async () => {
      const updatedBackendBarber = { ...mockBackendBarber, whatsapp: '+5511666666666' };
      vi.mocked(mockApiService.patch).mockResolvedValue(updatedBackendBarber);

      const result = await barberRepository.updateContact('01', '+5511666666666');

      expect(result.phone).toBe('+5511666666666');
    });
  });

  describe('updatePaymentInfo', () => {
    it('should update barber payment information', async () => {
      const updatedBackendBarber = { ...mockBackendBarber, pix: 'novo@pix.com' };
      vi.mocked(mockApiService.patch).mockResolvedValue(updatedBackendBarber);

      const result = await barberRepository.updatePaymentInfo('01', 'novo@pix.com');

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/barbers/01', { pix: 'novo@pix.com' });
      expect(result._backendData?.pix).toBe('novo@pix.com');
    });
  });

  describe('toggleActive', () => {
    it('should toggle barber active status', async () => {
      vi.mocked(mockApiService.get).mockResolvedValue(mockBackendBarber);

      const result = await barberRepository.toggleActive('01', false);

      expect(result.isActive).toBe(false);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when barber not found', async () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      vi.mocked(mockApiService.get).mockRejectedValue(notFoundError);

      await expect(barberRepository.toggleActive('999', false)).rejects.toThrow('Barber with id 999 not found');
    });
  });

  describe('getStatistics', () => {
    it('should return barber statistics', async () => {
      const barbers = [
        mockBackendBarber,
        { ...mockBackendBarber, id: '02' },
        { ...mockBackendBarber, id: '03' },
      ];
      
      vi.mocked(mockApiService.get).mockResolvedValue(barbers);

      const result = await barberRepository.getStatistics();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/barbers');
      expect(result).toEqual({
        total: 3,
        active: 3, // All default to active
        inactive: 0,
      });
    });
  });

  describe('frontend filters', () => {
    it('should filter by specialty', async () => {
      // Since specialties are not in backend, this will return empty results
      // unless we modify the test data to include specialties
      vi.mocked(mockApiService.get).mockResolvedValue([mockBackendBarber]);

      const result = await barberRepository.findBySpecialty('Corte');

      expect(result).toHaveLength(0); // No specialties in backend data
    });

    it('should apply search filter', async () => {
      const barbers = [
        mockBackendBarber,
        { ...mockBackendBarber, id: '02', name: 'Maria Santos' },
      ];
      vi.mocked(mockApiService.get).mockResolvedValue(barbers);

      const result = await barberRepository.findAll({ search: 'João' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('João Silva');
    });
  });
});