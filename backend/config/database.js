module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: true,
      native: true,
      keepAlive: true,
      connectTimeout: 60000
    },
    pool: {
      max: 3,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    retry: {
      max: 5
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: true,
      native: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
