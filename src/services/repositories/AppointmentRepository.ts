import type { IAppointmentRepository } from '../interfaces/IAppointmentRepository';

import type { Appointment, AppointmentStatus } from '@/types';
import { AppointmentAdapter } from '@/adapters/AppointmentAdapter';
import { supabase } from '../../config/supabaseConfig';

/**
 * Repositório para agendamentos seguindo Repository Pattern
 * Baseado na estrutura real do backend Sequelize
 */
export class AppointmentRepository implements IAppointmentRepository {
  // apiService is optional and unused, kept for compatibility with ServiceFactory
  constructor() {}

  /**
   * Busca agendamento por ID
   */
  async findById(id: string): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found code in PostgREST
        throw error;
      }
      
      return AppointmentAdapter.fromBackend(data);
    } catch (error) {
      console.error('AppointmentRepository: findById failed:', error);
      return null;
    }
  }

  /**
   * Busca todos os agendamentos com filtros opcionais
   */
  async findAll(filters?: Record<string, unknown>): Promise<Appointment[]> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      
      if (!barbershopId) {
        console.warn('AppointmentRepository: No barbershopId found in localStorage');
        return [];
      }

      let query = supabase.from('appointments').select('*').eq('barbershopId', barbershopId);
      
      if (filters?.barberId) {
        query = query.eq('barberId', filters.barberId);
      }
      
      // Implement other filters as needed
      
      const { data, error } = await query;

      if (error) {
        console.error('AppointmentRepository: Error fetching appointments:', error);
        throw new Error(error.message);
      }
      
      return (data || []).map(appointment => AppointmentAdapter.fromBackend(appointment));
    } catch (error) {
      console.error('AppointmentRepository: findAll failed:', error);
      return [];
    }
  }

  /**
   * Busca agendamentos por barbeiro (usando query parameter da API)
   * GET /api/appointments?barberId=X
   */
  async findByBarberId(barberId: string): Promise<Appointment[]> {
    return this.findAll({ barberId });
  }

  /**
   * Busca agendamentos por status (filtro implementado no frontend)
   */
  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    const allAppointments = await this.findAll();
    return AppointmentAdapter.filterByStatus(allAppointments, status);
  }

  /**
   * Busca agendamentos por data (filtro implementado no frontend)
   */
  async findByDate(date: Date): Promise<Appointment[]> {
    const allAppointments = await this.findAll();
    return AppointmentAdapter.filterByDate(allAppointments, date);
  }

  /**
   * Busca agendamentos por faixa de datas (filtro implementado no frontend)
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const allAppointments = await this.findAll();
    return AppointmentAdapter.filterByDateRange(allAppointments, startDate, endDate);
  }

  /**
   * Busca agendamentos por nome do cliente (filtro implementado no frontend)
   */
  async findByClientName(clientName: string): Promise<Appointment[]> {
    const allAppointments = await this.findAll();
    return AppointmentAdapter.filterByClientName(allAppointments, clientName);
  }

  /**
   * Busca agendamentos próximos (hoje e amanhã)
   */
  async findUpcoming(): Promise<Appointment[]> {
    const allAppointments = await this.findAll();
    return AppointmentAdapter.filterUpcoming(allAppointments);
  }

  /**
   * Busca agendamentos pendentes
   */
  async findPending(): Promise<Appointment[]> {
    const allAppointments = await this.findAll();
    return AppointmentAdapter.filterPending(allAppointments);
  }

  /**
   * Busca agendamentos confirmados para um barbeiro em uma data específica
   */
  async findConfirmedByBarberAndDate(barberId: string, date: Date): Promise<Appointment[]> {
    const barberAppointments = await this.findByBarberId(barberId);
    const dateFiltered = AppointmentAdapter.filterByDate(barberAppointments, date);
    return AppointmentAdapter.filterByStatus(dateFiltered, 'confirmed');
  }

  /**
   * Cria um novo agendamento
   */
  async create(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    try {
      // Map frontend data to backend/supabase format
      const supabaseData = {
        clientName: appointmentData._backendData?.clientName || appointmentData.clientId,
        serviceName: appointmentData._backendData?.serviceName || appointmentData.serviceId,
        date: appointmentData.date.toISOString().split('T')[0],
        time: appointmentData.startTime,
        barberId: appointmentData.barberId,
        barberName: appointmentData._backendData?.barberName || '',
        price: appointmentData._backendData?.price || 0,
        wppclient: appointmentData._backendData?.wppclient || '',
        status: appointmentData.status || 'pending',
        barbershopId: localStorage.getItem('barbershopId') // Ensure tenant context
      };

      const { data, error } = await supabase.from('appointments').insert(supabaseData).select().single();

      if (error) throw new Error(error.message);
      return AppointmentAdapter.fromBackend(data);
    } catch (error) {
      console.error('AppointmentRepository: create failed:', error);
      throw error;
    }
  }

  /**
   * Atualiza um agendamento existente
   */
  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.clientId || updates._backendData?.clientName) {
        supabaseUpdates.clientName = updates._backendData?.clientName || updates.clientId;
      }
      if (updates.serviceId || updates._backendData?.serviceName) {
        supabaseUpdates.serviceName = updates._backendData?.serviceName || updates.serviceId;
      }
      if (updates.date) {
        supabaseUpdates.date = updates.date.toISOString().split('T')[0];
      }
      if (updates.startTime) {
        supabaseUpdates.time = updates.startTime;
      }
      if (updates.status) {
        supabaseUpdates.status = updates.status;
      }
      if (updates.barberId) {
        supabaseUpdates.barberId = updates.barberId;
      }

      const { data, error } = await supabase.from('appointments').update(supabaseUpdates).eq('id', id).select().single();

      if (error) throw new Error(error.message);
      return AppointmentAdapter.fromBackend(data);
    } catch (error) {
       console.error('AppointmentRepository: update failed:', error);
       throw error;
    }
  }

  /**
   * Atualiza apenas o status do agendamento
   */
  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return this.update(id, { status });
  }

  /**
   * Remove um agendamento
   */
  async delete(id: string): Promise<void> {
    await supabase.from('appointments').delete().eq('id', id);
  }

  /**
   * Verifica se um agendamento existe
   */
  async exists(id: string): Promise<boolean> {
    const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('id', id);
    return (count || 0) > 0;
  }

  /**
   * Cria agendamento com dados específicos do backend
   */
  async createWithBackendData(data: {
    clientName: string;
    serviceName: string;
    date: Date;
    time: string;
    barberId: string;
    barberName: string;
    price: number;
    wppclient: string;
    status?: AppointmentStatus;
  }): Promise<Appointment> {
    // Implementação direta via Supabase para evitar dependência do ApiService
    // Reutiliza a lógica de create
    const appointmentData: any = {
      clientId: data.clientName,
      serviceId: data.serviceName,
      date: data.date,
      startTime: data.time,
      barberId: data.barberId,
      status: data.status || 'pending',
      _backendData: data
    };
    return this.create(appointmentData);
  }

  /**
   * Obtém estatísticas de agendamentos
   */
  async getStatistics(): Promise<AppointmentStatistics> {
    const allAppointments = await this.findAll();
    
    const total = allAppointments.length;
    const byStatus = allAppointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1;
      return acc;
    }, {} as Record<AppointmentStatus, number>);
    
    const today = new Date();
    const todayAppointments = AppointmentAdapter.filterByDate(allAppointments, today);
    const upcomingAppointments = AppointmentAdapter.filterUpcoming(allAppointments);
    
    return {
      total,
      byStatus,
      today: todayAppointments.length,
      upcoming: upcomingAppointments.length,
      pending: byStatus.pending || 0,
      confirmed: byStatus.confirmed || 0,
      completed: byStatus.completed || 0,
      cancelled: byStatus.cancelled || 0
    };
  }





  /**
   * Verifica se o erro é de "não encontrado"
   * @deprecated logic moved to supabase error check
   */
  // private isNotFoundError(error: unknown): boolean {
  //   return (
  //     error instanceof Error &&
  //     'status' in error &&
  //     (error as ApiError).status === 404
  //   );
  // }
}

export interface AppointmentStatistics {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
  today: number;
  upcoming: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}