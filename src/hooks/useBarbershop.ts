// Hook personalizado para gerenciar operações de barbearias com Supabase
import { useState, useEffect, useCallback } from 'react';
import { 
  barbershopService, 
  type CreateBarbershopData, 
  type CreateBarberData, 
  type CreateServiceData, 
  type CreateAppointmentData, 
  type CreateCommentData 
} from '../services/supabaseBarbershop';
import type { Barbershop, Barber, Service, Appointment, Comment } from '../config/supabaseConfig';

export interface UseBarbershopReturn {
  // Estados
  barbershops: Barbershop[];
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  comments: Comment[];
  loading: boolean;
  error: string | null;

  // Operações de Barbearia
  createBarbershop: (data: CreateBarbershopData) => Promise<{ success: boolean; barbershop?: Barbershop; error?: string }>;
  getBarbershops: () => Promise<void>;
  getBarbershopById: (id: string) => Promise<{ barbershop?: Barbershop; error?: string }>;
  updateBarbershop: (id: string, data: Partial<CreateBarbershopData>) => Promise<{ success: boolean; barbershop?: Barbershop; error?: string }>;

  // Operações de Barbeiros
  createBarber: (barbershopId: string, data: CreateBarberData) => Promise<{ success: boolean; barber?: Barber; error?: string }>;
  getTenantBarbers: () => Promise<void>;
  getBarbersByBarbershop: (barbershopId: string) => Promise<{ barbers?: Barber[]; error?: string }>;
  updateBarber: (id: string, data: Partial<CreateBarberData>) => Promise<{ success: boolean; barber?: Barber; error?: string }>;

  // Operações de Serviços
  createService: (data: CreateServiceData) => Promise<{ success: boolean; service?: Service; error?: string }>;
  getTenantServices: () => Promise<void>;
  updateService: (id: string, data: Partial<CreateServiceData>) => Promise<{ success: boolean; service?: Service; error?: string }>;

  // Operações de Agendamentos
  createAppointment: (data: CreateAppointmentData) => Promise<{ success: boolean; appointment?: Appointment; error?: string }>;
  getTenantAppointments: (startDate?: string, endDate?: string) => Promise<void>;
  getAppointmentsByBarber: (barberId: string, startDate?: string, endDate?: string) => Promise<{ appointments?: Appointment[]; error?: string }>;
  updateAppointmentStatus: (id: string, status: string) => Promise<{ success: boolean; appointment?: Appointment; error?: string }>;

  // Operações de Comentários
  createComment: (data: CreateCommentData) => Promise<{ success: boolean; comment?: Comment; error?: string }>;
  getTenantComments: () => Promise<void>;
  getCommentsByBarbershop: (barbershopId: string) => Promise<{ comments?: Comment[]; error?: string }>;

  // Utilitários
  clearError: () => void;
  refreshData: () => Promise<void>;
}

export const useBarbershop = (): UseBarbershopReturn => {
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Operações de Barbearia
  const createBarbershop = useCallback(async (data: CreateBarbershopData) => {
    setLoading(true);
    setError(null);
    try {
      const { barbershop, error: createError } = await barbershopService.createBarbershop(data);
      
      if (createError) {
        setError(createError);
        return { success: false, error: createError };
      }

      if (barbershop) {
        setBarbershops(prev => [barbershop, ...prev]);
        return { success: true, barbershop };
      }

      return { success: false, error: 'Failed to create barbershop' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getBarbershops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { barbershops: fetchedBarbershops, error: fetchError } = await barbershopService.getBarbershops();
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setBarbershops(fetchedBarbershops);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBarbershopById = useCallback(async (id: string) => {
    try {
      const { barbershop, error: fetchError } = await barbershopService.getBarbershopById(id);
      
      if (fetchError) {
        return { error: fetchError };
      }

      return { barbershop };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { error: errorMessage };
    }
  }, []);

  const updateBarbershop = useCallback(async (id: string, data: Partial<CreateBarbershopData>) => {
    setLoading(true);
    setError(null);
    try {
      const { barbershop, error: updateError } = await barbershopService.updateBarbershop(id, data);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      if (barbershop) {
        setBarbershops(prev => prev.map(b => b.id === id ? barbershop : b));
        return { success: true, barbershop };
      }

      return { success: false, error: 'Failed to update barbershop' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Operações de Barbeiros
  const createBarber = useCallback(async (barbershopId: string, data: CreateBarberData) => {
    setLoading(true);
    setError(null);
    try {
      const { barber, error: createError } = await barbershopService.createBarber(barbershopId, data);
      
      if (createError) {
        setError(createError);
        return { success: false, error: createError };
      }

      if (barber) {
        setBarbers(prev => [barber, ...prev]);
        return { success: true, barber };
      }

      return { success: false, error: 'Failed to create barber' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantBarbers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { barbers: fetchedBarbers, error: fetchError } = await barbershopService.getTenantBarbers();
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setBarbers(fetchedBarbers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBarbersByBarbershop = useCallback(async (barbershopId: string) => {
    try {
      const { barbers: fetchedBarbers, error: fetchError } = await barbershopService.getBarbersByBarbershop(barbershopId);
      
      if (fetchError) {
        return { error: fetchError };
      }

      return { barbers: fetchedBarbers };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { error: errorMessage };
    }
  }, []);

  const updateBarber = useCallback(async (id: string, data: Partial<CreateBarberData>) => {
    setLoading(true);
    setError(null);
    try {
      const { barber, error: updateError } = await barbershopService.updateBarber(id, data);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      if (barber) {
        setBarbers(prev => prev.map(b => b.id === id ? barber : b));
        return { success: true, barber };
      }

      return { success: false, error: 'Failed to update barber' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Operações de Serviços
  const createService = useCallback(async (data: CreateServiceData) => {
    setLoading(true);
    setError(null);
    try {
      const { service, error: createError } = await barbershopService.createService(data);
      
      if (createError) {
        setError(createError);
        return { success: false, error: createError };
      }

      if (service) {
        setServices(prev => [service, ...prev]);
        return { success: true, service };
      }

      return { success: false, error: 'Failed to create service' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { services: fetchedServices, error: fetchError } = await barbershopService.getTenantServices();
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setServices(fetchedServices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateService = useCallback(async (id: string, data: Partial<CreateServiceData>) => {
    setLoading(true);
    setError(null);
    try {
      const { service, error: updateError } = await barbershopService.updateService(id, data);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      if (service) {
        setServices(prev => prev.map(s => s.id === id ? service : s));
        return { success: true, service };
      }

      return { success: false, error: 'Failed to update service' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Operações de Agendamentos
  const createAppointment = useCallback(async (data: CreateAppointmentData) => {
    setLoading(true);
    setError(null);
    try {
      const { appointment, error: createError } = await barbershopService.createAppointment(data);
      
      if (createError) {
        setError(createError);
        return { success: false, error: createError };
      }

      if (appointment) {
        setAppointments(prev => [appointment, ...prev]);
        return { success: true, appointment };
      }

      return { success: false, error: 'Failed to create appointment' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantAppointments = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { appointments: fetchedAppointments, error: fetchError } = await barbershopService.getTenantAppointments(startDate, endDate);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setAppointments(fetchedAppointments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAppointmentsByBarber = useCallback(async (barberId: string, startDate?: string, endDate?: string) => {
    try {
      const { appointments: fetchedAppointments, error: fetchError } = await barbershopService.getAppointmentsByBarber(barberId, startDate, endDate);
      
      if (fetchError) {
        return { error: fetchError };
      }

      return { appointments: fetchedAppointments };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { error: errorMessage };
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (id: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const { appointment, error: updateError } = await barbershopService.updateAppointmentStatus(id, status);
      
      if (updateError) {
        setError(updateError);
        return { success: false, error: updateError };
      }

      if (appointment) {
        setAppointments(prev => prev.map(a => a.id === id ? appointment : a));
        return { success: true, appointment };
      }

      return { success: false, error: 'Failed to update appointment status' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Operações de Comentários
  const createComment = useCallback(async (data: CreateCommentData) => {
    setLoading(true);
    setError(null);
    try {
      const { comment, error: createError } = await barbershopService.createComment(data);
      
      if (createError) {
        setError(createError);
        return { success: false, error: createError };
      }

      if (comment) {
        setComments(prev => [comment, ...prev]);
        return { success: true, comment };
      }

      return { success: false, error: 'Failed to create comment' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTenantComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { comments: fetchedComments, error: fetchError } = await barbershopService.getTenantComments();
      
      if (fetchError) {
        setError(fetchError);
        return;
      }

      setComments(fetchedComments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCommentsByBarbershop = useCallback(async (barbershopId: string) => {
    try {
      const { comments: fetchedComments, error: fetchError } = await barbershopService.getCommentsByBarbershop(barbershopId);
      
      if (fetchError) {
        return { error: fetchError };
      }

      return { comments: fetchedComments };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { error: errorMessage };
    }
  }, []);

  // Atualizar todos os dados
  const refreshData = useCallback(async () => {
    await Promise.all([
      getBarbershops(),
      getTenantBarbers(),
      getTenantServices(),
      getTenantAppointments(),
      getTenantComments()
    ]);
  }, [getBarbershops, getTenantBarbers, getTenantServices, getTenantAppointments, getTenantComments]);

  return {
    // Estados
    barbershops,
    barbers,
    services,
    appointments,
    comments,
    loading,
    error,

    // Operações de Barbearia
    createBarbershop,
    getBarbershops,
    getBarbershopById,
    updateBarbershop,

    // Operações de Barbeiros
    createBarber,
    getTenantBarbers,
    getBarbersByBarbershop,
    updateBarber,

    // Operações de Serviços
    createService,
    getTenantServices,
    updateService,

    // Operações de Agendamentos
    createAppointment,
    getTenantAppointments,
    getAppointmentsByBarber,
    updateAppointmentStatus,

    // Operações de Comentários
    createComment,
    getTenantComments,
    getCommentsByBarbershop,

    // Utilitários
    clearError,
    refreshData
  };
};

export default useBarbershop;