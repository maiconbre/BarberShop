-- =====================================================
-- FIX: Tornar tenant_id NULLABLE na tabela service_barbers
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Remover a constraint de foreign key
ALTER TABLE "service_barbers" 
DROP CONSTRAINT IF EXISTS "service_barbers_tenant_id_fkey";

-- 2. Tornar a coluna tenant_id nullable
ALTER TABLE "service_barbers" 
ALTER COLUMN tenant_id DROP NOT NULL;

-- 3. Adicionar a foreign key novamente, mas agora nullable
ALTER TABLE "service_barbers"
ADD CONSTRAINT "service_barbers_tenant_id_fkey" 
FOREIGN KEY (tenant_id) 
REFERENCES "tenants"(id) 
ON DELETE CASCADE;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- INSTRUÇÕES:
-- 1. Copie todo este script
-- 2. Vá ao Supabase Dashboard > SQL Editor
-- 3. Cole o script e clique em "Run"
-- 4. Verifique se não há erros
