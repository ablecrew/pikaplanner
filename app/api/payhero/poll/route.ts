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
 * 
 * HOW IT WORKS:
 * 1. PayHero webhook updates the database when payment completes
 * 2. Client polls this endpoint every 4 seconds
 * 3. This endpoint checks the database for status updates
 * 4. When status changes to 'success', client redirects to meal generator
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

    // ✅ Check if transaction is completed (success, failed, or cancelled)
    const isCompleted = 
      txn.status === 'success' || 
      txn.status === 'failed' || 
      txn.status === 'cancelled'

    return NextResponse.json({
      found: true,
      status: txn.status,
      completed: isCompleted,
      mpesa_receipt: txn.mpesa_receipt ?? null,
      purpose: txn.purpose,
      related_id: txn.related_id,
    })
  } catch (err) {
    console.error('[Poll API] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * GET handler for health check
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'PayHero Poll API',
    timestamp: new Date().toISOString(),
  })
}