/**
 * Script simples para verificar se as barbearias seed estão no banco
 */

require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');

// Configuração do Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function checkBarbershops() {
  try {
    console.log('🔍 Verificando barbearias no banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar barbearias
    const [results] = await sequelize.query('SELECT id, name, slug, plan_type FROM "Barbershops" ORDER BY created_at');
    
    if (results.length === 0) {
      console.log('❌ Nenhuma barbearia encontrada no banco');
      console.log('💡 Execute o seed do Supabase: supabase/04-seed-data.sql');
    } else {
      console.log(`✅ Encontradas ${results.length} barbearias:`);
      results.forEach((barbershop, index) => {
        console.log(`   ${index + 1}. ${barbershop.name} (${barbershop.slug}) - Plano: ${barbershop.plan_type}`);
      });
    }
    
    // Verificar usuários
    const [users] = await sequelize.query('SELECT id, username, role, name FROM "Users" ORDER BY created_at');
    console.log(`\n👥 Usuários encontrados: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.role}) - ${user.name}`);
    });
    
    // Verificar barbeiros
    const [barbers] = await sequelize.query('SELECT id, name, whatsapp FROM "Barbers" ORDER BY created_at');
    console.log(`\n💈 Barbeiros encontrados: ${barbers.length}`);
    barbers.forEach((barber, index) => {
      console.log(`   ${index + 1}. ${barber.name} - ${barber.whatsapp}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkBarbershops();