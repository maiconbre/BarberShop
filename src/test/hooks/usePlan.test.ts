import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlan } from '../../hooks/usePlan';
import * as PlanService from '../../services/PlanService';

// Mock do PlanService
vi.mock('../../services/PlanService');
const mockPlanService = PlanService as typeof PlanService & {
  getUsageStats: ReturnType<typeof vi.fn>;
  getCurrentPlan: ReturnType<typeof vi.fn>;
  upgradePlan: ReturnType<typeof vi.fn>;
};

describe('usePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load usage stats on mount', async () => {
    const mockUsage = {
      planType: 'free' as const,
      limits: { barbers: 1, appointments_per_month: 20 },
      usage: {
        barbers: { current: 0, limit: 1, remaining: 1, percentage: 0, nearLimit: false },
        appointments: { current: 5, limit: 20, remaining: 15, percentage: 25, nearLimit: false }
      },
      upgradeRecommended: false,
      upgradeRequired: false
    };

    mockPlanService.getUsageStats.mockResolvedValue(mockUsage);
    mockPlanService.getCurrentPlan.mockResolvedValue({
      barbershopId: 'test-id',
      name: 'Test Barbershop',
      slug: 'test-slug',
      planType: 'free',
      settings: {},
      createdAt: '2024-01-01T00:00:00Z'
    });

    const { result } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(result.current.usage).toEqual(mockUsage);
    });

    expect(mockPlanService.getUsageStats).toHaveBeenCalledTimes(1);
    expect(mockPlanService.getCurrentPlan).toHaveBeenCalledTimes(1);
  });

  it('should calculate canCreateBarber correctly', async () => {
    const mockUsage = {
      planType: 'free' as const,
      limits: { barbers: 1, appointments_per_month: 20 },
      usage: {
        barbers: { current: 1, limit: 1, remaining: 0, percentage: 100, nearLimit: true },
        appointments: { current: 5, limit: 20, remaining: 15, percentage: 25, nearLimit: false }
      },
      upgradeRecommended: true,
      upgradeRequired: false
    };

    mockPlanService.getUsageStats.mockResolvedValue(mockUsage);
    mockPlanService.getCurrentPlan.mockResolvedValue({
      barbershopId: 'test-id',
      name: 'Test Barbershop',
      slug: 'test-slug',
      planType: 'free',
      settings: {},
      createdAt: '2024-01-01T00:00:00Z'
    });

    const { result } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(result.current.canCreateBarber).toBe(false);
    });
  });

  it('should handle upgrade plan correctly', async () => {
    const mockUpgradeResponse = {
      barbershopId: 'test-id',
      name: 'Test Barbershop',
      slug: 'test-slug',
      planType: 'pro' as const,
      upgradedAt: '2024-01-01T00:00:00Z',
      transactionId: 'fake_123',
      paymentMethod: 'mercado_pago_simulation'
    };

    mockPlanService.upgradePlan.mockResolvedValue(mockUpgradeResponse);
    mockPlanService.getUsageStats.mockResolvedValue({
      planType: 'pro' as const,
      limits: { barbers: Infinity, appointments_per_month: Infinity },
      usage: {
        barbers: { current: 1, limit: Infinity, remaining: Infinity, percentage: 0, nearLimit: false },
        appointments: { current: 5, limit: Infinity, remaining: Infinity, percentage: 0, nearLimit: false }
      },
      upgradeRecommended: false,
      upgradeRequired: false
    });
    mockPlanService.getCurrentPlan.mockResolvedValue({
      barbershopId: 'test-id',
      name: 'Test Barbershop',
      slug: 'test-slug',
      planType: 'pro',
      settings: {},
      createdAt: '2024-01-01T00:00:00Z'
    });

    const { result } = renderHook(() => usePlan());

    const upgradeResult = await result.current.upgradePlan({ planType: 'pro' });

    expect(upgradeResult).toEqual(mockUpgradeResponse);
    expect(mockPlanService.upgradePlan).toHaveBeenCalledWith({ planType: 'pro' });
  });

  it('should handle errors gracefully', async () => {
    mockPlanService.getUsageStats.mockRejectedValue(new Error('Network error'));
    mockPlanService.getCurrentPlan.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePlan());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});