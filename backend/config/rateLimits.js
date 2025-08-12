// Configurações centralizadas para rate limiting
// Este arquivo permite ajustar facilmente os limites sem modificar o código

module.exports = {
  // Configurações globais padrão
  global: {
    maxRepeatedRequests: 200, // Máximo de requisições repetidas permitidas
    burstLimit: 50, // Limite de rajada (requisições em sequência rápida)
    windowMs: 60000, // Janela de tempo em milissegundos (1 minuto)
    blockTimeMs: 60000, // Tempo de bloqueio em milissegundos (1 minuto)
    gracePeriodMs: 10000, // Período de graça para requisições legítimas (10 segundos)
    cleanupIntervalMs: 300000 // Intervalo de limpeza do cache (5 minutos)
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

  // Configurações para serviços
  services: {
    read: {
      maxRepeatedRequests: 100,
      blockTimeMs: 60000, // 1 minuto
      burstLimit: 30,
      windowMs: 60000
    },
    modify: {
      maxRepeatedRequests: 10,
      blockTimeMs: 300000, // 5 minutos
      burstLimit: 5,
      windowMs: 60000
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

  // Configurações para detecção de atividade suspeita
  suspiciousActivity: {
    // Limites para considerar atividade suspeita
    thresholds: {
      highFrequencyRequests: 100, // Mais de 100 requests em pouco tempo
      rapidFireInterval: 1000, // Requests muito rápidos (menos de 1 segundo)
      burstThreshold: 20, // Mais de 20 requests em rajada
      repetitionRatio: 0.8, // 80% de requests repetidas
      avgIntervalThreshold: 500 // Intervalo médio menor que 500ms
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