// Configurações específicas por ambiente para facilitar desenvolvimento e testes

export interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  devMode: boolean;
  debugApi: boolean;
  description: string;
  features: {
    cache: {
      enabled: boolean;
      ttl: number;
    };
    retry: {
      maxAttempts: number;
      delay: number;
    };
    logging: {
      requests: boolean;
      errors: boolean;
      performance: boolean;
    };
  };
}

// Configurações predefinidas para cada ambiente
export const ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
  local: {
    name: 'Desenvolvimento Local',
    apiUrl: 'http://localhost:6543',
    devMode: true,
    debugApi: true,
    description: 'API local para desenvolvimento rápido',
    features: {
      cache: {
        enabled: true,
        ttl: 30 * 1000 // 30 segundos
      },
      retry: {
        maxAttempts: 1,
        delay: 500
      },
      logging: {
        requests: true,
        errors: true,
        performance: true
      }
    }
  },
  
  production: {
    name: 'Produção',
    apiUrl: 'https://chemical-penelopa-soma-8513fd0f.koyeb.app',
    devMode: false,
    debugApi: false,
    description: 'API de produção hospedada no Koyeb',
    features: {
      cache: {
        enabled: true,
        ttl: 5 * 60 * 1000 // 5 minutos
      },
      retry: {
        maxAttempts: 5,
        delay: 1000
      },
      logging: {
        requests: false,
        errors: true,
        performance: false
      }
    }
  },
  
  testing: {
    name: 'Testes com API de Produção',
    apiUrl: 'https://chemical-penelopa-soma-8513fd0f.koyeb.app',
    devMode: true,
    debugApi: true,
    description: 'Testes locais usando API de produção',
    features: {
      cache: {
        enabled: true,
        ttl: 2 * 60 * 1000 // 2 minutos
      },
      retry: {
        maxAttempts: 3,
        delay: 1000
      },
      logging: {
        requests: true,
        errors: true,
        performance: true
      }
    }
  }
};

// Função para detectar ambiente atual
export const getCurrentEnvironment = (): EnvironmentConfig => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const devMode = import.meta.env.VITE_DEV_MODE === 'true';
  const debugApi = import.meta.env.VITE_DEBUG_API === 'true';
  
  // Detectar baseado na URL da API
  if (apiUrl?.includes('localhost')) {
    return ENVIRONMENT_CONFIGS.local;
  }
  
  // Se está usando API de produção mas com debug habilitado
  if (apiUrl?.includes('koyeb.app') && (devMode || debugApi)) {
    return ENVIRONMENT_CONFIGS.testing;
  }
  
  // Produção padrão
  return ENVIRONMENT_CONFIGS.production;
};

// Função para aplicar configurações do ambiente
export const applyEnvironmentConfig = (config: EnvironmentConfig) => {
  // Log da configuração atual (apenas em dev)
  if (config.devMode) {
    console.group('🔧 Configuração de Ambiente');
    console.log('📍 Ambiente:', config.name);
    console.log('🌐 API URL:', config.apiUrl);
    console.log('🐛 Debug:', config.debugApi ? 'Habilitado' : 'Desabilitado');
    console.log('💾 Cache TTL:', `${config.features.cache.ttl / 1000}s`);
    console.log('🔄 Max Retries:', config.features.retry.maxAttempts);
    console.groupEnd();
  }
  
  return config;
};

// Função utilitária para verificar se está em desenvolvimento local
export const isLocalDevelopment = (): boolean => {
  return getCurrentEnvironment().name === 'Desenvolvimento Local';
};

// Função utilitária para verificar se está em modo de teste
export const isTestingMode = (): boolean => {
  return getCurrentEnvironment().name === 'Testes com API de Produção';
};

// Função utilitária para verificar se está em produção
export const isProduction = (): boolean => {
  return getCurrentEnvironment().name === 'Produção';
};

// Exportar configuração atual
export const CURRENT_ENV = getCurrentEnvironment();
export const APPLIED_CONFIG = applyEnvironmentConfig(CURRENT_ENV);

export default ENVIRONMENT_CONFIGS;