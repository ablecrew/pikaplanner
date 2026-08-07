'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { initiateSTKPush, getTransactionStatus } from '@/lib/payhero/client'
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  generateReference,
} from '@/lib/payhero/utils'
import type {
  PaymentChannel,
  PaymentPurpose,
  TransactionStatus,
} from '@/lib/payhero/types'

// ── Types ──────────────────────────────────────────────────
export type InitiatePaymentInput = {
  amount: number
  phone: string
  purpose: PaymentPurpose
  relatedId?: string                 // Order ID, subscription ID, etc.
  metadata?: Record<string, unknown>
}

export type InitiatePaymentResult =
  | { success: true; reference: string; payheroReference?: string; message: string }
  | { success: false; error: string; field?: string }

export type Transaction = {
  id: string
  reference: string
  amount: number
  currency: string
  channel: string
  phone: string | null
  status: TransactionStatus
  status_message: string | null
  mpesa_receipt: string | null
  purpose: string
  initiated_at: string
  completed_at: string | null
  expires_at: string
}

// ── Initiate Payment ───────────────────────────────────────
export async function initiatePaymentAction(
  input: InitiatePaymentInput
): Promise<InitiatePaymentResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be signed in to pay.' }
  }

  // ── Validation ──
  if (!input.amount || input.amount <= 0) {
    return { success: false, error: 'Invalid amount.', field: 'amount' }
  }
  if (input.amount < 10) {
    return { success: false, error: 'Minimum amount is KES 10.', field: 'amount' }
  }
  if (input.amount > 250_000) {
    return { success: false, error: 'Maximum M-Pesa amount is KES 250,000 per transaction.', field: 'amount' }
  }

  if (!isValidKenyanPhone(input.phone)) {
    return {
      success: false,
      error: 'Enter a valid Safaricom/Airtel number (e.g. 0712345678).',
      field: 'phone',
    }
  }

  const normalizedPhone = normalizeKenyanPhone(input.phone)!
  const reference = generateReference()

  // ── Rate limit: max 3 pending payments per user per 10 mins ──
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .gte('initiated_at', tenMinAgo)

  if ((count ?? 0) >= 3) {
    return {
      success: false,
      error: 'You have too many pending payments. Please complete or wait for them to expire.',
    }
  }

  // ── Insert pending transaction ──
  const { data: txn, error: insertErr } = await supabase
    .from('transactions')
    .insert({
      reference,
      user_id: user.id,
      amount: input.amount,
      currency: 'KES',
      channel: 'mpesa' as PaymentChannel,
      phone: normalizedPhone,
      status: 'pending',
      purpose: input.purpose,
      related_id: input.relatedId ?? null,
      metadata: input.metadata ?? {},
      raw_request: { input },
    })
    .select('reference')
    .single()

  if (insertErr || !txn) {
    console.error('[initiatePayment] DB insert failed:', insertErr)
    return { success: false, error: 'Could not record your payment. Please try again.' }
  }

  // ── Call Payhero ──
  const callbackUrl = `${process.env.PAYHERO_CALLBACK_BASE_URL ?? 'https://pikaplanner.com'}/api/payhero/callback`

  const stkResult = await initiateSTKPush({
    amount: input.amount,
    phoneNumber: normalizedPhone,
    externalReference: reference,
    customerName: user.user_metadata?.full_name ?? user.email,
    callbackUrl,
  })

  if (!stkResult.success) {
    // Mark as failed
    await supabase
      .from('transactions')
      .update({
        status: 'failed',
        status_message: stkResult.error ?? 'STK Push failed',
        raw_callback: stkResult,
      })
      .eq('reference', reference)

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

  revalidatePath('/checkout')

  return {
    success: true,
    reference,
    payheroReference: stkResult.CheckoutRequestID,
    message: stkResult.CustomerMessage ?? 'Check your phone to complete the M-Pesa payment.',
  }
}

// ── Poll Transaction Status ────────────────────────────────
export async function fetchTransactionAction(reference: string): Promise<Transaction | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('transactions')
    .select(
      'id, reference, amount, currency, channel, phone, status, status_message, mpesa_receipt, purpose, initiated_at, completed_at, expires_at'
    )
    .eq('reference', reference)
    .eq('user_id', user.id)
    .maybeSingle()

  return (data as Transaction) ?? null
}

// ── Manual Status Check (if webhook is delayed) ────────────
export async function syncTransactionStatusAction(reference: string): Promise<Transaction | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get current transaction
  const { data: txn } = await supabase
    .from('transactions')
    .select('*')
    .eq('reference', reference)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!txn) return null
  if (txn.status === 'success' || txn.status === 'failed') return txn as Transaction

  // Check Payhero
  if (txn.payhero_reference) {
    const statusRes = await getTransactionStatus(txn.payhero_reference)

    if (statusRes.status === 'SUCCESS') {
      await supabase
        .from('transactions')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          mpesa_receipt: statusRes.mpesa_receipt_number,
          status_message: 'Payment successful',
          raw_callback: statusRes as any,
        })
        .eq('reference', reference)
    } else if (statusRes.status === 'FAILED' || statusRes.status === 'CANCELLED') {
      await supabase
        .from('transactions')
        .update({
          status: statusRes.status === 'CANCELLED' ? 'cancelled' : 'failed',
          completed_at: new Date().toISOString(),
          status_message: statusRes.ResultDesc ?? statusRes.error,
          raw_callback: statusRes as any,
        })
        .eq('reference', reference)
    }
  }

  return await fetchTransactionAction(reference)
}

// ── List User's Transactions ───────────────────────────────
export async function fetchUserTransactionsAction(limit = 20): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select(
      'id, reference, amount, currency, channel, phone, status, status_message, mpesa_receipt, purpose, initiated_at, completed_at, expires_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data as Transaction[]) ?? []
}