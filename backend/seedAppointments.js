const Appointment = require('./models/Appointment');
const sequelize = require('./models/database');

const seedAppointments = async () => {
  try {
    // Sincroniza os modelos com o banco de dados
    await sequelize.sync();

    // Remove todos os registros da tabela "Appointments"
    await Appointment.destroy({ where: {}, truncate: true });

    const specificDates = [
      '2024-02-17', '2024-02-18', '2024-02-19',
      '2024-02-20', '2024-02-21', '2024-02-22', '2024-02-23'
    ];

    const services = [
      { name: 'Corte Tradicional', price: 45 },
      { name: 'Tesoura', price: 60 },
      { name: 'Navalha', price: 70 },
      { name: 'Reflexo', price: 80 },
      { name: 'Nevou', price: 90 }
    ];
    let idCounter = 1;
    // Cria registros de appointment para cada data específica
    const appointments = specificDates.flatMap(date => {
      // Calcula a quantidade de agendamentos com base no dia da semana
      const dayOfWeek = new Date(date).getDay();
      const appointmentCount = (dayOfWeek === 0 || dayOfWeek === 6) ? 
        Math.floor(Math.random() * 4) + 5 : 
        Math.floor(Math.random() * 4) + 2;

      return Array.from({ length: appointmentCount }, () => {
        // Seleciona um serviço aleatório
        const service = services[Math.floor(Math.random() * services.length)];
        // Gera um ID único combinando um contador incremental com timestamp
        const uniqueId = `${Date.now()}-${idCounter++}`;
        return {
          id: uniqueId,
          clientName: `Cliente ${Math.floor(Math.random() * 100) + 1}`,
          serviceName: service.name,
          date: date,
          time: `${Math.floor(Math.random() * 8) + 9}:00`,
          status: Math.random() > 0.3 ? 'completed' : 'pending',
          barberId: Math.random() > 0.5 ? '01' : '02',
          barberName: Math.random() > 0.5 ? 'Maicon' : 'Brendon',
          price: service.price
        };
      });
    });

    // Insere os registros no banco de dados e valida os dados
    await Appointment.bulkCreate(appointments, { validate: true });
    console.log('Appointments seeded successfully!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding appointments:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedAppointments();
