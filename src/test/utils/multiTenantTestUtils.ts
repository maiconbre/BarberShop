/**
 * Multi-tenant test utilities
 * Provides setup, teardown, and isolation testing utilities
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { testBarbershops, getTenantTestData } from '../fixtures/tenantFixtures';

/**
 * Mock implementations for multi-tenant testing
 */
export class MultiTenantTestMocks {
  private static tenantData: Record<string, unknown> = {};
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
      get: vi.fn().mockImplementation(async (url: string) => {
        const currentTenant = this.getCurrentTenant();
        if (!currentTenant) {
          throw new Error('No tenant context available');
        }

        const tenantData = this.getCurrentTenantData();
        if (!tenantData) {
          throw new Error(`No data available for tenant ${currentTenant}`);
        }

        // Route to appropriate data based on url
        if (url.includes('/barbers')) {
          if (url.includes('/barbers/')) {
            const id = url.split('/').pop();
            return (tenantData.barbers as { id: string }[]).find((b) => b.id === id) || null;
          }
          return tenantData.barbers;
        }

        if (url.includes('/services')) {
          if (url.includes('/services/')) {
            const id = url.split('/').pop();
            return (tenantData.services as { id: string }[]).find((s) => s.id === id) || null;
          }
          return tenantData.services;
        }

        if (url.includes('/appointments')) {
          if (url.includes('/appointments/')) {
            const id = url.split('/').pop();
            return (tenantData.appointments as { id: string }[]).find((a) => a.id === id) || null;
          }
          return tenantData.appointments;
        }

        if (url.includes('/comments')) {
          if (url.includes('/comments/admin')) {
            return tenantData.comments;
          }
          if (url.includes('/comments/')) {
            const id = url.split('/').pop();
            return (tenantData.comments as { id: string }[]).find((c) => c.id === id) || null;
          }
          // Filter by status if query parameter present
          const statusMatch = url.match(/status=(\w+)/);
          if (statusMatch) {
            return (tenantData.comments as { status: string }[]).filter((c) => c.status === statusMatch[1]);
          }
          return (tenantData.comments as { status: string }[]).filter((c) => c.status === 'approved');
        }

        throw new Error(`Unmocked endpoint: ${url}`);
      }),

      post: vi.fn().mockImplementation(async (url: string, data: Record<string, unknown>) => {
        const currentTenant = this.getCurrentTenant();
        if (!currentTenant) {
          throw new Error('No tenant context available');
        }

        // Simulate creating new items with tenant-specific IDs
        const newItem = {
          ...data,
          id: `${url.split('/')[2]}-${currentTenant}-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return newItem;
      }),

      patch: vi.fn().mockImplementation(async (url: string, data: Record<string, unknown>) => {
        const currentTenant = this.getCurrentTenant();
        if (!currentTenant) {
          throw new Error('No tenant context available');
        }

        const tenantData = this.getCurrentTenantData();
        if (!tenantData) {
          throw new Error(`No data available for tenant ${currentTenant}`);
        }

        // Find and update item
        const id = url.split('/').pop();
        let updatedItem: Record<string, unknown> | null = null;

        if (url.includes('/barbers/')) {
          updatedItem = (tenantData.barbers as { id: string }[]).find((b) => b.id === id) || null;
        } else if (url.includes('/services/')) {
          updatedItem = (tenantData.services as { id: string }[]).find((s) => s.id === id) || null;
        } else if (url.includes('/appointments/')) {
          updatedItem = (tenantData.appointments as { id: string }[]).find((a) => a.id === id) || null;
        } else if (url.includes('/comments/')) {
          updatedItem = (tenantData.comments as { id: string }[]).find((c) => c.id === id) || null;
        }

        if (!updatedItem) {
          const error = new Error('Not found') as Error & { status: number };
          error.status = 404;
          throw error;
        }

        return { ...updatedItem, ...data, updatedAt: new Date() };
      }),

      delete: vi.fn().mockImplementation(async () => {
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
          const error = new Error(`Barbershop not found: ${slug}`) as Error & { status: number };
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
  operation: (tenantId: string) => Promise<unknown[]>,
  tenantIds: string[],
  dataType: string
) {
  const results: Record<string, unknown[]> = {};
  
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
      const leakedItems = tenantData.filter((item: { id?: string; name?: string }) => {
        return otherTenantData.some((otherItem: { id?: string; name?: string }) => 
          item.id === otherItem.id || 
          (item.name && otherItem.name && item.name === otherItem.name)
        );
      });
      
      if (leakedItems.length > 0) {
        throw new Error(
          `Tenant isolation violation: ${dataType} data leaked between ${tenantId} and ${otherTenantId}. ` +
          `Leaked items: ${leakedItems.map((item: { id?: string; name?: string }) => item.id || item.name).join(', ')}`
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
export async function switchTenant(mockTenantContext: { loadTenant: (slug: string) => Promise<void>; barbershopId: string | null }, tenantSlug: string) {
  await mockTenantContext.loadTenant(tenantSlug);
  return mockTenantContext.barbershopId;
}

/**
 * Validate that all operations respect tenant boundaries
 */
export function validateTenantBoundaries(
  operations: Array<{ name: string; tenantId: string; result: unknown }>,
  expectedTenantId: string
) {
  const violations = operations.filter(op => {
    if (op.tenantId !== expectedTenantId) {
      return true;
    }
    
    // Check if result contains data from other tenants
    if (Array.isArray(op.result)) {
      return op.result.some((item: { id?: string }) => {
        if (item.id && typeof item.id === 'string') {
          // Check if ID contains other tenant identifiers
          const otherTenantIds = Object.values(testBarbershops)
            .filter(b => b.id !== expectedTenantId)
            .map(b => b.id.split('-')[1]); // Extract tenant identifier
          
          return otherTenantIds.some(otherId => item.id!.includes(otherId));
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