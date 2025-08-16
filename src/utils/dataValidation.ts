/**
 * Utilitarios para validacao e sanitizacao de dados recebidos do backend
 */

import { safeNumber } from './numberUtils';

/**
 * Interface para appointment com validação
 */
export interface ValidatedAppointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: string;
  price: number;
  barberId: string;
  barberName: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Valida e sanitiza um appointment recebido do backend
 */
export const validateAppointment = (appointment: unknown): ValidatedAppointment => {
  return {
    id: String(appointment.id || ''),
    clientName: String(appointment.clientName || ''),
    service: String(appointment.service || appointment.serviceName || ''),
    date: String(appointment.date || ''),
    time: String(appointment.time || ''),
    status: String(appointment.status || 'pending'),
    price: safeNumber(appointment.price, 0),
    barberId: String(appointment.barberId || ''),
    barberName: String(appointment.barberName || ''),
    createdAt: appointment.createdAt ? String(appointment.createdAt) : undefined,
    updatedAt: appointment.updatedAt ? String(appointment.updatedAt) : undefined,
  };
};

/**
 * Valida um array de appointments
 */
export const validateAppointments = (appointments: unknown[]): ValidatedAppointment[] => {
  if (!Array.isArray(appointments)) {
    console.warn('validateAppointments: Expected array, received:', typeof appointments);
    return [];
  }
  
  return appointments.map(validateAppointment);
};

/**
 * Interface para service com validação
 */
export interface ValidatedService {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  isActive?: boolean;
}

/**
 * Valida e sanitiza um service recebido do backend
 */
export const validateService = (service: unknown): ValidatedService => {
  return {
    id: String(service.id || ''),
    name: String(service.name || ''),
    price: safeNumber(service.price, 0),
    duration: safeNumber(service.duration, 30),
    description: service.description ? String(service.description) : undefined,
    isActive: Boolean(service.isActive !== false), // Default true
  };
};

/**
 * Valida um array de services
 */
export const validateServices = (services: unknown[]): ValidatedService[] => {
  if (!Array.isArray(services)) {
    console.warn('validateServices: Expected array, received:', typeof services);
    return [];
  }
  
  return services.map(validateService);
};

/**
 * Valida dados de métricas financeiras
 */
export const validateMetrics = (metrics: unknown) => {
  return {
    totalRevenue: safeNumber(metrics?.totalRevenue, 0),
    avgTicket: safeNumber(metrics?.avgTicket, 0),
    returnRate: safeNumber(metrics?.returnRate, 0),
    totalClients: safeNumber(metrics?.totalClients, 0),
    // adicione outras métricas conforme necessário
  };
};

/**
 * Middleware para validar responses da API
 */
export const validateApiResponse = <T>(
  data: unknown,
  validator: (item: unknown) => T
): T[] => {
  try {
    if (Array.isArray(data)) {
      return data.map(validator);
    } else if (data && typeof data === 'object') {
      return [validator(data)];
    } else {
      console.warn('validateApiResponse: Invalid data format:', data);
      return [];
    }
  } catch (error) {
    console.error('validateApiResponse: Validation error:', error);
    return [];
  }
};

/**
 * Valida e sanitiza dados de cache
 */
export const validateCacheData = (cacheData: unknown) => {
  if (!cacheData || typeof cacheData !== 'object') {
    return null;
  }

  // Valida timestamps
  if (cacheData.timestamp && typeof cacheData.timestamp !== 'number') {
    return null;
  }

  // Valida dados numéricos no cache
  const numericFields = [
    'receitaHoje', 'receitaSemana', 'receitaMes',
    'filteredPendingRevenue', 'filteredCompletedRevenue'
  ];

  const validatedData = { ...cacheData };
  
  numericFields.forEach(field => {
    if (validatedData[field] !== undefined) {
      validatedData[field] = safeNumber(validatedData[field], 0);
    }
  });

  return validatedData;
};

/**
 * Hook para validar dados em tempo real
 */
export const useDataValidation = () => {
  const validateAndLog = <T>(
    data: unknown,
    validator: (item: unknown) => T,
    context: string
  ): T[] => {
    const startTime = performance.now();
    const result = validateApiResponse(data, validator);
    const endTime = performance.now();
    
    console.log(`Data validation for ${context}: ${endTime - startTime}ms`);
    
    return result;
  };

  return { validateAndLog };
};