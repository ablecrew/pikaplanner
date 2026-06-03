'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign, Star, Package,
  Loader2, AlertCircle, RefreshCw, Brain, Sparkles, Clock, ChefHat, 
  CheckCircle2, XCircle
} from 'lucide-react'
import { DashboardData, fetchVendorDashboardData, AIInsight } from './actions'

const formatCurrency = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  trendingUp: TrendingUp, trendingDown: TrendingDown, clock: Clock, chef: ChefHat, star: Star, brain: Brain
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

export default function VendorOverviewClient({ initialData, userId }: { initialData: DashboardData | null, userId: string }) {
  const [data, setData] = useState<DashboardData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleRefresh = async () => {
    if (!userId) return
    setRefreshing(true)
    setError(null)
    try {
      const newData = await fetchVendorDashboardData(userId)
      setData(newData)
    } catch (err: any) {
      setError(err.message || 'Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  const stats = data?.stats
  const aiInsights = data?.insights || []

  const kpiCards = [
    { label: "Today's Revenue", value: stats ? formatCurrency(stats.todayRevenue) : '—', change: `${stats?.revenueTrend || 0}%`, up: (stats?.revenueTrend || 0) >= 0, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Active Orders', value: stats ? String(stats.activeOrders) : '—', change: `${stats?.ordersTrend || 0}%`, up: (stats?.ordersTrend || 0) >= 0, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Meals', value: stats ? String(stats.totalMeals) : '—', change: '—', up: true, icon: Package, color: 'bg-amber-50 text-amber-600' },
    { label: 'Avg Rating', value: stats?.avgRating ? stats.avgRating.toFixed(1) : '—', change: '—', up: true, icon: Star, color: 'bg-violet-50 text-violet-600' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            Vendor Dashboard
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs font-bold text-amber-600">
              <Sparkles size={12} /> AI-Powered
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Your store performance, orders, and intelligent insights.</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[64px] opacity-[0.06] bg-gradient-to-bl from-current to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{kpi.label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.color}`}><kpi.icon size={17} /></div>
              </div>
              {!stats ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{kpi.value}</p>}
              <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {kpi.change} from yesterday
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Weekly Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900">Weekly Orders</h3>
            <span className="text-xs text-gray-400 font-medium">This week</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Orders received per day</p>
          {!mounted || !stats ? <Skeleton className="h-[220px] w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.weeklyOrders} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Poppins, sans-serif' }} formatter={(value: any) => [`${value} orders`, 'Orders']} />
                <Bar dataKey="orders" fill="#1A5C3A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-gray-900">Revenue Trend</h3>
            <span className="text-xs text-gray-400 font-medium">Last 6 months</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Monthly revenue overview</p>
          {!mounted || !stats ? <Skeleton className="h-[220px] w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.monthlyRevenue}>
                <defs>
                  <linearGradient id="vendorRevGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4A535" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F4A535" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Poppins, sans-serif' }} formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#F4A535" strokeWidth={2.5} fill="url(#vendorRevGrad2)" dot={{ fill: '#F4A535', r: 4, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center"><Brain size={16} className="text-amber-600" /></div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Insights for Your Store</h3>
            <p className="text-xs text-gray-500">Real-time recommendations based on your data</p>
          </div>
        </div>
        <div className="p-5">
          {!stats ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiInsights.map((insight) => {
                const typeStyles: Record<string, string> = { success: 'border-l-emerald-500', warning: 'border-l-amber-500', opportunity: 'border-l-blue-500', info: 'border-l-violet-500' }
                const Icon = iconMap[insight.iconKey] || Brain
                return (
                  <div key={insight.id} className={`border-l-4 ${typeStyles[insight.type]} rounded-r-xl p-4 bg-gray-50/50`}>
                    <div className="flex items-start gap-3">
                      <Icon size={15} className={insight.type === 'success' ? 'text-emerald-600' : insight.type === 'warning' ? 'text-amber-600' : insight.type === 'opportunity' ? 'text-blue-600' : 'text-violet-600'} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{insight.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest 5 orders</p>
          </div>
          {stats && <span className="text-xs text-gray-400 font-medium">{stats.totalOrders} total · {formatCurrency(stats.totalRevenue)} earned</span>}
        </div>
        <div className="overflow-x-auto">
          {!stats ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : stats.recentOrders.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50">
                  <th className="px-5 py-3 font-semibold">Order #</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900 text-xs">#{order.id}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 font-medium">{order.customer}</td>
                    <td className="px-5 py-4 font-bold text-gray-900 text-sm">{order.amount}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">{order.date}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        order.status === 'Completed' || order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        order.status === 'Processing' || order.status === 'Preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {order.status === 'Completed' || order.status === 'delivered' ? <CheckCircle2 size={11} /> : order.status === 'Cancelled' ? <XCircle size={11} /> : <Clock size={11} />}
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">
              <ShoppingCart size={28} className="mx-auto text-gray-300 mb-2" /> No orders yet
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}