'use client'

import { useState, useMemo, useEffect, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed, Search, Star, Clock, TrendingUp, Store, MapPin,
  ShoppingBag, Heart, Loader2, Sparkles, AlertCircle, CheckCircle2,
  RefreshCw, Filter, ArrowRight, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  fetchBrowseMeals,
  type MealsPayload,
  type Meal,
} from './actions'

const moneyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES', minimumFractionDigits: 2,
})

function formatMoney(value: number) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0)
}

function getCart(): Map<string, { meal: Meal; quantity: number }> {
  if (typeof window === 'undefined') return new Map()
  try {
    return new Map(JSON.parse(localStorage.getItem('userCart') || '[]'))
  } catch {
    return new Map()
  }
}

function saveCart(cart: Map<string, { meal: Meal; quantity: number }>) {
  if (typeof window === 'undefined') return
  localStorage.setItem('userCart', JSON.stringify(Array.from(cart.entries())))
}

export default function UserMealsClient({
  initialData,
}: {
  initialData: MealsPayload
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<MealsPayload>(initialData)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(searchParams?.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams?.get('category') || 'All',
  )
  const [cuisineFilter, setCuisineFilter] = useState(
    searchParams?.get('cuisine') || 'All',
  )
  const [page, setPage] = useState(Number(searchParams?.get('page') || 1))
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [cart, setCart] = useState<Map<string, { meal: Meal; quantity: number }>>(getCart)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const fetchPage = useCallback(
    async (next: {
      search?: string
      category?: string
      cuisine?: string
      page?: number
    }) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams(searchParams?.toString())
        const newSearch = next.search ?? search
        const newCategory = next.category ?? categoryFilter
        const newCuisine = next.cuisine ?? cuisineFilter
        const newPage = next.page ?? page

        if (newSearch) params.set('search', newSearch)
        else params.delete('search')

        if (newCategory && newCategory !== 'All') params.set('category', newCategory)
        else params.delete('category')

        if (newCuisine && newCuisine !== 'All') params.set('cuisine', newCuisine)
        else params.delete('cuisine')

        if (newPage > 1) params.set('page', String(newPage))
        else params.delete('page')

        startTransition(() => {
          router.push(`?${params.toString()}`)
        })

        const nextData = await fetchBrowseMeals({
          search: newSearch,
          category: newCategory,
          cuisine: newCuisine,
          page: newPage,
        })
        setData(nextData)
        setPage(nextData.page)
      } catch (err: any) {
        setError(err.message || 'Failed to load meals')
      } finally {
        setLoading(false)
      }
    },
    [searchParams, router, search, categoryFilter, cuisineFilter, page],
  )

  useEffect(() => {
    fetchPage({ page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, cuisineFilter])

  const meals = data.meals

  const addToCart = useCallback((meal: Meal) => {
    setAddingId(meal.id)
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(meal.id)
      next.set(
        meal.id,
        existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : { meal, quantity: 1 },
      )
      saveCart(next)
      return next
    })
    setInfo(`${meal.name} added to cart`)
    window.setTimeout(() => setAddingId(null), 500)
  }, [])

  const removeFromCart = useCallback((mealId: string) => {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(mealId)
      if (existing && existing.quantity > 1) {
        next.set(mealId, { ...existing, quantity: existing.quantity - 1 })
      } else {
        next.delete(mealId)
      }
      saveCart(next)
      return next
    })
  }, [])

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const cartItems = useMemo(() => Array.from(cart.values()), [cart])
  const cartTotal = cartItems.reduce(
    (s, { meal, quantity }) => s + meal.price * quantity,
    0,
  )

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
            Browse Meals
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs font-bold text-amber-600">
              <Sparkles size={12} /> {data.totalMeals} meals
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Search, filter, and add meals to cart from all vendors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPage({})}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        {info && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
          >
            <CheckCircle2 size={16} /> {info}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search meals, vendors, cuisines..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <Filter size={12} className="inline mr-1" /> Category
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {data.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-2">
                  Cuisine
                </span>
                <select
                  value={cuisineFilter}
                  onChange={(e) => setCuisineFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {data.cuisines.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="h-40 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-8 bg-gray-100 rounded-xl animate-pulse mt-3" />
                  </div>
                </div>
              ))
            ) : meals.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <UtensilsCrossed size={28} className="text-emerald-500" />
                </div>
                <p className="text-gray-900 font-semibold">No meals found</p>
                <p className="text-gray-400 text-sm text-center max-w-md">
                  Try changing your search or filter to discover more meals.
                </p>
              </div>
            ) : (
              meals.map((meal, i) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                  onClick={() => setSelectedMeal(meal)}
                >
                  {meal.imageUrl ? (
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={meal.imageUrl}
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-gray-700">
                          {meal.category}
                        </span>
                        {meal.isPremium && (
                          <span className="px-2 py-1 bg-amber-500 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                            <Star size={10} className="fill-white" /> Premium
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFav(meal.id)
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition"
                      >
                        <Heart
                          size={14}
                          className={
                            favorites.has(meal.id)
                              ? 'fill-rose-500 text-rose-500'
                              : 'text-gray-400'
                          }
                        />
                      </button>
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center relative">
                      <UtensilsCrossed size={36} className="text-emerald-400" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-gray-700">
                          {meal.category}
                        </span>
                        {meal.isPremium && (
                          <span className="px-2 py-1 bg-amber-500 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                            <Star size={10} className="fill-white" /> Premium
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFav(meal.id)
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition"
                      >
                        <Heart
                          size={14}
                          className={
                            favorites.has(meal.id)
                              ? 'fill-rose-500 text-rose-500'
                              : 'text-gray-400'
                          }
                        />
                      </button>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{meal.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Store size={11} /> {meal.vendor}{' '}
                          <MapPin size={11} className="ml-1" /> {meal.vendorLocation}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold shrink-0">
                        <Star size={12} className="fill-amber-400" /> {meal.rating}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {meal.prepTime + meal.cookTime}min
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp size={11} /> {meal.calories} kcal
                      </span>
                      <span className="capitalize">{meal.cuisine}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-extrabold text-gray-900">
                        {formatMoney(meal.price)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(meal)
                        }}
                        disabled={addingId === meal.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      >
                        {addingId === meal.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <ShoppingBag size={13} />
                        )}
                        Order Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-900">{data.page}</span> of{' '}
                <span className="font-semibold text-gray-900">{data.totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchPage({ page: data.page - 1 })}
                  disabled={data.page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <button
                  onClick={() => fetchPage({ page: data.page + 1 })}
                  disabled={data.page >= data.totalPages || loading}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Your Cart</h3>
                <p className="text-xs text-gray-400">
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <ShoppingBag size={16} className="text-amber-600" />
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ShoppingBag size={24} className="text-gray-300" />
                <p className="text-sm text-gray-400 font-medium">Cart is empty</p>
                <p className="text-xs text-gray-400">Tap Order Now to add meals</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {cartItems.map(({ meal, quantity }) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">{meal.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {meal.vendor} &times; {quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-900">
                          {formatMoney(meal.price * quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(meal.id)}
                          className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Subtotal</span>
                    <span className="text-lg font-extrabold text-gray-900">
                      {formatMoney(cartTotal)}
                    </span>
                  </div>
                  <a
                    href="/shopping"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <ShoppingBag size={16} />
                    Checkout with M-Pesa
                    <ArrowRight size={16} />
                  </a>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">AI Insights</h3>
            <div className="space-y-2">
              <div className="border-l-4 border-l-emerald-500 rounded-r-xl p-3 bg-emerald-50/50">
                <p className="text-xs font-bold text-gray-900">
                  {data.totalMeals} meals available
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  From vendors across {data.vendorCount} restaurants
                </p>
              </div>
              {data.premiumMeals > 0 && (
                <div className="border-l-4 border-l-amber-500 rounded-r-xl p-3 bg-amber-50/50">
                  <p className="text-xs font-bold text-gray-900">
                    {data.premiumMeals} premium meals
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Featured top-rated selections
                  </p>
                </div>
              )}
              {cartItems.length > 0 && (
                <div className="border-l-4 border-l-violet-500 rounded-r-xl p-3 bg-violet-50/50">
                  <p className="text-xs font-bold text-gray-900">Ready to checkout</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {cartItems.length} items in cart
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedMeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedMeal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {selectedMeal.imageUrl ? (
                <div className="h-48 relative">
                  <img
                    src={selectedMeal.imageUrl}
                    alt={selectedMeal.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <button
                    onClick={() => setSelectedMeal(null)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <h2 className="text-xl font-black text-white">{selectedMeal.name}</h2>
                    <p className="text-sm text-white/80">{selectedMeal.vendor}</p>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center relative">
                  <UtensilsCrossed size={48} className="text-emerald-400" />
                  <button
                    onClick={() => setSelectedMeal(null)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <h2 className="text-xl font-black text-gray-900">{selectedMeal.name}</h2>
                    <p className="text-sm text-gray-500">{selectedMeal.vendor}</p>
                  </div>
                </div>
              )}
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">
                  {selectedMeal.description || 'No description provided.'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Category', selectedMeal.category],
                    ['Cuisine', selectedMeal.cuisine],
                    ['Difficulty', selectedMeal.difficulty],
                    ['Price', formatMoney(selectedMeal.price)],
                    ['Prep Time', `${selectedMeal.prepTime} min`],
                    ['Cook Time', `${selectedMeal.cookTime} min`],
                    ['Calories', `${selectedMeal.calories} kcal`],
                    ['Servings', String(selectedMeal.servings)],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{l}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5 capitalize">{v}</p>
                    </div>
                  ))}
                </div>
                {selectedMeal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMeal.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    addToCart(selectedMeal)
                    setSelectedMeal(null)
                  }}
                  disabled={addingId === selectedMeal.id}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {addingId === selectedMeal.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={15} />
                  )}
                  Order Now &middot; {formatMoney(selectedMeal.price)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}