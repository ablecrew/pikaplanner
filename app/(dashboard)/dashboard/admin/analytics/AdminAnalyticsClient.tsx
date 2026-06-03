'use client'

import { useState, useEffect, memo, useTransition } from 'react'
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
import { DashboardPayload, Period, fetchAdminAnalyticsData } from './actions'

const CHART_COLORS = ['#1A5C3A', '#32CD32', '#F4A535', '#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6']

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  dollar: DollarSign, users: Users, cart: ShoppingCart, store: Store, trendingUp: TrendingUp, target: Target
}

function formatCurrency(n: number): string {
  if (n >= 1000000) return `KES ${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `KES ${(n / 1000).toFixed(1)}K`
  return `KES ${n.toLocaleString()}`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

// ── Memoized Components ───────────────────────────────────

const KpiCard = memo(function KpiCard({ label, value, change, up, iconKey, color, loading }: {
  label: string; value: string; change: string; up: boolean; iconKey: string; color: string; loading: boolean
}) {
  const Icon = iconMap[iconKey] || DollarSign
  const colorMap: Record<string, string> = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600' }
  
  return (
    <motion.div whileHover={{ y: -2 }} className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[64px] opacity-[0.06] bg-gradient-to-bl from-current to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}><Icon size={17} /></div>
        </div>
        {loading ? <Skeleton className="h-8 w-28" /> : <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>}
        <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{change}
        </p>
      </div>
    </motion.div>
  )
})

const AIPredictionCard = memo(function AIPredictionCard({ pred }: { pred: DashboardPayload['predictions'][0] }) {
  const Icon = iconMap[pred.iconKey] || Lightbulb
  return (
    <motion.div whileHover={{ y: -2 }} className="relative rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[48px] opacity-[0.06] bg-gradient-to-bl from-violet-500 to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center"><Icon size={14} className="text-violet-600" /></div>
          <div className={`flex items-center gap-0.5 text-xs font-bold ${pred.trend === 'up' ? 'text-emerald-600' : pred.trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
            {pred.trend === 'up' ? <TrendingUp size={13} /> : pred.trend === 'down' ? <TrendingDown size={13} /> : <Activity size={13} />}{pred.confidence}%
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
  )
})

// ── Main Client Component ─────────────────────────────────

export default function AdminAnalyticsClient({ initialPayload }: { initialPayload: DashboardPayload }) {
  const [payload, setPayload] = useState<DashboardPayload>(initialPayload)
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d')
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => setMounted(true), [])

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period)
    startTransition(async () => {
      setLoading(true)
      const newData = await fetchAdminAnalyticsData(period)
      setPayload(newData)
      setLoading(false)
    })
  }

  const data = payload.data
  const predictions = payload.predictions
  const isLoading = loading || isPending

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">Analytics<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 text-xs font-bold text-violet-600"><Brain size={12} /> AI Forecast</span></h1>
          <p className="mt-1 text-sm text-gray-500">Data-driven insights and predictive analytics for your platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
            {(['30d', '90d', '6m', '1y'] as Period[]).map((p) => (
              <button key={p} onClick={() => handlePeriodChange(p)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${selectedPeriod === p ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{p.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={() => handlePeriodChange(selectedPeriod)} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {data.kpiCards.map((kpi) => <KpiCard key={kpi.label} {...kpi} loading={isLoading} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-900">Revenue Trend</h3><span className="text-xs text-gray-400 font-medium">{selectedPeriod.toUpperCase()}</span></div>
          <p className="text-xs text-gray-400 mb-5">Monthly revenue and order volume</p>
          {!mounted || isLoading ? <Skeleton className="h-[240px] w-full" /> : (
            <ResponsiveContainer width="100%" height={240}><AreaChart data={data.monthlyRevenue}><defs><linearGradient id="revGrad3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1A5C3A" stopOpacity={0.15} /><stop offset="95%" stopColor="#1A5C3A" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} /><Area type="monotone" dataKey="revenue" stroke="#1A5C3A" strokeWidth={2.5} fill="url(#revGrad3)" dot={{ fill: '#1A5C3A', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ fill: '#F4A535', r: 6, strokeWidth: 2, stroke: '#fff' }} /></AreaChart></ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-900">User Growth</h3><span className="text-xs text-gray-400 font-medium">{selectedPeriod.toUpperCase()}</span></div>
          <p className="text-xs text-gray-400 mb-5">Monthly registered users</p>
          {!mounted || isLoading ? <Skeleton className="h-[240px] w-full" /> : (
            <ResponsiveContainer width="100%" height={240}><LineChart data={data.monthlyUsers}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [`${value} users`, 'Users']} /><Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }} /></LineChart></ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Top Vendors</h3><p className="text-xs text-gray-400 mb-5">By revenue this period</p>
          {!mounted || isLoading ? <Skeleton className="h-[220px] w-full" /> : (
            <ResponsiveContainer width="100%" height={220}><BarChart data={data.topVendors} layout="vertical" barSize={18}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" /><XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} width={80} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} /><Bar dataKey="revenue" fill="#F4A535" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Meal Categories</h3><p className="text-xs text-gray-400 mb-5">Distribution by category</p>
          {!mounted || isLoading ? <Skeleton className="h-[220px] w-full" /> : (
            <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={data.categoryBreakdown} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={3} dataKey="value">{data.categoryBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [`${value} meals`, 'Count']} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} /></PieChart></ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Key Metrics</h3><p className="text-xs text-gray-400 mb-5">Performance indicators</p>
          {isLoading ? <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
            <div className="space-y-3">
              {[
                { label: 'Avg Order Value', value: formatCurrency(data.avgOrderValue), icon: DollarSign, color: 'text-emerald-600' },
                { label: 'Conversion Rate', value: `${data.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-violet-600' },
                { label: 'Total Meals', value: data.categoryBreakdown.reduce((a, b) => a + b.value, 0).toString(), icon: Package, color: 'text-amber-600' },
                { label: 'Active Vendors', value: data.totalVendors.toString(), icon: Store, color: 'text-blue-600' },
                { label: 'Period Orders', value: data.totalOrders.toString(), icon: ShoppingCart, color: 'text-green-600' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><item.icon size={14} className={item.color} /> {item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center"><Brain size={16} className="text-violet-600" /></div><div><h3 className="font-bold text-gray-900 text-sm">AI-Powered Forecasts</h3><p className="text-xs text-gray-500">Predictive analytics based on historical trends</p></div></div>
          <span className="text-[10px] text-gray-400 font-medium">Updated in real-time</span>
        </div>
        <div className="p-5">
          {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{predictions.map((pred) => <AIPredictionCard key={pred.id} pred={pred} />)}</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}