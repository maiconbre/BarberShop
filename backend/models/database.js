const { Sequelize } = require('sequelize');
require('dotenv').config();

// Criar instância do Sequelize com configuração otimizada para Supabase
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 2,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false,
  retry: {
    max: 3
  }
});


// Exportar apenas a instância
module.exports = sequelize;