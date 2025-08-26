import type { IAppointmentRepository, CreateAppointmentData, UpdateAppointmentData } from '../interfaces/IAppointmentRepository';
import type { IApiService } from '../interfaces/IApiService';
import type { Appointment, AppointmentStatus } from '@/types';
import type { BackendAppointment } from '@/types/backend';
import { AppointmentAdapter } from '@/adapters/AppointmentAdapter';

// Interface for API errors with status
interface ApiError extends Error {
  status?: number;
}

/**
 * Repositório para agendamentos seguindo Repository Pattern
 * Baseado na estrutura real do backend Sequelize
 */
export class AppointmentRepository implements IAppointmentRepository {
  constructor(private apiService: IApiService) {}

  /**
   * Helper para construir URLs tenant-aware
   */
  private getTenantAwareUrl(endpoint: string): string {
    const barbershopSlug = localStorage.getItem('barbershopSlug');
    const barbershopId = localStorage.getItem('barbershopId');
    
    if (barbershopSlug) {
      // Remove /api do início do endpoint para evitar duplicação
      const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
      return `/api/app/${barbershopSlug}${cleanEndpoint}`;
    } else if (barbershopId) {
      return `${endpoint}?barbershopId=${barbershopId}`;
    }
    
    return endpoint;
  }

  /**
   * Busca agendamento por ID
   */
  async findById(id: string): Promise<Appointment | null> {
    try {
      const backendAppointment = await this.apiService.get<BackendAppointment>(this.getTenantAwareUrl(`/api/appointments/${id}`));
      return AppointmentAdapter.fromBackend(backendAppointment);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Busca todos os agendamentos com filtros opcionais
   */
  async findAll(filters?: Record<string, unknown>): Promise<Appointment[]> {
    const queryParams = filters ? this.buildQueryParams(filters) : '';
    const baseUrl = this.getTenantAwareUrl('/api/appointments');
    const fullUrl = queryParams ? `${baseUrl}${queryParams}` : baseUrl;
    
    const backendAppointments = await this.apiService.get<BackendAppointment[]>(fullUrl);
    
    if (!Array.isArray(backendAppointments)) {
      return [];
    }
    
    return backendAppointments.map(appointment => AppointmentAdapter.fromBackend(appointment));
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
   * POST /api/appointments (cria com id = Date.now().toString())
   */
  async create(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    // Convert frontend data to backend format
    const backendData: CreateAppointmentData = {
      clientName: appointmentData._backendData?.clientName || appointmentData.clientId,
      serviceName: appointmentData._backendData?.serviceName || appointmentData.serviceId,
      date: appointmentData.date.toISOString().split('T')[0],
      time: appointmentData.startTime,
      barberId: appointmentData.barberId,
      barberName: appointmentData._backendData?.barberName || '',
      price: appointmentData._backendData?.price || 0,
      wppclient: appointmentData._backendData?.wppclient || '',
      status: appointmentData.status ? this.mapFrontendStatusToBackend(appointmentData.status) : 'pending'
    };

    const newBackendAppointment = await this.apiService.post<BackendAppointment>(this.getTenantAwareUrl('/api/appointments'), backendData);
    return AppointmentAdapter.fromBackend(newBackendAppointment);
  }

  /**
   * Atualiza um agendamento existente
   */
  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const backendUpdates: UpdateAppointmentData = {};
    
    if (updates.clientId || updates._backendData?.clientName) {
      backendUpdates.clientName = updates._backendData?.clientName || updates.clientId;
    }
    
    if (updates.serviceId || updates._backendData?.serviceName) {
      backendUpdates.serviceName = updates._backendData?.serviceName || updates.serviceId;
    }
    
    if (updates.date) {
      backendUpdates.date = updates.date.toISOString().split('T')[0];
    }
    
    if (updates.startTime) {
      backendUpdates.time = updates.startTime;
    }
    
    if (updates.status) {
      backendUpdates.status = this.mapFrontendStatusToBackend(updates.status);
    }
    
    if (updates.barberId) {
      backendUpdates.barberId = updates.barberId;
    }
    
    if (updates._backendData?.barberName) {
      backendUpdates.barberName = updates._backendData.barberName;
    }
    
    if (updates._backendData?.price) {
      backendUpdates.price = updates._backendData.price;
    }
    
    if (updates._backendData?.wppclient) {
      backendUpdates.wppclient = updates._backendData.wppclient;
    }

    const updatedBackendAppointment = await this.apiService.patch<BackendAppointment>(this.getTenantAwareUrl(`/api/appointments/${id}`), backendUpdates);
    return AppointmentAdapter.fromBackend(updatedBackendAppointment);
  }

  /**
   * Atualiza apenas o status do agendamento
   * PATCH /api/appointments/:id
   */
  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const backendStatus = this.mapFrontendStatusToBackend(status);
    const updatedBackendAppointment = await this.apiService.patch<BackendAppointment>(this.getTenantAwareUrl(`/api/appointments/${id}`), {
      status: backendStatus
    });
    return AppointmentAdapter.fromBackend(updatedBackendAppointment);
  }

  /**
   * Remove um agendamento
   * DELETE /api/appointments/:id
   */
  async delete(id: string): Promise<void> {
    await this.apiService.delete(this.getTenantAwareUrl(`/api/appointments/${id}`));
  }

  /**
   * Verifica se um agendamento existe
   */
  async exists(id: string): Promise<boolean> {
    try {
      const appointment = await this.findById(id);
      return appointment !== null;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
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
    const backendData = AppointmentAdapter.createDataToBackend(data);
    const newBackendAppointment = await this.apiService.post<BackendAppointment>(this.getTenantAwareUrl('/api/appointments'), backendData);
    return AppointmentAdapter.fromBackend(newBackendAppointment);
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
      pending: byStatus.scheduled || 0,
      confirmed: byStatus.confirmed || 0,
      completed: byStatus.completed || 0,
      cancelled: byStatus.cancelled || 0
    };
  }

  /**
   * Constrói parâmetros de query para filtros
   */
  private buildQueryParams(filters: Record<string, unknown>): string {
    const params = new URLSearchParams();
    const barbershopSlug = localStorage.getItem('barbershopSlug');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Skip barbershopId if we're using slug-based URLs
        if (key === 'barbershopId' && barbershopSlug) {
          return;
        }
        params.append(key, String(value));
      }
    });
    
    return params.toString() ? `?${params.toString()}` : '';
  }

  /**
   * Mapeia status do frontend para o backend
   */
  private mapFrontendStatusToBackend(frontendStatus: AppointmentStatus): string {
    const statusMap: Record<AppointmentStatus, string> = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'completed': 'completed',
      'cancelled': 'cancelled',
    };
    
    return statusMap[frontendStatus] || 'pending';
  }

  /**
   * Verifica se o erro é de "não encontrado"
   */
  private isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      'status' in error &&
      (error as ApiError).status === 404
    );
  }
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