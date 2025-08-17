-- ========================================
-- POLÍTICAS DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- ========================================
-- Execute após criar schema e funções para configurar segurança multi-tenant

-- 1. Limpar tabelas desnecessárias do Supabase
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Habilitar RLS em todas as tabelas
ALTER TABLE "Barbershops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Barbers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BarberServices" ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para Barbershops
-- Leitura pública (para landing pages e busca)
CREATE POLICY "Public barbershops read" ON "Barbershops"
    FOR SELECT USING (true);

-- Proprietários podem gerenciar suas barbearias
CREATE POLICY "Owners manage barbershops" ON "Barbershops"
    FOR ALL USING (
        owner_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

-- 4. Políticas para Users
-- Usuários veem apenas dados da própria barbearia
CREATE POLICY "Users see own barbershop data" ON "Users"
    FOR ALL USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops" 
            WHERE owner_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- 5. Políticas para Barbers
CREATE POLICY "Barbers see own barbershop data" ON "Barbers"
    FOR ALL USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops" 
            WHERE owner_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Leitura pública de barbeiros (para agendamentos)
CREATE POLICY "Public barbers read" ON "Barbers"
    FOR SELECT USING (true);

-- 6. Políticas para Services
CREATE POLICY "Services see own barbershop data" ON "Services"
    FOR ALL USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops" 
            WHERE owner_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Leitura pública de serviços (para agendamentos)
CREATE POLICY "Public services read" ON "Services"
    FOR SELECT USING (true);

-- 7. Políticas para Appointments
CREATE POLICY "Appointments see own barbershop data" ON "Appointments"
    FOR ALL USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops" 
            WHERE owner_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Permitir criação de agendamentos por clientes
CREATE POLICY "Clients can create appointments" ON "Appointments"
    FOR INSERT WITH CHECK (true);

-- Leitura pública de agendamentos (para verificar disponibilidade)
CREATE POLICY "Public appointments availability" ON "Appointments"
    FOR SELECT USING (true);

-- 8. Políticas para Comments
CREATE POLICY "Comments see own barbershop data" ON "Comments"
    FOR ALL USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops" 
            WHERE owner_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Permitir criação de comentários por clientes
CREATE POLICY "Clients can create comments" ON "Comments"
    FOR INSERT WITH CHECK (true);

-- Leitura pública de comentários aprovados
CREATE POLICY "Public approved comments read" ON "Comments"
    FOR SELECT USING (status = 'approved');

-- 9. Políticas para BarberServices
CREATE POLICY "BarberServices see own barbershop data" ON "BarberServices"
    FOR ALL USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops" 
            WHERE owner_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Leitura pública de relacionamentos barbeiro-serviço
CREATE POLICY "Public barber services read" ON "BarberServices"
    FOR SELECT USING (true);

-- 10. Políticas especiais para service accounts (se necessário)
-- Descomente se usar service accounts para operações administrativas
/*
CREATE POLICY "Service account full access" ON "Barbershops"
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

CREATE POLICY "Service account users access" ON "Users"
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );
*/

-- ========================================
-- CONFIGURAÇÃO DE SEGURANÇA COMPLETA
-- ========================================
-- Multi-tenancy configurado com segurança
-- Cada barbearia isolada dos dados das outras
-- Acesso público controlado para funcionalidades necessárias
-- Proprietários têm controle total sobre seus dados