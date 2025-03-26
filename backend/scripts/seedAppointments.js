const Appointment = require('../models/Appointment');
const sequelize = require('../models/database');

const seedAppointments = async () => {
  try {
    // Sincroniza os modelos com o banco de dados
    await sequelize.sync();

    // Remove todos os registros da tabela "Appointments"
    await Appointment.destroy({ where: {}, truncate: true });

    const specificDates = [];
    const today = new Date();
    for (let i = -15; i <= 15; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      specificDates.push(date.toISOString().split('T')[0]);
    }

    const services = [
      { name: 'Corte Tradicional', price: 45 },
      { name: 'Tesoura', price: 60 },
      { name: 'Navalha', price: 70 },
      { name: 'Reflexo', price: 80 },
      { name: 'Nevou', price: 90 }
    ];

    const clientNames = [
      'João', 'Pedro', 'Marcos', 'Matheus', 'Vini', 'Juninho', 'Mari', 'Felipe', 'Julia', 'Gabrielle', 'Larissa', 'Lucas', 'Mariana', 'Rafaela', 'Rafael', 'Gustavo', 'pedrin,ho', 'Maria', 'José', 'Carlos', 'Ana', 'Paula', 'Fernanda', 'Fernando', 'Ricardo', 'Rafael', 'Rafaela',
    ];

    const barbers = [
      { id: '01', name: 'Maicon' },
      { id: '02', name: 'Brendon' },
      { id: '03', name: 'Pedro' }
    ];

    let idCounter = 1;
    const appointments = [];
    const appointmentsPerBarber = 50;

    const availableHours = [9, 10, 11, 14, 15, 16, 17, 18, 19, 20];

    barbers.forEach(barber => {
      let barberAppointments = 0;
      while (barberAppointments < appointmentsPerBarber) {
        const date = specificDates[Math.floor(Math.random() * specificDates.length)];
        const service = services[Math.floor(Math.random() * services.length)];
        const uniqueId = `${Date.now()}-${idCounter++}`;
        const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
        
        // Selecionar horário aleatório da lista de horários disponíveis
        const hour = availableHours[Math.floor(Math.random() * availableHours.length)];
        const time = `${hour}:00`;

        // Verificar se já existe agendamento neste horário para este barbeiro
        const existingAppointment = appointments.find(
          app => app.date === date && app.time === time && app.barberId === barber.id
        );

        if (!existingAppointment) {
          const appointmentDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Define o status baseado na data
          const status = appointmentDate < today ? 'completed' : 'pending';

          appointments.push({
            id: uniqueId,
            clientName: clientName,
            serviceName: service.name,
            date: date,
            time: time,
            status: status,
            barberId: barber.id,
            barberName: barber.name,
            price: service.price
          });

          barberAppointments++;
        }
      }
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
