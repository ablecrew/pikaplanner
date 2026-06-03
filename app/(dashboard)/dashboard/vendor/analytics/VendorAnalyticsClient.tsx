'use client'

import { useState, useEffect, memo, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Star,
  Clock, Calendar, Download, RefreshCw, AlertCircle, Flame, Target, Zap, Brain, 
  Sparkles, ArrowUpRight, ArrowDownRight, Award, Gauge, Crown, Rocket, Lightbulb
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { AnalyticsData, DateRange, fetchVendorAnalyticsData, KPIMetric } from './actions'

const formatPercent = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
const formatCurrency = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const CHART_COLORS = ['#10b981', '#F4A535', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#f97316']

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  dollar: DollarSign, cart: ShoppingCart, trending: TrendingUp, users: Users,
  rocket: Rocket, alert: AlertCircle, clock: Clock, crown: Crown, award: Award, target: Target, brain: Brain
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

const KPICard = memo(function KPICard({ metric, delay = 0 }: { metric: KPIMetric; delay?: number }) {
  const Icon = iconMap[metric.iconKey] || DollarSign
  const isPositive = metric.change >= 0
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-all overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[56px] opacity-10 ${metric.color} group-hover:opacity-20 transition`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{metric.label}</p>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.accent}`}><Icon size={18} className={metric.color.replace('bg-', 'text-')} /></div>
        </div>
        <p className="text-3xl font-black text-gray-900 tracking-tight mb-2">{metric.value}</p>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{formatPercent(metric.change)}<span className="text-gray-400 font-normal ml-1">vs last period</span>
        </div>
      </div>
    </motion.div>
  )
})

export default function VendorAnalyticsClient({ initialData, userId }: { initialData: AnalyticsData | null, userId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(initialData)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => setMounted(true), [])

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
    startTransition(async () => {
      setLoading(true)
      const newData = await fetchVendorAnalyticsData(userId, range)
      setData(newData)
      setLoading(false)
    })
  }

  const exportReport = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), dateRange, ...data }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = `vendor-analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
  }

  const colorsMap: Record<string, { border: string; bg: string; text: string }> = {
    emerald: { border: 'border-l-emerald-500', bg: 'bg-emerald-50/30', text: 'text-emerald-700' }, red: { border: 'border-l-red-500', bg: 'bg-red-50/30', text: 'text-red-700' },
    amber: { border: 'border-l-amber-500', bg: 'bg-amber-50/30', text: 'text-amber-700' }, blue: { border: 'border-l-blue-500', bg: 'bg-blue-50/30', text: 'text-blue-700' },
    violet: { border: 'border-l-violet-500', bg: 'bg-violet-50/30', text: 'text-violet-700' }, indigo: { border: 'border-l-indigo-500', bg: 'bg-indigo-50/30', text: 'text-indigo-700' },
    orange: { border: 'border-l-orange-500', bg: 'bg-orange-50/30', text: 'text-orange-700' },
  }
  const priorityBadge = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3"><h1 className="text-3xl font-black text-gray-900">Analytics</h1><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 text-xs font-bold text-violet-700"><Sparkles size={12} /> AI-Powered</span></div>
          <p className="mt-1 text-sm text-gray-500">Deep insights into your business performance and growth opportunities.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <Calendar size={13} className="text-gray-400" />
            <select value={dateRange} onChange={(e) => handleDateRangeChange(e.target.value as DateRange)} className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer">
              <option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="90d">Last 90 Days</option><option value="all">All Time</option>
            </select>
          </div>
          <button onClick={() => handleDateRangeChange(dateRange)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"><RefreshCw size={15} className={loading || isPending ? 'animate-spin' : ''} /></button>
          <button onClick={exportReport} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"><Download size={15} /> Export</button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !data ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />) : data.kpis.map((metric, i) => <KPICard key={metric.label} metric={metric} delay={i * 0.05} />)}
      </div>

      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center"><Brain size={16} className="text-violet-600" /></div><div><h3 className="font-bold text-gray-900 text-sm">AI Insights & Recommendations</h3><p className="text-xs text-gray-500">Smart analysis of your business performance</p></div></div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading || !data ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />) : data.aiInsights.map((insight, i) => {
            const c = colorsMap[insight.color] || colorsMap.emerald
            const Icon = iconMap[insight.iconKey] || Lightbulb
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`border-l-4 ${c.border} ${c.bg} rounded-r-xl p-4 relative`}>
                <div className="flex items-start gap-3">
                  <div className={c.text}><Icon size={16} /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><p className="text-sm font-bold text-gray-900">{insight.title}</p><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${priorityBadge[insight.priority]}`}>{insight.priority}</span></div>
                    <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-gray-900">Revenue Trend</h3><p className="text-xs text-gray-400">Daily revenue over time</p></div><div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700"><TrendingUp size={12} />{data?.kpis[0] ? formatPercent(data.kpis[0].change) : '0%'}</div></div>
          {!mounted || loading || !data ? <Skeleton className="h-[250px] w-full" /> : (
            <ResponsiveContainer width="100%" height={250}><AreaChart data={data.revenueChart}><defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} /><Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" /></AreaChart></ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-gray-900">Performance Scorecard</h3><p className="text-xs text-gray-400">Multi-dimensional business metrics</p></div><div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-xs font-semibold text-violet-700"><Gauge size={12} />Overall Health</div></div>
          {!mounted || loading || !data ? <Skeleton className="h-[250px] w-full" /> : (
            <ResponsiveContainer width="100%" height={250}><RadarChart data={data.radarData}><PolarGrid stroke="#e5e7eb" /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} /><PolarRadiusAxis tick={{ fontSize: 10, fill: '#9ca3af' }} /><Radar name="Performance" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} /><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} /></RadarChart></ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-gray-900">Order Patterns</h3><p className="text-xs text-gray-400">Orders by hour of day</p></div><div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-xs font-semibold text-blue-700"><Clock size={12} />Peak Hours</div></div>
          {!mounted || loading || !data ? <Skeleton className="h-[250px] w-full" /> : (
            <ResponsiveContainer width="100%" height={250}><BarChart data={data.hourlyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2} /><YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} /><Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-gray-900">Category Mix</h3><p className="text-xs text-gray-400">Menu category distribution</p></div><div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-xs font-semibold text-amber-700"><BarChart3 size={12} />Menu Balance</div></div>
          {!mounted || loading || !data || data.categoryData.length === 0 ? <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">No category data yet</div> : (
            <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={data.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">{data.categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} /></PieChart></ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-white flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center"><Crown size={16} className="text-amber-600" /></div><div><h3 className="font-bold text-gray-900 text-sm">Top Performing Meals</h3><p className="text-xs text-gray-500">Your best-selling items by revenue</p></div></div>
        <div className="p-5">
          {loading || !data ? <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : data.mealPerformance.length === 0 ? <div className="py-12 text-center text-sm text-gray-400">No meal performance data yet</div> : (
            <div className="space-y-3">{data.mealPerformance.slice(0, 5).map((meal, i) => {
              const maxRevenue = data.mealPerformance[0].revenue
              const percentage = maxRevenue > 0 ? (meal.revenue / maxRevenue) * 100 : 0
              return (
                <motion.div key={meal.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-600'}`}>#{i + 1}</div>
                      <div><p className="font-semibold text-gray-900">{meal.name}</p><p className="text-xs text-gray-500">{meal.orders} orders · {meal.views} views</p></div>
                    </div>
                    <div className="text-right"><p className="font-bold text-gray-900">{formatCurrency(meal.revenue)}</p><div className="flex items-center gap-1 text-xs text-gray-500"><Star size={11} className="text-amber-500 fill-amber-500" />{meal.rating.toFixed(1)}</div></div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : i === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : i === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`} /></div>
                </motion.div>
              )
            })}</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center"><Users size={16} className="text-blue-600" /></div><div><h3 className="font-bold text-gray-900 text-sm">Customer Segments</h3><p className="text-xs text-gray-500">Breakdown by order frequency</p></div></div>
        <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !data ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />) : data.customerSegments.map((seg, i) => {
            const colors = [{ bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' }, { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600' }, { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: 'text-violet-600' }, { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' }]
            const color = colors[i]; const icons = [Users, TrendingUp, Award, Crown]; const Icon = icons[i]
            return (
              <motion.div key={seg.segment} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={`rounded-xl border-2 ${color.border} ${color.bg} p-4`}>
                <div className="flex items-center gap-2 mb-3"><Icon size={16} className={color.icon} /><p className={`text-xs font-bold ${color.text} uppercase tracking-wide`}>{seg.segment}</p></div>
                <p className="text-2xl font-black text-gray-900 mb-1">{seg.count}</p><p className="text-xs text-gray-500 mb-2">customers</p>
                <div className="pt-2 border-t border-gray-200"><p className="text-sm font-bold text-gray-900">{formatCurrency(seg.revenue)}</p><p className="text-xs text-gray-500">{formatCurrency(seg.avgOrderValue)} avg</p></div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}