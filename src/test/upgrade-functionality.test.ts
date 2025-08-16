import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUsageStats, getCurrentPlan, upgradePlan } from '../services/PlanService';

// Mock the ServiceFactory to avoid real API calls
const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../services/ServiceFactory', () => ({
  ServiceFactory: {
    getApiService: () => mockApiService,
  },
}));

describe('Upgrade Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock responses for fallback endpoints that PlanService actually uses
    mockApiService.get.mockImplementation((endpoint: string) => {
      // PlanService falls back to barbershop endpoint when plan endpoints fail
      if (endpoint === '/api/barbershops/my-barbershop') {
        return Promise.resolve({
          id: 'mock-barbershop-id',
          name: 'Test Barbershop',
          slug: 'test-slug',
          planType: 'free',
          settings: {},
          createdAt: '2024-01-01T00:00:00Z'
        });
      }
      
      // Reject other endpoints to trigger fallback behavior
      return Promise.reject(new Error('Endpoint not implemented'));
    });
    
    mockApiService.post.mockImplementation(() => {
      // Reject all POST endpoints to trigger fallback behavior
      return Promise.reject(new Error('Endpoint not implemented'));
    });
  });

  it('should return free plan usage stats initially', async () => {
    const usage = await getUsageStats();
    
    expect(usage.planType).toBe('free');
    expect(usage.limits.barbers).toBe(1);
    expect(usage.limits.appointments_per_month).toBe(20);
    expect(usage.upgradeRecommended).toBe(true);
    expect(usage.usage.barbers.current).toBe(1);
    expect(usage.usage.appointments.current).toBe(18);
  });

  it('should return free plan info initially', async () => {
    const planInfo = await getCurrentPlan();
    
    expect(planInfo.planType).toBe('free');
    expect(planInfo.barbershopId).toBe('mock-barbershop-id');
  });

  it('should successfully upgrade to pro plan', async () => {
    const upgradeResponse = await upgradePlan({ planType: 'pro' });
    
    expect(upgradeResponse.planType).toBe('pro');
    expect(upgradeResponse.transactionId).toMatch(/^txn_\d+$/);
    expect(upgradeResponse.paymentMethod).toBe('mercado_pago_simulation');
    expect(upgradeResponse.barbershopId).toBe('mock-barbershop-id');
  });

  it('should show pro plan features after upgrade', async () => {
    // Mock the barbershop to return pro plan after upgrade
    mockApiService.get.mockImplementation((endpoint: string) => {
      if (endpoint === '/api/barbershops/my-barbershop') {
        return Promise.resolve({
          id: 'mock-barbershop-id',
          name: 'Test Barbershop',
          slug: 'test-slug',
          planType: 'pro', // Changed to pro after upgrade
          settings: {},
          createdAt: '2024-01-01T00:00:00Z'
        });
      }
      return Promise.reject(new Error('Endpoint not implemented'));
    });
    
    // First upgrade
    await upgradePlan({ planType: 'pro' });
    
    // Then check usage stats (should reflect pro plan)
    const usage = await getUsageStats();
    expect(usage.planType).toBe('pro');
    expect(usage.limits.barbers).toBe(Infinity);
    expect(usage.limits.appointments_per_month).toBe(Infinity);
    expect(usage.upgradeRecommended).toBe(false);
    
    // Check plan info
    const planInfo = await getCurrentPlan();
    expect(planInfo.planType).toBe('pro');
  });
});