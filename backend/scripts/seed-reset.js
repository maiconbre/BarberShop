/**
 * Script para recriar e popular o banco de dados com estrutura multi-tenant
 * 
 * Execute com: npm run seed:reset
 */

require('dotenv').config({ path: '.env' });
const sequelize = require('../models/database');
const { seedDevelopmentData } = require('../seeders/dev-seed');

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
    
    // Seed development data
    console.log('🌱 Seeding development data...');
    await seedDevelopmentData();
    
    console.log('\n🎉 Database reset and seed completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin / admin123');
    console.log('   Barber 1: joao / barber123');
    console.log('   Barber 2: pedro / barber123');
    console.log('\n🏪 Barbershop:');
    console.log('   Name: Dev Barbershop');
    console.log('   Slug: dev-barbershop');
    console.log('   URL: /app/dev-barbershop');
    
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