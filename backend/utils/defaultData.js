const { Service, Appointment } = require('../models');

/**
 * Cria dados padrão para uma nova barbearia
 * - 2 serviços padrão (Corte Masculino e Barba)
 * - 1 agendamento de exemplo
 * @param {string} barbershopId - ID da barbearia
 * @param {string} firstBarberId - ID do primeiro barbeiro
 * @param {string} firstBarberName - Nome do primeiro barbeiro
 * @returns {Promise<{services: Array<Service>, appointment: Appointment}>} Objeto com serviços e agendamento criados
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

    // Criar 2 agendamentos de exemplo: um para hoje e um para amanhã
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentToday = await Appointment.create({
      clientName: 'Cliente Exemplo',
      serviceName: service1.name,
      date: today.toISOString().split('T')[0],
      time: '09:00',
      status: 'pending',
      barberId: firstBarberId,
      barberName: firstBarberName,
      price: service1.price,
      wppclient: '11999999999',
      barbershopId: barbershopId
    });

    const appointmentTomorrow = await Appointment.create({
      clientName: 'Cliente Exemplo',
      serviceName: service2.name,
      date: tomorrow.toISOString().split('T')[0],
      time: '14:00',
      status: 'pending',
      barberId: firstBarberId,
      barberName: firstBarberName,
      price: service2.price,
      wppclient: '11999999999',
      barbershopId: barbershopId
    });

    console.log(`✅ Agendamentos exemplo criados: ${appointmentToday.clientName} - ${appointmentToday.date} ${appointmentToday.time} e ${appointmentTomorrow.date} ${appointmentTomorrow.time}`);

    return {
      services: [service1, service2],
      appointments: [appointmentToday, appointmentTomorrow]
    };

  } catch (error) {
    console.error('❌ Erro ao criar dados padrão:', error);
    throw error;
  }
};

module.exports = { createDefaultData };