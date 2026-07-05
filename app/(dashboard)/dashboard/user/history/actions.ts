'use server'

import { createClient } from '@/lib/supabase/server'

export type HistoryOrder = {
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
  deliveryAddress: string
  customerNotes: string
  transactionId: string
  createdAt: string
  updatedAt: string
}

type VendorInfo = {
  id: string
  business_name?: string
  location_city?: string
}

export async function fetchUserOrders(userId: string): Promise<HistoryOrder[]> {
  const supabase = await createClient()

  // 1. Fetch Orders
  const { data: orderRows, error: oe } = await supabase
    .from('orders')
    .select('id, order_number, vendor_id, subtotal, total_amount, platform_fee, delivery_fee, status, payment_status, delivery_address, customer_notes, mpesa_transaction_id, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(250)

  if (oe || !orderRows || orderRows.length === 0) return []

  const orderIds = orderRows.map((o: any) => o.id)
  const vendorIds = Array.from(new Set(orderRows.map((o: any) => o.vendor_id).filter(Boolean))) as string[]

  // 2. Fetch Items and Vendors IN PARALLEL (Massive speedup)
  const [itemsRes, vendorsRes] = await Promise.all([
    supabase.from('order_items').select('order_id, ingredient_name, item_description, quantity').in('order_id', orderIds),
    vendorIds.length > 0 
      ? supabase.from('vendors').select('id, business_name, location_city').in('id', vendorIds) 
      : Promise.resolve({ data: [] })
  ])

  const orderItems = itemsRes.data || []
  const vendors = vendorsRes.data || []

  // 3. Map Data
  const vendorMap = new Map<string, VendorInfo>(vendors.map((v: any) => [v.id, v]))
  
  // Group items by order_id
  const itemsByOrder = new Map<string, any[]>()
  orderItems.forEach((item: any) => {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, [])
    itemsByOrder.get(item.order_id)!.push(item)
  })

  return orderRows.map((o: any) => {
    const vendor = vendorMap.get(o.vendor_id)
    const items = itemsByOrder.get(o.id) || []
    
    let mealName = 'Order'
    if (items.length > 0) {
      const firstName = items[0].ingredient_name || items[0].item_description || 'Order'
      mealName = items.length === 1 ? firstName : `${firstName} & ${items.length - 1} more`
    }

    const amount = Number(o.total_amount ?? 0)
    return {
      id: o.id,
      orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
      vendor: vendor?.business_name || 'Vendor',
      vendorLocation: vendor?.location_city || '—',
      mealName,
      amount: Math.abs(amount),
      subtotal: Math.abs(Number(o.subtotal ?? amount)),
      deliveryFee: Math.abs(Number(o.delivery_fee ?? 0)),
      platformFee: Math.abs(Number(o.platform_fee ?? 0)),
      netAmount: Math.abs(amount - Number(o.delivery_fee ?? 0) - Number(o.platform_fee ?? 0)),
      status: o.status || 'Pending',
      paymentStatus: o.payment_status || 'Pending',
      deliveryAddress: o.delivery_address || '—',
      customerNotes: o.customer_notes || '—',
      transactionId: o.mpesa_transaction_id || '—',
      createdAt: o.created_at || '',
      updatedAt: o.updated_at || '',
    }
  })
}