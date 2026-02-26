import { z } from 'zod';

// Base validation schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  role: z.enum(['client', 'barber', 'admin']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome do serviço deve ter pelo menos 2 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  duration: z.number().min(15, 'Duração mínima de 15 minutos').max(480, 'Duração máxima de 8 horas'),
  price: z.number().min(0, 'Preço deve ser positivo'),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const TimeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
}).refine((data) => {
  const [startHour, startMin] = data.start.split(':').map(Number);
  const [endHour, endMin] = data.end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: 'Hora de fim deve ser posterior à hora de início',
});

export const WorkingHoursSchema = z.object({
  monday: z.array(TimeSlotSchema),
  tuesday: z.array(TimeSlotSchema),
  wednesday: z.array(TimeSlotSchema),
  thursday: z.array(TimeSlotSchema),
  friday: z.array(TimeSlotSchema),
  saturday: z.array(TimeSlotSchema),
  sunday: z.array(TimeSlotSchema),
});

export const BarberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  specialties: z.array(z.string()),
  isActive: z.boolean(),
  workingHours: WorkingHoursSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const AppointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
]);

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.coerce.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  status: AppointmentStatusSchema,
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).refine((data) => {
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: 'Hora de fim deve ser posterior à hora de início',
});

export const CommentSchema = z.object({
  id: z.string().uuid(),
  appointmentId: z.string().uuid(),
  clientId: z.string().uuid(),
  barberId: z.string().uuid(),
  rating: z.number().min(1, 'Avaliação mínima é 1').max(5, 'Avaliação máxima é 5'),
  comment: z.string().min(10, 'Comentário deve ter pelo menos 10 caracteres'),
  createdAt: z.coerce.date(),
});

// Form validation schemas
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const RegisterDataSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().optional(),
});

export const BookingFormDataSchema = z.object({
  serviceId: z.string().uuid('ID do serviço inválido'),
  barberId: z.string().uuid('ID do barbeiro inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  notes: z.string().optional(),
});

export const ServiceFormDataSchema = z.object({
  name: z.string().min(2, 'Nome do serviço deve ter pelo menos 2 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  duration: z.number().min(15, 'Duração mínima de 15 minutos').max(480, 'Duração máxima de 8 horas'),
  price: z.number().min(0, 'Preço deve ser positivo'),
  isActive: z.boolean(),
});

// Schema específico para o backend (apenas campos suportados)
export const BackendServiceFormDataSchema = z.object({
  name: z.string().min(2, 'Nome do serviço deve ter pelo menos 2 caracteres'),
  price: z.number().min(0, 'Preço deve ser positivo'),
});

// API response schemas
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
    success: z.boolean(),
  });

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

export const ApiErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// Search and filter schemas
export const AppointmentFiltersSchema = z.object({
  barberId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  status: AppointmentStatusSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
});

export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Type inference helpers
export type UserInput = z.infer<typeof UserSchema>;
export type ServiceInput = z.infer<typeof ServiceSchema>;
export type BarberInput = z.infer<typeof BarberSchema>;
export type AppointmentInput = z.infer<typeof AppointmentSchema>;
export type CommentInput = z.infer<typeof CommentSchema>;
export type LoginCredentialsInput = z.infer<typeof LoginCredentialsSchema>;
export type RegisterDataInput = z.infer<typeof RegisterDataSchema>;
export type BookingFormDataInput = z.infer<typeof BookingFormDataSchema>;
export type ServiceFormDataInput = z.infer<typeof ServiceFormDataSchema>;
export type BackendServiceFormDataInput = z.infer<typeof BackendServiceFormDataSchema>;
export type AppointmentFiltersInput = z.infer<typeof AppointmentFiltersSchema>;
export type SearchParamsInput = z.infer<typeof SearchParamsSchema>;