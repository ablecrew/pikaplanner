// app/api/cron/check-stuck-payments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  // Protect with cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Find transactions stuck in "processing" for more than 10 minutes
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { data: stuckTxns } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'processing')
    .lt('created_at', tenMinAgo)
    .limit(20)

  if (!stuckTxns || stuckTxns.length === 0) {
    return NextResponse.json({ message: 'No stuck transactions', checked: 0 })
  }

  console.log(`[Cron] Found ${stuckTxns.length} stuck transactions`)

  let resolved = 0

  for (const txn of stuckTxns) {
    try {
      // Query Payhero for actual status
      const payheroRes = await fetch('https://api.payhero.co.ke/api/v2/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PAYHERO_API_KEY}`,
        },
        body: JSON.stringify({ CheckoutRequestID: txn.payhero_reference }),
      })

      const result = await payheroRes.json()
      const isSuccess = result.ResultCode === 0 || result.Status === 'Success'
      const isCancelled = result.ResultCode === 1032

      if (isSuccess || isCancelled) {
        // Manually process the callback
        const newStatus = isSuccess ? 'success' : 'cancelled'

        await supabase
          .from('transactions')
          .update({
            status: newStatus,
            status_message: result.ResultDesc ?? 'Resolved by cron',
            mpesa_receipt: result.MpesaReceiptNumber ?? null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', txn.id)

        // Activate subscription if payment succeeded
        if (isSuccess && txn.purpose === 'subscription' && txn.related_id) {
          const metadata = txn.metadata ?? {}
          const durationDays = metadata.durationDays ?? 30
          const now = new Date()
          const expiresAt = new Date(now.getTime() + durationDays * 86400000)

          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              starts_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              billing_type: metadata.billingType ?? 'one-time',
              auto_renew: metadata.billingType === 'auto-renew',
              auto_renew_phone: metadata.phoneToSave ?? null,
              updated_at: now.toISOString(),
            })
            .eq('id', txn.related_id)
            .eq('status', 'pending')
        }

        resolved++
      }
    } catch (err) {
      console.error(`[Cron] Failed to check txn ${txn.id}:`, err)
    }
  }

  return NextResponse.json({
    message: `Checked ${stuckTxns.length} stuck transactions`,
    resolved,
  })
}