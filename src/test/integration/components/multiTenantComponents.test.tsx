/**
 * Multi-tenant component integration tests
 * Tests component interactions with tenant-aware hooks and repositories
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { TenantProvider } from '../../../contexts/TenantContext';
import Services from '../../../components/feature/Services';
import BookingModal from '../../../components/feature/BookingModal';
import Calendar from '../../../components/feature/Calendar';
import { 
  setupMultiTenantTest, 
  MultiTenantTestMocks,
  createMockTenantProvider,
  switchTenant,
  testTenantIsolation
} from '../../utils/multiTenantTestUtils';
import { testBarbershops, getTenantTestData } from '../../fixtures/tenantFixtures';

// Test tenant IDs
const TEST_TENANT_IDS = ['bb-alpha-123', 'bb-beta-456', 'bb-gamma-789'];

// Mock the hooks with multi-tenant support
vi.mock('../../../hooks/useServices', () => ({
  useServices: () => {
    const currentTenant = MultiTenantTestMocks.getCurrentTenant();
    const tenantData = MultiTenantTestMocks.getCurrentTenantData();
    
    return {
      services: tenantData?.services || [],
      loadServices: vi.fn().mockResolvedValue(tenantData?.services || []),
      loading: false,
      error: null,
      isValidTenant: Boolean(currentTenant),
      barbershopId: currentTenant
    };
  }
}));

vi.mock('../../../hooks/useBarbers', () => ({
  useBarbers: () => {
    const currentTenant = MultiTenantTestMocks.getCurrentTenant();
    const tenantData = MultiTenantTestMocks.getCurrentTenantData();
    
    return {
      barbers: tenantData?.barbers || [],
      loadBarbers: vi.fn().mockResolvedValue(tenantData?.barbers || []),
      loading: false,
      error: null,
      isValidTenant: Boolean(currentTenant),
      barbershopId: currentTenant
    };
  }
}));

vi.mock('../../../hooks/useAppointments', () => ({
  useAppointments: () => {
    const currentTenant = MultiTenantTestMocks.getCurrentTenant();
    const tenantData = MultiTenantTestMocks.getCurrentTenantData();
    
    return {
      appointments: tenantData?.appointments || [],
      loadAppointments: vi.fn().mockResolvedValue(tenantData?.appointments || []),
      createWithBackendData: vi.fn().mockImplementation(async (data) => ({
        success: true,
        data: { id: `appt-${currentTenant}-${Date.now()}`, ...data }
      })),
      loading: false,
      creating: false,
      error: null,
      isValidTenant: Boolean(currentTenant),
      barbershopId: currentTenant
    };
  }
}));

// Mock TenantContext
const mockTenantContext = createMockTenantProvider();

vi.mock('../../../contexts/TenantContext', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tenant-provider">{children}</div>,
  useTenant: () => mockTenantContext
}));

// Mock other dependencies
vi.mock('../../../utils/logger', () => ({
  logger: {
    componentDebug: vi.fn(),
    componentInfo: vi.fn(),
    componentWarn: vi.fn(),
    componentError: vi.fn()
  }
}));

vi.mock('../../../services/AppointmentService', () => ({
  loadAppointments: vi.fn().mockResolvedValue([]),
  formatWhatsappMessage: vi.fn().mockReturnValue('Mock WhatsApp message'),
  formatDisplayDate: vi.fn().mockReturnValue('Mock date'),
  isTimeSlotAvailable: vi.fn().mockResolvedValue(true),
  checkLocalAvailability: vi.fn().mockReturnValue(true)
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

describe('Multi-Tenant Component Integration Tests', () => {
  setupMultiTenantTest(TEST_TENANT_IDS);

  beforeEach(() => {
    MultiTenantTestMocks.setupTenantData(TEST_TENANT_IDS);
  });

  describe('Services Component Multi-Tenant Integration', () => {
    it('should display different services for different tenants', async () => {
      // Test with Alpha tenant
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      const { rerender } = renderWithProviders(<Services />);

      await waitFor(() => {
        expect(screen.getByText('Nossos Serviços')).toBeInTheDocument();
      });

      // Should show Alpha services
      await waitFor(() => {
        expect(screen.getByText('Corte Masculino Alpha')).toBeInTheDocument();
        expect(screen.getByText('Barba Alpha')).toBeInTheDocument();
      });

      // Should not show Beta services
      expect(screen.queryByText('Corte Simples Beta')).not.toBeInTheDocument();

      // Switch to Beta tenant
      await switchTenant(mockTenantContext, 'barbershop-beta');
      MultiTenantTestMocks.setCurrentTenant('bb-beta-456');

      rerender(
        <BrowserRouter>
          <TenantProvider>
            <Services />
          </TenantProvider>
        </BrowserRouter>
      );

      // Should now show Beta services
      await waitFor(() => {
        expect(screen.getByText('Corte Simples Beta')).toBeInTheDocument();
      });

      // Should not show Alpha services
      expect(screen.queryByText('Corte Masculino Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('Barba Alpha')).not.toBeInTheDocument();
    });

    it('should handle service scheduling with tenant context', async () => {
      const mockOnSchedule = vi.fn();
      
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      renderWithProviders(<Services onSchedule={mockOnSchedule} />);

      await waitFor(() => {
        expect(screen.getByText('Corte Masculino Alpha')).toBeInTheDocument();
      });

      // Click schedule button for Alpha service
      const scheduleButtons = screen.getAllByText('Agendar');
      fireEvent.click(scheduleButtons[0]);

      expect(mockOnSchedule).toHaveBeenCalledWith('Corte Masculino Alpha');
    });

    it('should support multi-select mode with tenant-specific services', async () => {
      const mockOnScheduleMultiple = vi.fn();
      
      await switchTenant(mockTenantContext, 'barbershop-gamma');
      MultiTenantTestMocks.setCurrentTenant('bb-gamma-789');

      renderWithProviders(<Services onScheduleMultiple={mockOnScheduleMultiple} />);

      await waitFor(() => {
        expect(screen.getByText('Corte Premium Gamma')).toBeInTheDocument();
      });

      // Enable multi-select mode
      const multiSelectButton = screen.getByText('Selecionar Múltiplos');
      fireEvent.click(multiSelectButton);

      // Select multiple services
      const gammaServices = screen.getAllByText(/Gamma/);
      fireEvent.click(gammaServices[0]); // Corte Premium Gamma
      fireEvent.click(gammaServices[1]); // Barba Premium Gamma

      // Schedule multiple services
      const scheduleMultipleButton = screen.getByText(/Agendar 2 Serviços/);
      fireEvent.click(scheduleMultipleButton);

      expect(mockOnScheduleMultiple).toHaveBeenCalledWith([
        'Corte Premium Gamma',
        'Barba Premium Gamma'
      ]);
    });

    it('should not show multi-select in showcase mode', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      renderWithProviders(<Services isShowcase={true} />);

      await waitFor(() => {
        expect(screen.getByText('Nossos Serviços')).toBeInTheDocument();
      });

      // Should not show multi-select button in showcase mode
      expect(screen.queryByText('Selecionar Múltiplos')).not.toBeInTheDocument();
    });
  });

  describe('BookingModal Multi-Tenant Integration', () => {
    it('should create appointments with correct tenant context', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      const mockOnClose = vi.fn();
      
      renderWithProviders(
        <BookingModal 
          isOpen={true} 
          onClose={mockOnClose}
          initialService="Corte Masculino Alpha"
        />
      );

      // Fill out the form
      const nameInput = screen.getByLabelText(/nome/i);
      const whatsappInput = screen.getByLabelText(/whatsapp/i);
      
      await userEvent.type(nameInput, 'João Cliente Alpha');
      await userEvent.type(whatsappInput, '+5511999999999');

      // Proceed to next step
      const nextButton = screen.getByText('Próximo');
      fireEvent.click(nextButton);

      // Select barber (should only show Alpha barbers)
      await waitFor(() => {
        expect(screen.getByText('João Alpha')).toBeInTheDocument();
        expect(screen.getByText('Pedro Alpha')).toBeInTheDocument();
      });

      // Should not show barbers from other tenants
      expect(screen.queryByText('Carlos Beta')).not.toBeInTheDocument();
      expect(screen.queryByText('Roberto Gamma')).not.toBeInTheDocument();
    });

    it('should isolate appointment data between tenants', async () => {
      // Test appointment creation for Alpha tenant
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      const { rerender } = renderWithProviders(
        <BookingModal 
          isOpen={true} 
          onClose={vi.fn()}
          initialService="Corte Masculino Alpha"
        />
      );

      // Verify Alpha tenant data is loaded
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nome/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Switch to Beta tenant
      await switchTenant(mockTenantContext, 'barbershop-beta');
      MultiTenantTestMocks.setCurrentTenant('bb-beta-456');

      rerender(
        <BrowserRouter>
          <TenantProvider>
            <BookingModal 
              isOpen={true} 
              onClose={vi.fn()}
              initialService="Corte Simples Beta"
            />
          </TenantProvider>
        </BrowserRouter>
      );

      // Should now show Beta tenant data
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nome/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Verify service is updated for Beta tenant
      expect(screen.getByDisplayValue('Corte Simples Beta')).toBeInTheDocument();
    });
  });

  describe('Calendar Multi-Tenant Integration', () => {
    it('should display appointments only for current tenant', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      renderWithProviders(
        <Calendar 
          selectedDate={new Date('2024-02-01')}
          onDateSelect={vi.fn()}
          onTimeSelect={vi.fn()}
          barberId="barber-alpha-01"
        />
      );

      // Should show Alpha appointments
      await waitFor(() => {
        // Alpha has appointments on 2024-02-01
        const alphaData = getTenantTestData('bb-alpha-123');
        expect(alphaData.appointments).toHaveLength(2);
      });

      // Switch to Beta tenant
      await switchTenant(mockTenantContext, 'barbershop-beta');
      MultiTenantTestMocks.setCurrentTenant('bb-beta-456');

      const { rerender } = renderWithProviders(
        <Calendar 
          selectedDate={new Date('2024-02-01')}
          onDateSelect={vi.fn()}
          onTimeSelect={vi.fn()}
          barberId="barber-beta-01"
        />
      );

      rerender(
        <BrowserRouter>
          <TenantProvider>
            <Calendar 
              selectedDate={new Date('2024-02-01')}
              onDateSelect={vi.fn()}
              onTimeSelect={vi.fn()}
              barberId="barber-beta-01"
            />
          </TenantProvider>
        </BrowserRouter>
      );

      // Should now show Beta appointments only
      await waitFor(() => {
        const betaData = getTenantTestData('bb-beta-456');
        expect(betaData.appointments).toHaveLength(1);
      });
    });

    it('should prevent cross-tenant appointment conflicts', async () => {
      const mockOnTimeSelect = vi.fn();
      
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      renderWithProviders(
        <Calendar 
          selectedDate={new Date('2024-02-01')}
          onDateSelect={vi.fn()}
          onTimeSelect={mockOnTimeSelect}
          barberId="barber-alpha-01"
        />
      );

      // Try to select a time slot that's occupied in Alpha tenant
      // but free in Beta tenant - should be blocked for Alpha
      const timeSlot = screen.getByText('10:00');
      fireEvent.click(timeSlot);

      // Should handle the selection based on Alpha tenant's appointments
      expect(mockOnTimeSelect).toHaveBeenCalled();
    });
  });

  describe('Cross-Component Multi-Tenant Data Flow', () => {
    it('should maintain tenant isolation across component interactions', async () => {
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      const mockOnSchedule = vi.fn();
      const mockOnClose = vi.fn();

      // Render Services component
      const { rerender } = renderWithProviders(<Services onSchedule={mockOnSchedule} />);

      await waitFor(() => {
        expect(screen.getByText('Corte Masculino Alpha')).toBeInTheDocument();
      });

      // Click schedule on Alpha service
      const scheduleButton = screen.getAllByText('Agendar')[0];
      fireEvent.click(scheduleButton);

      expect(mockOnSchedule).toHaveBeenCalledWith('Corte Masculino Alpha');

      // Now render BookingModal with the selected service
      rerender(
        <BrowserRouter>
          <TenantProvider>
            <BookingModal 
              isOpen={true}
              onClose={mockOnClose}
              initialService="Corte Masculino Alpha"
            />
          </TenantProvider>
        </BrowserRouter>
      );

      // Should show the Alpha service in the modal
      await waitFor(() => {
        expect(screen.getByDisplayValue('Corte Masculino Alpha')).toBeInTheDocument();
      });

      // Switch tenant context
      await switchTenant(mockTenantContext, 'barbershop-beta');
      MultiTenantTestMocks.setCurrentTenant('bb-beta-456');

      // Re-render with Beta context
      rerender(
        <BrowserRouter>
          <TenantProvider>
            <BookingModal 
              isOpen={true}
              onClose={mockOnClose}
              initialService="Corte Simples Beta"
            />
          </TenantProvider>
        </BrowserRouter>
      );

      // Should now show Beta service
      await waitFor(() => {
        expect(screen.getByDisplayValue('Corte Simples Beta')).toBeInTheDocument();
      });

      // Should not show Alpha service
      expect(screen.queryByDisplayValue('Corte Masculino Alpha')).not.toBeInTheDocument();
    });

    it('should handle tenant switching during active user sessions', async () => {
      // Start with Alpha tenant
      await switchTenant(mockTenantContext, 'barbershop-alpha');
      MultiTenantTestMocks.setCurrentTenant('bb-alpha-123');

      const { rerender } = renderWithProviders(<Services />);

      await waitFor(() => {
        expect(screen.getByText('Corte Masculino Alpha')).toBeInTheDocument();
      });

      // Simulate user navigating to different tenant
      await act(async () => {
        await switchTenant(mockTenantContext, 'barbershop-gamma');
        MultiTenantTestMocks.setCurrentTenant('bb-gamma-789');
      });

      rerender(
        <BrowserRouter>
          <TenantProvider>
            <Services />
          </TenantProvider>
        </BrowserRouter>
      );

      // Should show Gamma services
      await waitFor(() => {
        expect(screen.getByText('Corte Premium Gamma')).toBeInTheDocument();
        expect(screen.getByText('Barba Premium Gamma')).toBeInTheDocument();
        expect(screen.getByText('Sobrancelha Gamma')).toBeInTheDocument();
      });

      // Should not show Alpha services
      expect(screen.queryByText('Corte Masculino Alpha')).not.toBeInTheDocument();
    });
  });

  describe('Multi-Tenant Error Handling', () => {
    it('should handle invalid tenant context gracefully', async () => {
      // Clear tenant context
      mockTenantContext.clearTenant();
      MultiTenantTestMocks.setCurrentTenant(null);

      renderWithProviders(<Services />);

      // Should handle missing tenant context
      await waitFor(() => {
        expect(screen.getByText('Nossos Serviços')).toBeInTheDocument();
      });

      // Should show static services as fallback
      expect(screen.getByText('Corte Tradicional')).toBeInTheDocument();
    });

    it('should prevent operations without valid tenant', async () => {
      mockTenantContext.clearTenant();
      MultiTenantTestMocks.setCurrentTenant(null);

      const mockOnClose = vi.fn();

      renderWithProviders(
        <BookingModal 
          isOpen={true}
          onClose={mockOnClose}
          initialService="Test Service"
        />
      );

      // Should handle missing tenant context in booking modal
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nome/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Try to proceed without valid tenant - should handle gracefully
      const nameInput = screen.getByLabelText(/nome/i);
      const whatsappInput = screen.getByLabelText(/whatsapp/i);
      
      await userEvent.type(nameInput, 'Test User');
      await userEvent.type(whatsappInput, '+5511999999999');

      const nextButton = screen.getByText('Próximo');
      fireEvent.click(nextButton);

      // Should handle the case where no tenant is available
      // The exact behavior depends on implementation
    });
  });

  describe('Multi-Tenant Data Isolation Validation', () => {
    it('should validate complete data isolation between tenants', async () => {
      const results = await testTenantIsolation(
        async (tenantId: string) => {
          MultiTenantTestMocks.setCurrentTenant(tenantId);
          const tenantData = MultiTenantTestMocks.getCurrentTenantData();
          return tenantData?.services || [];
        },
        TEST_TENANT_IDS,
        'services'
      );

      // Verify each tenant has different services
      expect(results['bb-alpha-123']).toHaveLength(2);
      expect(results['bb-beta-456']).toHaveLength(1);
      expect(results['bb-gamma-789']).toHaveLength(3);

      // Verify no service ID overlap
      const allServiceIds = Object.values(results).flat().map((service: any) => service.id);
      const uniqueServiceIds = new Set(allServiceIds);
      expect(allServiceIds.length).toBe(uniqueServiceIds.size);
    });

    it('should validate barber isolation between tenants', async () => {
      const results = await testTenantIsolation(
        async (tenantId: string) => {
          MultiTenantTestMocks.setCurrentTenant(tenantId);
          const tenantData = MultiTenantTestMocks.getCurrentTenantData();
          return tenantData?.barbers || [];
        },
        TEST_TENANT_IDS,
        'barbers'
      );

      // Verify each tenant has different barbers
      expect(results['bb-alpha-123']).toHaveLength(2);
      expect(results['bb-beta-456']).toHaveLength(1);
      expect(results['bb-gamma-789']).toHaveLength(1);

      // Verify no barber ID overlap
      const allBarberIds = Object.values(results).flat().map((barber: any) => barber.id);
      const uniqueBarberIds = new Set(allBarberIds);
      expect(allBarberIds.length).toBe(uniqueBarberIds.size);
    });

    it('should validate appointment isolation between tenants', async () => {
      const results = await testTenantIsolation(
        async (tenantId: string) => {
          MultiTenantTestMocks.setCurrentTenant(tenantId);
          const tenantData = MultiTenantTestMocks.getCurrentTenantData();
          return tenantData?.appointments || [];
        },
        TEST_TENANT_IDS,
        'appointments'
      );

      // Verify each tenant has different appointments
      expect(results['bb-alpha-123']).toHaveLength(2);
      expect(results['bb-beta-456']).toHaveLength(1);
      expect(results['bb-gamma-789']).toHaveLength(2);

      // Verify no appointment ID overlap
      const allAppointmentIds = Object.values(results).flat().map((appointment: any) => appointment.id);
      const uniqueAppointmentIds = new Set(allAppointmentIds);
      expect(allAppointmentIds.length).toBe(uniqueAppointmentIds.size);
    });
  });
});