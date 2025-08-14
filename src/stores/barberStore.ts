import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useBarberRepository } from '@/services/ServiceFactory';
import { createTenantAwareRepository } from '@/services/TenantAwareRepository';
import { createTenantAwareCache } from '@/services/TenantAwareCache';
import { logger } from '../utils/logger';

// Types
export interface Barber {
  id: string;
  name: string;
  username?: string;
  whatsapp?: string;
  pix?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BarberFilters {
  search?: string;
  role?: string;
}

export interface BarberState {
  // State
  barbers: Barber[];
  currentBarber: Barber | null;
  isLoading: boolean;
  error: string | null;
  filters: BarberFilters;
  
  // Multi-tenant state
  barbershopId: string | null;
  tenantRepository: any | null;
  tenantCache: any | null;
  
  // Actions
  initializeTenant: (barbershopId: string) => void;
  fetchBarbers: (force?: boolean) => Promise<void>;
  getBarberById: (id: string) => Barber | null;
  createBarber: (barberData: Partial<Barber>) => Promise<Barber>;
  updateBarber: (id: string, barberData: Partial<Barber>) => Promise<Barber>;
  deleteBarber: (id: string) => Promise<void>;
  
  // Multi-tenant filtering actions
  fetchActiveBarbers: () => Promise<void>;
  fetchBarbersByService: (serviceId: string) => Promise<void>;
  fetchBarbersByName: (name: string) => Promise<void>;
  fetchBarbersBySpecialty: (specialty: string) => Promise<void>;
  
  // Backend-specific operations
  updateContact: (id: string, whatsapp: string) => Promise<Barber>;
  updatePaymentInfo: (id: string, pix: string) => Promise<Barber>;
  toggleActive: (id: string, isActive: boolean) => Promise<Barber>;
  
  setFilters: (filters: Partial<BarberFilters>) => void;
  clearError: () => void;
  clearTenantCache: () => void;
  reset: () => void;
}

const initialFilters: BarberFilters = {
  search: undefined,
  role: undefined,
};

/**
 * @deprecated Use useBarbers hook from hooks/useBarbers.ts instead
 * This store is kept for backward compatibility but should not be used in new code
 * 
 * Multi-tenant barber store with repository pattern
 */
export const useBarberStore = create<BarberState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    barbers: [],
    currentBarber: null,
    isLoading: false,
    error: null,
    filters: initialFilters,
    
    // Multi-tenant state
    barbershopId: null,
    tenantRepository: null,
    tenantCache: null,

    // Actions
    initializeTenant: (barbershopId: string) => {
      const baseRepository = useBarberRepository();
      const tenantRepository = createTenantAwareRepository(baseRepository, () => barbershopId);
      const tenantCache = createTenantAwareCache(() => barbershopId);
      
      set({
        barbershopId,
        tenantRepository,
        tenantCache,
      });
    },

    fetchBarbers: async (force = false) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      // Evitar múltiplas requisições simultâneas
      if (get().isLoading) {
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const cacheKey = 'barbers:all';
        
        // Check cache first (unless forced)
        if (!force) {
          const cached = tenantCache?.get(cacheKey);
          if (cached) {
            set({ barbers: cached, isLoading: false });
            logger.componentDebug('Barbeiros carregados do cache');
            return;
          }
        }
        
        const barbers = await tenantRepository.findAll();
        
        // Cache the result
        tenantCache?.set(cacheKey, barbers, { ttl: 5 * 60 * 1000 }); // 5 minutes
        
        set({ 
          barbers, 
          isLoading: false,
          error: null 
        });
        
        logger.componentDebug(`${barbers.length} barbeiros carregados com sucesso`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar barbeiros';
        set({ error: errorMessage, isLoading: false });
        logger.componentError('Erro ao buscar barbeiros:', error);
      }
    },

    getBarberById: (id: string) => {
      const { barbers } = get();
      return barbers.find(barber => barber.id === id) || null;
    },

    createBarber: async (barberData: Partial<Barber>) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        throw new Error('Tenant not initialized');
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const newBarber = await tenantRepository.create(barberData);
        
        // Clear cache to force refresh
        tenantCache?.clearTenantCache();
        
        // Update state
        set(state => ({ 
          barbers: [...state.barbers, newBarber],
          isLoading: false 
        }));
        
        logger.componentDebug('Barbeiro criado com sucesso:', newBarber.id);
        return newBarber;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao criar barbeiro';
        set({ error: errorMessage, isLoading: false });
        logger.componentError('Erro ao criar barbeiro:', error);
        throw error;
      }
    },

    updateBarber: async (id: string, barberData: Partial<Barber>): Promise<Barber> => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        throw new Error('Tenant not initialized');
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const updatedBarber = await tenantRepository.update(id, barberData);
        
        // Clear cache to force refresh
        tenantCache?.clearTenantCache();
        
        // Update state
        set(state => ({ 
          barbers: state.barbers.map(barber => 
            barber.id === id ? updatedBarber : barber
          ),
          isLoading: false 
        }));
        
        logger.componentDebug('Barbeiro atualizado com sucesso:', id);
        return updatedBarber;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar barbeiro';
        set({ error: errorMessage, isLoading: false });
        logger.componentError('Erro ao atualizar barbeiro:', error);
        throw error;
      }
    },

    deleteBarber: async (id: string) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        await tenantRepository.delete(id);
        
        // Clear cache to force refresh
        tenantCache?.clearTenantCache();
        
        // Update state
        set(state => ({ 
          barbers: state.barbers.filter(barber => barber.id !== id),
          isLoading: false 
        }));
        
        logger.componentDebug('Barbeiro excluído com sucesso:', id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir barbeiro';
        set({ error: errorMessage, isLoading: false });
        logger.componentError('Erro ao excluir barbeiro:', error);
        throw error;
      }
    },

    // Multi-tenant filtering actions
    fetchActiveBarbers: async () => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const cacheKey = 'barbers:active';
        
        // Try cache first
        const cached = tenantCache?.get(cacheKey);
        if (cached) {
          set({ barbers: cached, isLoading: false });
          return;
        }
        
        const barbers = await tenantRepository.findActive();
        
        // Cache the result
        tenantCache?.set(cacheKey, barbers, { ttl: 5 * 60 * 1000 });
        
        set({
          barbers,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar barbeiros ativos';
        set({ error: errorMessage, isLoading: false });
        logger.componentError('Erro ao buscar barbeiros ativos:', error);
      }
    },

    fetchBarbersByService: async (serviceId: string) => {
      const { tenantRepository, tenantCache, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const cacheKey = `barbers:service:${serviceId}`;
        
        // Try cache first
        const cached = tenantCache?.get(cacheKey);
        if (cached) {
          set({ barbers: cached, isLoading: false });
          return;
        }
        
        const barbers = await tenantRepository.findByService(serviceId);
        
        // Cache the result
        tenantCache?.set(cacheKey, barbers, { ttl: 5 * 60 * 1000 });
        
        set({
          barbers,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar barbeiros por serviço';
        set({ error: errorMessage, isLoading: false });
        logger.componentError('Erro ao buscar barbeiros por serviço:', error);
      }
    },

    fetchBarbersByName: async (name: string) => {
      const { tenantRepository, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const barbers = await tenantRepository.findByName(name);
        
        set({
          barbers,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar barbeiros por nome';
        set({ error: errorMessage, isLoading: false });
        logger.componentError('Erro ao buscar barbeiros por nome:', error);
      }
    },

    fetchBarbersBySpecialty: async (specialty: string) => {
      const { tenantRepository, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        set({ error: 'Tenant not initialized. Call initializeTenant first.' });
        return;
      }
      
      set({ isLoading: true, error: null });
      
      try {
        const barbers = await tenantRepository.findBySpecialty(specialty);
        
        set({
          barbers,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar barbeiros por especialidade';
        set({ error: errorMessage, isLoading: false });
        logger.componentError('Erro ao buscar barbeiros por especialidade:', error);
      }
    },

    // Backend-specific operations
    updateContact: async (id: string, whatsapp: string) => {
      const { tenantRepository, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        throw new Error('Tenant not initialized');
      }
      
      return tenantRepository.updateContact(id, whatsapp);
    },

    updatePaymentInfo: async (id: string, pix: string) => {
      const { tenantRepository, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        throw new Error('Tenant not initialized');
      }
      
      return tenantRepository.updatePaymentInfo(id, pix);
    },

    toggleActive: async (id: string, isActive: boolean) => {
      const { tenantRepository, barbershopId } = get();
      
      if (!barbershopId || !tenantRepository) {
        throw new Error('Tenant not initialized');
      }
      
      return tenantRepository.toggleActive(id, isActive);
    },

    setFilters: (filters: Partial<BarberFilters>) => {
      set(state => ({ 
        filters: { ...state.filters, ...filters } 
      }));
    },

    clearError: () => {
      set({ error: null });
    },

    clearTenantCache: () => {
      const { tenantCache } = get();
      tenantCache?.clearTenantCache();
    },

    reset: () => {
      set({
        barbers: [],
        currentBarber: null,
        isLoading: false,
        error: null,
        filters: initialFilters,
        barbershopId: null,
        tenantRepository: null,
        tenantCache: null,
      });
    },
  })));

// Selectors for backward compatibility
export const useBarberList = () => useBarberStore((state) => state.barbers);
export const useCurrentBarber = () => useBarberStore((state) => state.currentBarber);
export const useBarberLoading = () => useBarberStore((state) => state.isLoading);
export const useBarberError = () => useBarberStore((state) => state.error);
export const useBarberFilters = () => useBarberStore((state) => state.filters);

// Multi-tenant selectors
export const useBarberTenant = () => useBarberStore((state) => ({
  barbershopId: state.barbershopId,
  isInitialized: Boolean(state.barbershopId && state.tenantRepository)
}));

// Actions for backward compatibility
export const useBarberActions = () => ({
  initializeTenant: useBarberStore.getState().initializeTenant,
  fetchBarbers: useBarberStore.getState().fetchBarbers,
  createBarber: useBarberStore.getState().createBarber,
  updateBarber: useBarberStore.getState().updateBarber,
  deleteBarber: useBarberStore.getState().deleteBarber,
  clearError: useBarberStore.getState().clearError,
  clearTenantCache: useBarberStore.getState().clearTenantCache,
  reset: useBarberStore.getState().reset
});

// Legacy exports for backward compatibility
export const useFetchBarbers = () => useBarberStore((state) => state.fetchBarbers);
export const useGetBarberById = () => useBarberStore((state) => state.getBarberById);
export const useCreateBarber = () => useBarberStore((state) => state.createBarber);
export const useUpdateBarber = () => useBarberStore((state) => state.updateBarber);
export const useDeleteBarber = () => useBarberStore((state) => state.deleteBarber);
export const useSetBarberFilters = () => useBarberStore((state) => state.setFilters);
export const useClearBarberError = () => useBarberStore((state) => state.clearError);
export const useResetBarberStore = () => useBarberStore((state) => state.reset);