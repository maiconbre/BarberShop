import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import type { IApiService } from '../interfaces/IApiService';
import type { Appointment, AppointmentStatus } from '@/types';
import type { BackendAppointment } from '@/types/backend';

interface MockApiError extends Error {
  status?: number;
}

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

describe('AppointmentRepository', () => {
  let appointmentRepository: AppointmentRepository;

  beforeEach(() => {
    appointmentRepository = new AppointmentRepository(mockApiService);
    vi.clearAllMocks();
  });

  const mockBackendAppointment: BackendAppointment = {
    id: '1',
    clientName: 'John Doe',
    serviceName: 'Haircut',
    date: '2024-01-15',
    time: '10:00',
    status: 'pending',
    barberId: 'barber1',
    barberName: 'Joe Barber',
    price: 50.0,
    wppclient: '+5511999999999'
  };

  // Mock frontend appointment structure for reference
  // const mockFrontendAppointment: Appointment = {
  //   id: '1',
  //   clientId: 'John Doe',
  //   barberId: 'barber1',
  //   serviceId: 'Haircut',
  //   date: new Date('2024-01-15'),
  //   startTime: '10:00',
  //   endTime: '11:00',
  //   status: 'pending' as AppointmentStatus,
  //   notes: 'Cliente: John Doe | Serviço: Haircut | Barbeiro: Joe Barber | Preço: R$ 50 | WhatsApp: +5511999999999',
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  //   _backendData: {
  //     clientName: 'John Doe',
  //     serviceName: 'Haircut',
  //     barberName: 'Joe Barber',
  //     price: 50.0,
      //     wppclient: '+5511999999999'
  //   }
  // };

  describe('findById', () => {
    it('should find appointment by id successfully', async () => {
      mockApiService.get.mockResolvedValue(mockBackendAppointment);

      const result = await appointmentRepository.findById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.clientId).toBe('John Doe');
      expect(result?.barberId).toBe('barber1');
      expect(result?.serviceId).toBe('Haircut');
      expect(result?.status).toBe('scheduled');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments/1');
    });

    it('should return null when appointment not found', async () => {
      const notFoundError: MockApiError = new Error('Not Found');
      notFoundError.status = 404;
      mockApiService.get.mockRejectedValue(notFoundError);

      const result = await appointmentRepository.findById('999');

      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      const serverError = new Error('Server Error');
      mockApiService.get.mockRejectedValue(serverError);

      await expect(appointmentRepository.findById('1')).rejects.toThrow('Server Error');
    });
  });

  describe('findAll', () => {
    it('should find all appointments successfully', async () => {
      const mockBackendAppointments = [mockBackendAppointment];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].clientId).toBe('John Doe');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments');
    });

    it('should find appointments with filters', async () => {
      const mockBackendAppointments = [mockBackendAppointment];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findAll({ barberId: 'barber1' });

      expect(result).toHaveLength(1);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments?barberId=barber1');
    });

    it('should return empty array when API returns non-array', async () => {
      mockApiService.get.mockResolvedValue(null);

      const result = await appointmentRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByBarberId', () => {
    it('should find appointments by barberId using query parameter', async () => {
      const mockBackendAppointments = [mockBackendAppointment];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findByBarberId('barber1');

      expect(result).toHaveLength(1);
      expect(result[0].barberId).toBe('barber1');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments?barberId=barber1');
    });
  });

  describe('findByStatus', () => {
    it('should filter appointments by status on frontend', async () => {
      const mockBackendAppointments = [
        mockBackendAppointment,
        { ...mockBackendAppointment, id: '2', status: 'confirmed' }
      ];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findByStatus('pending' as AppointmentStatus);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('scheduled');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments');
    });
  });

  describe('findByDate', () => {
    it('should filter appointments by date on frontend', async () => {
      const mockBackendAppointments = [
        mockBackendAppointment,
        { ...mockBackendAppointment, id: '2', date: '2024-01-16' }
      ];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findByDate(new Date('2024-01-15'));

      expect(result).toHaveLength(1);
      expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-15');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments');
    });
  });

  describe('findByDateRange', () => {
    it('should filter appointments by date range on frontend', async () => {
      const mockBackendAppointments = [
        mockBackendAppointment,
        { ...mockBackendAppointment, id: '2', date: '2024-01-16' },
        { ...mockBackendAppointment, id: '3', date: '2024-01-20' }
      ];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findByDateRange(
        new Date('2024-01-15'),
        new Date('2024-01-17')
      );

      expect(result).toHaveLength(2);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments');
    });
  });

  describe('findByClientName', () => {
    it('should filter appointments by client name on frontend', async () => {
      const mockBackendAppointments = [
        mockBackendAppointment,
        { ...mockBackendAppointment, id: '2', clientName: 'Jane Smith' }
      ];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findByClientName('John');

      expect(result).toHaveLength(1);
      expect(result[0]._backendData?.clientName).toBe('John Doe');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments');
    });
  });

  describe('findUpcoming', () => {
    it('should filter upcoming appointments (today and tomorrow)', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const mockBackendAppointments = [
        { ...mockBackendAppointment, id: '1', date: today.toISOString().split('T')[0] },
        { ...mockBackendAppointment, id: '2', date: tomorrow.toISOString().split('T')[0] },
        { ...mockBackendAppointment, id: '3', date: dayAfterTomorrow.toISOString().split('T')[0] }
      ];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findUpcoming();

      expect(result).toHaveLength(2);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments');
    });
  });

  describe('findPending', () => {
    it('should filter pending appointments', async () => {
      const mockBackendAppointments = [
        mockBackendAppointment,
        { ...mockBackendAppointment, id: '2', status: 'confirmed' }
      ];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findPending();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('scheduled');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments');
    });
  });

  describe('findConfirmedByBarberAndDate', () => {
    it('should filter confirmed appointments by barber and date', async () => {
      // Mock data returned by the API call with barberId filter
      const mockBackendAppointments = [
        { ...mockBackendAppointment, id: '1', status: 'confirmed', date: '2024-01-15' }, // Should match
        { ...mockBackendAppointment, id: '2', status: 'pending', date: '2024-01-15' },   // Wrong status
        { ...mockBackendAppointment, id: '3', status: 'confirmed', date: '2024-01-16' }  // Wrong date
      ];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.findConfirmedByBarberAndDate(
        'barber1',
        new Date('2024-01-15')
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].barberId).toBe('barber1');
      expect(result[0].status).toBe('confirmed');
      expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-15');
      expect(mockApiService.get).toHaveBeenCalledWith('/api/appointments?barberId=barber1');
    });
  });

  describe('create', () => {
    it('should create appointment successfully', async () => {
      const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: 'John Doe',
        barberId: 'barber1',
        serviceId: 'Haircut',
        date: new Date('2024-01-15'),
        startTime: '10:00',
        endTime: '11:00',
        status: 'pending' as AppointmentStatus,
        _backendData: {
          clientName: 'John Doe',
          serviceName: 'Haircut',
          barberName: 'Joe Barber',
          price: 50.0,
          wppclient: '+5511999999999'
        }
      };

      mockApiService.post.mockResolvedValue(mockBackendAppointment);

      const result = await appointmentRepository.create(appointmentData);

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockApiService.post).toHaveBeenCalledWith('/api/appointments', {
        clientName: 'John Doe',
        serviceName: 'Haircut',
        date: '2024-01-15',
        time: '10:00',
        barberId: 'barber1',
        barberName: 'Joe Barber',
        price: 50.0,
        wppclient: '+5511999999999',
        status: 'pending'
      });
    });
  });

  describe('update', () => {
    it('should update appointment successfully', async () => {
      const updates: Partial<Appointment> = {
        startTime: '11:00',
        status: 'confirmed',
        _backendData: {
          clientName: 'John Doe',
          serviceName: 'Haircut',
          barberName: 'Joe Barber',
          price: 60.0,
          wppclient: '+5511999999999'
        }
      };

      const updatedBackendAppointment = { ...mockBackendAppointment, time: '11:00', status: 'confirmed', price: 60.0 };
      mockApiService.patch.mockResolvedValue(updatedBackendAppointment);

      const result = await appointmentRepository.update('1', updates);

      expect(result).toBeDefined();
      expect(result.startTime).toBe('11:00');
      expect(mockApiService.patch).toHaveBeenCalledWith('/api/appointments/1', {
        time: '11:00',
        status: 'confirmed',
        price: 60.0,
        barberName: 'Joe Barber',
        clientName: 'John Doe',
        serviceName: 'Haircut',
        wppclient: '+5511999999999'
      });
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status successfully', async () => {
      const updatedBackendAppointment = { ...mockBackendAppointment, status: 'confirmed' };
      mockApiService.patch.mockResolvedValue(updatedBackendAppointment);

      const result = await appointmentRepository.updateStatus('1', 'confirmed');

      expect(result).toBeDefined();
      expect(result.status).toBe('confirmed');
      expect(mockApiService.patch).toHaveBeenCalledWith('/api/appointments/1', {
        status: 'confirmed'
      });
    });

    it('should map frontend status to backend status correctly', async () => {
      const updatedBackendAppointment = { ...mockBackendAppointment, status: 'cancelled' };
      mockApiService.patch.mockResolvedValue(updatedBackendAppointment);

      await appointmentRepository.updateStatus('1', 'cancelled' as AppointmentStatus);

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/appointments/1', {
        status: 'cancelled'
      });
    });
  });

  describe('delete', () => {
    it('should delete appointment successfully', async () => {
      mockApiService.delete.mockResolvedValue(undefined);

      await appointmentRepository.delete('1');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/appointments/1');
    });
  });

  describe('exists', () => {
    it('should return true when appointment exists', async () => {
      mockApiService.get.mockResolvedValue(mockBackendAppointment);

      const result = await appointmentRepository.exists('1');

      expect(result).toBe(true);
    });

    it('should return false when appointment does not exist', async () => {
      const notFoundError = new Error('Not Found');
      (notFoundError as MockApiError).status = 404;
      mockApiService.get.mockRejectedValue(notFoundError);

      const result = await appointmentRepository.exists('999');

      expect(result).toBe(false);
    });

    it('should throw error for other API errors in exists', async () => {
      const serverError = new Error('Server Error');
      mockApiService.get.mockRejectedValue(serverError);

      await expect(appointmentRepository.exists('1')).rejects.toThrow('Server Error');
    });
  });

  describe('createWithBackendData', () => {
    it('should create appointment with backend-specific data', async () => {
      const backendData = {
        clientName: 'John Doe',
        serviceName: 'Haircut',
        date: new Date('2024-01-15'),
        time: '10:00',
        barberId: 'barber1',
        barberName: 'Joe Barber',
        price: 50.0,
        wppclient: '+5511999999999',
        status: 'scheduled' as AppointmentStatus
      };

      mockApiService.post.mockResolvedValue(mockBackendAppointment);

      const result = await appointmentRepository.createWithBackendData(backendData);

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockApiService.post).toHaveBeenCalledWith('/api/appointments', {
        clientName: 'John Doe',
        serviceName: 'Haircut',
        date: '2024-01-15',
        time: '10:00',
        barberId: 'barber1',
        barberName: 'Joe Barber',
        price: 50.0,
        wppclient: '+5511999999999',
        status: 'pending'
      });
    });
  });

  describe('getStatistics', () => {
    it('should calculate appointment statistics', async () => {
      const mockBackendAppointments = [
        mockBackendAppointment,
        { ...mockBackendAppointment, id: '2', status: 'confirmed' },
        { ...mockBackendAppointment, id: '3', status: 'completed' },
        { ...mockBackendAppointment, id: '4', status: 'cancelled' }
      ];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      const result = await appointmentRepository.getStatistics();

      expect(result.total).toBe(4);
      expect(result.byStatus.pending).toBe(1);
      expect(result.byStatus.confirmed).toBe(1);
      expect(result.byStatus.completed).toBe(1);
      expect(result.byStatus.cancelled).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.confirmed).toBe(1);
      expect(result.completed).toBe(1);
      expect(result.cancelled).toBe(1);
    });
  });

  describe('rate limiting integration', () => {
    it('should handle rate limiting gracefully', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as MockApiError).status = 429;
      mockApiService.get.mockRejectedValue(rateLimitError);

      await expect(appointmentRepository.findAll()).rejects.toThrow('Rate limit exceeded');
    });

    it('should work within rate limits (200 req/min for reading)', async () => {
      const mockBackendAppointments = [mockBackendAppointment];
      mockApiService.get.mockResolvedValue(mockBackendAppointments);

      // Simulate multiple read operations within rate limit
      const promises = Array.from({ length: 5 }, () => appointmentRepository.findAll());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveLength(1);
      });
    });
  });

  describe('backend structure compatibility', () => {
    it('should handle backend appointment structure correctly', async () => {
      const backendAppointment: BackendAppointment = {
        id: 'appointment123',
        clientName: 'Maria Silva',
        serviceName: 'Corte + Barba',
        date: '2024-02-20',
        time: '14:30',
        status: 'confirmed',
        barberId: 'barber456',
        barberName: 'Carlos Barbeiro',
        price: 75.50,
        wppclient: '+5511987654321'
      };

      mockApiService.get.mockResolvedValue(backendAppointment);

      const result = await appointmentRepository.findById('appointment123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('appointment123');
      expect(result?.clientId).toBe('Maria Silva');
      expect(result?.serviceId).toBe('Corte + Barba');
      expect(result?.barberId).toBe('barber456');
      expect(result?.status).toBe('confirmed');
      expect(result?._backendData?.clientName).toBe('Maria Silva');
      expect(result?._backendData?.serviceName).toBe('Corte + Barba');
      expect(result?._backendData?.barberName).toBe('Carlos Barbeiro');
      expect(result?._backendData?.price).toBe(75.50);
      expect(result?._backendData?.wppclient).toBe('+5511987654321');
    });

    it('should handle ID generation (Date.now().toString())', async () => {
      const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: 'Test Client',
        barberId: 'barber1',
        serviceId: 'Test Service',
        date: new Date('2024-01-15'),
        startTime: '10:00',
        endTime: '11:00',
        status: 'pending' as AppointmentStatus,
        _backendData: {
          clientName: 'Test Client',
          serviceName: 'Test Service',
          barberName: 'Test Barber',
          price: 50.0,
          wppclient: '+5511999999999'
        }
      };

      const createdAppointment = {
        ...mockBackendAppointment,
        id: Date.now().toString(),
        clientName: 'Test Client',
        serviceName: 'Test Service'
      };

      mockApiService.post.mockResolvedValue(createdAppointment);

      const result = await appointmentRepository.create(appointmentData);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdAppointment.id);
      expect(typeof result.id).toBe('string');
    });
  });
});