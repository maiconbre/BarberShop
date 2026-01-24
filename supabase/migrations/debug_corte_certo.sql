-- Verificação específica para 'corte-certo'
SELECT 
    b.name as barbearia,
    b.id as barbershop_id_legacy,
    b.tenant_id as tenant_id_uuid,
    t.id as tenant_table_id
FROM "Barbershops" b
LEFT JOIN "tenants" t ON t.id = b.tenant_id
WHERE b.slug = 'corte-certo' OR b.slug = 'corte-certo-test'; -- caso tenha variação

-- Verificar serviços dessa barbearia
SELECT 
    s.name,
    s."barbershopId" as svc_barbershop_id,
    s.tenant_id as svc_tenant_id
FROM "Services" s
WHERE s."barbershopId" IN (SELECT id FROM "Barbershops" WHERE slug = 'corte-certo');
