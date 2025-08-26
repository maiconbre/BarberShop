import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticateUser, checkTenantAccess, AuthResult, AuthError } from '../_shared/auth.ts'
import { handleCors, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

interface ProcessPaymentRequest {
  appointment_id: string
  payment_method: 'credit_card' | 'debit_card' | 'pix' | 'cash'
  amount: number
  card_data?: {
    number: string
    holder_name: string
    expiry_month: string
    expiry_year: string
    cvv: string
  }
  pix_data?: {
    payer_name: string
    payer_document: string
  }
}

interface PaymentData {
  amount: number
  payment_method: string
  card_data?: {
    number: string
    holder_name: string
    expiry_month: string
    expiry_year: string
    cvv: string
  }
  pix_data?: {
    payer_name: string
    payer_document: string
  }
}

interface PaymentProvider {
  processPayment(data: PaymentData): Promise<{ success: boolean; transaction_id?: string; error?: string }>
}

// Mock payment provider - replace with actual implementation
class MockPaymentProvider implements PaymentProvider {
  async processPayment(data: PaymentData): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate random success/failure for demo
    const success = Math.random() > 0.1 // 90% success rate
    
    if (success) {
      return {
        success: true,
        transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    } else {
      return {
        success: false,
        error: 'Payment declined by bank'
      }
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
    const { 
      appointment_id, 
      payment_method, 
      amount, 
      card_data, 
      pix_data 
    }: ProcessPaymentRequest = await req.json()

    // Validate required fields
    if (!appointment_id || !payment_method || !amount) {
      return createErrorResponse('appointment_id, payment_method, and amount are required', 400)
    }

    // Validate amount
    if (amount <= 0) {
      return createErrorResponse('Amount must be greater than 0', 400)
    }

    // Get appointment details and verify access
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        client_id,
        barber_id,
        barbershop_id,
        total_price,
        status,
        tenant_id,
        barbershop:barbershops(name),
        client:clients(name, email),
        barber:barbers(name)
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

    // Check if appointment is in a payable state
    if (!['confirmed', 'in_progress', 'completed'].includes(appointment.status)) {
      return createErrorResponse('Appointment is not in a payable state', 400)
    }

    // Validate amount matches appointment total
    if (Math.abs(amount - appointment.total_price) > 0.01) {
      return createErrorResponse('Amount does not match appointment total', 400)
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('id, status')
      .eq('appointment_id', appointment_id)
      .eq('status', 'completed')
      .single()

    if (existingPayment) {
      return createErrorResponse('Payment already processed for this appointment', 409)
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        appointment_id,
        tenant_id: appointment.tenant_id,
        amount,
        payment_method,
        status: 'processing',
        created_by: user.id
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return createErrorResponse('Failed to create payment record', 500)
    }

    let paymentResult
    
    try {
      // Process payment based on method
      const paymentProvider = new MockPaymentProvider()
      
      if (payment_method === 'cash') {
        // Cash payments are automatically successful
        paymentResult = {
          success: true,
          transaction_id: `cash_${Date.now()}`
        }
      } else {
        // Process electronic payment
        const paymentData = {
          amount,
          payment_method,
          card_data,
          pix_data,
          appointment_id,
          customer: {
            name: appointment.client.name,
            email: appointment.client.email
          }
        }
        
        paymentResult = await paymentProvider.processPayment(paymentData)
      }

      // Update payment record with result
      const updateData: {
        status: 'completed' | 'failed'
        processed_at: string
        transaction_id?: string
        error_message?: string
      } = {
        status: paymentResult.success ? 'completed' : 'failed',
        processed_at: new Date().toISOString()
      }

      if (paymentResult.success && paymentResult.transaction_id) {
        updateData.transaction_id = paymentResult.transaction_id
      }

      if (!paymentResult.success && paymentResult.error) {
        updateData.error_message = paymentResult.error
      }

      const { error: updateError } = await supabaseClient
        .from('payments')
        .update(updateData)
        .eq('id', payment.id)

      if (updateError) {
        console.error('Error updating payment record:', updateError)
      }

      // If payment successful, update appointment status
      if (paymentResult.success) {
        await supabaseClient
          .from('appointments')
          .update({ 
            status: 'completed',
            payment_status: 'paid'
          })
          .eq('id', appointment_id)
      }

      // Return result
      if (paymentResult.success) {
        return createSuccessResponse({ 
          payment_id: payment.id,
          transaction_id: paymentResult.transaction_id
        })
      } else {
        return createErrorResponse(paymentResult.error || 'Payment failed', 400)
      }

    } catch (processingError) {
      console.error('Payment processing error:', processingError)
      
      // Update payment record as failed
      await supabaseClient
        .from('payments')
        .update({ 
          status: 'failed',
          error_message: 'Payment processing failed',
          processed_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      return createErrorResponse('Payment processing failed', 500)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})