import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { createErrorResponse } from './cors.ts'

export interface AuthResult {
  success: true
  user: User
  supabaseClient: SupabaseClient
}

export interface AuthError {
  success: false
  response: Response
}

export async function authenticateUser(req: Request): Promise<AuthResult | AuthError> {
  // Create Supabase client
  const supabaseClient = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  )

  // Get the authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { success: false, response: createErrorResponse('No authorization header', 401) }
  }

  // Verify the user
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (authError || !user) {
    return { success: false, response: createErrorResponse('Invalid token', 401) }
  }

  return { success: true, user, supabaseClient }
}

export interface TenantAccessResult {
  hasAccess: true
  membership: {
    role: string
    tenant: {
      id: string
      name: string
      slug: string
    }
  }
}

export interface TenantAccessError {
  hasAccess: false
  response: Response
}

export async function checkTenantAccess(
  supabaseClient: SupabaseClient, 
  userId: string, 
  tenantId: string,
  requiredRoles: string[] = ['admin', 'manager', 'member']
): Promise<TenantAccessResult | TenantAccessError> {
  const { data: membership, error: membershipError } = await supabaseClient
    .from('tenant_members')
    .select('role, tenant:tenants(id, name, slug)')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (membershipError || !membership) {
    return { hasAccess: false, response: createErrorResponse('User is not a member of this tenant', 403) }
  }

  if (!requiredRoles.includes(membership.role)) {
    return { hasAccess: false, response: createErrorResponse('Insufficient permissions', 403) }
  }

  return { hasAccess: true, membership }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/
  return slugRegex.test(slug)
}

export function generateToken(): string {
  return crypto.randomUUID()
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}