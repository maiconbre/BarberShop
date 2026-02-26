import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, checkTenantAccess, validateEmail, generateToken, AuthResult, AuthError, TenantAccessResult, TenantAccessError } from '../_shared/auth.ts'
import { handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

interface SendInviteRequest {
  email: string
  tenant_id: string
  role: 'admin' | 'manager' | 'member'
  message?: string
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
    const { email, tenant_id, role, message }: SendInviteRequest = await req.json()

    // Validate required fields
    if (!email || !tenant_id || !role) {
      return createErrorResponse('Email, tenant_id, and role are required', 400)
    }

    // Validate email format
    if (!validateEmail(email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'member']
    if (!validRoles.includes(role)) {
      return createErrorResponse('Invalid role. Must be admin, manager, or member', 400)
    }

    // Check if user has permission to invite (admin or manager)
    const accessResult = await checkTenantAccess(supabaseClient, user.id, tenant_id)
    if (!accessResult.hasAccess) {
      return (accessResult as TenantAccessError).response
    }
    
    const { membership } = accessResult as TenantAccessResult

    if (!['admin', 'manager'].includes(membership.role)) {
      return createErrorResponse('Insufficient permissions to send invites', 403)
    }

    // Check if user is already a member
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers()
    const targetUser = existingUser.users.find(u => u.email === email)
    
    if (targetUser) {
      const { data: existingMembership } = await supabaseClient
        .from('tenant_members')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('user_id', targetUser.id)
        .single()

      if (existingMembership) {
        return createErrorResponse('User is already a member of this tenant', 409)
      }
    }

    // Generate invite token
    const inviteToken = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invite record
    const { data: invite, error: inviteError } = await supabaseClient
      .from('tenant_invites')
      .insert({
        tenant_id,
        email,
        role,
        invited_by: user.id,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
        message
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return createErrorResponse('Failed to create invite', 500)
    }

    // Prepare email content
    const inviteUrl = `${Deno.env.get('FRONTEND_URL')}/invite/${inviteToken}`
    const emailSubject = `Convite para ${membership.tenant.name}`
    const emailBody = `
      <h2>Você foi convidado para ${membership.tenant.name}</h2>
      <p>Olá!</p>
      <p>Você foi convidado para fazer parte da equipe <strong>${membership.tenant.name}</strong> como <strong>${role}</strong>.</p>
      ${message ? `<p><em>Mensagem do convite:</em> ${message}</p>` : ''}
      <p>Para aceitar o convite, clique no link abaixo:</p>
      <p><a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Aceitar Convite</a></p>
      <p>Este convite expira em 7 dias.</p>
      <p>Se você não esperava este convite, pode ignorar este email.</p>
    `

    // Send email using Resend (you'll need to configure this)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: Deno.env.get('FROM_EMAIL') || 'noreply@barbershop.com',
            to: [email],
            subject: emailSubject,
            html: emailBody
          })
        })

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text())
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError)
      }
    }

    // Return success response
    return createSuccessResponse({ 
      success: true, 
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        invite_url: inviteUrl
      }
    }, 201)

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})