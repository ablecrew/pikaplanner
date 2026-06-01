'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Smartphone,
  Info,
  ShieldCheck,
  Loader2,
  Circle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  PackageCheck,
  ListChecks,
  Truck,
  ArrowRight,
  Wallet,
  Plus,
  MapPin,
  UtensilsCrossed,
  Store,
  BadgePercent,
  ShieldAlert,
  Search,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

type DataRow = Record<string, unknown>

type ShoppingListItem = {
  id: string
  ingredient_name?: string | null
  item_name?: string | null
  name?: string | null
  quantity?: string | number | null
  unit?: string | null
  estimated_price?: number | string | null
  is_checked?: boolean | null
}

type ShoppingList = {
  id: string
  title?: string | null
  status?: string | null
  total_estimated_cost?: number | null
  shopping_list_items?: ShoppingListItem[]
}

type UserProfile = {
  dietary_preferences?: string[] | null
  allergies?: string[] | null
  cuisine_preferences?: string[] | null
  meal_types?: string[] | null
  budget_range?: string | null
  location?: string | null
  location_city?: string | null
  household_size?: number | null
}

type RecommendedMeal = {
  id: string
  source: 'meal' | 'vendor_meal'
  title: string
  description: string
  vendorName: string
  location: string
  price: number
  tags: string[]
  matchReasons: string[]
  allergySafe: boolean
  budgetFriendly: boolean
}

type SuggestedIngredient = {
  id: string
  name: string
  quantity: string
  unit: string
  estimatedPrice: number
  sourceMeal: string
}

type AddOnState = {
  profile: UserProfile | null
  recommendedMeals: RecommendedMeal[]
  suggestedIngredients: SuggestedIngredient[]
}

const DEFAULT_ADD_ON_STATE: AddOnState = {
  profile: null,
  recommendedMeals: [],
  suggestedIngredients: [],
}

function asString(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function asNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value) || 0
  return 0
}

function pick(row: DataRow | undefined, keys: string[]) {
  if (!row) return ''
  for (const key of keys) {
    const value = asString(row[key])
    if (value) return value
  }
  return ''
}

function pickArray(row: DataRow | undefined, keys: string[]) {
  if (!row) return [] as string[]
  for (const key of keys) {
    const value = row[key]
    if (Array.isArray(value)) {
      return value.map((item) => asString(item).toLowerCase()).filter(Boolean)
    }
    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    }
  }
  return [] as string[]
}

function normalizeList(values?: string[] | null) {
  return (values ?? []).map((value) => value.toLowerCase()).filter(Boolean)
}

function containsAny(source: string[], targets: string[]) {
  if (targets.length === 0) return false
  return source.some((item) => targets.some((target) => item.includes(target) || target.includes(item)))
}

function getBudgetCeiling(budget?: string | null) {
  if (!budget) return 0
  if (budget.includes('under-500')) return 500
  if (budget.includes('500-1000')) return 1000
  if (budget.includes('1000-2000')) return 2000
  if (budget.includes('above-2000')) return 999999
  return 0
}

function createMealRecommendation(
  row: DataRow,
  profile: UserProfile | null,
  source: 'meal' | 'vendor_meal',
  vendor?: DataRow,
): RecommendedMeal {
  // For vendor_meal rows, the real meal info lives under row.meal
  // For meal rows, the fields are directly on row
  const mealRow = (row.meal as DataRow | undefined) || row
  const vendorRow = (row.vendor as DataRow | undefined) || vendor

  const dietary = normalizeList(profile?.dietary_preferences)
  const cuisines = normalizeList(profile?.cuisine_preferences)
  const mealTypes = normalizeList(profile?.meal_types)
  const allergies = normalizeList(profile?.allergies).filter((item) => item !== 'none')
  const location = (profile?.location_city || profile?.location || '').toLowerCase()
  const budgetCeiling = getBudgetCeiling(profile?.budget_range)

  const rowTags = [
    ...pickArray(mealRow, ['dietary_tags', 'dietary_options', 'tags', 'labels']),
    ...pickArray(mealRow, ['cuisine_types', 'cuisine', 'category']),
    pick(mealRow, ['meal_type', 'type', 'category']).toLowerCase(),
  ].filter(Boolean)

  const vendorLocation = pick(vendorRow, [
    'location',
    'location_city',
    'address',
    'service_area',
  ]).toLowerCase()
  const allergens = pickArray(mealRow, ['allergens', 'allergies', 'contains'])
  const price = asNumber(row.price ?? row.amount ?? row.cost ?? row.estimated_price)
  const matchReasons: string[] = []

  if (containsAny(rowTags, dietary)) matchReasons.push('Matches diet')
  if (containsAny(rowTags, cuisines)) matchReasons.push('Cuisine match')
  if (containsAny(rowTags, mealTypes)) matchReasons.push('Meal type match')
  if (location && vendorLocation.includes(location)) matchReasons.push('Near you')
  if (budgetCeiling > 0 && price > 0 && price <= budgetCeiling) matchReasons.push('Budget-friendly')

  const allergySafe = !containsAny(allergens, allergies)
  if (allergySafe && allergies.length > 0) matchReasons.push('Allergy-safe')

  return {
    id: asString(row.id),
    source,
    title: pick(mealRow, ['name', 'title', 'meal_name']) || 'Recommended meal',
    description:
      pick(mealRow, ['description', 'summary', 'notes']) ||
      'A meal matched from your Smart Meal preferences.',
    vendorName:
      pick(vendorRow, ['business_name', 'name', 'vendor_name']) ||
      pick(mealRow, ['vendor_name']) ||
      'Smart Meal Kitchen',
    location:
      pick(vendorRow, ['location_city', 'location', 'service_area', 'address']) ||
      pick(mealRow, ['location', 'service_area']),
    price,
    tags: rowTags.slice(0, 3),
    matchReasons: matchReasons.length > 0 ? matchReasons.slice(0, 3) : ['Recommended'],
    allergySafe,
    budgetFriendly: budgetCeiling > 0 && price > 0 && price <= budgetCeiling,
  }
}

function scoreRecommendation(meal: RecommendedMeal) {
  let score = meal.matchReasons.length
  if (meal.allergySafe) score += 1
  if (meal.budgetFriendly) score += 1
  return score
}

export default function ShoppingPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [addOnsLoading, setAddOnsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [addingItemId, setAddingItemId] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [list, setList] = useState<ShoppingList | null>(null)
  const [addOns, setAddOns] = useState<AddOnState>(DEFAULT_ADD_ON_STATE)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPhoneInput, setShowPhoneInput] = useState(false)

  const fetchLatestShoppingList = async (uid?: string | null) => {
    const activeUserId = uid ?? userId
    if (!activeUserId) {
      setLoading(false)
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: listError } = await supabase
        .from('shopping_lists')
        .select(
          `
          *,
          shopping_list_items(*)
        `,
        )
        .eq('user_id', activeUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (listError) {
        const msg = (listError as { message?: string })?.message || 'Table or column not found. Check RLS and schema.'
        throw new Error(msg)
      }

      const latestList = (data as ShoppingList) || null
      setList(latestList)
      return latestList
    } catch (err) {
      console.error('Shopping list fetch failed:', err)
      const message = (err as { message?: string })?.message || 'Failed to load shopping list'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchSmartAddOns = async (uid: string, activeList?: ShoppingList | null) => {
    setAddOnsLoading(true)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(
          'dietary_preferences, allergies, cuisine_preferences, meal_types, budget_range, location, location_city, household_size',
        )
        .eq('id', uid)
        .maybeSingle()

      if (profileError) throw profileError
      const profile = (profileData ?? null) as UserProfile | null

      // FIX: vendor_meals is fetched with a nested join so we get the real
      // meal info and vendor info along with the price.
      const [
        { data: mealsData, error: mealsErr },
        { data: vendorMealsData, error: vendorMealsErr },
        { data: vendorsData, error: vendorsErr },
      ] = await Promise.all([
        supabase.from('meals').select('*').limit(24),
        supabase
          .from('vendor_meals')
          .select(
            `
            id,
            price,
            currency,
            is_available,
            preparation_time_minutes,
            notes,
            meal:meals (
              id,
              name,
              description,
              tags,
              category,
              cuisine,
              is_active
            ),
            vendor:vendors (
              id,
              business_name,
              location_city,
              location_address,
              is_accepting_orders
            )
          `,
          )
          .eq('is_available', true)
          .limit(24),
        supabase.from('vendors').select('*').limit(60),
      ])

      if (mealsErr) console.warn('Meals fetch warning:', mealsErr)
      if (vendorMealsErr) console.warn('Vendor meals fetch warning:', vendorMealsErr)
      if (vendorsErr) console.warn('Vendors fetch warning:', vendorsErr)

      const vendors = ((vendorsData ?? []) as DataRow[])
      const vendorMap = new Map(vendors.map((vendor) => [asString(vendor.id), vendor]))

      const mealRecommendations = ((mealsData ?? []) as DataRow[]).map((meal) =>
        createMealRecommendation(meal, profile, 'meal'),
      )

      // FIX: the vendor meal row already has .meal and .vendor nested, so we
      // pass it through as-is. The function now reads the nested data.
      const vendorMealRecommendations = ((vendorMealsData ?? []) as DataRow[]).map((meal) => {
        const vendorId = pick(meal, ['vendor_id']) || asString((meal.vendor as DataRow | undefined)?.id)
        const fallbackVendor = vendorId ? vendorMap.get(vendorId) : undefined
        return createMealRecommendation(meal, profile, 'vendor_meal', fallbackVendor)
      })

      const recommendedMeals = [...mealRecommendations, ...vendorMealRecommendations]
        .sort((a, b) => scoreRecommendation(b) - scoreRecommendation(a))
        .slice(0, 6)

      const recommendedMealIds = recommendedMeals
        .filter((meal) => meal.source === 'meal')
        .map((meal) => meal.id)

      let suggestedIngredients: SuggestedIngredient[] = []

      if (recommendedMealIds.length > 0) {
        const { data: ingredientsData } = await supabase
          .from('recipe_ingredients')
          .select('*')
          .in('meal_id', recommendedMealIds)
          .limit(40)

        const currentItemNames = new Set(
          (activeList?.shopping_list_items ?? [])
            .map((item) =>
              (item.ingredient_name || item.item_name || item.name || '').toLowerCase(),
            )
            .filter(Boolean),
        )
        const mealTitleById = new Map(recommendedMeals.map((meal) => [meal.id, meal.title]))

        suggestedIngredients = ((ingredientsData ?? []) as DataRow[])
          .map((ingredient) => ({
            id:
              asString(ingredient.id) ||
              `${pick(ingredient, ['meal_id', 'recipe_id'])}-${pick(ingredient, [
                'ingredient',
                'ingredient_name',
                'item_name',
              ])}`,
            name: pick(ingredient, ['ingredient', 'ingredient_name', 'item_name', 'name']),
            quantity: pick(ingredient, ['quantity', 'amount']) || '1',
            unit: pick(ingredient, ['unit', 'measurement']) || '',
            estimatedPrice: asNumber(ingredient.estimated_price ?? ingredient.price),
            sourceMeal: mealTitleById.get(pick(ingredient, ['meal_id', 'recipe_id'])) || 'Recommended meal',
          }))
          .filter((ingredient) => ingredient.name && !currentItemNames.has(ingredient.name.toLowerCase()))
          .slice(0, 8)
      }

      setAddOns({ profile, recommendedMeals, suggestedIngredients })
    } catch (err) {
      console.error('Failed to load smart add-ons:', err)
      setAddOns(DEFAULT_ADD_ON_STATE)
    } finally {
      setAddOnsLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        setError(userError.message)
        setLoading(false)
        setAddOnsLoading(false)
        return
      }

      const uid = user?.id || null
      setUserId(uid)

      if (!uid) {
        setLoading(false)
        setAddOnsLoading(false)
        return
      }

      try {
        await fetchLatestShoppingList(uid)
      } catch (err) {
        console.error('Shopping list fetch failed:', err)
      }

      try {
        await fetchSmartAddOns(uid, list)
      } catch (err) {
        console.error('Smart add-ons fetch failed:', err)
      } finally {
        setAddOnsLoading(false)
      }
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const items = useMemo(() => list?.shopping_list_items || [], [list])
  const checkedItems = useMemo(() => items.filter((item) => item.is_checked).length, [items])
  const remainingItems = Math.max(items.length - checkedItems, 0)
  const completionPercentage = useMemo(() => {
    if (items.length === 0) return 0
    return Math.round((checkedItems / items.length) * 100)
  }, [checkedItems, items.length])

  const totals = useMemo(() => {
    const itemsTotal = items.reduce((sum, item) => sum + (Number(item.estimated_price) || 0), 0)
    const delivery = itemsTotal > 0 ? 200 : 0
    const grandTotal = itemsTotal + delivery
    return { itemsTotal, delivery, grandTotal }
  }, [items])

  const preferenceChips = useMemo(() => {
    const profile = addOns.profile
    return [
      ...(profile?.dietary_preferences ?? []),
      ...(profile?.cuisine_preferences ?? []),
      ...(profile?.meal_types ?? []),
      profile?.budget_range,
      profile?.location_city || profile?.location,
    ].filter(Boolean)
      .slice(0, 8) as string[]
  }, [addOns.profile])

  const ensureShoppingList = async () => {
    if (list) return list
    if (!userId) throw new Error('Please sign in to manage your shopping list.')

    const { data, error: createError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        title: 'Smart Shopping List',
        total_estimated_cost: 0,
      })
      .select('*')
      .maybeSingle()

    if (createError) throw createError
    if (!data) throw new Error('Shopping list was created but could not be returned. Check RLS on shopping_lists.')

    const createdList = data as ShoppingList
    setList({ ...createdList, shopping_list_items: [] })
    return createdList
  }

  const addShoppingItem = async (item: {
    id: string
    name: string
    quantity?: string
    unit?: string
    estimatedPrice?: number
  }) => {
    setAddingItemId(item.id)
    setError(null)
    setSuccessMessage(null)

    try {
      const activeList = await ensureShoppingList()

      const { error: insertError } = await supabase.from('shopping_list_items').insert({
        shopping_list_id: activeList.id,
        ingredient_name: item.name,
        quantity: item.quantity || '1',
        unit: item.unit || null,
        estimated_price: item.estimatedPrice || 0,
        is_checked: false,
      })

      if (insertError) throw insertError

      setList((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          shopping_list_items: [
            ...(prev.shopping_list_items ?? []),
            {
              id: crypto.randomUUID(),
              ingredient_name: item.name,
              name: item.name,
              quantity: item.quantity || '1',
              unit: item.unit || null,
              estimated_price: item.estimatedPrice || 0,
              is_checked: false,
            },
          ],
        }
      })
      setSuccessMessage(`${item.name} added to your shopping list.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to shopping list')
    } finally {
      setAddingItemId(null)
    }
  }

  const addMealIngredients = async (meal: RecommendedMeal) => {
    setAddingItemId(meal.id)
    setError(null)
    setSuccessMessage(null)

    try {
      if (meal.source !== 'meal') {
        await addShoppingItem({
          id: meal.id,
          name: meal.title,
          quantity: '1',
          estimatedPrice: meal.price,
        })
        return
      }

      const { data, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('meal_id', meal.id)
        .limit(30)

      if (ingredientsError) throw ingredientsError

      const ingredients = ((data ?? []) as DataRow[])
        .map((ingredient) => ({
          id: asString(ingredient.id),
          name: pick(ingredient, ['ingredient', 'ingredient_name', 'item_name', 'name']),
          quantity: pick(ingredient, ['quantity', 'amount']) || '1',
          unit: pick(ingredient, ['unit', 'measurement']) || null,
          estimated_price: asNumber(ingredient.estimated_price ?? ingredient.price),
          is_checked: false,
        }))
        .filter((ingredient) => ingredient.name)

      if (ingredients.length === 0) {
        await addShoppingItem({
          id: meal.id,
          name: meal.title,
          quantity: '1',
          estimatedPrice: meal.price,
        })
        return
      }

      const activeList = await ensureShoppingList()
      const { data: inserted, error: insertError } = await supabase
        .from('shopping_list_items')
        .insert(
          ingredients.map((ingredient) => ({
            shopping_list_id: activeList.id,
            ingredient_name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            estimated_price: ingredient.estimated_price,
            is_checked: false,
          })),
        )
        .select('*')

      if (insertError) throw insertError

      setList((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          shopping_list_items: [
            ...(prev.shopping_list_items ?? []),
            ...((inserted ?? []) as ShoppingListItem[]),
          ],
        }
      })
      setSuccessMessage(`${ingredients.length} ingredients from "${meal.title}" added.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ingredients')
    } finally {
      setAddingItemId(null)
    }
  }

  const toggleItem = async (item: ShoppingListItem) => {
    const next = !item.is_checked
    setList((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        shopping_list_items: (prev.shopping_list_items || []).map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, is_checked: next } : currentItem,
        ),
      }
    })

    const { error: updateError } = await supabase
      .from('shopping_list_items')
      .update({ is_checked: next })
      .eq('id', item.id)

    if (updateError) {
      setError(updateError.message)
      await fetchLatestShoppingList()
    }
  }

  const removeItem = async (itemId: string) => {
    const previous = list
    setList((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        shopping_list_items: (prev.shopping_list_items || []).filter((item) => item.id !== itemId),
      }
    })

    const { error: deleteError } = await supabase.from('shopping_list_items').delete().eq('id', itemId)
    if (deleteError) {
      setError(deleteError.message)
      setList(previous)
    }
  }

  const handleMpesaCheckout = async () => {
    if (!list || totals.grandTotal <= 0) {
      setError('Your shopping list is empty. Add items first.')
      return
    }

    if (!phoneNumber || phoneNumber.replace(/[^0-9]/g, '').length < 10) {
      setShowPhoneInput(true)
      return
    }

    setIsPaying(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totals.grandTotal,
          phone: phoneNumber.replace(/[^0-9]/g, ''),
          orderId: list.id,
          userId: userId,
        }),
      })

      const data = await res.json()

      if (!data.success) throw new Error(data.error || 'Payment initiation failed')

      setSuccessMessage('STK Push sent! Check your phone and enter your M-Pesa PIN to complete payment.')
      setShowPhoneInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] font-poppins text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8 overflow-hidden rounded-[32px] bg-[#0a2d1d] text-white shadow-xl">
          <div className="relative p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(50,205,50,0.18),transparent_30%),radial-gradient(circle_at_90%_70%,rgba(249,115,22,0.22),transparent_35%)]" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur">
                  <ShoppingCart className="h-4 w-4 text-[#32CD32]" />
                  Smart Shopping
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">Smart Shopping List</h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/75 md:text-base">
                  Automatically calculated from your current meal plan, with market-aware pricing and fast checkout.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void fetchLatestShoppingList()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/15"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <Link
                  href="/meal-generator"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#ea580c]"
                >
                  <Sparkles size={16} />
                  Generate Plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle size={16} />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 size={16} />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ListChecks size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{items.length}</p>
                <p className="text-sm font-bold text-gray-500">Total items</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <PackageCheck size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{remainingItems}</p>
                <p className="text-sm font-bold text-gray-500">Remaining</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">KES {totals.grandTotal.toFixed(0)}</p>
                <p className="text-sm font-bold text-gray-500">Estimated total</p>
              </div>
            </div>
          </div>
        </section>

        {/* Progress */}
        {items.length > 0 && (
          <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black uppercase tracking-wide text-slate-700">Shopping progress</p>
              <p className="text-sm font-black text-emerald-600">{completionPercentage}% complete</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </section>
        )}

        {/* Smart Add-ons Based On Your Preferences */}
        <section className="mb-8 rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-[#126e3d]">
                <Sparkles className="h-4 w-4" />
                Smart Add-ons Based On Your Preferences
              </div>
              <h2 className="text-2xl font-black text-slate-950">Preference-aware shopping suggestions</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500">
                We use your dietary preferences, allergies, location, budget, and favorite cuisines to recommend meals and missing ingredients.
              </p>
            </div>

            <button
              type="button"
              onClick={() => userId && void fetchSmartAddOns(userId, list)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-black text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 ${addOnsLoading ? 'animate-spin' : ''}`} />
              Refresh add-ons
            </button>
          </div>

          {preferenceChips.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {preferenceChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-black text-[#126e3d]"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {addOnsLoading ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-3xl bg-[#f8faf8]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[#126e3d]" />
                <p className="text-sm font-bold text-gray-500">Loading smart recommendations...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
              {/* Recommended Meals */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
                  <UtensilsCrossed className="h-4 w-4 text-[#126e3d]" />
                  Meals and vendor meals you may like
                </h3>

                {addOns.recommendedMeals.length === 0 ? (
                  <div className="rounded-3xl bg-[#f8faf8] p-6 text-sm font-semibold text-gray-500">
                    No meal recommendations yet. Complete onboarding or add meals to your database to unlock smart suggestions.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {addOns.recommendedMeals.map((meal) => (
                      <div
                        key={`${meal.source}-${meal.id}`}
                        className="rounded-3xl border border-gray-100 bg-[#f8faf8] p-5"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-black text-slate-900">{meal.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-gray-500">
                              {meal.description}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-[#126e3d]">
                            {meal.source === 'vendor_meal' ? 'Vendor' : 'Recipe'}
                          </span>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                          {meal.matchReasons.map((reason) => (
                            <span
                              key={reason}
                              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-gray-600"
                            >
                              {reason === 'Near you' && <MapPin className="h-3 w-3 text-[#f97316]" />}
                              {reason === 'Allergy-safe' && <ShieldAlert className="h-3 w-3 text-[#126e3d]" />}
                              {reason === 'Budget-friendly' && <BadgePercent className="h-3 w-3 text-[#f97316]" />}
                              {reason}
                            </span>
                          ))}
                        </div>

                        <div className="mb-4 space-y-1 text-xs font-semibold text-gray-500">
                          {meal.vendorName && (
                            <p className="flex items-center gap-2">
                              <Store className="h-3.5 w-3.5 text-[#126e3d]" /> {meal.vendorName}
                            </p>
                          )}
                          {meal.location && (
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-[#f97316]" /> {meal.location}
                            </p>
                          )}
                          {meal.price > 0 && <p>KES {meal.price.toFixed(0)}</p>}
                        </div>

                        <button
                          type="button"
                          onClick={() => void addMealIngredients(meal)}
                          disabled={addingItemId === meal.id}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#126e3d] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#0f5c33] disabled:opacity-60"
                        >
                          {addingItemId === meal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Add items
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Ingredients */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
                  <Search className="h-4 w-4 text-[#f97316]" />
                  Commonly missing ingredients
                </h3>

                {addOns.suggestedIngredients.length === 0 ? (
                  <div className="rounded-3xl bg-[#fff7ed] p-6 text-sm font-semibold text-orange-800">
                    No missing ingredients found yet. Add more recipes or favorites to improve suggestions.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addOns.suggestedIngredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="rounded-2xl border border-gray-100 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-gray-900">{ingredient.name}</p>
                            <p className="text-xs font-semibold text-gray-500">
                              {ingredient.quantity} {ingredient.unit} · From {ingredient.sourceMeal}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void addShoppingItem({
                                id: ingredient.id,
                                name: ingredient.name,
                                quantity: ingredient.quantity,
                                unit: ingredient.unit,
                                estimatedPrice: ingredient.estimatedPrice,
                              })
                            }
                            disabled={addingItemId === ingredient.id}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#f97316] px-3 py-2 text-xs font-black text-white transition hover:bg-[#ea580c] disabled:opacity-60"
                          >
                            {addingItemId === ingredient.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Shopping List Items */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-emerald-600" />
                  <p className="text-sm font-bold text-gray-500">Loading your shopping list...</p>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                  <ShoppingCart size={30} className="text-emerald-500" />
                </div>
                <p className="text-lg font-black text-gray-900">No shopping items yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-gray-500">
                  Generate a meal plan and Pika Plan will automatically build a smart shopping list from your recipes.
                </p>
                <Link
                  href="/meal-generator"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#126e3d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0f5c33]"
                >
                  Generate Meal Plan
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const label = item.ingredient_name || item.item_name || item.name || 'Item'
                const qty = [item.quantity, item.unit].filter(Boolean).join(' ')

                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <button
                        onClick={() => void toggleItem(item)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border-2 border-emerald-100 transition-colors hover:border-emerald-500"
                        aria-label={item.is_checked ? 'Mark item as unchecked' : 'Mark item as checked'}
                      >
                        {item.is_checked ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <Circle size={16} className="text-gray-300" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`truncate font-black ${
                            item.is_checked ? 'text-emerald-700 line-through' : 'text-gray-800'
                          }`}
                        >
                          {label}
                        </p>
                        <p className="text-xs font-semibold text-gray-500">
                          {qty || 'Qty not set'} · KES {Number(item.estimated_price || 0).toFixed(0)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => void removeItem(item.id)}
                      className="flex-shrink-0 rounded-xl p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              })
            )}
          </section>

          {/* Checkout Sidebar */}
          <aside className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] bg-emerald-950 p-8 text-white shadow-2xl shadow-emerald-950/20">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
                <ShoppingCart size={120} />
              </div>

              <h3 className="mb-6 text-xl font-black">Order Summary</h3>

              <div className="mb-8 space-y-4">
                <div className="flex justify-between text-sm text-emerald-100/70">
                  <span>Items Total</span>
                  <span>KES {totals.itemsTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-100/70">
                  <span>Delivery Fee</span>
                  <span>KES {totals.delivery.toFixed(0)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-4 text-xl font-black">
                  <span>Total</span>
                  <span>KES {totals.grandTotal.toFixed(0)}</span>
                </div>
              </div>

              {showPhoneInput ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-emerald-100">Enter M-Pesa number</p>
                    <button
                      onClick={() => setShowPhoneInput(false)}
                      className="rounded-lg p-1 text-emerald-100/50 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={() => void handleMpesaCheckout()}
                    disabled={isPaying || phoneNumber.replace(/[^0-9]/g, '').length < 10}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-widest text-emerald-950 transition-all hover:bg-orange-400 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPaying ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Smartphone size={18} />
                    )}
                    {isPaying ? 'Processing...' : 'Send STK Push'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void handleMpesaCheckout()}
                  disabled={isPaying || totals.grandTotal <= 0}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-widest text-emerald-950 transition-all hover:bg-orange-400 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPaying ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Smartphone size={18} />
                  )}
                  {isPaying ? 'Processing...' : 'Pay via M-Pesa'}
                </button>
              )}

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-100/45">
                <ShieldCheck size={12} />
                Secure Transaction
              </div>
            </div>

            <div className="flex gap-4 rounded-3xl border border-orange-100 bg-orange-50 p-6">
              <Info className="flex-shrink-0 text-orange-500" size={20} />
              <p className="text-xs font-semibold leading-relaxed text-orange-800">
                Vendor prep items are calculated based on your local market availability in Nairobi.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">Smart delivery grouping</p>
                  <p className="text-xs font-semibold text-gray-500">Coming soon</p>
                </div>
              </div>
              <p className="text-xs font-medium leading-relaxed text-gray-500">
                Pika Plan can group shopping items by nearby vendors to reduce delivery cost and improve freshness.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}