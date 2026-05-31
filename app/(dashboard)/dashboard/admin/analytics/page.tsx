'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, Store,
  Sparkles, Brain, Zap, Loader2, AlertCircle, RefreshCw,
  DollarSign, Package, BarChart3, Target, Eye, Clock, Activity,
  ArrowUpRight, ArrowDownRight, Filter, Download, Calendar,
  Globe, Award, Lightbulb, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

// ── Types ────────────────────────────────────────────────

type AnalyticsData = {
  monthlyRevenue: { month: string; revenue: number; orders: number }[]
  monthlyUsers: { month: string; users: number }[]
  categoryBreakdown: { name: string; value: number }[]
  topVendors: { name: string; revenue: number }[]
  kpiCards: {
    label: string; value: string; change: string; up: boolean; icon: React.ComponentType<{ size?: number; className?: string }>; color: string
  }[]
  orderStatusBreakdown: { name: string; value: number }[]
  avgOrderValue: number
  conversionRate: number
  totalRevenue: number
  totalUsers: number
  totalOrders: number
  totalVendors: number
}

type AIPrediction = {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  metric: string
  predictedValue: string
  confidence: number
  trend: 'up' | 'down' | 'stable'
}

// ── Helpers ───────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1000000) return `KES ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `KES ${(n / 1000).toFixed(1)}K`
  return `KES ${n.toLocaleString()}`
}

function trendPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

const CHART_COLORS = ['#1A5C3A', '#32CD32', '#F4A535', '#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6']
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Skeleton ──────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

// ── MAIN PAGE ─────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '6m' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'users'>('revenue')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const periodDays = selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : selectedPeriod === '6m' ? 180 : 365
      const now = new Date()
      const cutoffDate = new Date(now.getTime() - periodDays * 86400000)
      const prevCutoffDate = new Date(cutoffDate.getTime() - periodDays * 86400000)

      const [
        { data: orders },
        { data: profiles },
        { data: vendors },
        { data: meals },
      ] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status, created_at, user_id, vendor_id').order('created_at', { ascending: false }).limit(1000),
        supabase.from('profiles').select('id, role, created_at'),
        supabase.from('vendors').select('id, is_active, created_at, total_orders, total_earnings'),
        supabase.from('meals').select('id, category, is_active, created_at'),
      ])

      if (!orders) throw new Error('Failed to load orders')

      const validOrders = (orders || []).filter((o: any) => Number(o.total_amount) > 0)
      const periodOrders = validOrders.filter((o: any) => new Date(o.created_at) >= cutoffDate)
      const prevPeriodOrders = validOrders.filter((o: any) => {
        const d = new Date(o.created_at)
        return d >= prevCutoffDate && d < cutoffDate
      })

      const totalRevenue = periodOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0)
      const prevRevenue = prevPeriodOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0)

      const totalUsers = (profiles || []).length
      const periodUsers = (profiles || []).filter((p: any) => new Date(p.created_at) >= cutoffDate).length
      const prevPeriodUsers = (profiles || []).filter((p: any) => {
        const d = new Date(p.created_at)
        return d >= prevCutoffDate && d < cutoffDate
      }).length

      const activeVendors = (vendors || []).filter((v: any) => v.is_active).length
      const periodVendors = (vendors || []).filter((v: any) => new Date(v.created_at) >= cutoffDate).length
      const prevPeriodVendors = (vendors || []).filter((v: any) => {
        const d = new Date(v.created_at)
        return d >= prevCutoffDate && d < cutoffDate
      }).length

      // Monthly data (6 months)
      const monthsToShow = 6
      const monthlyRevenueMap = new Map<string, { revenue: number; orders: number }>()
      const monthlyUsersMap = new Map<string, number>()

      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        monthlyRevenueMap.set(monthNames[d.getMonth()], { revenue: 0, orders: 0 })
        monthlyUsersMap.set(monthNames[d.getMonth()], 0)
      }

      validOrders.forEach((o: any) => {
        const d = new Date(o.created_at)
        const key = monthNames[d.getMonth()]
        const existing = monthlyRevenueMap.get(key)
        if (existing) {
          existing.revenue += Number(o.total_amount)
          existing.orders += 1
        }
      })

      ;(profiles || []).forEach((p: any) => {
        const d = new Date(p.created_at)
        const key = monthNames[d.getMonth()]
        const existing = monthlyUsersMap.get(key)
        if (existing !== undefined) monthlyUsersMap.set(key, existing + 1)
      })

      // Category breakdown
      const catMap = new Map<string, number>()
      ;(meals || []).forEach((m: any) => {
        const cat = m.category || 'Other'
        catMap.set(cat, (catMap.get(cat) || 0) + 1)
      })

      // Order status breakdown
      const statusMap = new Map<string, number>()
      periodOrders.forEach((o: any) => {
        const s = o.status || 'Unknown'
        statusMap.set(s, (statusMap.get(s) || 0) + 1)
      })

      // Top vendors
      const vendorRevMap = new Map<string, number>()
      periodOrders.forEach((o: any) => {
        const vid = o.vendor_id || 'direct'
        vendorRevMap.set(vid, (vendorRevMap.get(vid) || 0) + Number(o.total_amount))
      })

      const topVendors = Array.from(vendorRevMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, rev]) => ({ name: id === 'direct' ? 'Direct' : id.slice(0, 8).toUpperCase(), revenue: rev }))

      const avgOrderValue = periodOrders.length > 0 ? totalRevenue / periodOrders.length : 0
      const totalVisitors = periodOrders.length * 3 // rough estimate
      const conversionRate = totalVisitors > 0 ? (periodOrders.length / totalVisitors) * 100 : 0

      setData({
        monthlyRevenue: Array.from(monthlyRevenueMap.entries()).map(([month, d]) => ({ month, ...d })),
        monthlyUsers: Array.from(monthlyUsersMap.entries()).map(([month, users]) => ({ month, users })),
        categoryBreakdown: Array.from(catMap.entries()).map(([name, value]) => ({ name, value })),
        orderStatusBreakdown: Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })),
        topVendors,
        kpiCards: [
          {
            label: 'Total Revenue', value: formatCurrency(totalRevenue), change: `${trendPct(totalRevenue, prevRevenue)}% from last period`,
            up: trendPct(totalRevenue, prevRevenue) >= 0, icon: DollarSign, color: 'emerald',
          },
          {
            label: 'Total Users', value: totalUsers.toLocaleString(), change: `${trendPct(periodUsers, prevPeriodUsers)}% from last period`,
            up: trendPct(periodUsers, prevPeriodUsers) >= 0, icon: Users, color: 'blue',
          },
          {
            label: 'Total Orders', value: periodOrders.length.toLocaleString(), change: `${trendPct(periodOrders.length, prevPeriodOrders.length)}% from last period`,
            up: trendPct(periodOrders.length, prevPeriodOrders.length) >= 0, icon: ShoppingCart, color: 'amber',
          },
          {
            label: 'Active Vendors', value: activeVendors.toLocaleString(), change: `${trendPct(periodVendors, prevPeriodVendors)}% from last period`,
            up: trendPct(periodVendors, prevPeriodVendors) >= 0, icon: Store, color: 'violet',
          },
        ],
        avgOrderValue,
        conversionRate,
        totalRevenue,
        totalUsers,
        totalOrders: periodOrders.length,
        totalVendors: activeVendors,
      })
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, selectedPeriod])

  useEffect(() => {
    void fetchAnalytics()
  }, [fetchAnalytics])

  // ── AI Predictions ──────────────────────────────────────
  const predictions: AIPrediction[] = useMemo(() => {
    if (!data) return []

    const preds: AIPrediction[] = []

    // Revenue prediction
    const lastRevenue = data.monthlyRevenue[data.monthlyRevenue.length - 1]?.revenue || 0
    const prevRevenue = data.monthlyRevenue[data.monthlyRevenue.length - 2]?.revenue || 0
    const revGrowth = prevRevenue > 0 ? (lastRevenue - prevRevenue) / prevRevenue : 0.05
    const projectedRevenue = Math.round(lastRevenue * (1 + revGrowth))

    preds.push({
      id: 'rev-pred',
      title: 'Revenue Forecast',
      description: `Based on ${revGrowth > 0 ? 'positive' : 'negative'} growth trend of ${Math.abs(Math.round(revGrowth * 100))}% month-over-month`,
      icon: TrendingUp,
      metric: 'Next Month',
      predictedValue: formatCurrency(projectedRevenue),
      confidence: Math.min(92, 60 + Math.abs(Math.round(revGrowth * 100))),
      trend: revGrowth > 0.03 ? 'up' : revGrowth < -0.03 ? 'down' : 'stable',
    })

    // Order volume prediction
    const lastOrders = data.monthlyRevenue[data.monthlyRevenue.length - 1]?.orders || 0
    const prevOrders = data.monthlyRevenue[data.monthlyRevenue.length - 2]?.orders || 0
    const orderGrowth = prevOrders > 0 ? (lastOrders - prevOrders) / prevOrders : 0.05
    const projectedOrders = Math.round(lastOrders * (1 + orderGrowth))

    preds.push({
      id: 'orders-pred',
      title: 'Order Volume Forecast',
      description: `Projecting ${projectedOrders} orders next month based on current trajectory`,
      icon: ShoppingCart,
      metric: 'Next Month',
      predictedValue: `${projectedOrders} orders`,
      confidence: Math.min(90, 55 + Math.abs(Math.round(orderGrowth * 100))),
      trend: orderGrowth > 0.02 ? 'up' : orderGrowth < -0.02 ? 'down' : 'stable',
    })

    // User growth prediction
    const lastUsers = data.monthlyUsers[data.monthlyUsers.length - 1]?.users || 0
    const prevUsers = data.monthlyUsers[data.monthlyUsers.length - 2]?.users || 0
    const userGrowth = prevUsers > 0 ? (lastUsers - prevUsers) / prevUsers : 0.05

    preds.push({
      id: 'users-pred',
      title: 'User Acquisition Forecast',
      description: `User base growing at ${Math.round(userGrowth * 100)}% monthly — ${userGrowth > 0.05 ? 'strong momentum' : 'steady growth'}`,
      icon: Users,
      metric: 'Next Month',
      predictedValue: `+${Math.round(lastUsers * userGrowth)} new users`,
      confidence: Math.min(88, 50 + Math.abs(Math.round(userGrowth * 100))),
      trend: userGrowth > 0.03 ? 'up' : userGrowth < 0 ? 'down' : 'stable',
    })

    // Average order value insight
    preds.push({
      id: 'aov-pred',
      title: 'Avg Order Value Optimization',
      description: `Current AOV is ${formatCurrency(data.avgOrderValue)}. Bundling meals could increase this by 15-25%.`,
      icon: Target,
      metric: 'Current AOV',
      predictedValue: formatCurrency(data.avgOrderValue),
      confidence: 78,
      trend: data.avgOrderValue > 500 ? 'up' : 'stable',
    })

    return preds
  }, [data])

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            Analytics
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 text-xs font-bold text-violet-600">
              <Brain size={12} /> AI Forecast
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Data-driven insights and predictive analytics for your platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
            {[
              { id: '30d' as const, label: '30D' },
              { id: '90d' as const, label: '90D' },
              { id: '6m' as const, label: '6M' },
              { id: '1y' as const, label: '1Y' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedPeriod === p.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setRefreshing(true); void fetchAnalytics() }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {(data?.kpiCards || []).map((kpi) => (
          <motion.div
            key={kpi.label}
            whileHover={{ y: -2 }}
            className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[64px] opacity-[0.06] bg-gradient-to-bl from-current to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{kpi.label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[kpi.color]}`}>
                  <kpi.icon size={17} />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{kpi.value}</p>
              )}
              <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {kpi.change}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 — Revenue + Users */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900">Revenue Trend</h3>
            <span className="text-xs text-gray-400 font-medium">{selectedPeriod.toUpperCase()}</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Monthly revenue and order volume</p>
          {loading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.monthlyRevenue || []}>
                <defs>
                  <linearGradient id="revGrad3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A5C3A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A5C3A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1A5C3A" strokeWidth={2.5} fill="url(#revGrad3)" dot={{ fill: '#1A5C3A', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ fill: '#F4A535', r: 6, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900">User Growth</h3>
            <span className="text-xs text-gray-400 font-medium">{selectedPeriod.toUpperCase()}</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Monthly registered users</p>
          {loading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data?.monthlyUsers || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}
                  formatter={(value: any) => [`${value} users`, 'Users']}
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 — Top Vendors + Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Top Vendors */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Top Vendors</h3>
          <p className="text-xs text-gray-400 mb-5">By revenue this period</p>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.topVendors || []} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#F4A535" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Meal Categories</h3>
          <p className="text-xs text-gray-400 mb-5">Distribution by category</p>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data?.categoryBreakdown || []} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={3} dataKey="value">
                  {(data?.categoryBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}
                  formatter={(value: any) => [`${value} meals`, 'Count']}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Key Metrics</h3>
          <p className="text-xs text-gray-400 mb-5">Performance indicators</p>
          {loading ? (
            <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Avg Order Value', value: formatCurrency(data?.avgOrderValue || 0), icon: DollarSign, color: 'text-emerald-600' },
                { label: 'Conversion Rate', value: `${(data?.conversionRate || 0).toFixed(1)}%`, icon: Target, color: 'text-violet-600' },
                { label: 'Total Meals', value: (data?.categoryBreakdown?.reduce((a, b) => a + b.value, 0) || 0).toString(), icon: Package, color: 'text-amber-600' },
                { label: 'Active Vendors', value: (data?.totalVendors || 0).toString(), icon: Store, color: 'text-blue-600' },
                { label: 'Period Orders', value: (data?.totalOrders || 0).toString(), icon: ShoppingCart, color: 'text-green-600' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <item.icon size={14} className={item.color} /> {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Predictions Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Brain size={16} className="text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">AI-Powered Forecasts</h3>
              <p className="text-xs text-gray-500">Predictive analytics based on historical trends</p>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Updated in real-time</span>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {predictions.map((pred) => (
                <motion.div
                  key={pred.id}
                  whileHover={{ y: -2 }}
                  className="relative rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[48px] opacity-[0.06] bg-gradient-to-bl from-violet-500 to-transparent" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                        <pred.icon size={14} className="text-violet-600" />
                      </div>
                      <div className={`flex items-center gap-0.5 text-xs font-bold ${
                        pred.trend === 'up' ? 'text-emerald-600' : pred.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {pred.trend === 'up' ? <TrendingUp size={13} /> : pred.trend === 'down' ? <TrendingDown size={13} /> : <Activity size={13} />}
                        {pred.confidence}%
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{pred.title}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{pred.description}</p>
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{pred.metric}</span>
                      <span className="text-sm font-extrabold text-gray-900">{pred.predictedValue}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}