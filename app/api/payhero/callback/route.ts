import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PayheroCallback } from '@/lib/payhero/types'

// ⚠️ Use SERVICE ROLE client for webhook — it bypasses RLS
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PayheroCallback
    console.log('[Payhero Callback]', JSON.stringify(body, null, 2))

    const r = body?.response
    if (!r) {
      console.error('[Payhero Callback] Invalid payload')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const externalRef = r.ExternalReference
    const checkoutId = r.CheckoutRequestID

    if (!externalRef && !checkoutId) {
      return NextResponse.json({ error: 'No reference found' }, { status: 400 })
    }

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
      console.error('[Payhero Callback] Transaction not found:', { externalRef, checkoutId })
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Determine status
    const isSuccess = r.ResultCode === 0 || r.Status === 'Success'
    const isCancelled = /cancel|user cancel/i.test(r.ResultDesc ?? '') || r.ResultCode === 1032
    const newStatus = isSuccess ? 'success' : isCancelled ? 'cancelled' : 'failed'

    // Update transaction
    const { error: updateErr } = await supabase
      .from('transactions')
      .update({
        status: newStatus,
        status_message: r.ResultDesc ?? r.Status,
        mpesa_receipt: r.MpesaReceiptNumber ?? null,
        completed_at: new Date().toISOString(),
        raw_callback: body,
      })
      .eq('id', txn.id)

    if (updateErr) {
      console.error('[Payhero Callback] DB update failed:', updateErr)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    const metadata = txn.metadata ?? {}

    // RENEWAL HANDLING (priority — check first)
    if (metadata.isRenewal && metadata.renewalId) {
      await handleRenewal(supabase, txn, metadata, isSuccess, isCancelled, r)
      return NextResponse.json({ received: true, kind: 'renewal' })
    }

    // ── Regular fulfillment ──
    if (isSuccess) {
      await handleSuccessfulPayment(supabase, txn)
    } else {
      await handleFailedPayment(supabase, txn, r.ResultDesc ?? 'Payment failed')
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Payhero Callback] Fatal error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════

// ── Renewal Handler ───────────────────────────────────
async function handleRenewal(
  supabase: any,
  txn: any,
  metadata: any,
  isSuccess: boolean,
  isCancelled: boolean,
  r: any
) {
  const { renewalId, subscriptionId } = metadata

  await supabase
    .from('subscription_renewals')
    .update({
      status: isSuccess ? 'success' : isCancelled ? 'user_cancelled' : 'failed',
      amount: txn.amount,
      payhero_reference: r.CheckoutRequestID ?? null,
      mpesa_receipt: r.MpesaReceiptNumber ?? null,
      failure_reason: !isSuccess ? r.ResultDesc ?? 'Unknown error' : null,
    })
    .eq('id', renewalId)

  if (isSuccess) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('expires_at, tier')
      .eq('id', subscriptionId)
      .single()

    if (sub) {
      const planDays =
        sub.tier === 'daily' ? 1 :
        sub.tier === 'weekly' ? 7 :
        sub.tier === 'monthly' ? 30 : 365

      const currentExpiry = new Date(sub.expires_at)
      const newExpiry = new Date(currentExpiry.getTime() + planDays * 24 * 60 * 60 * 1000)
      const newRenewalAt = new Date(newExpiry.getTime() - 24 * 60 * 60 * 1000)

      await supabase
        .from('subscriptions')
        .update({
          expires_at: newExpiry.toISOString(),
          next_renewal_at: newRenewalAt.toISOString(),
          renewal_attempts: 0,
          status: 'active',
          grace_period_ends_at: null,
        })
        .eq('id', subscriptionId)

      if (txn.user_id) {
        await supabase.from('notification_logs').insert({
          user_id: txn.user_id,
          title: 'Subscription Renewed! 🎉',
          body: `Your ${sub.tier} plan has been renewed for ${planDays} more days. M-Pesa receipt: ${r.MpesaReceiptNumber}`,
          metadata: { type: 'subscription_renewal', subscriptionId, renewalId },
        })
      }
    }
  } else {
    // Failed renewal → 3-day grace period
    const gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    await supabase
      .from('subscriptions')
      .update({
        grace_period_ends_at: gracePeriodEnd,
        last_renewal_attempt_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)

    if (txn.user_id) {
      await supabase.from('notification_logs').insert({
        user_id: txn.user_id,
        title: '⚠️ Subscription Renewal Failed',
        body: isCancelled
          ? `You cancelled the M-Pesa prompt. We'll try again later. Renew manually anytime.`
          : `Renewal failed: ${r.ResultDesc ?? 'Please try again'}. You have 3 days to renew before your plan expires.`,
        metadata: { type: 'renewal_failed', subscriptionId, renewalId },
      })
    }
  }
}

// ── Successful Payment Handler ──────────────────────────
async function handleSuccessfulPayment(supabase: any, txn: any) {
  console.log('[Payhero] Payment successful:', txn.reference, 'purpose:', txn.purpose)

  const metadata = txn.metadata ?? {}

  switch (txn.purpose) {
    case 'meal_order':
      if (txn.related_id) {
        await supabase
          .from('orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', txn.related_id)
      }
      break

    // SUBSCRIPTION ACTIVATION (with auto-renew setup)
    case 'subscription': {
        if (!txn.related_id) {
          console.warn('[Payhero] Subscription without related_id, skipping')
          break
        }
      
        const tier = metadata.tier ?? 'monthly'
        const durationDays = metadata.durationDays ?? 30
        const billingType = metadata.billingType ?? 'one-time'
        const phoneToSave = metadata.phoneToSave
      
        const now = new Date()
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
        const nextRenewalAt = billingType === 'auto-renew'
          ? new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000).toISOString()
          : null
      
        // Activate the pending subscription — this is the single source of truth
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            billing_type: billingType,
            auto_renew: billingType === 'auto-renew',
            auto_renew_phone: billingType === 'auto-renew' ? phoneToSave : null,
            next_renewal_at: nextRenewalAt,
          })
          .eq('id', txn.related_id)
      
        break
      }

    // VENDOR SUBSCRIPTION
    case 'vendor_subscription':
    case 'vendor_listing': {
      if (!txn.related_id) break

      const tier = metadata.tier ?? 'monthly'
      const durationDays = metadata.durationDays ?? 30
      const billingType = metadata.billingType ?? 'one-time'
      const phoneToSave = metadata.phoneToSave

      const now = new Date()
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
      const nextRenewalAt =
        billingType === 'auto-renew'
          ? new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000).toISOString()
          : null

      // Activate pending vendor subscription
      await supabase
        .from('vendor_subscriptions')
        .update({
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          billing_type: billingType,
          auto_renew: billingType === 'auto-renew',
          auto_renew_phone: billingType === 'auto-renew' ? phoneToSave : null,
          next_renewal_at: nextRenewalAt,
        })
        .eq('id', txn.related_id)

      // Update vendor record
      await supabase
        .from('vendors')
        .update({
          is_active: true,
          subscription_tier: tier,
          subscription_end_date: expiresAt.toISOString(),
          subscription_paid_at: now.toISOString(),
        })
        .eq('id', txn.related_id)
      break
    }

    case 'shopping_cart': {
     if (!txn.related_id) break
  // Mark all items in the shopping list as paid (we delete them in clearPaidItemsAction)
  // Or you could mark them with a status flag here if you want history
    console.log('[Payhero] Shopping cart paid:', txn.related_id)

  // Optional: Create an order record for tracking
  // await supabase.from('orders').insert({ ... })
    break
  }

    default:
      console.log('[Payhero] No handler for purpose:', txn.purpose)
  }

  // ── Send success notification ──
  if (txn.user_id) {
    await supabase.from('notification_logs').insert({
      user_id: txn.user_id,
      title: 'Payment Successful! 🎉',
      body: `Your payment of KES ${txn.amount.toLocaleString()} was received. M-Pesa receipt: ${txn.mpesa_receipt}`,
      metadata: { type: 'payment', reference: txn.reference },
    })
  }
}

// ── Failed Payment Handler ────────────────────────────
async function handleFailedPayment(supabase: any, txn: any, reason: string) {
  console.log('[Payhero] Payment failed:', txn.reference, reason)

  const metadata = txn.metadata ?? {}

  // Clean up pending subscriptions if payment failed
  if (txn.related_id && (txn.purpose === 'subscription' || txn.purpose === 'vendor_subscription')) {
    const table = txn.purpose === 'vendor_subscription' ? 'vendor_subscriptions' : 'subscriptions'
    await supabase
      .from(table)
      .update({ status: 'failed' })
      .eq('id', txn.related_id)
      .eq('status', 'pending')   // Only if still pending — don't disable an existing active sub
  }

  // Notify user
  if (txn.user_id) {
    await supabase.from('notification_logs').insert({
      user_id: txn.user_id,
      title: 'Payment Failed',
      body: `Your payment of KES ${txn.amount.toLocaleString()} did not go through: ${reason}. Please try again.`,
      metadata: { type: 'payment_failed', reference: txn.reference },
    })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Payhero Webhook',
    timestamp: new Date().toISOString(),
  })
}