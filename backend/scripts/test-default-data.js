/**
 * Script para testar a criação de dados padrão após registro de barbearia
 */

require('dotenv').config({ path: '.env' });
const sequelize = require('../models/database');
const { Barbershop, User, Barber, Service, Appointment } = require('../models');
const { createDefaultBarbershopData } = require('../utils/defaultData');

async function testDefaultDataCreation() {
  console.log('🧪 Testando criação de dados padrão...');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Criar uma barbearia de teste
    const testBarbershop = await Barbershop.create({
      name: 'Teste Barbearia',
      slug: 'teste-barbearia',
      owner_email: 'teste@teste.com',
      plan_type: 'free',
      settings: {
        theme: 'default',
        workingHours: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '18:00' },
          saturday: { start: '08:00', end: '16:00' },
          sunday: { closed: true }
        }
      }
    });

    console.log(`✅ Barbearia teste criada: ${testBarbershop.name}`);

    // Criar barbeiro de teste
    const testBarber = await Barber.create({
      name: 'Barbeiro Teste',
      whatsapp: '11999999999',
      pix: 'teste@pix.com',
      barbershopId: testBarbershop.id
    });

    console.log(`✅ Barbeiro teste criado: ${testBarber.name}`);

    // Testar criação de dados padrão
    const defaultData = await createDefaultBarbershopData(testBarbershop, testBarber);

    // Verificar se os dados foram criados
    const services = await Service.findAll({ where: { barbershopId: testBarbershop.id } });
    const appointments = await Appointment.findAll({ where: { barbershopId: testBarbershop.id } });

    console.log('\n📊 Resultados do teste:');
    console.log(`   Serviços criados: ${services.length}`);
    services.forEach(service => {
      console.log(`   - ${service.name}: R$ ${service.price}`);
    });
    
    console.log(`   Agendamentos criados: ${appointments.length}`);
    appointments.forEach(appointment => {
      console.log(`   - ${appointment.clientName}: ${appointment.date} ${appointment.time} (${appointment.status})`);
    });

    // Limpar dados de teste
    await Appointment.destroy({ where: { barbershopId: testBarbershop.id } });
    await Service.destroy({ where: { barbershopId: testBarbershop.id } });
    await Barber.destroy({ where: { barbershopId: testBarbershop.id } });
    await Barbershop.destroy({ where: { id: testBarbershop.id } });

    console.log('\n🧹 Dados de teste removidos');
    console.log('\n🎉 Teste concluído com sucesso!');
    
    if (services.length === 2 && appointments.length === 1) {
      console.log('✅ PASSOU: Dados padrão criados corretamente');
    } else {
      console.log('❌ FALHOU: Dados padrão não foram criados corretamente');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testDefaultDataCreation();