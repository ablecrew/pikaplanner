import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 🔐 Secure with a secret to prevent unauthorized triggers
const CRON_SECRET = process.env.CRON_SECRET ?? 'change-me-in-env'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const now = new Date()
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000)

  // Find subscriptions due for renewal in the next hour
  const { data: dueSubscriptions, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, tier, amount_paid, auto_renew_phone, next_renewal_at, expires_at')
    .eq('billing_type', 'auto-renew')
    .eq('status', 'active')
    .eq('auto_renew', true)
    .lte('next_renewal_at', nextHour.toISOString())
    .is('cancelled_at', null)

  if (error) {
    console.error('[Renewal Cron] Query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[Renewal Cron] Found ${dueSubscriptions?.length ?? 0} subscriptions to renew`)

  const results = []

  for (const sub of dueSubscriptions ?? []) {
    try {
      // Skip if no phone saved
      if (!sub.auto_renew_phone) {
        console.warn(`[Renewal Cron] Skipping ${sub.id} — no phone saved`)
        continue
      }

      // Log attempt
      const { data: renewal } = await supabase
        .from('subscription_renewals')
        .insert({
          subscription_id: sub.id,
          user_id: sub.user_id,
          status: 'pending',
          amount: sub.amount_paid,
        })
        .select('id')
        .single()

      // Trigger STK push via your M-Pesa endpoint
      const stkRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/mpesa/stkpush`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: sub.amount_paid,
          phone: sub.auto_renew_phone.replace(/[^0-9]/g, ''),
          orderId: `RENEW-${sub.id}-${Date.now()}`,
          userId: sub.user_id,
          metadata: { renewalId: renewal?.id, subscriptionId: sub.id, isRenewal: true },
        }),
      })

      const stkData = await stkRes.json()

      // Update attempt counter
      await supabase
        .from('subscriptions')
        .update({
          renewal_attempts: (sub as any).renewal_attempts ? (sub as any).renewal_attempts + 1 : 1,
          last_renewal_attempt_at: new Date().toISOString(),
        })
        .eq('id', sub.id)

      // Notify user
      await supabase.from('notification_logs').insert({
        user_id: sub.user_id,
        title: 'Auto-Renewal Started 🔄',
        body: `Check your phone to confirm renewal of your ${sub.tier} plan for KES ${sub.amount_paid}.`,
        metadata: { type: 'subscription', renewalId: renewal?.id },
      })

      results.push({ subscriptionId: sub.id, status: 'initiated', stk: stkData.success })
    } catch (err) {
      console.error(`[Renewal Cron] Failed for ${sub.id}:`, err)
      results.push({ subscriptionId: sub.id, status: 'error' })
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
    timestamp: now.toISOString(),
  })
}

// Health check
export async function GET() {
  return NextResponse.json({ ok: true, service: 'Renewal Cron' })
}