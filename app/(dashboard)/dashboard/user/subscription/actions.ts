'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type BillingType = 'one-time' | 'auto-renew'

export type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export type Subscription = {
  id: string
  tier: string
  status: string
  starts_at: string
  expires_at: string | null
  amount_paid: number
  auto_renew: boolean
  billing_type?: BillingType
  auto_renew_phone?: string | null
  next_renewal_at?: string | null
  cancelled_at?: string | null
  renewal_attempts?: number
  grace_period_ends_at?: string | null
}

export type RenewalHistoryItem = {
  id: string
  attempted_at: string
  status: 'pending' | 'success' | 'failed' | 'user_cancelled'
  amount: number | null
  mpesa_receipt: string | null
  failure_reason: string | null
}

// ── Main Fetcher ──────────────────────────────────────────
export async function fetchSubscriptionData(userId: string) {
  const supabase = await createClient()

  const [profileRes, subRes, historyRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, phone').eq('id', userId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('subscription_renewals')
      .select('id, attempted_at, status, amount, mpesa_receipt, failure_reason')
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false })
      .limit(5),
  ])

  return {
    profile: profileRes.data as UserProfile | null,
    subscription: subRes.data as Subscription | null,
    renewalHistory: (historyRes.data ?? []) as RenewalHistoryItem[],
  }
}

// ── Status Polling (after payment) ────────────────────────
export async function checkSubscriptionStatusAction(
  subscriptionId: string,  // ✅ Changed from userId to subscriptionId
  tier: string,
  isVendor: boolean
): Promise<{ active: boolean; failed: boolean; subscription: Subscription | null }> {
  const supabase = await createClient()

  // 1. Check DB first — query by subscription ID directly
  const table = isVendor ? 'vendor_subscriptions' : 'subscriptions'
  const { data: sub } = await supabase
    .from(table)
    .select('*')
    .eq('id', subscriptionId)  // ✅ Query by ID, not user_id + tier
    .maybeSingle()

  if (!sub) {
    console.log('[checkSubscriptionStatus] No subscription found:', subscriptionId)
    return { active: false, failed: false, subscription: null }
  }

  // 2. If already active, return immediately
  if (sub.status === 'active') {
    console.log('[checkSubscriptionStatus] Subscription already active:', subscriptionId)
    return { active: true, failed: false, subscription: sub as Subscription }
  }

  // 3. If failed, return immediately
  if (sub.status === 'failed') {
    console.log('[checkSubscriptionStatus] Subscription failed:', subscriptionId)
    return { active: false, failed: true, subscription: sub as Subscription }
  }

  // 4. If still pending — query Payhero directly to check payment status
  if (sub.status === 'pending') {
    console.log('[checkSubscriptionStatus] Subscription pending, checking Payhero...', subscriptionId)
    
    const { data: txn } = await supabase
      .from('transactions')
      .select('payhero_reference, id')
      .eq('related_id', sub.id)  // ✅ Match subscription ID
      .eq('purpose', isVendor ? 'vendor_subscription' : 'subscription')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (txn?.payhero_reference) {
      try {
        const payheroRes = await fetch('https://api.payhero.co.ke/api/v2/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PAYHERO_API_KEY}`,
          },
          body: JSON.stringify({ CheckoutRequestID: txn.payhero_reference }),
        })

        const result = await payheroRes.json()
        console.log('[checkSubscriptionStatus] Payhero response:', result)

        const isSuccess = result.ResultCode === 0 || result.Status === 'Success'

        if (isSuccess) {
          console.log('[checkSubscriptionStatus] Payment successful, activating subscription:', subscriptionId)

          // Manually activate — callback was missed
          const now = new Date()
          const durationDays = isVendor ? 30 : (tier === 'daily' ? 1 : tier === 'weekly' ? 7 : tier === 'monthly' ? 30 : 365)
          const expiresAt = new Date(now.getTime() + durationDays * 86400000)

          await supabase
            .from(table)
            .update({
              status: 'active',
              starts_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', sub.id)

          await supabase
            .from('transactions')
            .update({
              status: 'success',
              status_message: 'Resolved via client polling',
              mpesa_receipt: result.MpesaReceiptNumber ?? null,
              completed_at: now.toISOString(),
            })
            .eq('id', txn.id)

          const { data: updated } = await supabase
            .from(table)
            .select('*')
            .eq('id', sub.id)
            .single()

          console.log('[checkSubscriptionStatus] Subscription activated:', subscriptionId)
          return { active: true, failed: false, subscription: updated as Subscription }
        } else {
          console.log('[checkSubscriptionStatus] Payhero payment not yet successful:', result)
        }
      } catch (err) {
        console.error('[checkSubscriptionStatus] Payhero query failed:', err)
      }
    } else {
      console.log('[checkSubscriptionStatus] No transaction found for subscription:', subscriptionId)
    }
  }

  return { active: false, failed: false, subscription: sub as Subscription }
}

// ── Toggle Auto-Renewal ───────────────────────────────────
export async function toggleAutoRenewAction(
  subscriptionId: string,
  enable: boolean,
  phone?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify ownership
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub) return { success: false, error: 'Subscription not found' }

  if (enable && !phone) {
    return { success: false, error: 'Phone number required for auto-renewal' }
  }

  // Calculate next renewal date — 1 day before expiry
  const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null
  const nextRenewalAt = expiresAt
    ? new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error } = await supabase
    .from('subscriptions')
    .update({
      billing_type: enable ? 'auto-renew' : 'one-time',
      auto_renew: enable,
      auto_renew_phone: enable ? phone : null,
      next_renewal_at: enable ? nextRenewalAt : null,
      cancelled_at: enable ? null : sub.cancelled_at,
    })
    .eq('id', subscriptionId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/user/subscription')
  return {
    success: true,
    message: enable
      ? `Auto-renewal enabled. We'll send an M-Pesa prompt 1 day before your plan expires.`
      : 'Auto-renewal disabled. Your plan will expire on the renewal date.',
  }
}

// ── Cancel Subscription ───────────────────────────────────
export async function cancelSubscriptionAction(
  subscriptionId: string,
  reason?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub) return { success: false, error: 'Subscription not found' }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      billing_type: 'one-time',
      auto_renew: false,
      auto_renew_phone: null,
      next_renewal_at: null,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason ?? null,
    })
    .eq('id', subscriptionId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/user/subscription')
  return {
    success: true,
    message: `Your plan will remain active until ${new Date(sub.expires_at!).toLocaleDateString('en-GB')}. After that, you'll need to manually subscribe again.`,
  }
}

// ── Save Billing Preference at Checkout ───────────────────
// Called by the M-Pesa webhook after a successful first payment
export async function setupAutoRenewAtCheckoutAction(
  subscriptionId: string,
  phone: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('expires_at, user_id')
    .eq('id', subscriptionId)
    .maybeSingle()

  if (!sub || sub.user_id !== user.id) {
    return { success: false, error: 'Subscription not found' }
  }

  const expiresAt = new Date(sub.expires_at!)
  const nextRenewalAt = new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000).toISOString()

  await supabase
    .from('subscriptions')
    .update({
      billing_type: 'auto-renew',
      auto_renew: true,
      auto_renew_phone: phone,
      next_renewal_at: nextRenewalAt,
    })
    .eq('id', subscriptionId)

  return { success: true }
}

// ── Payhero Subscription Initiation ───────────────────────
import { initiateSTKPush } from '@/lib/payhero/client'
import { normalizeKenyanPhone, isValidKenyanPhone, generateReference } from '@/lib/payhero/utils'

export type InitiateSubscriptionInput = {
  tier: string
  amount: number
  durationDays: number
  phone: string
  billingType: BillingType
  isVendor?: boolean
}

export type InitiateSubscriptionResult =
  | { success: true; reference: string; subscriptionId: string; message: string }
  | { success: false; error: string; field?: string }

export async function initiateSubscriptionPaymentAction(
  input: InitiateSubscriptionInput
): Promise<InitiateSubscriptionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be signed in to subscribe.' }
  }

  // ── Validation ──
  if (!input.amount || input.amount < 10) {
    return { success: false, error: 'Invalid amount.', field: 'amount' }
  }
  if (!isValidKenyanPhone(input.phone)) {
    return {
      success: false,
      error: 'Enter a valid Safaricom/Airtel number (e.g. 0712345678).',
      field: 'phone',
    }
  }

  const normalizedPhone = normalizeKenyanPhone(input.phone)!
  const reference = generateReference(input.isVendor ? 'VSUB' : 'SUB')

  // ── Pre-create a PENDING subscription row ──
  // The webhook will activate it on successful payment
  const tableName = input.isVendor ? 'vendor_subscriptions' : 'subscriptions'
  const userIdField = input.isVendor ? 'vendor_id' : 'user_id'

  const now = new Date()
  const expiresAt = new Date(now.getTime() + input.durationDays * 24 * 60 * 60 * 1000)

  const { data: pendingSub, error: subErr } = await supabase
    .from(tableName)
    .insert({
      [userIdField]: user.id,
      tier: input.tier,
      status: 'pending',
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_paid: input.amount,
      auto_renew: input.billingType === 'auto-renew',
      billing_type: input.billingType,
      auto_renew_phone: input.billingType === 'auto-renew' ? normalizedPhone : null,
    })
    .select('id')
    .single()

  if (subErr || !pendingSub) {
    console.error('[initiateSubscription] Pending sub insert failed:', subErr)
    return { success: false, error: 'Could not create subscription. Please try again.' }
  }

  // ── Insert transaction record ──
  const { error: txnErr } = await supabase
    .from('transactions')
    .insert({
      reference,
      user_id: user.id,
      amount: input.amount,
      currency: 'KES',
      channel: 'mpesa',
      phone: normalizedPhone,
      status: 'pending',
      purpose: input.isVendor ? 'vendor_subscription' : 'subscription',
      related_id: pendingSub.id,
      metadata: {
        tier: input.tier,
        durationDays: input.durationDays,
        billingType: input.billingType,
        phoneToSave: normalizedPhone,
        isVendor: !!input.isVendor,
      },
    })

  if (txnErr) {
    // Rollback the pending subscription
    await supabase.from(tableName).delete().eq('id', pendingSub.id)
    return { success: false, error: 'Could not record payment. Please try again.' }
  }

  // ── Call Payhero ──
  const callbackUrl = `${process.env.PAYHERO_CALLBACK_BASE_URL ?? 'https://pikaplanner.vercel.app'}/api/payhero/callback`

  const stkResult = await initiateSTKPush({
    amount: input.amount,
    phoneNumber: normalizedPhone,
    externalReference: reference,
    customerName: user.user_metadata?.full_name ?? user.email,
    callbackUrl,
  })

  if (!stkResult.success) {
    // Mark transaction + pending sub as failed
    await supabase
      .from('transactions')
      .update({
        status: 'failed',
        status_message: stkResult.error ?? 'STK Push failed',
        raw_callback: stkResult as any,
      })
      .eq('reference', reference)

    await supabase
      .from(tableName)
      .update({ status: 'failed' })
      .eq('id', pendingSub.id)

    return {
      success: false,
      error: stkResult.error ?? 'Could not initiate M-Pesa prompt. Please try again.',
    }
  }

  // Update with Payhero references
  await supabase
    .from('transactions')
    .update({
      status: 'processing',
      payhero_reference: stkResult.CheckoutRequestID ?? stkResult.reference,
      status_message: stkResult.CustomerMessage,
    })
    .eq('reference', reference)

  return {
    success: true,
    reference,
    subscriptionId: pendingSub.id,
    message: stkResult.CustomerMessage ?? 'Check your phone to complete the M-Pesa payment.',
  }
}