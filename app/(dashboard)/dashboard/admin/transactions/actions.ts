'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TransactionStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded'

export type Transaction = {
  id: string
  orderId: string
  customerId: string
  customer: string
  customerEmail: string
  vendorId: string
  vendor: string
  amount: string
  fee: string
  netAmount: string
  method: string
  reference: string
  date: string
  createdAtIso: string
  status: TransactionStatus
  description: string
  rawAmount: number
  rawFee: number
  rawNet: number
}

export type WithdrawForm = {
  amount: string
  method: 'mpesa' | 'bank'
  phoneOrAccount: string
  description: string
}

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function fetchAdminTransactionsData(): Promise<Transaction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, user_id, vendor_id, total_amount, platform_fee, delivery_fee,
      subtotal, status, currency, payment_status, mpesa_transaction_id, customer_phone,
      customer_email, customer_notes, created_at, updated_at,
      profiles:user_id (full_name, email),
      vendors:vendor_id (business_name, name)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  return (data || []).map((t: any) => {
    const amount = Number(t.total_amount || 0)
    const fee = Number(t.platform_fee || 0) + Number(t.delivery_fee || 0)
    const net = amount - fee

    return {
      id: t.id,
      orderId: t.order_number || t.id?.slice(0, 8)?.toUpperCase() || 'N/A',
      customerId: t.user_id || '',
      customer: t.profiles?.full_name || 'Unknown Customer',
      customerEmail: t.customer_email || t.profiles?.email || '',
      vendorId: t.vendor_id || '',
      vendor: t.vendors?.business_name || t.vendors?.name || 'No Vendor',
      amount: formatCurrency(amount),
      fee: formatCurrency(fee),
      netAmount: formatCurrency(net),
      method: t.mpesa_transaction_id ? 'M-Pesa' : (t.currency || 'M-Pesa'),
      reference: t.mpesa_transaction_id || t.order_number || 'N/A',
      date: formatDate(t.created_at),
      createdAtIso: t.created_at || new Date().toISOString(),
      status: (t.payment_status === 'paid' ? 'Successful' : (t.status as TransactionStatus)) || 'Pending',
      description: t.customer_notes || '',
      rawAmount: amount,
      rawFee: fee,
      rawNet: net,
    }
  })
}

export async function refundTransactionAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'Refunded', payment_status: 'refunded', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/transactions')
}

export async function withdrawFundsAction(data: WithdrawForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const amount = Number(data.amount)
  const netAmount = amount * 0.99

  const { error } = await supabase.from('orders').insert({
    user_id: user.id,
    vendor_id: user.id, // Admin acts as vendor for withdrawals
    order_number: `WDR-${Date.now()}`,
    subtotal: netAmount,
    total_amount: netAmount,
    platform_fee: 0,
    delivery_fee: 0,
    status: 'delivered',
    currency: 'KES',
    delivery_address: data.phoneOrAccount,
    customer_phone: data.phoneOrAccount,
    customer_notes: data.description || 'Admin withdrawal',
    payment_status: 'paid',
    mpesa_transaction_id: `WDR-${Date.now()}`,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/transactions')
  return netAmount
}