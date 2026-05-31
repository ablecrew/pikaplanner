'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  Archive,
  Calendar,
  CheckCircle2,
  ChefHat,
  Clock,
  Download,
  Edit2,
  Eye,
  Flame,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Store,
  Tag,
  Trash2,
  UtensilsCrossed,
  X,
  TrendingUp,
  Layers,
  Sparkles,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createMeal, deleteMeal, setMealAvailability, updateMeal } from '@/app/actions/manageMeals'

type MealStatus = 'Available' | 'Unavailable' | 'Archived'

type MealRow = {
  id: string
  name: string
  slug: string
  description?: string | null
  category: string
  cuisine: string
  image_url?: string | null
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  servings: number
  calories_per_serving?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  difficulty?: string | null
  tags?: string[] | null
  is_premium: boolean
  is_active: boolean
  created_by?: string | null
  created_at?: string | null
}

type VendorMealRow = {
  id: string
  meal_id: string
  vendor_id: string
  price?: number | null
  is_available?: boolean | null
}

type VendorRow = {
  id: string
  business_name?: string | null
  name?: string | null
}

type MealRecord = {
  id: string
  name: string
  slug: string
  vendorId: string
  vendor: string
  category: string
  cuisine: string
  price: string
  description: string
  status: MealStatus
  createdAt: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  caloriesPerServing: number
  proteinG: number
  carbsG: number
  fatG: number
  difficulty: string
  tags: string[]
  isPremium: boolean
  imageUrl: string
  createdBy: string
  vendorMealId?: string
}

type ModalMode = 'view' | 'add' | 'edit' | null

type FormState = {
  name: string
  vendorId: string
  category: string
  cuisine: string
  price: string
  description: string
  status: MealStatus
  imageUrl: string
  prepTimeMinutes: string
  cookTimeMinutes: string
  servings: string
  caloriesPerServing: string
  proteinG: string
  carbsG: string
  fatG: string
  difficulty: string
  tags: string
  isPremium: boolean
}

const initialForm: FormState = {
  name: '',
  vendorId: '',
  category: 'lunch',
  cuisine: '',
  price: '',
  description: '',
  status: 'Available',
  imageUrl: '',
  prepTimeMinutes: '',
  cookTimeMinutes: '',
  servings: '1',
  caloriesPerServing: '',
  proteinG: '',
  carbsG: '',
  fatG: '',
  difficulty: 'easy',
  tags: '',
  isPremium: false,
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: MealStatus }) {
  const styles: Record<MealStatus, string> = {
    Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Unavailable: 'bg-amber-50 text-amber-700 border-amber-200',
    Archived: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  const dots: Record<MealStatus, string> = {
    Available: 'bg-emerald-500',
    Unavailable: 'bg-amber-500',
    Archived: 'bg-slate-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  )
}

function OverlayModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-white to-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <UtensilsCrossed size={15} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              </div>
              <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function ActionMenu({
  meal,
  onAction,
}: {
  meal: MealRecord
  onAction: (action: 'view' | 'edit' | 'available' | 'unavailable' | 'archive' | 'delete', meal: MealRecord) => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`rounded-xl border p-2 transition-all ${
          open
            ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
            : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600'
        }`}
      >
        <MoreHorizontal size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
          >
            <button onClick={() => { onAction('view', meal); setOpen(false) }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <Eye size={14} className="text-gray-400" /> View Details
            </button>
            <button onClick={() => { onAction('edit', meal); setOpen(false) }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <Edit2 size={14} className="text-gray-400" /> Edit Meal
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button onClick={() => { onAction('available', meal); setOpen(false) }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">
              <CheckCircle2 size={14} /> Mark Available
            </button>
            <button onClick={() => { onAction('unavailable', meal); setOpen(false) }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-amber-700 transition hover:bg-amber-50">
              <ChefHat size={14} /> Mark Unavailable
            </button>
            <button onClick={() => { onAction('archive', meal); setOpen(false) }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              <Archive size={14} /> Archive
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button onClick={() => { onAction('delete', meal); setOpen(false) }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50">
              <Trash2 size={14} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, accent }: {
  label: string; value: number; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; accent: string
}) {
  return (
    <div className="group relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[48px] opacity-10 ${color}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
            <Icon size={17} className={color.replace('bg-', 'text-')} />
          </div>
        </div>
        <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  )
}

export default function AdminMealsPage() {
  const supabase = createClient()

  const [meals, setMeals] = useState<MealRecord[]>([])
  const [vendors, setVendors] = useState<VendorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [cuisineFilter, setCuisineFilter] = useState('All')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<MealRecord | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchMeals = async () => {
    setLoading(true)
    setError(null)
    setInfoMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const [{ data: mealsData, error: mealsError }, { data: vendorMealsData, error: vendorMealsError }, { data: vendorsData, error: vendorsError }] = await Promise.all([
        supabase.from('meals').select('*').order('created_at', { ascending: false }),
        supabase.from('vendor_meals').select('*'),
        supabase.from('vendors').select('*'),
      ])

      if (mealsError) throw mealsError
      if (vendorMealsError) throw vendorMealsError
      if (vendorsError) throw vendorsError

      const vendorMap = new Map(((vendorsData ?? []) as VendorRow[]).map((vendor) => [vendor.id, vendor]))
      setVendors((vendorsData ?? []) as VendorRow[])

      const vendorMealMap = new Map<string, VendorMealRow>()
      ;((vendorMealsData ?? []) as VendorMealRow[]).forEach((entry) => {
        if (!vendorMealMap.has(entry.meal_id)) {
          vendorMealMap.set(entry.meal_id, entry)
        }
      })

      const mapped: MealRecord[] = ((mealsData ?? []) as MealRow[]).map((meal) => {
        const vendorMeal = vendorMealMap.get(meal.id)
        const vendor = vendorMeal ? vendorMap.get(vendorMeal.vendor_id) : null

        let status: MealStatus = 'Available'
        if (!meal.is_active) status = 'Archived'
        else if (vendorMeal && vendorMeal.is_available === false) status = 'Unavailable'

        return {
          id: meal.id,
          name: meal.name,
          slug: meal.slug,
          vendorId: vendorMeal?.vendor_id || '',
          vendor: vendor?.business_name || 'No vendor linked',
          category: meal.category,
          cuisine: meal.cuisine,
          price: vendorMeal?.price != null ? `KES ${vendorMeal.price}` : '—',
          description: meal.description || '',
          status,
          createdAt: formatDate(meal.created_at),
          prepTimeMinutes: meal.prep_time_minutes || 0,
          cookTimeMinutes: meal.cook_time_minutes || 0,
          servings: meal.servings,
          caloriesPerServing: meal.calories_per_serving || 0,
          proteinG: meal.protein_g || 0,
          carbsG: meal.carbs_g || 0,
          fatG: meal.fat_g || 0,
          difficulty: meal.difficulty || 'easy',
          tags: meal.tags || [],
          isPremium: meal.is_premium,
          imageUrl: meal.image_url || '',
          createdBy: meal.created_by || '',
          vendorMealId: vendorMeal?.id,
        }
      })

      setMeals(mapped)
    } catch (err) {
      console.error('Failed to fetch meals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load meals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchMeals()
  }, [])

  const categories = useMemo(() => ['All', ...Array.from(new Set(meals.map((m) => m.category))).sort()], [meals])
  const cuisines = useMemo(() => ['All', ...Array.from(new Set(meals.map((m) => m.cuisine))).sort()], [meals])

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    return meals.filter((meal) => {
      const matchSearch =
        meal.name.toLowerCase().includes(query) ||
        meal.vendor.toLowerCase().includes(query) ||
        meal.cuisine.toLowerCase().includes(query) ||
        meal.tags.some(t => t.toLowerCase().includes(query))
      const matchCategory = categoryFilter === 'All' || meal.category === categoryFilter
      const matchCuisine = cuisineFilter === 'All' || meal.cuisine === cuisineFilter
      return matchSearch && matchCategory && matchCuisine
    })
  }, [meals, search, categoryFilter, cuisineFilter])

  const stats = useMemo(() => [
    { label: 'Total Meals', value: meals.length, icon: Layers, color: 'bg-violet-500', accent: 'bg-violet-50' },
    { label: 'Available', value: meals.filter((m) => m.status === 'Available').length, icon: CheckCircle2, color: 'bg-emerald-500', accent: 'bg-emerald-50' },
    { label: 'Unavailable', value: meals.filter((m) => m.status === 'Unavailable').length, icon: Clock, color: 'bg-amber-500', accent: 'bg-amber-50' },
    { label: 'Premium', value: meals.filter((m) => m.isPremium).length, icon: Star, color: 'bg-orange-500', accent: 'bg-orange-50' },
  ], [meals])

  const openAdd = () => {
    setSelected(null)
    setForm(initialForm)
    setModalMode('add')
  }

  const openEdit = (meal: MealRecord) => {
    setSelected(meal)
    setForm({
      name: meal.name,
      vendorId: meal.vendorId,
      category: meal.category,
      cuisine: meal.cuisine,
      price: meal.price === '—' ? '' : meal.price.replace('KES ', ''),
      description: meal.description,
      status: meal.status,
      imageUrl: meal.imageUrl,
      prepTimeMinutes: String(meal.prepTimeMinutes || ''),
      cookTimeMinutes: String(meal.cookTimeMinutes || ''),
      servings: String(meal.servings || 1),
      caloriesPerServing: String(meal.caloriesPerServing || ''),
      proteinG: String(meal.proteinG || ''),
      carbsG: String(meal.carbsG || ''),
      fatG: String(meal.fatG || ''),
      difficulty: meal.difficulty || 'easy',
      tags: meal.tags.join(', '),
      isPremium: meal.isPremium,
    })
    setModalMode('edit')
  }

  const openView = (meal: MealRecord) => {
    setSelected(meal)
    setModalMode('view')
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setInfoMessage(null)

    try {
      const payload = {
        id: selected?.id,
        name: form.name,
        vendorId: form.vendorId || undefined,
        category: form.category,
        cuisine: form.cuisine,
        description: form.description,
        imageUrl: form.imageUrl,
        servings: Number(form.servings || 1),
        prepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : undefined,
        cookTimeMinutes: form.cookTimeMinutes ? Number(form.cookTimeMinutes) : undefined,
        caloriesPerServing: form.caloriesPerServing ? Number(form.caloriesPerServing) : undefined,
        proteinG: form.proteinG ? Number(form.proteinG) : undefined,
        carbsG: form.carbsG ? Number(form.carbsG) : undefined,
        fatG: form.fatG ? Number(form.fatG) : undefined,
        difficulty: form.difficulty,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        isPremium: form.isPremium,
        status: form.status,
        price: form.price ? Number(form.price) : undefined,
        createdBy: currentUserId || undefined,
      }

      const result = modalMode === 'add' ? await createMeal(payload) : await updateMeal(payload)
      if (!result.success) throw new Error(result.error || 'Failed to save meal')

      setInfoMessage(result.message || 'Meal saved successfully.')
      setModalMode(null)
      setSelected(null)
      setForm(initialForm)
      await fetchMeals()
    } catch (err) {
      console.error('Save failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save meal')
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (action: 'view' | 'edit' | 'available' | 'unavailable' | 'archive' | 'delete', meal: MealRecord) => {
    if (action === 'view') { openView(meal); return }
    if (action === 'edit') { openEdit(meal); return }

    setActionLoadingId(meal.id)
    setError(null)
    setInfoMessage(null)

    try {
      if (action === 'available') {
        const result = await setMealAvailability(meal.id, 'Available')
        if (!result.success) throw new Error(result.error || 'Failed to mark meal available')
        setInfoMessage(`${meal.name} is now available.`)
      }
      if (action === 'unavailable') {
        const result = await setMealAvailability(meal.id, 'Unavailable')
        if (!result.success) throw new Error(result.error || 'Failed to mark meal unavailable')
        setInfoMessage(`${meal.name} is now unavailable.`)
      }
      if (action === 'archive') {
        const result = await setMealAvailability(meal.id, 'Archived')
        if (!result.success) throw new Error(result.error || 'Failed to archive meal')
        setInfoMessage(`${meal.name} has been archived.`)
      }
      if (action === 'delete') {
        const confirmed = window.confirm(`Delete ${meal.name}? This action cannot be undone.`)
        if (!confirmed) { setActionLoadingId(null); return }
        const result = await deleteMeal(meal.id)
        if (!result.success) throw new Error(result.error || 'Failed to delete meal')
        setInfoMessage(`${meal.name} has been deleted.`)
      }
      await fetchMeals()
    } catch (err) {
      console.error('Meal action failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to perform action')
    } finally {
      setActionLoadingId(null)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['ID', 'Name', 'Vendor', 'Category', 'Cuisine', 'Price', 'Status', 'Added'],
      ...filtered.map((meal) => [meal.id, meal.name, meal.vendor, meal.category, meal.cuisine, meal.price, meal.status, meal.createdAt]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = 'admin-meals.csv'
    document.body.appendChild(link); link.click()
    document.body.removeChild(link); URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Meals</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your meal catalog — add, edit, and track vendor items.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void fetchMeals()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
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
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        {infoMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} /> {infoMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-white to-gray-50/50">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meals, tags, cuisine..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Category</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  categoryFilter === category
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {cuisines.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Cuisines' : c}</option>
              ))}
            </select>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              <Download size={15} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50">
                <th className="px-5 py-3.5 font-semibold">Meal</th>
                <th className="px-5 py-3.5 font-semibold">Vendor</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Cuisine</th>
                <th className="px-5 py-3.5 font-semibold">Price</th>
                <th className="px-5 py-3.5 font-semibold">Added</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={28} className="animate-spin text-emerald-500" />
                      <p className="text-sm text-gray-400 font-medium">Loading meals...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <UtensilsCrossed size={28} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">No meals found</p>
                      <button onClick={openAdd} className="text-sm text-emerald-600 font-semibold hover:underline">
                        + Add your first meal
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((meal, index) => (
                  <motion.tr
                    key={meal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-t border-gray-50 transition-colors hover:bg-gray-50/50 group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {meal.imageUrl ? (
                          <div className="relative">
                            <img
                              src={meal.imageUrl}
                              alt={meal.name}
                              className="h-11 w-11 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-emerald-200 transition-all"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                            <div className="hidden h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                              <UtensilsCrossed size={16} className="text-emerald-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-50">
                            <UtensilsCrossed size={16} className="text-emerald-500" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900">{meal.name}</p>
                            {meal.isPremium && (
                              <Star size={12} className="text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <p className="max-w-[220px] truncate text-xs text-gray-400 mt-0.5">{meal.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                        <Store size={13} className="text-gray-400" />
                        {meal.vendor}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-600 capitalize">
                        {meal.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 font-medium capitalize">{meal.cuisine}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">{meal.price}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{meal.createdAt}</td>
                    <td className="px-5 py-4"><StatusBadge status={meal.status} /></td>
                    <td className="px-5 py-4">
                      <ActionMenu meal={meal} onAction={handleAction} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <OverlayModal
        open={modalMode === 'add' || modalMode === 'edit'}
        title={modalMode === 'add' ? 'Add New Meal' : 'Edit Meal'}
        onClose={() => setModalMode(null)}
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Meal Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
              placeholder="e.g. Chicken Biryani"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-[90px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition resize-y text-gray-900"
              placeholder="Brief description of the meal..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Image URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
              placeholder="https://..."
            />
            {form.imageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 h-32">
                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Vendor</label>
              <select
                value={form.vendorId}
                onChange={(e) => setForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
              >
                <option value="">No vendor linked</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.business_name || vendor.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Price (KES)</label>
              <input
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
                placeholder="850"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Cuisine</label>
              <select
                value={form.cuisine}
                onChange={(e) => setForm((prev) => ({ ...prev, cuisine: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
              >
                <option value="">Select cuisine...</option>
                <option value="african">African</option>
                <option value="american">American</option>
                <option value="chinese">Chinese</option>
                <option value="french">French</option>
                <option value="healthy">Healthy</option>
                <option value="indian">Indian</option>
                <option value="italian">Italian</option>
                <option value="japanese">Japanese</option>
                <option value="kenyan">Kenyan</option>
                <option value="korean">Korean</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="mexican">Mexican</option>
                <option value="middle_eastern">Middle Eastern</option>
                <option value="occasion">Occasion</option>
                <option value="other">Other</option>
                <option value="swahili">Swahili</option>
                <option value="thai">Thai</option>
              </select>
            </div>
          </div>

          <fieldset className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 text-gray-900">
            <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Clock size={12} /> Timing & Servings
            </legend>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Prep (min)</label>
                <input value={form.prepTimeMinutes} onChange={(e) => setForm((prev) => ({ ...prev, prepTimeMinutes: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" placeholder="15" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Cook (min)</label>
                <input value={form.cookTimeMinutes} onChange={(e) => setForm((prev) => ({ ...prev, cookTimeMinutes: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" placeholder="40" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Servings</label>
                <input value={form.servings} onChange={(e) => setForm((prev) => ({ ...prev, servings: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" placeholder="4" />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 text-gray-900">
            <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Flame size={12} /> Nutrition (per serving)
            </legend>
            <div className="grid grid-cols-4 gap-4 mt-2 text-gray-900">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Calories</label>
                <input value={form.caloriesPerServing} onChange={(e) => setForm((prev) => ({ ...prev, caloriesPerServing: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" placeholder="320" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Protein (g)</label>
                <input value={form.proteinG} onChange={(e) => setForm((prev) => ({ ...prev, proteinG: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" placeholder="24" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Carbs (g)</label>
                <input value={form.carbsG} onChange={(e) => setForm((prev) => ({ ...prev, carbsG: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" placeholder="45" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Fat (g)</label>
                <input value={form.fatG} onChange={(e) => setForm((prev) => ({ ...prev, fatG: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" placeholder="12" />
              </div>
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4 text-gray-900">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">Status</label>
              <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as MealStatus }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition">
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tags (comma separated)</label>
            <input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900" placeholder="healthy, quick, vegetarian, spicy" />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3.5 cursor-pointer hover:border-amber-300 transition">
            <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm((prev) => ({ ...prev, isPremium: e.target.checked }))} className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400" />
            <div>
              <span className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                <Star size={14} className="fill-amber-500 text-amber-500" /> Premium Meal
              </span>
              <p className="text-xs text-amber-600 mt-0.5">Featured placement, priority listing, and premium badge</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalMode(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving || !form.name}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving...</span>
              ) : modalMode === 'add' ? (
                'Add Meal'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </OverlayModal>

      {/* View Modal */}
      <OverlayModal open={modalMode === 'view'} title="Meal Details" onClose={() => setModalMode(null)}>
        {selected && (
          <div className="space-y-6">
            {selected.imageUrl && (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={selected.imageUrl} alt={selected.name} className="w-full h-52 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{selected.name}</h3>
                </div>
              </div>
            )}

            {!selected.imageUrl && (
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
              </div>
            )}

            {selected.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selected.status} />
              {selected.isPremium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                  <Star size={11} className="fill-amber-500 text-amber-500" /> Premium
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 capitalize">
                {selected.difficulty}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-5">
              {[
                ['Category', selected.category],
                ['Cuisine', selected.cuisine],
                ['Difficulty', selected.difficulty],
                ['Price', selected.price],
                ['Vendor', selected.vendor],
                ['Added', selected.createdAt],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="mb-0.5 text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{String(value)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-5">
              {[
                ['Prep Time', `${selected.prepTimeMinutes} min`],
                ['Cook Time', `${selected.cookTimeMinutes} min`],
                ['Servings', String(selected.servings)],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="mb-0.5 text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-5">
              <p className="mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Flame size={12} /> Nutrition (per serving)
              </p>
              <div className="grid grid-cols-4 gap-4">
                {[
                  ['Calories', `${selected.caloriesPerServing}`],
                  ['Protein', `${selected.proteinG}g`],
                  ['Carbs', `${selected.carbsG}g`],
                  ['Fat', `${selected.fatG}g`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="text-center">
                    <p className="text-lg font-extrabold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {selected.tags.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-300 font-mono">ID: {selected.id}</p>
          </div>
        )}
      </OverlayModal>
    </motion.div>
  )
}