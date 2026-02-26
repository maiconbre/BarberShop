import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, AuthResult, AuthError } from '../_shared/auth.ts'
import { handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

interface AcceptInviteRequest {
  token: string
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
    const { token }: AcceptInviteRequest = await req.json()

    // Validate required fields
    if (!token) {
      return createErrorResponse('Token is required', 400)
    }

    // Find the invite
    const { data: invite, error: inviteError } = await supabaseClient
      .from('tenant_invites')
      .select(`
        id,
        tenant_id,
        email,
        role,
        expires_at,
        status,
        tenant:tenants(id, name, slug)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      return createErrorResponse('Invalid or expired invite', 404)
    }

    // Check if invite has expired
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    if (now > expiresAt) {
      // Mark invite as expired
      await supabaseClient
        .from('tenant_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)

      return createErrorResponse('Invite has expired', 410)
    }

    // Check if the user's email matches the invite
    if (user.email !== invite.email) {
      return createErrorResponse('Email does not match invite', 403)
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabaseClient
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', invite.tenant_id)
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      // Mark invite as accepted even though user was already a member
      await supabaseClient
        .from('tenant_invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      return createErrorResponse('User is already a member of this tenant', 409)
    }

    // Create tenant membership
    const { data: membership, error: membershipError } = await supabaseClient
      .from('tenant_members')
      .insert({
        tenant_id: invite.tenant_id,
        user_id: user.id,
        role: invite.role,
        invited_by: user.id, // This should ideally be the original inviter
        status: 'active'
      })
      .select()
      .single()

    if (membershipError) {
      console.error('Error creating membership:', membershipError)
      return createErrorResponse('Failed to create membership', 500)
    }

    // Mark invite as accepted
    const { error: updateInviteError } = await supabaseClient
      .from('tenant_invites')
      .update({ 
        status: 'accepted', 
        accepted_at: new Date().toISOString(),
        accepted_by: user.id
      })
      .eq('id', invite.id)

    if (updateInviteError) {
      console.error('Error updating invite status:', updateInviteError)
      // Don't fail the request, membership was created successfully
    }

    // Update user metadata with current tenant if they don't have one set
    if (!user.user_metadata?.current_tenant_id) {
      await supabaseClient.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            current_tenant_id: invite.tenant_id,
            current_tenant_role: invite.role
          }
        }
      )
    }

    // Return success response
    return createSuccessResponse({ 
      success: true, 
      tenant: {
        id: invite.tenant.id,
        name: invite.tenant.name,
        slug: invite.tenant.slug,
        role: invite.role
      },
      membership: {
        id: membership.id,
        role: membership.role,
        status: membership.status,
        created_at: membership.created_at
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})