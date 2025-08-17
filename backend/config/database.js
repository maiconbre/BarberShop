/**
 * Configuração do banco de dados
 * Este arquivo centraliza as configurações do banco de dados para diferentes ambientes
 */

require('dotenv').config({ path: '.env' });

const config = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      keepAlive: true
    },
    pool: {
      max: 3,
      min: 0,
      idle: 10000,
      acquire: 30000,
      evict: 1000
    },
    retry: {
      max: 5,
      match: [/SequelizeConnectionError/],
      backoffBase: 1000,
      backoffExponent: 1.5
    },
    logging: (sql, queryObject) => {
      const timestamp = new Date().toISOString();
      const queryType = queryObject && queryObject.type ? queryObject.type : 'QUERY';
      const queryId = `sql-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Log principal com ID da consulta para rastreamento
      console.log(`[${timestamp}] [SQL:${queryId}] [TYPE:${queryType}] ${sql}`);
      
      // Adicionar informações de rastreamento para identificar chamadas repetidas
      const stackTrace = new Error().stack;
      const caller = stackTrace.split('\n')[3]; // Pega a terceira linha do stack trace (chamador)
      console.log(`[${timestamp}] [SQL:${queryId}] [CALLER] ${caller ? caller.trim() : 'Desconhecido'}`);
      
      // Adicionar informações de performance
      const startTime = Date.now();
      return (result) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`[${timestamp}] [SQL:${queryId}] [DURATION] ${duration}ms`);
        
        // Adicionar informações sobre o resultado (número de registros, etc)
        if (result && Array.isArray(result)) {
          console.log(`[${timestamp}] [SQL:${queryId}] [RESULT] ${result.length} registros retornados`);
        }
      };
    },
    native: false,
    define: {
      timestamps: true
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      keepAlive: true,
      // Configurações específicas para Supabase
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
      // Fix para erro SCRAM-SERVER-FINAL-MESSAGE
      application_name: 'barbershop_backend',
      options: '--search_path=public'
    },
    pool: {
      max: 10, // Aumentado para Supabase
      min: 2,  // Mínimo de conexões para produção
      idle: 30000, // Tempo maior para produção
      acquire: 60000, // Tempo maior para aquisição
      evict: 5000
    },
    retry: {
      max: 3, // Reduzido para produção
      match: [/SequelizeConnectionError/, /SequelizeConnectionRefusedError/],
      backoffBase: 2000,
      backoffExponent: 2
    },
    // Logging desabilitado em produção por padrão
    logging: process.env.SQL_LOGGING === 'true' ? (sql) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [PROD-SQL] ${sql}`);
    } : false,
    native: false,
    define: {
      timestamps: true
    }
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true
    },
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

// Determinar o ambiente atual
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

if (!dbConfig) {
  throw new Error(`Configuração de banco de dados não encontrada para o ambiente: ${env}`);
}

module.exports = dbConfig;