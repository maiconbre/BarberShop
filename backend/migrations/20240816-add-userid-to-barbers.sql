-- ========================================
-- MIGRAÇÃO: Adicionar coluna userId à tabela Barbers
-- ========================================
-- Data: 2025-08-16
-- Objetivo: Adicionar a coluna userId para estabelecer relação entre Barber e User
-- ========================================

-- 1. Adicionar coluna userId à tabela Barbers
ALTER TABLE "Barbers" 
ADD COLUMN IF NOT EXISTS "userId" UUID;

-- 2. Adicionar constraint de foreign key
ALTER TABLE "Barbers" 
ADD CONSTRAINT fk_barbers_user_id 
FOREIGN KEY ("userId") REFERENCES "Users"("id") 
ON DELETE CASCADE;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS "barbers_user_id_idx" 
ON "Barbers"("userId");

-- 4. Criar índice composto para queries multi-tenant
CREATE INDEX IF NOT EXISTS "barbers_barbershop_user_idx" 
ON "Barbers"("barbershopId", "userId");

-- ========================================
-- VERIFICAÇÃO
-- ========================================
-- Para verificar se a migração foi aplicada corretamente:
-- SELECT table_name, column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'Barbers' 
-- AND column_name = 'userId';