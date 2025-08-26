-- Migration: Implement Row Level Security (RLS) and Policies
-- Description: Creates RLS policies for multi-tenant data isolation
-- Date: 2025-08-25

-- ========================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ========================================

-- Function to get current tenant_id from JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Extract tenant_id from JWT claims
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::json->>'default_tenant_id')::uuid,
        (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is tenant member
CREATE OR REPLACE FUNCTION is_tenant_member(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_members 
        WHERE tenant_id = tenant_uuid 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is tenant owner/admin
CREATE OR REPLACE FUNCTION is_tenant_admin(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_members 
        WHERE tenant_id = tenant_uuid 
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ========================================

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Barbershops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Barbers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BarberServices" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE POLICIES FOR TENANTS TABLE
-- ========================================

-- Users can view tenants they are members of
CREATE POLICY "Users can view their tenants" ON "tenants"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members 
            WHERE tenant_members.tenant_id = tenants.id 
            AND tenant_members.user_id = auth.uid()
        )
    );

-- Only authenticated users can create tenants (handled by Edge Functions)
CREATE POLICY "Authenticated users can create tenants" ON "tenants"
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Only tenant admins can update tenants
CREATE POLICY "Tenant admins can update tenants" ON "tenants"
    FOR UPDATE
    USING (is_tenant_admin(id))
    WITH CHECK (is_tenant_admin(id));

-- Only tenant owners can delete tenants
CREATE POLICY "Tenant owners can delete tenants" ON "tenants"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members 
            WHERE tenant_members.tenant_id = tenants.id 
            AND tenant_members.user_id = auth.uid()
            AND tenant_members.role = 'owner'
        )
    );

-- ========================================
-- STEP 4: CREATE POLICIES FOR TENANT_MEMBERS TABLE
-- ========================================

-- Users can view tenant members of their tenants
CREATE POLICY "Users can view tenant members" ON "tenant_members"
    FOR SELECT
    USING (is_tenant_member(tenant_id));

-- Tenant admins can add members
CREATE POLICY "Tenant admins can add members" ON "tenant_members"
    FOR INSERT
    WITH CHECK (is_tenant_admin(tenant_id));

-- Tenant admins can update member roles
CREATE POLICY "Tenant admins can update members" ON "tenant_members"
    FOR UPDATE
    USING (is_tenant_admin(tenant_id))
    WITH CHECK (is_tenant_admin(tenant_id));

-- Tenant admins can remove members
CREATE POLICY "Tenant admins can remove members" ON "tenant_members"
    FOR DELETE
    USING (is_tenant_admin(tenant_id));

-- ========================================
-- STEP 5: CREATE POLICIES FOR BUSINESS TABLES
-- ========================================

-- Barbershops policies
CREATE POLICY "Users can view their barbershops" ON "Barbershops"
    FOR SELECT
    USING (tenant_id = current_tenant_id() OR is_tenant_member(tenant_id));

CREATE POLICY "Users can create barbershops" ON "Barbershops"
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant admins can update barbershops" ON "Barbershops"
    FOR UPDATE
    USING (is_tenant_admin(tenant_id))
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant owners can delete barbershops" ON "Barbershops"
    FOR DELETE
    USING (is_tenant_admin(tenant_id));

-- Users policies
CREATE POLICY "Users can view tenant users" ON "Users"
    FOR SELECT
    USING (tenant_id = current_tenant_id() OR is_tenant_member(tenant_id));

CREATE POLICY "Users can create users" ON "Users"
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Users can update their own data" ON "Users"
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Barbers policies
CREATE POLICY "Users can view tenant barbers" ON "Barbers"
    FOR SELECT
    USING (tenant_id = current_tenant_id() OR is_tenant_member(tenant_id));

CREATE POLICY "Tenant members can create barbers" ON "Barbers"
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant members can update barbers" ON "Barbers"
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant admins can delete barbers" ON "Barbers"
    FOR DELETE
    USING (is_tenant_admin(tenant_id));

-- Services policies
CREATE POLICY "Users can view tenant services" ON "Services"
    FOR SELECT
    USING (tenant_id = current_tenant_id() OR is_tenant_member(tenant_id));

CREATE POLICY "Tenant members can create services" ON "Services"
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant members can update services" ON "Services"
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant admins can delete services" ON "Services"
    FOR DELETE
    USING (is_tenant_admin(tenant_id));

-- Appointments policies
CREATE POLICY "Users can view tenant appointments" ON "Appointments"
    FOR SELECT
    USING (tenant_id = current_tenant_id() OR is_tenant_member(tenant_id));

CREATE POLICY "Users can create appointments" ON "Appointments"
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Users can update appointments" ON "Appointments"
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant members can delete appointments" ON "Appointments"
    FOR DELETE
    USING (is_tenant_member(tenant_id));

-- Comments policies
CREATE POLICY "Users can view tenant comments" ON "Comments"
    FOR SELECT
    USING (tenant_id = current_tenant_id() OR is_tenant_member(tenant_id));

CREATE POLICY "Anyone can create comments" ON "Comments"
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant admins can update comments" ON "Comments"
    FOR UPDATE
    USING (is_tenant_admin(tenant_id))
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant admins can delete comments" ON "Comments"
    FOR DELETE
    USING (is_tenant_admin(tenant_id));

-- BarberServices policies
CREATE POLICY "Users can view tenant barber services" ON "BarberServices"
    FOR SELECT
    USING (tenant_id = current_tenant_id() OR is_tenant_member(tenant_id));

CREATE POLICY "Tenant members can create barber services" ON "BarberServices"
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant members can update barber services" ON "BarberServices"
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant admins can delete barber services" ON "BarberServices"
    FOR DELETE
    USING (is_tenant_admin(tenant_id));

COMMIT;