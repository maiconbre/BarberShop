-- Migration: Setup Multi-Tenant Storage
-- Description: Create storage buckets for multi-tenant file management
-- Date: 2025-01-25
-- Note: Storage policies must be configured manually in Supabase Dashboard

-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('tenant-avatars', 'tenant-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 5MB
  ('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 2MB
  ('barbershop-images', 'barbershop-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 10MB
  ('service-images', 'service-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 5MB
  ('qr-codes', 'qr-codes', true, 1048576, ARRAY['image/png', 'image/svg+xml']), -- 1MB
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']) -- 50MB
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies need to be configured manually in Supabase Dashboard
-- Go to Storage > Policies and create the following policies:
--
-- For tenant-avatars bucket:
-- 1. SELECT: bucket_id = 'tenant-avatars' (public read)
-- 2. INSERT/UPDATE/DELETE: Check tenant membership with admin/manager role
--
-- For user-avatars bucket:
-- 1. SELECT: bucket_id = 'user-avatars' (public read)
-- 2. INSERT/UPDATE/DELETE: (storage.foldername(name))[1] = auth.uid()::text
--
-- For barbershop-images bucket:
-- 1. SELECT: bucket_id = 'barbershop-images' (public read)
-- 2. INSERT/UPDATE: Check tenant membership with admin/manager/barber role
-- 3. DELETE: Check tenant membership with admin/manager role
--
-- For service-images bucket:
-- 1. SELECT: bucket_id = 'service-images' (public read)
-- 2. INSERT/UPDATE: Check tenant membership with admin/manager/barber role
-- 3. DELETE: Check tenant membership with admin/manager role
--
-- For qr-codes bucket:
-- 1. SELECT: bucket_id = 'qr-codes' (public read)
-- 2. INSERT/UPDATE: Check tenant membership with admin/manager/barber role
-- 3. DELETE: Check tenant membership with admin/manager role
--
-- For documents bucket (private):
-- 1. SELECT/INSERT/UPDATE/DELETE: Check tenant membership based on folder structure

-- Create helper function to get tenant-aware storage path
CREATE OR REPLACE FUNCTION get_tenant_storage_path(
  tenant_id UUID,
  file_type TEXT,
  filename TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate tenant access
  IF NOT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = get_tenant_storage_path.tenant_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied to tenant storage';
  END IF;
  
  -- Return tenant-scoped path
  RETURN tenant_id::text || '/' || file_type || '/' || filename;
END;
$$;

-- Create function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_files()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- Only allow admins to run cleanup
  IF NOT EXISTS (
    SELECT 1 FROM tenant_members tm
    JOIN tenants t ON tm.tenant_id = t.id
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only tenant admins can run storage cleanup';
  END IF;
  
  -- Find and delete orphaned files (files in non-existent tenant folders)
  FOR file_record IN
    SELECT bucket_id, name
    FROM storage.objects
    WHERE bucket_id IN ('tenant-avatars', 'barbershop-images', 'service-images', 'qr-codes', 'documents')
    AND NOT EXISTS (
      SELECT 1 FROM tenants
      WHERE id::text = (storage.foldername(name))[1]
    )
  LOOP
    -- Delete the orphaned file
    DELETE FROM storage.objects
    WHERE bucket_id = file_record.bucket_id
    AND name = file_record.name;
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_tenant_storage_path(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_storage_files() TO authenticated;

-- Note: Indexes on storage.objects cannot be created via migrations due to permission restrictions
-- These indexes should be created manually by the database owner if needed:
-- CREATE INDEX idx_storage_objects_tenant_path
-- ON storage.objects (bucket_id, ((storage.foldername(name))[1]))
-- WHERE bucket_id IN ('tenant-avatars', 'barbershop-images', 'service-images', 'qr-codes', 'documents');

-- Add comments for documentation
COMMENT ON FUNCTION get_tenant_storage_path(UUID, TEXT, TEXT) IS 'Generate tenant-scoped storage path with access validation';
COMMENT ON FUNCTION cleanup_orphaned_storage_files() IS 'Clean up storage files for deleted tenants (admin only)';