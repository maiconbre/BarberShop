-- Verificação para 'prestige-hair'
SELECT 
    b.name as barbearia,
    b.id as barbershop_id_legacy,
    b.tenant_id as tenant_id_uuid,
    t.id as tenant_table_id
FROM "Barbershops" b
LEFT JOIN "tenants" t ON t.id = b.tenant_id
WHERE b.slug = 'prestige-hair';

-- Verificar serviços dessa barbearia pelo tenant_id
SELECT 
    s.name,
    s."barbershopId" as svc_barbershop_id,
    s.tenant_id as svc_tenant_id,
    s.is_active
FROM "Services" s
WHERE s.tenant_id = (SELECT tenant_id FROM "Barbershops" WHERE slug = 'prestige-hair');

-- Verificar Policies RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM
    pg_policies
WHERE
    tablename = 'Services';
