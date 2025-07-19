// Configurações centralizadas para o gerenciamento da API

export const API_CONFIG = {
  // URLs e endpoints
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:6543',
  
  // Timeouts e intervalos
  REQUEST_TIMEOUT: 30000, // 30 segundos
  CONNECTION_COOLDOWN: 5000, // 5 segundos
  MIN_REQUEST_INTERVAL: 1000, // 1 segundo
  
  // Cache TTL (Time To Live)
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  COMMENTS_CACHE_TTL: 10 * 60 * 1000, // 10 minutos
  SERVICES_CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  
  // Controle de requisições repetidas
  MAX_IDENTICAL_REQUESTS: 3,
  REQUEST_COUNTER_RESET_TIME: 60 * 1000, // 1 minuto
  
  // Retry e backoff
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000, // 1 segundo
  MAX_RETRY_DELAY: 30000, // 30 segundos
  BACKOFF_MULTIPLIER: 2,
  
  // Monitoramento de saúde
  HEALTH_RESET_INTERVAL: 5 * 60 * 1000, // 5 minutos
  MAX_RESPONSE_TIME_SAMPLES: 50,
  
  // Thresholds para recomendações de saúde
  HEALTH_THRESHOLDS: {
    TIMEOUT_RATE: 0.3, // 30% de timeouts
    NETWORK_ERROR_RATE: 0.4, // 40% de erros de rede
    GENERAL_ERROR_RATE: 0.5, // 50% de erros gerais
  },
  
  // Configurações de retry automático no frontend
  AUTO_RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 5000, // 5 segundos
    MAX_DELAY: 30000, // 30 segundos
  },
  
  // Endpoints alternativos para fallback
  FALLBACK_ENDPOINTS: {
    COMMENTS: [
      '/api/comments/approved',
      '/api/comments',
      '/api/reviews?status=approved'
    ],
    SERVICES: [
      '/api/services/active',
      '/api/services'
    ],
    BARBERS: [
      '/api/barbers/active',
      '/api/barbers'
    ]
  },
  
  // Configurações de debug
  DEBUG: {
    ENABLED: import.meta.env.DEV,
    LOG_REQUESTS: true,
    LOG_CACHE_OPERATIONS: true,
    LOG_HEALTH_METRICS: true
  }
};

// Função para obter configuração adaptativa baseada no ambiente
export const getAdaptiveConfig = () => {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;
  
  return {
    ...API_CONFIG,
    
    // Em produção, usar timeouts mais longos
    REQUEST_TIMEOUT: isProduction ? 45000 : API_CONFIG.REQUEST_TIMEOUT,
    
    // Em desenvolvimento, cache mais curto para ver mudanças rapidamente
    CACHE_TTL: isDevelopment ? 2 * 60 * 1000 : API_CONFIG.CACHE_TTL,
    
    // Em produção, mais tentativas de retry
    MAX_RETRIES: isProduction ? 5 : API_CONFIG.MAX_RETRIES,
    
    // Debug apenas em desenvolvimento
    DEBUG: {
      ...API_CONFIG.DEBUG,
      ENABLED: isDevelopment
    }
  };
};

// Configurações específicas por tipo de dados
export const DATA_TYPE_CONFIG = {
  comments: {
    cacheTTL: API_CONFIG.COMMENTS_CACHE_TTL,
    maxRetries: 3,
    fallbackEndpoints: API_CONFIG.FALLBACK_ENDPOINTS.COMMENTS,
    priority: 'low' // Comentários não são críticos
  },
  
  services: {
    cacheTTL: API_CONFIG.SERVICES_CACHE_DURATION,
    maxRetries: 5,
    fallbackEndpoints: API_CONFIG.FALLBACK_ENDPOINTS.SERVICES,
    priority: 'high' // Serviços são críticos para o negócio
  },
  
  barbers: {
    cacheTTL: API_CONFIG.CACHE_TTL,
    maxRetries: 4,
    fallbackEndpoints: API_CONFIG.FALLBACK_ENDPOINTS.BARBERS,
    priority: 'high' // Barbeiros são críticos para agendamentos
  },
  
  appointments: {
    cacheTTL: 2 * 60 * 1000, // 2 minutos - dados mais dinâmicos
    maxRetries: 5,
    fallbackEndpoints: [],
    priority: 'critical' // Agendamentos são críticos
  }
};

export default API_CONFIG;