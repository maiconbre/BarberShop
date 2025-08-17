-- ========================================
-- SCHEMA INICIAL DO BANCO DE DADOS
-- ========================================
-- Execute este script no Supabase SQL Editor para criar a estrutura inicial

-- 1. Remover tabelas existentes (se houver)
DROP TABLE IF EXISTS "BarberServices" CASCADE;
DROP TABLE IF EXISTS "Appointments" CASCADE;
DROP TABLE IF EXISTS "Comments" CASCADE;
DROP TABLE IF EXISTS "Services" CASCADE;
DROP TABLE IF EXISTS "Barbers" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "Barbershops" CASCADE;

-- 2. Criar tabela Barbershops (entidade principal)
CREATE TABLE "Barbershops" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "owner_email" VARCHAR(255) NOT NULL,
    "plan_type" VARCHAR(50) NOT NULL DEFAULT 'free' CHECK ("plan_type" IN ('free', 'pro')),
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Criar tabela Users (usuários do sistema)
CREATE TABLE "Users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) NOT NULL DEFAULT 'client',
    "name" VARCHAR(255) NOT NULL,
    "barbershopId" UUID NOT NULL REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Criar tabela Barbers (barbeiros)
CREATE TABLE "Barbers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(255) NOT NULL,
    "pix" VARCHAR(255) NOT NULL,
    "userId" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
    "barbershopId" UUID NOT NULL REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Criar tabela Services (serviços oferecidos)
CREATE TABLE "Services" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "price" FLOAT NOT NULL,
    "barbershopId" UUID NOT NULL REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Criar tabela Appointments (agendamentos)
CREATE TABLE "Appointments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "clientName" VARCHAR(255) NOT NULL,
    "serviceName" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,
    "time" VARCHAR(255) NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'pending',
    "barberId" UUID NOT NULL REFERENCES "Barbers"("id") ON DELETE CASCADE,
    "barberName" VARCHAR(255) NOT NULL,
    "price" FLOAT NOT NULL,
    "wppclient" VARCHAR(255) NOT NULL,
    "barbershopId" UUID NOT NULL REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Criar tabela Comments (comentários/avaliações)
CREATE TABLE "Comments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "comment" TEXT NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
    "barbershopId" UUID NOT NULL REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Criar tabela BarberServices (relacionamento many-to-many)
CREATE TABLE "BarberServices" (
    "BarberId" UUID NOT NULL REFERENCES "Barbers"("id") ON DELETE CASCADE,
    "ServiceId" UUID NOT NULL REFERENCES "Services"("id") ON DELETE CASCADE,
    "barbershopId" UUID NOT NULL REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("BarberId", "ServiceId")
);

-- 9. Criar índices para performance (baseados nos modelos Sequelize)
-- Índices da tabela Barbershops
CREATE UNIQUE INDEX "barbershops_slug_idx" ON "Barbershops"("slug");
CREATE INDEX "barbershops_owner_email_idx" ON "Barbershops"("owner_email");
CREATE INDEX "barbershops_plan_type_idx" ON "Barbershops"("plan_type");

-- Índices da tabela Users
CREATE INDEX "users_barbershop_id_idx" ON "Users"("barbershopId", "id");
CREATE UNIQUE INDEX "users_barbershop_username_unique" ON "Users"("barbershopId", "username");

-- Índices da tabela Barbers
CREATE INDEX "barbers_barbershop_id_idx" ON "Barbers"("barbershopId", "id");
CREATE INDEX "barbers_barbershop_only_idx" ON "Barbers"("barbershopId");
CREATE INDEX "barbers_user_id_idx" ON "Barbers"("userId");
CREATE INDEX "barbers_barbershop_user_idx" ON "Barbers"("barbershopId", "userId");

-- Índices da tabela Services
CREATE INDEX "services_barbershop_id_idx" ON "Services"("barbershopId", "id");
CREATE INDEX "services_barbershop_name_idx" ON "Services"("barbershopId", "name");

-- Índices da tabela Appointments
CREATE INDEX "appointments_barbershop_id_idx" ON "Appointments"("barbershopId", "id");
CREATE INDEX "appointments_barbershop_date_idx" ON "Appointments"("barbershopId", "date");
CREATE INDEX "appointments_barbershop_barber_idx" ON "Appointments"("barbershopId", "barberId");
CREATE INDEX "appointments_barbershop_status_idx" ON "Appointments"("barbershopId", "status");

-- Índices da tabela Comments
CREATE INDEX "comments_barbershop_id_idx" ON "Comments"("barbershopId", "id");
CREATE INDEX "comments_barbershop_status_idx" ON "Comments"("barbershopId", "status");

-- Índices da tabela BarberServices
CREATE INDEX "barber_services_barbershop_idx" ON "BarberServices"("barbershopId");

-- 10. Confirmar mudanças
COMMIT;

-- ========================================
-- ESTRUTURA CRIADA COM SUCESSO
-- ========================================
-- Próximos passos:
-- 1. Execute o arquivo 02-functions.sql
-- 2. Execute o arquivo 03-rls-policies.sql
-- 3. Configure a autenticação se necessário