import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useBarbers } from '../useBarbers';
import type { BarberRepository } from '@/services/repositories/BarberRepository';
import type { Barber } from '@/types';
import { TenantProvider } from '@/contexts/TenantContext';

// Mock BarberRepository
type MockedBarberRepository = {
  [K in keyof BarberRepository]: vi.MockedFunction<BarberRepository[K]>;
};

const mockBarberRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findActive: vi.fn(),
  findByService: vi.fn(),
  findByName: vi.fn(),
  findBySpecialty: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  updateContact: vi.fn(),
  updatePaymentInfo: vi.fn(),
  toggleActive: vi.fn(),
  getStatistics: vi.fn(),
};

vi.mock('@/services/ServiceFactory', () => ({
  useBarberRepository: () => mockBarberRepository,
}));

// Mock TenantContext
vi.mock('@/contexts/TenantContext', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  useTenant: () => ({
    barbershopId: 'test-barbershop-id',
    isValidTenant: true,
    slug: 'test-barbershop',
    barbershopData: { id: 'test-barbershop-id', name: 'Test Barbershop' },
    loading: false,
    error: null
  })
}));

// Test wrapper with providers
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', null, children);
};

describe('useBarbers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBarber: Barber = {
    id: '01', // Formatted ID as per backend structure
    name: 'Carlos Barbeiro',
    email: 'carlos@barbershop.com',
    phone: '11999999999',
    specialties: ['Corte Masculino', 'Barba'],
    isActive: true,
    workingHours: {
      monday: [{ start: '09:00', end: '18:00' }],
      tuesday: [{ start: '09:00', end: '18:00' }],
      wednesday: [{ start: '09:00', end: '18:00' }],
      thursday: [{ start: '09:00', end: '18:00' }],
      friday: [{ start: '09:00', end: '18:00' }],
      saturday: [{ start: '09:00', end: '15:00' }],
      sunday: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    _backendData: {
      whatsapp: '11999999999',
      pix: 'carlos@barbershop.com',
      username: 'carlos_barber',
    },
  };

  describe('loadBarbers', () => {
    it('should load barbers successfully', async () => {
      const mockBarbers = [mockBarber];
      mockBarberRepository.findAll.mockResolvedValue(mockBarbers);

      const { result } = renderHook(() => useBarbers(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.loadBarbers();
      });

      expect(result.current.barbers).toEqual(mockBarbers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading error', async () => {
      const error = new Error('Failed to load barbers');
      mockBarberRepository.findAll.mockRejectedValue(error);

      const { result } = renderHook(() => useBarbers(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.loadBarbers();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should load barbers with filters', async () => {
      const mockBarbers = [mockBarber];
      const filters = { isActive: true };
      mockBarberRepository.findAll.mockResolvedValue(mockBarbers);

      const { result } = renderHook(() => useBarbers(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.loadBarbers(filters);
      });

      expect(mockBarberRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result.current.barbers).toEqual(mockBarbers);
    });
  });

  describe('getBarberById', () => {
    it('should get barber by formatted ID', async () => {
      mockBarberRepository.findById.mockResolvedValue(mockBarber);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | null = null;
      await act(async () => {
        barber = await result.current.getBarberById('01');
      });

      expect(barber).toEqual(mockBarber);
      expect(mockBarberRepository.findById).toHaveBeenCalledWith('01');
    });

    it('should handle formatted IDs correctly', async () => {
      const barber02 = { ...mockBarber, id: '02', name: 'João Barbeiro' };
      mockBarberRepository.findById.mockResolvedValue(barber02);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | null = null;
      await act(async () => {
        barber = await result.current.getBarberById('02');
      });

      expect(barber?.id).toBe('02');
      expect(mockBarberRepository.findById).toHaveBeenCalledWith('02');
    });
  });

  describe('getActiveBarbers', () => {
    it('should get active barbers', async () => {
      const mockBarbers = [mockBarber];
      mockBarberRepository.findActive.mockResolvedValue(mockBarbers);

      const { result } = renderHook(() => useBarbers());

      let barbers: Barber[] = [];
      await act(async () => {
        barbers = await result.current.getActiveBarbers();
      });

      expect(barbers).toEqual(mockBarbers);
      expect(mockBarberRepository.findActive).toHaveBeenCalled();
    });
  });

  describe('getBarbersByService', () => {
    it('should get barbers by service', async () => {
      const mockBarbers = [mockBarber];
      mockBarberRepository.findByService.mockResolvedValue(mockBarbers);

      const { result } = renderHook(() => useBarbers());

      let barbers: Barber[] = [];
      await act(async () => {
        barbers = await result.current.getBarbersByService('service1');
      });

      expect(barbers).toEqual(mockBarbers);
      expect(mockBarberRepository.findByService).toHaveBeenCalledWith('service1');
    });
  });

  describe('createBarber', () => {
    it('should create barber with User relation successfully', async () => {
      const barberData = {
        name: 'Novo Barbeiro',
        email: 'novo@barbershop.com',
        phone: '11888888888',
        specialties: ['Corte'],
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
      
      const createdBarber = { 
        ...barberData, 
        id: '03', // Sequential ID from backend
        createdAt: new Date(), 
        updatedAt: new Date(),
        _backendData: {
          whatsapp: '11888888888',
          pix: '',
          username: 'novo_barbeiro',
        },
      };
      
      mockBarberRepository.create.mockResolvedValue(createdBarber);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | undefined;
      await act(async () => {
        barber = await result.current.createBarber(barberData);
      });

      expect(barber).toEqual(createdBarber);
      expect(barber?.id).toBe('03'); // Sequential ID
      expect(mockBarberRepository.create).toHaveBeenCalledWith(barberData);
      expect(result.current.creating).toBe(false);
    });

    it('should handle create error', async () => {
      const error = new Error('Failed to create barber');
      mockBarberRepository.create.mockRejectedValue(error);

      const { result } = renderHook(() => useBarbers());

      await act(async () => {
        try {
          await result.current.createBarber({
            name: 'Novo Barbeiro',
            email: 'novo@barbershop.com',
            phone: '11888888888',
            specialties: [],
            isActive: true,
            workingHours: {
              monday: [], tuesday: [], wednesday: [], thursday: [],
              friday: [], saturday: [], sunday: [],
            },
          });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.creating).toBe(false);
      expect(result.current.createError).toBeTruthy();
    });
  });

  describe('updateBarber', () => {
    it('should update barber and related User successfully', async () => {
      const updates = { 
        name: 'Carlos Barbeiro Atualizado',
        phone: '11777777777',
      };
      const updatedBarber = { 
        ...mockBarber, 
        ...updates,
        _backendData: {
          ...mockBarber._backendData!,
          whatsapp: '11777777777',
        },
      };
      
      mockBarberRepository.update.mockResolvedValue(updatedBarber);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | undefined;
      await act(async () => {
        barber = await result.current.updateBarber('01', updates);
      });

      expect(barber).toEqual(updatedBarber);
      expect(mockBarberRepository.update).toHaveBeenCalledWith('01', updates);
    });
  });

  describe('deleteBarber', () => {
    it('should delete barber and cascade User + Appointments', async () => {
      mockBarberRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useBarbers());

      await act(async () => {
        await result.current.deleteBarber('01');
      });

      expect(mockBarberRepository.delete).toHaveBeenCalledWith('01');
      expect(result.current.deleting).toBe(false);
    });

    it('should handle delete error', async () => {
      const error = new Error('Failed to delete barber');
      mockBarberRepository.delete.mockRejectedValue(error);

      const { result } = renderHook(() => useBarbers());

      await act(async () => {
        try {
          await result.current.deleteBarber('01');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.deleting).toBe(false);
      expect(result.current.deleteError).toBeTruthy();
    });
  });

  describe('updateContact', () => {
    it('should update barber contact information', async () => {
      const updatedBarber = { 
        ...mockBarber, 
        phone: '11666666666',
        _backendData: {
          ...mockBarber._backendData!,
          whatsapp: '11666666666',
        },
      };
      
      mockBarberRepository.updateContact.mockResolvedValue(updatedBarber);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | undefined;
      await act(async () => {
        barber = await result.current.updateContact('01', '11666666666');
      });

      expect(barber).toEqual(updatedBarber);
      expect(mockBarberRepository.updateContact).toHaveBeenCalledWith('01', '11666666666');
    });
  });

  describe('updatePaymentInfo', () => {
    it('should update barber PIX information', async () => {
      const updatedBarber = { 
        ...mockBarber,
        _backendData: {
          ...mockBarber._backendData!,
          pix: 'novo@pix.com',
        },
      };
      
      mockBarberRepository.updatePaymentInfo.mockResolvedValue(updatedBarber);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | undefined;
      await act(async () => {
        barber = await result.current.updatePaymentInfo('01', 'novo@pix.com');
      });

      expect(barber).toEqual(updatedBarber);
      expect(mockBarberRepository.updatePaymentInfo).toHaveBeenCalledWith('01', 'novo@pix.com');
    });
  });

  describe('toggleActive', () => {
    it('should toggle barber active status', async () => {
      const updatedBarber = { ...mockBarber, isActive: false };
      mockBarberRepository.toggleActive.mockResolvedValue(updatedBarber);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | undefined;
      await act(async () => {
        barber = await result.current.toggleActive('01', false);
      });

      expect(barber).toEqual(updatedBarber);
      expect(mockBarberRepository.toggleActive).toHaveBeenCalledWith('01', false);
    });
  });

  describe('getStatistics', () => {
    it('should get barber statistics', async () => {
      const mockStats = {
        total: 5,
        active: 4,
        inactive: 1,
      };
      
      mockBarberRepository.getStatistics.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useBarbers());

      let stats: { total: number; active: number; inactive: number; };
      await act(async () => {
        stats = await result.current.getStatistics();
      });

      expect(stats).toEqual(mockStats);
      expect(mockBarberRepository.getStatistics).toHaveBeenCalled();
    });
  });

  describe('backend data structure validation', () => {
    it('should handle backend data structure correctly', async () => {
      const barberWithBackendData = {
        ...mockBarber,
        _backendData: {
          whatsapp: '11999999999',
          pix: 'carlos@barbershop.com',
          username: 'carlos_barber',
        },
      };

      mockBarberRepository.findById.mockResolvedValue(barberWithBackendData);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | null = null;
      await act(async () => {
        barber = await result.current.getBarberById('01');
      });

      expect(barber?._backendData).toEqual({
        whatsapp: '11999999999',
        pix: 'carlos@barbershop.com',
        username: 'carlos_barber',
      });
    });

    it('should validate formatted IDs pattern', async () => {
      const formattedIds = ['01', '02', '03', '10', '99'];
      
      for (const id of formattedIds) {
        const barber = { ...mockBarber, id };
        mockBarberRepository.findById.mockResolvedValue(barber);

        const { result } = renderHook(() => useBarbers());

        let foundBarber: Barber | null = null;
        await act(async () => {
          foundBarber = await result.current.getBarberById(id);
        });

        expect(foundBarber?.id).toBe(id);
        expect(foundBarber?.id).toMatch(/^\d{2}$/); // Two-digit format
      }
    });
  });

  describe('User + Barber coordinated operations', () => {
    it('should handle coordinated User + Barber creation', async () => {
      const barberData = {
        name: 'Coordinated Barber',
        email: 'coordinated@barbershop.com',
        phone: '11555555555',
        specialties: ['Corte', 'Barba'],
        isActive: true,
        workingHours: {
          monday: [{ start: '09:00', end: '18:00' }],
          tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
        },
      };

      const createdBarber = {
        ...barberData,
        id: '04',
        createdAt: new Date(),
        updatedAt: new Date(),
        _backendData: {
          whatsapp: '11555555555',
          pix: '',
          username: 'coordinated_barber',
        },
      };

      mockBarberRepository.create.mockResolvedValue(createdBarber);

      const { result } = renderHook(() => useBarbers());

      let barber: Barber | undefined;
      await act(async () => {
        barber = await result.current.createBarber(barberData);
      });

      // Verify that the created barber has both frontend and backend data
      expect(barber?.name).toBe('Coordinated Barber');
      expect(barber?.email).toBe('coordinated@barbershop.com');
      expect(barber?._backendData?.username).toBe('coordinated_barber');
      expect(barber?._backendData?.whatsapp).toBe('11555555555');
    });

    it('should handle coordinated User + Barber + Appointments deletion', async () => {
      // Mock successful deletion (backend handles cascade)
      mockBarberRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useBarbers());

      await act(async () => {
        await result.current.deleteBarber('01');
      });

      // Verify deletion was called (backend handles User + Appointments cascade)
      expect(mockBarberRepository.delete).toHaveBeenCalledWith('01');
      expect(result.current.deleting).toBe(false);
      expect(result.current.deleteError).toBeNull();
    });
  });
});