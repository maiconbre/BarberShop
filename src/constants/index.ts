// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://chemical-penelopa-soma-8513fd0f.koyeb.app/api',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 100,
  STORAGE_KEY_PREFIX: 'barber_gr_',
} as const;

// Authentication
export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: 'auth_token',
  REFRESH_TOKEN_STORAGE_KEY: 'refresh_token',
  USER_STORAGE_KEY: 'current_user',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Appointment Status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

// User Roles
export const USER_ROLES = {
  CLIENT: 'client',
  BARBER: 'barber',
  ADMIN: 'admin',
} as const;

// Time Configuration
export const TIME_CONFIG = {
  TIMEZONE: 'America/Sao_Paulo',
  BUSINESS_HOURS: {
    START: '08:00',
    END: '18:00',
  },
  SLOT_DURATION: 30, // minutes
  BREAK_DURATION: 15, // minutes
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  DESCRIPTION_MIN_LENGTH: 10,
  COMMENT_MIN_LENGTH: 10,
  SERVICE_DURATION_MIN: 15, // minutes
  SERVICE_DURATION_MAX: 480, // 8 hours
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  TIMEOUT_ERROR: 'Tempo limite excedido. Tente novamente.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'Email ou senha incorretos.',
  SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
  UNAUTHORIZED: 'Acesso não autorizado.',
  
  // Validation errors
  REQUIRED_FIELD: 'Este campo é obrigatório.',
  INVALID_EMAIL: 'Email inválido.',
  INVALID_PHONE: 'Telefone inválido.',
  PASSWORD_TOO_SHORT: `Senha deve ter pelo menos ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} caracteres.`,
  
  // Business logic errors
  APPOINTMENT_CONFLICT: 'Horário não disponível.',
  INVALID_TIME_SLOT: 'Horário inválido.',
  PAST_DATE_ERROR: 'Não é possível agendar para datas passadas.',
  BARBER_NOT_AVAILABLE: 'Barbeiro não disponível neste horário.',
  SERVICE_NOT_FOUND: 'Serviço não encontrado.',
  
  // Generic errors
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.',
  OPERATION_FAILED: 'Operação falhou. Tente novamente.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
  REGISTER_SUCCESS: 'Cadastro realizado com sucesso!',
  APPOINTMENT_CREATED: 'Agendamento criado com sucesso!',
  APPOINTMENT_UPDATED: 'Agendamento atualizado com sucesso!',
  APPOINTMENT_CANCELLED: 'Agendamento cancelado com sucesso!',
  SERVICE_CREATED: 'Serviço criado com sucesso!',
  SERVICE_UPDATED: 'Serviço atualizado com sucesso!',
  SERVICE_DELETED: 'Serviço removido com sucesso!',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso!',
  COMMENT_SUBMITTED: 'Avaliação enviada com sucesso!',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SERVICES: '/services',
  APPOINTMENTS: '/appointments',
  PROFILE: '/profile',
  ADMIN: '/admin',
  BARBER_MANAGEMENT: '/admin/barbers',
  SERVICE_MANAGEMENT: '/admin/services',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  
  // Users
  USERS: '/users',
  USER_PROFILE: '/users/profile',
  
  // Services
  SERVICES: '/services',
  
  // Barbers
  BARBERS: '/barbers',
  BARBER_AVAILABILITY: '/barbers/:id/availability',
  
  // Appointments
  APPOINTMENTS: '/appointments',
  USER_APPOINTMENTS: '/appointments/user',
  BARBER_APPOINTMENTS: '/appointments/barber',
  
  // Comments
  COMMENTS: '/comments',
  APPOINTMENT_COMMENTS: '/comments/appointment/:id',
} as const;

// Date Formats
export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  ISO_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY_DATE: 'DD/MM/YYYY',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
  TIME_ONLY: 'HH:mm',
  FRIENDLY_DATE: 'dddd, DD [de] MMMM [de] YYYY',
  FRIENDLY_DATETIME: 'dddd, DD [de] MMMM [de] YYYY [às] HH:mm',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

// Theme
export const THEME = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#6B7280',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: AUTH_CONFIG.TOKEN_STORAGE_KEY,
  REFRESH_TOKEN: AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY,
  CURRENT_USER: AUTH_CONFIG.USER_STORAGE_KEY,
  CACHE_PREFIX: CACHE_CONFIG.STORAGE_KEY_PREFIX,
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE_PREFERENCE: 'language_preference',
} as const;