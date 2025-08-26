-- Migration: Create RPC Functions
-- Description: SQL functions to replace Express backend operations
-- Date: 2025-08-25

-- ========================================
-- TENANT MANAGEMENT FUNCTIONS
-- ========================================

-- Function to create a new tenant (barbershop)
CREATE OR REPLACE FUNCTION create_tenant(
    tenant_name TEXT,
    tenant_slug TEXT,
    owner_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    new_tenant_id UUID;
    result JSON;
BEGIN
    -- Validate input
    IF tenant_name IS NULL OR tenant_slug IS NULL THEN
        RAISE EXCEPTION 'Tenant name and slug are required';
    END IF;
    
    IF owner_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if slug already exists
    IF EXISTS (SELECT 1 FROM tenants WHERE slug = tenant_slug) THEN
        RAISE EXCEPTION 'Tenant slug already exists';
    END IF;
    
    -- Create tenant
    INSERT INTO tenants (name, slug)
    VALUES (tenant_name, tenant_slug)
    RETURNING id INTO new_tenant_id;
    
    -- Add user as owner
    INSERT INTO tenant_members (tenant_id, user_id, role)
    VALUES (new_tenant_id, owner_user_id, 'owner');
    
    -- Return result
    SELECT json_build_object(
        'id', new_tenant_id,
        'name', tenant_name,
        'slug', tenant_slug,
        'created_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant by slug
CREATE OR REPLACE FUNCTION get_tenant_by_slug(tenant_slug TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'created_at', created_at
    )
    FROM tenants
    WHERE slug = tenant_slug
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- USER MANAGEMENT FUNCTIONS
-- ========================================

-- Function to create a user within a tenant
CREATE OR REPLACE FUNCTION create_tenant_user(
    p_username TEXT,
    p_password TEXT,
    p_name TEXT,
    p_role TEXT DEFAULT 'client',
    p_tenant_id UUID DEFAULT current_tenant_id()
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Validate tenant access
    IF p_tenant_id IS NULL OR NOT is_tenant_member(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied to tenant';
    END IF;
    
    -- Create user
    INSERT INTO "Users" (username, password, name, role, "barbershopId", tenant_id)
    VALUES (p_username, p_password, p_name, p_role, p_tenant_id, p_tenant_id)
    RETURNING id INTO new_user_id;
    
    -- Return result
    SELECT json_build_object(
        'id', new_user_id,
        'username', p_username,
        'name', p_name,
        'role', p_role,
        'tenant_id', p_tenant_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- BARBER MANAGEMENT FUNCTIONS
-- ========================================

-- Function to create a barber
CREATE OR REPLACE FUNCTION create_barber(
    p_name TEXT,
    p_whatsapp TEXT,
    p_pix TEXT,
    p_user_id UUID DEFAULT NULL,
    p_tenant_id UUID DEFAULT current_tenant_id()
)
RETURNS JSON AS $$
DECLARE
    new_barber_id UUID;
    result JSON;
BEGIN
    -- Validate tenant access
    IF p_tenant_id IS NULL OR NOT is_tenant_member(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied to tenant';
    END IF;
    
    -- Create barber
    INSERT INTO "Barbers" (name, whatsapp, pix, "userId", "barbershopId", tenant_id)
    VALUES (p_name, p_whatsapp, p_pix, p_user_id, p_tenant_id, p_tenant_id)
    RETURNING id INTO new_barber_id;
    
    -- Return result
    SELECT json_build_object(
        'id', new_barber_id,
        'name', p_name,
        'whatsapp', p_whatsapp,
        'pix', p_pix,
        'userId', p_user_id,
        'tenant_id', p_tenant_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get barbers for a tenant
CREATE OR REPLACE FUNCTION get_tenant_barbers(
    p_tenant_id UUID DEFAULT current_tenant_id()
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Validate tenant access
    IF p_tenant_id IS NULL OR NOT is_tenant_member(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied to tenant';
    END IF;
    
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'whatsapp', whatsapp,
            'pix', pix,
            'userId', "userId",
            'created_at', created_at
        )
    )
    FROM "Barbers"
    WHERE tenant_id = p_tenant_id
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SERVICE MANAGEMENT FUNCTIONS
-- ========================================

-- Function to create a service
CREATE OR REPLACE FUNCTION create_service(
    p_name TEXT,
    p_price FLOAT,
    p_tenant_id UUID DEFAULT current_tenant_id()
)
RETURNS JSON AS $$
DECLARE
    new_service_id UUID;
    result JSON;
BEGIN
    -- Validate tenant access
    IF p_tenant_id IS NULL OR NOT is_tenant_member(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied to tenant';
    END IF;
    
    -- Create service
    INSERT INTO "Services" (name, price, "barbershopId", tenant_id)
    VALUES (p_name, p_price, p_tenant_id, p_tenant_id)
    RETURNING id INTO new_service_id;
    
    -- Return result
    SELECT json_build_object(
        'id', new_service_id,
        'name', p_name,
        'price', p_price,
        'tenant_id', p_tenant_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get services for a tenant
CREATE OR REPLACE FUNCTION get_tenant_services(
    p_tenant_id UUID DEFAULT current_tenant_id()
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Validate tenant access
    IF p_tenant_id IS NULL OR NOT is_tenant_member(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied to tenant';
    END IF;
    
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'price', price,
            'created_at', created_at
        )
    )
    FROM "Services"
    WHERE tenant_id = p_tenant_id
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- APPOINTMENT MANAGEMENT FUNCTIONS
-- ========================================

-- Function to create an appointment
CREATE OR REPLACE FUNCTION create_appointment(
    p_client_name TEXT,
    p_service_name TEXT,
    p_date DATE,
    p_time TEXT,
    p_barber_id UUID,
    p_barber_name TEXT,
    p_price FLOAT,
    p_wppclient TEXT,
    p_tenant_id UUID DEFAULT current_tenant_id()
)
RETURNS JSON AS $$
DECLARE
    new_appointment_id UUID;
    result JSON;
BEGIN
    -- Validate tenant access
    IF p_tenant_id IS NULL OR NOT is_tenant_member(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied to tenant';
    END IF;
    
    -- Create appointment
    INSERT INTO "Appointments" (
        "clientName", "serviceName", date, time, status,
        "barberId", "barberName", price, wppclient,
        "barbershopId", tenant_id
    )
    VALUES (
        p_client_name, p_service_name, p_date, p_time, 'pending',
        p_barber_id, p_barber_name, p_price, p_wppclient,
        p_tenant_id, p_tenant_id
    )
    RETURNING id INTO new_appointment_id;
    
    -- Return result
    SELECT json_build_object(
        'id', new_appointment_id,
        'clientName', p_client_name,
        'serviceName', p_service_name,
        'date', p_date,
        'time', p_time,
        'status', 'pending',
        'barberId', p_barber_id,
        'barberName', p_barber_name,
        'price', p_price,
        'wppclient', p_wppclient,
        'tenant_id', p_tenant_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointments for a tenant
CREATE OR REPLACE FUNCTION get_tenant_appointments(
    p_tenant_id UUID DEFAULT current_tenant_id(),
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Validate tenant access
    IF p_tenant_id IS NULL OR NOT is_tenant_member(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied to tenant';
    END IF;
    
    SELECT json_agg(
        json_build_object(
            'id', id,
            'clientName', "clientName",
            'serviceName', "serviceName",
            'date', date,
            'time', time,
            'status', status,
            'barberId', "barberId",
            'barberName', "barberName",
            'price', price,
            'wppclient', wppclient,
            'created_at', created_at
        )
    )
    FROM (
        SELECT *
        FROM "Appointments"
        WHERE tenant_id = p_tenant_id
        ORDER BY date DESC, time DESC
        LIMIT p_limit OFFSET p_offset
    ) appointments
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- COMMENT MANAGEMENT FUNCTIONS
-- ========================================

-- Function to create a comment
CREATE OR REPLACE FUNCTION create_comment(
    p_name TEXT,
    p_comment TEXT,
    p_tenant_id UUID DEFAULT current_tenant_id()
)
RETURNS JSON AS $$
DECLARE
    new_comment_id UUID;
    result JSON;
BEGIN
    -- Create comment (public endpoint, no tenant validation needed)
    INSERT INTO "Comments" (name, comment, status, "barbershopId", tenant_id)
    VALUES (p_name, p_comment, 'pending', p_tenant_id, p_tenant_id)
    RETURNING id INTO new_comment_id;
    
    -- Return result
    SELECT json_build_object(
        'id', new_comment_id,
        'name', p_name,
        'comment', p_comment,
        'status', 'pending',
        'tenant_id', p_tenant_id
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get approved comments for a tenant
CREATE OR REPLACE FUNCTION get_tenant_comments(
    p_tenant_id UUID,
    p_status TEXT DEFAULT 'approved'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'comment', comment,
            'status', status,
            'created_at', created_at
        )
    )
    FROM "Comments"
    WHERE tenant_id = p_tenant_id
    AND (p_status IS NULL OR status = p_status)
    ORDER BY created_at DESC
    INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;