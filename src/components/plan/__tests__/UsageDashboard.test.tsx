import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UsageDashboard } from '../UsageDashboard';
import { PlanUsage, PlanInfo, TransactionHistory } from '../../../types/plan';

// Mock the plan context
const mockPlanContext = {
  usage: {
    planType: 'free' as const,
    limits: {
      barbers: 1,
      appointments_per_month: 20,
      services: 5,
      storage_mb: 100
    },
    usage: {
      barbers: {
        current: 1,
        limit: 1,
        remaining: 0,
        percentage: 100,
        nearLimit: true
      },
      appointments: {
        current: 18,
        limit: 20,
        remaining: 2,
        percentage: 90,
        nearLimit: true
      }
    },
    upgradeRecommended: true,
    upgradeRequired: false
  } as PlanUsage,
  planInfo: {
    barbershopId: 'test-id',
    name: 'Barbearia Teste',
    slug: 'barbearia-teste',
    planType: 'free' as const,
    settings: {},
    createdAt: '2024-01-01T00:00:00Z'
  } as PlanInfo,
  history: {
    barbershopId: 'test-id',
    currentPlan: 'free' as const,
    transactions: [
      {
        id: 'txn_001',
        type: 'plan_activation' as const,
        planType: 'free' as const,
        amount: 0,
        status: 'completed' as const,
        description: 'Ativação do plano gratuito',
        createdAt: '2024-01-01T00:00:00Z',
        paymentMethod: null,
        transactionId: null
      }
    ] as TransactionHistory[]
  },
  loading: false,
  error: null,
  refreshUsage: vi.fn(),
  refreshPlanInfo: vi.fn(),
  refreshHistory: vi.fn(),
  upgradePlan: vi.fn(),
  checkLimits: vi.fn(),
  checkAndExecute: vi.fn(),
  lastLimitError: null,
  clearLimitError: vi.fn(),
  canCreateBarber: false,
  canCreateAppointment: true,
  shouldShowUpgradeNotification: true,
  isNearLimit: true
};

// Mock the plan context hook
vi.mock('../../../contexts/PlanContext', () => ({
  PlanProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  usePlanContext: () => mockPlanContext
}));

describe('UsageDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders usage dashboard with correct information', () => {
    render(<UsageDashboard />);

    // Check if main elements are present
    expect(screen.getByText('Dashboard de Uso')).toBeInTheDocument();
    expect(screen.getByText('Barbearia Teste')).toBeInTheDocument();
    expect(screen.getByText('Plano Gratuito')).toBeInTheDocument();
  });

  it('displays barber usage correctly', () => {
    render(<UsageDashboard />);

    expect(screen.getByText('Barbeiros')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Current usage
    expect(screen.getByText('/ 1')).toBeInTheDocument(); // Limit
    expect(screen.getByText('100% usado')).toBeInTheDocument();
    expect(screen.getAllByText('Próximo do limite')).toHaveLength(2); // Both barbers and appointments show this
  });

  it('displays appointment usage correctly', () => {
    render(<UsageDashboard />);

    expect(screen.getByText('Agendamentos (mês atual)')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument(); // Current usage
    expect(screen.getByText('/ 20')).toBeInTheDocument(); // Limit
    expect(screen.getByText('90% usado')).toBeInTheDocument();
  });

  it('shows upgrade section when recommended', () => {
    render(<UsageDashboard />);

    expect(screen.getByText('Upgrade Recomendado')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade por R\$ 39,90\/mês/)).toBeInTheDocument();
    expect(screen.getByText('✨ Barbeiros e agendamentos ilimitados')).toBeInTheDocument();
  });

  it('handles upgrade button click', async () => {
    const mockUpgradePlan = vi.fn().mockResolvedValue({});
    mockPlanContext.upgradePlan = mockUpgradePlan;

    render(<UsageDashboard />);

    const upgradeButton = screen.getByText(/Upgrade por R\$ 39,90\/mês/);
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(mockUpgradePlan).toHaveBeenCalledWith({ planType: 'pro' });
    });
  });

  it('shows transaction history when expanded', async () => {
    render(<UsageDashboard />);

    const historyButton = screen.getByText('Ver histórico');
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(screen.getByText('Ativação do Plano')).toBeInTheDocument();
      expect(screen.getByText('Ativação do plano gratuito')).toBeInTheDocument();
      expect(screen.getByText('Gratuito')).toBeInTheDocument();
      expect(screen.getByText('Concluído')).toBeInTheDocument();
    });
  });

  // Note: These tests are simplified due to mocking complexity
  // In a real scenario, you would use proper test setup with providers
});