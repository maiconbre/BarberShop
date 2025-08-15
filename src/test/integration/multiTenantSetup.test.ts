/**
 * Multi-tenant test environment validation
 * Ensures the test setup correctly isolates tenant data
 */

import { describe, it, expect } from 'vitest';
import { 
  setupMultiTenantTest, 
  MultiTenantTestMocks,
  testTenantIsolation,
  createMockTenantProvider,
  switchTenant,
  validateTenantBoundaries
} from '../utils/multiTenantTestUtils';
import {  getTenantTestData } from '../fixtures/tenantFixtures';

// Test tenant IDs
const TEST_TENANT_IDS = ['bb-alpha-123', 'bb-beta-456', 'bb-gamma-789'];

describe('Multi-Tenant Test Environment', () => {
  setupMultiTenantTest(TEST_TENANT_IDS);

  describe('Tenant Data Fixtures', () => {
    it('should provide isolated test data for each tenant', () => {
      TEST_TENANT_IDS.forEach(tenantId => {
        const tenantData = getTenantTestData(tenantId);
        
        expect(tenantData).toBeDefined();
        expect(tenantData.barbershop).toBeDefined();
        expect(tenantData.barbershop?.id).toBe(tenantId);
        expect(tenantData.barbers).toBeInstanceOf(Array);
        expect(tenantData.services).toBeInstanceOf(Array);
        expect(tenantData.appointments).toBeInstanceOf(Array);
        expect(tenantData.comments).toBeInstanceOf(Array);
      });
    });

    it('should ensure data uniqueness between tenants', () => {
      const allTenantData = TEST_TENANT_IDS.map(id => getTenantTestData(id));
      
      // Check that no two tenants share the same barber IDs
      const allBarberIds = allTenantData.flatMap(data => data.barbers.map(b => b.id));
      const uniqueBarberIds = new Set(allBarberIds);
      expect(allBarberIds.length).toBe(uniqueBarberIds.size);
      
      // Check that no two tenants share the same service IDs
      const allServiceIds = allTenantData.flatMap(data => data.services.map(s => s.id));
      const uniqueServiceIds = new Set(allServiceIds);
      expect(allServiceIds.length).toBe(uniqueServiceIds.size);
      
      // Check that no two tenants share the same appointment IDs
      const allAppointmentIds = allTenantData.flatMap(data => data.appointments.map(a => a.id));
      const uniqueAppointmentIds = new Set(allAppointmentIds);
      expect(allAppointmentIds.length).toBe(uniqueAppointmentIds.size);
    });

    it('should validate tenant-specific ID patterns', () => {
      TEST_TENANT_IDS.forEach(tenantId => {
        const tenantData = getTenantTestData(tenantId);
        const tenantIdentifier = tenantId.split('-')[1]; // e.g., 'alpha', 'beta', 'gamma'
        
        // Validate barber IDs contain tenant identifier
        tenantData.barbers.forEach(barber => {
          expect(barber.id).toContain(tenantIdentifier);
        });
        
        // Validate service IDs contain tenant identifier
        tenantData.services.forEach(service => {
          expect(service.id).toContain(tenantIdentifier);
        });
        
        // Validate appointment IDs contain tenant identifier
        tenantData.appointments.forEach(appointment => {
          expect(appointment.id).toContain(tenantIdentifier);
        });
      });
    });
  });

  describe('Multi-Tenant Test Mocks', () => {
    it('should setup and clear tenant data correctly', () => {
      // Clear any existing data
      MultiTenantTestMocks.clear();
      expect(MultiTenantTestMocks.getCurrentTenant()).toBeNull();
      
      // Setup tenant data
      MultiTenantTestMocks.setupTenantData(TEST_TENANT_IDS);
      
      // Set current tenant
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');
      expect(MultiTenantTestMocks.getCurrentTenant()).toBe('bb-alpha-123');
      
      // Get current tenant data
      const tenantData = MultiTenantTestMocks.getCurrentTenantData();
      expect(tenantData).toBeDefined();
      expect(tenantData.barbershop.id).toBe('bb-alpha-123');
    });

    it('should create tenant-aware API mock', async () => {
      MultiTenantTestMocks.setupTenantData(TEST_TENANT_IDS);
      const apiMock = MultiTenantTestMocks.createTenantAwareApiMock();
      
      // Test with first tenant
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');
      const alphaBarbers = await apiMock.get('/api/barbers');
      expect(alphaBarbers).toHaveLength(2);
      expect(alphaBarbers[0].id).toContain('alpha');
      
      // Test with second tenant
      MultiTenantTestMocks.setCurrentTenant('bb-beta-456');
      const betaBarbers = await apiMock.get('/api/barbers');
      expect(betaBarbers).toHaveLength(1);
      expect(betaBarbers[0].id).toContain('beta');
      
      // Ensure no data leakage
      expect(alphaBarbers[0].id).not.toBe(betaBarbers[0].id);
    });

    it('should enforce tenant context requirement', async () => {
      const apiMock = MultiTenantTestMocks.createTenantAwareApiMock();
      
      // Clear tenant context
      MultiTenantTestMocks.setCurrentTenant(null);
      
      // Should throw error when no tenant context
      await expect(apiMock.get('/api/barbers')).rejects.toThrow('No tenant context available');
    });

    it('should handle CRUD operations with tenant isolation', async () => {
      MultiTenantTestMocks.setupTenantData(TEST_TENANT_IDS);
      const apiMock = MultiTenantTestMocks.createTenantAwareApiMock();
      
      // Test CREATE with tenant context
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');
      const newBarber = await apiMock.post('/api/barbers', {
        name: 'New Barber Alpha',
        phone: '+5511999999999'
      });
      
      expect(newBarber.id).toContain('bb-alpha-123');
      expect(newBarber.name).toBe('New Barber Alpha');
      
      // Test UPDATE with tenant context
      const updatedBarber = await apiMock.patch('/api/barbers/barber-alpha-01', {
        name: 'Updated Barber Alpha'
      });
      
      expect(updatedBarber.name).toBe('Updated Barber Alpha');
      expect(updatedBarber.updatedAt).toBeInstanceOf(Date);
      
      // Test DELETE
      await expect(apiMock.delete('/api/barbers/barber-alpha-01')).resolves.toBeUndefined();
    });
  });

  describe('Tenant Isolation Testing', () => {
    it('should validate tenant isolation for barbers', async () => {
      MultiTenantTestMocks.setupTenantData(TEST_TENANT_IDS);
      const apiMock = MultiTenantTestMocks.createTenantAwareApiMock();
      
      const results = await testTenantIsolation(
        async (tenantId: string) => {
          MultiTenantTestMocks.setCurrentTenant(tenantId);
          return await apiMock.get('/api/barbers');
        },
        TEST_TENANT_IDS,
        'barbers'
      );
      
      // Verify each tenant has different data
      expect(results['bb-alpha-123']).toHaveLength(2);
      expect(results['bb-beta-456']).toHaveLength(1);
      expect(results['bb-gamma-789']).toHaveLength(1);
      
      // Verify no ID overlap
      const allIds = Object.values(results).flat().map((barber: any) => barber.id);
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size);
    });

    it('should validate tenant isolation for services', async () => {
      MultiTenantTestMocks.setupTenantData(TEST_TENANT_IDS);
      const apiMock = MultiTenantTestMocks.createTenantAwareApiMock();
      
      const results = await testTenantIsolation(
        async (tenantId: string) => {
          MultiTenantTestMocks.setCurrentTenant(tenantId);
          return await apiMock.get('/api/services');
        },
        TEST_TENANT_IDS,
        'services'
      );
      
      // Verify tenant-specific service counts
      expect(results['bb-alpha-123']).toHaveLength(2);
      expect(results['bb-beta-456']).toHaveLength(1);
      expect(results['bb-gamma-789']).toHaveLength(3);
    });

    it('should validate tenant isolation for appointments', async () => {
      MultiTenantTestMocks.setupTenantData(TEST_TENANT_IDS);
      const apiMock = MultiTenantTestMocks.createTenantAwareApiMock();
      
      const results = await testTenantIsolation(
        async (tenantId: string) => {
          MultiTenantTestMocks.setCurrentTenant(tenantId);
          return await apiMock.get('/api/appointments');
        },
        TEST_TENANT_IDS,
        'appointments'
      );
      
      // Verify tenant-specific appointment counts
      expect(results['bb-alpha-123']).toHaveLength(2);
      expect(results['bb-beta-456']).toHaveLength(1);
      expect(results['bb-gamma-789']).toHaveLength(2);
    });
  });

  describe('Mock Tenant Provider', () => {
    it('should create mock tenant context', () => {
      const mockContext = createMockTenantProvider('bb-alpha-123');
      
      expect(mockContext.barbershopId).toBe('bb-alpha-123');
      expect(mockContext.slug).toBe('barbershop-alpha');
      expect(mockContext.barbershopData?.name).toBe('Barbearia Alpha');
      expect(mockContext.isValidTenant).toBe(true);
    });

    it('should handle tenant switching', async () => {
      const mockContext = createMockTenantProvider();
      
      // Initially no tenant
      expect(mockContext.barbershopId).toBeNull();
      expect(mockContext.isValidTenant).toBe(false);
      
      // Switch to alpha tenant
      await switchTenant(mockContext, 'barbershop-alpha');
      expect(mockContext.barbershopId).toBe('bb-alpha-123');
      expect(mockContext.slug).toBe('barbershop-alpha');
      
      // Switch to beta tenant
      await switchTenant(mockContext, 'barbershop-beta');
      expect(mockContext.barbershopId).toBe('bb-beta-456');
      expect(mockContext.slug).toBe('barbershop-beta');
    });

    it('should handle invalid tenant slug', async () => {
      const mockContext = createMockTenantProvider();
      
      await expect(switchTenant(mockContext, 'invalid-slug')).rejects.toThrow('Barbershop not found: invalid-slug');
    });
  });

  describe('Tenant Boundary Validation', () => {
    it('should validate tenant boundaries for operations', () => {
      const operations = [
        { name: 'getBarbers', tenantId: 'bb-alpha-123', result: [{ id: 'barber-alpha-01' }] },
        { name: 'getServices', tenantId: 'bb-alpha-123', result: [{ id: 'service-alpha-01' }] },
        { name: 'getAppointments', tenantId: 'bb-alpha-123', result: [{ id: 'appt-alpha-01' }] }
      ];
      
      expect(() => validateTenantBoundaries(operations, 'bb-alpha-123')).not.toThrow();
    });

    it('should detect tenant boundary violations', () => {
      const operations = [
        { name: 'getBarbers', tenantId: 'bb-alpha-123', result: [{ id: 'barber-beta-01' }] }, // Wrong tenant data
        { name: 'getServices', tenantId: 'bb-alpha-123', result: [{ id: 'service-alpha-01' }] }
      ];
      
      expect(() => validateTenantBoundaries(operations, 'bb-alpha-123')).toThrow('Tenant boundary violations detected');
    });
  });
});