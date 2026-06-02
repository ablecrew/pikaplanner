'use server'

import { createClient } from '@/lib/supabase/server'

export type ServerOrder = {
  id: string
  orderNumber: string
  vendor: string
  vendorLocation: string
  mealName: string
  amount: number
  subtotal: number
  deliveryFee: number
  platformFee: number
  netAmount: number
  status: string
  paymentStatus: string
  items: number
  deliveryAddress: string
  customerNotes: string
  transactionId: string
  createdAt: string
  updatedAt: string
}

export type OrdersPage = {
  totalSpent: number
  orders: ServerOrder[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  debug?: {
    userId: string | null
    ordersFound: number
    joinedQuery: boolean
  }
}

const PAGE_SIZE = 20

function formatOrder(
  order: any,
  itemMap: Map<string, any[]>,
  vendorMap: Map<string, any>
): ServerOrder {
  const items = itemMap.get(order.id) || []
  const vendor = vendorMap.get(order.vendor_id)

  let mealName = 'Order'
  if (items.length === 1) {
    mealName = items[0]?.ingredient_name || items[0]?.item_description || 'Order'
  } else if (items.length > 1) {
    const first = items[0]?.ingredient_name || items[0]?.item_description || 'Order'
    mealName = `${first} & ${items.length - 1} more`
  }

  const amount = Number(order.total_amount ?? 0)
  const deliveryFee = Number(order.delivery_fee ?? 0)
  const platformFee = Number(order.platform_fee ?? 0)
  const subtotal = Number(order.subtotal ?? amount)

  return {
    id: order.id,
    orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
    vendor: vendor?.business_name || 'Vendor',
    vendorLocation: vendor?.location_city || '—',
    mealName,
    amount: Math.abs(amount),
    subtotal: Math.abs(subtotal),
    deliveryFee: Math.abs(deliveryFee),
    platformFee: Math.abs(platformFee),
    netAmount: Math.abs(amount - deliveryFee - platformFee),
    status: order.status || 'Pending',
    paymentStatus: order.payment_status || 'Pending',
    items: items.length || 1,
    deliveryAddress: order.delivery_address || '—',
    customerNotes: order.customer_notes || '—',
    transactionId: order.mpesa_transaction_id || '—',
    createdAt: order.created_at || '',
    updatedAt: order.updated_at || '',
  }
}

export async function fetchUserOrders(page: number = 1): Promise<OrdersPage> {
  const safePage = Math.max(1, Math.floor(page))
  const from = (safePage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      totalSpent: 0,
      orders: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      totalPages: 0,
      debug: { userId: null, ordersFound: 0, joinedQuery: true },
    }
  }

  // Try joined query first
  const joinedRes = await supabase
    .from('orders')
    .select(`
      id, order_number, vendor_id, subtotal, total_amount, platform_fee, delivery_fee,
      status, payment_status, delivery_address, customer_notes, mpesa_transaction_id,
      created_at, updated_at,
      order_items ( ingredient_name, item_description, quantity ),
      vendors ( business_name, location_city )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  let orders: any[] = []
  let usedJoin = true

  if (joinedRes.error) {
    console.warn('Joined orders query failed, falling back:', joinedRes.error.message)
    usedJoin = false

    const plainRes = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (plainRes.error) {
      console.error('Plain orders query also failed:', plainRes.error)
      return {
        totalSpent: 0,
        orders: [],
        total: 0,
        page: safePage,
        pageSize: PAGE_SIZE,
        totalPages: 0,
        debug: { userId: user.id, ordersFound: 0, joinedQuery: false },
      }
    }
    orders = plainRes.data || []
  } else {
    orders = joinedRes.data || []
  }

  // Count total orders for pagination
  const countRes = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // All-time total spent (completed + delivered)
  const spentRes = await supabase
    .from('orders')
    .select('total_amount')
    .eq('user_id', user.id)
    .in('status', ['Delivered', 'Completed'])

  const totalSpent = (spentRes.data || []).reduce(
    (acc, row: any) => acc + Number(row.total_amount || 0),
    0
  )

  const total = countRes.count || orders.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Build maps for items and vendors (used for joined + plain fallback)
  const itemMap = new Map<string, any[]>()
  const vendorMap = new Map<string, any>()

  if (orders.length > 0) {
    const orderIds = orders.map((o) => o.id)
    const vendorIds = [
      ...new Set(orders.map((o) => o.vendor_id).filter(Boolean) as string[]),
    ]

    const [itemsRes, vendorsRes] = await Promise.all([
      supabase
        .from('order_items')
        .select('order_id, ingredient_name, item_description, quantity')
        .in('order_id', orderIds),
      vendorIds.length > 0
        ? supabase
            .from('vendors')
            .select('id, business_name, location_city')
            .in('id', vendorIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    ;(itemsRes.data || []).forEach((item: any) => {
      const list = itemMap.get(item.order_id) || []
      list.push(item)
      itemMap.set(item.order_id, list)
    })

    ;((vendorsRes as any).data || []).forEach((v: any) => {
      vendorMap.set(v.id, v)
    })
  }

  const mapped = orders.map((o) => formatOrder(o, itemMap, vendorMap))

  return {
    orders: mapped,
    total,
    totalSpent,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalPages,
    debug: {
      userId: user.id,
      ordersFound: orders.length,
      joinedQuery: usedJoin,
    },
  }
}