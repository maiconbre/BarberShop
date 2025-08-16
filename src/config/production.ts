/**
 * Configurações específicas para ambiente de produção
 */

export const productionConfig = {
  // Configurações de API
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://barber-backend-spm8.onrender.com',
    timeout: 30000, // 30 segundos para produção
    retries: 3,
    retryDelay: 1000
  },

  // Configurações de cache
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    maxSize: 100, // máximo 100 entradas no cache
    enablePersistence: true // persistir cache no localStorage
  },

  // Configurações de logging
  logging: {
    level: 'error', // apenas erros em produção
    enableConsole: false, // desabilitar console.log em produção
    enableRemote: true, // habilitar envio para serviço remoto
    endpoint: import.meta.env.VITE_LOG_ENDPOINT,
    apiKey: import.meta.env.VITE_LOG_API_KEY,
    batchSize: 10, // enviar logs em lotes de 10
    flushInterval: 30000 // enviar logs a cada 30 segundos
  },

  // Configurações de monitoramento
  monitoring: {
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableUserTracking: false, // GDPR compliance
    sampleRate: 0.1, // 10% das sessões
    sentryDsn: import.meta.env.VITE_SENTRY_DSN
  },

  // Configurações de segurança
  security: {
    enableCSP: true, // Content Security Policy
    enableHSTS: true, // HTTP Strict Transport Security
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutos
  },

  // Configurações de performance
  performance: {
    enableServiceWorker: import.meta.env.VITE_SW_ENABLED === 'true',
    enableLazyLoading: true,
    enableImageOptimization: true,
    cdnUrl: import.meta.env.VITE_CDN_URL,
    preloadCriticalResources: true
  },

  // Configurações de feature flags
  features: {
    enableBetaFeatures: false,
    enableDebugMode: false,
    enableMaintenanceMode: false,
    enableA11yMode: true // sempre habilitar acessibilidade
  },

  // Configurações de backup
  backup: {
    enableAutoBackup: true,
    backupInterval: 24 * 60 * 60 * 1000, // 24 horas
    maxBackups: 7, // manter 7 backups
    compressionEnabled: true
  },

  // Configurações de analytics
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GA_ID,
    enableHeatmaps: false, // privacidade
    enableSessionRecording: false, // privacidade
    trackingConsent: true // requer consentimento
  }
};

// Validação de configurações críticas
export function validateProductionConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar URL da API
  if (!productionConfig.api.baseUrl) {
    errors.push('VITE_API_URL is required for production');
  }

  if (!productionConfig.api.baseUrl.startsWith('https://')) {
    errors.push('API URL must use HTTPS in production');
  }

  // Validar configurações de logging se habilitado
  if (productionConfig.logging.enableRemote) {
    if (!productionConfig.logging.endpoint) {
      errors.push('VITE_LOG_ENDPOINT is required when remote logging is enabled');
    }
    if (!productionConfig.logging.apiKey) {
      errors.push('VITE_LOG_API_KEY is required when remote logging is enabled');
    }
  }

  // Validar Sentry se habilitado
  if (productionConfig.monitoring.enableErrorTracking && !productionConfig.monitoring.sentryDsn) {
    console.warn('VITE_SENTRY_DSN not configured, error tracking will be limited');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Aplicar configurações de produção
export function applyProductionConfig(): void {
  // Desabilitar console.log em produção
  if (!productionConfig.logging.enableConsole) {
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    // Manter console.error para debugging crítico
  }

  // Configurar timeout global para fetch
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), productionConfig.api.timeout);
    
    return originalFetch(input, {
      ...init,
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  };

  // Configurar Content Security Policy
  if (productionConfig.security.enableCSP) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;";
    document.head.appendChild(meta);
  }

  // Configurar error boundary global
  window.addEventListener('error', (event) => {
    if (productionConfig.monitoring.enableErrorTracking) {
      // Enviar erro para serviço de monitoramento
      console.error('Global error caught:', event.error);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (productionConfig.monitoring.enableErrorTracking) {
      // Enviar promise rejection para serviço de monitoramento
      console.error('Unhandled promise rejection:', event.reason);
    }
  });
}

// Configurações específicas por ambiente
export const getEnvironmentConfig = () => {
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    return {
      ...productionConfig,
      logging: {
        ...productionConfig.logging,
        level: 'debug',
        enableConsole: true,
        enableRemote: false
      },
      security: {
        ...productionConfig.security,
        sessionTimeout: 60 * 60 * 1000, // 1 hora em dev
        maxLoginAttempts: 10
      },
      features: {
        ...productionConfig.features,
        enableDebugMode: true,
        enableBetaFeatures: true
      }
    };
  }

  return productionConfig;
};

// Inicialização automática em produção
if (import.meta.env.PROD) {
  const validation = validateProductionConfig();
  
  if (!validation.valid) {
    console.error('Production configuration errors:', validation.errors);
    // Em produção, mostrar erro amigável ao usuário
    if (typeof document !== 'undefined') {
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 2rem; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #e53e3e; margin-bottom: 1rem;">Configuração Inválida</h2>
            <p style="color: #4a5568; margin-bottom: 1rem;">A aplicação não está configurada corretamente para produção.</p>
            <p style="color: #718096; font-size: 0.875rem;">Entre em contato com o suporte técnico.</p>
          </div>
        </div>
      `;
    }
  } else {
    applyProductionConfig();
  }
}