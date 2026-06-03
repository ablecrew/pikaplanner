'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type OrderItem = {
  meal_id: string
  meal_name: string
  quantity: number
  price: number
  notes?: string
}

export type VendorOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  platformFee: number
  deliveryFee: number
  totalAmount: number
  paymentStatus: PaymentStatus
  status: OrderStatus
  deliveryAddress: string
  customerNotes: string
  mpesaCode: string
  createdAt: string
  updatedAt: string
}

export type Stats = {
  todayOrders: number
  pendingCount: number
  activeCount: number
  todayRevenue: number
  totalRevenue: number
  avgOrderValue: number
  completionRate: number
}

export type ChartData = { day: string; revenue: number }[]
export type PieData = { name: string; value: number }[]

export type DashboardData = {
  vendorId: string | null
  orders: VendorOrder[]
  stats: Stats
  revenueChart: ChartData
  statusChart: PieData
}

export async function fetchVendorOrdersData(userId: string): Promise<DashboardData> {
  const supabase = await createClient()
  const emptyData: DashboardData = { vendorId: null, orders: [], stats: { todayOrders: 0, pendingCount: 0, activeCount: 0, todayRevenue: 0, totalRevenue: 0, avgOrderValue: 0, completionRate: 0 }, revenueChart: [], statusChart: [] }

  const { data: vendor } = await supabase.from('vendors').select('id').eq('profile_id', userId).maybeSingle()
  if (!vendor) return emptyData

  const { data: orderRows } = await supabase.from('orders').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false })
  if (!orderRows || orderRows.length === 0) return { ...emptyData, vendorId: vendor.id }

  const userIds = [...new Set(orderRows.map(o => o.user_id).filter(Boolean))]
  const orderIds = orderRows.map(o => o.id)

  // 🚀 PARALLEL FETCHING
  const [profilesRes, itemsRes] = await Promise.all([
    userIds.length > 0 ? supabase.from('profiles').select('id, full_name, email').in('id', userIds) : Promise.resolve({ data: [] }),
    orderIds.length > 0 ? supabase.from('order_items').select('*').in('order_id', orderIds) : Promise.resolve({ data: [] })
  ])

  const mealIds = [...new Set((itemsRes.data || []).map(i => i.meal_id).filter(Boolean))]
  const { data: meals } = mealIds.length > 0 ? await supabase.from('meals').select('id, name').in('id', mealIds) : { data: [] }

  const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]))
  const mealMap = new Map((meals || []).map(m => [m.id, m]))
  
  const itemsByOrder = new Map<string, any[]>()
  ;(itemsRes.data || []).forEach(item => {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, [])
    itemsByOrder.get(item.order_id)!.push(item)
  })

  const orders: VendorOrder[] = orderRows.map(o => {
    const profile = profileMap.get(o.user_id)
    const items = (itemsByOrder.get(o.id) || []).map(item => ({
      meal_id: item.meal_id,
      meal_name: mealMap.get(item.meal_id)?.name || 'Meal',
      quantity: item.quantity || 1,
      price: Number(item.price || 0),
      notes: item.notes || '',
    }))

    return {
      id: o.id, orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
      customerName: profile?.full_name || o.customer_email?.split('@')[0] || 'Customer',
      customerEmail: o.customer_email || profile?.email || '', customerPhone: o.customer_phone || '',
      items, subtotal: Number(o.subtotal || 0), platformFee: Number(o.platform_fee || 0),
      deliveryFee: Number(o.delivery_fee || 0), totalAmount: Number(o.total_amount || 0),
      paymentStatus: (o.payment_status as PaymentStatus) || 'pending', status: (o.status as OrderStatus) || 'Pending',
      deliveryAddress: o.delivery_address || '', customerNotes: o.customer_notes || '',
      mpesaCode: o.mpesa_transaction_id || '', createdAt: o.created_at, updatedAt: o.updated_at || o.created_at,
    }
  })

  // Calculate Stats on Server
  const now = Date.now()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayOrders = orders.filter(o => new Date(o.createdAt).getTime() >= todayStart.getTime())
  const pendingCount = orders.filter(o => o.status === 'Pending').length
  const activeCount = orders.filter(o => ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)).length
  const completedOrders = orders.filter(o => o.status === 'Delivered')
  const todayRevenue = todayOrders.filter(o => o.status === 'Delivered').reduce((s, o) => s + o.totalAmount, 0)
  const totalRevenue = completedOrders.reduce((s, o) => s + o.totalAmount, 0)

  const stats: Stats = {
    todayOrders: todayOrders.length, pendingCount, activeCount, todayRevenue, totalRevenue,
    avgOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
    completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0,
  }

  // Calculate Charts on Server
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const revMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); revMap.set(days[d.getDay()], 0) }
  completedOrders.forEach(o => {
    const d = new Date(o.createdAt)
    if (Date.now() - d.getTime() < 7 * 86400000) {
      const key = days[d.getDay()]
      if (revMap.has(key)) revMap.set(key, revMap.get(key)! + o.totalAmount)
    }
  })
  const revenueChart = Array.from(revMap.entries()).map(([day, revenue]) => ({ day, revenue }))

  const statusMap = new Map<string, number>()
  orders.forEach(o => statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1))
  const statusChart = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }))

  return { vendorId: vendor.id, orders, stats, revenueChart, statusChart }
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  const supabase = await createClient()
  await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
  revalidatePath('/dashboard/vendor/orders')
}

export async function cancelOrderAction(orderId: string) {
  const supabase = await createClient()
  await supabase.from('orders').update({ status: 'Cancelled', updated_at: new Date().toISOString() }).eq('id', orderId)
  revalidatePath('/dashboard/vendor/orders')
}