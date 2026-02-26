import type { Appointment, AppointmentStatus } from '@/types';
import type { BackendAppointment, BackendAppointmentStatus, CreateAppointmentData } from '@/types/backend';

interface AppointmentWithBackendData extends Appointment {
  _backendData?: {
    clientName?: string;
    serviceName?: string;
  };
}

/**
 * Adapter para converter entre formatos de agendamento do backend e frontend
 */
export class AppointmentAdapter {
  /**
   * Converte agendamento do backend para o formato do frontend
   */
  static fromBackend(backendAppointment: BackendAppointment): Appointment {
    return {
      id: backendAppointment.id,
      clientId: backendAppointment.clientName, // Map clientName to clientId for compatibility
      barberId: backendAppointment.barberId,
      serviceId: backendAppointment.serviceName, // Map serviceName to serviceId for compatibility
      date: new Date(backendAppointment.date),
      startTime: backendAppointment.time,
      endTime: this.calculateEndTime(backendAppointment.time, 60), // Default 60min duration
      status: this.mapBackendStatusToFrontend(backendAppointment.status),
      notes: `Cliente: ${backendAppointment.clientName} | Serviço: ${backendAppointment.serviceName} | Barbeiro: ${backendAppointment.barberName} | Preço: R$ ${backendAppointment.price} | WhatsApp: ${backendAppointment.wppclient}`,
      createdAt: new Date(), // Backend doesn't provide timestamps
      updatedAt: new Date(),
      
      // Additional backend-specific data stored in a custom property
      _backendData: {
        clientName: backendAppointment.clientName,
        serviceName: backendAppointment.serviceName,
        barberName: backendAppointment.barberName,
        price: backendAppointment.price,
        wppclient: backendAppointment.wppclient
      }
    };
  }

  /**
   * Converte agendamento do frontend para o formato do backend
   */
  static toBackend(appointment: Appointment): Partial<BackendAppointment> {
    // Try to get backend data from _backendData if available
    const backendData = (appointment as AppointmentWithBackendData)._backendData;
    
    return {
      id: appointment.id,
      clientName: backendData?.clientName || appointment.clientId,
      serviceName: backendData?.serviceName || appointment.serviceId,
      date: appointment.date.toISOString().split('T')[0], // YYYY-MM-DD format
      time: appointment.startTime,
      status: this.mapFrontendStatusToBackend(appointment.status),
      barberId: appointment.barberId,
      barberName: backendData?.barberName || '',
      price: backendData?.price || 0,
      wppclient: backendData?.wppclient || ''
    };
  }

  /**
   * Converte dados de criação do frontend para o formato do backend
   */
  static createDataToBackend(data: {
    clientName: string;
    serviceName: string;
    date: Date;
    time: string;
    barberId: string;
    barberName: string;
    price: number;
    wppclient: string;
    status?: AppointmentStatus;
  }): CreateAppointmentData {
    return {
      clientName: data.clientName,
      serviceName: data.serviceName,
      date: data.date.toISOString().split('T')[0],
      time: data.time,
      barberId: data.barberId,
      barberName: data.barberName,
      price: data.price,
      wppclient: data.wppclient,
      status: data.status ? this.mapFrontendStatusToBackend(data.status) : 'pending'
    };
  }

  /**
   * Mapeia status do backend para o frontend
   */
  private static mapBackendStatusToFrontend(backendStatus: string): AppointmentStatus {
    const statusMap: Record<string, AppointmentStatus> = {
      'pending': 'scheduled',
      'confirmed': 'confirmed',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    
    return statusMap[backendStatus] || 'scheduled';
  }

  /**
   * Mapeia status do frontend para o backend
   */
  private static mapFrontendStatusToBackend(frontendStatus: AppointmentStatus): BackendAppointmentStatus {
    const statusMap: Record<AppointmentStatus, BackendAppointmentStatus> = {
      'scheduled': 'pending',
      'confirmed': 'confirmed',
      'in_progress': 'confirmed',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'no_show': 'cancelled'
    };
    
    return statusMap[frontendStatus] || 'pending';
  }

  /**
   * Calcula horário de fim baseado no horário de início e duração
   */
  private static calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Filtra agendamentos por barbeiro
   */
  static filterByBarberId(appointments: Appointment[], barberId: string): Appointment[] {
    return appointments.filter(appointment => appointment.barberId === barberId);
  }

  /**
   * Filtra agendamentos por status
   */
  static filterByStatus(appointments: Appointment[], status: AppointmentStatus): Appointment[] {
    return appointments.filter(appointment => appointment.status === status);
  }

  /**
   * Filtra agendamentos por data
   */
  static filterByDate(appointments: Appointment[], date: Date): Appointment[] {
    const targetDate = date.toISOString().split('T')[0];
    return appointments.filter(appointment => 
      appointment.date.toISOString().split('T')[0] === targetDate
    );
  }

  /**
   * Filtra agendamentos por faixa de datas
   */
  static filterByDateRange(appointments: Appointment[], startDate: Date, endDate: Date): Appointment[] {
    return appointments.filter(appointment => 
      appointment.date >= startDate && appointment.date <= endDate
    );
  }

  /**
   * Filtra agendamentos por nome do cliente
   */
  static filterByClientName(appointments: Appointment[], clientName: string): Appointment[] {
    const searchTerm = clientName.toLowerCase();
    return appointments.filter(appointment => {
      const backendData = (appointment as AppointmentWithBackendData)._backendData;
      const name = backendData?.clientName || appointment.clientId;
      return name.toLowerCase().includes(searchTerm);
    });
  }

  /**
   * Filtra agendamentos próximos (hoje e amanhã)
   */
  static filterUpcoming(appointments: Appointment[]): Appointment[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return appointments.filter(appointment => {
      const appointmentDate = appointment.date.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      return appointmentDate === todayStr || appointmentDate === tomorrowStr;
    });
  }

  /**
   * Filtra agendamentos pendentes
   */
  static filterPending(appointments: Appointment[]): Appointment[] {
    return this.filterByStatus(appointments, 'scheduled');
  }
}