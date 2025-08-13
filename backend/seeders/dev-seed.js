const { Barbershop, User, Barber, Service, Appointment, Comment, BarberServices } = require('../models');
const bcrypt = require('bcryptjs');

const seedDevelopmentData = async () => {
  try {
    console.log('🌱 Starting development seed...');

    // Create development barbershop
    const barbershop = await Barbershop.create({
      name: 'Dev Barbershop',
      slug: 'dev-barbershop',
      owner_email: 'admin@dev-barbershop.com',
      plan_type: 'pro',
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

    console.log(`✅ Created barbershop: ${barbershop.name} (${barbershop.slug})`);

    // Create admin user
    const adminUser = await User.create({
      id: 'admin-001',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User',
      barbershopId: barbershop.id
    });

    console.log(`✅ Created admin user: ${adminUser.username}`);

    // Create 2 barbers
    const barber1 = await Barber.create({
      id: '01',
      name: 'João Silva',
      whatsapp: '11999999001',
      pix: 'joao@pix.com',
      barbershopId: barbershop.id
    });

    const barber2 = await Barber.create({
      id: '02',
      name: 'Pedro Santos',
      whatsapp: '11999999002',
      pix: 'pedro@pix.com',
      barbershopId: barbershop.id
    });

    console.log(`✅ Created barbers: ${barber1.name}, ${barber2.name}`);

    // Create barber users
    const barberUser1 = await User.create({
      id: 'barber-001',
      username: 'joao',
      password: 'barber123',
      role: 'barber',
      name: 'João Silva',
      barbershopId: barbershop.id
    });

    const barberUser2 = await User.create({
      id: 'barber-002',
      username: 'pedro',
      password: 'barber123',
      role: 'barber',
      name: 'Pedro Santos',
      barbershopId: barbershop.id
    });

    console.log(`✅ Created barber users: ${barberUser1.username}, ${barberUser2.username}`);

    // Create 2 services
    const service1 = await Service.create({
      name: 'Corte Masculino',
      price: 25.00,
      barbershopId: barbershop.id
    });

    const service2 = await Service.create({
      name: 'Barba',
      price: 15.00,
      barbershopId: barbershop.id
    });

    console.log(`✅ Created services: ${service1.name}, ${service2.name}`);

    // Associate barbers with services
    await BarberServices.create({
      BarberId: barber1.id,
      ServiceId: service1.id,
      barbershopId: barbershop.id
    });

    await BarberServices.create({
      BarberId: barber1.id,
      ServiceId: service2.id,
      barbershopId: barbershop.id
    });

    await BarberServices.create({
      BarberId: barber2.id,
      ServiceId: service1.id,
      barbershopId: barbershop.id
    });

    console.log('✅ Associated barbers with services');

    // Create 3 appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const appointment1 = await Appointment.create({
      id: Date.now().toString(),
      clientName: 'Carlos Silva',
      serviceName: service1.name,
      date: today.toISOString().split('T')[0],
      time: '10:00',
      status: 'confirmed',
      barberId: barber1.id,
      barberName: barber1.name,
      price: service1.price,
      wppclient: '11999999101',
      barbershopId: barbershop.id
    });

    const appointment2 = await Appointment.create({
      id: (Date.now() + 1).toString(),
      clientName: 'Maria Santos',
      serviceName: service2.name,
      date: tomorrow.toISOString().split('T')[0],
      time: '14:00',
      status: 'pending',
      barberId: barber2.id,
      barberName: barber2.name,
      price: service2.price,
      wppclient: '11999999102',
      barbershopId: barbershop.id
    });

    const appointment3 = await Appointment.create({
      id: (Date.now() + 2).toString(),
      clientName: 'José Oliveira',
      serviceName: service1.name,
      date: dayAfter.toISOString().split('T')[0],
      time: '16:00',
      status: 'completed',
      barberId: barber1.id,
      barberName: barber1.name,
      price: service1.price,
      wppclient: '11999999103',
      barbershopId: barbershop.id
    });

    console.log(`✅ Created appointments: ${appointment1.clientName}, ${appointment2.clientName}, ${appointment3.clientName}`);

    // Create some comments
    await Comment.create({
      id: 'comment-001',
      name: 'Cliente Satisfeito',
      comment: 'Excelente atendimento! Recomendo muito.',
      status: 'approved',
      barbershopId: barbershop.id
    });

    await Comment.create({
      id: 'comment-002',
      name: 'João Cliente',
      comment: 'Serviço de qualidade, ambiente agradável.',
      status: 'pending',
      barbershopId: barbershop.id
    });

    console.log('✅ Created comments');

    console.log('\n🎉 Development seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Barbershop: ${barbershop.name} (${barbershop.slug})`);
    console.log(`   Admin: ${adminUser.username} / admin123`);
    console.log(`   Barbers: ${barberUser1.username} / barber123, ${barberUser2.username} / barber123`);
    console.log(`   Services: ${service1.name} (R$ ${service1.price}), ${service2.name} (R$ ${service2.price})`);
    console.log(`   Appointments: 3 created with different statuses`);
    console.log(`   Comments: 2 created (1 approved, 1 pending)`);

    return {
      barbershop,
      users: [adminUser, barberUser1, barberUser2],
      barbers: [barber1, barber2],
      services: [service1, service2],
      appointments: [appointment1, appointment2, appointment3]
    };

  } catch (error) {
    console.error('❌ Error seeding development data:', error);
    throw error;
  }
};

module.exports = { seedDevelopmentData };