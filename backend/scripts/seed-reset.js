/**
 * Script para recriar e popular o banco de dados com estrutura multi-tenant
 * 
 * Execute com: npm run seed:reset
 */

require('dotenv').config({ path: '.env' });
const sequelize = require('../models/database');

async function resetAndSeedDatabase() {
  console.log('🔄 Starting database reset and seed...');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Force sync - this will drop and recreate all tables
    console.log('🗑️  Dropping existing tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Database schema recreated with multi-tenant structure');
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📋 Database is now empty and ready for use.');
    console.log('   Create your first barbershop through the registration process.');
    
  } catch (error) {
    console.error('❌ Error during database reset and seed:');
    console.error(error.message);
    console.error('\nFull error details:');
    console.error(error);
    process.exit(1);
  } finally {
    // Close connection
    await sequelize.close();
    process.exit(0);
  }
}

resetAndSeedDatabase();