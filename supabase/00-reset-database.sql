-- ========================================
-- RESET COMPLETO DO BANCO DE DADOS
-- ========================================
-- Execute APENAS se quiser limpar tudo e começar do zero
-- ATENÇÃO: Isso apagará TODOS os dados existentes!

-- 1. Remover todas as tabelas existentes
DROP TABLE IF EXISTS "BarberServices" CASCADE;
DROP TABLE IF EXISTS "Appointments" CASCADE;
DROP TABLE IF EXISTS "Comments" CASCADE;
DROP TABLE IF EXISTS "Services" CASCADE;
DROP TABLE IF EXISTS "Barbers" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "Barbershops" CASCADE;

-- 2. Remover funções existentes
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_valid_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_unique_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_appointment_conflict(UUID, DATE, TIME, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_barbershop_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS validate_barbershop_email() CASCADE;
DROP FUNCTION IF EXISTS prevent_appointment_conflict() CASCADE;

-- 3. Remover políticas RLS (se existirem)
DROP POLICY IF EXISTS "Public barbershops read" ON "Barbershops";
DROP POLICY IF EXISTS "Owners manage barbershops" ON "Barbershops";
DROP POLICY IF EXISTS "Users see own barbershop data" ON "Users";
DROP POLICY IF EXISTS "Barbers see own barbershop data" ON "Barbers";
DROP POLICY IF EXISTS "Public barbers read" ON "Barbers";
DROP POLICY IF EXISTS "Services see own barbershop data" ON "Services";
DROP POLICY IF EXISTS "Public services read" ON "Services";
DROP POLICY IF EXISTS "Appointments see own barbershop data" ON "Appointments";
DROP POLICY IF EXISTS "Clients can create appointments" ON "Appointments";
DROP POLICY IF EXISTS "Public appointments availability" ON "Appointments";
DROP POLICY IF EXISTS "Comments see own barbershop data" ON "Comments";
DROP POLICY IF EXISTS "Clients can create comments" ON "Comments";
DROP POLICY IF EXISTS "Public approved comments read" ON "Comments";
DROP POLICY IF EXISTS "BarberServices see own barbershop data" ON "BarberServices";
DROP POLICY IF EXISTS "Public barber services read" ON "BarberServices";

-- 4. Confirmar limpeza
COMMIT;

-- ========================================
-- BANCO COMPLETAMENTE LIMPO
-- ========================================
-- Agora execute na ordem:
-- 1. supabase/01-schema.sql
-- 2. supabase/02-functions.sql
-- 3. supabase/03-rls-policies.sql
-- 4. supabase/04-seed-data.sql

SELECT 'Banco resetado com sucesso! Execute os scripts na ordem.' as status;