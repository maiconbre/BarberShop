import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, checkTenantAccess, AuthResult, AuthError } from '../_shared/auth.ts'
import { handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

interface SetTenantRequest {
  tenant_id: string
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
    const { tenant_id }: SetTenantRequest = await req.json()

    // Validate required fields
    if (!tenant_id) {
      return createErrorResponse('tenant_id is required', 400)
    }

    // Check if user is a member of the tenant
    const accessResult = await checkTenantAccess(supabaseClient, user.id, tenant_id)
    if (!accessResult.hasAccess) {
      return createErrorResponse('Access denied to this tenant', 403)
    }
    
    const { membership } = accessResult

    // Update user metadata with current tenant
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          current_tenant_id: tenant_id,
          current_tenant_role: membership.role
        }
      }
    )

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return createErrorResponse('Failed to set current tenant', 500)
    }

    // Return success response with tenant info
    return createSuccessResponse({ 
      success: true, 
      tenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        slug: membership.tenant.slug,
        role: membership.role
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})