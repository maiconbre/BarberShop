/**
 * Script para testar o fluxo completo multi-tenant
 * Implementa o teste 8.9 do plano de tarefas
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:6543/api';

console.log('🎯 Teste Final de Fluxo Multi-Tenant');
console.log('=====================================\n');

// Dados para as duas barbearias de teste
const barbershop1Data = {
    name: 'Barbearia Alpha Test',
    slug: 'barbearia-alpha-test',
    ownerEmail: 'admin@alpha-test.com',
    ownerName: 'Admin Alpha Test',
    ownerUsername: 'admin-alpha-test',
    ownerPassword: 'password123',
    planType: 'free'
};

const barbershop2Data = {
    name: 'Barbearia Beta Test',
    slug: 'barbearia-beta-test',
    ownerEmail: 'admin@beta-test.com',
    ownerName: 'Admin Beta Test',
    ownerUsername: 'admin-beta-test',
    ownerPassword: 'password456',
    planType: 'free'
};

let barbershop1, barbershop2;
let token1, token2;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCreateBarbershops() {
    console.log('📋 1. Criar 2 barbearias');
    console.log('========================\n');

    try {
        // 1.1 Verificar disponibilidade dos slugs
        console.log('🔍 1.1 Verificando disponibilidade dos slugs...');

        const slugCheck1 = await axios.get(`${BASE_URL}/barbershops/check-slug/${barbershop1Data.slug}`);
        const slugCheck2 = await axios.get(`${BASE_URL}/barbershops/check-slug/${barbershop2Data.slug}`);

        console.log(`   Slug "${barbershop1Data.slug}": ${slugCheck1.data.available ? '✅ Disponível' : '❌ Indisponível'}`);
        console.log(`   Slug "${barbershop2Data.slug}": ${slugCheck2.data.available ? '✅ Disponível' : '❌ Indisponível'}`);

        // 1.2 Registrar primeira barbearia
        console.log('\n🏢 1.2 Registrando primeira barbearia (Alpha)...');

        const response1 = await axios.post(`${BASE_URL}/barbershops/register`, barbershop1Data);

        if (response1.status === 201 && response1.data.success) {
            barbershop1 = response1.data.data.barbershop;
            token1 = response1.data.data.token;
            console.log(`   ✅ Barbearia Alpha criada: ${barbershop1.name} (${barbershop1.slug})`);
            console.log(`   📝 ID: ${barbershop1.id}`);
            console.log(`   🔑 Token gerado: ${token1.substring(0, 20)}...`);
        } else {
            throw new Error('Falha ao criar primeira barbearia');
        }

        await sleep(1000); // Pequena pausa entre criações

        // 1.3 Registrar segunda barbearia
        console.log('\n🏢 1.3 Registrando segunda barbearia (Beta)...');

        const response2 = await axios.post(`${BASE_URL}/barbershops/register`, barbershop2Data);

        if (response2.status === 201 && response2.data.success) {
            barbershop2 = response2.data.data.barbershop;
            token2 = response2.data.data.token;
            console.log(`   ✅ Barbearia Beta criada: ${barbershop2.name} (${barbershop2.slug})`);
            console.log(`   📝 ID: ${barbershop2.id}`);
            console.log(`   🔑 Token gerado: ${token2.substring(0, 20)}...`);
        } else {
            throw new Error('Falha ao criar segunda barbearia');
        }

        // 1.4 Validar slugs únicos
        console.log('\n🔒 1.4 Validando slugs únicos...');

        if (barbershop1.slug !== barbershop2.slug && barbershop1.id !== barbershop2.id) {
            console.log('   ✅ Slugs são únicos');
            console.log(`   Alpha: ${barbershop1.slug} (${barbershop1.id})`);
            console.log(`   Beta: ${barbershop2.slug} (${barbershop2.id})`);
        } else {
            throw new Error('Slugs não são únicos!');
        }

        // 1.5 Tentar criar barbearia com slug duplicado
        console.log('\n🚫 1.5 Testando proteção contra slug duplicado...');

        try {
            const duplicateData = {
                ...barbershop1Data,
                name: 'Barbearia Duplicada',
                ownerEmail: 'duplicate@test.com',
                ownerUsername: 'admin-duplicate'
            };

            await axios.post(`${BASE_URL}/barbershops/register`, duplicateData);
            throw new Error('Deveria ter falhado com slug duplicado');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('   ✅ Proteção contra slug duplicado funcionando');
            } else {
                throw error;
            }
        }

        console.log('\n✅ Fase 1 concluída: 2 barbearias criadas com sucesso\n');
        return true;

    } catch (error) {
        console.error('❌ Erro na criação de barbearias:', error.message);
        if (error.response) {
            console.error('   Resposta:', error.response.data);
        }
        return false;
    }
}

async function testLogin() {
    console.log('📋 2. Logar em cada barbearia');
    console.log('=============================\n');

    try {
        // 2.1 Login na primeira barbearia
        console.log('🔐 2.1 Login na primeira barbearia (Alpha)...');

        const loginData1 = {
            username: barbershop1Data.ownerUsername,
            password: barbershop1Data.ownerPassword
        };

        const loginResponse1 = await axios.post(`${BASE_URL}/auth/login`, loginData1);

        if (loginResponse1.status === 200 && loginResponse1.data.success) {
            token1 = loginResponse1.data.token; // Atualizar token
            console.log(`   ✅ Login realizado: ${loginResponse1.data.user.username}`);
            console.log(`   🏢 BarbershopId: ${loginResponse1.data.user.barbershopId}`);
            console.log(`   👤 Role: ${loginResponse1.data.user.role}`);

            // Verificar se barbershopId corresponde
            if (loginResponse1.data.user.barbershopId === barbershop1.id) {
                console.log('   ✅ BarbershopId correto no token');
            } else {
                throw new Error('BarbershopId incorreto no token');
            }
        } else {
            throw new Error('Falha no login da primeira barbearia');
        }

        await sleep(500);

        // 2.2 Login na segunda barbearia
        console.log('\n🔐 2.2 Login na segunda barbearia (Beta)...');

        const loginData2 = {
            username: barbershop2Data.ownerUsername,
            password: barbershop2Data.ownerPassword
        };

        const loginResponse2 = await axios.post(`${BASE_URL}/auth/login`, loginData2);

        if (loginResponse2.status === 200 && loginResponse2.data.success) {
            token2 = loginResponse2.data.token; // Atualizar token
            console.log(`   ✅ Login realizado: ${loginResponse2.data.user.username}`);
            console.log(`   🏢 BarbershopId: ${loginResponse2.data.user.barbershopId}`);
            console.log(`   👤 Role: ${loginResponse2.data.user.role}`);

            // Verificar se barbershopId corresponde
            if (loginResponse2.data.user.barbershopId === barbershop2.id) {
                console.log('   ✅ BarbershopId correto no token');
            } else {
                throw new Error('BarbershopId incorreto no token');
            }
        } else {
            throw new Error('Falha no login da segunda barbearia');
        }

        console.log('\n✅ Fase 2 concluída: Login realizado em ambas as barbearias\n');
        return true;

    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        if (error.response) {
            console.error('   Resposta:', error.response.data);
        }
        return false;
    }
}

async function testTenantIsolation() {
    console.log('📋 3. Validar isolamento no dashboard');
    console.log('====================================\n');

    try {
        // 3.1 Obter dados da barbearia atual - Alpha
        console.log('🏢 3.1 Obtendo dados da Barbearia Alpha...');

        const alphaDataResponse = await axios.get(
            `${BASE_URL}/app/${barbershop1.slug}/barbershops/current`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );

        if (alphaDataResponse.status === 200 && alphaDataResponse.data.success) {
            const alphaData = alphaDataResponse.data.data;
            console.log(`   ✅ Dados obtidos: ${alphaData.name} (${alphaData.slug})`);
            console.log(`   📝 ID: ${alphaData.id}`);
            console.log(`   📊 Plano: ${alphaData.planType}`);

            if (alphaData.id === barbershop1.id) {
                console.log('   ✅ ID da barbearia correto');
            } else {
                throw new Error('ID da barbearia incorreto');
            }
        } else {
            throw new Error('Falha ao obter dados da Barbearia Alpha');
        }

        await sleep(500);

        // 3.2 Obter dados da barbearia atual - Beta
        console.log('\n🏢 3.2 Obtendo dados da Barbearia Beta...');

        const betaDataResponse = await axios.get(
            `${BASE_URL}/app/${barbershop2.slug}/barbershops/current`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );

        if (betaDataResponse.status === 200 && betaDataResponse.data.success) {
            const betaData = betaDataResponse.data.data;
            console.log(`   ✅ Dados obtidos: ${betaData.name} (${betaData.slug})`);
            console.log(`   📝 ID: ${betaData.id}`);
            console.log(`   📊 Plano: ${betaData.planType}`);

            if (betaData.id === barbershop2.id) {
                console.log('   ✅ ID da barbearia correto');
            } else {
                throw new Error('ID da barbearia incorreto');
            }
        } else {
            throw new Error('Falha ao obter dados da Barbearia Beta');
        }

        // 3.3 Testar acesso cross-tenant (deve falhar)
        console.log('\n🚫 3.3 Testando bloqueio de acesso cross-tenant...');

        try {
            // Usuário da Alpha tentando acessar dados da Beta
            await axios.get(
                `${BASE_URL}/app/${barbershop2.slug}/barbershops/current`,
                { headers: { Authorization: `Bearer ${token1}` } } // Token da Alpha
            );
            throw new Error('Deveria ter bloqueado acesso cross-tenant');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('   ✅ Acesso cross-tenant bloqueado corretamente');
                console.log(`   📝 Código: ${error.response.data.code}`);
            } else {
                throw error;
            }
        }

        // 3.4 Listar barbeiros por tenant
        console.log('\n👨‍💼 3.4 Testando listagem de barbeiros por tenant...');

        const alphaBarbersResponse = await axios.get(
            `${BASE_URL}/app/${barbershop1.slug}/barbers`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );

        const betaBarbersResponse = await axios.get(
            `${BASE_URL}/app/${barbershop2.slug}/barbers`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );

        console.log(`   Alpha: ${alphaBarbersResponse.data.length} barbeiros`);
        console.log(`   Beta: ${betaBarbersResponse.data.length} barbeiros`);

        // Verificar que todos os barbeiros têm o barbershopId correto
        const alphaBarbers = alphaBarbersResponse.data;
        const betaBarbers = betaBarbersResponse.data;

        const alphaCorrect = alphaBarbers.every(b => b.barbershopId === barbershop1.id);
        const betaCorrect = betaBarbers.every(b => b.barbershopId === barbershop2.id);

        if (alphaCorrect && betaCorrect) {
            console.log('   ✅ Isolamento de barbeiros funcionando');
        } else {
            throw new Error('Isolamento de barbeiros falhou');
        }

        // 3.5 Listar serviços por tenant
        console.log('\n🛠️ 3.5 Testando listagem de serviços por tenant...');

        const alphaServicesResponse = await axios.get(
            `${BASE_URL}/app/${barbershop1.slug}/services`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );

        const betaServicesResponse = await axios.get(
            `${BASE_URL}/app/${barbershop2.slug}/services`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );

        console.log(`   Alpha: ${alphaServicesResponse.data.length} serviços`);
        console.log(`   Beta: ${betaServicesResponse.data.length} serviços`);

        // Verificar que todos os serviços têm o barbershopId correto
        const alphaServices = alphaServicesResponse.data;
        const betaServices = betaServicesResponse.data;

        const alphaServicesCorrect = alphaServices.every(s => s.barbershopId === barbershop1.id);
        const betaServicesCorrect = betaServices.every(s => s.barbershopId === barbershop2.id);

        if (alphaServicesCorrect && betaServicesCorrect) {
            console.log('   ✅ Isolamento de serviços funcionando');
        } else {
            throw new Error('Isolamento de serviços falhou');
        }

        // 3.6 Listar agendamentos por tenant
        console.log('\n📅 3.6 Testando listagem de agendamentos por tenant...');

        const alphaAppointmentsResponse = await axios.get(
            `${BASE_URL}/app/${barbershop1.slug}/appointments`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );

        const betaAppointmentsResponse = await axios.get(
            `${BASE_URL}/app/${barbershop2.slug}/appointments`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );

        console.log(`   Alpha: ${alphaAppointmentsResponse.data.length} agendamentos`);
        console.log(`   Beta: ${betaAppointmentsResponse.data.length} agendamentos`);

        // Verificar que todos os agendamentos têm o barbershopId correto
        const alphaAppointments = alphaAppointmentsResponse.data;
        const betaAppointments = betaAppointmentsResponse.data;

        const alphaAppointmentsCorrect = alphaAppointments.every(a => a.barbershopId === barbershop1.id);
        const betaAppointmentsCorrect = betaAppointments.every(a => a.barbershopId === barbershop2.id);

        if (alphaAppointmentsCorrect && betaAppointmentsCorrect) {
            console.log('   ✅ Isolamento de agendamentos funcionando');
        } else {
            throw new Error('Isolamento de agendamentos falhou');
        }

        console.log('\n✅ Fase 3 concluída: Isolamento multi-tenant funcionando corretamente\n');
        return true;

    } catch (error) {
        console.error('❌ Erro no teste de isolamento:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Resposta:', error.response.data);
        }
        return false;
    }
}

async function testSecurityScenarios() {
    console.log('📋 4. Testes de segurança adicional');
    console.log('===================================\n');

    try {
        // 4.1 Tentar acessar endpoint sem tenant context
        console.log('🔒 4.1 Testando acesso sem tenant context...');

        try {
            await axios.get(
                `${BASE_URL}/barbershops/current`, // Sem /app/:slug
                { headers: { Authorization: `Bearer ${token1}` } }
            );
            throw new Error('Deveria ter falhado sem tenant context');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('   ✅ Acesso sem tenant context bloqueado');
                console.log(`   📝 Código: ${error.response.data.code}`);
            } else {
                throw error;
            }
        }

        // 4.2 Tentar acessar com slug inexistente
        console.log('\n🔍 4.2 Testando acesso com slug inexistente...');

        try {
            await axios.get(
                `${BASE_URL}/app/barbearia-inexistente/barbershops/current`,
                { headers: { Authorization: `Bearer ${token1}` } }
            );
            throw new Error('Deveria ter falhado com slug inexistente');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('   ✅ Acesso com slug inexistente bloqueado');
                console.log(`   📝 Código: ${error.response.data.code}`);
            } else {
                throw error;
            }
        }

        // 4.3 Validar middleware em rotas protegidas
        console.log('\n🛡️ 4.3 Validando middleware em rotas protegidas...');

        const protectedRoutes = [
            `/app/${barbershop1.slug}/barbers`,
            `/app/${barbershop1.slug}/services`,
            `/app/${barbershop1.slug}/appointments`,
            `/app/${barbershop1.slug}/barbershops/current`
        ];

        for (const route of protectedRoutes) {
            const response = await axios.get(
                `${BASE_URL}${route}`,
                { headers: { Authorization: `Bearer ${token1}` } }
            );

            if (response.status === 200) {
                console.log(`   ✅ ${route.split('/').pop()}: OK`);
            } else {
                throw new Error(`Falha na rota ${route}`);
            }
        }

        console.log('\n✅ Fase 4 concluída: Testes de segurança passaram\n');
        return true;

    } catch (error) {
        console.error('❌ Erro nos testes de segurança:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Resposta:', error.response.data);
        }
        return false;
    }
}

async function generateSummary() {
    console.log('📋 5. Resumo do teste');
    console.log('====================\n');

    try {
        // Obter estatísticas finais
        console.log('📊 Estatísticas finais:');

        // Listar todas as barbearias (endpoint de desenvolvimento)
        const allBarbershopsResponse = await axios.get(`${BASE_URL}/barbershops/list`);
        const allBarbershops = allBarbershopsResponse.data.data;

        console.log(`   🏢 Total de barbearias: ${allBarbershops.length}`);

        // Encontrar nossas barbearias de teste
        const alphaShop = allBarbershops.find(b => b.slug === barbershop1.slug);
        const betaShop = allBarbershops.find(b => b.slug === barbershop2.slug);

        if (alphaShop && betaShop) {
            console.log(`   ✅ Alpha: ${alphaShop.name} (${alphaShop.slug})`);
            console.log(`   ✅ Beta: ${betaShop.name} (${betaShop.slug})`);
        }

        // Obter contadores de dados por tenant
        const alphaBarbers = await axios.get(
            `${BASE_URL}/app/${barbershop1.slug}/barbers`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );

        const betaBarbers = await axios.get(
            `${BASE_URL}/app/${barbershop2.slug}/barbers`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );

        const alphaServices = await axios.get(
            `${BASE_URL}/app/${barbershop1.slug}/services`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );

        const betaServices = await axios.get(
            `${BASE_URL}/app/${barbershop2.slug}/services`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );

        console.log(`\n📈 Dados por tenant:`);
        console.log(`   Alpha: ${alphaBarbers.data.length} barbeiros, ${alphaServices.data.length} serviços`);
        console.log(`   Beta: ${betaBarbers.data.length} barbeiros, ${betaServices.data.length} serviços`);

        console.log('\n🎉 TESTE COMPLETO: Multi-tenant funcional e pronto para migração de componentes');
        console.log('\n✅ Funcionalidades validadas:');
        console.log('   🏢 Cadastro de múltiplas barbearias');
        console.log('   🔐 Autenticação isolada por tenant');
        console.log('   🛡️ Isolamento completo de dados');
        console.log('   🚫 Bloqueio de acesso cross-tenant');
        console.log('   🔍 Middleware de tenant funcionando');
        console.log('   📊 Dados não vazam entre tenants');

        console.log('\n🚀 Sistema pronto para:');
        console.log('   1. Migração de componentes frontend');
        console.log('   2. Implementação de planos e billing');
        console.log('   3. Deploy em produção');

        return true;

    } catch (error) {
        console.error('❌ Erro no resumo:', error.message);
        return false;
    }
}

async function runCompleteTest() {
    console.log('🎯 INICIANDO TESTE FINAL DE FLUXO MULTI-TENANT');
    console.log('='.repeat(50));
    console.log(`📡 URL Base: ${BASE_URL}`);
    console.log(`⏰ Iniciado em: ${new Date().toISOString()}\n`);

    const results = {
        createBarbershops: false,
        login: false,
        tenantIsolation: false,
        securityScenarios: false,
        summary: false
    };

    try {
        // Executar todas as fases do teste
        results.createBarbershops = await testCreateBarbershops();
        if (!results.createBarbershops) throw new Error('Falha na criação de barbearias');

        results.login = await testLogin();
        if (!results.login) throw new Error('Falha no login');

        results.tenantIsolation = await testTenantIsolation();
        if (!results.tenantIsolation) throw new Error('Falha no isolamento de tenant');

        results.securityScenarios = await testSecurityScenarios();
        if (!results.securityScenarios) throw new Error('Falha nos testes de segurança');

        results.summary = await generateSummary();

        // Resultado final
        const allPassed = Object.values(results).every(result => result === true);

        console.log('\n' + '='.repeat(50));
        console.log('RESULTADO FINAL');
        console.log('='.repeat(50));

        if (allPassed) {
            console.log('🎉 TODOS OS TESTES PASSARAM!');
            console.log('\n📦 Saída: Multi-tenant completo e funcional, pronto para migração de componentes');
            process.exit(0);
        } else {
            console.log('❌ ALGUNS TESTES FALHARAM');
            console.log('Resultados:', results);
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
        console.log('Resultados parciais:', results);
        process.exit(1);
    }
}

// Executar o teste completo
runCompleteTest().catch(console.error);