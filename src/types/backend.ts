/**
 * Backend-specific type definitions that match the real Sequelize models
 * These interfaces represent the exact structure returned by the backend API
 */

export interface BackendUser {
  id: string;
  username: string;
  password?: string; // Only for creation/update operations
  role: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BackendBarber {
  id: string;
  name: string;
  whatsapp: string;
  pix: string;
  // Note: Backend also includes username from related User model
  username?: string;
}

export interface BackendService {
  id: string; // UUID
  name: string;
  price: number; // Float
}

export interface BackendAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  date: string; // DATEONLY format
  time: string;
  status: string;
  barberId: string;
  barberName: string;
  price: number;
  wppclient: string;
}

export interface BackendComment {
  id: string;
  name: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// API Response types for backend
export interface BackendApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  error?: string;
}

// Comment-specific filter types
export interface BackendCommentFilters {
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}