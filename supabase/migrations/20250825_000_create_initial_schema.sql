-- Migration: Create Initial Schema with Multi-Tenant Structure
-- Description: Creates all tables from scratch with multi-tenant support
-- Date: 2025-08-25

BEGIN;

-- ========================================
-- STEP 1: CREATE TENANTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants"("slug");
CREATE INDEX IF NOT EXISTS "tenants_name_idx" ON "tenants"("name");

-- ========================================
-- STEP 2: CREATE TENANT_MEMBERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "tenant_members" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'member' CHECK ("role" IN ('owner', 'admin', 'manager', 'barber', 'member')),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("tenant_id", "user_id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "tenant_members_tenant_id_idx" ON "tenant_members"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_members_user_id_idx" ON "tenant_members"("user_id");
CREATE INDEX IF NOT EXISTS "tenant_members_role_idx" ON "tenant_members"("tenant_id", "role");

-- ========================================
-- STEP 3: CREATE BARBERSHOPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "Barbershops" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "description" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "barbershops_tenant_id_idx" ON "Barbershops"("tenant_id");
CREATE INDEX IF NOT EXISTS "barbershops_name_idx" ON "Barbershops"("tenant_id", "name");

-- ========================================
-- STEP 4: CREATE USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "Users" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenant_id" UUID REFERENCES "tenants"("id") ON DELETE SET NULL,
    "username" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'client' CHECK ("role" IN ('admin', 'manager', 'barber', 'client')),
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "avatar_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "Users"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "users_tenant_username_idx" ON "Users"("tenant_id", "username");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "Users"("tenant_id", "role");

-- ========================================
-- STEP 5: CREATE BARBERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "Barbers" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "specialty" VARCHAR(255),
    "bio" TEXT,
    "avatar_url" TEXT,
    "qr_code_url" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "barbers_tenant_id_idx" ON "Barbers"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "barbers_tenant_only_idx" ON "Barbers"("tenant_id");
CREATE INDEX IF NOT EXISTS "barbers_active_idx" ON "Barbers"("tenant_id", "is_active");

-- ========================================
-- STEP 6: CREATE SERVICES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "Services" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER NOT NULL, -- duration in minutes
    "category" VARCHAR(100),
    "image_url" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "services_tenant_id_idx" ON "Services"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "services_tenant_name_idx" ON "Services"("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "services_active_idx" ON "Services"("tenant_id", "is_active");
CREATE INDEX IF NOT EXISTS "services_category_idx" ON "Services"("tenant_id", "category");

-- ========================================
-- STEP 7: CREATE BARBER_SERVICES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "BarberServices" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "barberId" VARCHAR(255) NOT NULL REFERENCES "Barbers"("id") ON DELETE CASCADE,
    "serviceId" VARCHAR(255) NOT NULL REFERENCES "Services"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("barberId", "serviceId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "barber_services_tenant_idx" ON "BarberServices"("tenant_id");
CREATE INDEX IF NOT EXISTS "barber_services_barber_idx" ON "BarberServices"("tenant_id", "barberId");
CREATE INDEX IF NOT EXISTS "barber_services_service_idx" ON "BarberServices"("tenant_id", "serviceId");

-- ========================================
-- STEP 8: CREATE APPOINTMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "Appointments" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientName" VARCHAR(255) NOT NULL,
    "clientPhone" VARCHAR(50),
    "clientEmail" VARCHAR(255),
    "barberId" VARCHAR(255) NOT NULL REFERENCES "Barbers"("id") ON DELETE CASCADE,
    "serviceId" VARCHAR(255) NOT NULL REFERENCES "Services"("id") ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "time" TIME NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    "notes" TEXT,
    "total_price" DECIMAL(10,2),
    "payment_status" VARCHAR(50) DEFAULT 'pending' CHECK ("payment_status" IN ('pending', 'paid', 'cancelled', 'refunded')),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "appointments_tenant_id_idx" ON "Appointments"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "appointments_tenant_date_idx" ON "Appointments"("tenant_id", "date");
CREATE INDEX IF NOT EXISTS "appointments_tenant_barber_idx" ON "Appointments"("tenant_id", "barberId");
CREATE INDEX IF NOT EXISTS "appointments_tenant_status_idx" ON "Appointments"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "appointments_date_time_idx" ON "Appointments"("tenant_id", "date", "time");
CREATE INDEX IF NOT EXISTS "appointments_barber_date_idx" ON "Appointments"("tenant_id", "barberId", "date");

-- ========================================
-- STEP 9: CREATE COMMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS "Comments" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "clientName" VARCHAR(255) NOT NULL,
    "clientEmail" VARCHAR(255),
    "rating" INTEGER CHECK ("rating" >= 1 AND "rating" <= 5),
    "comment" TEXT NOT NULL,
    "barberId" VARCHAR(255) REFERENCES "Barbers"("id") ON DELETE SET NULL,
    "serviceId" VARCHAR(255) REFERENCES "Services"("id") ON DELETE SET NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "comments_tenant_id_idx" ON "Comments"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "comments_tenant_status_idx" ON "Comments"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "comments_barber_idx" ON "Comments"("tenant_id", "barberId");
CREATE INDEX IF NOT EXISTS "comments_rating_idx" ON "Comments"("tenant_id", "rating");

-- ========================================
-- STEP 10: CREATE UPDATED_AT TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON "tenants"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_members_updated_at
    BEFORE UPDATE ON "tenant_members"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbershops_updated_at
    BEFORE UPDATE ON "Barbershops"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "Users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barbers_updated_at
    BEFORE UPDATE ON "Barbers"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON "Services"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON "Appointments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON "Comments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;