// Configurações centralizadas para rate limiting
// Este arquivo permite ajustar facilmente os limites sem modificar o código

module.exports = {
  // Configurações globais otimizadas (mais permissivas)
  global: {
    maxRepeatedRequests: 100, // Reduzido de 200 para 100 - ainda generoso
    burstLimit: 30, // Reduzido de 50 para 30 - permite rajadas curtas
    windowMs: 60000, // Mantido 1 minuto
    blockTimeMs: 30000, // Reduzido de 60000 para 30000ms (30 segundos)
    gracePeriodMs: 15000, // Aumentado de 10000 para 15000ms - mais tempo para usuários legítimos
    cleanupIntervalMs: 300000 // Mantido 5 minutos
  },

  // Configurações específicas para comentários
  comments: {
    // Para criação de comentários (mais restritivo)
    create: {
      maxRepeatedRequests: 5,
      blockTimeMs: 300000, // 5 minutos
      burstLimit: 10,
      windowMs: 60000
    },
    // Para leitura de comentários (mais permissivo)
    read: {
      maxRepeatedRequests: 15,
      blockTimeMs: 120000, // 2 minutos
      burstLimit: 30,
      windowMs: 60000
    }
  },

  // Configurações para autenticação
  auth: {
    login: {
      maxRepeatedRequests: 5,
      blockTimeMs: 900000, // 15 minutos
      burstLimit: 3,
      windowMs: 300000 // 5 minutos
    },
    register: {
      maxRepeatedRequests: 3,
      blockTimeMs: 1800000, // 30 minutos
      burstLimit: 2,
      windowMs: 600000 // 10 minutos
    }
  },

  // Configurações para agendamentos
  appointments: {
    create: {
      maxRepeatedRequests: 10,
      blockTimeMs: 300000, // 5 minutos
      burstLimit: 5,
      windowMs: 60000
    },
    read: {
      maxRepeatedRequests: 50,
      blockTimeMs: 60000, // 1 minuto
      burstLimit: 20,
      windowMs: 60000
    }
  },

  // Configurações para usuários
  users: {
    read: {
      maxRepeatedRequests: 30,
      blockTimeMs: 120000, // 2 minutos
      burstLimit: 15,
      windowMs: 60000
    },
    update: {
      maxRepeatedRequests: 10,
      blockTimeMs: 300000, // 5 minutos
      burstLimit: 5,
      windowMs: 60000
    }
  },

  // Configurações para barbeiros
  barbers: {
    read: {
      maxRepeatedRequests: 100,
      blockTimeMs: 60000, // 1 minuto
      burstLimit: 30,
      windowMs: 60000
    },
    modify: {
      maxRepeatedRequests: 5,
      blockTimeMs: 600000, // 10 minutos
      burstLimit: 3,
      windowMs: 300000 // 5 minutos
    }
  },

  // Configurações para serviços (otimizadas para reduzir falsos positivos)
  services: {
    read: {
      maxRepeatedRequests: 200, // Aumentado de 100 para 200 - muito mais permissivo
      blockTimeMs: 30000, // Reduzido de 60000 para 30000ms (30 segundos)
      burstLimit: 50, // Aumentado de 30 para 50 - permite mais requisições rápidas
      windowMs: 60000 // Mantido 1 minuto
    },
    modify: {
      maxRepeatedRequests: 15, // Aumentado de 10 para 15
      blockTimeMs: 300000, // Mantido 5 minutos
      burstLimit: 8, // Aumentado de 5 para 8
      windowMs: 60000 // Mantido 1 minuto
    }
  },

  // Configurações para segurança (mais restritivo)
  security: {
    logs: {
      maxRepeatedRequests: 20,
      blockTimeMs: 300000, // 5 minutos
      burstLimit: 10,
      windowMs: 60000
    },
    reports: {
      maxRepeatedRequests: 10,
      blockTimeMs: 600000, // 10 minutos
      burstLimit: 5,
      windowMs: 300000 // 5 minutos
    }
  },

  // Configurações para detecção de atividade suspeita (otimizadas)
  suspiciousActivity: {
    // Limites para considerar atividade suspeita (mais permissivos)
    thresholds: {
      highFrequencyRequests: 200, // Aumentado de 100 para 200 - menos sensível
      rapidFireInterval: 500, // Reduzido de 1000 para 500ms - permite requests mais rápidos
      burstThreshold: 40, // Aumentado de 20 para 40 - permite rajadas maiores
      repetitionRatio: 0.9, // Aumentado de 0.8 para 0.9 - só bloqueia se 90% forem repetidas
      avgIntervalThreshold: 250 // Reduzido de 500 para 250ms - permite intervalos menores
    },
    
    // Padrões de User-Agent suspeitos
    suspiciousUserAgents: [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i
    ],
    
    // Palavras-chave suspeitas em referers
    suspiciousReferers: [
      'suspicious',
      'attack',
      'hack',
      'exploit',
      'malware',
      'virus'
    ]
  }
};