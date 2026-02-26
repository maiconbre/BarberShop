import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, validateSlug, AuthResult, AuthError } from '../_shared/auth.ts'
import { handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

interface CreateTenantRequest {
  name: string
  slug: string
  description?: string
  settings?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Authenticate user
    const authResult = await authenticateUser(req)
    if (!authResult.success) {
      return (authResult as AuthError).response
    }
    
    const { user, supabaseClient } = authResult as AuthResult

    // Parse request body
    const { name, slug, description, settings }: CreateTenantRequest = await req.json()

    // Validate required fields
    if (!name || !slug) {
      return createErrorResponse('Name and slug are required', 400)
    }

    // Validate slug format
    if (!validateSlug(slug)) {
      return createErrorResponse('Slug must contain only lowercase letters, numbers, and hyphens', 400)
    }

    // Check if slug already exists
    const { data: existingTenant } = await supabaseClient
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingTenant) {
      return createErrorResponse('Slug already exists', 409)
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .insert({
        name,
        slug,
        description,
        settings: settings || {},
        created_by: user.id
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      return createErrorResponse('Failed to create tenant', 500)
    }

    // Add user as admin member of the tenant
    const { error: memberError } = await supabaseClient
      .from('tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'admin',
        invited_by: user.id
      })

    if (memberError) {
      console.error('Error adding tenant member:', memberError)
      // Try to cleanup the tenant if member creation fails
      await supabaseClient
        .from('tenants')
        .delete()
        .eq('id', tenant.id)
      
      return createErrorResponse('Failed to create tenant membership', 500)
    }

    // Return success response
    return createSuccessResponse({ 
      success: true, 
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description,
        settings: tenant.settings,
        created_at: tenant.created_at
      }
    }, 201)

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})