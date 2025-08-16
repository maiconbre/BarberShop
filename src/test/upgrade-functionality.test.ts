import { describe, it, expect, beforeEach } from 'vitest';
import { getUsageStats, getCurrentPlan, upgradePlan } from '../services/PlanService';

describe('Upgrade Functionality', () => {
  beforeEach(() => {
    // Reset mock state before each test
    // In a real implementation, this would reset the backend state
  });

  it('should return free plan usage stats initially', async () => {
    const usage = await getUsageStats();
    
    expect(usage.planType).toBe('free');
    expect(usage.limits.barbers).toBe(1);
    expect(usage.limits.appointments_per_month).toBe(20);
    expect(usage.upgradeRecommended).toBe(true);
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
  });

  it('should show pro plan features after upgrade', async () => {
    // First upgrade
    await upgradePlan({ planType: 'pro' });
    
    // Then check usage stats
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