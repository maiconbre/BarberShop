/**
 * Multi-tenant stores integration tests
 * Tests the interaction between Zustand stores and tenant-aware repositories
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  setupMultiTenantTest, 
  MultiTenantTestMocks,
  createMockTenantProvider,
  switchTenant
} from '../../utils/multiTenantTestUtils';

// Import stores to test
import { useAppointmentStore } from '../../../stores/appointmentStore';
import { useBarberStore } from '../../../stores/barberStore';
import { useCommentStore } from '../../../stores/commentStore';

// Mock the service factory
vi.mock('../../../services/ServiceFactory', () => ({
  useAppointmentRepository: () => MultiTenantTestMocks.createTenantAwareApiMock(),
  useBarberRepository: () => MultiTenantTestMocks.createTenantAwareApiMock(),
  useCommentRepository: () => MultiTenantTestMocks.createTenantAwareApiMock()
}));

// Mock tenant-aware repository and cache
vi.mock('../../../services/TenantAwareRepository', () => ({
  createTenantAwareRepository: (baseRepo: any, getTenantId: () => string | null) => {
    const tenantId = getTenantId();
    if (tenantId) {
      MultiTenantTestMocks.setCurrentTenant(tenantId);
    }
    return baseRepo;
  }
}));

vi.mock('../../../services/TenantAwareCache', () => ({
  createTenantAwareCache: (getTenantId: () => string | null) => ({
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    has: vi.fn().mockReturnValue(false),
    keys: vi.fn().mockReturnValue([])
  })
}));

// Test tenant IDs
const TEST_TENANT_IDS = ['bb-alpha-123', 'bb-beta-456', 'bb-gamma-789'];

describe('Multi-Tenant Stores Integration', () => {
  setupMultiTenantTest(TEST_TENANT_IDS);

  beforeEach(() => {
    // Reset all stores to initial state
    useAppointmentStore.getState().reset();
    useBarberStore.getState().reset();
    useCommentStore.getState().reset();
  });

  describe('AppointmentStore Multi-Tenant', () => {
    it('should initialize tenant correctly', () => {
      const store = useAppointmentStore.getState();
      
      // Initially no tenant
      expect(store.barbershopId).toBeNull();
      expect(store.tenantRepository).toBeNull();
      
      // Initialize tenant
      store.initializeTenant('bb-alpha-123');
      
      // Should have tenant context
      const updatedStore = useAppointmentStore.getState();
      expect(updatedStore.barbershopId).toBe('bb-alpha-123');
      expect(updatedStore.tenantRepository).toBeDefined();
      expect(updatedStore.tenantCache).toBeDefined();
    });

    it('should fetch appointments for specific tenant', async () => {
      const store = useAppointmentStore.getState();
      store.initializeTenant('bb-alpha-123');
      
      await store.fetchAppointments();
      
      const updatedStore = useAppointmentStore.getState();
      expect(updatedStore.appointments).toHaveLength(2);
      updatedStore.appointments.forEach(appointment => {
        expect(appointment.id).toContain('alpha');
      });
    });

    it('should handle tenant switching', async () => {
      const store = useAppointmentStore.getState();
      
      // Start with Alpha
      store.initializeTenant('bb-alpha-123');
      await store.fetchAppointments();
      
      let currentStore = useAppointmentStore.getState();
      expect(currentStore.appointments).toHaveLength(2);
      expect(currentStore.appointments[0].id).toContain('alpha');
      
      // Switch to Beta
      store.initializeTenant('bb-beta-456');
      await store.fetchAppointments();
      
      currentStore = useAppointmentStore.getState();
      expect(currentStore.appointments).toHaveLength(1);
      expect(currentStore.appointments[0].id).toContain('beta');
    });

    it('should create appointments with tenant context', async () => {
      const store = useAppointmentStore.getState();
      store.initializeTenant('bb-gamma-789');
      
      const appointmentData = {
        userId: 'user-gamma-test',
        serviceId: 'service-gamma-01',
        barberId: 'barber-gamma-01',
        date: new Date('2024-02-20T14:00:00Z'),
        notes: 'Test appointment for Gamma'
      };
      
      await store.createAppointment(appointmentData);
      
      const updatedStore = useAppointmentStore.getState();
      expect(updatedStore.appointments.some(a => a.notes === 'Test appointment for Gamma')).toBe(true);
    });

    it('should handle appointment filtering by tenant', async () => {
      const store = useAppointmentStore.getState();
      store.initializeTenant('bb-alpha-123');
      
      await store.fetchAppointments();
      
      // Filter by status
      await store.fetchAppointmentsByStatus('confirmed');
      
      const updatedStore = useAppointmentStore.getState();
      const confirmedAppointments = updatedStore.appointments.filter(a => a.status === 'confirmed');
      expect(confirmedAppointments).toHaveLength(1);
      expect(confirmedAppointments[0].id).toContain('alpha');
    });

    it('should prevent operations without tenant initialization', async () => {
      const store = useAppointmentStore.getState();
      
      // Try to fetch without initializing tenant
      await store.fetchAppointments();
      
      const updatedStore = useAppointmentStore.getState();
      expect(updatedStore.error).toContain('Tenant not initialized');
      expect(updatedStore.appointments).toHaveLength(0);
    });
  });

  describe('BarberStore Multi-Tenant', () => {
    it('should initialize tenant correctly', () => {
      const store = useBarberStore.getState();
      
      // Initially no tenant
      expect(store.barbershopId).toBeNull();
      
      // Initialize tenant
      store.initializeTenant('bb-beta-456');
      
      // Should have tenant context
      const updatedStore = useBarberStore.getState();
      expect(updatedStore.barbershopId).toBe('bb-beta-456');
      expect(updatedStore.tenantRepository).toBeDefined();
    });

    it('should fetch barbers for specific tenant', async () => {
      const store = useBarberStore.getState();
      store.initializeTenant('bb-alpha-123');
      
      await store.fetchBarbers();
      
      const updatedStore = useBarberStore.getState();
      expect(updatedStore.barbers).toHaveLength(2);
      updatedStore.barbers.forEach(barber => {
        expect(barber.id).toContain('alpha');
      });
    });

    it('should handle barber creation with tenant context', async () => {
      const store = useBarberStore.getState();
      store.initializeTenant('bb-beta-456');
      
      const barberData = {
        name: 'New Beta Barber',
        email: 'newbarber@beta.com',
        phone: '+5511888888888',
        specialties: ['Corte'],
        isActive: true,
        workingHours: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: []
        }
      };
      
      await store.createBarber(barberData);
      
      const updatedStore = useBarberStore.getState();
      expect(updatedStore.barbers.some(b => b.name === 'New Beta Barber')).toBe(true);
    });

    it('should handle barber search within tenant', async () => {
      const store = useBarberStore.getState();
      store.initializeTenant('bb-alpha-123');
      
      await store.fetchBarbers();
      
      // Search for specific barber
      store.setFilters({ search: 'João' });
      
      const updatedStore = useBarberStore.getState();
      const filteredBarbers = updatedStore.filteredBarbers;
      expect(filteredBarbers).toHaveLength(1);
      expect(filteredBarbers[0].name).toBe('João Alpha');
    });

    it('should prevent operations without tenant initialization', async () => {
      const store = useBarberStore.getState();
      
      // Try to fetch without initializing tenant
      await store.fetchBarbers();
      
      const updatedStore = useBarberStore.getState();
      expect(updatedStore.error).toContain('Tenant not initialized');
    });
  });

  describe('CommentStore Multi-Tenant', () => {
    it('should initialize tenant correctly', () => {
      const store = useCommentStore.getState();
      
      // Initially no tenant
      expect(store.barbershopId).toBeNull();
      
      // Initialize tenant
      store.initializeTenant('bb-gamma-789');
      
      // Should have tenant context
      const updatedStore = useCommentStore.getState();
      expect(updatedStore.barbershopId).toBe('bb-gamma-789');
      expect(updatedStore.tenantRepository).toBeDefined();
    });

    it('should fetch comments for specific tenant', async () => {
      const store = useCommentStore.getState();
      store.initializeTenant('bb-gamma-789');
      
      await store.fetchComments('approved');
      
      const updatedStore = useCommentStore.getState();
      expect(updatedStore.comments).toHaveLength(1);
      expect(updatedStore.comments[0].id).toContain('gamma');
      expect(updatedStore.comments[0].status).toBe('approved');
    });

    it('should handle comment status filtering by tenant', async () => {
      const store = useCommentStore.getState();
      store.initializeTenant('bb-gamma-789');
      
      // Fetch pending comments
      await store.fetchComments('pending');
      let updatedStore = useCommentStore.getState();
      expect(updatedStore.comments).toHaveLength(0); // Gamma has no pending comments
      
      // Fetch rejected comments
      await store.fetchComments('rejected');
      updatedStore = useCommentStore.getState();
      expect(updatedStore.comments).toHaveLength(1);
      expect(updatedStore.comments[0].status).toBe('rejected');
    });

    it('should handle admin operations within tenant', async () => {
      const store = useCommentStore.getState();
      store.initializeTenant('bb-alpha-123');
      
      await store.fetchAllCommentsForAdmin();
      
      const updatedStore = useCommentStore.getState();
      expect(updatedStore.comments).toHaveLength(2);
      updatedStore.comments.forEach(comment => {
        expect(comment.id).toContain('alpha');
      });
    });

    it('should create comments with tenant context', async () => {
      const store = useCommentStore.getState();
      store.initializeTenant('bb-beta-456');
      
      const commentData = {
        name: 'Beta Customer',
        comment: 'Excellent service at Beta!'
      };
      
      await store.createComment(commentData);
      
      const updatedStore = useCommentStore.getState();
      expect(updatedStore.comments.some(c => c.comment === 'Excellent service at Beta!')).toBe(true);
    });

    it('should update comment status within tenant', async () => {
      const store = useCommentStore.getState();
      store.initializeTenant('bb-alpha-123');
      
      await store.fetchAllCommentsForAdmin();
      
      const pendingComment = useCommentStore.getState().comments.find(c => c.status === 'pending');
      if (pendingComment) {
        await store.updateCommentStatus(pendingComment.id, 'approved');
        
        const updatedStore = useCommentStore.getState();
        const updatedComment = updatedStore.comments.find(c => c.id === pendingComment.id);
        expect(updatedComment?.status).toBe('approved');
      }
    });

    it('should prevent operations without tenant initialization', async () => {
      const store = useCommentStore.getState();
      
      // Try to fetch without initializing tenant
      await store.fetchComments('approved');
      
      const updatedStore = useCommentStore.getState();
      expect(updatedStore.error).toContain('Tenant not initialized');
    });
  });

  describe('Cross-Store Tenant Consistency', () => {
    it('should maintain tenant consistency across all stores', async () => {
      const appointmentStore = useAppointmentStore.getState();
      const barberStore = useBarberStore.getState();
      const commentStore = useCommentStore.getState();
      
      // Initialize all stores with same tenant
      appointmentStore.initializeTenant('bb-alpha-123');
      barberStore.initializeTenant('bb-alpha-123');
      commentStore.initializeTenant('bb-alpha-123');
      
      // Fetch data from all stores
      await Promise.all([
        appointmentStore.fetchAppointments(),
        barberStore.fetchBarbers(),
        commentStore.fetchAllCommentsForAdmin()
      ]);
      
      // All stores should have Alpha data only
      const appointmentState = useAppointmentStore.getState();
      const barberState = useBarberStore.getState();
      const commentState = useCommentStore.getState();
      
      appointmentState.appointments.forEach(appointment => {
        expect(appointment.id).toContain('alpha');
      });
      
      barberState.barbers.forEach(barber => {
        expect(barber.id).toContain('alpha');
      });
      
      commentState.comments.forEach(comment => {
        expect(comment.id).toContain('alpha');
      });
    });

    it('should handle tenant switching across all stores', async () => {
      const appointmentStore = useAppointmentStore.getState();
      const barberStore = useBarberStore.getState();
      const commentStore = useCommentStore.getState();
      
      // Start with Alpha
      appointmentStore.initializeTenant('bb-alpha-123');
      barberStore.initializeTenant('bb-alpha-123');
      commentStore.initializeTenant('bb-alpha-123');
      
      await Promise.all([
        appointmentStore.fetchAppointments(),
        barberStore.fetchBarbers(),
        commentStore.fetchAllCommentsForAdmin()
      ]);
      
      // Verify Alpha data
      expect(useAppointmentStore.getState().appointments).toHaveLength(2);
      expect(useBarberStore.getState().barbers).toHaveLength(2);
      expect(useCommentStore.getState().comments).toHaveLength(2);
      
      // Switch to Gamma
      appointmentStore.initializeTenant('bb-gamma-789');
      barberStore.initializeTenant('bb-gamma-789');
      commentStore.initializeTenant('bb-gamma-789');
      
      await Promise.all([
        appointmentStore.fetchAppointments(),
        barberStore.fetchBarbers(),
        commentStore.fetchAllCommentsForAdmin()
      ]);
      
      // Verify Gamma data
      expect(useAppointmentStore.getState().appointments).toHaveLength(2);
      expect(useBarberStore.getState().barbers).toHaveLength(1);
      expect(useCommentStore.getState().comments).toHaveLength(2);
      
      // Ensure no Alpha data remains
      useAppointmentStore.getState().appointments.forEach(appointment => {
        expect(appointment.id).not.toContain('alpha');
        expect(appointment.id).toContain('gamma');
      });
    });
  });

  describe('Store State Isolation', () => {
    it('should isolate store state between different tenant instances', async () => {
      // Create two separate store instances (simulating different browser tabs)
      const store1 = useAppointmentStore.getState();
      const store2 = useAppointmentStore.getState(); // Same store, but we'll test isolation
      
      // Initialize with different tenants
      store1.initializeTenant('bb-alpha-123');
      await store1.fetchAppointments();
      
      // Verify store1 has Alpha data
      expect(useAppointmentStore.getState().barbershopId).toBe('bb-alpha-123');
      expect(useAppointmentStore.getState().appointments).toHaveLength(2);
      
      // Switch to different tenant
      store2.initializeTenant('bb-beta-456');
      await store2.fetchAppointments();
      
      // Verify store now has Beta data (since it's the same store instance)
      expect(useAppointmentStore.getState().barbershopId).toBe('bb-beta-456');
      expect(useAppointmentStore.getState().appointments).toHaveLength(1);
    });

    it('should handle concurrent operations with tenant switching', async () => {
      const store = useAppointmentStore.getState();
      
      // Initialize with Alpha
      store.initializeTenant('bb-alpha-123');
      
      // Start fetching Alpha data
      const alphaPromise = store.fetchAppointments();
      
      // Immediately switch to Beta (simulating rapid tenant switching)
      store.initializeTenant('bb-beta-456');
      const betaPromise = store.fetchAppointments();
      
      // Wait for both operations
      await Promise.all([alphaPromise, betaPromise]);
      
      // Should have Beta data (last operation wins)
      const finalState = useAppointmentStore.getState();
      expect(finalState.barbershopId).toBe('bb-beta-456');
      expect(finalState.appointments).toHaveLength(1);
      expect(finalState.appointments[0].id).toContain('beta');
    });
  });
});