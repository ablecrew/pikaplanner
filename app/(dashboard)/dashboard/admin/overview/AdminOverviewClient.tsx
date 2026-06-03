'use client'

import { useState, useEffect, memo, useTransition } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, Store,
  Sparkles, Brain, Zap, Loader2, AlertCircle, RefreshCw, Eye,
  ArrowUpRight, ArrowDownRight, Activity, Target, Clock, Award,
  Globe, DollarSign, Package, BarChart3, ChevronRight, Bot,
  Lightbulb, AlertTriangle, CheckCircle2, Filter, Download,
} from 'lucide-react'
import { AdminDashboardData, Period, fetchAdminDashboardData } from './actions'

const formatCurrency = (n: number): string => {
  if (n >= 1000000) return `KES ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `KES ${(n / 1000).toFixed(1)}K`
  return `KES ${n.toLocaleString()}`
}

const CHART_COLORS = ['#1A5C3A', '#32CD32', '#F4A535', '#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899']

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  trendingUp: TrendingUp, alertTriangle: AlertTriangle, users: Users, store: Store, target: Target, brain: Brain
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

// ── Memoized KPI Card ─────────────────────────────────────
const KpiCard = memo(function KpiCard({ label, value, change, up, icon: Icon, color, loading }: {
  label: string; value: string; change: string; up: boolean; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; loading: boolean
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  }
  const c = colorMap[color] || colorMap.emerald

  return (
    <motion.div whileHover={{ y: -2 }} className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[64px] opacity-[0.06] bg-gradient-to-bl from-current to-transparent" style={{ color: c.text }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}><Icon size={17} /></div>
        </div>
        {loading ? <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" /> : <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>}
        <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{loading ? '...' : change}
        </p>
      </div>
    </motion.div>
  )
})

// ── Memoized AI Insight Card ──────────────────────────────
const AIInsightCard = memo(function AIInsightCard({ insight }: { insight: AdminDashboardData['aiInsights'][0] }) {
  const typeStyles: Record<string, string> = {
    opportunity: 'border-l-emerald-500 bg-emerald-50/50',
    warning: 'border-l-amber-500 bg-amber-50/50',
    success: 'border-l-green-500 bg-green-50/50',
    info: 'border-l-blue-500 bg-blue-50/50',
  }
  const Icon = iconMap[insight.iconKey] || Lightbulb

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`border-l-4 rounded-r-xl p-4 ${typeStyles[insight.type]} bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          insight.type === 'warning' ? 'bg-amber-100 text-amber-600' : insight.type === 'success' ? 'bg-emerald-100 text-emerald-600' : insight.type === 'opportunity' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
        }`}><Icon size={15} /></div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">{insight.title}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.description}</p>
          {insight.action && <button className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">{insight.action} <ChevronRight size={12} /></button>}
        </div>
      </div>
    </motion.div>
  )
})

// ── Main Client Component ─────────────────────────────────
export default function AdminOverviewClient({ initialData }: { initialData: AdminDashboardData }) {
  const [data, setData] = useState<AdminDashboardData>(initialData)
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d')
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => setMounted(true), [])

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period)
    startTransition(async () => {
      setLoading(true)
      const newData = await fetchAdminDashboardData(period)
      setData(newData)
      setLoading(false)
    })
  }

  const stats = data.stats
  const aiInsights = data.aiInsights
  const isLoading = loading || isPending

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">Admin Overview<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 text-xs font-bold text-violet-600"><Sparkles size={12} /> AI-Powered</span></h1>
          <p className="mt-1 text-sm text-gray-500">Real-time platform performance with intelligent insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button key={p} onClick={() => handlePeriodChange(p)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${selectedPeriod === p ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{p.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={() => handlePeriodChange(selectedPeriod)} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} change={`${stats.revenueTrend}% from last period`} up={stats.revenueTrend >= 0} icon={DollarSign} color="emerald" loading={isLoading} />
        <KpiCard label="Total Users" value={stats.totalUsers.toLocaleString()} change={`${stats.usersTrend}% from last period`} up={stats.usersTrend >= 0} icon={Users} color="blue" loading={isLoading} />
        <KpiCard label="Total Orders" value={stats.totalOrders.toLocaleString()} change={`${stats.ordersTrend}% from last period`} up={stats.ordersTrend >= 0} icon={ShoppingCart} color="amber" loading={isLoading} />
        <KpiCard label="Active Vendors" value={stats.totalVendors.toLocaleString()} change={`${stats.vendorsTrend}% from last period`} up={stats.vendorsTrend >= 0} icon={Store} color="violet" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-900">Revenue Trend</h3><span className="text-xs text-gray-400 font-medium">Last 6 months</span></div>
          <p className="text-xs text-gray-400 mb-5">Monthly revenue and order volume</p>
          {!mounted || isLoading ? <Skeleton className="h-[220px] w-full" /> : (
            <ResponsiveContainer width="100%" height={220}><AreaChart data={stats.monthlyRevenue}><defs><linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1A5C3A" stopOpacity={0.15} /><stop offset="95%" stopColor="#1A5C3A" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} /><Area type="monotone" dataKey="revenue" stroke="#1A5C3A" strokeWidth={2.5} fill="url(#revGradient)" dot={{ fill: '#1A5C3A', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ fill: '#F4A535', r: 6, strokeWidth: 2, stroke: '#fff' }} /></AreaChart></ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-900">Top Vendors</h3><span className="text-xs text-gray-400 font-medium">By revenue</span></div>
          <p className="text-xs text-gray-400 mb-5">Highest performing vendors this period</p>
          {!mounted || isLoading ? <Skeleton className="h-[220px] w-full" /> : stats.topVendors.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}><BarChart data={stats.topVendors} layout="vertical" barSize={20}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" /><XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} /><Bar dataKey="revenue" fill="#F4A535" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No vendor data yet</div>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-900">User Growth</h3><span className="text-xs text-gray-400 font-medium">Last 6 months</span></div>
        <p className="text-xs text-gray-400 mb-5">Monthly registered user acquisition</p>
        {!mounted || isLoading ? <Skeleton className="h-[220px] w-full" /> : (
          <ResponsiveContainer width="100%" height={220}><LineChart data={stats.monthlyUsers}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [`${value} users`, 'Users']} /><Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }} /></LineChart></ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Meal Categories</h3><p className="text-xs text-gray-400 mb-5">Distribution by category</p>
          {!mounted || isLoading ? <Skeleton className="h-[200px] w-full" /> : stats.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={stats.categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">{stats.categoryBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [`${value} meals`, 'Count']} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} /></PieChart></ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No meal data yet</div>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Quick Stats</h3><p className="text-xs text-gray-400 mb-5">Platform snapshot</p>
          {isLoading ? <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
            <div className="space-y-3">
              {[{ label: 'Total Meals', value: stats.totalMeals, icon: Package, color: 'text-emerald-600' }, { label: 'Active Vendors', value: stats.totalVendors, icon: Store, color: 'text-violet-600' }, { label: 'Avg Order Value', value: stats.totalOrders ? formatCurrency(stats.totalRevenue / stats.totalOrders) : '—', icon: DollarSign, color: 'text-amber-600' }, { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600' }, { label: 'Period Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-green-600' }].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-500 flex items-center gap-2"><item.icon size={14} className={item.color} /> {item.label}</span><span className="text-sm font-bold text-gray-900">{item.value}</span></div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Recent Orders</h3><p className="text-xs text-gray-400 mb-5">Latest transactions</p>
          {isLoading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : stats.recentOrders.length > 0 ? (
            <div className="space-y-2">{stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div><p className="text-xs font-semibold text-gray-800">#{order.id}</p><p className="text-[10px] text-gray-400">{order.date}</p></div>
                <div className="text-right"><p className="text-xs font-bold text-gray-900">{formatCurrency(order.amount)}</p><span className={`text-[10px] font-semibold ${order.status === 'Completed' || order.status === 'delivered' ? 'text-emerald-600' : order.status === 'Pending' ? 'text-amber-600' : 'text-gray-500'}`}>{order.status}</span></div>
              </div>
            ))}</div>
          ) : <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">No orders yet</div>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center"><Brain size={16} className="text-violet-600" /></div><div><h3 className="font-bold text-gray-900 text-sm">AI-Powered Insights</h3><p className="text-xs text-gray-500">Real-time analysis and recommendations for your platform</p></div></div>
        <div className="p-5">
          {isLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div> : aiInsights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{aiInsights.map((insight) => <AIInsightCard key={insight.id} insight={insight} />)}</div>
          ) : <div className="text-center py-8 text-sm text-gray-400"><Brain size={28} className="mx-auto text-gray-300 mb-2" />Not enough data for AI insights yet</div>}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">Data refreshes on period change. Last updated: {new Date().toLocaleString()}</p>
    </motion.div>
  )
}