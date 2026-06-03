'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign, Heart, MapPin,
  RefreshCw, AlertCircle, Brain, Clock, ChefHat, Loader2,
} from 'lucide-react'
import {
  fetchUserAnalytics,
  type AnalyticsPayload,
  type DateRange,
} from './actions'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  blue:    'bg-blue-50 text-blue-600 border-blue-100',
  rose:    'bg-rose-50 text-rose-600 border-rose-100',
  amber:   'bg-amber-50 text-amber-600 border-amber-100',
}

const iconFor: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  dollar: DollarSign,
  cart: ShoppingCart,
  heart: Heart,
  pin: MapPin,
}

const insightIconFor: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  trending: TrendingUp,
  clock: Clock,
  chef: ChefHat,
  brain: Brain,
}

const insightIconClass: Record<string, string> = {
  trending: 'text-amber-600',
  clock: 'text-blue-600',
  chef: 'text-emerald-600',
  brain: 'text-violet-600',
}

const periods: { value: DateRange; label: string }[] = [
  { value: '7d',   label: 'Week' },
  { value: '30d',  label: 'Month' },
  { value: '180d', label: '6 Months' },
  { value: '365d', label: 'Year' },
]

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

export default function UserAnalyticsClient({
  initialData,
}: {
  initialData: AnalyticsPayload
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<AnalyticsPayload>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [, startTransition] = useTransition()
  
  // Wait for browser mount before rendering charts
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pikaplan-favorites')
      if (stored) {
        const favs = JSON.parse(stored)
        if (Array.isArray(favs)) setFavoritesCount(favs.length)
      }
    } catch (e) {
      console.warn('Failed to load favorites:', e)
    }
  }, [])

  const fetchData = useCallback(
    async (range: DateRange) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams(searchParams.toString())
        if (range === '180d') params.delete('range')
        else params.set('range', range)

        startTransition(() => {
          router.push(`?${params.toString()}`)
        })

        const next = await fetchUserAnalytics(range, favoritesCount)
        setData(next)
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    },
    [searchParams, router, favoritesCount]
  )

  const handlePeriodChange = (range: DateRange) => {
    if (range === data.range) return
    fetchData(range)
  }

  // Update favorites on server data when changed
  useEffect(() => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        kpis: prev.kpis.map((k) =>
          k.iconKey === 'heart' ? { ...k, value: favoritesCount } : k
        ),
      }
    })
  }, [favoritesCount])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="font-poppins"
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            My Analytics
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-700">
              <Brain size={12} className="text-emerald-600" /> AI Insights
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze your spending patterns, order frequencies, and culinary preferences.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                data.range === p.value
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => fetchData(data.range)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading && data.kpis.every((k) => k.value === 0 || k.value === 'KES 0') ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          data.kpis.map((kpi, i) => {
            const Icon = iconFor[kpi.iconKey] || DollarSign
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    {kpi.label}
                  </p>
                  <div className={`p-2 rounded-xl border ${colorMap[kpi.color]}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">
                  {kpi.value}
                </p>
                <p
                  className={`text-[10px] font-bold flex items-center gap-1 mt-2 ${
                    kpi.up ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {kpi.change} vs prev
                </p>
              </motion.div>
            )
          })
        )}
      </div>

      {/* AI Insights */}
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
          {data.aiInsights.length === 0 ? (
            <div className="col-span-full text-sm text-gray-400 italic">
              No insights available yet.
            </div>
          ) : (
            data.aiInsights.map((insight, i) => {
              const Icon = insightIconFor[insight.iconKey] || Brain
              return (
                <div
                  key={i}
                  className={`border-l-4 rounded-r-xl p-4 ${insight.color}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Icon size={15} className={insightIconClass[insight.iconKey]} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{insight.title}</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Spending & Day Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Monthly Spending */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">Monthly Spending</h3>
            <p className="text-xs text-gray-400 mt-0.5">Summary of food budgets settled per month</p>
          </div>
          <div className="flex-1 min-h-[200px] w-full">
            {!mounted || (loading && data.monthlySpending.length === 0) ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlySpending}>
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

        {/* Chart 2: Orders by Day */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">Orders by Day</h3>
            <p className="text-xs text-gray-400 mt-0.5">Frequencies of orders completed on days of week</p>
          </div>
          <div className="flex-1 min-h-[200px] w-full">
            {!mounted || (loading && data.ordersByDay.length === 0) ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ordersByDay}>
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

      {/* Vendors & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorite Kitchens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-80 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">Favorite Kitchens</h3>
            <p className="text-xs text-gray-500 mt-0.5">Top kitchens you order from the most</p>
          </div>
          {data.favoriteVendors.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 italic">
              No kitchens ordered from yet
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {data.favoriteVendors.map((v, i) => {
                const max = data.favoriteVendors[0]?.orders || 1
                const width = max > 0 ? (v.orders / max) * 100 : 0
                return (
                  <div key={v.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700 font-semibold">{v.name}</span>
                      <span className="text-xs text-gray-500">{v.orders} orders</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
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

        {/* Chart 3: Orders by Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base leading-tight">Orders by Category</h3>
            <p className="text-xs text-gray-400 mt-0.5">Visual representation of your preferred meal types</p>
          </div>
          <div className="flex-1 min-h-[200px] w-full">
            {!mounted || data.categoryBreakdown.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 italic">
                No category data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {data.categoryBreakdown.map((_, index) => (
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