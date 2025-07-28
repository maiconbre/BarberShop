import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger } from '../utils/logger';
import { cacheService } from '../services/CacheService';
import { CURRENT_ENV } from '../config/environmentConfig';

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
  lastFetch: number;
  
  // Rate limiting
  requestCount: number;
  lastRequestTime: number;
  
  // Actions
  fetchBarbers: (force?: boolean) => Promise<void>;
  getBarberById: (id: string) => Barber | null;
  createBarber: (barberData: Partial<Barber>) => Promise<Barber>;
  updateBarber: (id: string, barberData: Partial<Barber>) => Promise<Barber>;
  deleteBarber: (id: string) => Promise<void>;
  setFilters: (filters: Partial<BarberFilters>) => void;
  clearError: () => void;
  reset: () => void;
}

// Constants
const CACHE_KEY = 'barbers';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10; // Máximo 10 requisições por minuto
const MIN_REQUEST_INTERVAL = 2000; // Mínimo 2 segundos entre requisições

const initialFilters: BarberFilters = {
  search: undefined,
  role: undefined,
};

/**
 * Barber store with caching and rate limiting
 */
export const useBarberStore = create<BarberState>()(subscribeWithSelector((set, get) => {  
  // Rate limiting helper
  const canMakeRequest = (): boolean => {
    const now = Date.now();
    const { requestCount, lastRequestTime } = get();
    
    // Reset counter if window has passed
    if (now - lastRequestTime > RATE_LIMIT_WINDOW) {
      set({ requestCount: 0, lastRequestTime: now });
      return true;
    }
    
    // Check if we've exceeded the rate limit
    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
      const timeUntilReset = RATE_LIMIT_WINDOW - (now - lastRequestTime);
      set({ 
        error: `Muitas requisições. Tente novamente em ${Math.ceil(timeUntilReset / 1000)} segundos.` 
      });
      return false;
    }
    
    // Check minimum interval between requests
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      const timeUntilNext = MIN_REQUEST_INTERVAL - (now - lastRequestTime);
      set({ 
        error: `Aguarde ${Math.ceil(timeUntilNext / 1000)} segundos antes da próxima requisição.` 
      });
      return false;
    }
    
    return true;
  };

  return {
    // Initial state
    barbers: [],
    currentBarber: null,
    isLoading: false,
    error: null,
    filters: initialFilters,
    lastFetch: 0,
    requestCount: 0,
    lastRequestTime: 0,

    // Actions
    fetchBarbers: async (force = false) => {
      const state = get();
      const now = Date.now();
      
      // Evitar múltiplas requisições simultâneas
      if (state.isLoading) {
        return;
      }
      
      // Check cache first (unless forced)
      if (!force && now - state.lastFetch < CACHE_TTL && state.barbers.length > 0) {
        logger.componentDebug('Barbeiros já carregados recentemente');
        return;
      }
      
      // Rate limiting check
      if (!canMakeRequest()) {
        return;
      }
      
      // Atualizar estado de loading apenas uma vez
      set({ 
        isLoading: true, 
        error: null,
        requestCount: state.requestCount + 1,
        lastRequestTime: now
      });
      
      try {
        const response = await fetch(`${CURRENT_ENV.apiUrl}/api/barbers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Muitas requisições. Tente novamente em alguns segundos.');
          }
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          const barbers = data.data;
          
          // Atualizar estado apenas uma vez com todos os dados
          set({ 
            barbers, 
            lastFetch: now,
            isLoading: false,
            error: null 
          });
          
          // Update cache em background sem afetar o estado
          try {
            cacheService.set(CACHE_KEY, barbers, { ttl: CACHE_TTL });
            logger.componentDebug(`${barbers.length} barbeiros carregados e salvos no cache`);
          } catch (cacheError) {
            logger.componentError('Erro ao salvar cache de barbeiros:', cacheError);
          }
        } else {
          throw new Error('Formato de resposta inválido');
        }
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
      // Rate limiting check
      if (!canMakeRequest()) {
        throw new Error(get().error || 'Rate limit exceeded');
      }
      
      set({ isLoading: true, error: null });
      
      try {
        // Update request tracking
        const { requestCount } = get();
        const now = Date.now();
        set({ 
          requestCount: requestCount + 1, 
          lastRequestTime: now 
        });
        
        const response = await fetch(`${CURRENT_ENV.apiUrl}/api/barbers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(barberData)
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Muitas requisições. Tente novamente em alguns segundos.');
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao criar barbeiro');
        }
        
        const data = await response.json();
        const newBarber = data.data;
        
        // Update state
        set(state => ({ 
          barbers: [...state.barbers, newBarber],
          isLoading: false 
        }));
        
        // Update cache
        try {
          const { barbers } = get();
          await cacheService.set(CACHE_KEY, barbers, { ttl: CACHE_TTL });
          await cacheService.set(CACHE_KEY, barbers, { ttl: CACHE_TTL });
        } catch (cacheError) {
          logger.componentError('Erro ao atualizar cache após criação:', cacheError);
        }
        
        return newBarber;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao criar barbeiro';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    updateBarber: async (id: string, barberData: Partial<Barber>) => {
      // Rate limiting check
      if (!canMakeRequest()) {
        throw new Error(get().error || 'Rate limit exceeded');
      }
      
      set({ isLoading: true, error: null });
      
      try {
        // Update request tracking
        const { requestCount } = get();
        const now = Date.now();
        set({ 
          requestCount: requestCount + 1, 
          lastRequestTime: now 
        });
        
        const response = await fetch(`${CURRENT_ENV.apiUrl}/api/barbers/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(barberData)
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Muitas requisições. Tente novamente em alguns segundos.');
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao atualizar barbeiro');
        }
        
        const data = await response.json();
        const updatedBarber = data.data;
        
        // Update state
        set(state => ({ 
          barbers: state.barbers.map(barber => 
            barber.id === id ? updatedBarber : barber
          ),
          isLoading: false 
        }));
        
        // Update cache
        try {
          const { barbers } = get();
          // Using the imported cacheService instance instead of creating new one
          await cacheService.set(CACHE_KEY, barbers, { ttl: CACHE_TTL });
        } catch (cacheError) {
          logger.componentError('Erro ao atualizar cache após atualização:', cacheError);
        }
        
        return updatedBarber;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar barbeiro';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    deleteBarber: async (id: string) => {
      // Rate limiting check
      if (!canMakeRequest()) {
        throw new Error(get().error || 'Rate limit exceeded');
      }
      
      set({ isLoading: true, error: null });
      
      try {
        // Update request tracking
        const { requestCount } = get();
        const now = Date.now();
        set({ 
          requestCount: requestCount + 1, 
          lastRequestTime: now 
        });
        
        const response = await fetch(`${CURRENT_ENV.apiUrl}/api/barbers/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Muitas requisições. Tente novamente em alguns segundos.');
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao excluir barbeiro');
        }
        
        // Update state
        set(state => ({ 
          barbers: state.barbers.filter(barber => barber.id !== id),
          isLoading: false 
        }));
        
        // Update cache
        try {
          const { barbers } = get();
          // Using the imported cacheService instance instead of creating new one
          await cacheService.set(CACHE_KEY, barbers, { ttl: CACHE_TTL });
        } catch (cacheError) {
          logger.componentError('Erro ao atualizar cache após exclusão:', cacheError);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir barbeiro';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    setFilters: (filters: Partial<BarberFilters>) => {
      set(state => ({ 
        filters: { ...state.filters, ...filters } 
      }));
    },

    clearError: () => {
      set({ error: null });
    },

    reset: () => {
      set({
        barbers: [],
        currentBarber: null,
        isLoading: false,
        error: null,
        filters: initialFilters,
        lastFetch: 0,
        requestCount: 0,
        lastRequestTime: 0,
      });
    },
  };
}));

// Selectors - removido useBarbers para evitar re-renders desnecessários

// Specific selectors
export const useBarberList = () => useBarberStore((state) => state.barbers);
export const useCurrentBarber = () => useBarberStore((state) => state.currentBarber);
export const useBarberLoading = () => useBarberStore((state) => state.isLoading);
export const useBarberError = () => useBarberStore((state) => state.error);
export const useBarberFilters = () => useBarberStore((state) => state.filters);

// Actions - usando seletores individuais para evitar re-renders
export const useFetchBarbers = () => useBarberStore((state) => state.fetchBarbers);
export const useGetBarberById = () => useBarberStore((state) => state.getBarberById);
export const useCreateBarber = () => useBarberStore((state) => state.createBarber);
export const useUpdateBarber = () => useBarberStore((state) => state.updateBarber);
export const useDeleteBarber = () => useBarberStore((state) => state.deleteBarber);
export const useSetBarberFilters = () => useBarberStore((state) => state.setFilters);
export const useClearBarberError = () => useBarberStore((state) => state.clearError);
export const useResetBarberStore = () => useBarberStore((state) => state.reset);