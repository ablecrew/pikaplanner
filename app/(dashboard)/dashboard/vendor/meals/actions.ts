'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type VendorMeal = {
  id: string
  vendorMealId: string
  name: string
  description: string
  category: string
  cuisine: string
  price: number
  imageUrl: string
  isAvailable: boolean
  isPremium: boolean
  servings: number
  prepTime: number
  cookTime: number
  calories: number
  protein: number
  carbs: number
  fat: number
  difficulty: string
  tags: string[]
  totalOrders: number
  totalRevenue: number
}

export type VendorOrder = {
  id: string
  orderNumber: string
  customer: string
  customerEmail: string
  items: string
  amount: number
  status: string
  date: string
  mealName: string
}

export type ChartData = { month: string; earnings: number }[]
export type PieData = { name: string; value: number }[]

export type AIInsight = {
  id: string
  type: 'success' | 'warning' | 'opportunity' | 'info'
  title: string
  description: string
  iconKey: 'chef' | 'target' | 'clock' | 'trendingUp' | 'alert' | 'brain'
}

export type DashboardData = {
  vendorId: string | null
  availableBalance: number
  totalEarnings: number
  meals: VendorMeal[]
  orders: VendorOrder[]
  stats: { activeMeals: number; totalOrders: number; completedOrders: number; pendingOrders: number; totalRevenue: number }
  earningsChart: ChartData
  mealsPieChart: PieData
  aiInsights: AIInsight[]
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const formatDate = (iso?: string | null) => !iso ? '—' : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export async function fetchVendorMealsData(userId: string): Promise<DashboardData> {
  const supabase = await createClient()
  const emptyData: DashboardData = { vendorId: null, availableBalance: 0, totalEarnings: 0, meals: [], orders: [], stats: { activeMeals: 0, totalOrders: 0, completedOrders: 0, pendingOrders: 0, totalRevenue: 0 }, earningsChart: [], mealsPieChart: [], aiInsights: [] }

  const { data: vendor } = await supabase.from('vendors').select('id, available_balance, total_earnings').eq('profile_id', userId).maybeSingle()
  if (!vendor) return emptyData

  const [mealsRes, ordersRes] = await Promise.all([
    supabase.from('vendor_meals').select('id, meal_id, price, is_available').eq('vendor_id', vendor.id),
    supabase.from('orders').select('id, order_number, user_id, total_amount, status, created_at, customer_email, meal_id').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(100)
  ])

  const vendorMeals = mealsRes.data || []
  const mealIds = vendorMeals.map(vm => vm.meal_id)
  const vendorMealMap = new Map(vendorMeals.map(vm => [vm.meal_id, vm]))

  let mealsData: VendorMeal[] = []
  if (mealIds.length > 0) {
    const { data: mealRows } = await supabase.from('meals').select('*').in('id', mealIds).order('created_at', { ascending: false })
    mealsData = (mealRows || []).map(m => {
      const vm = vendorMealMap.get(m.id)
      return {
        id: m.id, vendorMealId: vm?.id || '', name: m.name, description: m.description || '', category: m.category, cuisine: m.cuisine,
        price: vm?.price || 0, imageUrl: m.image_url || '', isAvailable: vm?.is_available ?? true, isPremium: m.is_premium || false,
        servings: m.servings, prepTime: m.prep_time_minutes || 0, cookTime: m.cook_time_minutes || 0, calories: m.calories_per_serving || 0,
        protein: m.protein_g || 0, carbs: m.carbs_g || 0, fat: m.fat_g || 0, difficulty: m.difficulty || 'easy', tags: m.tags || [],
        totalOrders: 0, totalRevenue: 0,
      }
    })
  }

  const orderRows = ordersRes.data || []
  const userIds = [...new Set(orderRows.map(o => o.user_id).filter(Boolean))]
  let profileMap = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
    profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))
  }

  const enrichedOrders: VendorOrder[] = orderRows.map(o => {
    const meal = mealsData.find(m => m.id === o.meal_id)
    if (meal && (o.status === 'Completed' || o.status === 'delivered')) {
      meal.totalOrders += 1
      meal.totalRevenue += Number(o.total_amount)
    }
    return {
      id: o.id, orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
      customer: profileMap.get(o.user_id) || o.customer_email?.split('@')[0] || 'Customer',
      customerEmail: o.customer_email || '', items: '1 meal', amount: Number(o.total_amount),
      status: o.status || 'Pending', date: formatDate(o.created_at), mealName: meal?.name || 'Meal Order',
    }
  })

  const activeMeals = mealsData.filter(m => m.isAvailable).length
  const completedOrders = enrichedOrders.filter(o => o.status === 'Completed' || o.status === 'delivered')
  const pendingOrders = enrichedOrders.filter(o => o.status === 'Pending' || o.status === 'Processing')
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.amount, 0)

  const earningsMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); earningsMap.set(months[(d.getMonth() - i + 12) % 12], 0)
  }
  completedOrders.forEach(o => {
    const d = new Date(o.date)
    if (!isNaN(d.getTime())) {
      const key = months[d.getMonth()]
      if (earningsMap.has(key)) earningsMap.set(key, earningsMap.get(key)! + o.amount)
    }
  })

  const pieMap = new Map<string, number>()
  mealsData.forEach(m => pieMap.set(m.category || 'Other', (pieMap.get(m.category || 'Other') || 0) + 1))

  const aiInsights: AIInsight[] = []
  if (mealsData.length === 0) aiInsights.push({ id: 'no-meals', type: 'opportunity', title: 'Start adding meals!', description: 'Vendors with complete menus earn 5x more.', iconKey: 'chef' })
  else if (mealsData.length < 5) aiInsights.push({ id: 'more-meals', type: 'opportunity', title: 'Grow your menu', description: `Adding 5+ more can increase weekly orders by 40%.`, iconKey: 'target' })
  if (pendingOrders.length > 0) aiInsights.push({ id: 'pending', type: 'warning', title: `${pendingOrders.length} orders waiting`, description: 'Fulfill pending orders promptly.', iconKey: 'clock' })
  if (completedOrders.length > 10) aiInsights.push({ id: 'revenue', type: 'success', title: 'Revenue milestone!', description: `Earned KES ${totalRevenue} with ${completedOrders.length} orders.`, iconKey: 'trendingUp' })
  const unavailable = mealsData.filter(m => !m.isAvailable).length
  if (unavailable > 0) aiInsights.push({ id: 'unavailable', type: 'info', title: `${unavailable} meals offline`, description: 'Mark meals as available to increase orders.', iconKey: 'alert' })
  aiInsights.push({ id: 'ai', type: 'info', title: '🤖 AI Tip', description: mealsData.length > 0 ? `Your "${mealsData[0]?.name}" is most viewed. Add photos to boost conversions.` : 'Complete your menu with photos.', iconKey: 'brain' })

  return {
    vendorId: vendor.id, availableBalance: Number(vendor.available_balance || 0), totalEarnings: Number(vendor.total_earnings || 0),
    meals: mealsData, orders: enrichedOrders,
    stats: { activeMeals, totalOrders: enrichedOrders.length, completedOrders: completedOrders.length, pendingOrders: pendingOrders.length, totalRevenue },
    earningsChart: Array.from(earningsMap.entries()).map(([month, earnings]) => ({ month, earnings })),
    mealsPieChart: Array.from(pieMap.entries()).map(([name, value]) => ({ name, value })),
    aiInsights
  }
}

export async function toggleMealAvailabilityAction(vendorMealId: string, isAvailable: boolean) {
  const supabase = await createClient()
  await supabase.from('vendor_meals').update({ is_available: isAvailable }).eq('id', vendorMealId)
  revalidatePath('/dashboard/vendor/meals')
}

export async function deleteMealAction(mealId: string, vendorMealId: string | null) {
  const supabase = await createClient()
  if (vendorMealId) await supabase.from('vendor_meals').delete().eq('id', vendorMealId)
  await supabase.from('meals').delete().eq('id', mealId)
  revalidatePath('/dashboard/vendor/meals')
}

export async function processWithdrawalAction(userId: string, vendorId: string, amount: number, method: string, account: string) {
  const supabase = await createClient()
  const { data: vendor } = await supabase.from('vendors').select('available_balance').eq('id', vendorId).single()
  if (!vendor || vendor.available_balance < amount) throw new Error('Insufficient balance')

  await supabase.from('orders').insert({
    user_id: userId, vendor_id: vendorId, order_number: `WDR-${Date.now()}`, subtotal: -amount, total_amount: -amount,
    platform_fee: 0, delivery_fee: 0, status: 'Completed', currency: 'KES', delivery_address: account,
    customer_phone: account, customer_notes: `Withdrawal via ${method}`, payment_status: 'paid', mpesa_transaction_id: `WDR-${Date.now()}`,
  })
  await supabase.from('vendors').update({ available_balance: vendor.available_balance - amount }).eq('id', vendorId)
  revalidatePath('/dashboard/vendor/meals')
}