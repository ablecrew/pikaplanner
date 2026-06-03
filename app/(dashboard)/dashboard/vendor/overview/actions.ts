'use server'

import { createClient } from '@/lib/supabase/server'

export type RecentOrder = {
  id: string
  customer: string
  items: string
  amount: string
  status: string
  date: string
}

export type AIInsight = {
  id: string
  type: 'success' | 'warning' | 'opportunity' | 'info'
  title: string
  description: string
  iconKey: 'trendingUp' | 'trendingDown' | 'clock' | 'chef' | 'star' | 'brain'
}

export type VendorStats = {
  todayRevenue: number
  activeOrders: number
  totalMeals: number
  avgRating: number
  revenueTrend: number
  ordersTrend: number
  weeklyOrders: { day: string; orders: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
  recentOrders: RecentOrder[]
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedToday: number
}

export type DashboardData = {
  stats: VendorStats
  insights: AIInsight[]
}

const formatCurrency = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function fetchVendorDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient()

  // 1. Get Vendor Profile
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, average_rating, total_orders, total_earnings')
    .eq('profile_id', userId)
    .single()

  if (!vendor) {
    return {
      stats: {
        todayRevenue: 0, activeOrders: 0, totalMeals: 0, avgRating: 0,
        revenueTrend: 0, ordersTrend: 0, weeklyOrders: [], monthlyRevenue: [],
        recentOrders: [], totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedToday: 0
      },
      insights: []
    }
  }

  // 🚀 PARALLEL FETCHING (Massive speedup)
  const [ordersRes, mealsRes] = await Promise.all([
    supabase.from('orders').select('id, total_amount, status, created_at, user_id, customer_email')
      .eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(100),
    supabase.from('vendor_meals').select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id).eq('is_available', true)
  ])

  const validOrders = (ordersRes.data || []).filter((o: any) => Number(o.total_amount) > 0)
  const mealCount = mealsRes.count || 0

  // Date calculations
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today.getTime() - 86400000)

  const todayOrders = validOrders.filter((o: any) => new Date(o.created_at) >= today)
  const todayRevenue = todayOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0)
  const activeOrders = validOrders.filter((o: any) => o.status === 'Pending' || o.status === 'Processing').length
  const completedToday = todayOrders.filter((o: any) => o.status === 'Completed' || o.status === 'delivered').length

  const yesterdayOrders = validOrders.filter((o: any) => {
    const d = new Date(o.created_at)
    return d >= yesterday && d < today
  })
  const yesterdayRevenue = yesterdayOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0)

  // Trends
  const revenueTrend = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0
  const ordersTrend = yesterdayOrders.length > 0 ? Math.round(((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100) : 0

  // Weekly Orders Map
  const weeklyMap = new Map<string, number>()
  days.forEach(d => weeklyMap.set(d, 0))
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  validOrders.forEach((o: any) => {
    const d = new Date(o.created_at)
    if (d >= weekStart) {
      const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1]
      weeklyMap.set(dayName, (weeklyMap.get(dayName) || 0) + 1)
    }
  })

  // Monthly Revenue Map
  const monthlyMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    monthlyMap.set(months[d.getMonth()], 0)
  }
  validOrders.forEach((o: any) => {
    const d = new Date(o.created_at)
    const key = months[d.getMonth()]
    if (monthlyMap.has(key)) monthlyMap.set(key, monthlyMap.get(key)! + Number(o.total_amount))
  })

  // 🚀 BATCHED PROFILE FETCH (Instead of 5 separate queries)
  const recentRaw = validOrders.slice(0, 5)
  const userIds = [...new Set(recentRaw.map((o: any) => o.user_id).filter(Boolean))]
  let profileMap = new Map<string, string>()
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
    profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]))
  }

  const recentOrders: RecentOrder[] = recentRaw.map((o: any) => ({
    id: o.id.slice(0, 8).toUpperCase(),
    customer: profileMap.get(o.user_id) || o.customer_email?.split('@')[0] || 'Customer',
    items: 'Meal Order',
    amount: formatCurrency(Number(o.total_amount)),
    status: o.status || 'Pending',
    date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const totalRevenue = validOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0)

  const stats: VendorStats = {
    todayRevenue, activeOrders, totalMeals: mealCount, avgRating: vendor.average_rating || 0,
    revenueTrend, ordersTrend,
    weeklyOrders: Array.from(weeklyMap.entries()).map(([day, orders]) => ({ day, orders })),
    monthlyRevenue: Array.from(monthlyMap.entries()).map(([month, revenue]) => ({ month, revenue })),
    recentOrders, totalOrders: validOrders.length, totalRevenue, pendingOrders: activeOrders, completedToday,
  }

  // 🧠 Generate AI Insights on the Server
  const insights: AIInsight[] = []
  if (revenueTrend > 10) insights.push({ id: 'rev-up', type: 'success', title: 'Revenue surging!', description: `Your revenue is up ${revenueTrend}% today. Keep your best-selling meals in stock — demand is high.`, iconKey: 'trendingUp' })
  else if (revenueTrend < 0) insights.push({ id: 'rev-down', type: 'warning', title: 'Revenue dip today', description: 'Consider promoting your meals on social media or offering a limited-time discount to boost orders.', iconKey: 'trendingDown' })
  
  if (activeOrders > 5) insights.push({ id: 'pending', type: 'warning', title: `${activeOrders} orders waiting`, description: 'You have pending orders that need attention. Fulfill them quickly to maintain your rating.', iconKey: 'clock' })
  if (mealCount < 5) insights.push({ id: 'meals-low', type: 'opportunity', title: 'Add more meals', description: 'Vendors with 10+ meals earn 3x more. Adding variety attracts repeat customers.', iconKey: 'chef' })
  if (stats.avgRating >= 4.5) insights.push({ id: 'rating-great', type: 'success', title: 'Top-rated vendor!', description: `Your ${stats.avgRating}-star rating puts you in the top tier. Keep up the excellent service.`, iconKey: 'star' })
  
  insights.push({
    id: 'ai-tip', type: 'info', title: '🤖 AI Suggestion',
    description: completedToday > 0 
      ? `You've completed ${completedToday} orders today. Lunch hours (12-2pm) tend to drive the most orders — make sure your menu is fully stocked during peak times.` 
      : 'Complete your vendor profile and add meal photos to attract more customers. High-quality photos can increase orders by up to 40%.',
    iconKey: 'brain'
  })

  return { stats, insights }
}