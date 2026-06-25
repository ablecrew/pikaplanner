// app/api/payhero/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[PayHero Webhook] Received:', JSON.stringify(body, null, 2))

    const r = body?.response
    if (!r) {
      console.error('[PayHero Webhook] Invalid payload')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const externalRef = r.ExternalReference
    const checkoutId = r.CheckoutRequestID

    console.log('[PayHero Webhook] Looking for transaction...', { externalRef, checkoutId })

    // Find transaction
    let { data: txn } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', externalRef ?? '')
      .maybeSingle()

    if (!txn && checkoutId) {
      const { data: byCheckout } = await supabase
        .from('transactions')
        .select('*')
        .eq('payhero_reference', checkoutId)
        .maybeSingle()
      txn = byCheckout
    }

    if (!txn) {
      console.error('[PayHero Webhook] Transaction not found')
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.log('[PayHero Webhook] Found transaction:', txn.id, 'Purpose:', txn.purpose, 'Related ID:', txn.related_id)

    // Determine status
    const isSuccess = r.ResultCode === 0 || r.Status === 'Success'
    const newStatus = isSuccess ? 'success' : 'failed'

    console.log('[PayHero Webhook] Payment status:', newStatus, 'ResultCode:', r.ResultCode)

    // Update transaction
    await supabase
      .from('transactions')
      .update({
        status: newStatus,
        status_message: r.ResultDesc ?? r.Status,
        mpesa_receipt: r.MpesaReceiptNumber ?? null,
        completed_at: new Date().toISOString(),
        raw_callback: body,
      })
      .eq('id', txn.id)

    // ✅ CRITICAL: Activate subscription if payment successful
    if (isSuccess && txn.purpose === 'subscription' && txn.related_id) {
      console.log('[PayHero Webhook] Activating subscription:', txn.related_id)

      const metadata = txn.metadata ?? {}
      const durationDays = metadata.durationDays ?? 30

      const now = new Date()
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

      // Update subscription to active
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          amount_paid: txn.amount,
          updated_at: now.toISOString(),
        })
        .eq('id', txn.related_id)

      if (subError) {
        console.error('[PayHero Webhook] Failed to activate subscription:', subError)
      } else {
        console.log('[PayHero Webhook] ✅ Subscription activated successfully')
      }
    }

    // Send notification
    if (txn.user_id) {
      await supabase.from('notification_logs').insert({
        user_id: txn.user_id,
        title: isSuccess ? 'Payment Successful! 🎉' : 'Payment Failed',
        body: isSuccess 
          ? `Your payment of KES ${txn.amount} was received. M-Pesa receipt: ${r.MpesaReceiptNumber ?? 'N/A'}`
          : `Your payment of KES ${txn.amount} failed: ${r.ResultDesc ?? 'Unknown error'}`,
        type: 'payment',
        channel: 'in_app',
        is_read: false,
        sent_at: new Date().toISOString(),
        metadata: { transaction_id: txn.id, reference: txn.reference },
      })
    }

    console.log('[PayHero Webhook] ✅ Webhook completed successfully')
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[PayHero Webhook] Fatal error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'PayHero Webhook',
    timestamp: new Date().toISOString(),
  })
}