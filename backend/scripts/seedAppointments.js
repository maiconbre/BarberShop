const Appointment = require('../models/Appointment');
const sequelize = require('../models/database');

const seedAppointments = async () => {
  try {
    // Força a sincronização do modelo com o banco de dados para criar a coluna wppclient
    await sequelize.sync({ alter: true });
    await Appointment.destroy({ where: {}, truncate: true });
    
    // Objeto para controlar a quantidade de agendamentos por cliente por mês
    const clientMonthlyAppointments = {};

    const specificDates = [];
    const today = new Date();
    // Gera datas de 2 meses atrás até 2 meses à frente
    for (let i = -60; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      specificDates.push(date.toISOString().split('T')[0]);
    }

    const services = [
      { name: 'Americano', price: 50 },
      { name: 'Sobrancelha', price: 15 },
      { name: 'Barba modelada', price: 20 },
      { name: 'Nevou', price: 70 },
      { name: 'Corte tradicional', price: 50 },
      { name: 'Jaca', price: 35 },
      { name: 'Pezin', price: 10 },
      { name: 'Militar', price: 30 }
    ];

    const clientNames = [
      'João Silva', 'Maria Oliveira', 'Pedro Santos', 'Ana Ferreira',
      'Carlos Rodrigues', 'Juliana Costa', 'Roberto Almeida', 'Patricia Lima',
      'Lucas Mendes', 'Fernanda Santos', 'Ricardo Oliveira', 'Camila Costa',
      'Bruno Ferreira', 'Amanda Silva', 'Diego Santos', 'Larissa Oliveira',
      'Thiago Lima', 'Mariana Costa', 'Gabriel Almeida', 'Rafael Souza',
      'Isabela Martins', 'Gustavo Pereira', 'Bianca Oliveira', 'Henrique Costa',
      'Natália Santos', 'Felipe Rodrigues', 'Letícia Alves', 'Matheus Lima',
      'Carolina Ferreira', 'Vinicius Gomes', 'Beatriz Carvalho', 'Leonardo Dias',
      'Gabriela Ribeiro', 'Eduardo Barbosa', 'Manuela Sousa', 'Guilherme Almeida',
      'Luiza Fernandes', 'Arthur Cardoso', 'Sophia Nascimento', 'Samuel Moreira',
      'Valentina Pinto', 'Enzo Teixeira', 'Laura Correia', 'Nicolas Cavalcanti',
      'Melissa Araújo', 'Caio Vieira', 'Yasmin Moura', 'Murilo Castro',
      'Heloísa Nunes', 'Benício Rocha', 'Esther Campos', 'Bryan Duarte'
    ];

    const barbers = [
      { id: '01', name: 'joao' },
      { id: '02', name: 'Pedro' },
      { id: '03', name: 'Gabrielle' },
      { id: '04', name: 'Marcos' }
    ];

    let idCounter = 1;
    const appointments = [];
    const appointmentsPerBarber = 200; // Aumentado para atingir 800 agendamentos (4 barbeiros x 200)

    // Horários disponíveis fixos
    const availableHours = ['09:00', '10:00', '11:00', '12:00', '13:00', 
                           '14:00', '15:00', '16:00', '17:00', '18:00', 
                           '19:00', '20:00'];

    barbers.forEach(barber => {
      let barberAppointments = 0;
      
      // Distribuir agendamentos uniformemente entre as datas
      specificDates.forEach(date => {
        if (barberAppointments >= appointmentsPerBarber) return;

        // Extrair o mês da data para controle de limite mensal
        const appointmentMonth = date.substring(0, 7); // Formato: YYYY-MM

        // Escolher horários aleatórios para cada data
        const shuffledHours = [...availableHours].sort(() => Math.random() - 0.5);
        
        // Criar 2-3 agendamentos por dia
        const appointmentsForDay = Math.floor(Math.random() * 2) + 2;
        
        // Embaralhar os clientes para cada dia para distribuir melhor os agendamentos
        const shuffledClients = [...Array(clientNames.length).keys()].sort(() => Math.random() - 0.5);
        
        let clientAttempt = 0;
        for (let i = 0; i < appointmentsForDay && barberAppointments < appointmentsPerBarber; i++) {
          // Tentar encontrar um cliente que ainda não atingiu o limite mensal
          let clientFound = false;
          
          while (clientAttempt < shuffledClients.length && !clientFound) {
            const clientIndex = shuffledClients[clientAttempt];
            const clientName = clientNames[clientIndex];
            
            // Gerar número de WhatsApp fixo para cada cliente
            const baseWppNumber = 5500000000000 + (clientIndex * 10000000);
            const wppclient = `${baseWppNumber}`;
            
            // Verificar se o cliente já atingiu o limite mensal de 4 agendamentos
            const clientMonthKey = `${wppclient}-${appointmentMonth}`;
            if (!clientMonthlyAppointments[clientMonthKey]) {
              clientMonthlyAppointments[clientMonthKey] = 0;
            }
            
            if (clientMonthlyAppointments[clientMonthKey] < 4) {
              // Cliente ainda não atingiu o limite, pode agendar
              clientFound = true;
              clientMonthlyAppointments[clientMonthKey]++;
              
              const service = services[Math.floor(Math.random() * services.length)];
              const uniqueId = `${Date.now()}-${idCounter++}`;
              const time = shuffledHours[i];

              // Determinar status baseado na data
              const appointmentDate = new Date(date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const status = appointmentDate < today ? 'completed' : 'pending';
              
              appointments.push({
                id: uniqueId,
                clientName,
                serviceName: service.name,
                date,
                time,
                status,
                barberId: barber.id,
                barberName: barber.name,
                price: service.price,
                wppclient
              });
              
              barberAppointments++;
              break;
            }
            
            clientAttempt++;
          }
          
          // Se não encontrou cliente disponível, pular este agendamento
          if (!clientFound) {
            continue;
          }
        }
      });
    });

    // Ordenar appointments por data e hora
    appointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare || a.time.localeCompare(b.time);
    });

    await Appointment.bulkCreate(appointments, { validate: true });
    console.log(`Total de agendamentos criados: ${appointments.length}`);
    console.log('Agendamentos inseridos com sucesso!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar agendamentos:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedAppointments();
