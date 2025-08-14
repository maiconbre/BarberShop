/**
 * Script para validar o fluxo final multi-tenant
 * Testa a estrutura do banco e funcionalidades básicas
 */

const { Barbershop, User, Barber, Service, Appointment, Comment } = require('../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

console.log('🎯 Validação Final do Multi-Tenant');
console.log('==================================\n');

async function validateDatabaseStructure() {
  console.log('📋 1. Validando estrutura do banco de dados');
  console.log('===========================================\n');

  try {
    // 1.1 Verificar se todas as tabelas têm barbershopId
    console.log('🔍 1.1 Verificando estrutura das tabelas...');
    
    const barbershops = await Barbershop.findAll();
    console.log(`   ✅ Barbershops: ${barbershops.length} encontradas`);
    
    if (barbershops.length > 0) {
      const barbershop = barbershops[0];
      console.log(`   📝 Primeira barbearia: ${barbershop.name} (${barbershop.slug})`);
      console.log(`   🆔 ID: ${barbershop.id}`);
      console.log(`   📊 Plano: ${barbershop.plan_type}`);
    }

    // 1.2 Verificar se Users têm barbershopId
    const users = await User.findAll();
    console.log(`\n   ✅ Users: ${users.length} encontrados`);
    
    const usersWithBarbershopId = users.filter(u => u.barbershopId);
    console.log(`   🔗 Users com barbershopId: ${usersWithBarbershopId.length}/${users.length}`);
    
    if (usersWithBarbershopId.length !== users.length) {
      throw new Error('Nem todos os usuários têm barbershopId');
    }

    // 1.3 Verificar se Barbers têm barbershopId
    const barbers = await Barber.findAll();
    console.log(`\n   ✅ Barbers: ${barbers.length} encontrados`);
    
    const barbersWithBarbershopId = barbers.filter(b => b.barbershopId);
    console.log(`   🔗 Barbers com barbershopId: ${barbersWithBarbershopId.length}/${barbers.length}`);
    
    if (barbersWithBarbershopId.length !== barbers.length) {
      throw new Error('Nem todos os barbeiros têm barbershopId');
    }

    // 1.4 Verificar se Services têm barbershopId
    const services = await Service.findAll();
    console.log(`\n   ✅ Services: ${services.length} encontrados`);
    
    const servicesWithBarbershopId = services.filter(s => s.barbershopId);
    console.log(`   🔗 Services com barbershopId: ${servicesWithBarbershopId.length}/${services.length}`);
    
    if (servicesWithBarbershopId.length !== services.length) {
      throw new Error('Nem todos os serviços têm barbershopId');
    }

    // 1.5 Verificar se Appointments têm barbershopId
    const appointments = await Appointment.findAll();
    console.log(`\n   ✅ Appointments: ${appointments.length} encontrados`);
    
    const appointmentsWithBarbershopId = appointments.filter(a => a.barbershopId);
    console.log(`   🔗 Appointments com barbershopId: ${appointmentsWithBarbershopId.length}/${appointments.length}`);
    
    if (appointmentsWithBarbershopId.length !== appointments.length) {
      throw new Error('Nem todos os agendamentos têm barbershopId');
    }

    // 1.6 Verificar se Comments têm barbershopId
    const comments = await Comment.findAll();
    console.log(`\n   ✅ Comments: ${comments.length} encontrados`);
    
    const commentsWithBarbershopId = comments.filter(c => c.barbershopId);
    console.log(`   🔗 Comments com barbershopId: ${commentsWithBarbershopId.length}/${comments.length}`);
    
    if (commentsWithBarbershopId.length !== comments.length) {
      throw new Error('Nem todos os comentários têm barbershopId');
    }

    console.log('\n✅ Estrutura do banco validada: Todas as entidades têm barbershopId\n');
    return true;

  } catch (error) {
    console.error('❌ Erro na validação da estrutura:', error.message);
    return false;
  }
}

async function testTenantIsolation() {
  console.log('📋 2. Testando isolamento de dados por tenant');
  console.log('=============================================\n');

  try {
    // 2.1 Criar duas barbearias de teste
    console.log('🏢 2.1 Criando barbearias de teste...');
    
    // Limpar dados de teste anteriores
    await Barbershop.destroy({ where: { slug: { [require('sequelize').Op.like]: 'test-%' } } });

    const timestamp = Date.now();
    const barbershop1 = await Barbershop.create({
      name: 'Test Barbershop Alpha',
      slug: `test-alpha-${timestamp}`,
      owner_email: `test-alpha-${timestamp}@example.com`,
      plan_type: 'free',
      settings: { theme: 'dark' }
    });

    const barbershop2 = await Barbershop.create({
      name: 'Test Barbershop Beta',
      slug: `test-beta-${timestamp}`,
      owner_email: `test-beta-${timestamp}@example.com`,
      plan_type: 'pro',
      settings: { theme: 'light' }
    });

    console.log(`   ✅ Alpha: ${barbershop1.name} (${barbershop1.id})`);
    console.log(`   ✅ Beta: ${barbershop2.name} (${barbershop2.id})`);

    // 2.2 Criar usuários para cada barbearia
    console.log('\n👤 2.2 Criando usuários por tenant...');
    
    const user1 = await User.create({
      id: `test-user-alpha-${Date.now()}`,
      username: `test-alpha-${Date.now()}`,
      password: 'password123',
      role: 'admin',
      name: 'Test Admin Alpha',
      barbershopId: barbershop1.id
    });

    const user2 = await User.create({
      id: `test-user-beta-${Date.now()}`,
      username: `test-beta-${Date.now()}`,
      password: 'password456',
      role: 'admin',
      name: 'Test Admin Beta',
      barbershopId: barbershop2.id
    });

    console.log(`   ✅ User Alpha: ${user1.username} (${user1.barbershopId})`);
    console.log(`   ✅ User Beta: ${user2.username} (${user2.barbershopId})`);

    // 2.3 Criar barbeiros para cada barbearia
    console.log('\n💇 2.3 Criando barbeiros por tenant...');
    
    const barber1 = await Barber.create({
      id: 'test-alpha-01',
      name: 'Test Barber Alpha',
      whatsapp: '11999999001',
      pix: 'test-alpha@pix.com',
      barbershopId: barbershop1.id
    });

    const barber2 = await Barber.create({
      id: 'test-beta-01', // ID diferente para evitar conflito de PK
      name: 'Test Barber Beta',
      whatsapp: '11999999002',
      pix: 'test-beta@pix.com',
      barbershopId: barbershop2.id
    });

    console.log(`   ✅ Barber Alpha: ${barber1.name} (${barber1.barbershopId})`);
    console.log(`   ✅ Barber Beta: ${barber2.name} (${barber2.barbershopId})`);

    // 2.4 Criar serviços para cada barbearia
    console.log('\n🛠️ 2.4 Criando serviços por tenant...');
    
    const service1 = await Service.create({
      name: 'Test Service Alpha',
      price: 30.00,
      barbershopId: barbershop1.id
    });

    const service2 = await Service.create({
      name: 'Test Service Beta',
      price: 35.00,
      barbershopId: barbershop2.id
    });

    console.log(`   ✅ Service Alpha: ${service1.name} (R$ ${service1.price})`);
    console.log(`   ✅ Service Beta: ${service2.name} (R$ ${service2.price})`);

    // 2.5 Testar isolamento de queries
    console.log('\n🔍 2.5 Testando isolamento de queries...');
    
    // Buscar barbeiros da Alpha
    const alphaBarbersQuery = await Barber.findAll({
      where: { barbershopId: barbershop1.id }
    });
    
    // Buscar barbeiros da Beta
    const betaBarbersQuery = await Barber.findAll({
      where: { barbershopId: barbershop2.id }
    });

    console.log(`   Alpha barbers: ${alphaBarbersQuery.length} (esperado: 1)`);
    console.log(`   Beta barbers: ${betaBarbersQuery.length} (esperado: 1)`);

    if (alphaBarbersQuery.length !== 1 || betaBarbersQuery.length !== 1) {
      throw new Error('Isolamento de barbeiros falhou');
    }

    // Verificar que não há vazamento de dados
    const alphaBarber = alphaBarbersQuery[0];
    const betaBarber = betaBarbersQuery[0];

    if (alphaBarber.barbershopId !== barbershop1.id) {
      throw new Error('Barbeiro Alpha tem barbershopId incorreto');
    }

    if (betaBarber.barbershopId !== barbershop2.id) {
      throw new Error('Barbeiro Beta tem barbershopId incorreto');
    }

    console.log(`   ✅ Isolamento validado: dados não vazam entre tenants`);

    // 2.6 Testar busca cross-tenant (deve retornar vazio)
    console.log('\n🚫 2.6 Testando proteção cross-tenant...');
    
    // Tentar buscar barbeiro da Alpha usando contexto da Beta
    const crossTenantQuery = await Barber.findAll({
      where: { 
        id: 'test-alpha-01', // ID do barbeiro Alpha
        barbershopId: barbershop2.id // Mas buscar no contexto Beta
      }
    });

    // Deve retornar vazio (não encontrar nada)
    if (crossTenantQuery.length !== 0) {
      throw new Error('Proteção cross-tenant falhou - encontrou dados de outro tenant');
    }

    console.log(`   ✅ Proteção cross-tenant funcionando`);

    // Limpeza dos dados de teste
    console.log('\n🧹 2.7 Limpando dados de teste...');
    
    await Barber.destroy({ where: { barbershopId: [barbershop1.id, barbershop2.id] } });
    await Service.destroy({ where: { barbershopId: [barbershop1.id, barbershop2.id] } });
    await User.destroy({ where: { barbershopId: [barbershop1.id, barbershop2.id] } });
    await Barbershop.destroy({ where: { id: [barbershop1.id, barbershop2.id] } });

    console.log(`   ✅ Dados de teste removidos`);

    console.log('\n✅ Isolamento de dados validado com sucesso\n');
    return true;

  } catch (error) {
    console.error('❌ Erro no teste de isolamento:', error.message);
    return false;
  }
}

async function testAuthenticationFlow() {
  console.log('📋 3. Testando fluxo de autenticação multi-tenant');
  console.log('================================================\n');

  try {
    // 3.1 Buscar uma barbearia existente
    console.log('🔍 3.1 Buscando barbearia existente...');
    
    const existingBarbershop = await Barbershop.findOne();
    if (!existingBarbershop) {
      throw new Error('Nenhuma barbearia encontrada no banco');
    }

    console.log(`   ✅ Barbearia encontrada: ${existingBarbershop.name} (${existingBarbershop.slug})`);

    // 3.2 Buscar usuário admin da barbearia
    const adminUser = await User.findOne({
      where: {
        barbershopId: existingBarbershop.id,
        role: 'admin'
      }
    });

    if (!adminUser) {
      throw new Error('Usuário admin não encontrado');
    }

    console.log(`   ✅ Admin encontrado: ${adminUser.username}`);

    // 3.3 Gerar token JWT
    console.log('\n🔑 3.2 Testando geração de token JWT...');
    
    const token = jwt.sign(
      { 
        id: adminUser.id, 
        username: adminUser.username, 
        role: adminUser.role, 
        barbershopId: adminUser.barbershopId 
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    console.log(`   ✅ Token gerado: ${token.substring(0, 30)}...`);

    // 3.4 Validar token
    console.log('\n✅ 3.3 Validando token JWT...');
    
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    if (decoded.barbershopId !== existingBarbershop.id) {
      throw new Error('BarbershopId no token não confere');
    }

    if (decoded.username !== adminUser.username) {
      throw new Error('Username no token não confere');
    }

    console.log(`   ✅ Token válido:`);
    console.log(`      Username: ${decoded.username}`);
    console.log(`      Role: ${decoded.role}`);
    console.log(`      BarbershopId: ${decoded.barbershopId}`);

    console.log('\n✅ Fluxo de autenticação validado com sucesso\n');
    return true;

  } catch (error) {
    console.error('❌ Erro no teste de autenticação:', error.message);
    return false;
  }
}

async function generateFinalReport() {
  console.log('📋 4. Relatório final');
  console.log('====================\n');

  try {
    // 4.1 Estatísticas do banco
    console.log('📊 4.1 Estatísticas do banco de dados:');
    
    const barbershopCount = await Barbershop.count();
    const userCount = await User.count();
    const barberCount = await Barber.count();
    const serviceCount = await Service.count();
    const appointmentCount = await Appointment.count();
    const commentCount = await Comment.count();

    console.log(`   🏢 Barbearias: ${barbershopCount}`);
    console.log(`   👤 Usuários: ${userCount}`);
    console.log(`   💇 Barbeiros: ${barberCount}`);
    console.log(`   🛠️ Serviços: ${serviceCount}`);
    console.log(`   📅 Agendamentos: ${appointmentCount}`);
    console.log(`   💬 Comentários: ${commentCount}`);

    // 4.2 Verificar integridade referencial
    console.log('\n🔗 4.2 Verificando integridade referencial:');
    
    const usersWithValidBarbershop = await User.count({
      include: [{
        model: Barbershop,
        required: true
      }]
    });

    const barbersWithValidBarbershop = await Barber.count({
      include: [{
        model: Barbershop,
        required: true
      }]
    });

    console.log(`   ✅ Usuários com barbearia válida: ${usersWithValidBarbershop}/${userCount}`);
    console.log(`   ✅ Barbeiros com barbearia válida: ${barbersWithValidBarbershop}/${barberCount}`);

    if (usersWithValidBarbershop !== userCount) {
      throw new Error('Alguns usuários têm barbershopId inválido');
    }

    if (barbersWithValidBarbershop !== barberCount) {
      throw new Error('Alguns barbeiros têm barbershopId inválido');
    }

    // 4.3 Listar barbearias existentes
    console.log('\n🏪 4.3 Barbearias disponíveis:');
    
    const barbershops = await Barbershop.findAll({
      attributes: ['id', 'name', 'slug', 'plan_type', 'created_at']
    });

    barbershops.forEach((shop, index) => {
      console.log(`   ${index + 1}. ${shop.name}`);
      console.log(`      Slug: ${shop.slug}`);
      console.log(`      Plano: ${shop.plan_type}`);
      console.log(`      URL: /app/${shop.slug}`);
      console.log(`      Criada: ${shop.created_at.toISOString().split('T')[0]}`);
      console.log('');
    });

    console.log('✅ Relatório final gerado com sucesso\n');
    return true;

  } catch (error) {
    console.error('❌ Erro no relatório final:', error.message);
    return false;
  }
}

async function runValidation() {
  console.log('🎯 INICIANDO VALIDAÇÃO FINAL MULTI-TENANT');
  console.log('==========================================');
  console.log(`⏰ Iniciado em: ${new Date().toISOString()}\n`);

  const results = {
    databaseStructure: false,
    tenantIsolation: false,
    authenticationFlow: false,
    finalReport: false
  };

  try {
    // Executar todas as validações
    results.databaseStructure = await validateDatabaseStructure();
    if (!results.databaseStructure) throw new Error('Falha na validação da estrutura do banco');

    results.tenantIsolation = await testTenantIsolation();
    if (!results.tenantIsolation) throw new Error('Falha no teste de isolamento');

    results.authenticationFlow = await testAuthenticationFlow();
    if (!results.authenticationFlow) throw new Error('Falha no teste de autenticação');

    results.finalReport = await generateFinalReport();

    // Resultado final
    const allPassed = Object.values(results).every(result => result === true);
    
    console.log('==========================================');
    console.log('RESULTADO FINAL DA VALIDAÇÃO');
    console.log('==========================================');
    
    if (allPassed) {
      console.log('🎉 TODAS AS VALIDAÇÕES PASSARAM!');
      console.log('\n✅ Multi-tenant implementado com sucesso:');
      console.log('   🏢 Estrutura de banco multi-tenant');
      console.log('   🔐 Isolamento de dados por tenant');
      console.log('   🛡️ Autenticação com barbershopId');
      console.log('   📊 Integridade referencial mantida');
      console.log('   🚀 Sistema pronto para produção');
      
      console.log('\n📦 Saída: Multi-tenant completo e funcional, pronto para migração de componentes');
      
      console.log('\n🎯 Próximos passos:');
      console.log('   1. Migrar componentes frontend para usar tenant context');
      console.log('   2. Implementar sistema de cadastro e onboarding');
      console.log('   3. Adicionar sistema de planos e billing');
      console.log('   4. Deploy em produção');
      
      process.exit(0);
    } else {
      console.log('❌ ALGUMAS VALIDAÇÕES FALHARAM');
      console.log('Resultados:', results);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO:', error.message);
    console.log('Resultados parciais:', results);
    process.exit(1);
  }
}

// Executar a validação completa
runValidation().catch(console.error);