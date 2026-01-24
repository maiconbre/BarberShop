-- ==============================================================
-- BARBERSHOP - SCRIPT DE MIGRAÇÃO COMPLETO
-- Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/aefnjlhnjzirevxgeaqy/sql
-- ==============================================================

-- PARTE 1: CRIAR TABELAS PRINCIPAIS
-- ==============================================================

-- Tabela de Tenants (multi-tenancy)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants"("slug");

-- Tabela de Membros do Tenant
CREATE TABLE IF NOT EXISTS "tenant_members" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'member' CHECK ("role" IN ('owner', 'admin', 'manager', 'barber', 'member')),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("tenant_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "tenant_members_tenant_id_idx" ON "tenant_members"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_members_user_id_idx" ON "tenant_members"("user_id");

-- Tabela de Barbearias
CREATE TABLE IF NOT EXISTS "Barbershops" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenant_id" UUID REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE,
    "owner_email" VARCHAR(255),
    "owner_id" UUID,
    "plan_type" VARCHAR(50) DEFAULT 'free',
    "address" TEXT,
    "phone" VARCHAR(50),
    "description" TEXT,
    "logo_url" TEXT,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "barbershops_slug_idx" ON "Barbershops"("slug");
CREATE INDEX IF NOT EXISTS "barbershops_tenant_id_idx" ON "Barbershops"("tenant_id");

-- Tabela de Profiles (para Supabase Auth)
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "name" VARCHAR(255),
    "username" VARCHAR(255) UNIQUE,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "avatar_url" TEXT,
    "role" VARCHAR(50) DEFAULT 'client',
    "barbershop_id" VARCHAR(255) REFERENCES "Barbershops"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de Barbeiros
CREATE TABLE IF NOT EXISTS "Barbers" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenant_id" UUID REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "whatsapp" VARCHAR(50),
    "pix" VARCHAR(255),
    "specialty" VARCHAR(255),
    "bio" TEXT,
    "avatar_url" TEXT,
    "qr_code_url" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "barbershopId" VARCHAR(255) REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "userId" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "barbers_tenant_id_idx" ON "Barbers"("tenant_id");

-- Tabela de Serviços
CREATE TABLE IF NOT EXISTS "Services" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenant_id" UUID REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER DEFAULT 30,
    "category" VARCHAR(100),
    "image_url" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "barbershopId" VARCHAR(255) REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "services_tenant_id_idx" ON "Services"("tenant_id");

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS "Appointments" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenant_id" UUID REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientName" VARCHAR(255) NOT NULL,
    "clientPhone" VARCHAR(50),
    "clientEmail" VARCHAR(255),
    "serviceName" VARCHAR(255),
    "barberId" VARCHAR(255) REFERENCES "Barbers"("id") ON DELETE CASCADE,
    "barberName" VARCHAR(255),
    "serviceId" VARCHAR(255) REFERENCES "Services"("id") ON DELETE SET NULL,
    "date" DATE NOT NULL,
    "time" VARCHAR(10) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "price" DECIMAL(10,2),
    "wppclient" VARCHAR(50),
    "barbershopId" VARCHAR(255) REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "appointments_tenant_id_idx" ON "Appointments"("tenant_id");
CREATE INDEX IF NOT EXISTS "appointments_date_idx" ON "Appointments"("date");

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS "Comments" (
    "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenant_id" UUID REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "clientName" VARCHAR(255),
    "comment" TEXT NOT NULL,
    "rating" INTEGER CHECK ("rating" >= 1 AND "rating" <= 5),
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "barbershopId" VARCHAR(255) REFERENCES "Barbershops"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "comments_tenant_id_idx" ON "Comments"("tenant_id");
CREATE INDEX IF NOT EXISTS "comments_status_idx" ON "Comments"("status");

-- ==============================================================
-- PARTE 2: TRIGGERS PARA UPDATED_AT
-- ==============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers em todas as tabelas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at') THEN
        CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON "tenants" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_barbershops_updated_at') THEN
        CREATE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON "Barbershops" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON "profiles" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_barbers_updated_at') THEN
        CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON "Barbers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at') THEN
        CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON "Services" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at') THEN
        CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON "Appointments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN
        CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON "Comments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==============================================================
-- PARTE 3: RLS POLICIES (Acesso Público para Início)
-- ==============================================================

-- Habilitar RLS
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Barbershops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Barbers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública para dados de barbearias (landing pages)
CREATE POLICY "Public read access to barbershops" ON "Barbershops" FOR SELECT USING (true);
CREATE POLICY "Public read access to barbers" ON "Barbers" FOR SELECT USING (true);
CREATE POLICY "Public read access to services" ON "Services" FOR SELECT USING (true);
CREATE POLICY "Public read approved comments" ON "Comments" FOR SELECT USING (status = 'approved');

-- Políticas de inserção para usuários autenticados
CREATE POLICY "Authenticated users can create barbershops" ON "Barbershops" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update own barbershops" ON "Barbershops" FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Authenticated users can create appointments" ON "Appointments" FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view appointments" ON "Appointments" FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update appointments" ON "Appointments" FOR UPDATE USING (true);
CREATE POLICY "Anyone can create comments" ON "Comments" FOR INSERT WITH CHECK (true);

-- Profiles
CREATE POLICY "Users can view own profile" ON "profiles" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON "profiles" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON "profiles" FOR INSERT WITH CHECK (auth.uid() = id);

-- Tenants e Members
CREATE POLICY "Anyone can view tenants" ON "tenants" FOR SELECT USING (true);
CREATE POLICY "Authenticated can create tenants" ON "tenants" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Members can view tenant_members" ON "tenant_members" FOR SELECT USING (true);
CREATE POLICY "Authenticated can add tenant_members" ON "tenant_members" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==============================================================
-- PARTE 4: FUNÇÕES RPC SIMPLIFICADAS
-- ==============================================================

-- Função para buscar barbearia por slug (pública)
CREATE OR REPLACE FUNCTION get_barbershop_by_slug(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'owner_email', owner_email,
        'plan_type', plan_type,
        'settings', settings,
        'address', address,
        'phone', phone,
        'description', description,
        'created_at', created_at
    )
    FROM "Barbershops"
    WHERE slug = p_slug
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar barbeiros de uma barbearia
CREATE OR REPLACE FUNCTION get_barbershop_barbers(p_barbershop_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'phone', phone,
            'whatsapp', whatsapp,
            'specialty', specialty,
            'avatar_url', avatar_url,
            'is_active', is_active
        )
    )
    FROM "Barbers"
    WHERE "barbershopId" = p_barbershop_id AND is_active = true
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar serviços de uma barbearia
CREATE OR REPLACE FUNCTION get_barbershop_services(p_barbershop_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'description', description,
            'price', price,
            'duration', duration,
            'is_active', is_active
        )
    )
    FROM "Services"
    WHERE "barbershopId" = p_barbershop_id AND is_active = true
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================
-- PRONTO! Script executado com sucesso.
-- ==============================================================
