-- Verificar se o trigger está ativo
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'after_barbershop_insert_create_barber';

-- Verificar barbeiros existentes para teste2
SELECT 
    b.id,
    b.name,
    b.tenant_id,
    b."barbershopId",
    b.is_active
FROM "Barbers" b
WHERE b."barbershopId" = 'fe1ca958-2b85-4a83-b0bd-119724c30e54'
   OR b.tenant_id = 'fe1ca958-2b85-4a83-b0bd-119724c30e54'::uuid;

-- Verificar dados da barbearia teste2
SELECT 
    id,
    name,
    slug,
    tenant_id,
    owner_email,
    phone
FROM "Barbershops"
WHERE id = 'fe1ca958-2b85-4a83-b0bd-119724c30e54';

-- CRIAR BARBEIRO MANUALMENTE para teste2 (execute se não houver barbeiro)
INSERT INTO "Barbers" (
    "tenant_id",
    "barbershopId",
    "name",
    "email",
    "whatsapp",
    "is_active",
    "created_at",
    "updated_at"
)
SELECT 
    b.tenant_id,
    b.id,
    COALESCE(b.name, 'Barbeiro Principal'),
    b.owner_email,
    b.phone,
    true,
    NOW(),
    NOW()
FROM "Barbershops" b
WHERE b.id = 'fe1ca958-2b85-4a83-b0bd-119724c30e54'
  AND NOT EXISTS (
    SELECT 1 FROM "Barbers" br 
    WHERE br."barbershopId" = b.id OR br.tenant_id = b.tenant_id
  );

-- Verificar novamente
SELECT 
    b.id,
    b.name,
    b.tenant_id,
    b."barbershopId",
    b.is_active
FROM "Barbers" b
WHERE b."barbershopId" = 'fe1ca958-2b85-4a83-b0bd-119724c30e54'
   OR b.tenant_id = (SELECT tenant_id FROM "Barbershops" WHERE id = 'fe1ca958-2b85-4a83-b0bd-119724c30e54');
