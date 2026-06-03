'use server'

import { createClient } from '@/lib/supabase/server'

export type TransactionStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded'

export type TransactionRecord = {
  id: string
  orderId: string
  orderNumber: string
  vendorId: string
  vendorName: string
  amount: number
  method: 'M-Pesa' | 'Card' | 'Bank'
  date: string
  status: TransactionStatus
  mpesaCode: string
  subtotal: number
  deliveryFee: number
  platformFee: number
  deliveryAddress: string
  customerNotes: string
}

export type TransactionStats = {
  spent: number
  pending: number
  refunded: number
  successfulCount: number
  pendingCount: number
  refundedCount: number
  failedCount: number
}

export type TransactionsPayload = {
  transactions: TransactionRecord[]
  stats: TransactionStats
  total: number
  page: number
  pageSize: number
  totalPages: number
  debug?: {
    ordersFound: number
  }
}

export type TransactionsQuery = {
  search: string
  status: TransactionStatus | 'All'
  page: number
}

const PAGE_SIZE = 20
const CACHE_TTL = 30

const STATUS_VALUES: TransactionStatus[] = ['Successful', 'Pending', 'Failed', 'Refunded']

function sanitize(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback
  return input.trim()
}

function isStatus(value: unknown): value is TransactionStatus {
  return typeof value === 'string' && STATUS_VALUES.includes(value as TransactionStatus)
}

function deriveStatus(o: any): TransactionStatus {
  if (o.payment_status === 'paid') return 'Successful'
  if (o.payment_status === 'refunded' || o.status === 'Refunded') return 'Refunded'
  if (o.payment_status === 'failed') return 'Failed'
  return 'Pending'
}

function mapOrderToTransaction(
  o: any,
  vendorMap: Map<string, string>
): TransactionRecord {
  const vendorName = vendorMap.get(o.vendor_id) || 'Pika Kitchen'
  const method: 'M-Pesa' | 'Card' | 'Bank' = o.mpesa_transaction_id
    ? 'M-Pesa'
    : 'Card'

  return {
    id: `TXN-${(o.id || '').slice(0, 8).toUpperCase()}`,
    orderId: o.id,
    orderNumber: o.order_number || (o.id || '').slice(0, 8).toUpperCase(),
    vendorId: o.vendor_id || '',
    vendorName,
    amount: Number(o.total_amount || 0),
    method,
    date: o.created_at,
    status: deriveStatus(o),
    mpesaCode: o.mpesa_transaction_id || '',
    subtotal: Number(o.subtotal || 0),
    deliveryFee: Number(o.delivery_fee || 0),
    platformFee: Number(o.platform_fee || 0),
    deliveryAddress: o.delivery_address || '',
    customerNotes: o.customer_notes || '',
  }
}

function buildStats(rows: TransactionRecord[]): TransactionStats {
  const successful = rows.filter((t) => t.status === 'Successful')
  const pending = rows.filter((t) => t.status === 'Pending')
  const refunded = rows.filter((t) => t.status === 'Refunded')
  const failed = rows.filter((t) => t.status === 'Failed')

  return {
    spent: successful.reduce((s, t) => s + t.amount, 0),
    pending: pending.reduce((s, t) => s + t.amount, 0),
    refunded: refunded.reduce((s, t) => s + t.amount, 0),
    successfulCount: successful.length,
    pendingCount: pending.length,
    refundedCount: refunded.length,
    failedCount: failed.length,
  }
}

async function fetchTransactionsRaw(
  query: TransactionsQuery,
): Promise<TransactionsPayload> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return emptyPayload(query)
  }

  const page = Math.max(1, Math.floor(query.page))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Orders + total count in parallel
  const [orderRes, countRes] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_number, vendor_id, subtotal, total_amount, platform_fee, delivery_fee, status, payment_status, delivery_address, customer_notes, mpesa_transaction_id, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  if (orderRes.error) {
    console.error('orders fetch error:', orderRes.error)
    return emptyPayload(query)
  }

  const orders = (orderRes.data || []) as any[]

  // Bulk fetch vendors
  const vendorIds = Array.from(
    new Set(orders.map((o) => o.vendor_id).filter(Boolean) as string[]),
  )
  let vendorMap = new Map<string, string>()
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, business_name')
      .in('id', vendorIds)
    vendorMap = new Map(
      ((vendors || []) as Array<{ id: string; business_name: string | null }>).map(
        (v) => [v.id, v.business_name || 'Pika Kitchen'],
      ),
    )
  }

  let transactions: TransactionRecord[] = orders.map((o) =>
    mapOrderToTransaction(o, vendorMap),
  )

  // Server-side text search
  const search = query.search.trim().toLowerCase()
  if (search) {
    transactions = transactions.filter((t) => {
      const haystack = `${t.id} ${t.orderNumber} ${t.vendorName} ${t.mpesaCode}`.toLowerCase()
      return haystack.includes(search)
    })
  }

  // Server-side status filter
  if (query.status !== 'All') {
    transactions = transactions.filter((t) => t.status === query.status)
  }

  const total = countRes.count || transactions.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return {
    transactions,
    stats: buildStats(transactions),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    debug: {
      ordersFound: orders.length,
    },
  }
}

function emptyPayload(query: TransactionsQuery): TransactionsPayload {
  return {
    transactions: [],
    stats: {
      spent: 0,
      pending: 0,
      refunded: 0,
      successfulCount: 0,
      pendingCount: 0,
      refundedCount: 0,
      failedCount: 0,
    },
    total: 0,
    page: query.page,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }
}

export async function fetchUserTransactions(
  raw: Partial<TransactionsQuery> = {},
): Promise<TransactionsPayload> {
  const status: TransactionStatus | 'All' = isStatus(raw.status)
    ? raw.status
    : raw.status === 'All'
      ? 'All'
      : 'All'

  const query: TransactionsQuery = {
    search: sanitize(raw.search, ''),
    status,
    page: Math.max(1, Math.floor(Number(raw.page) || 1)),
  }

  try {
    return await fetchTransactionsRaw(query)
  } catch (err) {
    console.error('Cached transactions failed, falling back:', err)
    return fetchTransactionsRaw(query)
  }
}