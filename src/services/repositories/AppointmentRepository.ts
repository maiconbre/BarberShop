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
      const barbershopId = localStorage.getItem('barbershopId');
      const tenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = tenantId || barbershopId;
      
      console.log('AppointmentRepository.findById - Debug:', {
        id,
        barbershopId,
        tenantId,
        effectiveTenantId
      });
      
      if (!effectiveTenantId) {
        console.warn('AppointmentRepository.findById - No tenant ID available');
        return null;
      }

      const { data, error } = await supabase
        .from('Appointments')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', effectiveTenantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('AppointmentRepository.findById - Not found');
          return null;
        }
        console.error('AppointmentRepository.findById - Error:', error);
        throw error;
      }
      
      console.log('AppointmentRepository.findById - Success:', data);
      return AppointmentAdapter.fromBackend(data);
    } catch (error) {
      console.error('AppointmentRepository.findById - Exception:', error);
      return null;
    }
  }

  /**
   * Busca todos os agendamentos com filtros opcionais
   */
  async findAll(filters?: Record<string, unknown>): Promise<Appointment[]> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      const tenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = tenantId || barbershopId;
      
      console.log('AppointmentRepository.findAll - Debug:', {
        barbershopId,
        tenantId,
        effectiveTenantId,
        filters
      });
      
      if (!effectiveTenantId) {
        console.warn('AppointmentRepository.findAll - No tenant ID available');
        return [];
      }

      let query = supabase.from('Appointments').select('*').eq('tenant_id', effectiveTenantId);
      
      if (filters?.barberId) {
        query = query.eq('barberId', filters.barberId);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('AppointmentRepository.findAll - Error:', error);
        throw new Error(error.message);
      }
      
      console.log(`AppointmentRepository.findAll - Found ${data?.length || 0} appointments`);
      return (data || []).map(appointment => AppointmentAdapter.fromBackend(appointment));
    } catch (error) {
      console.error('AppointmentRepository.findAll - Exception:', error);
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
      const barbershopId = localStorage.getItem('barbershopId');
      const tenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = tenantId || barbershopId;
      
      console.log('AppointmentRepository.create - Debug:', {
        barbershopId,
        tenantId,
        effectiveTenantId
      });
      
      if (!effectiveTenantId) {
        throw new Error('Tenant ID required - please reload the page');
      }
      
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
        tenant_id: effectiveTenantId
      };

      const { data, error } = await supabase.from('Appointments').insert(supabaseData).select().single();

      if (error) {
        console.error('AppointmentRepository.create - Error:', error);
        throw new Error(error.message);
      }
      
      console.log('AppointmentRepository.create - Success:', data);
      return AppointmentAdapter.fromBackend(data);
    } catch (error) {
      console.error('AppointmentRepository.create - Exception:', error);
      throw error;
    }
  }

  /**
   * Atualiza um agendamento existente
   */
  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    try {
      const barbershopId = localStorage.getItem('barbershopId');
      const tenantId = localStorage.getItem('tenantId');
      const effectiveTenantId = tenantId || barbershopId;
      
      console.log('AppointmentRepository.update - Debug:', {
        id,
        barbershopId,
        tenantId,
        effectiveTenantId,
        updates
      });
      
      if (!effectiveTenantId) {
        throw new Error('Tenant ID required for update');
      }
      
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

      const { data, error } = await supabase
        .from('Appointments')
        .update(supabaseUpdates)
        .eq('id', id)
        .eq('tenant_id', effectiveTenantId)
        .select()
        .single();

      if (error) {
        console.error('AppointmentRepository.update - Error:', error);
        throw new Error(error.message);
      }
      
      console.log('AppointmentRepository.update - Success:', data);
      return AppointmentAdapter.fromBackend(data);
    } catch (error) {
      console.error('AppointmentRepository.update - Exception:', error);
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
    const barbershopId = localStorage.getItem('barbershopId');
    const tenantId = localStorage.getItem('tenantId');
    const effectiveTenantId = tenantId || barbershopId;
    
    console.log('AppointmentRepository.delete - Debug:', {
      id,
      barbershopId,
      tenantId,
      effectiveTenantId
    });
    
    if (!effectiveTenantId) {
      throw new Error('Tenant ID required for delete');
    }
    
    const { error } = await supabase
      .from('Appointments')
      .delete()
      .eq('id', id)
      .eq('tenant_id', effectiveTenantId);
      
    if (error) {
      console.error('AppointmentRepository.delete - Error:', error);
      throw error;
    }
    
    console.log('AppointmentRepository.delete - Success');
  }

  /**
   * Verifica se um agendamento existe
   */
  async exists(id: string): Promise<boolean> {
    const { count } = await supabase.from('Appointments').select('*', { count: 'exact', head: true }).eq('id', id);
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