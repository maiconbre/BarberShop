import type { Appointment as AppointmentType, AppointmentStatus, BookingFormData } from '@/types';
import { AppointmentSchema, BookingFormDataSchema } from '@/validation/schemas';
import { APPOINTMENT_STATUS } from '@/constants';
import { DateTimeUtils } from '@/utils/DateTimeUtils';

export class Appointment {
  private constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly barberId: string,
    public readonly serviceId: string,
    public readonly date: Date,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly status: AppointmentStatus,
    public readonly notes: string | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Creates an Appointment instance from raw data with validation
   */
  static fromData(data: unknown): Appointment {
    const validated = AppointmentSchema.parse(data);
    return new Appointment(
      validated.id,
      validated.clientId,
      validated.barberId,
      validated.serviceId,
      validated.date,
      validated.startTime,
      validated.endTime,
      validated.status,
      validated.notes,
      validated.createdAt,
      validated.updatedAt
    );
  }

  /**
   * Creates an Appointment instance from API response
   */
  static fromApiData(data: AppointmentType): Appointment {
    return Appointment.fromData(data);
  }

  /**
   * Validates booking form data
   */
  static validateBookingData(data: unknown): BookingFormData {
    return BookingFormDataSchema.parse(data);
  }

  /**
   * Creates appointment data from booking form
   */
  static fromBookingForm(
    formData: BookingFormData,
    clientId: string,
    serviceDuration: number,
    id?: string
  ): Omit<AppointmentType, 'createdAt' | 'updatedAt'> {
    const validated = Appointment.validateBookingData(formData);
    const appointmentDate = new Date(validated.date);
    
    // Calculate end time based on service duration
    const [hours, minutes] = validated.time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + serviceDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    return {
      id: id || crypto.randomUUID(),
      clientId,
      barberId: validated.barberId,
      serviceId: validated.serviceId,
      date: appointmentDate,
      startTime: validated.time,
      endTime,
      status: APPOINTMENT_STATUS.SCHEDULED,
      notes: validated.notes,
    };
  }

  /**
   * Gets the full datetime for the appointment start
   */
  getStartDateTime(): Date {
    const [hours, minutes] = this.startTime.split(':').map(Number);
    const datetime = new Date(this.date);
    datetime.setHours(hours, minutes, 0, 0);
    return datetime;
  }

  /**
   * Gets the full datetime for the appointment end
   */
  getEndDateTime(): Date {
    const [hours, minutes] = this.endTime.split(':').map(Number);
    const datetime = new Date(this.date);
    datetime.setHours(hours, minutes, 0, 0);
    return datetime;
  }

  /**
   * Gets appointment duration in minutes
   */
  getDurationMinutes(): number {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return endTotalMinutes - startTotalMinutes;
  }

  /**
   * Gets formatted date for display
   */
  getFormattedDate(): string {
    return DateTimeUtils.formatFriendlyDate(this.date);
  }

  /**
   * Gets formatted time range for display
   */
  getFormattedTimeRange(): string {
    return `${this.startTime} - ${this.endTime}`;
  }

  /**
   * Gets formatted datetime for display
   */
  getFormattedDateTime(): string {
    return DateTimeUtils.formatFriendlyDateTime(this.getStartDateTime());
  }

  /**
   * Checks if appointment is in the past
   */
  isPast(): boolean {
    const now = DateTimeUtils.getCurrentBrasiliaDate();
    return this.getStartDateTime() < now;
  }

  /**
   * Checks if appointment is today
   */
  isToday(): boolean {
    const today = DateTimeUtils.getCurrentBrasiliaDate();
    return DateTimeUtils.isSameDay(this.date, today);
  }

  /**
   * Checks if appointment is tomorrow
   */
  isTomorrow(): boolean {
    const tomorrow = new Date(DateTimeUtils.getCurrentBrasiliaDate());
    tomorrow.setDate(tomorrow.getDate() + 1);
    return DateTimeUtils.isSameDay(this.date, tomorrow);
  }

  /**
   * Checks if appointment is upcoming (in the future)
   */
  isUpcoming(): boolean {
    return !this.isPast();
  }

  /**
   * Gets time until appointment in minutes
   */
  getTimeUntilAppointment(): number {
    const now = DateTimeUtils.getCurrentBrasiliaDate();
    const appointmentTime = this.getStartDateTime();
    return Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));
  }

  /**
   * Checks if appointment can be cancelled
   */
  canBeCancelled(): boolean {
    return (
      this.status === APPOINTMENT_STATUS.SCHEDULED ||
      this.status === APPOINTMENT_STATUS.CONFIRMED
    ) && this.isUpcoming();
  }

  /**
   * Checks if appointment can be confirmed
   */
  canBeConfirmed(): boolean {
    return this.status === APPOINTMENT_STATUS.SCHEDULED && this.isUpcoming();
  }

  /**
   * Checks if appointment can be started
   */
  canBeStarted(): boolean {
    const timeUntil = this.getTimeUntilAppointment();
    return (
      this.status === APPOINTMENT_STATUS.CONFIRMED &&
      timeUntil <= 15 && // Can start 15 minutes early
      timeUntil >= -30   // Can start up to 30 minutes late
    );
  }

  /**
   * Checks if appointment can be completed
   */
  canBeCompleted(): boolean {
    return this.status === APPOINTMENT_STATUS.IN_PROGRESS;
  }

  /**
   * Checks if appointment can be rescheduled
   */
  canBeRescheduled(): boolean {
    return (
      this.status === APPOINTMENT_STATUS.SCHEDULED ||
      this.status === APPOINTMENT_STATUS.CONFIRMED
    ) && this.isUpcoming();
  }

  /**
   * Gets status display text
   */
  getStatusText(): string {
    const statusMap = {
      [APPOINTMENT_STATUS.SCHEDULED]: 'Agendado',
      [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmado',
      [APPOINTMENT_STATUS.IN_PROGRESS]: 'Em Andamento',
      [APPOINTMENT_STATUS.COMPLETED]: 'Concluído',
      [APPOINTMENT_STATUS.CANCELLED]: 'Cancelado',
      [APPOINTMENT_STATUS.NO_SHOW]: 'Não Compareceu',
    };
    return statusMap[this.status] || this.status;
  }

  /**
   * Gets status color for UI
   */
  getStatusColor(): string {
    const colorMap = {
      [APPOINTMENT_STATUS.SCHEDULED]: 'blue',
      [APPOINTMENT_STATUS.CONFIRMED]: 'green',
      [APPOINTMENT_STATUS.IN_PROGRESS]: 'yellow',
      [APPOINTMENT_STATUS.COMPLETED]: 'green',
      [APPOINTMENT_STATUS.CANCELLED]: 'red',
      [APPOINTMENT_STATUS.NO_SHOW]: 'gray',
    };
    return colorMap[this.status] || 'gray';
  }

  /**
   * Checks if appointment conflicts with another appointment
   */
  conflictsWith(other: Appointment): boolean {
    if (!DateTimeUtils.isSameDay(this.date, other.date)) {
      return false;
    }

    const thisStart = this.getStartDateTime();
    const thisEnd = this.getEndDateTime();
    const otherStart = other.getStartDateTime();
    const otherEnd = other.getEndDateTime();

    return (
      (thisStart < otherEnd && thisEnd > otherStart) ||
      (otherStart < thisEnd && otherEnd > thisStart)
    );
  }

  /**
   * Converts to JSON object
   */
  toJSON(): AppointmentType {
    return this.toApiData();
  }

  /**
   * Converts to plain object for API requests
   */
  toApiData(): AppointmentType {
    return {
      id: this.id,
      clientId: this.clientId,
      barberId: this.barberId,
      serviceId: this.serviceId,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Creates a copy with updated status
   */
  updateStatus(newStatus: AppointmentStatus): Appointment {
    return new Appointment(
      this.id,
      this.clientId,
      this.barberId,
      this.serviceId,
      this.date,
      this.startTime,
      this.endTime,
      newStatus,
      this.notes,
      this.createdAt,
      new Date() // Update timestamp
    );
  }

  /**
   * Creates a copy with updated notes
   */
  updateNotes(newNotes: string): Appointment {
    return new Appointment(
      this.id,
      this.clientId,
      this.barberId,
      this.serviceId,
      this.date,
      this.startTime,
      this.endTime,
      this.status,
      newNotes,
      this.createdAt,
      new Date() // Update timestamp
    );
  }

  /**
   * Creates a copy with rescheduled date and time
   */
  reschedule(newDate: Date, newStartTime: string, serviceDuration: number): Appointment {
    const [hours, minutes] = newStartTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + serviceDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    return new Appointment(
      this.id,
      this.clientId,
      this.barberId,
      this.serviceId,
      newDate,
      newStartTime,
      newEndTime,
      this.status,
      this.notes,
      this.createdAt,
      new Date() // Update timestamp
    );
  }

  /**
   * Checks if two appointments are the same
   */
  equals(other: Appointment): boolean {
    return this.id === other.id;
  }

  /**
   * String representation for debugging
   */
  toString(): string {
    return `Appointment(${this.id}, ${this.getFormattedDate()}, ${this.getFormattedTimeRange()}, ${this.status})`;
  }
}