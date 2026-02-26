import type { IRepository } from './IRepository';
import type { Appointment, AppointmentStatus } from '@/types';
import type { BackendAppointmentStatus } from '@/types/backend';
import type { AppointmentStatistics } from '../repositories/AppointmentRepository';

/**
 * Interface específica para repositório de agendamentos
 * Baseada na estrutura real do backend Sequelize
 */
export interface IAppointmentRepository extends IRepository<Appointment> {
  // Métodos baseados nos endpoints reais da API
  
  /**
   * Busca agendamentos por barbeiro (usando query parameter)
   * GET /api/appointments?barberId=X
   */
  findByBarberId(barberId: string): Promise<Appointment[]>;
  
  /**
   * Busca agendamentos por status
   * Filtro implementado no frontend
   */
  findByStatus(status: AppointmentStatus): Promise<Appointment[]>;
  
  /**
   * Busca agendamentos por data
   * Filtro implementado no frontend
   */
  findByDate(date: Date): Promise<Appointment[]>;
  
  /**
   * Busca agendamentos por faixa de datas
   * Filtro implementado no frontend
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  
  /**
   * Busca agendamentos por nome do cliente
   * Filtro implementado no frontend
   */
  findByClientName(clientName: string): Promise<Appointment[]>;
  
  /**
   * Atualiza apenas o status do agendamento
   * PATCH /api/appointments/:id
   */
  updateStatus(id: string, status: AppointmentStatus): Promise<Appointment>;
  
  /**
   * Busca agendamentos próximos (hoje e amanhã)
   * Filtro implementado no frontend
   */
  findUpcoming(): Promise<Appointment[]>;
  
  /**
   * Busca agendamentos pendentes
   * Filtro implementado no frontend
   */
  findPending(): Promise<Appointment[]>;
  
  /**
   * Busca agendamentos confirmados para um barbeiro em uma data específica
   * Combinação de filtros implementados no frontend
   */
  findConfirmedByBarberAndDate(barberId: string, date: Date): Promise<Appointment[]>;
  
  /**
   * Cria agendamento com dados específicos do backend
   * Usa a estrutura real: clientName, serviceName, barberName, price, wppclient
   */
  createWithBackendData(data: {
    clientName: string;
    serviceName: string;
    date: Date;
    time: string;
    barberId: string;
    barberName: string;
    price: number;
    wppclient: string;
    status?: AppointmentStatus;
  }): Promise<Appointment>;
  
  /**
   * Obtém estatísticas de agendamentos
   */
  getStatistics(): Promise<AppointmentStatistics>;
}

/**
 * Interface para dados de criação de agendamento
 * Baseada na estrutura real do backend
 */
export interface CreateAppointmentData {
  clientName: string;
  serviceName: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  barberId: string;
  barberName: string;
  price: number;
  wppclient: string;
  status?: BackendAppointmentStatus;
}

/**
 * Interface para atualização de agendamento
 */
export interface UpdateAppointmentData {
  clientName?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  status?: BackendAppointmentStatus;
  barberId?: string;
  barberName?: string;
  price?: number;
  wppclient?: string;
}