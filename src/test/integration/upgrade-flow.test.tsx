import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { TenantProvider } from '../../contexts/TenantContext';
import UpgradePage from '../../pages/UpgradePage';
import { PlanUpgradeNotification } from '../../components/plan/PlanUpgradeNotification';

// Mock the hooks
vi.mock('../../hooks/usePlan', () => ({
  usePlan: () => ({
    planInfo: { planType: 'free', barbershopId: 'test-id', name: 'Test Barbershop', slug: 'test-barbershop' },
    usage: {
      planType: 'free',
      limits: { barbers: 1, appointments_per_month: 20 },
      usage: {
        barbers: { current: 1, limit: 1, remaining: 0, percentage: 100, nearLimit: true },
        appointments: { current: 18, limit: 20, remaining: 2, percentage: 90, nearLimit: true }
      },
      upgradeRecommended: true,
      upgradeRequired: false
    },
    upgradePlan: vi.fn().mockResolvedValue({
      barbershopId: 'test-id',
      planType: 'pro',
      transactionId: 'txn_123',
      paymentMethod: 'mercado_pago_simulation'
    }),
    loading: false
  })
}));

vi.mock('../../contexts/TenantContext', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTenant: () => ({
    barbershopData: { name: 'Test Barbershop', slug: 'test-barbershop' },
    loading: false
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ barbershopSlug: 'test-barbershop' }),
    useNavigate: () => vi.fn()
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <TenantProvider>
        {children}
      </TenantProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Upgrade Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upgrade page with plan comparison', async () => {
    render(
      <TestWrapper>
        <UpgradePage />
      </TestWrapper>
    );

    // Check if the page title is rendered
    expect(screen.getByText('Upgrade para Pro')).toBeInTheDocument();
    
    // Check if plan comparison is shown
    expect(screen.getByText('Plano Gratuito')).toBeInTheDocument();
    expect(screen.getByText('Plano Pro')).toBeInTheDocument();
    
    // Check if upgrade button is present
    expect(screen.getByText('Fazer Upgrade Agora')).toBeInTheDocument();
  });

  it('should show upgrade notification component', () => {
    render(
      <TestWrapper>
        <PlanUpgradeNotification />
      </TestWrapper>
    );

    // Check if upgrade notification is rendered
    expect(screen.getByText('Upgrade Recomendado')).toBeInTheDocument();
    expect(screen.getByText('Upgrade para Pro')).toBeInTheDocument();
  });

  it('should display current usage stats in notification', () => {
    render(
      <TestWrapper>
        <PlanUpgradeNotification />
      </TestWrapper>
    );

    // Check if usage stats are displayed
    expect(screen.getByText('Barbeiros')).toBeInTheDocument();
    expect(screen.getByText('Agendamentos/mês')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument(); // Barbers usage
    expect(screen.getByText('18/20')).toBeInTheDocument(); // Appointments usage
  });

  it('should show upgrade benefits', async () => {
    render(
      <TestWrapper>
        <UpgradePage />
      </TestWrapper>
    );

    // Check if benefits are shown
    expect(screen.getByText(/Por que fazer upgrade/)).toBeInTheDocument();
    expect(screen.getByText('Barbeiros Ilimitados')).toBeInTheDocument();
    expect(screen.getByText('Agendamentos Ilimitados')).toBeInTheDocument();
    expect(screen.getByText('Suporte Prioritário')).toBeInTheDocument();
  });

  it('should show payment security information', async () => {
    render(
      <TestWrapper>
        <UpgradePage />
      </TestWrapper>
    );

    // Check if payment security info is shown
    expect(screen.getByText('Pagamento Seguro')).toBeInTheDocument();
    expect(screen.getByText(/Processamento seguro via Mercado Pago/)).toBeInTheDocument();
  });
});