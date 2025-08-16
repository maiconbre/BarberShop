const { Service, Appointment } = require('../models');

/**
 * Cria dados padrão para uma nova barbearia
 * - 2 serviços padrão (Corte Masculino e Barba)
 * - 1 agendamento de exemplo
 */
const createDefaultData = async (barbershopId, firstBarberId, firstBarberName) => {
  try {
    console.log(`🎯 Criando dados padrão para barbearia ${barbershopId}...`);

    // Criar 2 serviços padrão
    const service1 = await Service.create({
      name: 'Corte Masculino',
      price: 25.00,
      barbershopId: barbershopId
    });

    const service2 = await Service.create({
      name: 'Barba',
      price: 15.00,
      barbershopId: barbershopId
    });

    console.log(`✅ Serviços padrão criados: ${service1.name}, ${service2.name}`);

    // Criar 1 agendamento de exemplo para amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const exampleAppointment = await Appointment.create({
      clientName: 'Cliente Exemplo',
      serviceName: service1.name,
      date: tomorrow.toISOString().split('T')[0],
      time: '10:00',
      status: 'confirmed',
      barberId: firstBarberId,
      barberName: firstBarberName,
      price: service1.price,
      wppclient: '11999999999',
      barbershopId: barbershopId
    });

    console.log(`✅ Agendamento exemplo criado: ${exampleAppointment.clientName} - ${exampleAppointment.date} ${exampleAppointment.time}`);

    return {
      services: [service1, service2],
      appointment: exampleAppointment
    };

  } catch (error) {
    console.error('❌ Erro ao criar dados padrão:', error);
    throw error;
  }
};

module.exports = { createDefaultData };