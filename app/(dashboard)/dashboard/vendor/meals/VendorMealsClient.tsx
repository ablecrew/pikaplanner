'use client'

import { useState, useEffect, useMemo, memo, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed, Plus, Search, Eye, Edit2, Trash2, CheckCircle2, XCircle,
  Loader2, AlertCircle, RefreshCw, Filter, Package, Clock, DollarSign,
  ShoppingCart, Star, Brain, Target, TrendingUp, AlertTriangle, Wallet,
  Flame, Archive, Building2, CreditCard, ArrowDownToLine
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { createMeal, updateMeal } from '@/app/actions/manageMeals'
import { 
  DashboardData, VendorMeal, VendorOrder, fetchVendorMealsData, 
  toggleMealAvailabilityAction, deleteMealAction, processWithdrawalAction 
} from './actions'

const formatCurrency = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
const CHART_COLORS = ['#1A5C3A', '#32CD32', '#F4A535', '#f97316', '#3b82f6', '#8b5cf6']

type FormState = { name: string; description: string; category: string; cuisine: string; price: string; imageUrl: string; isAvailable: boolean; isPremium: boolean; servings: string; prepTime: string; cookTime: string; calories: string; protein: string; carbs: string; fat: string; difficulty: string; tags: string }
type WithdrawForm = { amount: string; method: 'mpesa' | 'bank'; phoneOrAccount: string }
const initialForm: FormState = { name: '', description: '', category: 'lunch', cuisine: 'kenyan', price: '', imageUrl: '', isAvailable: true, isPremium: false, servings: '1', prepTime: '', cookTime: '', calories: '', protein: '', carbs: '', fat: '', difficulty: 'easy', tags: '' }

const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200', delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200', Processing: 'bg-blue-50 text-blue-700 border-blue-200', Preparing: 'bg-blue-50 text-blue-700 border-blue-200', Pending: 'bg-amber-50 text-amber-700 border-amber-200', Cancelled: 'bg-red-50 text-red-700 border-red-200', Refunded: 'bg-violet-50 text-violet-700 border-violet-200' }
  const icons: Record<string, React.ReactNode> = { Completed: <CheckCircle2 size={11} />, delivered: <CheckCircle2 size={11} />, Processing: <Clock size={11} />, Preparing: <UtensilsCrossed size={11} />, Pending: <Clock size={11} />, Cancelled: <XCircle size={11} />, Refunded: <Archive size={11} /> }
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{icons[status] || <AlertCircle size={11} />}{status}</span>
})

const OrderRow = memo(function OrderRow({ order }: { order: VendorOrder }) {
  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-4 font-semibold text-gray-900 text-xs">#{order.orderNumber}</td>
      <td className="px-5 py-4"><p className="text-sm font-medium text-gray-800">{order.customer}</p><p className="text-xs text-gray-400">{order.customerEmail}</p></td>
      <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(order.amount)}</td>
      <td className="px-5 py-4 text-xs text-gray-500">{order.date}</td>
      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
      <td className="px-5 py-4"><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"><Eye size={15} /></button></td>
    </tr>
  )
})

const MealCard = memo(function MealCard({ meal, onEdit, onToggle, onDelete, isToggling }: { meal: VendorMeal, onEdit: () => void, onToggle: () => void, onDelete: () => void, isToggling: boolean }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
      {meal.imageUrl ? (
        <div className="h-40 relative">
          <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 flex gap-1.5">
            {meal.isPremium && <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1"><Star size={10} className="fill-white" /> Premium</span>}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meal.isAvailable ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>{meal.isAvailable ? 'Active' : 'Offline'}</span>
          </div>
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><UtensilsCrossed size={36} className="text-emerald-400" /></div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div><h4 className="font-bold text-gray-900 text-sm">{meal.name}</h4><p className="text-xs text-gray-400 mt-0.5 capitalize">{meal.category} · {meal.cuisine}</p></div>
          <p className="font-extrabold text-gray-900">{formatCurrency(meal.price)}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={12} /> {meal.prepTime + meal.cookTime}min<span className="w-1 h-1 rounded-full bg-gray-300" /><Flame size={12} /> {meal.calories} kcal</div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1"><Edit2 size={12} /> Edit</button>
          <button onClick={onToggle} disabled={isToggling} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${meal.isAvailable ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            {isToggling ? <Loader2 size={12} className="animate-spin" /> : meal.isAvailable ? <><Archive size={12} /> Offline</> : <><CheckCircle2 size={12} /> Online</>}
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"><Trash2 size={12} /></button>
        </div>
      </div>
    </motion.div>
  )
})

export default function VendorMealsClient({ initialData, userId }: { initialData: DashboardData | null, userId: string }) {
  const [data, setData] = useState<DashboardData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'withdraw' | null>(null)
  const [selected, setSelected] = useState<VendorMeal | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm>({ amount: '', method: 'mpesa', phoneOrAccount: '' })
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [confirm, setConfirm] = useState<VendorMeal | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setMounted(true) }, [])

  const refreshData = async () => {
    setLoading(true)
    const newData = await fetchVendorMealsData(userId)
    setData(newData)
    setLoading(false)
  }

  const meals = data?.meals || []
  const orders = data?.orders || []
  const stats = data?.stats || { activeMeals: 0, totalOrders: 0, completedOrders: 0, pendingOrders: 0, totalRevenue: 0 }

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim()
    return orders.filter(o => {
      const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const openAdd = () => { setSelected(null); setForm(initialForm); setModalMode('add') }
  const openEdit = (meal: VendorMeal) => {
    setSelected(meal)
    setForm({ name: meal.name, description: meal.description, category: meal.category, cuisine: meal.cuisine, price: String(meal.price), imageUrl: meal.imageUrl, isAvailable: meal.isAvailable, isPremium: meal.isPremium, servings: String(meal.servings), prepTime: String(meal.prepTime), cookTime: String(meal.cookTime), calories: String(meal.calories), protein: String(meal.protein), carbs: String(meal.carbs), fat: String(meal.fat), difficulty: meal.difficulty, tags: meal.tags.join(', ') })
    setModalMode('edit')
  }

  const handleSave = async () => {
    if (!data?.vendorId) return
    setSaving(true); setError(null)
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const payload = { id: selected?.id, name: form.name, vendorId: data.vendorId, category: form.category, cuisine: form.cuisine || 'other', description: form.description || '', imageUrl: form.imageUrl || '', servings: Number(form.servings) || 1, prepTimeMinutes: Number(form.prepTime) || 0, cookTimeMinutes: Number(form.cookTime) || 0, caloriesPerServing: Number(form.calories) || 0, proteinG: Number(form.protein) || 0, carbsG: Number(form.carbs) || 0, fatG: Number(form.fat) || 0, difficulty: form.difficulty || 'easy', tags, isPremium: form.isPremium, status: (form.isAvailable ? 'Available' : 'Unavailable') as any, price: Number(form.price) || 0, createdBy: userId }
      const result = modalMode === 'add' ? await createMeal(payload) : await updateMeal(payload)
      if (!result.success) throw new Error(result.error)
      setInfoMessage(result.message || 'Meal saved!'); setModalMode(null); setForm(initialForm)
      await refreshData()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  const handleToggleAvailability = async (meal: VendorMeal) => {
    setActionLoadingId(meal.id)
    setData(prev => prev ? { ...prev, meals: prev.meals.map(m => m.id === meal.id ? { ...m, isAvailable: !m.isAvailable } : m) } : null)
    await toggleMealAvailabilityAction(meal.vendorMealId, !meal.isAvailable)
    setActionLoadingId(null)
  }

  const handleDelete = async () => {
    if (!confirm) return
    setActionLoadingId(confirm.id)
    setData(prev => prev ? { ...prev, meals: prev.meals.filter(m => m.id !== confirm.id) } : null)
    await deleteMealAction(confirm.id, confirm.vendorMealId)
    setActionLoadingId(null); setConfirm(null)
  }

  const handleWithdraw = async () => {
    const amount = Number(withdrawForm.amount)
    if (!amount || !data?.vendorId || amount > data.availableBalance) return
    setWithdrawLoading(true)
    try {
      await processWithdrawalAction(userId, data.vendorId, amount, withdrawForm.method, withdrawForm.phoneOrAccount)
      setInfoMessage(`Withdrawal of ${formatCurrency(amount)} initiated`); setModalMode(null); setWithdrawForm({ amount: '', method: 'mpesa', phoneOrAccount: '' })
      await refreshData()
    } catch (err: any) { setError(err.message) } finally { setWithdrawLoading(false) }
  }

  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = { chef: UtensilsCrossed, target: Target, clock: Clock, trendingUp: TrendingUp, alert: AlertTriangle, brain: Brain }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">My Meals<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs font-bold text-amber-600"><Star size={12} /> AI-Powered</span></h1>
          <p className="mt-1 text-sm text-gray-500">Manage your menu, track orders, and withdraw earnings.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setModalMode('withdraw')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F4A535] to-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-200 hover:shadow-xl transition-all"><Wallet size={16} /> Withdraw</button>
          <button onClick={refreshData} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"><Plus size={16} /> Add Meal</button>
        </div>
      </div>

      {error && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</div>}
      {infoMessage && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {infoMessage}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[{ label: 'Available Balance', value: formatCurrency(data?.availableBalance || 0), icon: Wallet, color: 'bg-amber-500', accent: 'bg-amber-50' }, { label: 'Active Meals', value: stats.activeMeals, icon: UtensilsCrossed, color: 'bg-emerald-500', accent: 'bg-emerald-50' }, { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-blue-500', accent: 'bg-blue-50' }, { label: 'Total Earned', value: formatCurrency(data?.totalEarnings || 0), icon: DollarSign, color: 'bg-violet-500', accent: 'bg-violet-50' }].map((s) => (
          <div key={s.label} className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[48px] opacity-10 ${s.color}`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.accent}`}><s.icon size={17} className={s.color.replace('bg-', 'text-')} /></div></div>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Earnings Overview</h3>
          <p className="text-xs text-gray-400 mb-5">Monthly earnings from completed orders</p>
          {!mounted ? <div className="h-[220px] bg-gray-100 rounded-lg animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={220}><AreaChart data={data?.earningsChart || []}><defs><linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F4A535" stopOpacity={0.2} /><stop offset="95%" stopColor="#F4A535" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} /><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [formatCurrency(Number(value)), 'Earnings']} /><Area type="monotone" dataKey="earnings" stroke="#F4A535" strokeWidth={2.5} fill="url(#earnGrad)" dot={{ fill: '#F4A535', r: 4, strokeWidth: 2, stroke: '#fff' }} /></AreaChart></ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Meals by Category</h3>
          <p className="text-xs text-gray-400 mb-5">Distribution of your menu</p>
          {!mounted || !data?.mealsPieChart.length ? <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No meals yet</div> : (
            <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={data.mealsPieChart} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">{data.mealsPieChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [`${value} meals`, 'Count']} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} /></PieChart></ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-white flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center"><Brain size={16} className="text-amber-600" /></div><div><h3 className="font-bold text-gray-900 text-sm">AI Insights</h3><p className="text-xs text-gray-500">Smart recommendations</p></div></div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.aiInsights.map((insight) => {
            const Icon = iconMap[insight.iconKey] || Brain
            const colors = { success: 'border-l-emerald-500 text-emerald-600', warning: 'border-l-amber-500 text-amber-600', opportunity: 'border-l-blue-500 text-blue-600', info: 'border-l-violet-500 text-violet-600' }
            return (
              <div key={insight.id} className={`border-l-4 ${colors[insight.type].split(' ')[0]} rounded-r-xl p-4 bg-gray-50/50`}>
                <div className="flex items-start gap-3"><Icon size={15} className={colors[insight.type].split(' ')[1]} /><div><p className="text-sm font-bold text-gray-900">{insight.title}</p><p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.description}</p></div></div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div><h3 className="font-bold text-gray-900">Orders</h3><p className="text-xs text-gray-400 mt-0.5">{filteredOrders.length} orders</p></div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => startTransition(() => setSearch(e.target.value))} placeholder="Search orders..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" /></div>
            <div className="flex items-center gap-2 flex-wrap">{['All', 'Completed', 'Processing', 'Pending', 'Cancelled'].map((s) => (<button key={s} onClick={() => startTransition(() => setStatusFilter(s))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>))}</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? <div className="py-16 text-center flex flex-col items-center gap-3"><ShoppingCart size={36} className="text-gray-300" /><p className="text-sm text-gray-400 font-medium">No orders found</p></div> : (
            <table className="w-full text-sm"><thead><tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50"><th className="px-5 py-3 font-semibold">Order #</th><th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Actions</th></tr></thead><tbody>{filteredOrders.map(order => <OrderRow key={order.id} order={order} />)}</tbody></table>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900 text-lg">Your Meals ({meals.length})</h3></div>
        {meals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-3"><div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center"><UtensilsCrossed size={28} className="text-emerald-500" /></div><p className="text-gray-900 font-semibold">No meals yet</p><button onClick={openAdd} className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition"><Plus size={15} className="inline mr-1.5" /> Add Your First Meal</button></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map((meal) => <MealCard key={meal.id} meal={meal} onEdit={() => openEdit(meal)} onToggle={() => handleToggleAvailability(meal)} onDelete={() => setConfirm(meal)} isToggling={actionLoadingId === meal.id} />)}
          </div>
        )}
      </div>

      <Modal isOpen={modalMode === 'add' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={modalMode === 'add' ? 'Add New Meal' : 'Edit Meal'} size="md">
        <div className="overflow-y-auto max-h-[70vh] -mx-2 px-2 space-y-4">
          <div className="grid grid-cols-3 gap-3"><div className="col-span-2"><label className="mb-1 block text-xs font-semibold text-gray-700">Meal Name *</label><input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="e.g. Chicken Biryani" /></div><div><label className="mb-1 block text-xs font-semibold text-gray-700">Price (KES) *</label><input value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="850" /></div></div>
          <div><label className="mb-1 block text-xs font-semibold text-gray-700">Description</label><textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="min-h-[60px] w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900 resize-y" placeholder="Brief description..." /></div>
          <div><label className="mb-1 block text-xs font-semibold text-gray-700">Image URL</label><input value={form.imageUrl} onChange={(e) => setForm(p => ({ ...p, imageUrl: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="https://..." /></div>
          <div className="grid grid-cols-3 gap-3"><div><label className="mb-1 block text-xs font-semibold text-gray-700">Category</label><select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option><option value="dessert">Dessert</option></select></div><div><label className="mb-1 block text-xs font-semibold text-gray-700">Cuisine</label><select value={form.cuisine} onChange={(e) => setForm(p => ({ ...p, cuisine: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"><option value="kenyan">Kenyan</option><option value="african">African</option><option value="indian">Indian</option><option value="chinese">Chinese</option><option value="italian">Italian</option></select></div><div><label className="mb-1 block text-xs font-semibold text-gray-700">Difficulty</label><select value={form.difficulty} onChange={(e) => setForm(p => ({ ...p, difficulty: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div></div>
          <div className="flex items-center gap-6"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-emerald-600" /><span className="text-xs font-medium text-gray-700">Available</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isPremium} onChange={(e) => setForm(p => ({ ...p, isPremium: e.target.checked }))} className="h-4 w-4 rounded border-amber-300 text-amber-500" /><span className="text-xs font-medium text-amber-700 flex items-center gap-1"><Star size={12} className="fill-amber-500 text-amber-500" /> Premium</span></label></div>
          <div className="flex gap-3 pt-3 border-t border-gray-100 sticky bottom-0 bg-white pb-1"><button onClick={() => setModalMode(null)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button><button onClick={handleSave} disabled={saving || !form.name} className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg transition disabled:opacity-50">{saving ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> Saving...</span> : modalMode === 'add' ? 'Add Meal' : 'Save Changes'}</button></div>
        </div>
      </Modal>

      <Modal isOpen={modalMode === 'withdraw'} onClose={() => setModalMode(null)} title="Withdraw Earnings" size="md">
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-4 border border-amber-100"><p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Available Balance</p><p className="text-2xl font-extrabold text-gray-900">{formatCurrency(data?.availableBalance || 0)}</p></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (KES)</label><input type="number" value={withdrawForm.amount} onChange={(e) => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-200 text-gray-900" placeholder="Enter amount" /></div>
          <div className="grid grid-cols-2 gap-3"><button onClick={() => setWithdrawForm(p => ({ ...p, method: 'mpesa' }))} className={`p-4 rounded-xl border-2 text-left transition ${withdrawForm.method === 'mpesa' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}><CreditCard size={20} className={withdrawForm.method === 'mpesa' ? 'text-emerald-600' : 'text-gray-400'} /><p className="text-sm font-semibold text-gray-900 mt-2">M-Pesa</p></button><button onClick={() => setWithdrawForm(p => ({ ...p, method: 'bank' }))} className={`p-4 rounded-xl border-2 text-left transition ${withdrawForm.method === 'bank' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}><Building2 size={20} className={withdrawForm.method === 'bank' ? 'text-emerald-600' : 'text-gray-400'} /><p className="text-sm font-semibold text-gray-900 mt-2">Bank</p></button></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">{withdrawForm.method === 'mpesa' ? 'M-Pesa Number' : 'Account Number'}</label><input type="text" value={withdrawForm.phoneOrAccount} onChange={(e) => setWithdrawForm(p => ({ ...p, phoneOrAccount: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 text-gray-900" placeholder={withdrawForm.method === 'mpesa' ? '07XX XXX XXX' : 'Account number'} /></div>
          <div className="flex gap-3 pt-2"><button onClick={() => setModalMode(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button><button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawForm.amount || Number(withdrawForm.amount) <= 0 || Number(withdrawForm.amount) > (data?.availableBalance || 0)} className="flex-1 rounded-xl bg-gradient-to-r from-[#F4A535] to-[#f97316] px-4 py-3 text-sm font-bold text-white shadow-md shadow-amber-200 hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">{withdrawLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}{withdrawLoading ? 'Processing...' : 'Withdraw'}</button></div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirm} title="Delete Meal" message={`Delete "${confirm?.name}"? This cannot be undone.`} confirmLabel="Delete" confirmVariant="danger" onConfirm={handleDelete} onCancel={() => setConfirm(null)} />
    </motion.div>
  )
}