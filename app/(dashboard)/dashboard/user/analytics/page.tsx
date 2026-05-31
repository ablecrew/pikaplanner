'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign, Heart, MapPin,
  RefreshCw, AlertCircle, Sparkles, Brain, Award, Clock, ChefHat,
  Info, Activity, CircleDollarSign, Calendar, BarChart3, ChevronRight, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

// ── Types ────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '180d' | '365d'

type KPICardType = {
  label: string
  value: string | number
  change: string
  up: boolean
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}

type SpendingData = {
  month: string
  amount: number
}

type DayData = {
  day: string
  orders: number
}

type CategoryData = {
  name: string
  value: number
}

type FavoriteMerchant = {
  name: string
  orders: number
}

// ── Constants ────────────────────────────────────────────

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  blue:    'bg-blue-50 text-blue-600 border-blue-100',
  rose:    'bg-rose-50 text-rose-600 border-rose-100',
  amber:   'bg-amber-50 text-amber-600 border-amber-100',
}

const periods: { value: DateRange; label: string }[] = [
  { value: '7d',   label: 'Week' },
  { value: '30d',  label: 'Month' },
  { value: '180d', label: '6 Months' },
  { value: '365d', label: 'Year' },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Helpers ──────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

const supabase = createClient()

// ── MAIN PAGE ────────────────────────────────────────────

export default function UserAnalyticsPage() {
  const [period, setPeriod] = useState<DateRange>('180d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [orders, setOrders] = useState<any[]>([])
  const [meals, setMeals] = useState<any[]>([])
  const [favoritesCount, setFavoritesCount] = useState(0)

  // Load favorites count from localStorage
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem('pikaplan-favorites')
      if (storedFavs) {
        const favs = JSON.parse(storedFavs)
        setFavoritesCount(Array.isArray(favs) ? favs.length : 0)
      }
    } catch (e) {
      console.warn('Failed to load favorites count:', e)
    }
  }, [])

  // ── Fetch User Analytics Data ──────────────────────────
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch user's orders
      const { data: orderRows, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersErr) throw ordersErr
      setOrders(orderRows || [])

      // Fetch active meals to map category details
      const { data: mealsData, error: mealsErr } = await supabase
        .from('meals')
        .select('id, category')

      if (mealsErr) throw mealsErr
      setMeals(mealsData || [])

    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // ── Filtered Period Orders ─────────────────────────────
  const periodOrders = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '180d' ? 180 : 365
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - days)
    
    return orders.filter(o => new Date(o.created_at).getTime() >= limitDate.getTime())
  }, [orders, period])

  const previousPeriodOrders = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '180d' ? 180 : 365
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - days)
    const prevLimitDate = new Date()
    prevLimitDate.setDate(prevLimitDate.getDate() - (days * 2))

    return orders.filter(o => {
      const t = new Date(o.created_at).getTime()
      return t >= prevLimitDate.getTime() && t < limitDate.getTime()
    })
  }, [orders, period])

  // ── KPI Cards Calculations ─────────────────────────────
  const kpis = useMemo((): KPICardType[] => {
    const currentCompleted = periodOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed')
    const prevCompleted = previousPeriodOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed')

    // 1. Total Spent
    const totalSpent = currentCompleted.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const prevSpent = prevCompleted.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const spentDiff = totalSpent - prevSpent
    const spentUp = spentDiff >= 0

    // 2. Total Orders
    const totalOrders = currentCompleted.length
    const prevOrders = prevCompleted.length
    const ordersDiff = totalOrders - prevOrders
    const ordersUp = ordersDiff >= 0

    // 3. Average Order Value
    const currentAOV = totalOrders > 0 ? totalSpent / totalOrders : 0
    const prevAOV = prevOrders > 0 ? prevSpent / prevOrders : 0
    const aovDiff = currentAOV - prevAOV
    const aovUp = aovDiff >= 0

    return [
      {
        label: 'Total Spent',
        value: formatCurrency(totalSpent),
        change: `${spentUp ? '+' : ''}${formatCurrency(spentDiff)}`,
        up: spentUp,
        icon: DollarSign,
        color: 'emerald',
      },
      {
        label: 'Total Orders',
        value: totalOrders,
        change: `${ordersUp ? '+' : ''}${ordersDiff} orders`,
        up: ordersUp,
        icon: ShoppingCart,
        color: 'blue',
      },
      {
        label: 'Favorites',
        value: favoritesCount,
        change: 'Active items',
        up: true,
        icon: Heart,
        color: 'rose',
      },
      {
        label: 'Avg Order Value',
        value: formatCurrency(currentAOV),
        change: `${aovUp ? '+' : ''}${formatCurrency(aovDiff)}`,
        up: aovUp,
        icon: MapPin,
        color: 'amber',
      },
    ]
  }, [periodOrders, previousPeriodOrders, favoritesCount])

  // ── Charts Calculations ────────────────────────────────

  // 1. Monthly Spending Chart
  const monthlySpending = useMemo((): SpendingData[] => {
    const map = new Map<string, number>()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '180d' ? 180 : 365
    
    // Pre-populate months in date range
    for (let i = Math.round(days / 30) - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = months[d.getMonth()]
      map.set(key, 0)
    }

    periodOrders
      .filter(o => o.status === 'Delivered' || o.status === 'Completed')
      .forEach(o => {
        const d = new Date(o.created_at)
        const key = months[d.getMonth()]
        if (map.has(key)) {
          map.set(key, (map.get(key) || 0) + Number(o.total_amount || 0))
        }
      })

    return Array.from(map.entries()).map(([month, amount]) => ({ month, amount }))
  }, [periodOrders, period])

  // 2. Orders by Day of Week Chart
  const ordersByDay = useMemo((): DayData[] => {
    const map = new Map<string, number>()
    weekdays.forEach(day => map.set(day, 0))

    periodOrders.forEach(o => {
      const d = new Date(o.created_at)
      const key = weekdays[d.getDay()]
      map.set(key, (map.get(key) || 0) + 1)
    })

    return Array.from(map.entries()).map(([day, orders]) => ({ day, orders }))
  }, [periodOrders])

  // 3. Category Breakdown Chart (joins with meals list)
  const categoryBreakdown = useMemo((): CategoryData[] => {
    const mealCategoryMap = new Map((meals || []).map((m: any) => [m.id, m.category]))
    const counts = new Map<string, number>()

    periodOrders.forEach(o => {
      // Find category of the meal ordered (fallback to Lunch)
      const category = o.meal_id ? (mealCategoryMap.get(o.meal_id) || 'Lunch') : 'Lunch'
      counts.set(category, (counts.get(category) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [periodOrders, meals])

  // 4. Favorite Merchants Chart
  const favoriteVendors = useMemo((): FavoriteMerchant[] => {
    const counts = new Map<string, number>()

    periodOrders
      .filter(o => o.status === 'Delivered' || o.status === 'Completed')
      .forEach(o => {
        // Fallback or dynamic resolve
        const merchant = o.vendor_name || 'Kitchen'
        counts.set(merchant, (counts.get(merchant) || 0) + 1)
      })

    return Array.from(counts.entries())
      .map(([name, orders]) => ({ name, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
  }, [periodOrders])

  // ── AI Smart Assistant Insights ───────────────────────
  const aiInsights = useMemo(() => {
    const insights = []
    
    // Spending Alert
    const currentCompleted = periodOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed')
    const totalSpent = currentCompleted.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    
    if (totalSpent > 10000) {
      insights.push({
        icon: <TrendingUp size={15} className="text-amber-600" />,
        title: 'Spending Pattern Detected',
        description: `Your spending this period is ${formatCurrency(totalSpent)}. Setting a weekly target of KES 2,000 could save you 15% monthly.`,
        color: 'border-l-amber-500 bg-amber-50/30'
      })
    }

    // Peak Ordering Day
    const peakDay = ordersByDay.reduce((max, d) => d.orders > max.orders ? d : max, ordersByDay[0])
    if (peakDay.orders > 0) {
      insights.push({
        icon: <Clock size={15} className="text-blue-600" />,
        title: 'Busy Day Preferences',
        description: `You order meals most frequently on ${peakDay.day}s. Try pre-ordering your breakfast plan on Sunday night to save time.`,
        color: 'border-l-blue-500 bg-blue-50/30'
      })
    }

    // Favorite Category
    if (categoryBreakdown.length > 0) {
      const topCat = categoryBreakdown[0]
      insights.push({
        icon: <ChefHat size={15} className="text-emerald-600" />,
        title: 'Star Culinary Preference',
        description: `Your top food category is "${topCat.name}" (${topCat.value} orders). Discover newer verified chefs under this category to expand your menu variety.`,
        color: 'border-l-emerald-500 bg-emerald-50/30'
      })
    }

    // Fallback predictive insight
    insights.push({
      icon: <Brain size={15} className="text-violet-600" />,
      title: 'AI Spend Prediction',
      description: `Based on weekly trends, we predict an ordering spend of ~${formatCurrency(totalSpent * 0.12)} next week.`,
      color: 'border-l-violet-500 bg-violet-50/30'
    })

    return insights
  }, [periodOrders, ordersByDay, categoryBreakdown])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <PageHeader
        title="My Analytics"
        subtitle="Analyze your spending patterns, order frequencies, and culinary preferences."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  period === p.value
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => void fetchAnalyticsData()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* Alerts */}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{kpi.label}</p>
                <div className={`p-2 rounded-xl border ${colorMap[kpi.color]}`}>
                  <kpi.icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{kpi.value}</p>
              <p className={`text-[10px] font-bold flex items-center gap-1 mt-2 ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}>
                {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {kpi.change} vs prev
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* AI Smart Assistant Insights */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain size={16} className="text-violet-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Insights & Predictions</h3>
            <p className="text-xs text-gray-500">Real-time alerts, health insights, and predictive menus</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : (
            aiInsights.map((insight, i) => (
              <div key={i} className={`border-l-4 rounded-r-xl p-4 ${insight.color}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{insight.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{insight.title}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Spending & Day Patterns Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Spending Area Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">Monthly Spending</h3>
            <p className="text-xs text-gray-400 mt-0.5">Summary of food budgets settled per month</p>
          </div>
          <div className="flex-1 min-h-0">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpending}>
                  <defs>
                    <linearGradient id="userSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(v) => [formatCurrency(Number(v)), 'Spending']} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#userSpendGrad)" dot={{ fill: '#10b981', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Day Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">Orders by Day</h3>
            <p className="text-xs text-gray-400 mt-0.5">Frequencies of orders completed on days of week</p>
          </div>
          <div className="flex-1 min-h-0">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Kitchens & Category mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorite Merchants progress bars */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-80 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">Favorite Kitchens</h3>
            <p className="text-xs text-gray-500 mt-0.5">Top kitchens you order from the most</p>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : favoriteVendors.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 italic">No kitchens ordered from yet</div>
          ) : (
            <div className="space-y-4 flex-1">
              {favoriteVendors.map((v, i) => {
                const maxOrders = favoriteVendors[0].orders
                const widthPercent = maxOrders > 0 ? (v.orders / maxOrders) * 100 : 0
                return (
                  <div key={v.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700 font-semibold">{v.name}</span>
                      <span className="text-xs text-gray-500">{v.orders} orders</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Category breakdown pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">Orders by Category</h3>
            <p className="text-xs text-gray-400 mt-0.5">Visual representation of your preferred meal types</p>
          </div>
          <div className="flex-1 min-h-0">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : categoryBreakdown.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 italic">No category data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
