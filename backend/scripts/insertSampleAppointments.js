/**
 * Script para inserir agendamentos de exemplo diretamente no banco de dados
 * Este script é uma versão simplificada que cria um conjunto fixo de agendamentos
 * 
 * Para executar: node scripts/insertSampleAppointments.js
 */

const sequelize = require('../models/database');
const Appointment = require('../models/Appointment');

// Função para gerar um ID único
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Função principal
const insertSampleAppointments = async () => {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');

    // Data atual
    const currentDate = new Date();
    const today = currentDate.toISOString().split('T')[0];
    
    // Data de ontem e amanhã
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
    
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

    // Agendamentos de exemplo
    const sampleAppointments = [];
    
    // Lista expandida de nomes de clientes
    const clientNames = [
      'João Silva', 'Maria Oliveira', 'Pedro Santos', 'Ana Ferreira',
      'Carlos Rodrigues', 'Juliana Costa', 'Roberto Almeida', 'Patricia Lima',
      'Lucas Mendes', 'Fernanda Santos', 'Ricardo Oliveira', 'Camila Costa',
      'Bruno Ferreira', 'Amanda Silva', 'Diego Santos', 'Larissa Oliveira',
      'Thiago Lima', 'Mariana Costa', 'Gabriel Almeida'
    ];

    // Lista expandida de serviços
    const services = [
      { name: 'Corte de Cabelo', price: 30 },
      { name: 'Corte e Barba', price: 45 },
      { name: 'Degradê', price: 35 },
      { name: 'Hidratação', price: 40 },
      { name: 'Barba', price: 25 },
      { name: 'Coloração', price: 70 },
      { name: 'Corte Navalhado', price: 40 },
      { name: 'Platinado', price: 80 },
      { name: 'Progressiva', price: 120 }
    ];

    // Horários disponíveis
    const availableTimes = [
      '09:00', '10:00', '11:00', '12:00', '13:00',
      '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];

    // Gerar 18 agendamentos por dia (6 originais * 3)
    const datesArray = [yesterdayFormatted, today, tomorrowFormatted];
    const barbers = [
      { id: '01', name: 'Maicon' },
      { id: '02', name: 'Brendon' }
    ];

    datesArray.forEach(date => {
      for (let i = 0; i < 9; i++) { // 9 agendamentos por barbeiro por dia
        barbers.forEach(barber => {
          const randomClient = clientNames[Math.floor(Math.random() * clientNames.length)];
          const randomService = services[Math.floor(Math.random() * services.length)];
          const randomTime = availableTimes[Math.floor(Math.random() * availableTimes.length)];
          const status = date === yesterdayFormatted ? 'completed' : 'pending';

          sampleAppointments.push({
            id: generateId(),
            clientName: randomClient,
            serviceName: randomService.name,
            date: date,
            time: randomTime,
            status: status,
            barberId: barber.id,
            barberName: barber.name,
            price: randomService.price
          });
        });
      }
    });

    console.log(`Inserindo ${sampleAppointments.length} agendamentos de exemplo...`);
    
    // Inserir os agendamentos no banco de dados
    const result = await Appointment.bulkCreate(sampleAppointments);
    
    console.log('Agendamentos inseridos com sucesso!');
    console.log(`Total de agendamentos inseridos: ${result.length}`);
    
    // Verificar o número total de agendamentos após a inserção
    const finalCount = await Appointment.count();
    console.log(`Total de agendamentos no banco de dados: ${finalCount}`);
    
    // Fechar a conexão com o banco de dados
    await sequelize.close();
    console.log('Conexão com o banco de dados fechada.');
    
  } catch (error) {
    console.error('Erro ao inserir agendamentos:', error);
    console.error('Detalhes do erro:', error.message);
    if (error.parent) {
      console.error('Erro SQL:', error.parent.message);
    }
    process.exit(1);
  }
};

// Executar a função principal
insertSampleAppointments();
