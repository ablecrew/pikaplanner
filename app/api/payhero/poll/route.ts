// app/api/payhero/poll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

/**
 * POST handler for Next.js App Router API route
 * Called by the client to check if a transaction was completed
 * as a fallback when callbacks fail
 */
export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json()

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    const { data: txn } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (!txn) {
      return NextResponse.json({ found: false })
    }

    // If already completed, return current status
    if (txn.status === 'success' || txn.status === 'failed' || txn.status === 'cancelled') {
      return NextResponse.json({
        found: true,
        status: txn.status,
        completed: true,
      })
    }

    // Still processing — check with Payhero API directly
    if (txn.payhero_reference) {
      const payheroStatus = await queryPayheroTransaction(txn.payhero_reference)

      // ✅ Fixed: Check ResultCode and Status (PayHero response format)
      if (payheroStatus && (payheroStatus.ResultCode === 0 || payheroStatus.Status === 'Success')) {
        // Manually complete it
        await supabase
          .from('transactions')
          .update({
            status: 'success',
            status_message: 'Completed via polling fallback',
            mpesa_receipt: payheroStatus.MpesaReceiptNumber ?? null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', txn.id)

        // Activate subscription
        if (txn.purpose === 'subscription' && txn.related_id) {
          await activateSubscription(supabase, txn)
        }

        return NextResponse.json({
          found: true,
          status: 'success',
          completed: true,
        })
      }
    }

    return NextResponse.json({
      found: true,
      status: txn.status,
      completed: false,
    })
  } catch (err) {
    console.error('[Poll API] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// ✅ Fixed: Correct PayHero endpoint and Basic Auth
async function queryPayheroTransaction(checkoutRequestId: string) {
  try {
    const res = await fetch('https://backend.payhero.co.ke/api/v2/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.PAYHERO_API_KEY}`,
      },
      body: JSON.stringify({ CheckoutRequestID: checkoutRequestId }),
    })

    const result = await res.json()
    console.log('[Payhero Query] Response:', result)
    return result
  } catch (err) {
    console.error('[Payhero] Query failed:', err)
    return null
  }
}

async function activateSubscription(supabase: any, txn: any) {
  const metadata = txn.metadata ?? {}
  const tier = metadata.tier ?? 'monthly'
  const durationDays = metadata.durationDays ?? 30
  const billingType = metadata.billingType ?? 'one-time'

  const now = new Date()
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      billing_type: billingType,
      auto_renew: billingType === 'auto-renew',
      updated_at: now.toISOString(),
    })
    .eq('id', txn.related_id)
    .eq('status', 'pending')
}