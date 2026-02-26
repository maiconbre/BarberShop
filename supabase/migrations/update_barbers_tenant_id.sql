-- Atualizar barbeiros existentes para preencher tenant_id baseado no barbershopId
UPDATE "Barbers" b
SET tenant_id = bs.tenant_id
FROM "Barbershops" bs
WHERE b."barbershopId" = bs.id
  AND b.tenant_id IS NULL
  AND bs.tenant_id IS NOT NULL;

-- Verificar resultado
SELECT 
    COUNT(*) FILTER (WHERE tenant_id IS NULL) as sem_tenant_id,
    COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as com_tenant_id,
    COUNT(*) as total
FROM "Barbers";
