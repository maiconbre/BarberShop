/**
 * Configuração do banco de dados
 * Este arquivo centraliza as configurações do banco de dados para diferentes ambientes
 */

require('dotenv').config({ path: process.env.NODE_ENV === 'development' ? '../../.env.local' : '../../.env' });

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
      max: 5,
      min: 0,
      idle: 10000,
      acquire: 30000
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
      keepAlive: true
    },
    pool: {
      max: 10,
      min: 0,
      idle: 10000,
      acquire: 60000
    },
    retry: {
      max: 5,
      match: [/SequelizeConnectionError/],
      backoffBase: 1000,
      backoffExponent: 1.5
    },
    logging: process.env.ENABLE_SQL_LOGS === 'true' ? (sql, queryObject) => {
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
    } : false,
    native: false,
    define: {
      timestamps: true
    }
  },
  test: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    define: {
      timestamps: true
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