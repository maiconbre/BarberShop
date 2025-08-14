/**
 * Multi-tenant test utilities
 * Provides setup, teardown, and isolation testing utilities
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { testBarbershops, getTenantTestData } from '../fixtures/tenantFixtures';
import type { BarbershopData } from '@/services/BarbershopService';

/**
 * Mock implementations for multi-tenant testing
 */
export class MultiTenantTestMocks {
  private static tenantData: Record<string, any> = {};
  private static currentTenant: string | null = null;

  /**
   * Setup mock data for multiple tenants
   */
  static setupTenantData(tenantIds: string[]) {
    tenantIds.forEach(tenantId => {
      this.tenantData[tenantId] = getTenantTestData(tenantId);
    });
  }

  /**
   * Set current tenant context
   */
  static setCurrentTenant(tenantId: string | null) {
    this.currentTenant = tenantId;
  }

  /**
   * Get current tenant
   */
  static getCurrentTenant(): string | null {
    return this.currentTenant;
  }

  /**
   * Get data for current tenant only
   */
  static getCurrentTenantData() {
    if (!this.currentTenant) {
      return null;
    }
    return this.tenantData[this.currentTenant];
  }

  /**
   * Mock API service that respects tenant isolation
   */
  static createTenantAwareApiMock() {
    return {
      get: vi.fn().mockImplementation(async (endpoint: string) => {
        const currentTenant = this.getCurrentTenant();
        if (!currentTenant) {
          throw new Error('No tenant context available');
        }

        const tenantData = this.getCurrentTenantData();
        if (!tenantData) {
          throw new Error(`No data available for tenant ${currentTenant}`);
        }

        // Route to appropriate data based on endpoint
        if (endpoint.includes('/barbers')) {
          if (endpoint.includes('/barbers/')) {
            const id = endpoint.split('/').pop();
            return tenantData.barbers.find((b: any) => b.id === id) || null;
          }
          return tenantData.barbers;
        }

        if (endpoint.includes('/services')) {
          if (endpoint.includes('/services/')) {
            const id = endpoint.split('/').pop();
            return tenantData.services.find((s: any) => s.id === id) || null;
          }
          return tenantData.services;
        }

        if (endpoint.includes('/appointments')) {
          if (endpoint.includes('/appointments/')) {
            const id = endpoint.split('/').pop();
            return tenantData.appointments.find((a: any) => a.id === id) || null;
          }
          return tenantData.appointments;
        }

        if (endpoint.includes('/comments')) {
          if (endpoint.includes('/comments/admin')) {
            return tenantData.comments;
          }
          if (endpoint.includes('/comments/')) {
            const id = endpoint.split('/').pop();
            return tenantData.comments.find((c: any) => c.id === id) || null;
          }
          // Filter by status if query parameter present
          const statusMatch = endpoint.match(/status=(\w+)/);
          if (statusMatch) {
            return tenantData.comments.filter((c: any) => c.status === statusMatch[1]);
          }
          return tenantData.comments.filter((c: any) => c.status === 'approved');
        }

        throw new Error(`Unmocked endpoint: ${endpoint}`);
      }),

      post: vi.fn().mockImplementation(async (endpoint: string, data: any) => {
        const currentTenant = this.getCurrentTenant();
        if (!currentTenant) {
          throw new Error('No tenant context available');
        }

        // Simulate creating new items with tenant-specific IDs
        const newItem = {
          ...data,
          id: `${endpoint.split('/')[2]}-${currentTenant}-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return newItem;
      }),

      patch: vi.fn().mockImplementation(async (endpoint: string, data: any) => {
        const currentTenant = this.getCurrentTenant();
        if (!currentTenant) {
          throw new Error('No tenant context available');
        }

        const tenantData = this.getCurrentTenantData();
        if (!tenantData) {
          throw new Error(`No data available for tenant ${currentTenant}`);
        }

        // Find and update item
        const id = endpoint.split('/').pop();
        let updatedItem = null;

        if (endpoint.includes('/barbers/')) {
          updatedItem = tenantData.barbers.find((b: any) => b.id === id);
        } else if (endpoint.includes('/services/')) {
          updatedItem = tenantData.services.find((s: any) => s.id === id);
        } else if (endpoint.includes('/appointments/')) {
          updatedItem = tenantData.appointments.find((a: any) => a.id === id);
        } else if (endpoint.includes('/comments/')) {
          updatedItem = tenantData.comments.find((c: any) => c.id === id);
        }

        if (!updatedItem) {
          const error = new Error('Not found') as any;
          error.status = 404;
          throw error;
        }

        return { ...updatedItem, ...data, updatedAt: new Date() };
      }),

      delete: vi.fn().mockImplementation(async (endpoint: string) => {
        const currentTenant = this.getCurrentTenant();
        if (!currentTenant) {
          throw new Error('No tenant context available');
        }

        // Simulate successful deletion
        return undefined;
      })
    };
  }

  /**
   * Mock BarbershopService for tenant loading
   */
  static createBarbershopServiceMock() {
    return {
      getBarbershopBySlug: vi.fn().mockImplementation(async (slug: string) => {
        const barbershop = Object.values(testBarbershops).find(b => b.slug === slug);
        if (!barbershop) {
          const error = new Error(`Barbershop not found: ${slug}`) as any;
          error.status = 404;
          throw error;
        }
        return barbershop;
      })
    };
  }

  /**
   * Clear all mock data
   */
  static clear() {
    this.tenantData = {};
    this.currentTenant = null;
  }
}

/**
 * Setup function for multi-tenant tests
 */
export function setupMultiTenantTest(tenantIds: string[]) {
  beforeEach(() => {
    // Clear any existing mocks
    vi.clearAllMocks();
    MultiTenantTestMocks.clear();
    
    // Setup tenant data
    MultiTenantTestMocks.setupTenantData(tenantIds);
    
    // Mock console methods to reduce noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Cleanup React components
    cleanup();
    
    // Clear tenant context
    MultiTenantTestMocks.clear();
    
    // Restore console methods
    vi.restoreAllMocks();
  });
}

/**
 * Test isolation between tenants
 */
export async function testTenantIsolation(
  operation: (tenantId: string) => Promise<any[]>,
  tenantIds: string[],
  dataType: string
) {
  const results: Record<string, any[]> = {};
  
  // Execute operation for each tenant
  for (const tenantId of tenantIds) {
    MultiTenantTestMocks.setCurrentTenant(tenantId);
    results[tenantId] = await operation(tenantId);
  }
  
  // Verify isolation - no tenant should see another's data
  for (const tenantId of tenantIds) {
    const tenantData = results[tenantId];
    const otherTenants = tenantIds.filter(id => id !== tenantId);
    
    for (const otherTenantId of otherTenants) {
      const otherTenantData = results[otherTenantId];
      
      // Check for data leakage
      const leakedItems = tenantData.filter(item => {
        return otherTenantData.some(otherItem => 
          item.id === otherItem.id || 
          (item.name && otherItem.name && item.name === otherItem.name)
        );
      });
      
      if (leakedItems.length > 0) {
        throw new Error(
          `Tenant isolation violation: ${dataType} data leaked between ${tenantId} and ${otherTenantId}. ` +
          `Leaked items: ${leakedItems.map(item => item.id || item.name).join(', ')}`
        );
      }
    }
  }
  
  return results;
}

/**
 * Create a mock TenantContext provider for testing
 */
export function createMockTenantProvider(initialTenantId?: string) {
  const mockTenantContext = {
    barbershopId: initialTenantId || null,
    slug: initialTenantId ? Object.values(testBarbershops).find(b => b.id === initialTenantId)?.slug || null : null,
    barbershopData: initialTenantId ? Object.values(testBarbershops).find(b => b.id === initialTenantId) || null : null,
    settings: {
      theme: 'default',
      timezone: 'America/Sao_Paulo'
    },
    loading: false,
    error: null,
    loadTenant: vi.fn().mockImplementation(async (slug: string) => {
      const barbershop = Object.values(testBarbershops).find(b => b.slug === slug);
      if (!barbershop) {
        throw new Error(`Barbershop not found: ${slug}`);
      }
      
      mockTenantContext.barbershopId = barbershop.id;
      mockTenantContext.slug = barbershop.slug;
      mockTenantContext.barbershopData = barbershop;
      MultiTenantTestMocks.setCurrentTenant(barbershop.id);
    }),
    clearTenant: vi.fn().mockImplementation(() => {
      mockTenantContext.barbershopId = null;
      mockTenantContext.slug = null;
      mockTenantContext.barbershopData = null;
      MultiTenantTestMocks.setCurrentTenant(null);
    }),
    updateSettings: vi.fn(),
    isValidTenant: Boolean(initialTenantId)
  };

  // Set initial tenant if provided
  if (initialTenantId) {
    MultiTenantTestMocks.setCurrentTenant(initialTenantId);
  }

  return mockTenantContext;
}

/**
 * Utility to switch tenant context during tests
 */
export async function switchTenant(mockTenantContext: any, tenantSlug: string) {
  await mockTenantContext.loadTenant(tenantSlug);
  return mockTenantContext.barbershopId;
}

/**
 * Validate that all operations respect tenant boundaries
 */
export function validateTenantBoundaries(
  operations: Array<{ name: string; tenantId: string; result: any }>,
  expectedTenantId: string
) {
  const violations = operations.filter(op => {
    if (op.tenantId !== expectedTenantId) {
      return true;
    }
    
    // Check if result contains data from other tenants
    if (Array.isArray(op.result)) {
      return op.result.some(item => {
        if (item.id && typeof item.id === 'string') {
          // Check if ID contains other tenant identifiers
          const otherTenantIds = Object.values(testBarbershops)
            .filter(b => b.id !== expectedTenantId)
            .map(b => b.id.split('-')[1]); // Extract tenant identifier
          
          return otherTenantIds.some(otherId => item.id.includes(otherId));
        }
        return false;
      });
    }
    
    return false;
  });
  
  if (violations.length > 0) {
    throw new Error(
      `Tenant boundary violations detected: ${violations.map(v => v.name).join(', ')}`
    );
  }
  
  return true;
}