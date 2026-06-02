'use server'

import { createClient } from '@/lib/supabase/server'

export type VendorRecord = {
  id: string
  business_name: string | null
  phone: string | null
  rating?: number | null
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded'

export type ActiveOrder = {
  id: string
  orderNumber: string
  vendorName: string
  vendorPhone: string
  itemsCount: number
  amount: number
  status: OrderStatus
  eta: string
  createdAt: string
  progress: number
}

export type RecommendedMeal = {
  id: string
  name: string
  vendor: string
  vendorId: string
  price: number
  rating: number
  category: string
  image: string
  prepTime: number
  calories: number
  cuisine: string
}

export type UserOverviewData = {
  userName: string
  activeOrders: ActiveOrder[]
  recommendedMeals: RecommendedMeal[]
  totalSpent: number
  pastOrdersCount: number
  favoritesCount: number
}

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  'Pending': 15,
  'Confirmed': 35,
  'Preparing': 55,
  'Ready': 75,
  'Out for Delivery': 90,
  'Delivered': 100,
  'Cancelled': 0,
  'Refunded': 0,
}

export async function fetchUserOverview(): Promise<UserOverviewData | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const userName =
    profile?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'Foodie'

  // Orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allOrders = (orders || []) as Array<Record<string, any>>

  const completed = allOrders.filter(
    (o) => o.status === 'Delivered' || o.status === 'Completed',
  )
  const pastOrdersCount = completed.length
  const totalSpent = completed.reduce(
    (acc, o) => acc + Number(o.total_amount || 0),
    0,
  )

  const activeRows = allOrders.filter(
    (o) => !['Delivered', 'Completed', 'Cancelled', 'Refunded'].includes(o.status),
  )

  const activeOrderIds = activeRows.map((o) => o.id)

  // Order items count
  let activeOrderItems: Array<{ order_id: string; quantity: number | null }> = []
  if (activeOrderIds.length > 0) {
    const { data } = await supabase
      .from('order_items')
      .select('order_id, quantity')
      .in('order_id', activeOrderIds)
    activeOrderItems =
      (data as Array<{ order_id: string; quantity: number | null }>) || []
  }

  const orderItemsCountMap = new Map<string, number>()
  activeOrderItems.forEach((item) => {
    const current = orderItemsCountMap.get(item.order_id) || 0
    orderItemsCountMap.set(item.order_id, current + (item.quantity || 1))
  })

  // Vendors
  const vendorIds = [
    ...new Set(activeRows.map((o) => o.vendor_id).filter(Boolean) as string[]),
  ]
  let vendors: VendorRecord[] = []
  if (vendorIds.length > 0) {
    const { data } = await supabase
      .from('vendors')
      .select('id, business_name, phone')
      .in('id', vendorIds)
    vendors = (data as VendorRecord[]) || []
  }
  const vendorMap = new Map<string, VendorRecord>(vendors.map((v) => [v.id, v]))

  const activeOrders: ActiveOrder[] = activeRows.map((o) => {
    const vendor = vendorMap.get(o.vendor_id)
    const progress = STATUS_PROGRESS[o.status as OrderStatus] ?? 15

    let eta = '30 min'
    if (o.status === 'Preparing') eta = '20 min'
    else if (o.status === 'Ready') eta = '15 min'
    else if (o.status === 'Out for Delivery') eta = '8 min'

    return {
      id: o.id,
      orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
      vendorName: vendor?.business_name || 'Kitchen',
      vendorPhone: vendor?.phone || '',
      itemsCount: orderItemsCountMap.get(o.id) || 1,
      amount: Number(o.total_amount || 0),
      status: (o.status as OrderStatus) || 'Pending',
      eta,
      createdAt: o.created_at,
      progress,
    }
  })

  // Recommended meals
  const { data: vendorMeals } = await supabase
    .from('vendor_meals')
    .select('meal_id, vendor_id, price, is_available')
    .eq('is_available', true)
    .limit(40)

  const vendorMealsList = (vendorMeals || []) as Array<{
    meal_id: string
    vendor_id: string
    price: number | null
    is_available: boolean | null
  }>

  let recommendedMeals: RecommendedMeal[] = []

  const activeMealIds = vendorMealsList.map((vm) => vm.meal_id)
  if (activeMealIds.length > 0) {
    const { data: meals } = await supabase
      .from('meals')
      .select('*')
      .in('id', activeMealIds)
      .limit(8)

    const recVendorIds = [
      ...new Set(vendorMealsList.map((vm) => vm.vendor_id)),
    ]
    let recVendors: VendorRecord[] = []
    if (recVendorIds.length > 0) {
      const { data } = await supabase
        .from('vendors')
        .select('id, business_name, phone, rating')
        .in('id', recVendorIds)
      recVendors = (data as VendorRecord[]) || []
    }
    const recVendorMap = new Map<string, VendorRecord>(
      recVendors.map((v) => [v.id, v]),
    )

    const mealsList = (meals || []) as Array<Record<string, any>>

    recommendedMeals = mealsList
      .map((m) => {
        const vm = vendorMealsList.find((v) => v.meal_id === m.id)
        if (!vm) return null

        const vendorObj = recVendorMap.get(vm.vendor_id)
        if (!vendorObj) return null

        return {
          id: m.id,
          name: m.name,
          vendor: vendorObj.business_name || '',
          vendorId: vm.vendor_id,
          price: Number(vm.price || 0),
          rating: Number(vendorObj.rating || 0),
          category: m.category || '',
          image: m.image_url || '',
          prepTime: m.prep_time_minutes || 0,
          calories: m.calories_per_serving || 0,
          cuisine: m.cuisine || '',
        } as RecommendedMeal
      })
      .filter((item): item is RecommendedMeal => item !== null)
  }

  return {
    userName,
    activeOrders,
    recommendedMeals,
    totalSpent,
    pastOrdersCount,
    favoritesCount: 0, // filled in from client (localStorage)
  }
}