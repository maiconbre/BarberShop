// Base types for the BarberGR application

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'barber' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  isActive: boolean;
  workingHours: WorkingHours;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface Appointment {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Comment {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// Cache types
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  useLocalStorage?: boolean;
}

export interface FetchWithCacheOptions {
  forceRefresh?: boolean;
  backgroundRefresh?: boolean;
}

// Form types
export interface BookingFormData {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  notes?: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
}

// Filter and search types
export interface AppointmentFilters {
  barberId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}