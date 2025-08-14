/**
 * Basic tests for multi-tenant store functionality
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppointmentStore } from '../appointmentStore';
import { useBarberStore } from '../barberStore';
import { useCommentStore } from '../commentStore';

// Mock the service factory and tenant-aware services
vi.mock('@/services/ServiceFactory', () => ({
  useAppointmentRepository: () => ({
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
  useBarberRepository: () => ({
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
  useCommentRepository: () => ({
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../services/TenantAwareRepository', () => ({
  createTenantAwareRepository: (baseRepo: any) => baseRepo,
}));

vi.mock('../services/TenantAwareCache', () => ({
  createTenantAwareCache: () => ({
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    clearTenantCache: vi.fn(),
  }),
}));

describe('Multi-tenant Stores', () => {
  beforeEach(() => {
    // Reset appointment store
    useAppointmentStore.setState({
      appointments: [],
      currentAppointment: null,
      isLoading: false,
      error: null,
      filters: {
        status: undefined,
        barberId: undefined,
        serviceId: undefined,
        startDate: undefined,
        endDate: undefined,
        search: undefined,
      },
      barbershopId: null,
      tenantRepository: null,
      tenantCache: null,
    });
    
    // Reset barber store
    useBarberStore.getState().reset();
    
    // Reset comment store
    useCommentStore.setState({
      comments: { pending: [], approved: [], rejected: [] },
      isLoading: false,
      error: null,
      barbershopId: null,
      tenantRepository: null,
      tenantCache: null,
    });
  });

  describe('AppointmentStore', () => {
    it('should initialize with default state', () => {
      const state = useAppointmentStore.getState();
      
      expect(state.appointments).toEqual([]);
      expect(state.currentAppointment).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.barbershopId).toBeNull();
      expect(state.tenantRepository).toBeNull();
      expect(state.tenantCache).toBeNull();
    });

    it('should initialize tenant correctly', () => {
      const { initializeTenant } = useAppointmentStore.getState();
      const testBarbershopId = 'test-barbershop-123';
      
      initializeTenant(testBarbershopId);
      
      const state = useAppointmentStore.getState();
      expect(state.barbershopId).toBe(testBarbershopId);
      expect(state.tenantRepository).toBeDefined();
      expect(state.tenantCache).toBeDefined();
    });

    it('should handle error when tenant not initialized', async () => {
      const { fetchAppointments } = useAppointmentStore.getState();
      
      // Ensure store is in initial state
      expect(useAppointmentStore.getState().barbershopId).toBeNull();
      expect(useAppointmentStore.getState().tenantRepository).toBeNull();
      
      // The function should return early and set error
      await fetchAppointments();
      
      const state = useAppointmentStore.getState();
      expect(state.error).toBe('Tenant not initialized. Call initializeTenant first.');
    });
  });

  describe('BarberStore', () => {
    it('should initialize with default state', () => {
      const state = useBarberStore.getState();
      
      expect(state.barbers).toEqual([]);
      expect(state.currentBarber).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.barbershopId).toBeNull();
      expect(state.tenantRepository).toBeNull();
      expect(state.tenantCache).toBeNull();
    });

    it('should initialize tenant correctly', () => {
      const { initializeTenant } = useBarberStore.getState();
      const testBarbershopId = 'test-barbershop-123';
      
      initializeTenant(testBarbershopId);
      
      const state = useBarberStore.getState();
      expect(state.barbershopId).toBe(testBarbershopId);
      expect(state.tenantRepository).toBeDefined();
      expect(state.tenantCache).toBeDefined();
    });

    it('should handle error when tenant not initialized', async () => {
      const { fetchBarbers } = useBarberStore.getState();
      
      await fetchBarbers();
      
      const state = useBarberStore.getState();
      expect(state.error).toBe('Tenant not initialized. Call initializeTenant first.');
    });
  });

  describe('CommentStore', () => {
    it('should initialize with default state', () => {
      const state = useCommentStore.getState();
      
      expect(state.comments).toEqual({
        pending: [],
        approved: [],
        rejected: []
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.barbershopId).toBeNull();
      expect(state.tenantRepository).toBeNull();
      expect(state.tenantCache).toBeNull();
    });

    it('should initialize tenant correctly', () => {
      const { initializeTenant } = useCommentStore.getState();
      const testBarbershopId = 'test-barbershop-123';
      
      initializeTenant(testBarbershopId);
      
      const state = useCommentStore.getState();
      expect(state.barbershopId).toBe(testBarbershopId);
      expect(state.tenantRepository).toBeDefined();
      expect(state.tenantCache).toBeDefined();
    });

    it('should handle error when tenant not initialized', async () => {
      const { fetchComments } = useCommentStore.getState();
      
      await fetchComments('pending');
      
      const state = useCommentStore.getState();
      expect(state.error).toBe('Tenant not initialized. Call initializeTenant first.');
    });
  });

  describe('Store State Access', () => {
    it('should provide tenant status via getState', () => {
      const initialState = useAppointmentStore.getState();
      
      expect(initialState.barbershopId).toBeNull();
      expect(Boolean(initialState.barbershopId && initialState.tenantRepository)).toBe(false);
      
      // Initialize tenant
      useAppointmentStore.getState().initializeTenant('test-123');
      
      const updatedState = useAppointmentStore.getState();
      
      expect(updatedState.barbershopId).toBe('test-123');
      expect(Boolean(updatedState.barbershopId && updatedState.tenantRepository)).toBe(true);
    });
  });
});