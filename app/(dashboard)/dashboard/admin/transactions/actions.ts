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

function mapStatus(dbStatus?: string): TransactionStatus {
  switch ((dbStatus || '').toLowerCase()) {
    case 'success':
    case 'completed':
    case 'paid':
      return 'Successful'
    case 'processing':
    case 'pending':
    case 'queued':
      return 'Pending'
    case 'failed':
    case 'error':
      return 'Failed'
    case 'cancelled':
    case 'canceled':
    case 'refunded':
      return 'Refunded'
    default:
      return 'Pending'
  }
}

function buildVendorLabel(purpose: string, vendorName?: string): string {
  switch (purpose) {
    case 'subscription': return 'Subscription'
    case 'shopping_cart':
    case 'shopping_list':
      return 'Shopping Cart'
    case 'order': return vendorName || 'No Vendor'
    default: return vendorName || '—'
  }
}

function buildDescription(purpose: string, enriched: any): string {
  switch (purpose) {
    case 'subscription':
      return enriched.planTier ? `${enriched.planTier} Plan` : 'Subscription Payment'
    case 'order':
      if (enriched.itemCount) {
        return `${enriched.itemCount} item${enriched.itemCount !== 1 ? 's' : ''}${enriched.vendorName ? ` from ${enriched.vendorName}` : ''}`
      }
      return 'Order Payment'
    case 'shopping_cart':
    case 'shopping_list':
      return enriched.listName
        ? `${enriched.listName}${enriched.itemCount ? ` · ${enriched.itemCount} items` : ''}`
        : 'Shopping Cart'
    default:
      return 'Payment'
  }
}

// ── Main Fetch ─────────────────────────────────────────────
export async function fetchAdminTransactionsData(): Promise<Transaction[]> {
  const supabase = await createClient()

  const { data: txns, error } = await supabase
    .from('transactions')
    .select(`
      id, reference, user_id, amount, currency, channel, phone, email,
      status, status_message, payhero_reference, mpesa_receipt, purpose,
      related_id, metadata, created_at, initiated_at, completed_at
    `)
    .order('created_at', { ascending: false })
    .limit(300)

  // 🔍 DEBUG — check your server terminal
  console.log('🔍 transactions error:', error)
  console.log('🔍 transactions count:', txns?.length)

  if (error) throw new Error(error.message)

  const rows = txns || []
  if (rows.length === 0) return []

  const userIds = Array.from(new Set(rows.map((t: any) => t.user_id).filter(Boolean)))
  const safeUserIds = userIds.length ? userIds : ['__none__']

  // Profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', safeUserIds)
  const profileMap = new Map<string, any>()
  ;(profiles || []).forEach((p: any) => profileMap.set(p.id, p))

  // Collect related_ids per purpose
  const orderIds = rows.filter((t: any) => t.purpose === 'order').map((t: any) => t.related_id).filter(Boolean)
  const subIds = rows.filter((t: any) => t.purpose === 'subscription').map((t: any) => t.related_id).filter(Boolean)
  const listIds = rows.filter((t: any) => ['shopping_cart', 'shopping_list'].includes(t.purpose)).map((t: any) => t.related_id).filter(Boolean)

  // Orders by id (related_id)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, platform_fee, status, vendor_id')
    .in('id', orderIds.length ? orderIds : ['__none__'])
  const orderMap = new Map<string, any>()
  ;(orders || []).forEach((o: any) => orderMap.set(o.id, o))

  // Vendors
  const vendorIds = Array.from(new Set((orders || []).map((o: any) => o.vendor_id).filter(Boolean)))
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, name')
    .in('id', vendorIds.length ? vendorIds : ['__none__'])
  const vendorMapById = new Map<string, any>()
  ;(vendors || []).forEach((v: any) => vendorMapById.set(v.id, v))

  // Order item counts
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('order_id, quantity')
    .in('order_id', orderIds.length ? orderIds : ['__none__'])
  const itemCountByOrder = new Map<string, number>()
  ;(orderItems || []).forEach((it: any) => {
    itemCountByOrder.set(it.order_id, (itemCountByOrder.get(it.order_id) || 0) + (it.quantity || 1))
  })

  // Subscriptions by id (related_id)
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, tier, status, expires_at')
    .in('id', subIds.length ? subIds : ['__none__'])
  const subMap = new Map<string, any>()
  ;(subs || []).forEach((s: any) => subMap.set(s.id, s))

  // Shopping lists by id (related_id)
  const { data: lists } = await supabase
    .from('shopping_lists')
    .select('id, name')
    .in('id', listIds.length ? listIds : ['__none__'])
  const listMap = new Map<string, any>()
  ;(lists || []).forEach((l: any) => listMap.set(l.id, l))

  const { data: listItems } = await supabase
    .from('shopping_list_items')
    .select('shopping_list_id')
    .in('shopping_list_id', listIds.length ? listIds : ['__none__'])
  const listItemCount = new Map<string, number>()
  ;(listItems || []).forEach((li: any) => {
    listItemCount.set(li.shopping_list_id, (listItemCount.get(li.shopping_list_id) || 0) + 1)
  })

  // ── Build ──
  return rows.map((t: any) => {
    const amount = Number(t.amount || 0)
    const profile = profileMap.get(t.user_id)
    let fee = 0
    let vendorName: string | undefined
    let vendorId = ''
    const enriched: any = {}

    if (t.purpose === 'subscription') {
      const s = subMap.get(t.related_id)
      if (s) enriched.planTier = s.tier
      fee = amount
    } else if (t.purpose === 'order') {
      const o = orderMap.get(t.related_id)
      if (o) {
        fee = Number(o.platform_fee || 0)
        const v = vendorMapById.get(o.vendor_id)
        vendorName = v?.business_name || v?.name
        vendorId = o.vendor_id || ''
        enriched.vendorName = vendorName
        enriched.itemCount = itemCountByOrder.get(o.id) || 0
      }
    } else if (['shopping_cart', 'shopping_list'].includes(t.purpose)) {
      const l = listMap.get(t.related_id)
      if (l) {
        enriched.listName = l.name
        enriched.itemCount = listItemCount.get(l.id) || 0
      }
      fee = amount * 0.05
    }

    const net = amount - fee

    return {
      id: t.id,
      orderId: t.reference || t.id?.slice(0, 8)?.toUpperCase() || 'N/A',
      customerId: t.user_id || '',
      customer: profile?.full_name || 'Unknown Customer',
      customerEmail: t.email || profile?.email || '',
      vendorId,
      vendor: buildVendorLabel(t.purpose, vendorName),
      amount: formatCurrency(amount),
      fee: formatCurrency(fee),
      netAmount: formatCurrency(net),
      method: t.channel || 'M-Pesa',
      reference: t.mpesa_receipt || t.payhero_reference || t.reference || 'N/A',
      date: formatDate(t.created_at),
      createdAtIso: t.created_at || new Date().toISOString(),
      status: mapStatus(t.status),
      description: buildDescription(t.purpose, enriched),
      rawAmount: amount,
      rawFee: fee,
      rawNet: net,
    }
  })
}

// ── Refund ─────────────────────────────────────────────────
export async function refundTransactionAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('transactions')
    .update({
      status: 'cancelled',
      status_message: 'Refunded by admin',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  try {
    await supabase.from('audit_logs').insert({
      actor_id: user?.id,
      action: 'refund_transaction',
      target_id: id,
      metadata: { reason: 'Refunded by admin' },
    })
  } catch { /* ignore */ }

  revalidatePath('/dashboard/admin/transactions')
}

// ── Withdraw ───────────────────────────────────────────────
export async function withdrawFundsAction(data: WithdrawForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const amount = Number(data.amount)
  const netAmount = amount * 0.99

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    purpose: 'withdrawal',
    amount: netAmount,
    currency: 'KES',
    channel: data.method === 'mpesa' ? 'M-Pesa' : 'Bank',
    phone: data.phoneOrAccount,
    status: 'success',
    status_message: data.description || 'Admin withdrawal',
    reference: `WDR-${Date.now()}`,
    mpesa_receipt: `WDR-${Date.now()}`,
    completed_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/transactions')
  return netAmount
}