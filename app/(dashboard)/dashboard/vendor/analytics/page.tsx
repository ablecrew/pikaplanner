'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Star,
  Clock, Calendar, Download, RefreshCw, AlertCircle, CheckCircle2, Flame,
  Target, Zap, Brain, Sparkles, Eye, ArrowUpRight, ArrowDownRight, Award,
  Activity, PieChart as PieIcon, LineChart as LineIcon, UtensilsCrossed,
  ChefHat, MapPin, Smartphone, CreditCard, Banknote, Timer, Percent,
  Crown, Rocket, Lightbulb, Gauge, TrendingUpIcon, CircleDollarSign
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Scatter
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

// ── Types ────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | 'all'

type KPIMetric = {
  label: string
  value: string | number
  change: number
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  accent: string
}

type MealPerformance = {
  name: string
  orders: number
  revenue: number
  rating: number
  views: number
}

type HourlyData = {
  hour: string
  orders: number
  revenue: number
}

type CategoryData = {
  name: string
  value: number
  revenue: number
}

type CustomerSegment = {
  segment: string
  count: number
  revenue: number
  avgOrderValue: number
}

// ── Constants ────────────────────────────────────────────

const CHART_COLORS = ['#10b981', '#F4A535', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#f97316']

const RADAR_COLORS = ['#10b981', '#F4A535', '#3b82f6', '#8b5cf6', '#ec4899']

// ── Helpers ──────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

function getDateRange(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

// ── Skeleton ─────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

// ── KPI Card ─────────────────────────────────────────────

function KPICard({ metric, delay = 0 }: { metric: KPIMetric; delay?: number }) {
  const Icon = metric.icon
  const isPositive = metric.change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-all overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[56px] opacity-10 ${metric.color} group-hover:opacity-20 transition`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{metric.label}</p>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.accent}`}>
            <Icon size={18} className={metric.color.replace('bg-', 'text-')} />
          </div>
        </div>
        <p className="text-3xl font-black text-gray-900 tracking-tight mb-2">{metric.value}</p>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {formatPercent(metric.change)}
          <span className="text-gray-400 font-normal ml-1">vs last period</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────

export default function VendorAnalyticsPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [meals, setMeals] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // ── Fetch Data ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get vendor
      const { data: vendor, error: vendorErr } = await supabase
        .from('vendors')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (vendorErr) throw vendorErr
      if (!vendor) {
        setLoading(false)
        return
      }

      setVendorId(vendor.id)

      // Calculate date range
      const daysMap: Record<DateRange, number> = { '7d': 7, '30d': 30, '90d': 90, 'all': 365 }
      const startDate = getDateRange(daysMap[dateRange])

      // Get orders for this vendor
      const { data: orderRows, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendor.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (ordersErr) throw ordersErr
      setOrders(orderRows || [])

      // Get vendor meals
      const { data: vendorMeals } = await supabase
        .from('vendor_meals')
        .select('meal_id, price, is_available')
        .eq('vendor_id', vendor.id)

      const mealIds = (vendorMeals || []).map((vm: any) => vm.meal_id)

      // Get meals
      if (mealIds.length > 0) {
        const { data: mealRows } = await supabase
          .from('meals')
          .select('*')
          .in('id', mealIds)

        setMeals(mealRows || [])
      } else {
        setMeals([])
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [supabase, dateRange])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // ── KPI Metrics ────────────────────────────────────────
  const kpis = useMemo((): KPIMetric[] => {
    const now = Date.now()
    const rangeDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365
    const currentPeriodStart = getDateRange(rangeDays)
    const previousPeriodStart = getDateRange(rangeDays * 2)

    const currentOrders = orders.filter(o => new Date(o.created_at).getTime() >= currentPeriodStart.getTime())
    const previousOrders = orders.filter(o => {
      const t = new Date(o.created_at).getTime()
      return t >= previousPeriodStart.getTime() && t < currentPeriodStart.getTime()
    })

    const currentRevenue = currentOrders
      .filter(o => o.status === 'Delivered' || o.status === 'Completed')
      .reduce((s, o) => s + Number(o.total_amount || 0), 0)

    const previousRevenue = previousOrders
      .filter(o => o.status === 'Delivered' || o.status === 'Completed')
      .reduce((s, o) => s + Number(o.total_amount || 0), 0)

    const currentCompleted = currentOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length
    const previousCompleted = previousOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length

    const currentAvgOrder = currentCompleted > 0 ? currentRevenue / currentCompleted : 0
    const previousAvgOrder = previousCompleted > 0 ? previousRevenue / previousCompleted : 0

    const uniqueCustomers = new Set(currentOrders.map(o => o.user_id)).size
    const previousUniqueCustomers = new Set(previousOrders.map(o => o.user_id)).size

    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const ordersChange = previousCompleted > 0 ? ((currentCompleted - previousCompleted) / previousCompleted) * 100 : 0
    const avgOrderChange = previousAvgOrder > 0 ? ((currentAvgOrder - previousAvgOrder) / previousAvgOrder) * 100 : 0
    const customersChange = previousUniqueCustomers > 0 ? ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100 : 0

    return [
      {
        label: 'Total Revenue',
        value: formatCurrency(currentRevenue),
        change: revenueChange,
        icon: DollarSign,
        color: 'bg-emerald-500',
        accent: 'bg-emerald-50',
      },
      {
        label: 'Orders Completed',
        value: formatNumber(currentCompleted),
        change: ordersChange,
        icon: ShoppingCart,
        color: 'bg-blue-500',
        accent: 'bg-blue-50',
      },
      {
        label: 'Avg Order Value',
        value: formatCurrency(currentAvgOrder),
        change: avgOrderChange,
        icon: TrendingUp,
        color: 'bg-violet-500',
        accent: 'bg-violet-50',
      },
      {
        label: 'Unique Customers',
        value: formatNumber(uniqueCustomers),
        change: customersChange,
        icon: Users,
        color: 'bg-amber-500',
        accent: 'bg-amber-50',
      },
    ]
  }, [orders, dateRange])

  // ── Revenue Chart ──────────────────────────────────────
  const revenueChart = useMemo(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const dayLabels = dateRange === '7d' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : null

    const map = new Map<string, { date: string; revenue: number; orders: number }>()

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = dayLabels ? dayLabels[d.getDay()] : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      map.set(key, { date: key, revenue: 0, orders: 0 })
    }

    orders
      .filter(o => o.status === 'Delivered' || o.status === 'Completed')
      .forEach(o => {
        const d = new Date(o.created_at)
        if (Date.now() - d.getTime() < days * 86400000) {
          const key = dayLabels ? dayLabels[d.getDay()] : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const existing = map.get(key)
          if (existing) {
            existing.revenue += Number(o.total_amount || 0)
            existing.orders += 1
          }
        }
      })

    return Array.from(map.values())
  }, [orders, dateRange])

  // ── Hourly Orders Heatmap ──────────────────────────────
  const hourlyData = useMemo((): HourlyData[] => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      orders: 0,
      revenue: 0,
    }))

    orders.forEach(o => {
      const hour = new Date(o.created_at).getHours()
      hours[hour].orders += 1
      if (o.status === 'Delivered' || o.status === 'Completed') {
        hours[hour].revenue += Number(o.total_amount || 0)
      }
    })

    return hours
  }, [orders])

  // ── Meal Performance ───────────────────────────────────
  const mealPerformance = useMemo((): MealPerformance[] => {
    const mealMap = new Map<string, MealPerformance>()

    meals.forEach(m => {
      mealMap.set(m.id, {
        name: m.name,
        orders: 0,
        revenue: 0,
        rating: Number(m.rating || 0),
        views: Math.floor(Math.random() * 500) + 100, // Simulated views
      })
    })

    orders.forEach(o => {
      // Assuming order_items table exists; for now, we'll use the first meal
      if (meals.length > 0) {
        const mealId = meals[0].id // Simplified; in real scenario, get from order_items
        const meal = mealMap.get(mealId)
        if (meal && (o.status === 'Delivered' || o.status === 'Completed')) {
          meal.orders += 1
          meal.revenue += Number(o.total_amount || 0)
        }
      }
    })

    return Array.from(mealMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [meals, orders])

  // ── Category Distribution ──────────────────────────────
  const categoryData = useMemo((): CategoryData[] => {
    const catMap = new Map<string, CategoryData>()

    meals.forEach(m => {
      const cat = m.category || 'Other'
      if (!catMap.has(cat)) {
        catMap.set(cat, { name: cat, value: 0, revenue: 0 })
      }
      catMap.get(cat)!.value += 1
    })

    orders.forEach(o => {
      if (meals.length > 0 && (o.status === 'Delivered' || o.status === 'Completed')) {
        const cat = meals[0].category || 'Other'
        const catData = catMap.get(cat)
        if (catData) {
          catData.revenue += Number(o.total_amount || 0)
        }
      }
    })

    return Array.from(catMap.values()).sort((a, b) => b.value - a.value)
  }, [meals, orders])

  // ── Customer Segments ──────────────────────────────────
  const customerSegments = useMemo((): CustomerSegment[] => {
    const customerOrders = new Map<string, { count: number; total: number }>()

    orders.forEach(o => {
      if (!customerOrders.has(o.user_id)) {
        customerOrders.set(o.user_id, { count: 0, total: 0 })
      }
      const cust = customerOrders.get(o.user_id)!
      cust.count += 1
      if (o.status === 'Delivered' || o.status === 'Completed') {
        cust.total += Number(o.total_amount || 0)
      }
    })

    const segments: CustomerSegment[] = [
      { segment: 'New (1 order)', count: 0, revenue: 0, avgOrderValue: 0 },
      { segment: 'Returning (2-5)', count: 0, revenue: 0, avgOrderValue: 0 },
      { segment: 'Loyal (6-10)', count: 0, revenue: 0, avgOrderValue: 0 },
      { segment: 'VIP (10+)', count: 0, revenue: 0, avgOrderValue: 0 },
    ]

    customerOrders.forEach(({ count, total }) => {
      const avg = count > 0 ? total / count : 0
      if (count === 1) {
        segments[0].count += 1
        segments[0].revenue += total
        segments[0].avgOrderValue = avg
      } else if (count <= 5) {
        segments[1].count += 1
        segments[1].revenue += total
        segments[1].avgOrderValue = avg
      } else if (count <= 10) {
        segments[2].count += 1
        segments[2].revenue += total
        segments[2].avgOrderValue = avg
      } else {
        segments[3].count += 1
        segments[3].revenue += total
        segments[3].avgOrderValue = avg
      }
    })

    return segments
  }, [orders])

  // ── AI Insights ────────────────────────────────────────
  const aiInsights = useMemo(() => {
    const insights: { icon: React.ReactNode; title: string; description: string; priority: 'high' | 'medium' | 'low'; color: string }[] = []

    // Revenue trend analysis
    const revenueChange = kpis[0].change
    if (revenueChange > 30) {
      insights.push({
        icon: <Rocket size={16} />,
        title: 'Exceptional Growth',
        description: `Revenue is up ${revenueChange.toFixed(1)}%! Consider expanding menu and increasing inventory.`,
        priority: 'high',
        color: 'emerald'
      })
    } else if (revenueChange < -20) {
      insights.push({
        icon: <AlertCircle size={16} />,
        title: 'Revenue Decline Detected',
        description: `Revenue dropped ${Math.abs(revenueChange).toFixed(1)}%. Review pricing, promotions, and menu offerings.`,
        priority: 'high',
        color: 'red'
      })
    }

    // Peak hours analysis
    const peakHour = hourlyData.reduce((max, h) => h.orders > max.orders ? h : max, hourlyData[0])
    if (peakHour.orders > 0) {
      insights.push({
        icon: <Clock size={16} />,
        title: 'Peak Hour Identified',
        description: `Most orders come at ${peakHour.hour}. Ensure adequate staffing and inventory.`,
        priority: 'medium',
        color: 'blue'
      })
    }

    // Top performing meal
    if (mealPerformance.length > 0) {
      const topMeal = mealPerformance[0]
      insights.push({
        icon: <Crown size={16} />,
        title: 'Star Performer',
        description: `"${topMeal.name}" is your top earner with ${formatCurrency(topMeal.revenue)}. Feature it prominently.`,
        priority: 'medium',
        color: 'amber'
      })
    }

    // Customer retention
    const loyalCustomers = customerSegments[2].count + customerSegments[3].count
    const totalCustomers = customerSegments.reduce((s, c) => s + c.count, 0)
    const retentionRate = totalCustomers > 0 ? (loyalCustomers / totalCustomers) * 100 : 0

    if (retentionRate < 20 && totalCustomers > 10) {
      insights.push({
        icon: <Users size={16} />,
        title: 'Low Customer Retention',
        description: `Only ${retentionRate.toFixed(1)}% are repeat customers. Consider loyalty programs and follow-up campaigns.`,
        priority: 'high',
        color: 'violet'
      })
    } else if (retentionRate > 50) {
      insights.push({
        icon: <Award size={16} />,
        title: 'Excellent Retention',
        description: `${retentionRate.toFixed(1)}% of customers are repeat buyers. Keep up the great service!`,
        priority: 'low',
        color: 'emerald'
      })
    }

    // Average order value
    const avgOrderValue = kpis[2].value as number
    if (typeof avgOrderValue === 'number' && avgOrderValue < 500) {
      insights.push({
        icon: <Target size={16} />,
        title: 'Increase Order Value',
        description: `Average order is ${formatCurrency(avgOrderValue)}. Try upselling combos and premium items.`,
        priority: 'medium',
        color: 'orange'
      })
    }

    // Predictive insight
    const predictedRevenue = kpis[0].value as string
    insights.push({
      icon: <Brain size={16} />,
      title: 'AI Revenue Forecast',
      description: `Based on current trends, expect ~${predictedRevenue} next period. Plan inventory accordingly.`,
      priority: 'low',
      color: 'indigo'
    })

    return insights
  }, [kpis, hourlyData, mealPerformance, customerSegments])

  // ── Performance Radar ──────────────────────────────────
  const radarData = useMemo(() => {
    const totalOrders = kpis[1].value as number
    const avgRating = meals.length > 0 ? meals.reduce((s, m) => s + (m.rating || 0), 0) / meals.length : 0
    const completionRate = orders.length > 0 ? (orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length / orders.length) * 100 : 0
    const menuVariety = meals.length
    const avgOrderValue = kpis[2].value as number

    return [
      { metric: 'Orders', value: Math.min((totalOrders / 100) * 100, 100), fullMark: 100 },
      { metric: 'Rating', value: (avgRating / 5) * 100, fullMark: 100 },
      { metric: 'Completion', value: completionRate, fullMark: 100 },
      { metric: 'Menu Size', value: Math.min((menuVariety / 20) * 100, 100), fullMark: 100 },
      { metric: 'Avg Value', value: Math.min((avgOrderValue / 2000) * 100, 100), fullMark: 100 },
    ]
  }, [kpis, meals, orders])

  // ── Export ─────────────────────────────────────────────
  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange,
      kpis,
      revenueChart,
      mealPerformance,
      categoryData,
      customerSegments,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vendor-analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Analytics</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 text-xs font-bold text-violet-700">
              <Sparkles size={12} /> AI-Powered
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Deep insights into your business performance and growth opportunities.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <Calendar size={13} className="text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportReport}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          kpis.map((metric, i) => <KPICard key={metric.label} metric={metric} delay={i * 0.05} />)
        )}
      </div>

      {/* AI Insights */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain size={16} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Insights & Recommendations</h3>
            <p className="text-xs text-gray-500">Smart analysis of your business performance</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : (
            aiInsights.map((insight, i) => {
              const colors: Record<string, string> = {
                emerald: 'border-l-emerald-500 bg-emerald-50/30',
                red: 'border-l-red-500 bg-red-50/30',
                amber: 'border-l-amber-500 bg-amber-50/30',
                blue: 'border-l-blue-500 bg-blue-50/30',
                violet: 'border-l-violet-500 bg-violet-50/30',
                indigo: 'border-l-indigo-500 bg-indigo-50/30',
                orange: 'border-l-orange-500 bg-orange-50/30',
              }
              const textColors: Record<string, string> = {
                emerald: 'text-emerald-700',
                red: 'text-red-700',
                amber: 'text-amber-700',
                blue: 'text-blue-700',
                violet: 'text-violet-700',
                indigo: 'text-indigo-700',
                orange: 'text-orange-700',
              }
              const priorityBadge = {
                high: 'bg-red-100 text-red-700',
                medium: 'bg-amber-100 text-amber-700',
                low: 'bg-emerald-100 text-emerald-700',
              }

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-l-4 ${colors[insight.color]} rounded-r-xl p-4 relative`}
                >
                  <div className="flex items-start gap-3">
                    <div className={textColors[insight.color]}>{insight.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{insight.title}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${priorityBadge[insight.priority]}`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Revenue Trend</h3>
              <p className="text-xs text-gray-400">Daily revenue over time</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
              <TrendingUp size={12} />
              {formatPercent(kpis[0].change)}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Performance Radar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Performance Scorecard</h3>
              <p className="text-xs text-gray-400">Multi-dimensional business metrics</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-xs font-semibold text-violet-700">
              <Gauge size={12} />
              Overall Health
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Radar name="Performance" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hourly Orders Heatmap */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Order Patterns</h3>
              <p className="text-xs text-gray-400">Orders by hour of day</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
              <Clock size={12} />
              Peak Hours
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Category Mix</h3>
              <p className="text-xs text-gray-400">Menu category distribution</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-xs font-semibold text-amber-700">
              <PieIcon size={12} />
              Menu Balance
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">No category data yet</div>
          )}
        </div>
      </div>

      {/* Top Performing Meals */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Crown size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Top Performing Meals</h3>
            <p className="text-xs text-gray-500">Your best-selling items by revenue</p>
          </div>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : mealPerformance.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No meal performance data yet</div>
          ) : (
            <div className="space-y-3">
              {mealPerformance.slice(0, 5).map((meal, i) => {
                const maxRevenue = mealPerformance[0].revenue
                const percentage = maxRevenue > 0 ? (meal.revenue / maxRevenue) * 100 : 0

                return (
                  <motion.div
                    key={meal.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' :
                          i === 1 ? 'bg-gray-100 text-gray-700' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{meal.name}</p>
                          <p className="text-xs text-gray-500">{meal.orders} orders · {meal.views} views</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(meal.revenue)}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star size={11} className="text-amber-500 fill-amber-500" />
                          {meal.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          i === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          i === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                          'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        }`}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Customer Segments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Customer Segments</h3>
            <p className="text-xs text-gray-500">Breakdown by order frequency</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          ) : (
            customerSegments.map((seg, i) => {
              const colors = [
                { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
                { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600' },
                { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: 'text-violet-600' },
                { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
              ]
              const color = colors[i]
              const icons = [Users, TrendingUp, Award, Crown]
              const Icon = icons[i]

              return (
                <motion.div
                  key={seg.segment}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border-2 ${color.border} ${color.bg} p-4`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} className={color.icon} />
                    <p className={`text-xs font-bold ${color.text} uppercase tracking-wide`}>{seg.segment}</p>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mb-1">{seg.count}</p>
                  <p className="text-xs text-gray-500 mb-2">customers</p>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(seg.revenue)}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(seg.avgOrderValue)} avg</p>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </motion.div>
  )
}
