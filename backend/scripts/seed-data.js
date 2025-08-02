/**
 * Script para popular o banco de dados com dados iniciais
 * 
 * Execute com: node scripts/seed-data.js
 */

require('dotenv').config({ path: '../../.env.local' });
const sequelize = require('../models/database');
const User = require('../models/User');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('Iniciando população do banco de dados...');
  
  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Sincronizar modelos com o banco de dados (não força recriação das tabelas)
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados com o banco de dados');
    
    // Verificar se já existem dados
    const userCount = await User.count();
    const barberCount = await Barber.count();
    const serviceCount = await Service.count();
    
    console.log(`Usuários existentes: ${userCount}`);
    console.log(`Barbeiros existentes: ${barberCount}`);
    console.log(`Serviços existentes: ${serviceCount}`);
    
    // Criar usuário admin se não existir
    if (userCount === 0) {
      console.log('Criando usuário administrador...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@barbergr.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Usuário administrador criado');
    }
    
    // Criar barbeiros se não existirem
    if (barberCount === 0) {
      console.log('Criando barbeiros...');
      const barbeiros = [
        {
          name: 'João Silva',
          specialty: 'Corte Clássico',
          rating: 4.8,
          imageUrl: '/img/barbers/barber1.jpg',
          bio: 'Especialista em cortes clássicos com mais de 10 anos de experiência.'
        },
        {
          name: 'Carlos Oliveira',
          specialty: 'Barba e Bigode',
          rating: 4.7,
          imageUrl: '/img/barbers/barber2.jpg',
          bio: 'Mestre em design de barba e bigode, atendendo clientes exigentes desde 2015.'
        },
        {
          name: 'André Santos',
          specialty: 'Cortes Modernos',
          rating: 4.9,
          imageUrl: '/img/barbers/barber3.jpg',
          bio: 'Especializado em cortes modernos e tendências atuais para o público jovem.'
        }
      ];
      
      await Barber.bulkCreate(barbeiros);
      console.log('✅ Barbeiros criados');
    }
    
    // Criar serviços se não existirem
    if (serviceCount === 0) {
      console.log('Criando serviços...');
      const servicos = [
        {
          name: 'Corte de Cabelo',
          description: 'Corte de cabelo tradicional com tesoura e máquina',
          price: 35.00,
          duration: 30, // minutos
          imageUrl: '/img/services/haircut.jpg'
        },
        {
          name: 'Barba',
          description: 'Aparar e modelar barba com navalha e produtos especiais',
          price: 25.00,
          duration: 20, // minutos
          imageUrl: '/img/services/beard.jpg'
        },
        {
          name: 'Corte + Barba',
          description: 'Combo de corte de cabelo e barba com desconto especial',
          price: 55.00,
          duration: 50, // minutos
          imageUrl: '/img/services/combo.jpg'
        },
        {
          name: 'Hidratação',
          description: 'Tratamento de hidratação profunda para cabelos',
          price: 40.00,
          duration: 40, // minutos
          imageUrl: '/img/services/hydration.jpg'
        }
      ];
      
      await Service.bulkCreate(servicos);
      console.log('✅ Serviços criados');
    }
    
    console.log('\n✅ Banco de dados populado com sucesso!');
    console.log('\nCredenciais do administrador:');
    console.log('Email: admin@barbergr.com');
    console.log('Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro ao popular o banco de dados:');
    console.error(error.message);
    console.error('\nDetalhes completos do erro:');
    console.error(error);
  } finally {
    // Fechar a conexão
    await sequelize.close();
    process.exit(0);
  }
}

seedDatabase();