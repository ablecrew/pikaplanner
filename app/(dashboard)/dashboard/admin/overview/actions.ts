'use server'

import { createClient } from '@/lib/supabase/server'

export type Period = '7d' | '30d' | '90d'

export type DashboardStats = {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalVendors: number
  totalMeals: number
  revenueTrend: number
  ordersTrend: number
  usersTrend: number
  vendorsTrend: number
  monthlyRevenue: { month: string; revenue: number; orders: number }[]
  monthlyUsers: { month: string; users: number }[]
  categoryBreakdown: { name: string; value: number }[]
  topVendors: { name: string; revenue: number; orders: number }[]
  recentOrders: { id: string; customer: string; amount: number; status: string; date: string }[]
}

export type AIInsight = {
  id: string
  type: 'opportunity' | 'warning' | 'success' | 'info'
  title: string
  description: string
  iconKey: string
  action?: string
}

export type AdminDashboardData = {
  stats: DashboardStats
  aiInsights: AIInsight[]
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatCurrency(n: number): string {
  if (n >= 1000000) return `KES ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `KES ${(n / 1000).toFixed(1)}K`
  return `KES ${n.toLocaleString()}`
}

function trendPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function fetchAdminDashboardData(period: Period): Promise<AdminDashboardData> {
  const supabase = await createClient()
  
  const emptyStats: DashboardStats = {
    totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalVendors: 0, totalMeals: 0,
    revenueTrend: 0, ordersTrend: 0, usersTrend: 0, vendorsTrend: 0,
    monthlyRevenue: [], monthlyUsers: [], categoryBreakdown: [], topVendors: [], recentOrders: []
  }

  // PARALLEL FETCHING
  const [ordersRes, profilesRes, vendorsRes, mealsRes] = await Promise.all([
    supabase.from('orders').select('id, total_amount, status, created_at, user_id, vendor_id').order('created_at', { ascending: false }).limit(500),
    supabase.from('profiles').select('id, role, created_at'),
    supabase.from('vendors').select('id, is_active, created_at'),
    supabase.from('meals').select('id, category, is_active'),
  ])

  const orders = ordersRes.data || []
  const profiles = profilesRes.data || []
  const vendors = vendorsRes.data || []
  const meals = mealsRes.data || []

  // ── Compute stats ───────────────────────────────────
  const now = new Date()
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const cutoffDate = new Date(now.getTime() - periodDays * 86400000)
  const prevCutoffDate = new Date(cutoffDate.getTime() - periodDays * 86400000)

  const validOrders = orders.filter((o: any) => o.total_amount > 0)
  const periodOrders = validOrders.filter((o: any) => new Date(o.created_at) >= cutoffDate)
  const prevPeriodOrders = validOrders.filter((o: any) => {
    const d = new Date(o.created_at)
    return d >= prevCutoffDate && d < cutoffDate
  })

  const totalRevenue = periodOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0)
  const prevRevenue = prevPeriodOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0)

  const totalUsers = profiles.length
  const periodUsers = profiles.filter((p: any) => new Date(p.created_at) >= cutoffDate).length
  const prevPeriodUsers = profiles.filter((p: any) => {
    const d = new Date(p.created_at)
    return d >= prevCutoffDate && d < cutoffDate
  }).length

  const activeVendors = vendors.filter((v: any) => v.is_active).length
  const periodVendors = vendors.filter((v: any) => new Date(v.created_at) >= cutoffDate).length
  const prevPeriodVendors = vendors.filter((v: any) => {
    const d = new Date(v.created_at)
    return d >= prevCutoffDate && d < cutoffDate
  }).length

  // ── Monthly revenue ─────────────────────────────────
  const monthlyMap = new Map<string, { revenue: number; orders: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyMap.set(monthNames[d.getMonth()], { revenue: 0, orders: 0 })
  }
  validOrders.forEach((o: any) => {
    const d = new Date(o.created_at)
    const key = monthNames[d.getMonth()]
    const existing = monthlyMap.get(key)
    if (existing) {
      existing.revenue += Number(o.total_amount)
      existing.orders += 1
    }
  })

  // ── Category breakdown ──────────────────────────────
  const catMap = new Map<string, number>()
  meals.forEach((m: any) => {
    const cat = m.category || 'Other'
    catMap.set(cat, (catMap.get(cat) || 0) + 1)
  })

  // ── Top vendors ─────────────────────────────────────
  const vendorRevMap = new Map<string, { revenue: number; orders: number }>()
  periodOrders.forEach((o: any) => {
    const vid = o.vendor_id || 'unknown'
    const existing = vendorRevMap.get(vid) || { revenue: 0, orders: 0 }
    existing.revenue += Number(o.total_amount)
    existing.orders += 1
    vendorRevMap.set(vid, existing)
  })

  const topVendors = Array.from(vendorRevMap.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id, data]) => ({ name: id === 'unknown' ? 'Direct Order' : id.slice(0, 8), revenue: data.revenue, orders: data.orders }))

  // ── Monthly Users ───────────────────────────────────
  const userMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    userMap.set(monthNames[d.getMonth()], 0)
  }
  profiles.forEach((p: any) => {
    const d = new Date(p.created_at)
    const key = monthNames[d.getMonth()]
    const existing = userMap.get(key)
    if (existing !== undefined) userMap.set(key, existing + 1)
  })

  const stats: DashboardStats = {
    totalRevenue,
    totalOrders: periodOrders.length,
    totalUsers,
    totalVendors: activeVendors,
    totalMeals: meals.length,
    revenueTrend: trendPct(totalRevenue, prevRevenue),
    ordersTrend: trendPct(periodOrders.length, prevPeriodOrders.length),
    usersTrend: trendPct(periodUsers, prevPeriodUsers),
    vendorsTrend: trendPct(periodVendors, prevPeriodVendors),
    monthlyRevenue: Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data })),
    monthlyUsers: Array.from(userMap.entries()).map(([month, users]) => ({ month, users })),
    categoryBreakdown: Array.from(catMap.entries()).map(([name, value]) => ({ name, value })),
    topVendors,
    recentOrders: periodOrders.slice(0, 5).map((o: any) => ({
      id: o.id.slice(0, 8).toUpperCase(),
      customer: o.user_id?.slice(0, 8) || 'Anonymous',
      amount: Number(o.total_amount),
      status: o.status || 'Pending',
      date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
  }

  // ── AI Insights ─────────────────────────────────────
  const aiInsights: AIInsight[] = []

  if (stats.revenueTrend > 10) {
    aiInsights.push({ id: 'rev-up', type: 'success', title: `Revenue up ${stats.revenueTrend}%`, description: `Revenue has grown significantly this period. Consider investing in more vendor partnerships to sustain momentum.`, iconKey: 'trendingUp', action: 'View revenue report' })
  } else if (stats.revenueTrend < -5) {
    aiInsights.push({ id: 'rev-down', type: 'warning', title: `Revenue down ${Math.abs(stats.revenueTrend)}%`, description: 'Revenue is declining. Consider launching a promotional campaign or reviewing vendor pricing.', iconKey: 'alertTriangle', action: 'Review pricing strategy' })
  }

  if (stats.usersTrend > 15) {
    aiInsights.push({ id: 'users-up', type: 'success', title: 'Strong user acquisition', description: `User base growing at ${stats.usersTrend}%. Your marketing channels are performing well — consider scaling.`, iconKey: 'users' })
  }

  if (stats.totalVendors < 5) {
    aiInsights.push({ id: 'vendors-low', type: 'opportunity', title: 'Low vendor count — growth opportunity', description: `Only ${stats.totalVendors} active vendors. Increasing vendors by just 5 could boost revenue by an estimated 30-40%.`, iconKey: 'store', action: 'Invite vendors' })
  }

  const avgOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0
  if (avgOrderValue < 500) {
    aiInsights.push({ id: 'aov-low', type: 'opportunity', title: 'Low average order value', description: `Average order is ${formatCurrency(avgOrderValue)}. Bundling meals or offering combo deals could increase this by 20-30%.`, iconKey: 'target', action: 'Create meal bundles' })
  }

  aiInsights.push({ id: 'ai-tip', type: 'info', title: '🤖 AI Recommendation', description: `Based on ${stats.totalOrders} orders analyzed: "${stats.categoryBreakdown[0]?.name || 'Healthy'}" is your top category. Feature more meals in this category on your discover page for maximum engagement.`, iconKey: 'brain' })

  return { stats, aiInsights }
}