// app/api/payhero/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const body = await req.json()
    console.log('[Payhero Callback] Received webhook:', JSON.stringify(body, null, 2))

    const r = body?.response
    if (!r) {
      console.error('[Payhero Callback] Invalid payload - no response object')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = getServiceClient()
    
    // ✅ FIXED: Use correct field names from PayHero
    const externalRef = r.User_Reference ?? r.Transaction_Reference
    const checkoutId = r.Transaction_Reference ?? r.MPESA_REFERENCE
    const mpesaReceipt = r.MPESA_REFERENCE ?? r.Transaction_Reference
    const paymentStatus = r.woocommerce_payment_status ?? r.Status
    
    console.log('[Payhero Callback] Extracted references:', { 
      externalRef, 
      checkoutId, 
      mpesaReceipt,
      paymentStatus 
    })

    if (!externalRef && !checkoutId) {
      console.error('[Payhero Callback] No reference found in payload')
      return NextResponse.json({ error: 'No reference found' }, { status: 400 })
    }

    // Find transaction
    let { data: txn, error: txnError } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', externalRef ?? '')
      .maybeSingle()

    if (txnError) {
      console.error('[Payhero Callback] Error finding transaction by reference:', txnError)
    }

    if (!txn && checkoutId) {
      const { data: byCheckout, error: checkoutError } = await supabase
        .from('transactions')
        .select('*')
        .eq('payhero_reference', checkoutId)
        .maybeSingle()
      
      if (checkoutError) {
        console.error('[Payhero Callback] Error finding transaction by checkout ID:', checkoutError)
      }
      
      txn = byCheckout
    }

    if (!txn) {
      console.error('[Payhero Callback] Transaction not found:', { externalRef, checkoutId })
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.log('[Payhero Callback] Found transaction:', {
      id: txn.id,
      reference: txn.reference,
      purpose: txn.purpose,
      related_id: txn.related_id,
      current_status: txn.status,
    })

    // ✅ FIXED: Determine status from woocommerce_payment_status
    const isSuccess = paymentStatus === 'complete' || paymentStatus === 'Success' || paymentStatus === 'success'
    const isCancelled = paymentStatus === 'cancelled' || paymentStatus === 'Cancelled'
    const newStatus = isSuccess ? 'success' : isCancelled ? 'cancelled' : 'failed'

    console.log('[Payhero Callback] Payment result:', {
      isSuccess,
      isCancelled,
      newStatus,
      paymentStatus,
    })

    // Update transaction
    const { error: updateErr } = await supabase
      .from('transactions')
      .update({
        status: newStatus,
        status_message: paymentStatus ?? 'Payment completed',
        mpesa_receipt: mpesaReceipt ?? null,
        completed_at: new Date().toISOString(),
        raw_callback: body,
      })
      .eq('id', txn.id)

    if (updateErr) {
      console.error('[Payhero Callback] Failed to update transaction:', updateErr)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    console.log('[Payhero Callback] Transaction updated successfully')

    const metadata = txn.metadata ?? {}

    // RENEWAL HANDLING (priority — check first)
    if (metadata.isRenewal && metadata.renewalId) {
      console.log('[Payhero Callback] Processing renewal...', { renewalId: metadata.renewalId })
      await handleRenewal(supabase, txn, metadata, isSuccess, isCancelled, r)
      return NextResponse.json({ received: true, kind: 'renewal' })
    }

    // ── Regular fulfillment ──
    if (isSuccess) {
      console.log('[Payhero Callback] Processing successful payment...')
      await handleSuccessfulPayment(supabase, txn)
    } else {
      console.log('[Payhero Callback] Processing failed payment...')
      await handleFailedPayment(supabase, txn, paymentStatus ?? 'Payment failed')
    }

    console.log('[Payhero Callback] Webhook completed successfully')
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

  const { error: renewalErr } = await supabase
    .from('subscription_renewals')
    .update({
      status: isSuccess ? 'success' : isCancelled ? 'user_cancelled' : 'failed',
      amount: txn.amount,
      payhero_reference: r.Transaction_Reference ?? r.MPESA_REFERENCE ?? null,
      mpesa_receipt: r.MPESA_REFERENCE ?? null,
      failure_reason: !isSuccess ? (r.woocommerce_payment_status ?? 'Unknown error') : null,
    })
    .eq('id', renewalId)

  if (renewalErr) {
    console.error('[Payhero Callback] Failed to update renewal:', renewalErr)
  }

  if (isSuccess) {
    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .select('expires_at, tier')
      .eq('id', subscriptionId)
      .single()

    if (subErr) {
      console.error('[Payhero Callback] Failed to fetch subscription for renewal:', subErr)
      return
    }

    if (sub) {
      const planDays =
        sub.tier === 'daily' ? 1 :
        sub.tier === 'weekly' ? 7 :
        sub.tier === 'monthly' ? 30 : 365

      const currentExpiry = new Date(sub.expires_at)
      const newExpiry = new Date(currentExpiry.getTime() + planDays * 24 * 60 * 60 * 1000)
      const newRenewalAt = new Date(newExpiry.getTime() - 24 * 60 * 60 * 1000)

      const { error: updateErr } = await supabase
        .from('subscriptions')
        .update({
          expires_at: newExpiry.toISOString(),
          next_renewal_at: newRenewalAt.toISOString(),
          renewal_attempts: 0,
          status: 'active',
          grace_period_ends_at: null,
        })
        .eq('id', subscriptionId)

      if (updateErr) {
        console.error('[Payhero Callback] Failed to activate renewed subscription:', updateErr)
      } else {
        console.log('[Payhero Callback] ✅ Renewal subscription activated:', subscriptionId)
      }

      if (txn.user_id) {
        await supabase.from('notification_logs').insert({
          user_id: txn.user_id,
          title: 'Subscription Renewed! 🎉',
          body: `Your ${sub.tier} plan has been renewed for ${planDays} more days. M-Pesa receipt: ${r.MPESA_REFERENCE}`,
          metadata: { type: 'subscription_renewal', subscriptionId, renewalId },
        })
      }
    }
  } else {
    // Failed renewal → 3-day grace period
    const gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    const { error: graceErr } = await supabase
      .from('subscriptions')
      .update({
        grace_period_ends_at: gracePeriodEnd,
        last_renewal_attempt_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)

    if (graceErr) {
      console.error('[Payhero Callback] Failed to set grace period:', graceErr)
    }

    if (txn.user_id) {
      await supabase.from('notification_logs').insert({
        user_id: txn.user_id,
        title: '⚠️ Subscription Renewal Failed',
        body: isCancelled
          ? `You cancelled the M-Pesa prompt. We'll try again later. Renew manually anytime.`
          : `Renewal failed: ${r.woocommerce_payment_status ?? 'Please try again'}. You have 3 days to renew before your plan expires.`,
        metadata: { type: 'renewal_failed', subscriptionId, renewalId },
      })
    }
  }
}

// ── Successful Payment Handler ──────────────────────────
async function handleSuccessfulPayment(supabase: any, txn: any) {
  console.log('[Payhero] Payment successful:', txn.reference, 'purpose:', txn.purpose, 'related_id:', txn.related_id)

  const metadata = txn.metadata ?? {}

  switch (txn.purpose) {
    case 'meal_order':
      if (txn.related_id) {
        const { error: orderErr } = await supabase
          .from('orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', txn.related_id)
        
        if (orderErr) {
          console.error('[Payhero] Failed to update order:', orderErr)
        } else {
          console.log('[Payhero] ✅ Order updated:', txn.related_id)
        }
      }
      break

    // SUBSCRIPTION ACTIVATION (with auto-renew setup)
    case 'subscription': {
      if (!txn.related_id) {
        console.warn('[Payhero] Subscription payment without related_id, skipping activation')
        break
      }

      console.log('[Payhero] Activating subscription:', txn.related_id)

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
      const { data: updatedSub, error: subErr } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          billing_type: billingType,
          auto_renew: billingType === 'auto-renew',
          auto_renew_phone: billingType === 'auto-renew' ? phoneToSave : null,
          next_renewal_at: nextRenewalAt,
          amount_paid: txn.amount,
          updated_at: now.toISOString(),
        })
        .eq('id', txn.related_id)
        .select()
        .single()

      if (subErr) {
        console.error('[Payhero] ❌ FAILED to activate subscription:', txn.related_id, subErr)
      } else {
        console.log('[Payhero] ✅ SUCCESS - Subscription activated:', {
          id: txn.related_id,
          status: updatedSub?.status,
          expires_at: updatedSub?.expires_at,
        })
      }

      break
    }

    // VENDOR SUBSCRIPTION
    case 'vendor_subscription':
    case 'vendor_listing': {
      if (!txn.related_id) {
        console.warn('[Payhero] Vendor subscription without related_id, skipping')
        break
      }

      console.log('[Payhero] Activating vendor subscription:', txn.related_id)

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
      const { error: vendorSubErr } = await supabase
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

      if (vendorSubErr) {
        console.error('[Payhero] ❌ FAILED to activate vendor subscription:', txn.related_id, vendorSubErr)
      } else {
        console.log('[Payhero] ✅ SUCCESS - Vendor subscription activated:', txn.related_id)
      }

      // Update vendor record
      const { error: vendorErr } = await supabase
        .from('vendors')
        .update({
          is_active: true,
          subscription_tier: tier,
          subscription_end_date: expiresAt.toISOString(),
          subscription_paid_at: now.toISOString(),
        })
        .eq('id', txn.related_id)

      if (vendorErr) {
        console.error('[Payhero] Failed to update vendor record:', vendorErr)
      } else {
        console.log('[Payhero] ✅ Vendor record updated:', txn.related_id)
      }

      break
    }

    case 'shopping_cart': {
      if (!txn.related_id) {
        console.warn('[Payhero] Shopping cart without related_id, skipping')
        break
      }
      
      console.log('[Payhero] Shopping cart paid:', txn.related_id)
      break
    }

    default:
      console.log('[Payhero] No handler for purpose:', txn.purpose)
  }

  // ── Send success notification ──
  if (txn.user_id) {
    const { error: notifErr } = await supabase.from('notification_logs').insert({
      user_id: txn.user_id,
      title: 'Payment Successful! 🎉',
      body: `Your payment of KES ${txn.amount.toLocaleString()} was received. M-Pesa receipt: ${txn.mpesa_receipt ?? 'N/A'}`,
      metadata: { type: 'payment', reference: txn.reference, transaction_id: txn.id },
    })
  
    if (notifErr) {
      console.error('[Payhero] Failed to send notification:', notifErr)
    }
  }
}

// ── Failed Payment Handler ────────────────────────────
async function handleFailedPayment(supabase: any, txn: any, reason: string) {
  console.log('[Payhero] Payment failed:', txn.reference, 'reason:', reason)

  const metadata = txn.metadata ?? {}

  // Clean up pending subscriptions if payment failed
  if (txn.related_id && (txn.purpose === 'subscription' || txn.purpose === 'vendor_subscription')) {
    const table = txn.purpose === 'vendor_subscription' ? 'vendor_subscriptions' : 'subscriptions'
    
    console.log('[Payhero] Marking', table, 'as failed:', txn.related_id)
    
    const { error: failErr } = await supabase
      .from(table)
      .update({ status: 'failed' })
      .eq('id', txn.related_id)
      .eq('status', 'pending')

    if (failErr) {
      console.error('[Payhero] Failed to mark subscription as failed:', failErr)
    } else {
      console.log('[Payhero] ✅ Subscription marked as failed:', txn.related_id)
    }
  }

  // Notify user
  if (txn.user_id) {
    const { error: notifErr } = await supabase.from('notification_logs').insert({
      user_id: txn.user_id,
      title: 'Payment Failed',
      body: `Your payment of KES ${txn.amount.toLocaleString()} did not go through: ${reason}. Please try again.`,
      metadata: { type: 'payment_failed', reference: txn.reference, transaction_id: txn.id },
    })

    if (notifErr) {
      console.error('[Payhero] Failed to send failure notification:', notifErr)
    }
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