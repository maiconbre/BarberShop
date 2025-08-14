import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Services from '../feature/Services';
import { TenantProvider } from '../../contexts/TenantContext';

// Mock the hooks
vi.mock('../../hooks/useServices', () => ({
  useServices: () => ({
    services: [
      { id: '1', name: 'Corte Tradicional', price: 45 },
      { id: '2', name: 'Barba', price: 25 }
    ],
    loadServices: vi.fn(),
    loading: false,
    error: null
  })
}));

vi.mock('../../contexts/TenantContext', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTenant: () => ({
    barbershopId: 'test-barbershop-id',
    isValidTenant: true,
    slug: 'test-barbershop'
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <TenantProvider>
        {component}
      </TenantProvider>
    </BrowserRouter>
  );
};

describe('Services Component - Multi-tenant Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render services with multi-tenant context', async () => {
    renderWithProviders(<Services />);

    // Check if the component renders
    expect(screen.getByText('Nossos Serviços')).toBeInTheDocument();

    // Wait for services to load
    await waitFor(() => {
      expect(screen.getByText('Corte Tradicional')).toBeInTheDocument();
      expect(screen.getByText('Barba')).toBeInTheDocument();
    });

    // Check if prices are formatted correctly
    expect(screen.getByText('R$ 45,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 25,00')).toBeInTheDocument();
  });

  it('should handle service scheduling', async () => {
    const mockOnSchedule = vi.fn();
    renderWithProviders(<Services onSchedule={mockOnSchedule} />);

    await waitFor(() => {
      expect(screen.getByText('Corte Tradicional')).toBeInTheDocument();
    });

    // Find and click the schedule button for the first service
    const scheduleButtons = screen.getAllByText('Agendar');
    expect(scheduleButtons).toHaveLength(2);
  });

  it('should support multi-select mode', async () => {
    const mockOnScheduleMultiple = vi.fn();
    renderWithProviders(<Services onScheduleMultiple={mockOnScheduleMultiple} />);

    await waitFor(() => {
      expect(screen.getByText('Corte Tradicional')).toBeInTheDocument();
    });

    // Check if multi-select button is present
    expect(screen.getByText('Selecionar Múltiplos')).toBeInTheDocument();
  });

  it('should work in showcase mode', () => {
    renderWithProviders(<Services isShowcase={true} />);

    // In showcase mode, it should still render the title
    expect(screen.getByText('Nossos Serviços')).toBeInTheDocument();
    
    // Should not show multi-select button in showcase mode
    expect(screen.queryByText('Selecionar Múltiplos')).not.toBeInTheDocument();
  });
});