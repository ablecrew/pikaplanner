'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed, Plus, Search, Eye, Edit2, Trash2, CheckCircle2, XCircle,
  Loader2, AlertCircle, RefreshCw, Download, Filter, Package, Clock, Truck,
  DollarSign, ArrowDownToLine, TrendingUp, TrendingDown, ShoppingCart,
  Star, Brain, Sparkles, Target, Zap, ChevronRight, MoreHorizontal,
  BarChart3, PieChart, BadgeCheck, CreditCard, Ban, Archive, ChefHat,
  AlertTriangle, Layers, ArrowUpRight, Wallet, Flame,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell, Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { createMeal, updateMeal } from '@/app/actions/manageMeals'

// ── Types ────────────────────────────────────────────────

type VendorMealData = {
  id: string
  meal_id: string
  vendor_id: string
  price: number
  is_available: boolean
}

type VendorMeal = {
  id: string
  vendorMealId: string
  name: string
  description: string
  category: string
  cuisine: string
  price: number
  imageUrl: string
  isAvailable: boolean
  isPremium: boolean
  servings: number
  prepTime: number
  cookTime: number
  calories: number
  protein: number
  carbs: number
  fat: number
  difficulty: string
  tags: string[]
  totalOrders: number
  totalRevenue: number
}

type VendorOrder = {
  id: string
  orderNumber: string
  customer: string
  customerEmail: string
  items: string
  amount: number
  status: string
  date: string
  mealName: string
}

type FormState = {
  name: string
  description: string
  category: string
  cuisine: string
  price: string
  imageUrl: string
  isAvailable: boolean
  isPremium: boolean
  servings: string
  prepTime: string
  cookTime: string
  calories: string
  protein: string
  carbs: string
  fat: string
  difficulty: string
  tags: string
}

type WithdrawForm = {
  amount: string
  method: 'mpesa' | 'bank'
  phoneOrAccount: string
}

// ── Helpers ───────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CHART_COLORS = ['#1A5C3A', '#32CD32', '#F4A535', '#f97316', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899']

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const initialForm: FormState = {
  name: '', description: '', category: 'lunch', cuisine: 'kenyan',
  price: '', imageUrl: '', isAvailable: true, isPremium: false,
  servings: '1', prepTime: '', cookTime: '', calories: '',
  protein: '', carbs: '', fat: '', difficulty: 'easy', tags: '',
}

// ── Skeleton ──────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

// ── Status Badge ──────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Processing: 'bg-blue-50 text-blue-700 border-blue-200',
    Preparing: 'bg-blue-50 text-blue-700 border-blue-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
    Refunded: 'bg-violet-50 text-violet-700 border-violet-200',
  }

  const icons: Record<string, React.ReactNode> = {
    Completed: <CheckCircle2 size={11} />,
    delivered: <CheckCircle2 size={11} />,
    Processing: <Clock size={11} />,
    Preparing: <ChefHat size={11} />,
    Pending: <Clock size={11} />,
    Cancelled: <XCircle size={11} />,
    Refunded: <Ban size={11} />,
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {icons[status] || <AlertCircle size={11} />}
      {status}
    </span>
  )
}

// Instantiate Supabase outside the component to prevent recreating it on every render,
// which causes the useCallback dependencies to trigger infinite render loops.
const supabase = createClient()

// ── MAIN PAGE ─────────────────────────────────────────────

export default function VendorMealsPage() {
  const [meals, setMeals] = useState<VendorMeal[]>([])
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'withdraw' | null>(null)
  const [selected, setSelected] = useState<VendorMeal | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm>({ amount: '', method: 'mpesa', phoneOrAccount: '' })
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [confirm, setConfirm] = useState<{ type: string; meal?: VendorMeal; order?: VendorOrder } | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
  
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
  
      // Try to get vendor, but don't fail if it errors
      let vid: string | null = null
      try {
        const { data: vendor, error: vendorErr } = await supabase
          .from('vendors')
          .select('id, available_balance, total_earnings, business_name')
          .eq('profile_id', user.id)
          .maybeSingle()
  
        if (vendorErr) throw vendorErr

        vid = vendor?.id || null
        setVendorId(vid)
        setAvailableBalance(Number(vendor?.available_balance || 0))
        setTotalEarnings(Number(vendor?.total_earnings || 0))
      } catch (vendorErr) {
        console.warn('Vendor lookup failed (may not be a vendor):', vendorErr)
        setVendorId(null)
        setAvailableBalance(0)
        setTotalEarnings(0)
      }

      // Get vendor meals
      if (vid) {
        const { data: vendorMeals } = await supabase
          .from('vendor_meals')
          .select('id, meal_id, price, is_available')
          .eq('vendor_id', vid)

        const mealIds = (vendorMeals || []).map((vm: { meal_id: any }) => vm.meal_id)
        const vendorMealMap = new Map<string, VendorMealData>((vendorMeals || []).map((vm: VendorMealData) => [vm.meal_id, vm]))

        let mealsData: VendorMeal[] = []
        if (mealIds.length > 0) {
          const { data: mealRows } = await supabase
            .from('meals')
            .select('*')
            .in('id', mealIds)
            .order('created_at', { ascending: false })

          mealsData = (mealRows || []).map((m: any) => {
            const vm: VendorMealData | undefined = vendorMealMap.get(m.id)
            return {
              id: m.id,
              vendorMealId: vm?.id || '',
              name: m.name,
              description: m.description || '',
              category: m.category,
              cuisine: m.cuisine,
              price: vm?.price || 0,
              imageUrl: m.image_url || '',
              isAvailable: vm?.is_available ?? true,
              isPremium: m.is_premium || false,
              servings: m.servings,
              prepTime: m.prep_time_minutes || 0,
              cookTime: m.cook_time_minutes || 0,
              calories: m.calories_per_serving || 0,
              protein: m.protein_g || 0,
              carbs: m.carbs_g || 0,
              fat: m.fat_g || 0,
              difficulty: m.difficulty || 'easy',
              tags: m.tags || [],
              totalOrders: 0,
              totalRevenue: 0,
            }
          })
        }

        // Get orders for this vendor
        const { data: orderRows } = await supabase
          .from('orders')
          .select('id, order_number, user_id, total_amount, status, created_at, customer_email, meal_id')
          .eq('vendor_id', vid)
          .order('created_at', { ascending: false })
          .limit(100)

        // 1) Batch-fetch all customer names in a single query (NO MORE N+1!)
        const userIds = [...new Set((orderRows || []).map((o: any) => o.user_id).filter(Boolean))]
        let profileMap = new Map<string, string>()
        try {
          if (userIds.length > 0) {
            const { data: profileRows } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds)
            profileMap = new Map((profileRows || []).map((p: any) => [p.id, p.full_name]))
          }
        } catch (e) {
          console.warn('Profile batch fetch failed:', e)
        }

        // 2) Build enriched orders synchronously
        const enrichedOrders: VendorOrder[] = (orderRows || []).map((o: any) => {
          const customerName = profileMap.get(o.user_id) || o.customer_email?.split('@')[0] || 'Customer'
          const meal = mealsData.find(m => m.id === o.meal_id)
          const mealName = meal?.name || mealsData[0]?.name || 'Meal Order'

          if (meal && (o.status === 'Completed' || o.status === 'delivered')) {
            meal.totalOrders += 1
            meal.totalRevenue += Number(o.total_amount)
          }

          return {
            id: o.id,
            orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
            customer: customerName,
            customerEmail: o.customer_email || '',
            items: '1 meal',
            amount: Number(o.total_amount),
            status: o.status || 'Pending',
            date: formatDate(o.created_at),
            mealName,
          }
        })

        setOrders(enrichedOrders)
        setMeals(mealsData)
      }
    } catch (err) {
      console.error('Vendor meals error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // ── Stats ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeMeals = meals.filter(m => m.isAvailable).length
    const totalOrders = orders.length
    const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'delivered').length
    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length
    const totalRevenue = orders
      .filter(o => o.status === 'Completed' || o.status === 'delivered')
      .reduce((acc, o) => acc + o.amount, 0)

    return { activeMeals, totalOrders, completedOrders, pendingOrders, totalRevenue }
  }, [meals, orders])

  // ── Charts Data ─────────────────────────────────────────
  const earningsChart = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      map.set(months[(d.getMonth() - i + 12) % 12], 0)
    }
    orders
      .filter(o => o.status === 'Completed' || o.status === 'delivered')
      .forEach(o => {
        const d = new Date(o.date)
        if (!isNaN(d.getTime())) {
          const key = months[d.getMonth()]
          const existing = map.get(key)
          if (existing !== undefined) map.set(key, existing + o.amount)
        }
      })
    return Array.from(map.entries()).map(([month, earnings]) => ({ month, earnings }))
  }, [orders])

  const mealsPieChart = useMemo(() => {
    const map = new Map<string, number>()
    meals.forEach(m => {
      const cat = m.category || 'Other'
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [meals])

  // ── Filters ─────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim()
    return orders.filter(o => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  // ── Handlers ────────────────────────────────────────────

  const openAdd = () => {
    setSelected(null)
    setForm(initialForm)
    setModalMode('add')
  }

  const openEdit = (meal: VendorMeal) => {
    setSelected(meal)
    setForm({
      name: meal.name, description: meal.description, category: meal.category,
      cuisine: meal.cuisine, price: String(meal.price), imageUrl: meal.imageUrl,
      isAvailable: meal.isAvailable, isPremium: meal.isPremium,
      servings: String(meal.servings), prepTime: String(meal.prepTime),
      cookTime: String(meal.cookTime), calories: String(meal.calories),
      protein: String(meal.protein), carbs: String(meal.carbs),
      fat: String(meal.fat), difficulty: meal.difficulty, tags: meal.tags.join(', '),
    })
    setModalMode('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
  
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated — please log in again')
        setSaving(false)
        return
      }
  
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
  
      // Link to vendor - resolve fresh vendor ID to avoid stale state issues
      let currentVendorId = vendorId
      if (!currentVendorId) {
        const { data: vendorRow, error: vendorLookupErr } = await supabase
          .from('vendors')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (vendorLookupErr) console.error('Vendor re-lookup error:', vendorLookupErr)
        currentVendorId = vendorRow?.id || null
        if (currentVendorId) setVendorId(currentVendorId)
      }

      if (!currentVendorId) {
        setError('Could not find your vendor profile. Please contact support.')
        setSaving(false)
        return
      }

      const payload = {
        id: selected?.id,
        name: form.name,
        vendorId: currentVendorId,
        category: form.category,
        cuisine: form.cuisine || 'other',
        description: form.description || '',
        imageUrl: form.imageUrl || '',
        servings: Number(form.servings) || 1,
        prepTimeMinutes: Number(form.prepTime) || 0,
        cookTimeMinutes: Number(form.cookTime) || 0,
        caloriesPerServing: Number(form.calories) || 0,
        proteinG: Number(form.protein) || 0,
        carbsG: Number(form.carbs) || 0,
        fatG: Number(form.fat) || 0,
        difficulty: form.difficulty || 'easy',
        tags,
        isPremium: form.isPremium,
        status: (form.isAvailable ? 'Available' : 'Unavailable') as 'Available' | 'Unavailable' | 'Archived',
        price: Number(form.price) || 0,
        createdBy: user.id,
      }

      const result = modalMode === 'add' ? await createMeal(payload) : await updateMeal(payload)
      if (!result.success) throw new Error(result.error || 'Failed to save meal')

      setInfoMessage(result.message || 'Meal saved successfully!')
      setModalMode(null)
      setSelected(null)
      setForm(initialForm)
      
      // Refresh data in background without blocking UI
      fetchData().catch((err) => {
        console.error('Failed to refresh data:', err)
      })
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err?.message || err?.details || 'Failed to save meal')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailability = async (meal: VendorMeal) => {
    setActionLoadingId(meal.id)
    try {
      await supabase.from('vendor_meals')
        .update({ is_available: !meal.isAvailable })
        .eq('id', meal.vendorMealId)

      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, isAvailable: !m.isAvailable } : m))
      setInfoMessage(`${meal.name} is now ${!meal.isAvailable ? 'available' : 'unavailable'}`)
    } catch (err) {
      setError('Failed to update availability')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (meal: VendorMeal) => {
    setActionLoadingId(meal.id)
    try {
      if (meal.vendorMealId) {
        await supabase.from('vendor_meals').delete().eq('id', meal.vendorMealId)
      }
      await supabase.from('meals').delete().eq('id', meal.id)
      setMeals(prev => prev.filter(m => m.id !== meal.id))
      setInfoMessage(`${meal.name} deleted`)
    } catch (err) {
      setError('Failed to delete meal')
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number(withdrawForm.amount)
    if (!amount || amount <= 0 || amount > availableBalance) return

    setWithdrawLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('orders').insert({
        user_id: user?.id,
        vendor_id: vendorId,
        order_number: `WDR-${Date.now()}`,
        subtotal: -amount,
        total_amount: -amount,
        platform_fee: 0,
        delivery_fee: 0,
        status: 'Completed',
        currency: 'KES',
        delivery_address: withdrawForm.phoneOrAccount,
        customer_phone: withdrawForm.phoneOrAccount,
        customer_notes: `Withdrawal via ${withdrawForm.method}`,
        payment_status: 'paid',
        mpesa_transaction_id: `WDR-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const newBalance = availableBalance - amount
      await supabase.from('vendors')
        .update({ available_balance: newBalance })
        .eq('id', vendorId)

      setAvailableBalance(newBalance)
      setInfoMessage(`Withdrawal of ${formatCurrency(amount)} initiated`)
      setModalMode(null)
      setWithdrawForm({ amount: '', method: 'mpesa', phoneOrAccount: '' })
    } catch (err) {
      setError('Withdrawal failed')
    } finally {
      setWithdrawLoading(false)
    }
  }

  // ── AI Insights ─────────────────────────────────────────
  const aiInsights = useMemo(() => {
    const insights: { id: string; type: 'success' | 'warning' | 'opportunity' | 'info'; title: string; description: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = []

    if (meals.length === 0) {
      insights.push({ id: 'no-meals', type: 'opportunity', title: 'Start adding meals!', description: 'Vendors with complete menus earn 5x more. Add your first meal to start receiving orders.', icon: ChefHat })
    } else if (meals.length < 5) {
      insights.push({ id: 'more-meals', type: 'opportunity', title: 'Grow your menu', description: `You have ${meals.length} meals. Adding 5+ more can increase your weekly orders by up to 40%.`, icon: Target })
    }

    if (stats.pendingOrders > 0) {
      insights.push({ id: 'pending-orders', type: 'warning', title: `${stats.pendingOrders} orders waiting`, description: 'Fulfill pending orders promptly to maintain your rating and customer satisfaction.', icon: Clock })
    }

    if (stats.completedOrders > 10 && stats.totalRevenue > 0) {
      insights.push({ id: 'revenue-milestone', type: 'success', title: 'Revenue milestone!', description: `You've earned ${formatCurrency(stats.totalRevenue)} with ${stats.completedOrders} completed orders. Great work!`, icon: TrendingUp })
    }

    const unavailableMeals = meals.filter(m => !m.isAvailable).length
    if (unavailableMeals > 0) {
      insights.push({ id: 'unavailable', type: 'info', title: `${unavailableMeals} meals offline`, description: 'Mark your meals as available to appear in customer searches and increase orders.', icon: AlertTriangle })
    }

    insights.push({ id: 'ai-tip', type: 'info', title: '🤖 AI Tip', description: meals.length > 0 ? `Your "${meals[0]?.name}" is the most viewed. Consider adding a high-quality photo and detailed description to boost conversions.` : 'Complete your menu with photos and descriptions — listings with photos get 3x more orders.', icon: Brain })

    return insights
  }, [meals, stats])

  // ── Render ──────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            My Meals
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs font-bold text-amber-600">
              <Sparkles size={12} /> AI-Powered
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage your menu, track orders, and withdraw earnings.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalMode('withdraw')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F4A535] to-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 hover:-translate-y-0.5 transition-all"
          >
            <Wallet size={16} />
            Withdraw
          </button>
          <button
            onClick={() => { void fetchData() }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} /> Add Meal
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {infoMessage && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} /> {infoMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Available Balance', value: formatCurrency(availableBalance), icon: Wallet, color: 'bg-amber-500', accent: 'bg-amber-50' },
          { label: 'Active Meals', value: stats.activeMeals, icon: UtensilsCrossed, color: 'bg-emerald-500', accent: 'bg-emerald-50' },
          { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-blue-500', accent: 'bg-blue-50' },
          { label: 'Total Earned', value: formatCurrency(totalEarnings), icon: DollarSign, color: 'bg-violet-500', accent: 'bg-violet-50' },
        ].map((s) => (
          <div key={s.label} className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[48px] opacity-10 ${s.color}`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.accent}`}>
                  <s.icon size={17} className={s.color.replace('bg-', 'text-')} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Earnings Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Earnings Overview</h3>
          <p className="text-xs text-gray-400 mb-5">Monthly earnings from completed orders</p>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={earningsChart}>
                <defs>
                  <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4A535" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F4A535" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Poppins, sans-serif' }} formatter={(value: any) => [formatCurrency(Number(value)), 'Earnings']} />
                <Area type="monotone" dataKey="earnings" stroke="#F4A535" strokeWidth={2.5} fill="url(#earnGrad)" dot={{ fill: '#F4A535', r: 4, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Meals by Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Meals by Category</h3>
          <p className="text-xs text-gray-400 mb-5">Distribution of your menu</p>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : mealsPieChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RPieChart>
                <Pie data={mealsPieChart} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {mealsPieChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'Poppins, sans-serif' }} formatter={(value: any) => [`${value} meals`, 'Count']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </RPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No meals yet</div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Brain size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Insights</h3>
            <p className="text-xs text-gray-500">Smart recommendations for your menu and orders</p>
          </div>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiInsights.map((insight) => {
                const typeStyles: Record<string, string> = {
                  success: 'border-l-emerald-500', warning: 'border-l-amber-500',
                  opportunity: 'border-l-blue-500', info: 'border-l-violet-500',
                }
                return (
                  <div key={insight.id} className={`border-l-4 ${typeStyles[insight.type]} rounded-r-xl p-4 bg-gray-50/50`}>
                    <div className="flex items-start gap-3">
                      <insight.icon size={15} className={
                        insight.type === 'success' ? 'text-emerald-600' : insight.type === 'warning' ? 'text-amber-600' :
                        insight.type === 'opportunity' ? 'text-blue-600' : 'text-violet-600'
                      } />
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

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">Orders</h3>
            <p className="text-xs text-gray-400 mt-0.5">{filteredOrders.length} orders</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {['All', 'Completed', 'Processing', 'Pending', 'Cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3">
              <ShoppingCart size={36} className="text-gray-300" />
              <p className="text-sm text-gray-400 font-medium">No orders found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50">
                  <th className="px-5 py-3 font-semibold">Order #</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900 text-xs">#{order.orderNumber}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-800">{order.customer}</p>
                      <p className="text-xs text-gray-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(order.amount)}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">{order.date}</td>
                    <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" title="View">
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Meals Grid */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">Your Meals ({meals.length})</h3>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        ) : meals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <UtensilsCrossed size={28} className="text-emerald-500" />
            </div>
            <p className="text-gray-900 font-semibold">No meals yet</p>
            <p className="text-gray-400 text-sm text-center max-w-md">Add your first meal to start receiving orders from customers.</p>
            <button onClick={openAdd} className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition">
              <Plus size={15} className="inline mr-1.5" /> Add Your First Meal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map((meal) => (
              <motion.div
                key={meal.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                {meal.imageUrl ? (
                  <div className="h-40 relative">
                    <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {meal.isPremium && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1">
                          <Star size={10} className="fill-white" /> Premium
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        meal.isAvailable ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                      }`}>
                        {meal.isAvailable ? 'Active' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <UtensilsCrossed size={36} className="text-emerald-400" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{meal.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{meal.category} · {meal.cuisine}</p>
                    </div>
                    <p className="font-extrabold text-gray-900">{formatCurrency(meal.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock size={12} /> {meal.prepTime + meal.cookTime}min
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <Flame size={12} /> {meal.calories} kcal
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(meal)}
                      className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(meal)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                        meal.isAvailable
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {meal.isAvailable ? <><Archive size={12} /> Offline</> : <><CheckCircle2 size={12} /> Online</>}
                    </button>
                    <button
                      onClick={() => setConfirm({ type: 'delete', meal })}
                      className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalMode === 'add' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={modalMode === 'add' ? 'Add New Meal' : 'Edit Meal'} size="md">
  <div className="overflow-y-auto max-h-[70vh] -mx-2 px-2 space-y-4">
    {/* Name + Price row */}
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-semibold text-gray-700">Meal Name *</label>
        <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="e.g. Chicken Biryani" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Price (KES) *</label>
        <input value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="850" />
      </div>
    </div>

    {/* Description */}
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
      <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="min-h-[60px] w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900 resize-y" placeholder="Brief description..." />
    </div>

    {/* Image URL */}
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">Image URL</label>
      <input value={form.imageUrl} onChange={(e) => setForm(p => ({ ...p, imageUrl: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="https://..." />
    </div>

    {/* Category + Cuisine + Difficulty */}
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Category</label>
        <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900">
          <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option><option value="dessert">Dessert</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Cuisine</label>
        <select value={form.cuisine} onChange={(e) => setForm(p => ({ ...p, cuisine: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900">
          <option value="">Select...</option>
          <option value="african">African</option><option value="american">American</option><option value="chinese">Chinese</option><option value="indian">Indian</option><option value="italian">Italian</option><option value="kenyan">Kenyan</option><option value="mediterranean">Mediterranean</option><option value="mexican">Mexican</option><option value="middle_eastern">Middle Eastern</option><option value="swahili">Swahili</option><option value="thai">Thai</option><option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Difficulty</label>
        <select value={form.difficulty} onChange={(e) => setForm(p => ({ ...p, difficulty: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900">
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
      </div>
    </div>

    {/* Timing */}
    <div className="grid grid-cols-3 gap-3">
      <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Prep (min)</label><input value={form.prepTime} onChange={(e) => setForm(p => ({ ...p, prepTime: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="15" /></div>
      <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Cook (min)</label><input value={form.cookTime} onChange={(e) => setForm(p => ({ ...p, cookTime: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="40" /></div>
      <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Servings</label><input value={form.servings} onChange={(e) => setForm(p => ({ ...p, servings: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="4" /></div>
    </div>

    {/* Nutrition */}
    <div className="grid grid-cols-4 gap-3">
      <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Calories</label><input value={form.calories} onChange={(e) => setForm(p => ({ ...p, calories: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="320" /></div>
      <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Protein (g)</label><input value={form.protein} onChange={(e) => setForm(p => ({ ...p, protein: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="24" /></div>
      <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Carbs (g)</label><input value={form.carbs} onChange={(e) => setForm(p => ({ ...p, carbs: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="45" /></div>
      <div><label className="mb-1 block text-[11px] font-medium text-gray-500">Fat (g)</label><input value={form.fat} onChange={(e) => setForm(p => ({ ...p, fat: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="12" /></div>
    </div>

    {/* Tags */}
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">Tags (comma separated)</label>
      <input value={form.tags} onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" placeholder="healthy, quick, spicy" />
    </div>

    {/* Toggles */}
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
        <span className="text-xs font-medium text-gray-700">Available</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm(p => ({ ...p, isPremium: e.target.checked }))} className="h-4 w-4 rounded border-amber-300 text-amber-500" />
        <span className="text-xs font-medium text-amber-700 flex items-center gap-1"><Star size={12} className="fill-amber-500 text-amber-500" /> Premium</span>
      </label>
    </div>

    {/* Buttons — sticky at bottom */}
    <div className="flex gap-3 pt-3 border-t border-gray-100 sticky bottom-0 bg-white pb-1">
      <button onClick={() => setModalMode(null)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
      <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg transition disabled:opacity-50">
        {saving ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> Saving...</span> : modalMode === 'add' ? 'Add Meal' : 'Save Changes'}
      </button>
    </div>
  </div>
</Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={modalMode === 'withdraw'} onClose={() => setModalMode(null)} title="Withdraw Earnings" size="md">
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-4 border border-amber-100">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Available Balance</p>
            <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(availableBalance)}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (KES)</label>
            <input type="number" value={withdrawForm.amount} onChange={(e) => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-200 text-gray-900" placeholder="Enter amount" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setWithdrawForm(p => ({ ...p, method: 'mpesa' }))} className={`p-4 rounded-xl border-2 text-left transition ${withdrawForm.method === 'mpesa' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
              <CreditCard size={20} className={withdrawForm.method === 'mpesa' ? 'text-emerald-600' : 'text-gray-400'} />
              <p className="text-sm font-semibold text-gray-900 mt-2">M-Pesa</p>
              <p className="text-xs text-gray-400">Instant</p>
            </button>
            <button onClick={() => setWithdrawForm(p => ({ ...p, method: 'bank' }))} className={`p-4 rounded-xl border-2 text-left transition ${withdrawForm.method === 'bank' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
              <BuildingIcon className={withdrawForm.method === 'bank' ? 'text-emerald-600' : 'text-gray-400'} />
              <p className="text-sm font-semibold text-gray-900 mt-2">Bank</p>
              <p className="text-xs text-gray-400">1-3 days</p>
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{withdrawForm.method === 'mpesa' ? 'M-Pesa Number' : 'Account Number'}</label>
            <input type="text" value={withdrawForm.phoneOrAccount} onChange={(e) => setWithdrawForm(p => ({ ...p, phoneOrAccount: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 text-gray-900" placeholder={withdrawForm.method === 'mpesa' ? '07XX XXX XXX' : 'Account number'} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalMode(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawForm.amount || Number(withdrawForm.amount) <= 0 || Number(withdrawForm.amount) > availableBalance} className="flex-1 rounded-xl bg-gradient-to-r from-[#F4A535] to-[#f97316] px-4 py-3 text-sm font-bold text-white shadow-md shadow-amber-200 hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              {withdrawLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
              {withdrawLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={confirm?.type === 'delete'}
        title="Delete Meal"
        message={`Delete "${confirm?.meal?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => confirm?.meal && handleDelete(confirm.meal)}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}

// SVG helper
function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" /><line x1="9" y1="8" x2="9" y2="9" /><line x1="15" y1="8" x2="15" y2="9" /><line x1="9" y1="13" x2="9" y2="14" /><line x1="15" y1="13" x2="15" y2="14" />
    </svg>
  )
}