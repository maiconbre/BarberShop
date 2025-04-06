const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:rDazZ1zCjD3PkOKJ@db.xxxsgvqbnkftoswascds.supabase.co:5432/postgres', {
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
  host: process.env.DB_HOST || 'db.xxxsgvqbnkftoswascds.supabase.co',
  dialectModule: require('pg'),
  logging: false,
  native: false,
  define: {
    timestamps: true
  }
});

// Função de teste de conexão melhorada
const testConnection = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      // Não passamos opções adicionais aqui para evitar o erro de tipo
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
      break;
    } catch (err) {
      console.log(`Tentativa de conexão falhou. Tentativas restantes: ${retries - 1}`);
      console.error('Detalhes do erro:', err.message);
      retries -= 1;
      if (retries === 0) {
        console.error('Falha ao conectar ao banco de dados após todas as tentativas.');
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Inicia o teste de conexão
testConnection().catch(err => {
  console.error('Erro fatal na conexão:', err);
  process.exit(1);
});

module.exports = sequelize;