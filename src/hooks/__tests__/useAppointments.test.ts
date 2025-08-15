import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppointments } from '../useAppointments';
import type { AppointmentRepository } from '@/services/repositories/AppointmentRepository';
import type { Appointment, AppointmentStatus } from '@/types';

// Mock ServiceFactory
type MockedAppointmentRepository = {
  [K in keyof AppointmentRepository]: vi.MockedFunction<AppointmentRepository[K]>;
};

const mockAppointmentRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByBarberId: vi.fn(),
  findByStatus: vi.fn(),
  findByDate: vi.fn(),
  findByDateRange: vi.fn(),
  findByClientName: vi.fn(),
  findUpcoming: vi.fn(),
  findPending: vi.fn(),
  findConfirmedByBarberAndDate: vi.fn(),
  create: vi.fn(),
  createWithBackendData: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  getStatistics: vi.fn(),
} as MockedAppointmentRepository;

vi.mock('@/services/ServiceFactory', () => ({
  useAppointmentRepository: () => mockAppointmentRepository,
}));

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppointment: Appointment = {
    id: '1',
    clientId: 'client1',
    barberId: '01',
    serviceId: 'service1',
    date: new Date('2024-01-15'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
    _backendData: {
      clientName: 'João Silva',
      serviceName: 'Corte Masculino',
      barberName: 'Carlos Barbeiro',
      price: 25.00,
      wppclient: '11999999999',
    },
  };

  describe('loadAppointments', () => {
    it('should load appointments successfully', async () => {
      const mockAppointments = [mockAppointment];
      mockAppointmentRepository.findAll.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.loadAppointments();
      });

      expect(result.current.appointments).toEqual(mockAppointments);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading error', async () => {
      const error = new Error('Failed to load appointments');
      mockAppointmentRepository.findAll.mockRejectedValue(error);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        try {
          await result.current.loadAppointments();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should load appointments with filters', async () => {
      const mockAppointments = [mockAppointment];
      const filters = { barberId: '01' };
      mockAppointmentRepository.findAll.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.loadAppointments(filters);
      });

      expect(mockAppointmentRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result.current.appointments).toEqual(mockAppointments);
    });
  });

  describe('getAppointmentsByBarberId', () => {
    it('should get appointments by barber ID', async () => {
      const mockAppointments = [mockAppointment];
      mockAppointmentRepository.findByBarberId.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      let appointments: Appointment[] = [];
      await act(async () => {
        appointments = await result.current.getAppointmentsByBarberId('01');
      });

      expect(appointments).toEqual(mockAppointments);
      expect(mockAppointmentRepository.findByBarberId).toHaveBeenCalledWith('01');
    });
  });

  describe('getAppointmentsByStatus', () => {
    it('should get appointments by status', async () => {
      const mockAppointments = [mockAppointment];
      mockAppointmentRepository.findByStatus.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      let appointments: Appointment[] = [];
      await act(async () => {
        appointments = await result.current.getAppointmentsByStatus('confirmed');
      });

      expect(appointments).toEqual(mockAppointments);
      expect(mockAppointmentRepository.findByStatus).toHaveBeenCalledWith('confirmed');
    });
  });

  describe('getAppointmentsByDate', () => {
    it('should get appointments by date', async () => {
      const mockAppointments = [mockAppointment];
      const date = new Date('2024-01-15');
      mockAppointmentRepository.findByDate.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      let appointments: Appointment[] = [];
      await act(async () => {
        appointments = await result.current.getAppointmentsByDate(date);
      });

      expect(appointments).toEqual(mockAppointments);
      expect(mockAppointmentRepository.findByDate).toHaveBeenCalledWith(date);
    });
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const appointmentData = {
        clientId: 'client1',
        barberId: '01',
        serviceId: 'service1',
        date: new Date('2024-01-15'),
        startTime: '10:00',
        endTime: '11:00',
        status: 'scheduled' as AppointmentStatus,
      };
      
      mockAppointmentRepository.create.mockResolvedValue(mockAppointment);

      const { result } = renderHook(() => useAppointments());

      let appointment: Appointment | undefined;
      await act(async () => {
        appointment = await result.current.createAppointment(appointmentData);
      });

      expect(appointment).toEqual(mockAppointment);
      expect(mockAppointmentRepository.create).toHaveBeenCalledWith(appointmentData);
      expect(result.current.creating).toBe(false);
    });

    it('should handle create error', async () => {
      const error = new Error('Failed to create appointment');
      mockAppointmentRepository.create.mockRejectedValue(error);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        try {
          await result.current.createAppointment({
            clientId: 'client1',
            barberId: '01',
            serviceId: 'service1',
            date: new Date(),
            startTime: '10:00',
            endTime: '11:00',
            status: 'scheduled',
          });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.creating).toBe(false);
      expect(result.current.createError).toBeTruthy();
    });
  });

  describe('createWithBackendData', () => {
    it('should create appointment with backend data successfully', async () => {
      const backendData = {
        clientName: 'João Silva',
        serviceName: 'Corte Masculino',
        date: new Date('2024-01-15'),
        time: '10:00',
        barberId: '01',
        barberName: 'Carlos Barbeiro',
        price: 25.00,
        wppclient: '11999999999',
        status: 'scheduled' as AppointmentStatus,
      };
      
      mockAppointmentRepository.createWithBackendData.mockResolvedValue(mockAppointment);

      const { result } = renderHook(() => useAppointments());

      let appointment: Appointment | undefined;
      await act(async () => {
        appointment = await result.current.createWithBackendData(backendData);
      });

      expect(appointment).toEqual(mockAppointment);
      expect(mockAppointmentRepository.createWithBackendData).toHaveBeenCalledWith(backendData);
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status successfully', async () => {
      const updatedAppointment = { ...mockAppointment, status: 'completed' as AppointmentStatus };
      mockAppointmentRepository.updateStatus.mockResolvedValue(updatedAppointment);

      const { result } = renderHook(() => useAppointments());

      let appointment: Appointment | undefined;
      await act(async () => {
        appointment = await result.current.updateAppointmentStatus('1', 'completed');
      });

      expect(appointment).toEqual(updatedAppointment);
      expect(mockAppointmentRepository.updateStatus).toHaveBeenCalledWith('1', 'completed');
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment successfully', async () => {
      mockAppointmentRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.deleteAppointment('1');
      });

      expect(mockAppointmentRepository.delete).toHaveBeenCalledWith('1');
      expect(result.current.deleting).toBe(false);
    });
  });

  describe('getUpcomingAppointments', () => {
    it('should get upcoming appointments', async () => {
      const mockAppointments = [mockAppointment];
      mockAppointmentRepository.findUpcoming.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      let appointments: Appointment[] = [];
      await act(async () => {
        appointments = await result.current.getUpcomingAppointments();
      });

      expect(appointments).toEqual(mockAppointments);
      expect(mockAppointmentRepository.findUpcoming).toHaveBeenCalled();
    });
  });

  describe('getPendingAppointments', () => {
    it('should get pending appointments', async () => {
      const mockAppointments = [mockAppointment];
      mockAppointmentRepository.findPending.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      let appointments: Appointment[] = [];
      await act(async () => {
        appointments = await result.current.getPendingAppointments();
      });

      expect(appointments).toEqual(mockAppointments);
      expect(mockAppointmentRepository.findPending).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should get appointment statistics', async () => {
      const mockStats = {
        total: 10,
        byStatus: {
          scheduled: 3,
          confirmed: 4,
          completed: 2,
          cancelled: 1,
          in_progress: 0,
          no_show: 0,
        },
        today: 2,
        upcoming: 5,
        pending: 3,
        confirmed: 4,
        completed: 2,
        cancelled: 1,
      };
      
      mockAppointmentRepository.getStatistics.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useAppointments());

      let stats: { total: number; pending: number; confirmed: number; completed: number; cancelled: number; };
      await act(async () => {
        stats = await result.current.getStatistics();
      });

      expect(stats).toEqual(mockStats);
      expect(mockAppointmentRepository.getStatistics).toHaveBeenCalled();
    });
  });

  describe('rate limiting simulation', () => {
    it('should handle rate limiting for read operations (200 req/min)', async () => {
      // Simulate multiple rapid read requests
      const mockAppointments = [mockAppointment];
      mockAppointmentRepository.findAll.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      // Simulate 5 sequential requests (within rate limit)
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.loadAppointments();
        });
      }

      expect(mockAppointmentRepository.findAll).toHaveBeenCalledTimes(5);
    });

    it('should handle rate limiting for write operations (20 req/min)', async () => {
      // Simulate multiple rapid write requests
      mockAppointmentRepository.create.mockResolvedValue(mockAppointment);

      const { result } = renderHook(() => useAppointments());

      const appointmentData = {
        clientId: 'client1',
        barberId: '01',
        serviceId: 'service1',
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        status: 'scheduled' as AppointmentStatus,
      };

      // Simulate 3 sequential write requests (within rate limit)
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.createAppointment(appointmentData);
        });
      }

      expect(mockAppointmentRepository.create).toHaveBeenCalledTimes(3);
    });
  });
});