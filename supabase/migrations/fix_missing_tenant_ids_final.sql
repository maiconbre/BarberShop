-- ==============================================================
-- CORREÇÃO FINAL DE TENANT_IDS (VERSÃO 3 - SINTAXE LIMPA)
-- ==============================================================

DO $$
DECLARE
    barb_shop RECORD;
    new_tenant_id UUID;
    rows_affected INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando varredura global por barbearias sem tenant_id...';

    -- Loop por TODAS as barbearias que estão sem tenant_id
    FOR barb_shop IN SELECT * FROM "Barbershops" WHERE tenant_id IS NULL LOOP
        
        RAISE NOTICE 'Corrigindo barbearia órfã: % (ID: %)', barb_shop.name, barb_shop.id;
        
        -- 1. Verificar/Criar Tenant
        SELECT id INTO new_tenant_id FROM "tenants" WHERE slug = barb_shop.slug;
        
        IF new_tenant_id IS NULL THEN
            new_tenant_id := gen_random_uuid();
            
            INSERT INTO "tenants" (id, name, slug, created_at, updated_at)
            VALUES (new_tenant_id, barb_shop.name, barb_shop.slug, NOW(), NOW());
            
            RAISE NOTICE '  -> Tenant criado: % (ID: %)', barb_shop.name, new_tenant_id;
        ELSE
            RAISE NOTICE '  -> Tenant existente recuperado: % (ID: %)', barb_shop.name, new_tenant_id;
        END IF;

        -- 2. Atualizar Barbearia
        UPDATE "Barbershops" 
        SET tenant_id = new_tenant_id 
        WHERE id = barb_shop.id;
        -- Não precisamos de notice aqui pois é obvio
        
        -- 3. Atualizar Serviços
        UPDATE "Services"
        SET tenant_id = new_tenant_id
        WHERE "barbershopId" = barb_shop.id AND tenant_id IS NULL;
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '  -> % serviços corrigidos.', rows_affected;

        -- 4. Atualizar Barbeiros
        UPDATE "Barbers"
        SET tenant_id = new_tenant_id
        WHERE "barbershopId" = barb_shop.id AND tenant_id IS NULL;
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '  -> % barbeiros corrigidos.', rows_affected;

        -- 5. Atualizar Agendamentos
        UPDATE "Appointments"
        SET tenant_id = new_tenant_id
        WHERE "barbershopId" = barb_shop.id AND tenant_id IS NULL;
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '  -> % agendamentos corrigidos.', rows_affected;

    END LOOP;
    
    RAISE NOTICE 'Varredura completa! O sistema deve estar 100%% consistente agora.';
END $$;

-- ==============================================================
-- VERIFICAÇÃO FINAL
-- ==============================================================

SELECT 'STATUS DO SISTEMA:' as check_name;
SELECT 'Barbearias sem tenant:' as item, COUNT(*) as qtd FROM "Barbershops" WHERE tenant_id IS NULL
UNION ALL
SELECT 'Serviços sem tenant:', COUNT(*) FROM "Services" WHERE tenant_id IS NULL
UNION ALL
SELECT 'Barbeiros sem tenant:', COUNT(*) FROM "Barbers" WHERE tenant_id IS NULL
UNION ALL
SELECT 'Agendamentos sem tenant:', COUNT(*) FROM "Appointments" WHERE tenant_id IS NULL;
