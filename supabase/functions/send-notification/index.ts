import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, checkTenantAccess, AuthResult, AuthError } from '../_shared/auth.ts'
import { handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

interface SendNotificationRequest {
  type: 'appointment_confirmation' | 'appointment_reminder' | 'appointment_cancellation' | 'payment_confirmation'
  appointment_id: string
  channels: ('email' | 'sms')[] 
  custom_message?: string
}

interface NotificationTemplate {
  subject: string
  emailBody: string
  smsBody: string
}

interface NotificationData {
  barbershop: { name: string }
  client: { name: string }
  barber: { name: string }
  appointment: { scheduled_at: string; total_price: number }
  services: Array<{ name: string }>
}

class NotificationService {
  public getTemplate(type: string, data: NotificationData): NotificationTemplate {
    const templates = {
      appointment_confirmation: {
        subject: `Agendamento Confirmado - ${data.barbershop.name}`,
        emailBody: `
          <h2>Agendamento Confirmado!</h2>
          <p>Olá ${data.client.name},</p>
          <p>Seu agendamento foi confirmado com sucesso:</p>
          <ul>
            <li><strong>Barbearia:</strong> ${data.barbershop.name}</li>
            <li><strong>Barbeiro:</strong> ${data.barber.name}</li>
            <li><strong>Data:</strong> ${new Date(data.appointment.scheduled_at).toLocaleDateString('pt-BR')}</li>
            <li><strong>Horário:</strong> ${new Date(data.appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</li>
            <li><strong>Serviços:</strong> ${data.services.map((s) => s.name).join(', ')}</li>
            <li><strong>Total:</strong> R$ ${data.appointment.total_price.toFixed(2)}</li>
          </ul>
          <p>Aguardamos você!</p>
        `,
        smsBody: `Agendamento confirmado em ${data.barbershop.name} com ${data.barber.name} para ${new Date(data.appointment.scheduled_at).toLocaleDateString('pt-BR')} às ${new Date(data.appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Total: R$ ${data.appointment.total_price.toFixed(2)}`
      },
      appointment_reminder: {
        subject: `Lembrete: Agendamento Amanhã - ${data.barbershop.name}`,
        emailBody: `
          <h2>Lembrete do seu Agendamento</h2>
          <p>Olá ${data.client.name},</p>
          <p>Este é um lembrete do seu agendamento:</p>
          <ul>
            <li><strong>Barbearia:</strong> ${data.barbershop.name}</li>
            <li><strong>Barbeiro:</strong> ${data.barber.name}</li>
            <li><strong>Data:</strong> ${new Date(data.appointment.scheduled_at).toLocaleDateString('pt-BR')}</li>
            <li><strong>Horário:</strong> ${new Date(data.appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</li>
          </ul>
          <p>Não se esqueça!</p>
        `,
        smsBody: `Lembrete: Agendamento amanhã em ${data.barbershop.name} com ${data.barber.name} às ${new Date(data.appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Não se esqueça!`
      },
      appointment_cancellation: {
        subject: `Agendamento Cancelado - ${data.barbershop.name}`,
        emailBody: `
          <h2>Agendamento Cancelado</h2>
          <p>Olá ${data.client.name},</p>
          <p>Informamos que seu agendamento foi cancelado:</p>
          <ul>
            <li><strong>Barbearia:</strong> ${data.barbershop.name}</li>
            <li><strong>Barbeiro:</strong> ${data.barber.name}</li>
            <li><strong>Data:</strong> ${new Date(data.appointment.scheduled_at).toLocaleDateString('pt-BR')}</li>
            <li><strong>Horário:</strong> ${new Date(data.appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</li>
          </ul>
          <p>Entre em contato conosco para reagendar.</p>
        `,
        smsBody: `Agendamento cancelado em ${data.barbershop.name} para ${new Date(data.appointment.scheduled_at).toLocaleDateString('pt-BR')} às ${new Date(data.appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Entre em contato para reagendar.`
      },
      payment_confirmation: {
        subject: `Pagamento Confirmado - ${data.barbershop.name}`,
        emailBody: `
          <h2>Pagamento Confirmado!</h2>
          <p>Olá ${data.client.name},</p>
          <p>Confirmamos o recebimento do seu pagamento:</p>
          <ul>
            <li><strong>Valor:</strong> R$ ${data.payment.amount.toFixed(2)}</li>
            <li><strong>Método:</strong> ${data.payment.payment_method}</li>
            <li><strong>Data:</strong> ${new Date(data.payment.processed_at).toLocaleDateString('pt-BR')}</li>
            ${data.payment.transaction_id ? `<li><strong>ID da Transação:</strong> ${data.payment.transaction_id}</li>` : ''}
          </ul>
          <p>Obrigado pela preferência!</p>
        `,
        smsBody: `Pagamento confirmado! R$ ${data.payment.amount.toFixed(2)} via ${data.payment.payment_method}. Obrigado!`
      }
    }

    return templates[type as keyof typeof templates] || {
      subject: 'Notificação',
      emailBody: 'Você tem uma nova notificação.',
      smsBody: 'Você tem uma nova notificação.'
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email')
      return false
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: Deno.env.get('FROM_EMAIL') || 'noreply@barbershop.com',
          to: [to],
          subject,
          html: body
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioSid || !twilioToken || !twilioPhone) {
      console.warn('Twilio credentials not configured, skipping SMS')
      return false
    }

    try {
      const auth = btoa(`${twilioSid}:${twilioToken}`)
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: twilioPhone,
          To: to,
          Body: message
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error sending SMS:', error)
      return false
    }
  }
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
    const { type, appointment_id, channels, custom_message }: SendNotificationRequest = await req.json()

    // Validate required fields
    if (!type || !appointment_id || !channels || channels.length === 0) {
      return createErrorResponse('type, appointment_id, and channels are required', 400)
    }

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        total_price,
        status,
        tenant_id,
        client:clients(id, name, email, phone),
        barber:barbers(id, name),
        barbershop:barbershops(id, name),
        appointment_services(service:services(name, price))
      `)
      .eq('id', appointment_id)
      .single()

    if (appointmentError || !appointment) {
      return createErrorResponse('Appointment not found', 404)
    }

    // Check if user has access to this tenant
    const tenantAccess = await checkTenantAccess(supabaseClient, user.id, appointment.tenant_id)
    if (!tenantAccess.hasAccess) {
      return createErrorResponse('Access denied to this appointment', 403)
    }

    // Get payment data if needed
    let paymentData = null
    if (type === 'payment_confirmation') {
      const { data: payment } = await supabaseClient
        .from('payments')
        .select('amount, payment_method, processed_at, transaction_id')
        .eq('appointment_id', appointment_id)
        .eq('status', 'completed')
        .single()
      
      paymentData = payment
    }

    // Prepare notification data
    const notificationData = {
      appointment,
      client: appointment.client,
      barber: appointment.barber,
      barbershop: appointment.barbershop,
      services: appointment.appointment_services.map((as) => as.service),
      payment: paymentData
    }

    // Get notification template
    const notificationService = new NotificationService()
    const template = notificationService.getTemplate(type, notificationData)

    // Override with custom message if provided
    if (custom_message) {
      template.emailBody = custom_message
      template.smsBody = custom_message
    }

    const results = {
      email: false,
      sms: false
    }

    // Send notifications
    if (channels.includes('email') && appointment.client.email) {
      results.email = await notificationService.sendEmail(
        appointment.client.email,
        template.subject,
        template.emailBody
      )
    }

    if (channels.includes('sms') && appointment.client.phone) {
      results.sms = await notificationService.sendSMS(
        appointment.client.phone,
        template.smsBody
      )
    }

    // Log notification attempt
    await supabaseClient
      .from('notification_logs')
      .insert({
        tenant_id: appointment.tenant_id,
        appointment_id,
        type,
        channels,
        email_sent: results.email,
        sms_sent: results.sms,
        sent_by: user.id
      })

    // Return results
    return createSuccessResponse({ results })

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})