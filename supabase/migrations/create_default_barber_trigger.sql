-- ==============================================================
-- CRIAR BARBEIRO PADRÃO AUTOMATICAMENTE
-- ==============================================================
-- Este script cria um trigger que automaticamente cria um barbeiro
-- padrão quando uma barbearia é criada, e também corrige barbearias
-- existentes que não têm barbeiros.

-- 1. Função para criar barbeiro padrão
CREATE OR REPLACE FUNCTION create_default_barber_for_barbershop()
RETURNS TRIGGER AS $$
DECLARE
    barber_count INTEGER;
    owner_name VARCHAR(255);
BEGIN
    -- Verificar se já existem barbeiros para esta barbearia
    SELECT COUNT(*) INTO barber_count
    FROM "Barbers"
    WHERE "barbershopId" = NEW.id OR "tenant_id" = NEW.tenant_id;
    
    -- Se não houver barbeiros, criar um padrão
    IF barber_count = 0 THEN
        -- Tentar obter o nome do owner
        owner_name := COALESCE(NEW.name, 'Barbeiro Principal');
        
        INSERT INTO "Barbers" (
            "tenant_id",
            "barbershopId",
            "name",
            "email",
            "whatsapp",
            "is_active",
            "created_at",
            "updated_at"
        ) VALUES (
            NEW.tenant_id,
            NEW.id,
            owner_name,
            NEW.owner_email,
            NEW.phone,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Barbeiro padrão criado para barbearia %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger (drop se já existir)
DROP TRIGGER IF EXISTS after_barbershop_insert_create_barber ON "Barbershops";

CREATE TRIGGER after_barbershop_insert_create_barber
AFTER INSERT ON "Barbershops"
FOR EACH ROW
EXECUTE FUNCTION create_default_barber_for_barbershop();

-- 3. Função para corrigir barbearias existentes sem barbeiros
CREATE OR REPLACE FUNCTION fix_barbershops_without_barbers()
RETURNS TABLE(barbershop_id VARCHAR, barbershop_name VARCHAR, barber_created BOOLEAN) AS $$
DECLARE
    barbershop RECORD;
    new_barber_id VARCHAR;
BEGIN
    FOR barbershop IN 
        SELECT b.id, b.tenant_id, b.name, b.owner_email, b.phone
        FROM "Barbershops" b
        WHERE NOT EXISTS (
            SELECT 1 FROM "Barbers" br 
            WHERE br."barbershopId" = b.id OR br."tenant_id" = b.tenant_id
        )
    LOOP
        INSERT INTO "Barbers" (
            "tenant_id",
            "barbershopId",
            "name",
            "email",
            "whatsapp",
            "is_active",
            "created_at",
            "updated_at"
        ) VALUES (
            barbershop.tenant_id,
            barbershop.id,
            COALESCE(barbershop.name, 'Barbeiro Principal'),
            barbershop.owner_email,
            barbershop.phone,
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO new_barber_id;
        
        barbershop_id := barbershop.id;
        barbershop_name := barbershop.name;
        barber_created := true;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Executar correção para barbearias existentes
SELECT * FROM fix_barbershops_without_barbers();

-- 5. Verificar resultado
SELECT 
    b.id as barbershop_id,
    b.name as barbershop_name,
    b.slug,
    COUNT(br.id) as barber_count
FROM "Barbershops" b
LEFT JOIN "Barbers" br ON br."barbershopId" = b.id OR br."tenant_id" = b.tenant_id
GROUP BY b.id, b.name, b.slug
ORDER BY b.created_at DESC;
