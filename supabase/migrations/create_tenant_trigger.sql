-- ============================================
-- TRIGGER PARA CRIAR TENANT AUTOMATICAMENTE
-- ============================================

-- Função para criar tenant e associar à barbearia
CREATE OR REPLACE FUNCTION create_tenant_for_new_barbershop()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
BEGIN
    -- Se já tem tenant_id, não fazer nada
    IF NEW.tenant_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Criar novo tenant
    INSERT INTO "tenants" (name, slug, created_at, updated_at)
    VALUES (NEW.name, NEW.slug, NOW(), NOW())
    RETURNING id INTO new_tenant_id;

    -- Atualizar o tenant_id da barbearia
    NEW.tenant_id := new_tenant_id;

    RAISE NOTICE 'Tenant criado: % para barbearia %', new_tenant_id, NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger BEFORE INSERT para criar tenant
DROP TRIGGER IF EXISTS before_barbershop_insert_create_tenant ON "Barbershops";
CREATE TRIGGER before_barbershop_insert_create_tenant
BEFORE INSERT ON "Barbershops"
FOR EACH ROW
EXECUTE FUNCTION create_tenant_for_new_barbershop();

-- ============================================
-- CORRIGIR BARBEARIAS EXISTENTES SEM TENANT
-- ============================================

-- Criar tenants para barbearias que não têm
DO $$
DECLARE
    barbershop RECORD;
    new_tenant_id UUID;
BEGIN
    FOR barbershop IN 
        SELECT id, name, slug
        FROM "Barbershops"
        WHERE tenant_id IS NULL
    LOOP
        -- Criar tenant
        INSERT INTO "tenants" (name, slug, created_at, updated_at)
        VALUES (barbershop.name, barbershop.slug, NOW(), NOW())
        RETURNING id INTO new_tenant_id;

        -- Atualizar barbearia
        UPDATE "Barbershops"
        SET tenant_id = new_tenant_id
        WHERE id = barbershop.id;

        RAISE NOTICE 'Tenant % criado para barbearia % (%)', new_tenant_id, barbershop.name, barbershop.id;
    END LOOP;
END $$;

-- ============================================
-- ATUALIZAR BARBEIROS PARA USAR TENANT_ID
-- ============================================

-- Preencher tenant_id dos barbeiros baseado no barbershopId
UPDATE "Barbers" b
SET tenant_id = bs.tenant_id
FROM "Barbershops" bs
WHERE b."barbershopId" = bs.id
  AND b.tenant_id IS NULL
  AND bs.tenant_id IS NOT NULL;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar barbearias sem tenant
SELECT 
    COUNT(*) FILTER (WHERE tenant_id IS NULL) as sem_tenant,
    COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as com_tenant,
    COUNT(*) as total
FROM "Barbershops";

-- Verificar barbeiros sem tenant
SELECT 
    COUNT(*) FILTER (WHERE tenant_id IS NULL) as sem_tenant,
    COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as com_tenant,
    COUNT(*) as total
FROM "Barbers";
