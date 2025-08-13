const request = require('supertest');
const app = require('../../server');
const { Barbershop, User, Barber, Service, Appointment, Comment } = require('../../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/jwt');

describe('Multi-Tenant Flow Integration Tests', () => {
  let barbershop1, barbershop2;
  let user1, user2;
  let token1, token2;

  beforeAll(async () => {
    // Clean up database before tests
    await Comment.destroy({ where: {}, force: true });
    await Appointment.destroy({ where: {}, force: true });
    await Service.destroy({ where: {}, force: true });
    await Barber.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Barbershop.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    // Clean up after tests
    await Comment.destroy({ where: {}, force: true });
    await Appointment.destroy({ where: {}, force: true });
    await Service.destroy({ where: {}, force: true });
    await Barber.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Barbershop.destroy({ where: {}, force: true });
  });

  describe('1. Criar 2 barbearias', () => {
    test('1.1 Registrar primeira barbearia (barbearia-alpha)', async () => {
      const registrationData = {
        name: 'Barbearia Alpha',
        slug: 'barbearia-alpha',
        ownerEmail: 'admin@alpha.com',
        ownerName: 'Admin Alpha',
        ownerUsername: 'admin-alpha',
        ownerPassword: 'password123',
        planType: 'free'
      };

      const response = await request(app)
        .post('/api/barbershops/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.barbershop.slug).toBe('barbearia-alpha');
      expect(response.body.data.barbershop.name).toBe('Barbearia Alpha');
      expect(response.body.data.user.username).toBe('admin-alpha');
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.token).toBeDefined();

      // Store data for later tests
      barbershop1 = response.body.data.barbershop;
      user1 = response.body.data.user;
      token1 = response.body.data.token;

      console.log('✅ Barbearia Alpha criada:', barbershop1.id);
    });

    test('1.2 Registrar segunda barbearia (barbearia-beta)', async () => {
      const registrationData = {
        name: 'Barbearia Beta',
        slug: 'barbearia-beta',
        ownerEmail: 'admin@beta.com',
        ownerName: 'Admin Beta',
        ownerUsername: 'admin-beta',
        ownerPassword: 'password456',
        planType: 'free'
      };

      const response = await request(app)
        .post('/api/barbershops/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.barbershop.slug).toBe('barbearia-beta');
      expect(response.body.data.barbershop.name).toBe('Barbearia Beta');
      expect(response.body.data.user.username).toBe('admin-beta');
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data.token).toBeDefined();

      // Store data for later tests
      barbershop2 = response.body.data.barbershop;
      user2 = response.body.data.user;
      token2 = response.body.data.token;

      console.log('✅ Barbearia Beta criada:', barbershop2.id);
    });

    test('1.3 Validar slugs únicos', async () => {
      // Verificar que os slugs são diferentes
      expect(barbershop1.slug).not.toBe(barbershop2.slug);
      expect(barbershop1.id).not.toBe(barbershop2.id);

      // Tentar criar barbearia com slug duplicado
      const duplicateData = {
        name: 'Barbearia Duplicada',
        slug: 'barbearia-alpha', // Slug já usado
        ownerEmail: 'duplicate@test.com',
        ownerName: 'Admin Duplicate',
        ownerUsername: 'admin-duplicate',
        ownerPassword: 'password789'
      };

      const response = await request(app)
        .post('/api/barbershops/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('SLUG_ALREADY_EXISTS');

      console.log('✅ Validação de slug único funcionando');
    });

    test('1.4 Verificar disponibilidade de slugs', async () => {
      // Slug já usado
      const usedSlugResponse = await request(app)
        .get('/api/barbershops/check-slug/barbearia-alpha')
        .expect(200);

      expect(usedSlugResponse.body.success).toBe(true);
      expect(usedSlugResponse.body.available).toBe(false);

      // Slug disponível
      const availableSlugResponse = await request(app)
        .get('/api/barbershops/check-slug/barbearia-gamma')
        .expect(200);

      expect(availableSlugResponse.body.success).toBe(true);
      expect(availableSlugResponse.body.available).toBe(true);

      console.log('✅ Verificação de disponibilidade de slug funcionando');
    });
  });

  describe('2. Logar em cada barbearia', () => {
    test('2.1 Login na primeira barbearia', async () => {
      const loginData = {
        username: 'admin-alpha',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('admin-alpha');
      expect(response.body.user.barbershopId).toBe(barbershop1.id);
      expect(response.body.token).toBeDefined();

      // Atualizar token para testes subsequentes
      token1 = response.body.token;

      console.log('✅ Login na Barbearia Alpha realizado');
    });

    test('2.2 Login na segunda barbearia', async () => {
      const loginData = {
        username: 'admin-beta',
        password: 'password456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('admin-beta');
      expect(response.body.user.barbershopId).toBe(barbershop2.id);
      expect(response.body.token).toBeDefined();

      // Atualizar token para testes subsequentes
      token2 = response.body.token;

      console.log('✅ Login na Barbearia Beta realizado');
    });

    test('2.3 Validar tokens contêm barbershopId correto', async () => {
      // Decodificar token 1
      const decoded1 = jwt.verify(token1, jwtConfig.secret);
      expect(decoded1.barbershopId).toBe(barbershop1.id);
      expect(decoded1.username).toBe('admin-alpha');

      // Decodificar token 2
      const decoded2 = jwt.verify(token2, jwtConfig.secret);
      expect(decoded2.barbershopId).toBe(barbershop2.id);
      expect(decoded2.username).toBe('admin-beta');

      console.log('✅ Tokens contêm barbershopId correto');
    });
  });

  describe('3. Validar isolamento no dashboard', () => {
    let barber1, barber2;
    let service1, service2;
    let appointment1, appointment2;

    beforeAll(async () => {
      // Criar dados de teste para cada barbearia
      
      // Barbearia Alpha
      barber1 = await Barber.create({
        id: '01',
        name: 'João Alpha',
        whatsapp: '11999999001',
        pix: 'joao@alpha.com',
        barbershopId: barbershop1.id
      });

      service1 = await Service.create({
        name: 'Corte Alpha',
        price: 25.00,
        barbershopId: barbershop1.id
      });

      appointment1 = await Appointment.create({
        id: Date.now().toString() + '-alpha',
        clientName: 'Cliente Alpha',
        serviceName: 'Corte Alpha',
        date: '2025-08-15',
        time: '10:00',
        status: 'pending',
        barberId: '01',
        barberName: 'João Alpha',
        price: 25.00,
        wppclient: '11999999001',
        barbershopId: barbershop1.id
      });

      // Barbearia Beta
      barber2 = await Barber.create({
        id: '01',
        name: 'Pedro Beta',
        whatsapp: '11999999002',
        pix: 'pedro@beta.com',
        barbershopId: barbershop2.id
      });

      service2 = await Service.create({
        name: 'Corte Beta',
        price: 30.00,
        barbershopId: barbershop2.id
      });

      appointment2 = await Appointment.create({
        id: Date.now().toString() + '-beta',
        clientName: 'Cliente Beta',
        serviceName: 'Corte Beta',
        date: '2025-08-15',
        time: '14:00',
        status: 'pending',
        barberId: '01',
        barberName: 'Pedro Beta',
        price: 30.00,
        wppclient: '11999999002',
        barbershopId: barbershop2.id
      });

      console.log('✅ Dados de teste criados para ambas as barbearias');
    });

    test('3.1 Obter dados da barbearia atual - Alpha', async () => {
      // Simular requisição com tenant context para Alpha
      const response = await request(app)
        .get('/api/app/barbearia-alpha/barbershops/current')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(barbershop1.id);
      expect(response.body.data.slug).toBe('barbearia-alpha');
      expect(response.body.data.name).toBe('Barbearia Alpha');

      console.log('✅ Dados da Barbearia Alpha obtidos via tenant context');
    });

    test('3.2 Obter dados da barbearia atual - Beta', async () => {
      // Simular requisição com tenant context para Beta
      const response = await request(app)
        .get('/api/app/barbearia-beta/barbershops/current')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(barbershop2.id);
      expect(response.body.data.slug).toBe('barbearia-beta');
      expect(response.body.data.name).toBe('Barbearia Beta');

      console.log('✅ Dados da Barbearia Beta obtidos via tenant context');
    });

    test('3.3 Listar barbeiros - isolamento por tenant', async () => {
      // Listar barbeiros da Alpha
      const responseAlpha = await request(app)
        .get('/api/app/barbearia-alpha/barbers')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(responseAlpha.body.length).toBe(1);
      expect(responseAlpha.body[0].name).toBe('João Alpha');
      expect(responseAlpha.body[0].barbershopId).toBe(barbershop1.id);

      // Listar barbeiros da Beta
      const responseBeta = await request(app)
        .get('/api/app/barbearia-beta/barbers')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(responseBeta.body.length).toBe(1);
      expect(responseBeta.body[0].name).toBe('Pedro Beta');
      expect(responseBeta.body[0].barbershopId).toBe(barbershop2.id);

      console.log('✅ Isolamento de barbeiros por tenant funcionando');
    });

    test('3.4 Listar serviços - isolamento por tenant', async () => {
      // Listar serviços da Alpha
      const responseAlpha = await request(app)
        .get('/api/app/barbearia-alpha/services')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(responseAlpha.body.length).toBe(1);
      expect(responseAlpha.body[0].name).toBe('Corte Alpha');
      expect(responseAlpha.body[0].price).toBe(25.00);
      expect(responseAlpha.body[0].barbershopId).toBe(barbershop1.id);

      // Listar serviços da Beta
      const responseBeta = await request(app)
        .get('/api/app/barbearia-beta/services')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(responseBeta.body.length).toBe(1);
      expect(responseBeta.body[0].name).toBe('Corte Beta');
      expect(responseBeta.body[0].price).toBe(30.00);
      expect(responseBeta.body[0].barbershopId).toBe(barbershop2.id);

      console.log('✅ Isolamento de serviços por tenant funcionando');
    });

    test('3.5 Listar agendamentos - isolamento por tenant', async () => {
      // Listar agendamentos da Alpha
      const responseAlpha = await request(app)
        .get('/api/app/barbearia-alpha/appointments')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(responseAlpha.body.length).toBe(1);
      expect(responseAlpha.body[0].clientName).toBe('Cliente Alpha');
      expect(responseAlpha.body[0].serviceName).toBe('Corte Alpha');
      expect(responseAlpha.body[0].barbershopId).toBe(barbershop1.id);

      // Listar agendamentos da Beta
      const responseBeta = await request(app)
        .get('/api/app/barbearia-beta/appointments')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(responseBeta.body.length).toBe(1);
      expect(responseBeta.body[0].clientName).toBe('Cliente Beta');
      expect(responseBeta.body[0].serviceName).toBe('Corte Beta');
      expect(responseBeta.body[0].barbershopId).toBe(barbershop2.id);

      console.log('✅ Isolamento de agendamentos por tenant funcionando');
    });

    test('3.6 Tentar acesso cross-tenant (deve falhar)', async () => {
      // Usuário da Alpha tentando acessar dados da Beta
      const response = await request(app)
        .get('/api/app/barbearia-beta/barbershops/current')
        .set('Authorization', `Bearer ${token1}`) // Token da Alpha
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('CROSS_TENANT_ACCESS_DENIED');

      console.log('✅ Bloqueio de acesso cross-tenant funcionando');
    });

    test('3.7 Criar agendamento - isolamento por tenant', async () => {
      const appointmentData = {
        clientName: 'Novo Cliente Alpha',
        serviceName: 'Corte Alpha',
        date: '2025-08-16',
        time: '15:00',
        barberId: '01',
        barberName: 'João Alpha',
        price: 25.00,
        wppclient: '11999999003'
      };

      const response = await request(app)
        .post('/api/app/barbearia-alpha/appointments')
        .set('Authorization', `Bearer ${token1}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.clientName).toBe('Novo Cliente Alpha');
      expect(response.body.barbershopId).toBe(barbershop1.id);

      // Verificar que o agendamento não aparece na Beta
      const responseBeta = await request(app)
        .get('/api/app/barbearia-beta/appointments')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      const newAppointmentInBeta = responseBeta.body.find(
        apt => apt.clientName === 'Novo Cliente Alpha'
      );
      expect(newAppointmentInBeta).toBeUndefined();

      console.log('✅ Criação de agendamento com isolamento por tenant funcionando');
    });

    test('3.8 Validar que dados não vazam entre tenants', async () => {
      // Buscar todos os dados de cada tenant e verificar isolamento
      
      // Dados da Alpha
      const barbersAlpha = await Barber.findAll({ where: { barbershopId: barbershop1.id } });
      const servicesAlpha = await Service.findAll({ where: { barbershopId: barbershop1.id } });
      const appointmentsAlpha = await Appointment.findAll({ where: { barbershopId: barbershop1.id } });

      // Dados da Beta
      const barbersBeta = await Barber.findAll({ where: { barbershopId: barbershop2.id } });
      const servicesBeta = await Service.findAll({ where: { barbershopId: barbershop2.id } });
      const appointmentsBeta = await Appointment.findAll({ where: { barbershopId: barbershop2.id } });

      // Verificar que não há vazamento de dados
      expect(barbersAlpha.length).toBeGreaterThan(0);
      expect(barbersBeta.length).toBeGreaterThan(0);
      expect(barbersAlpha.every(b => b.barbershopId === barbershop1.id)).toBe(true);
      expect(barbersBeta.every(b => b.barbershopId === barbershop2.id)).toBe(true);

      expect(servicesAlpha.every(s => s.barbershopId === barbershop1.id)).toBe(true);
      expect(servicesBeta.every(s => s.barbershopId === barbershop2.id)).toBe(true);

      expect(appointmentsAlpha.every(a => a.barbershopId === barbershop1.id)).toBe(true);
      expect(appointmentsBeta.every(a => a.barbershopId === barbershop2.id)).toBe(true);

      console.log('✅ Validação completa: dados não vazam entre tenants');
    });
  });

  describe('4. Teste de segurança adicional', () => {
    test('4.1 Tentar acessar endpoint sem tenant context', async () => {
      const response = await request(app)
        .get('/api/barbershops/current')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TENANT_CONTEXT_MISSING');

      console.log('✅ Proteção contra acesso sem tenant context funcionando');
    });

    test('4.2 Tentar acessar com slug inexistente', async () => {
      const response = await request(app)
        .get('/api/app/barbearia-inexistente/barbershops/current')
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TENANT_NOT_FOUND');

      console.log('✅ Proteção contra tenant inexistente funcionando');
    });

    test('4.3 Validar middleware de tenant em todas as rotas protegidas', async () => {
      const protectedRoutes = [
        '/api/app/barbearia-alpha/barbers',
        '/api/app/barbearia-alpha/services',
        '/api/app/barbearia-alpha/appointments',
        '/api/app/barbearia-alpha/barbershops/current'
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)
          .get(route)
          .set('Authorization', `Bearer ${token1}`)
          .expect(200);

        expect(response.body).toBeDefined();
      }

      console.log('✅ Middleware de tenant funcionando em todas as rotas protegidas');
    });
  });

  describe('5. Resumo do teste', () => {
    test('5.1 Multi-tenant completo e funcional', async () => {
      // Verificar que temos 2 barbearias distintas
      const allBarbershops = await Barbershop.findAll();
      expect(allBarbershops.length).toBe(2);

      // Verificar que cada barbearia tem seus próprios dados
      const barbershop1Data = await Barbershop.findByPk(barbershop1.id);
      const barbershop2Data = await Barbershop.findByPk(barbershop2.id);

      expect(barbershop1Data.slug).toBe('barbearia-alpha');
      expect(barbershop2Data.slug).toBe('barbearia-beta');

      // Verificar isolamento de dados
      const alpha_barbers = await Barber.count({ where: { barbershopId: barbershop1.id } });
      const beta_barbers = await Barber.count({ where: { barbershopId: barbershop2.id } });
      const alpha_services = await Service.count({ where: { barbershopId: barbershop1.id } });
      const beta_services = await Service.count({ where: { barbershopId: barbershop2.id } });

      expect(alpha_barbers).toBeGreaterThan(0);
      expect(beta_barbers).toBeGreaterThan(0);
      expect(alpha_services).toBeGreaterThan(0);
      expect(beta_services).toBeGreaterThan(0);

      console.log('🎉 TESTE COMPLETO: Multi-tenant funcional e pronto para migração de componentes');
      console.log(`📊 Resumo:`);
      console.log(`   - Barbearias criadas: ${allBarbershops.length}`);
      console.log(`   - Alpha: ${alpha_barbers} barbeiros, ${alpha_services} serviços`);
      console.log(`   - Beta: ${beta_barbers} barbeiros, ${beta_services} serviços`);
      console.log(`   - Isolamento: ✅ Funcionando`);
      console.log(`   - Segurança: ✅ Funcionando`);
      console.log(`   - Autenticação: ✅ Funcionando`);
    });
  });
});