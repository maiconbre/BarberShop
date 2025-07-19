import type { Service as ServiceType, ServiceFormData } from '@/types';
import { ServiceSchema, ServiceFormDataSchema } from '@/validation/schemas';

export class Service {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly duration: number, // in minutes
    public readonly price: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Creates a Service instance from raw data with validation
   */
  static fromData(data: unknown): Service {
    const validated = ServiceSchema.parse(data);
    return new Service(
      validated.id,
      validated.name,
      validated.description,
      validated.duration,
      validated.price,
      validated.isActive,
      validated.createdAt,
      validated.updatedAt
    );
  }

  /**
   * Creates a Service instance from API response
   */
  static fromApiData(data: ServiceType): Service {
    return Service.fromData(data);
  }

  /**
   * Validates service form data
   */
  static validateFormData(data: unknown): ServiceFormData {
    return ServiceFormDataSchema.parse(data);
  }

  /**
   * Creates a new service from form data
   */
  static fromFormData(formData: ServiceFormData, id?: string): Omit<ServiceType, 'createdAt' | 'updatedAt'> {
    const validated = Service.validateFormData(formData);
    return {
      id: id || crypto.randomUUID(),
      name: validated.name,
      description: validated.description,
      duration: validated.duration,
      price: validated.price,
      isActive: validated.isActive,
    };
  }

  /**
   * Checks if service is active
   */
  isServiceActive(): boolean {
    return this.isActive;
  }

  /**
   * Gets formatted price in Brazilian Real
   */
  getFormattedPrice(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.price);
  }

  /**
   * Gets formatted duration
   */
  getFormattedDuration(): string {
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;

    if (hours === 0) {
      return `${minutes}min`;
    }
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}min`;
  }

  /**
   * Gets duration in hours (decimal)
   */
  getDurationInHours(): number {
    return this.duration / 60;
  }

  /**
   * Checks if service is a quick service (less than 30 minutes)
   */
  isQuickService(): boolean {
    return this.duration < 30;
  }

  /**
   * Checks if service is a long service (more than 2 hours)
   */
  isLongService(): boolean {
    return this.duration > 120;
  }

  /**
   * Gets service category based on duration
   */
  getCategory(): 'quick' | 'standard' | 'long' {
    if (this.isQuickService()) return 'quick';
    if (this.isLongService()) return 'long';
    return 'standard';
  }

  /**
   * Calculates end time given a start time
   */
  calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + this.duration;
    
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  /**
   * Checks if service can fit in a time slot
   */
  canFitInTimeSlot(startTime: string, endTime: string): boolean {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const availableMinutes = endTotalMinutes - startTotalMinutes;
    
    return availableMinutes >= this.duration;
  }

  /**
   * Gets price per minute
   */
  getPricePerMinute(): number {
    return this.price / this.duration;
  }

  /**
   * Compares price with another service
   */
  comparePrice(other: Service): 'cheaper' | 'same' | 'expensive' {
    if (this.price < other.price) return 'cheaper';
    if (this.price > other.price) return 'expensive';
    return 'same';
  }

  /**
   * Gets a short description (truncated if too long)
   */
  getShortDescription(maxLength: number = 100): string {
    if (this.description.length <= maxLength) {
      return this.description;
    }
    return this.description.substring(0, maxLength - 3) + '...';
  }

  /**
   * Checks if service name matches search query
   */
  matchesSearch(query: string): boolean {
    const searchTerm = query.toLowerCase().trim();
    return (
      this.name.toLowerCase().includes(searchTerm) ||
      this.description.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Converts to JSON object
   */
  toJSON(): ServiceType {
    return this.toApiData();
  }

  /**
   * Converts to plain object for API requests
   */
  toApiData(): ServiceType {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      duration: this.duration,
      price: this.price,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Converts to form data for editing
   */
  toFormData(): ServiceFormData {
    return {
      name: this.name,
      description: this.description,
      duration: this.duration,
      price: this.price,
      isActive: this.isActive,
    };
  }

  /**
   * Creates a copy with updated fields
   */
  update(updates: Partial<ServiceFormData>): Service {
    return new Service(
      this.id,
      updates.name ?? this.name,
      updates.description ?? this.description,
      updates.duration ?? this.duration,
      updates.price ?? this.price,
      updates.isActive ?? this.isActive,
      this.createdAt,
      new Date() // Update timestamp
    );
  }

  /**
   * Creates a copy with active status toggled
   */
  toggleActive(): Service {
    return this.update({ isActive: !this.isActive });
  }

  /**
   * Checks if two services are the same
   */
  equals(other: Service): boolean {
    return this.id === other.id;
  }

  /**
   * String representation for debugging
   */
  toString(): string {
    return `Service(${this.id}, ${this.name}, ${this.getFormattedPrice()}, ${this.getFormattedDuration()})`;
  }
}