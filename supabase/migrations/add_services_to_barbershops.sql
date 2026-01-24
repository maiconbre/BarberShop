-- ==============================================================
-- ADICIONAR SERVIÇOS ÀS BARBEARIAS DE TESTE
-- Execute este script para criar serviços em TODAS as barbearias
-- ==============================================================

-- SERVIÇOS PARA TODAS AS BARBEARIAS (de teste e reais)
DO $$
DECLARE
    barb_shop RECORD;
    service_id TEXT;
BEGIN
    -- Para cada barbearia no sistema
    FOR barb_shop IN SELECT id, name FROM "Barbershops" LOOP
        
        -- Verificar se já tem serviço de Corte
        SELECT id INTO service_id FROM "Services" WHERE "barbershopId" = barb_shop.id AND name = 'Corte de Cabelo' LIMIT 1;
        IF service_id IS NULL THEN
            INSERT INTO "Services" (id, "barbershopId", name, price, duration, is_active, created_at, updated_at)
            VALUES (
                gen_random_uuid()::text,
                barb_shop.id,
                'Corte de Cabelo',
                35.00,
                30,
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Criado serviço Corte de Cabelo para: %', barb_shop.name;
        END IF;
        
        -- Verificar se já tem serviço de Barba
        service_id := NULL;
        SELECT id INTO service_id FROM "Services" WHERE "barbershopId" = barb_shop.id AND name = 'Barba' LIMIT 1;
        IF service_id IS NULL THEN
            INSERT INTO "Services" (id, "barbershopId", name, price, duration, is_active, created_at, updated_at)
            VALUES (
                gen_random_uuid()::text,
                barb_shop.id,
                'Barba',
                25.00,
                20,
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Criado serviço Barba para: %', barb_shop.name;
        END IF;
        
        -- Verificar se já tem serviço de Corte + Barba
        service_id := NULL;
        SELECT id INTO service_id FROM "Services" WHERE "barbershopId" = barb_shop.id AND name = 'Corte + Barba' LIMIT 1;
        IF service_id IS NULL THEN
            INSERT INTO "Services" (id, "barbershopId", name, price, duration, is_active, created_at, updated_at)
            VALUES (
                gen_random_uuid()::text,
                barb_shop.id,
                'Corte + Barba',
                50.00,
                45,
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Criado serviço Corte + Barba para: %', barb_shop.name;
        END IF;
        
        -- Verificar se já tem serviço de Degradê
        service_id := NULL;
        SELECT id INTO service_id FROM "Services" WHERE "barbershopId" = barb_shop.id AND name = 'Degradê' LIMIT 1;
        IF service_id IS NULL THEN
            INSERT INTO "Services" (id, "barbershopId", name, price, duration, is_active, created_at, updated_at)
            VALUES (
                gen_random_uuid()::text,
                barb_shop.id,
                'Degradê',
                40.00,
                35,
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Criado serviço Degradê para: %', barb_shop.name;
        END IF;
        
        -- Verificar se já tem serviço de Sobrancelha
        service_id := NULL;
        SELECT id INTO service_id FROM "Services" WHERE "barbershopId" = barb_shop.id AND name = 'Design de Sobrancelha' LIMIT 1;
        IF service_id IS NULL THEN
            INSERT INTO "Services" (id, "barbershopId", name, price, duration, is_active, created_at, updated_at)
            VALUES (
                gen_random_uuid()::text,
                barb_shop.id,
                'Design de Sobrancelha',
                15.00,
                15,
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Criado serviço Sobrancelha para: %', barb_shop.name;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Serviços criados com sucesso para todas as barbearias!';
END $$;

-- ==============================================================
-- VERIFICAÇÃO
-- ==============================================================

SELECT 'Serviços por barbearia:' as info;
SELECT 
    b.name as barbearia, 
    COUNT(s.id) as total_servicos
FROM "Barbershops" b
LEFT JOIN "Services" s ON s."barbershopId" = b.id
GROUP BY b.name
ORDER BY b.name;

SELECT 'Total de serviços no sistema:' as info, COUNT(*) as total FROM "Services";
