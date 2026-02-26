export const CACHE_CONFIG = {
  VERSION: 'v1.1.0', // Incrementado para forçar limpeza após correção de tenantId
  KEYS_TO_CLEAR: [
    'barbershopId',
    'tenantId',
    'barbershopSlug',
    'services',
    'barbers',
    'appointments'
  ],
  PREFIXES_TO_CLEAR: [
    'tenant:',
    'services:',
    'barbers:',
    'schedule_appointments_'
  ]
};
