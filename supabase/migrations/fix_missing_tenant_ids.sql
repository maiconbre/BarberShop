-- ==============================================================
-- CORREÇÃO DE TENANT_IDS FALTANTES
-- ==============================================================

DO $$
DECLARE
    barb_shop RECORD;
    new_tenant_id UUID;
    rows_affected INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando correção de tenant_ids...';

    -- Loop por todas as barbearias de teste que não têm tenant_id
    FOR barb_shop IN SELECT * FROM "Barbershops" WHERE id LIKE 'test-%' LOOP
        
        RAISE NOTICE 'Processando barbearia: % (ID: %)', barb_shop.name, barb_shop.id;
        
        -- 1. Verificar/Criar Tenant
        -- Verifica se já existe um tenant com o slug da barbearia
        SELECT id INTO new_tenant_id FROM "tenants" WHERE slug = barb_shop.slug;
        
        IF new_tenant_id IS NULL THEN
            -- Criar novo tenant se não existir
            new_tenant_id := gen_random_uuid();
            
            INSERT INTO "tenants" (id, name, slug, created_at, updated_at)
            VALUES (new_tenant_id, barb_shop.name, barb_shop.slug, NOW(), NOW());
            
            RAISE NOTICE '  -> Criado novo tenant: % (ID: %)', barb_shop.name, new_tenant_id;
        ELSE
            RAISE NOTICE '  -> Tenant já existente encontrado: % (ID: %)', barb_shop.name, new_tenant_id;
        END IF;

        -- 2. Atualizar Barbearia com tenant_id
        UPDATE "Barbershops" 
        SET tenant_id = new_tenant_id 
        WHERE id = barb_shop.id AND (tenant_id IS NULL OR tenant_id != new_tenant_id);
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        IF rows_affected > 0 THEN
             RAISE NOTICE '  -> Barbearia atualizada com tenant_id.';
        END IF;

        -- 3. Atualizar Serviços
        UPDATE "Services"
        SET tenant_id = new_tenant_id
        WHERE "barbershopId" = barb_shop.id AND (tenant_id IS NULL OR tenant_id != new_tenant_id);
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '  -> % serviços atualizados.', rows_affected;

        -- 4. Atualizar Barbeiros
        UPDATE "Barbers"
        SET tenant_id = new_tenant_id
        WHERE "barbershopId" = barb_shop.id AND (tenant_id IS NULL OR tenant_id != new_tenant_id);
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '  -> % barbeiros atualizados.', rows_affected;

        -- 5. Atualizar Agendamentos
        UPDATE "Appointments"
        SET tenant_id = new_tenant_id
        WHERE "barbershopId" = barb_shop.id AND (tenant_id IS NULL OR tenant_id != new_tenant_id);
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE '  -> % agendamentos atualizados.', rows_affected;

    END LOOP;
    
    RAISE NOTICE 'Correção concluída com sucesso!';
END $$;

-- ==============================================================
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- ==============================================================

SELECT 'Serviços sem tenant_id:' as info, COUNT(*) as total FROM "Services" WHERE tenant_id IS NULL;
SELECT 'Barbearias sem tenant_id:' as info, COUNT(*) as total FROM "Barbershops" WHERE tenant_id IS NULL;
