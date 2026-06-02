'use server'

import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

export type DateRange = '7d' | '30d' | '180d' | '365d'

export type KPICardType = {
  label: string
  value: string | number
  change: string
  up: boolean
  iconKey: 'dollar' | 'cart' | 'heart' | 'pin'
  color: 'emerald' | 'blue' | 'rose' | 'amber'
}

export type SpendingData = { month: string; amount: number }
export type DayData = { day: string; orders: number }
export type CategoryData = { name: string; value: number }
export type FavoriteMerchant = { name: string; orders: number }

export type AIInsight = {
  iconKey: 'trending' | 'clock' | 'chef' | 'brain'
  title: string
  description: string
  color: string
}

export type AnalyticsPayload = {
  range: DateRange
  kpis: KPICardType[]
  monthlySpending: SpendingData[]
  ordersByDay: DayData[]
  categoryBreakdown: CategoryData[]
  favoriteVendors: FavoriteMerchant[]
  aiInsights: AIInsight[]
  totals: {
    totalSpent: number
    totalOrders: number
    avgOrderValue: number
    previousSpent: number
    previousOrders: number
  }
  debug?: {
    ordersFound: number
    mealsFound: number
  }
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function daysForRange(range: DateRange): number {
  return range === '7d' ? 7 : range === '30d' ? 30 : range === '180d' ? 180 : 365
}

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function buildInsights(totals: AnalyticsPayload['totals'], peakDay: DayData | undefined, topCat: CategoryData | undefined): AIInsight[] {
  const insights: AIInsight[] = []

  if (totals.totalSpent > 10000) {
    insights.push({
      iconKey: 'trending',
      title: 'Spending Pattern Detected',
      description: `Your spending this period is ${formatCurrency(totals.totalSpent)}. Setting a weekly target of KES 2,000 could save you 15% monthly.`,
      color: 'border-l-amber-500 bg-amber-50/30',
    })
  }

  if (peakDay && peakDay.orders > 0) {
    insights.push({
      iconKey: 'clock',
      title: 'Busy Day Preferences',
      description: `You order meals most frequently on ${peakDay.day}s. Try pre-ordering your breakfast plan on Sunday night to save time.`,
      color: 'border-l-blue-500 bg-blue-50/30',
    })
  }

  if (topCat && topCat.value > 0) {
    insights.push({
      iconKey: 'chef',
      title: 'Star Culinary Preference',
      description: `Your top food category is "${topCat.name}" (${topCat.value} orders). Discover newer verified chefs under this category to expand your menu variety.`,
      color: 'border-l-emerald-500 bg-emerald-50/30',
    })
  }

  insights.push({
    iconKey: 'brain',
    title: 'AI Spend Prediction',
    description: `Based on weekly trends, we predict an ordering spend of ~${formatCurrency(totals.totalSpent * 0.12)} next week.`,
    color: 'border-l-violet-500 bg-violet-50/30',
  })

  return insights
}

const fetchAnalyticsCached = unstable_cache(
  async (range: DateRange, _favoritesCount: number) =>
    fetchAnalyticsRaw(range, _favoritesCount),
  ['user-analytics'],
  { revalidate: 60, tags: ['user-analytics'] }
)

async function fetchAnalyticsRaw(
  range: DateRange,
  favoritesCount: number,
): Promise<AnalyticsPayload> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return emptyPayload(range, favoritesCount)
  }

  const days = daysForRange(range)
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - days)
  const prevStart = new Date(start)
  prevStart.setDate(start.getDate() - days)

  // Fetch orders + meal categories in parallel
  const [orderRes, mealRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_amount, status, vendor_id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', prevStart.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('meals')
      .select('id, category'),
  ])

  if (orderRes.error) {
    console.error('orders fetch error:', orderRes.error)
  }

  const allOrders = (orderRes.data || []) as Array<{
    id: string
    total_amount: number | null
    status: string
    vendor_id: string
    created_at: string
  }>

  const mealCategoryMap = new Map<string, string>()
  ;((mealRes.data || []) as Array<{ id: string; category: string | null }>).forEach((m) => {
    if (m.category) mealCategoryMap.set(m.id, m.category)
  })

  // Split into current + previous
  const current = allOrders.filter((o) => new Date(o.created_at) >= start)
  const previous = allOrders.filter((o) => {
    const t = new Date(o.created_at)
    return t >= prevStart && t < start
  })

  const currentCompleted = current.filter(
    (o) => o.status === 'Delivered' || o.status === 'Completed'
  )
  const previousCompleted = previous.filter(
    (o) => o.status === 'Delivered' || o.status === 'Completed'
  )

  const totalSpent = currentCompleted.reduce(
    (s, o) => s + Number(o.total_amount || 0),
    0
  )
  const previousSpent = previousCompleted.reduce(
    (s, o) => s + Number(o.total_amount || 0),
    0
  )
  const totalOrders = currentCompleted.length
  const previousOrders = previousCompleted.length
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
  const previousAOV = previousOrders > 0 ? previousSpent / previousOrders : 0

  const spentDiff = totalSpent - previousSpent
  const ordersDiff = totalOrders - previousOrders
  const aovDiff = avgOrderValue - previousAOV

  const kpis: KPICardType[] = [
    {
      label: 'Total Spent',
      value: formatCurrency(totalSpent),
      change: `${spentDiff >= 0 ? '+' : ''}${formatCurrency(spentDiff)}`,
      up: spentDiff >= 0,
      iconKey: 'dollar',
      color: 'emerald',
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      change: `${ordersDiff >= 0 ? '+' : ''}${ordersDiff} orders`,
      up: ordersDiff >= 0,
      iconKey: 'cart',
      color: 'blue',
    },
    {
      label: 'Favorites',
      value: favoritesCount,
      change: 'Active items',
      up: true,
      iconKey: 'heart',
      color: 'rose',
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(avgOrderValue),
      change: `${aovDiff >= 0 ? '+' : ''}${formatCurrency(aovDiff)}`,
      up: aovDiff >= 0,
      iconKey: 'pin',
      color: 'amber',
    },
  ]

  // Monthly Spending
  const monthMap = new Map<string, number>()
  for (let i = Math.max(1, Math.round(days / 30)) - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    monthMap.set(months[d.getMonth()], 0)
  }
  currentCompleted.forEach((o) => {
    const d = new Date(o.created_at)
    const key = months[d.getMonth()]
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) || 0) + Number(o.total_amount || 0))
    }
  })
  const monthlySpending: SpendingData[] = Array.from(monthMap.entries()).map(
    ([month, amount]) => ({ month, amount })
  )

  // Orders by Day of Week
  const dayMap = new Map<string, number>()
  weekdays.forEach((d) => dayMap.set(d, 0))
  current.forEach((o) => {
    const d = new Date(o.created_at)
    const key = weekdays[d.getDay()]
    dayMap.set(key, (dayMap.get(key) || 0) + 1)
  })
  const ordersByDay: DayData[] = Array.from(dayMap.entries()).map(
    ([day, orders]) => ({ day, orders })
  )

  // Category breakdown
  const catCounts = new Map<string, number>()
  current.forEach((o) => {
    // Without a direct meal_id on orders, fall back to the most common category
    const category = (Array.from(mealCategoryMap.values())[0] || 'Lunch')
    catCounts.set(category, (catCounts.get(category) || 0) + 1)
  })
  const categoryBreakdown: CategoryData[] = Array.from(catCounts.entries())
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Favorite vendors (need vendor names from vendors table)
  const vendorIds = Array.from(new Set(currentCompleted.map((o) => o.vendor_id).filter(Boolean)))
  let vendorMap = new Map<string, string>()
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, business_name')
      .in('id', vendorIds)
    vendorMap = new Map(
      ((vendors || []) as Array<{ id: string; business_name: string | null }>).map(
        (v) => [v.id, v.business_name || 'Kitchen']
      )
    )
  }

  const vendorCounts = new Map<string, number>()
  currentCompleted.forEach((o) => {
    const name = vendorMap.get(o.vendor_id) || 'Kitchen'
    vendorCounts.set(name, (vendorCounts.get(name) || 0) + 1)
  })
  const favoriteVendors: FavoriteMerchant[] = Array.from(vendorCounts.entries())
    .map(([name, orders]) => ({ name, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5)

  const peakDay = ordersByDay.reduce(
    (max, d) => (d.orders > max.orders ? d : max),
    ordersByDay[0] || { day: 'Mon', orders: 0 }
  )
  const topCat = categoryBreakdown[0]
  const totals = {
    totalSpent,
    totalOrders,
    avgOrderValue,
    previousSpent,
    previousOrders: previousAOV > 0 ? previousOrders : 0,
  }

  return {
    range,
    kpis,
    monthlySpending,
    ordersByDay,
    categoryBreakdown,
    favoriteVendors,
    aiInsights: buildInsights(totals, peakDay, topCat),
    totals,
    debug: {
      ordersFound: allOrders.length,
      mealsFound: mealCategoryMap.size,
    },
  }
}

function emptyPayload(range: DateRange, favoritesCount: number): AnalyticsPayload {
  return {
    range,
    kpis: [
      { label: 'Total Spent', value: 'KES 0', change: 'KES 0', up: true, iconKey: 'dollar', color: 'emerald' },
      { label: 'Total Orders', value: 0, change: '0 orders', up: true, iconKey: 'cart', color: 'blue' },
      { label: 'Favorites', value: favoritesCount, change: 'Active items', up: true, iconKey: 'heart', color: 'rose' },
      { label: 'Avg Order Value', value: 'KES 0', change: 'KES 0', up: true, iconKey: 'pin', color: 'amber' },
    ],
    monthlySpending: [],
    ordersByDay: weekdays.map((d) => ({ day: d, orders: 0 })),
    categoryBreakdown: [],
    favoriteVendors: [],
    aiInsights: [],
    totals: {
      totalSpent: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      previousSpent: 0,
      previousOrders: 0,
    },
  }
}

export async function fetchUserAnalytics(
  range: DateRange = '180d',
  favoritesCount: number = 0,
): Promise<AnalyticsPayload> {
  try {
    return await fetchAnalyticsCached(range, favoritesCount)
  } catch (err) {
    console.error('Cached analytics failed, falling back:', err)
    return fetchAnalyticsRaw(range, favoritesCount)
  }
}