'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  X,
  Clock,
  Flame,
  Star,
  ChefHat,
  Truck,
  Sparkles,
  Loader2,
  RefreshCw,
  Leaf,
  Zap,
  Globe,
  BookOpen,
  UtensilsCrossed,
  Filter,
  Crown,
  AlertCircle,
  SlidersHorizontal,
  Tag,
  Eye,
  ArrowUpRight,
  MapPin,
  ArrowRight,
  CakeSlice,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

type DataRow = Record<string, unknown>

type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
type SortMode = 'recommended' | 'price_low' | 'price_high' | 'calories_low' | 'quickest'

type MealRow = {
  id: string
  name: string
  description: string
  image_url: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  calories_per_serving: number | null
  cuisine: string | null
  cuisine_types?: string[] | null
  category: string | null
  meal_type: string | null
  tags?: string[] | null
  dietary_tags?: string[] | null
  difficulty?: string | null
  is_premium?: boolean | null
}

type VendorMealRow = {
  id: string
  meal_id: string
  vendor_id: string
  price: number | null
  is_available: boolean | null
}

type VendorRow = {
  id: string
  business_name?: string | null
  name?: string | null
  location?: string | null
  location_city?: string | null
  address?: string | null
  service_area?: string | null
  rating?: number | null
  is_active?: boolean | null
}

type ProfileRow = {
  dietary_preferences?: string[] | null
  allergies?: string[] | null
  cuisine_preferences?: string[] | null
  meal_types?: string[] | null
  budget_range?: string | null
  location?: string | null
  location_city?: string | null
}

type EnrichedMeal = MealRow & {
  vendorOffers: Array<VendorMealRow & { vendor?: VendorRow | null }>
  minPrice: number | null
  score: number
}

const BASE_CUISINES = [
  'all',
  'kenyan',
  'swahili',
  'east african',
  'west african',
  'ethiopian',
  'indian',
  'chinese',
  'italian',
  'mexican',
  'japanese',
  'thai',
  'mediterranean',
  'american',
  'middle eastern',
  'french',
  'fusion',
  'healthy',
  'occasion',
]

const CATEGORY_OPTIONS: { value: MealCategory | 'all'; label: string; icon: typeof UtensilsCrossed; color: string; bg: string }[] = [
  { value: 'all', label: 'All Meals', icon: UtensilsCrossed, color: '#126e3d', bg: '#f0fdf4' },
  { value: 'breakfast', label: 'Breakfast', icon: Zap, color: '#ea580c', bg: '#fff7ed' },
  { value: 'lunch', label: 'Lunch', icon: Globe, color: '#0284c7', bg: '#f0f9ff' },
  { value: 'dinner', label: 'Dinner', icon: BookOpen, color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'snack', label: 'Snacks', icon: Leaf, color: '#059669', bg: '#ecfdf5' },
  { value: 'dessert', label: 'Dessert', icon: CakeSlice, color: '#F8FAFC', bg: '#F8FAFC' },
]

const TAG_OPTIONS = ['vegetarian', 'vegan', 'high-protein', 'traditional', 'healthy', 'gluten-free', 'quick']

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low', label: 'Lowest price' },
  { value: 'price_high', label: 'Highest price' },
  { value: 'calories_low', label: 'Lowest calories' },
  { value: 'quickest', label: 'Quickest meals' },
]

const DIFF_CONFIG = {
  easy: { label: 'Easy', color: '#059669', bg: '#d1fae5' },
  medium: { label: 'Medium', color: '#d97706', bg: '#fef3c7' },
  hard: { label: 'Hard', color: '#dc2626', bg: '#fee2e2' },
} as const

const CATEGORY_COLORS: Record<string, { gradient: string; accent: string; badge: string; badgeBg: string }> = {
  breakfast: {
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    accent: '#f59e0b',
    badge: '#92400e',
    badgeBg: '#fef3c7',
  },
  lunch: {
    gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    accent: '#2563eb',
    badge: '#1e40af',
    badgeBg: '#dbeafe',
  },
  dinner: {
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    accent: '#7c3aed',
    badge: '#5b21b6',
    badgeBg: '#ede9fe',
  },
  snack: {
    gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    accent: '#059669',
    badge: '#064e3b',
    badgeBg: '#d1fae5',
  },
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').toLowerCase().trim()
}

function formatCuisineLabel(value: string) {
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getBudgetCeiling(budget?: string | null) {
  if (!budget) return 0
  if (budget.includes('under-500')) return 500
  if (budget.includes('500-1000')) return 1000
  if (budget.includes('1000-2000')) return 2000
  if (budget.includes('above-2000')) return 999999
  return 0
}

function matchesAny(source: string[], targets: string[]) {
  if (targets.length === 0) return false
  return source.some((item) => targets.some((target) => item.includes(target) || target.includes(item)))
}

function computeMealScore(meal: MealRow, profile: ProfileRow | null, minPrice: number | null) {
  if (!profile) return 0

  const diet = (profile.dietary_preferences ?? []).map((item) => item.toLowerCase())
  const cuisinePrefs = (profile.cuisine_preferences ?? []).map((item) => item.toLowerCase())
  const mealTypes = (profile.meal_types ?? []).map((item) => item.toLowerCase())
  const allergies = (profile.allergies ?? []).map((item) => item.toLowerCase()).filter((item) => item !== 'none')
  const budgetCeiling = getBudgetCeiling(profile.budget_range)

  const mealTags = [
    ...(meal.tags ?? []).map((item) => item.toLowerCase()),
    ...(meal.dietary_tags ?? []).map((item) => item.toLowerCase()),
    ...(meal.cuisine_types ?? []).map((item) => item.toLowerCase()),
    normalizeText(meal.cuisine),
    normalizeText(meal.category),
    normalizeText(meal.meal_type),
  ].filter(Boolean)

  let score = 0
  if (matchesAny(mealTags, diet)) score += 3
  if (matchesAny(mealTags, cuisinePrefs)) score += 2
  if (matchesAny(mealTags, mealTypes)) score += 2
  if (budgetCeiling > 0 && minPrice !== null && minPrice <= budgetCeiling) score += 2
  if ((meal.calories_per_serving ?? 0) > 0 && (meal.calories_per_serving ?? 0) <= 600) score += 1
  if (((meal.prep_time_minutes ?? 0) + (meal.cook_time_minutes ?? 0)) <= 30) score += 1
  if (!matchesAny(mealTags, allergies)) score += 1
  return score
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.1] hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white shadow-lg">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-black text-white">{value}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
        </div>
      </div>
    </div>
  )
}

function MealCard({ meal, onOpenDetail }: { meal: EnrichedMeal; onOpenDetail: (meal: EnrichedMeal) => void }) {
  const [imgErr, setImgErr] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const availableVendors = meal.vendorOffers.filter((vm) => vm.is_available)
  const category = (meal.category || meal.meal_type || '').toLowerCase()
  const colors = CATEGORY_COLORS[category] || {
    gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    accent: '#059669',
    badge: '#064e3b',
    badgeBg: '#f0fdf4',
  }

  return (
    <div
      onClick={() => onOpenDetail(meal)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative h-52 flex-shrink-0 overflow-hidden" style={{ background: colors.gradient }}>
        {meal.image_url && !imgErr ? (
          <Image
            src={meal.image_url}
            alt={meal.name}
            fill
            className={`object-cover transition-all duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
            onError={() => setImgErr(true)}
            sizes="(max-width: 640px) 90vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UtensilsCrossed size={48} className="text-white/40" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {meal.is_premium && (
            <span
              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-white shadow-lg backdrop-blur-md"
              style={{ background: 'linear-gradient(135deg, #F4A535 0%, #ea580c 100%)' }}
            >
              <Crown size={10} className="fill-white" /> PREMIUM
            </span>
          )}
          {meal.difficulty && DIFF_CONFIG[meal.difficulty as keyof typeof DIFF_CONFIG] && (
            <span
              className="rounded-xl px-2.5 py-1.5 text-[10px] font-black text-white shadow-lg backdrop-blur-md"
              style={{
                color: DIFF_CONFIG[meal.difficulty as keyof typeof DIFF_CONFIG].color,
                background: DIFF_CONFIG[meal.difficulty as keyof typeof DIFF_CONFIG].bg,
              }}
            >
              {DIFF_CONFIG[meal.difficulty as keyof typeof DIFF_CONFIG].label}
            </span>
          )}
        </div>

        {/* Vendor Badge */}
        {availableVendors.length > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-white shadow-lg backdrop-blur-md bg-emerald-600/90">
            <Truck size={10} /> {availableVendors.length} vendor{availableVendors.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Match Score Badge */}
        {meal.score > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-white shadow-lg backdrop-blur-md" style={{ background: `${colors.accent}ee` }}>
            <Sparkles size={10} /> {meal.score} match
          </div>
        )}

        {/* Quick View Button on Hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="rounded-2xl bg-white/95 px-5 py-3 text-sm font-black text-gray-900 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Eye size={16} /> Quick View
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative flex flex-1 flex-col p-5">
        {/* Category Indicator */}
        <div className="absolute -top-3 right-5">
          <div className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg" style={{ background: colors.accent }}>
            {category || 'Meal'}
          </div>
        </div>

        <h3 className="line-clamp-1 text-lg font-black leading-tight text-gray-900">{meal.name}</h3>

        {meal.description && (
          <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-gray-500">{meal.description}</p>
        )}

        {/* Stats Row */}
        <div className="mb-4 flex items-center gap-4">
          {meal.calories_per_serving && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                <Flame size={14} className="text-orange-500" />
              </div>
              <span className="text-xs font-bold text-gray-700">{meal.calories_per_serving} kcal</span>
            </div>
          )}
          {((meal.prep_time_minutes || 0) + (meal.cook_time_minutes || 0)) > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <Clock size={14} className="text-blue-500" />
              </div>
              <span className="text-xs font-bold text-gray-700">{(meal.prep_time_minutes || 0) + (meal.cook_time_minutes || 0)} min</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {meal.tags && meal.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {meal.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-lg px-2.5 py-1 text-[10px] font-bold" style={{ color: colors.badge, background: colors.badgeBg }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
          {meal.minPrice !== null ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">From</p>
              <p className="text-xl font-black" style={{ color: colors.accent }}>KES {meal.minPrice}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <ChefHat size={16} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-500">Cook at home</span>
            </div>
          )}

          <button
            onClick={(event) => {
              event.stopPropagation()
              onOpenDetail(meal)
            }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white transition-all duration-300 hover:gap-3 hover:shadow-lg"
            style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accent}dd 100%)` }}
          >
            View <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MealDetailModal({
  meal,
  onClose,
}: {
  meal: EnrichedMeal | null
  onClose: () => void
}) {
  if (!meal) return null

  const category = (meal.category || meal.meal_type || '').toLowerCase()
  const colors = CATEGORY_COLORS[category] || {
    gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    accent: '#059669',
    badge: '#064e3b',
    badgeBg: '#f0fdf4',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header Image */}
        <div className="relative h-64 overflow-hidden" style={{ background: colors.gradient }}>
          {meal.image_url ? (
            <Image src={meal.image_url} alt={meal.name} fill className="object-cover" sizes="100vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="h-16 w-16 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl bg-white/90 p-2 text-gray-700 shadow-lg backdrop-blur-md transition hover:bg-white"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-4 left-6">
            <div className="rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white" style={{ background: colors.accent }}>
              {category || 'Meal'}
            </div>
            <h2 className="mt-2 text-2xl font-black text-white">{meal.name}</h2>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm leading-relaxed text-gray-600">{meal.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
              <Flame size={20} className="mx-auto mb-2 text-orange-500" />
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Calories</p>
              <p className="mt-1 text-lg font-black text-gray-900">{meal.calories_per_serving ?? 'N/A'} kcal</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
              <Clock size={20} className="mx-auto mb-2 text-blue-500" />
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Cooking time</p>
              <p className="mt-1 text-lg font-black text-gray-900">{(meal.prep_time_minutes || 0) + (meal.cook_time_minutes || 0)} min</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
              <Globe size={20} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Cuisine</p>
              <p className="mt-1 text-lg font-black text-gray-900">{meal.cuisine || 'Mixed'}</p>
            </div>
          </div>

          {meal.vendorOffers.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-gray-700">Available vendor offers</h3>
              <div className="space-y-3">
                {meal.vendorOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-emerald-200 hover:shadow-md">
                    <div>
                      <p className="text-sm font-black text-gray-900">{offer.vendor?.business_name || offer.vendor?.name || 'Vendor'}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-500">
                        <MapPin size={12} /> {offer.vendor?.location_city || offer.vendor?.location || offer.vendor?.service_area || 'Location not listed'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-700">KES {offer.price ?? 0}</p>
                      <p className={`mt-1 text-[10px] font-bold uppercase ${offer.is_available ? 'text-emerald-600' : 'text-red-500'}`}>
                        {offer.is_available ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/meal-generator"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Add to Plan <ArrowRight size={16} />
            </Link>
            <Link
              href="/recipes"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-5 py-3.5 text-sm font-black text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Browse Recipes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const supabase = useMemo(() => createClient(), [])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [cuisine, setCuisine] = useState<string>('all')
  const [category, setCategory] = useState<MealCategory | 'all'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<EnrichedMeal | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('recommended')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meals, setMeals] = useState<EnrichedMeal[]>([])
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [vendorPermissionWarning, setVendorPermissionWarning] = useState<string | null>(null)

  const fetchDiscoverData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setVendorPermissionWarning(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let profileData: ProfileRow | null = null
      if (user?.id) {
        const { data: fetchedProfile } = await supabase
          .from('profiles')
          .select('dietary_preferences, allergies, cuisine_preferences, meal_types, budget_range, location, location_city')
          .eq('id', user.id)
          .maybeSingle()
        profileData = (fetchedProfile as ProfileRow | null) ?? null
        setProfile(profileData)
      }

      const { data: mealsData, error: mealsError } = await supabase.from('meals').select('*').limit(100)
      if (mealsError) throw mealsError

      const { data: vendorMealsData, error: vendorMealsError } = await supabase.from('vendor_meals').select('*').limit(200)
      if (vendorMealsError) {
        setVendorPermissionWarning(vendorMealsError.message)
      }

      const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('*').limit(100)
      if (vendorsError) {
        console.error('Vendors fetch warning:', vendorsError)
      }

      const vendors = ((vendorsData ?? []) as VendorRow[])
      const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor]))
      const vendorMeals = ((vendorMealsData ?? []) as VendorMealRow[])
      const groupedVendorMeals = vendorMeals.reduce<Record<string, Array<VendorMealRow & { vendor?: VendorRow | null }>>>((acc, item) => {
        const mealId = item.meal_id
        acc[mealId] = [
          ...(acc[mealId] ?? []),
          {
            ...item,
            vendor: vendorMap.get(item.vendor_id) ?? null,
          },
        ]
        return acc
      }, {})

      const enrichedMeals = ((mealsData ?? []) as MealRow[]).map((meal) => {
        const offers = groupedVendorMeals[meal.id] ?? []
        const minPrice = offers.length > 0 ? Math.min(...offers.map((offer) => offer.price ?? 0).filter((price) => price > 0)) : null
        return {
          ...meal,
          vendorOffers: offers,
          minPrice,
          score: computeMealScore(meal, profileData, minPrice),
        }
      })

      setMeals(enrichedMeals)
    } catch (err) {
      console.error('Discover fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to load meals')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchDiscoverData()
  }, [fetchDiscoverData])

  const availableCuisines = useMemo(() => {
    const fromMeals = meals.flatMap((meal) => {
      const fromTypes = (meal.cuisine_types ?? []).map((item) => normalizeText(item))
      const main = normalizeText(meal.cuisine)
      return [...fromTypes, main].filter(Boolean)
    })

    return Array.from(new Set([...BASE_CUISINES, ...fromMeals])).filter(Boolean)
  }, [meals])

  const filteredMeals = useMemo(() => {
    const normalizedSearch = normalizeText(search)
    const activeTags = selectedTags.map((tag) => tag.toLowerCase())

    let next = meals.filter((meal) => {
      const searchableText = [meal.name, meal.description, meal.cuisine, ...(meal.tags ?? []), ...(meal.dietary_tags ?? []), ...(meal.cuisine_types ?? [])]
        .join(' ')
        .toLowerCase()

      const mealCategory = normalizeText(meal.category || meal.meal_type)
      const mealCuisineValues = [normalizeText(meal.cuisine), ...(meal.cuisine_types ?? []).map((item) => normalizeText(item))].filter(Boolean)
      const mealTags = [
        ...(meal.tags ?? []).map((item) => item.toLowerCase()),
        ...(meal.dietary_tags ?? []).map((item) => item.toLowerCase()),
      ]

      const searchMatch = !normalizedSearch || searchableText.includes(normalizedSearch)
      const cuisineMatch = cuisine === 'all' || mealCuisineValues.some((value) => value.includes(cuisine) || cuisine.includes(value))
      const categoryMatch = category === 'all' || mealCategory.includes(category)
      const tagsMatch = activeTags.length === 0 || activeTags.every((tag) => mealTags.some((value) => value.includes(tag) || tag.includes(value)))

      return searchMatch && cuisineMatch && categoryMatch && tagsMatch
    })

    next = [...next].sort((a, b) => {
      if (sortMode === 'price_low') return (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER)
      if (sortMode === 'price_high') return (b.minPrice ?? 0) - (a.minPrice ?? 0)
      if (sortMode === 'calories_low') return (a.calories_per_serving ?? Number.MAX_SAFE_INTEGER) - (b.calories_per_serving ?? Number.MAX_SAFE_INTEGER)
      if (sortMode === 'quickest') {
        const aTime = (a.prep_time_minutes ?? 0) + (a.cook_time_minutes ?? 0)
        const bTime = (b.prep_time_minutes ?? 0) + (b.cook_time_minutes || 0)
        return aTime - bTime
      }
      return b.score - a.score
    })

    return next
  }, [meals, search, cuisine, category, selectedTags, sortMode])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setSearch(searchInput.trim())
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]))
  }

  const clearAllFilters = () => {
    setSearch('')
    setSearchInput('')
    setCuisine('all')
    setCategory('all')
    setSelectedTags([])
    setSortMode('recommended')
  }

  const activeFiltersCount = [
    cuisine !== 'all',
    category !== 'all',
    selectedTags.length > 0,
    search !== '',
    sortMode !== 'recommended',
  ].filter(Boolean).length

  const stats = useMemo(() => {
    const vendorMealsCount = meals.filter((meal) => meal.vendorOffers.length > 0).length
    const premiumCount = meals.filter((meal) => meal.is_premium).length
    const quickCount = meals.filter((meal) => ((meal.prep_time_minutes ?? 0) + (meal.cook_time_minutes ?? 0)) <= 30).length
    return { total: meals.length, vendorMealsCount, premiumCount, quickCount }
  }, [meals])

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-poppins">
        <MealDetailModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-[#0a2d1d]">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #32CD32, transparent 70%)' }} />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F4A535, transparent 70%)' }} />
            <div className="absolute right-1/4 top-1/3 h-32 w-32 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #fff, transparent 70%)' }} />
            <div className="absolute left-1/3 bottom-1/4 h-24 w-24 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #32CD32, transparent 70%)' }} />
          </div>

          <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-12 sm:pb-20 sm:pt-16">
            {/* Header */}
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-md">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                    <UtensilsCrossed size={18} className="text-white" />
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <Sparkles size={16} className="text-[#F4A535]" />
                  </div>
                  <span className="text-sm font-bold text-white/90">Smart Meal Discovery</span>
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Discover{' '}
                  <span className="bg-gradient-to-r from-[#32CD32] to-[#F4A535] bg-clip-text text-transparent">Delicious Meals</span>
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-white/70">
                  {loading ? 'Curating meals just for you...' : `${filteredMeals.length} meals matched to your taste, budget, and dietary preferences`}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void fetchDiscoverData()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <Link
                  href="/meal-generator"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#F4A535] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#ea580c]"
                >
                  <Sparkles size={16} />
                  AI Meal Plan
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatChip icon={BookOpen} label="Total Meals" value={stats.total} />
              <StatChip icon={Truck} label="Vendor Offers" value={stats.vendorMealsCount} />
              <StatChip icon={Crown} label="Premium" value={stats.premiumCount} />
              <StatChip icon={Clock} label="Quick Meals" value={stats.quickCount} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative mx-auto -mt-8 max-w-[1200px] px-4 pb-20">
          {/* Search & Filters Card */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-200/50">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative mb-5">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search meals, ingredients, cuisines..."
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 py-4 pl-14 pr-32 text-sm text-gray-900 placeholder-gray-400 transition-all duration-300 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    setSearch('')
                  }}
                  className="absolute right-[96px] top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-emerald-800 hover:shadow-lg"
              >
                Search
              </button>
            </form>

            {/* Category Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const active = category === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setCategory(opt.value)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 ${
                        active
                          ? 'text-white shadow-lg'
                          : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      style={active ? { background: opt.color } : {}}
                    >
                      <Icon size={14} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 ${
                  showFilters || activeFiltersCount > 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-5 grid gap-6 border-t border-gray-100 pt-5 lg:grid-cols-3">
                {/* Cuisine Filter */}
                <div>
                  <p className="mb-3 text-sm font-bold text-gray-900">Cuisines</p>
                  <div className="flex flex-wrap gap-2">
                    {availableCuisines.slice(0, 12).map((value) => {
                      const active = cuisine === value
                      return (
                        <button
                          key={value}
                          onClick={() => setCuisine(value)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {value === 'all' ? 'All' : formatCuisineLabel(value)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tags Filter */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">Tags</p>
                    {selectedTags.length > 0 && (
                      <button onClick={() => setSelectedTags([])} className="text-xs font-bold text-red-500 hover:text-red-600">
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => {
                      const active = selectedTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {active && <X size={10} />}
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <p className="mb-3 text-sm font-bold text-gray-900">Sort By</p>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortMode(option.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          sortMode === option.value
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vendor Warning */}
          {vendorPermissionWarning && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-bold text-amber-800">
                Vendor pricing is currently unavailable. Please check back later.
              </p>
            </div>
          )}

          {/* Search Results Info */}
          {search && (
            <div className="mt-6 flex items-center gap-3">
              <p className="text-sm text-gray-500">
                Results for <span className="font-bold text-gray-900">&ldquo;{search}&rdquo;</span>
              </p>
              <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">{filteredMeals.length} found</span>
              <button
                onClick={() => {
                  setSearch('')
                  setSearchInput('')
                }}
                className="ml-auto flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600"
              >
                <X size={12} /> Clear
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-gray-100 bg-white">
                  <div className="h-52 rounded-t-3xl bg-gray-200" />
                  <div className="p-5 space-y-4">
                    <div className="h-5 w-3/4 rounded-lg bg-gray-200" />
                    <div className="h-3 w-full rounded bg-gray-100" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 rounded-lg bg-gray-100" />
                      <div className="h-6 w-12 rounded-lg bg-gray-100" />
                    </div>
                    <div className="h-10 rounded-xl bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="mt-8 rounded-3xl border border-red-100 bg-white px-8 py-16 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <p className="mb-2 text-xl font-black text-gray-900">Couldn't load meals</p>
              <p className="mb-6 text-sm text-gray-500">{error}</p>
              <button
                onClick={() => void fetchDiscoverData()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredMeals.length === 0 && (
            <div className="mt-8 rounded-3xl border border-gray-100 bg-white px-8 py-16 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50">
                <UtensilsCrossed size={36} className="text-emerald-400" />
              </div>
              <p className="mb-2 text-xl font-black text-gray-900">No meals found</p>
              <p className="mb-6 text-sm text-gray-500">
                {activeFiltersCount > 0 ? 'Try adjusting your filters to find more meals' : 'No meals have been added yet'}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  <X size={16} /> Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Meals Grid */}
          {!loading && filteredMeals.length > 0 && (
            <>
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-bold text-gray-900">{filteredMeals.length}</span> meals
                </p>
                <Link
                  href="/meal-generator"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  <Sparkles size={14} /> Generate Plan
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMeals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} onOpenDetail={setSelectedMeal} />
                ))}
              </div>
            </>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}
