'use server'

import { createClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────

export type TransactionType = 'subscription' | 'meal_order' | 'shopping_cart' | 'vendor_subscription'

export type TransactionStatus = 'Successful' | 'Processing' | 'Failed' | 'Cancelled'

export type TransactionRecord = {
  // Core transaction data
  id: string
  internalReference: string
  externalReference: string
  mpesaReceipt: string
  amount: number
  currency: string
  method: 'M-Pesa' | 'Card' | 'Bank'
  status: TransactionStatus
  statusMessage: string
  type: TransactionType
  typeLabel: string
  typeBadge: { bg: string; text: string; icon: string }

  // Dates
  initiatedAt: string
  completedAt: string | null
  expiresAt: string | null

  // Enrichment: Subscription
  subscriptionId: string | null
  subscriptionTier: string | null
  subscriptionTierLabel: string | null
  subscriptionDuration: string | null
  subscriptionExpiresAt: string | null
  autoRenew: boolean

  // Enrichment: Order
  orderId: string | null
  orderNumber: string | null
  vendorName: string | null
  itemCount: number | null
  deliveryAddress: string | null
  deliveryStatus: string | null

  // Enrichment: Shopping
  shoppingListId: string | null
  shoppingListName: string | null
  shoppingItemCount: number | null
}

export type TransactionStats = {
  totalSpent: number
  successfulCount: number
  processingCount: number
  failedCount: number
  cancelledCount: number
  activeSubscriptions: number
}

export type TransactionsPayload = {
  transactions: TransactionRecord[]
  stats: TransactionStats
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type TransactionsQuery = {
  search: string
  status: TransactionStatus | 'All'
  type: TransactionType | 'All'
  page: number
}

// ── Constants ──────────────────────────────────────────

const PAGE_SIZE = 15

const TYPE_LABELS: Record<TransactionType, string> = {
  subscription: 'Subscription',
  meal_order: 'Meal Order',
  shopping_cart: 'Shopping Cart',
  vendor_subscription: 'Vendor Plan',
}

const TYPE_BADGES: Record<TransactionType, { bg: string; text: string; icon: string }> = {
  subscription: { bg: 'bg-violet-100', text: 'text-violet-700', icon: 'Sparkles' },
  meal_order: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'UtensilsCrossed' },
  shopping_cart: { bg: 'bg-sky-100', text: 'text-sky-700', icon: 'ShoppingBag' },
  vendor_subscription: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'Store' },
}

const TIER_LABELS: Record<string, string> = {
  daily: 'Daily Plan',
  weekly: 'Weekly Plan',
  monthly: 'Monthly Plan',
  yearly: 'Yearly Plan',
  free: 'Free Trial',
}

// ── Helpers ────────────────────────────────────────────

function deriveStatus(txn: any): TransactionStatus {
  if (txn.status === 'success') return 'Successful'
  if (txn.status === 'cancelled') return 'Cancelled'
  if (txn.status === 'failed') return 'Failed'
  return 'Processing'
}

function sanitize(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback
  return input.trim()
}

function isTransactionStatus(value: unknown): value is TransactionStatus {
  return ['Successful', 'Processing', 'Failed', 'Cancelled'].includes(value as string)
}

function isTransactionType(value: unknown): value is TransactionType {
  return ['subscription', 'meal_order', 'shopping_cart', 'vendor_subscription'].includes(value as string)
}

function formatDuration(days: number): string {
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days === 7) return '1 week'
  if (days < 30) return `${Math.round(days / 7)} weeks`
  if (days === 30) return '1 month'
  if (days < 365) return `${Math.round(days / 30)} months`
  return '1 year'
}

// ── Map raw transaction to display record ──────────────

function mapTransaction(
  txn: any,
  enrichment: {
    subscription?: any
    order?: any
    orderItems?: any[]
    vendor?: any
    shoppingList?: any
  }
): TransactionRecord {
  const status = deriveStatus(txn)
  const meta = txn.metadata ?? {}
  const purpose = txn.purpose ?? 'meal_order'

  // Determine type
  let type: TransactionType = 'meal_order'
  if (purpose === 'subscription') type = 'subscription'
  else if (purpose === 'vendor_subscription') type = 'vendor_subscription'
  else if (purpose === 'shopping_cart') type = 'shopping_cart'
  else if (purpose === 'meal_order') type = 'meal_order'

  // Determine payment method
  let method: 'M-Pesa' | 'Card' | 'Bank' = 'M-Pesa'
  if (txn.channel === 'card') method = 'Card'
  else if (txn.channel === 'bank') method = 'Bank'

  // Subscription enrichment
  const sub = enrichment.subscription
  const tier = sub?.tier ?? meta.tier ?? null
  const durationDays = meta.durationDays ?? (tier === 'daily' ? 1 : tier === 'weekly' ? 7 : tier === 'monthly' ? 30 : tier === 'yearly' ? 365 : null)

  // Order enrichment
  const order = enrichment.order
  const vendor = enrichment.vendor
  const orderItems = enrichment.orderItems ?? []

  // Shopping enrichment
  const shopList = enrichment.shoppingList

  return {
    id: `TXN-${(txn.id || '').slice(0, 8).toUpperCase()}`,
    internalReference: txn.reference || '',
    externalReference: txn.payhero_reference || '',
    mpesaReceipt: txn.mpesa_receipt || '',
    amount: Number(txn.amount || 0),
    currency: txn.currency || 'KES',
    method,
    status,
    statusMessage: txn.status_message || '',
    type,
    typeLabel: TYPE_LABELS[type],
    typeBadge: TYPE_BADGES[type],

    initiatedAt: txn.initiated_at || txn.created_at,
    completedAt: txn.completed_at || null,
    expiresAt: txn.expires_at || null,

    // Subscription
    subscriptionId: sub?.id ?? txn.related_id ?? null,
    subscriptionTier: tier,
    subscriptionTierLabel: tier ? (TIER_LABELS[tier] ?? tier) : null,
    subscriptionDuration: durationDays ? formatDuration(durationDays) : null,
    subscriptionExpiresAt: sub?.expires_at ?? null,
    autoRenew: sub?.auto_renew ?? meta.billingType === 'auto-renew',

    // Order
    orderId: order?.id ?? (type === 'meal_order' ? txn.related_id : null),
    orderNumber: order?.order_number ?? null,
    vendorName: vendor?.business_name ?? order?.vendor_name ?? null,
    itemCount: orderItems.length || null,
    deliveryAddress: order?.delivery_address ?? null,
    deliveryStatus: order?.status ?? null,

    // Shopping
    shoppingListId: shopList?.id ?? (type === 'shopping_cart' ? txn.related_id : null),
    shoppingListName: shopList?.name ?? null,
    shoppingItemCount: shopList?.item_count ?? meta.itemCount ?? null,
  }
}

// ── Build stats ────────────────────────────────────────

function buildStats(transactions: TransactionRecord[]): TransactionStats {
  let totalSpent = 0
  let successfulCount = 0
  let processingCount = 0
  let failedCount = 0
  let cancelledCount = 0
  let activeSubscriptions = 0

  for (const t of transactions) {
    if (t.status === 'Successful') {
      totalSpent += t.amount
      successfulCount++
    }
    if (t.status === 'Processing') processingCount++
    if (t.status === 'Failed') failedCount++
    if (t.status === 'Cancelled') cancelledCount++
    if (t.type === 'subscription' && t.subscriptionExpiresAt) {
      if (new Date(t.subscriptionExpiresAt).getTime() > Date.now()) {
        activeSubscriptions++
      }
    }
  }

  return {
    totalSpent,
    successfulCount,
    processingCount,
    failedCount,
    cancelledCount,
    activeSubscriptions,
  }
}

// ── Empty payload ──────────────────────────────────────

function emptyPayload(query: TransactionsQuery): TransactionsPayload {
  return {
    transactions: [],
    stats: {
      totalSpent: 0,
      successfulCount: 0,
      processingCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      activeSubscriptions: 0,
    },
    total: 0,
    page: query.page,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  }
}

// ── Main fetch function ────────────────────────────────

async function fetchTransactionsRaw(
  query: TransactionsQuery
): Promise<TransactionsPayload> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return emptyPayload(query)

  const page = Math.max(1, Math.floor(query.page))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // 1. Fetch transactions (the source of truth)
  const { data: txns, error: txnError, count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (txnError || !txns) {
    console.error('[Transactions] Fetch error:', txnError)
    return emptyPayload(query)
  }

  // 2. Enrich in parallel — batch all IDs by type
  const subscriptionIds = txns
    .filter(t => t.purpose === 'subscription' && t.related_id)
    .map(t => t.related_id)
    .filter(Boolean)

  const orderIds = txns
    .filter(t => t.purpose === 'meal_order' && t.related_id)
    .map(t => t.related_id)
    .filter(Boolean)

  const shoppingIds = txns
    .filter(t => t.purpose === 'shopping_cart' && t.related_id)
    .map(t => t.related_id)
    .filter(Boolean)

  // Fetch all enrichment data in parallel
  const [subscriptionsRes, ordersRes, orderItemsRes, shoppingListsRes] = await Promise.all([
    // Subscriptions
    subscriptionIds.length > 0
      ? supabase.from('subscriptions').select('*').in('id', subscriptionIds)
      : Promise.resolve({ data: [] as any[] }),

    // Orders
    orderIds.length > 0
      ? supabase.from('orders').select('id, order_number, vendor_id, vendor_name, delivery_address, status, created_at').in('id', orderIds)
      : Promise.resolve({ data: [] as any[] }),

    // Order items (if we have orders)
    orderIds.length > 0
      ? supabase.from('order_items').select('id, order_id, meal_id, quantity').in('order_id', orderIds)
      : Promise.resolve({ data: [] as any[] }),

    // Shopping lists
    shoppingIds.length > 0
      ? supabase.from('shopping_lists').select('id, name, item_count').in('id', shoppingIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  // 3. Build lookup maps
  const subscriptionMap = new Map<string, any>()
  for (const s of (subscriptionsRes.data ?? [])) {
    subscriptionMap.set(s.id, s)
  }

  const orderMap = new Map<string, any>()
  for (const o of (ordersRes.data ?? [])) {
    orderMap.set(o.id, o)
  }

  // Group order items by order_id
  const orderItemsMap = new Map<string, any[]>()
  for (const item of (orderItemsRes.data ?? [])) {
    const list = orderItemsMap.get(item.order_id) ?? []
    list.push(item)
    orderItemsMap.set(item.order_id, list)
  }

  const shoppingMap = new Map<string, any>()
  for (const sl of (shoppingListsRes.data ?? [])) {
    shoppingMap.set(sl.id, sl)
  }

  // 4. Fetch vendor names for orders
  const vendorIds = Array.from(new Set(
    (ordersRes.data ?? [])
      .map((o: any) => o.vendor_id)
      .filter(Boolean)
  ))

  const vendorMap = new Map<string, string>()
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, business_name')
      .in('id', vendorIds)

    for (const v of (vendors ?? []) as any[]) {
      vendorMap.set(v.id, v.business_name || 'Pika Kitchen')
    }
  }

  // 5. Map to display records
  let transactions: TransactionRecord[] = txns.map(txn => {
    const sub = subscriptionMap.get(txn.related_id)
    const order = orderMap.get(txn.related_id)
    const orderItems = orderItemsMap.get(txn.related_id) ?? []
    const shopList = shoppingMap.get(txn.related_id)

    return mapTransaction(txn, {
      subscription: sub,
      order,
      orderItems,
      vendor: vendorMap.get(order?.vendor_id),
      shoppingList: shopList,
    })
  })

  // 6. Apply search filter
  const search = query.search.trim().toLowerCase()
  if (search) {
    transactions = transactions.filter(t =>
      `${t.id} ${t.internalReference} ${t.externalReference} ${t.mpesaReceipt} ${t.vendorName ?? ''} ${t.typeLabel} ${t.subscriptionTierLabel ?? ''}`.toLowerCase().includes(search)
    )
  }

  // 7. Apply status filter
  if (query.status !== 'All') {
    transactions = transactions.filter(t => t.status === query.status)
  }

  // 8. Apply type filter
  if (query.type !== 'All') {
    transactions = transactions.filter(t => t.type === query.type)
  }

  const total = count ?? transactions.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return {
    transactions,
    stats: buildStats(transactions),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  }
}

// ── Public API ─────────────────────────────────────────

export async function fetchUserTransactions(
  raw: Partial<TransactionsQuery> = {}
): Promise<TransactionsPayload> {
  const query: TransactionsQuery = {
    search: sanitize(raw.search, ''),
    status: isTransactionStatus(raw.status) ? raw.status : 'All',
    type: isTransactionType(raw.type) ? raw.type : 'All',
    page: Math.max(1, Math.floor(Number(raw.page) || 1)),
  }

  try {
    return await fetchTransactionsRaw(query)
  } catch (err) {
    console.error('[Transactions] Fatal error:', err)
    return emptyPayload(query)
  }
}