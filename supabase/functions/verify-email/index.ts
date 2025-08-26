import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'
import { validateEmail } from '../_shared/auth.ts'

interface VerifyEmailRequest {
  email: string
  barbershopName: string
}

interface VerifyCodeRequest {
  email: string
  code: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const path = url.pathname

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
      return createErrorResponse('Configuração do servidor incorreta', 500)
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST' && path.endsWith('/send-code')) {
      // Send verification code
      const { email, barbershopName }: VerifyEmailRequest = await req.json()

      // Validate required fields
      if (!email || !barbershopName) {
        return createErrorResponse('Email e nome da barbearia são obrigatórios', 400)
      }

      // Validate email format
      if (!validateEmail(email)) {
        return createErrorResponse('Formato de email inválido', 400)
      }

      // Send OTP code directly
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email
      })

      if (otpError) {
        console.error('Error sending OTP:', otpError)
        if (otpError.message.includes('rate limit')) {
          return createErrorResponse('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.', 429)
        }
        return createErrorResponse('Erro ao enviar código de verificação', 500)
      }

      return createSuccessResponse({
        message: 'Código de verificação enviado para seu email',
        email: email,
        expiresIn: 3600 // 1 hour
      })

    } else if (req.method === 'POST' && path.endsWith('/verify-code')) {
      // Verify code
      const { email, code }: VerifyCodeRequest = await req.json()

      // Validate required fields
      if (!email || !code) {
        return createErrorResponse('Email e código são obrigatórios', 400)
      }

      // Validate code format
      if (code.length !== 6) {
        return createErrorResponse('Código deve ter 6 dígitos', 400)
      }

      // Verify OTP
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email'
      })

      if (verifyError) {
        console.error('Error verifying OTP:', verifyError)
        if (verifyError.message.includes('expired')) {
          return createErrorResponse('Código de verificação expirado. Solicite um novo código.', 400)
        }
        if (verifyError.message.includes('invalid') || verifyError.message.includes('not found')) {
          return createErrorResponse('Código de verificação inválido. Verifique e tente novamente.', 400)
        }
        return createErrorResponse('Erro ao verificar código', 500)
      }

      if (verifyData.user) {
        // Sign out the temporary user
        await supabase.auth.signOut()
        
        return createSuccessResponse({
          message: 'Email verificado com sucesso',
          email: email,
          verified: true
        })
      }

      return createErrorResponse('Erro inesperado na verificação do código', 500)

    } else {
      return createErrorResponse('Endpoint não encontrado', 404)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Erro interno do servidor', 500)
  }
})