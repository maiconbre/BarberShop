/**
 * Multi-tenant hooks integration tests
 * Tests the interaction between hooks and repositories with tenant isolation
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { 
  setupMultiTenantTest, 
  MultiTenantTestMocks,
  createMockTenantProvider,
  switchTenant
} from '../../utils/multiTenantTestUtils';
import { testBarbershops } from '../../fixtures/tenantFixtures';

// Import hooks to test
import { useBarbers } from '../../../hooks/useBarbers';
import { useServices } from '../../../hooks/useServices';
import { useAppointments } from '../../../hooks/useAppointments';
import { useComments } from '../../../hooks/useComments';

// Mock the service factory
vi.mock('../../../services/ServiceFactory', () => ({
  useBarberRepository: () => MultiTenantTestMocks.createTenantAwareApiMock(),
  useServiceRepository: () => MultiTenantTestMocks.createTenantAwareApiMock(),
  useAppointmentRepository: () => MultiTenantTestMocks.createTenantAwareApiMock(),
  useCommentRepository: () => MultiTenantTestMocks.createTenantAwareApiMock()
}));

// Mock TenantContext
const mockTenantContext = createMockTenantProvider();
vi.mock('../../../contexts/TenantContext', () => ({
  useTenant: () => mockTenantContext
}));

// Test tenant IDs
const TEST_TENANT_IDS = ['bb-alpha-123', 'bb-beta-456', 'bb-gamma-789'];

describe('Multi-Tenant Hooks Integration', () => {
  setupMultiTenantTest(TEST_TENANT_IDS);

  describe('useBarbers Hook', () => {
    it('should fetch barbers for specific tenant only', async () => {
      // Setup tenant context for Alpha
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const { result } = renderHook(() => useBarbers());
      
      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should have Alpha's barbers only
      expect(result.current.barbers).toHaveLength(2);
      expect(result.current.barbers[0].id).toContain('alpha');
      expect(result.current.barbers[1].id).toContain('alpha');
      
      // Should not contain other tenants' data
      result.current.barbers.forEach(barber => {
        expect(barber.id).not.toContain('beta');
        expect(barber.id).not.toContain('gamma');
      });
    });

    it('should switch data when tenant changes', async () => {
      // Start with Alpha tenant
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const { result, rerender } = renderHook(() => useBarbers());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should have Alpha's data
      expect(result.current.barbers).toHaveLength(2);
      expect(result.current.barbers[0].id).toContain('alpha');
      
      // Switch to Beta tenant
      await switchTenant(mockTenantContext, 'barbershop-beta');
      rerender();
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should now have Beta's data
      expect(result.current.barbers).toHaveLength(1);
      expect(result.current.barbers[0].id).toContain('beta');
    });

    it('should handle tenant-specific barber operations', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const { result } = renderHook(() => useBarbers());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Test create barber
      const newBarberData = {
        name: 'New Alpha Barber',
        email: 'new@alpha.com',
        phone: '+5511999999999',
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
      
      await result.current.createBarber(newBarberData);
      
      // Should create with tenant-specific ID
      expect(result.current.barbers.some(b => b.name === 'New Alpha Barber')).toBe(true);
    });

    it('should isolate barber search by tenant', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const { result } = renderHook(() => useBarbers());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Search for barbers
      const searchResults = await result.current.searchBarbers('João');
      
      // Should only find Alpha's João
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('João Alpha');
      expect(searchResults[0].id).toContain('alpha');
    });
  });

  describe('useServices Hook', () => {
    it('should fetch services for specific tenant only', async () => {
      await switchTenant(mockTenantContext, 'barbershop-gamma');
      
      const { result } = renderHook(() => useServices());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Gamma should have 3 services
      expect(result.current.services).toHaveLength(3);
      result.current.services.forEach(service => {
        expect(service.id).toContain('gamma');
      });
    });

    it('should handle tenant-specific service filtering', async () => {
      await switchTenant(mockTenantContext, 'barbershop-gamma');
      
      const { result } = renderHook(() => useServices());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Filter by category
      const corteServices = result.current.services.filter(s => s.category === 'Corte');
      expect(corteServices).toHaveLength(1);
      expect(corteServices[0].name).toBe('Corte Premium Gamma');
      
      const barbaServices = result.current.services.filter(s => s.category === 'Barba');
      expect(barbaServices).toHaveLength(1);
      expect(barbaServices[0].name).toBe('Barba Premium Gamma');
    });

    it('should create services with tenant isolation', async () => {
      await switchTenant(mockTenantContext, 'barbershop-beta');
      
      const { result } = renderHook(() => useServices());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const newServiceData = {
        name: 'New Beta Service',
        description: 'Beta exclusive service',
        duration: 30,
        price: 25.00,
        category: 'Corte',
        isActive: true
      };
      
      await result.current.createService(newServiceData);
      
      // Should be created with tenant context
      expect(result.current.services.some(s => s.name === 'New Beta Service')).toBe(true);
    });
  });

  describe('useAppointments Hook', () => {
    it('should fetch appointments for specific tenant only', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const { result } = renderHook(() => useAppointments());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Alpha should have 2 appointments
      expect(result.current.appointments).toHaveLength(2);
      result.current.appointments.forEach(appointment => {
        expect(appointment.id).toContain('alpha');
      });
    });

    it('should handle tenant-specific appointment filtering', async () => {
      await switchTenant(mockTenantContext, 'barbershop-gamma');
      
      const { result } = renderHook(() => useAppointments());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Filter by status
      const scheduledAppointments = result.current.appointments.filter(a => a.status === 'scheduled');
      expect(scheduledAppointments).toHaveLength(1);
      
      const completedAppointments = result.current.appointments.filter(a => a.status === 'completed');
      expect(completedAppointments).toHaveLength(1);
    });

    it('should create appointments with tenant context', async () => {
      await switchTenant(mockTenantContext, 'barbershop-beta');
      
      const { result } = renderHook(() => useAppointments());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const newAppointmentData = {
        userId: 'user-beta-test',
        serviceId: 'service-beta-01',
        barberId: 'barber-beta-01',
        date: new Date('2024-02-15T10:00:00Z'),
        notes: 'Test appointment for Beta'
      };
      
      await result.current.createAppointment(newAppointmentData);
      
      // Should be created with tenant-specific ID
      expect(result.current.appointments.some(a => a.notes === 'Test appointment for Beta')).toBe(true);
    });

    it('should handle appointment status updates within tenant', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const { result } = renderHook(() => useAppointments());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const appointmentToUpdate = result.current.appointments[0];
      await result.current.updateAppointmentStatus(appointmentToUpdate.id, 'completed');
      
      // Should update within tenant context
      const updatedAppointment = result.current.appointments.find(a => a.id === appointmentToUpdate.id);
      expect(updatedAppointment?.status).toBe('completed');
    });
  });

  describe('useComments Hook', () => {
    it('should fetch comments for specific tenant only', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const { result } = renderHook(() => useComments());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Alpha should have 2 comments
      expect(result.current.comments).toHaveLength(2);
      result.current.comments.forEach(comment => {
        expect(comment.id).toContain('alpha');
      });
    });

    it('should handle tenant-specific comment status filtering', async () => {
      await switchTenant(mockTenantContext, 'barbershop-gamma');
      
      const { result } = renderHook(() => useComments());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Load comments by status
      await result.current.loadCommentsByStatus('approved');
      const approvedComments = result.current.comments.filter(c => c.status === 'approved');
      expect(approvedComments).toHaveLength(1);
      
      await result.current.loadCommentsByStatus('rejected');
      const rejectedComments = result.current.comments.filter(c => c.status === 'rejected');
      expect(rejectedComments).toHaveLength(1);
    });

    it('should create comments with tenant context', async () => {
      await switchTenant(mockTenantContext, 'barbershop-beta');
      
      const { result } = renderHook(() => useComments());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const newCommentData = {
        name: 'Beta Customer',
        comment: 'Great service at Beta!'
      };
      
      await result.current.createComment(newCommentData);
      
      // Should be created with tenant context
      expect(result.current.comments.some(c => c.comment === 'Great service at Beta!')).toBe(true);
    });

    it('should handle admin operations within tenant', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const { result } = renderHook(() => useComments());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Load all comments for admin (should be tenant-specific)
      await result.current.loadAllCommentsForAdmin();
      
      // Should only see Alpha's comments
      expect(result.current.comments).toHaveLength(2);
      result.current.comments.forEach(comment => {
        expect(comment.id).toContain('alpha');
      });
      
      // Update comment status
      const pendingComment = result.current.comments.find(c => c.status === 'pending');
      if (pendingComment) {
        await result.current.updateCommentStatus(pendingComment.id, 'approved');
        
        const updatedComment = result.current.comments.find(c => c.id === pendingComment.id);
        expect(updatedComment?.status).toBe('approved');
      }
    });
  });

  describe('Cross-Hook Tenant Consistency', () => {
    it('should maintain tenant consistency across multiple hooks', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const barbersHook = renderHook(() => useBarbers());
      const servicesHook = renderHook(() => useServices());
      const appointmentsHook = renderHook(() => useAppointments());
      
      await waitFor(() => {
        expect(barbersHook.result.current.loading).toBe(false);
        expect(servicesHook.result.current.loading).toBe(false);
        expect(appointmentsHook.result.current.loading).toBe(false);
      });
      
      // All hooks should return Alpha data only
      barbersHook.result.current.barbers.forEach(barber => {
        expect(barber.id).toContain('alpha');
      });
      
      servicesHook.result.current.services.forEach(service => {
        expect(service.id).toContain('alpha');
      });
      
      appointmentsHook.result.current.appointments.forEach(appointment => {
        expect(appointment.id).toContain('alpha');
      });
    });

    it('should handle tenant switching across all hooks', async () => {
      // Start with Alpha
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      
      const barbersHook = renderHook(() => useBarbers());
      const servicesHook = renderHook(() => useServices());
      
      await waitFor(() => {
        expect(barbersHook.result.current.loading).toBe(false);
        expect(servicesHook.result.current.loading).toBe(false);
      });
      
      // Verify Alpha data
      expect(barbersHook.result.current.barbers).toHaveLength(2);
      expect(servicesHook.result.current.services).toHaveLength(2);
      
      // Switch to Gamma
      await switchTenant(mockTenantContext, 'barbershop-gamma');
      barbersHook.rerender();
      servicesHook.rerender();
      
      await waitFor(() => {
        expect(barbersHook.result.current.loading).toBe(false);
        expect(servicesHook.result.current.loading).toBe(false);
      });
      
      // Verify Gamma data
      expect(barbersHook.result.current.barbers).toHaveLength(1);
      expect(servicesHook.result.current.services).toHaveLength(3);
      
      // Ensure no Alpha data remains
      barbersHook.result.current.barbers.forEach(barber => {
        expect(barber.id).not.toContain('alpha');
        expect(barber.id).toContain('gamma');
      });
    });
  });

  describe('Error Handling with Tenant Context', () => {
    it('should handle errors when tenant context is missing', async () => {
      // Clear tenant context
      mockTenantContext.clearTenant();
      
      const { result } = renderHook(() => useBarbers());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should handle missing tenant gracefully
      expect(result.current.error).toBeDefined();
      expect(result.current.barbers).toHaveLength(0);
    });

    it('should handle invalid tenant context', async () => {
      // Set invalid tenant
      mockTenantContext.barbershopId = 'invalid-tenant-id';
      mockTenantContext.slug = 'invalid-slug';
      
      const { result } = renderHook(() => useServices());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should handle invalid tenant gracefully
      expect(result.current.error).toBeDefined();
      expect(result.current.services).toHaveLength(0);
    });
  });
});