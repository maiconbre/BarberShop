const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

// Criar instância do Sequelize com a configuração do ambiente atual
/** @type {import('sequelize').Sequelize} */
let sequelize;
if (dbConfig.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: dbConfig.dialect,
    storage: dbConfig.storage,
    pool: dbConfig.pool,
    logging: dbConfig.logging,
    define: dbConfig.define
  });
} else {
  sequelize = new Sequelize(dbConfig.url, {
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool,
    retry: dbConfig.retry,
    dialectModule: require('pg'),
    logging: dbConfig.logging,
    native: dbConfig.native,
    define: dbConfig.define
  });
}

// Função de teste de conexão melhorada
/**
 * @returns {Promise<void>}
 */
const testConnection = async () => {
  /** @type {number} */
  let retries = 5;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      // Não passamos opções adicionais aqui para evitar o erro de tipo
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
      break;
    } catch (err) {
      /** @type {Error} */
      const error = /** @type {Error} */ (err);
      console.log(`Tentativa de conexão falhou. Tentativas restantes: ${retries - 1}`);
      console.error('Detalhes do erro:', error.message);
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
testConnection().catch((err) => {
  /** @type {Error} */
  const error = /** @type {Error} */ (err);
  console.error('Erro fatal na conexão:', error);
  process.exit(1);
});

module.exports = sequelize;