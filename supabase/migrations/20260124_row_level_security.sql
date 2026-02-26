-- ==============================================================
-- ROW LEVEL SECURITY POLICIES - MULTI-TENANT
-- Garante isolamento de dados entre barbearias
-- ==============================================================

-- ==============================================================
-- 1. BARBERSHOPS - Barbearias
-- ==============================================================

-- Limpar políticas antigas (se existirem)
DROP POLICY IF EXISTS "barbershops_public_read" ON "Barbershops";
DROP POLICY IF EXISTS "barbershops_owner_all" ON "Barbershops";
DROP POLICY IF EXISTS "barbershops_authenticated_insert" ON "Barbershops";

-- Leitura pública (para landing pages)
CREATE POLICY "barbershops_public_read"
    ON "Barbershops"
    FOR SELECT
    USING (true);

-- Owner pode fazer tudo na sua barbearia
CREATE POLICY "barbershops_owner_all"
    ON "Barbershops"
    FOR ALL
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Usuários autenticados podem criar barbearias
CREATE POLICY "barbershops_authenticated_insert"
    ON "Barbershops"
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ==============================================================
-- 2. BARBERS - Barbeiros
-- ==============================================================

DROP POLICY IF EXISTS "barbers_public_read" ON "Barbers";
DROP POLICY IF EXISTS "barbers_own_barbershop" ON "Barbers";

-- Leitura pública
CREATE POLICY "barbers_public_read"
    ON "Barbers"
    FOR SELECT
    USING (true);

-- Owner e admins da barbearia podem gerenciar barbeiros
CREATE POLICY "barbers_own_barbershop"
    ON "Barbers"
    FOR ALL
    USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    );

-- ==============================================================
-- 3. SERVICES - Serviços
-- ==============================================================

DROP POLICY IF EXISTS "services_public_read" ON "Services";
DROP POLICY IF EXISTS "services_own_barbershop" ON "Services";

-- Leitura pública
CREATE POLICY "services_public_read"
    ON "Services"
    FOR SELECT
    USING (true);

-- Owner pode gerenciar serviços da sua barbearia
CREATE POLICY "services_own_barbershop"
    ON "Services"
    FOR ALL
    USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    );

-- ==============================================================
-- 4. APPOINTMENTS - Agendamentos
-- ==============================================================

DROP POLICY IF EXISTS "appointments_public_insert" ON "Appointments";
DROP POLICY IF EXISTS "appointments_own_barbershop_read" ON "Appointments";
DROP POLICY IF EXISTS "appointments_own_barbershop_update" ON "Appointments";
DROP POLICY IF EXISTS "appointments_barber_own_read" ON "Appointments";

-- Qualquer pessoa pode criar agendamento (clientes públicos)
CREATE POLICY "appointments_public_insert"
    ON "Appointments"
    FOR INSERT
    WITH CHECK (true);

-- Owner pode ver todos agendamentos da sua barbearia
CREATE POLICY "appointments_own_barbershop_read"
    ON "Appointments"
    FOR SELECT
    USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    );

-- Owner pode atualizar agendamentos da sua barbearia
CREATE POLICY "appointments_own_barbershop_update"
    ON "Appointments"
    FOR UPDATE
    USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    );

-- Barbeiros podem ver APENAS seus próprios agendamentos
CREATE POLICY "appointments_barber_own_read"
    ON "Appointments"
    FOR SELECT
    USING (
        "barberId" IN (
            SELECT id FROM "Barbers"
            WHERE "userId" = auth.uid()
        )
    );

-- ==============================================================
-- 5. COMMENTS - Comentários
-- ==============================================================

DROP POLICY IF EXISTS "comments_public_read_approved" ON "Comments";
DROP POLICY IF EXISTS "comments_public_insert" ON "Comments";
DROP POLICY IF EXISTS "comments_own_barbershop_all" ON "Comments";

-- Qualquer pessoa pode ler comentários aprovados
CREATE POLICY "comments_public_read_approved"
    ON "Comments"
    FOR SELECT
    USING (status = 'approved');

-- Qualquer pessoa pode criar comentários
CREATE POLICY "comments_public_insert"
    ON "Comments"
    FOR INSERT
    WITH CHECK (true);

-- Owner pode gerenciar todos comentários da sua barbearia
CREATE POLICY "comments_own_barbershop_all"
    ON "Comments"
    FOR ALL
    USING (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        "barbershopId" IN (
            SELECT id FROM "Barbershops"
            WHERE owner_id = auth.uid()
        )
    );

-- ==============================================================
-- 6. PROFILES - Perfis
-- ==============================================================

DROP POLICY IF EXISTS "profiles_own_read" ON "profiles";
DROP POLICY IF EXISTS "profiles_own_update" ON "profiles";
DROP POLICY IF EXISTS "profiles_own_insert" ON "profiles";

-- Usuário pode ver próprio perfil
CREATE POLICY "profiles_own_read"
    ON "profiles"
    FOR SELECT
    USING (auth.uid() = id);

-- Usuário pode atualizar próprio perfil
CREATE POLICY "profiles_own_update"
    ON "profiles"
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Usuário  pode inserir próprio perfil (usado pelo trigger)
CREATE POLICY "profiles_own_insert"
    ON "profiles"
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ==============================================================
-- RESUMO DAS POLÍTICAS
-- ==============================================================
-- 1. Barbershops: Leitura pública, owner gerencia a própria
-- 2. Barbers: Leitura pública, owner gerencia da própria barbearia
-- 3. Services: Leitura pública, owner gerencia da própria barbearia
-- 4. Appointments: 
--    - Qualquer um pode criar (clientes)
--    - Owner vê todos da sua barbearia
--    - Barbeiros vêem APENAS os próprios
-- 5. Comments: Público lê aprovados, owner gerencia da própria barbearia
-- 6. Profiles: Cada usuário gerencia apenas o próprio perfil
