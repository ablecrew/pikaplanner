'use server'

import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

export type ServerOrder = {
  id: string
  orderNumber: string
  vendor: string
  vendorLocation: string
  mealName: string
  amount: number
  status: string
  paymentStatus: string
  items: number
  deliveryAddress: string
  customerNotes: string
  transactionId: string
  createdAt: string
}

export type OrdersPage = {
  orders: ServerOrder[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function fetchUserOrders(
  page: number = 1
): Promise<OrdersPage> {
  const safePage = Math.max(1, Math.floor(page))
  const from = (safePage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { orders: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 }
  }

  // Count + page query in parallel
  const [countRes, ordersRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        vendor_id,
        subtotal,
        total_amount,
        platform_fee,
        delivery_fee,
        status,
        payment_status,
        delivery_address,
        customer_notes,
        mpesa_transaction_id,
        created_at,
        updated_at,
        order_items ( ingredient_name, item_description, quantity ),
        vendors ( business_name, location_city )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to),
  ])

  if (ordersRes.error) throw ordersRes.error

  const total = countRes.count || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const orders: ServerOrder[] = (ordersRes.data ?? []).map((o: any) => {
    const items: any[] = Array.isArray(o.order_items) ? o.order_items : []
    const vendor: any = o.vendors

    let mealName = 'Order'
    if (items.length === 1) {
      mealName = items[0].ingredient_name || items[0].item_description || 'Order'
    } else if (items.length > 1) {
      const first = items[0].ingredient_name || items[0].item_description || 'Order'
      mealName = `${first} & ${items.length - 1} more`
    }

    return {
      id: o.id,
      orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
      vendor: vendor?.business_name || 'Vendor',
      vendorLocation: vendor?.location_city || '—',
      mealName,
      amount: Math.abs(Number(o.total_amount ?? 0)),
      status: o.status || 'Pending',
      paymentStatus: o.payment_status || 'Pending',
      items: items.length || 1,
      deliveryAddress: o.delivery_address || '—',
      customerNotes: o.customer_notes || '—',
      transactionId: o.mpesa_transaction_id || '—',
      createdAt: o.created_at || '',
    }
  })

  return {
    orders,
    total,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalPages,
  }
}