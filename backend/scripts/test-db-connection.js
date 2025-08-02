/**
 * Script para testar a conexão com o banco de dados Supabase
 * 
 * Execute com: node scripts/test-db-connection.js
 */

require('dotenv').config({ path: '../../.env.local' });
const sequelize = require('../models/database');

async function testDatabaseConnection() {
  console.log('Testando conexão com o banco de dados Supabase...');
  console.log(`URL do banco de dados: ${process.env.DATABASE_URL || 'Usando URL padrão do arquivo database.js'}`);
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar modelos disponíveis
    console.log('\nModelos disponíveis:');
    const models = Object.keys(sequelize.models);
    if (models.length === 0) {
      console.log('Nenhum modelo encontrado. Verifique se os modelos estão sendo importados corretamente.');
    } else {
      models.forEach(model => {
        console.log(`- ${model}`);
      });
    }
    
    // Verificar tabelas no banco de dados
    console.log('\nTabelas no banco de dados:');
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    if (results.length === 0) {
      console.log('Nenhuma tabela encontrada no banco de dados.');
    } else {
      results.forEach(result => {
        console.log(`- ${result.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error(error.message);
    console.error('\nDetalhes completos do erro:');
    console.error(error);
    
    console.log('\nVerifique se:');
    console.log('1. As credenciais do Supabase estão corretas no arquivo .env.local');
    console.log('2. O banco de dados Supabase está acessível');
    console.log('3. As configurações SSL estão corretas');
  } finally {
    // Fechar a conexão
    await sequelize.close();
    process.exit(0);
  }
}

testDatabaseConnection();