-- Migration: Create Multi-Tenant Structure
-- Description: Adds tenants and tenant_members tables and modifies existing tables for multi-tenancy
-- Date: 2025-08-25

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
    "role" VARCHAR(50) NOT NULL DEFAULT 'member' CHECK ("role" IN ('owner', 'admin', 'member')),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("tenant_id", "user_id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "tenant_members_tenant_id_idx" ON "tenant_members"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_members_user_id_idx" ON "tenant_members"("user_id");
CREATE INDEX IF NOT EXISTS "tenant_members_role_idx" ON "tenant_members"("tenant_id", "role");

-- ========================================
-- STEP 3: ADD TENANT_ID TO EXISTING TABLES
-- ========================================

-- Add tenant_id to Barbershops table (rename to match new structure)
ALTER TABLE "Barbershops" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- Add tenant_id to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- Add tenant_id to Barbers table
ALTER TABLE "Barbers" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- Add tenant_id to Services table
ALTER TABLE "Services" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- Add tenant_id to Appointments table
ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- Add tenant_id to Comments table
ALTER TABLE "Comments" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- Add tenant_id to BarberServices table
ALTER TABLE "BarberServices" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

-- ========================================
-- STEP 4: CREATE FOREIGN KEY CONSTRAINTS
-- ========================================

-- Add foreign key constraints for tenant_id (after data migration)
-- These will be enabled after data migration is complete

-- ========================================
-- STEP 5: CREATE COMPOSITE INDEXES FOR PERFORMANCE
-- ========================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "Users"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "users_tenant_username_idx" ON "Users"("tenant_id", "username");

-- Barbers table indexes
CREATE INDEX IF NOT EXISTS "barbers_tenant_id_idx" ON "Barbers"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "barbers_tenant_only_idx" ON "Barbers"("tenant_id");

-- Services table indexes
CREATE INDEX IF NOT EXISTS "services_tenant_id_idx" ON "Services"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "services_tenant_name_idx" ON "Services"("tenant_id", "name");

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS "appointments_tenant_id_idx" ON "Appointments"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "appointments_tenant_date_idx" ON "Appointments"("tenant_id", "date");
CREATE INDEX IF NOT EXISTS "appointments_tenant_barber_idx" ON "Appointments"("tenant_id", "barberId");
CREATE INDEX IF NOT EXISTS "appointments_tenant_status_idx" ON "Appointments"("tenant_id", "status");

-- Comments table indexes
CREATE INDEX IF NOT EXISTS "comments_tenant_id_idx" ON "Comments"("tenant_id", "id");
CREATE INDEX IF NOT EXISTS "comments_tenant_status_idx" ON "Comments"("tenant_id", "status");

-- BarberServices table indexes
CREATE INDEX IF NOT EXISTS "barber_services_tenant_idx" ON "BarberServices"("tenant_id");

-- ========================================
-- STEP 6: TRIGGERS ALREADY CREATED
-- ========================================

-- Note: All triggers and functions were created in the initial schema migration
-- No additional triggers needed for this migration

COMMIT;