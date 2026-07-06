'use client'

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Heart, Clock, ShoppingCart, Star, ChefHat, Sparkles,
  RefreshCw, AlertCircle, CheckCircle2, Phone, Clock3, Flame, Brain, Zap,
  Award, UtensilsCrossed, Crown, ShoppingBag,
} from 'lucide-react'
import {
  fetchUserOverview,
  type UserOverviewData,
  type ActiveOrder,
  type RecommendedMeal,
  type OrderStatus,
} from './actions'

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  vendorId: string
  vendorName: string
}

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  'Pending': 15,
  'Confirmed': 35,
  'Preparing': 55,
  'Ready': 75,
  'Out for Delivery': 90,
  'Delivered': 100,
  'Cancelled': 0,
  'Refunded': 0,
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  'Pending':          { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200' },
  'Confirmed':        { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200' },
  'Preparing':        { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200' },
  'Ready':            { bg: 'bg-cyan-50',     text: 'text-cyan-700',     border: 'border-cyan-200' },
  'Out for Delivery': { bg: 'bg-indigo-50',   text: 'text-indigo-700',   border: 'border-indigo-200' },
  'Delivered':        { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200' },
  'Cancelled':        { bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200' },
  'Refunded':         { bg: 'bg-slate-50',    text: 'text-slate-700',    border: 'border-slate-200' },
}

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ✅ Countdown timer component with better mobile spacing
function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiresAt).getTime() - Date.now()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          mins: Math.floor((difference / 1000 / 60) % 60),
          secs: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  return (
    <div className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-gray-700">
      <span className="px-1 py-0.5 bg-gray-100 rounded">{String(timeLeft.days).padStart(2, '0')}</span>:
      <span className="px-1 py-0.5 bg-gray-100 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>:
      <span className="px-1 py-0.5 bg-gray-100 rounded">{String(timeLeft.mins).padStart(2, '0')}</span>:
      <span className="px-1 py-0.5 bg-gray-100 rounded">{String(timeLeft.secs).padStart(2, '0')}</span>
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

export default function UserOverviewClient({
  initialData,
}: {
  initialData: UserOverviewData | null
}) {
  const router = useRouter()
  const [data, setData] = useState<UserOverviewData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [favoritesCount, setFavoritesCount] = useState(initialData?.favoritesCount ?? 0)
  const [, startTransition] = useTransition()

  // Load cart and favorites from localStorage
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('pikaplan-cart')
      if (storedCart) setCart(JSON.parse(storedCart) as CartItem[])

      const storedFavs = localStorage.getItem('pikaplan-favorites')
      if (storedFavs) {
        const favs = JSON.parse(storedFavs)
        if (Array.isArray(favs)) setFavoritesCount(favs.length)
      }
    } catch (e) {
      console.warn('Failed to load cart/favorites from localStorage:', e)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchUserOverview()
      if (next) setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAddToCart = useCallback((meal: RecommendedMeal) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === meal.id)
      let nextCart: CartItem[] = []

      if (existing) {
        nextCart = prev.map((item) =>
          item.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else {
        nextCart = [
          ...prev,
          {
            id: meal.id,
            name: meal.name,
            price: meal.price,
            quantity: 1,
            image: meal.image,
            vendorId: meal.vendorId,
            vendorName: meal.vendor,
          },
        ]
      }

      try {
        localStorage.setItem('pikaplan-cart', JSON.stringify(nextCart))
        window.dispatchEvent(new Event('storage'))
      } catch (e) {
        console.warn('Failed to persist cart:', e)
      }

      return nextCart
    })

    setInfoMessage(`🛒 "${meal.name}" added to your shopping list!`)
    window.setTimeout(() => setInfoMessage(null), 3000)
  }, [])

  const aiTips = useMemo(() => {
    if (!data) return []

    const tips: Array<{ icon: React.ReactNode; title: string; description: string }> = []

    if (data.activeOrders.length > 0) {
      const active = data.activeOrders[0]
      tips.push({
        icon: <Zap size={15} />,
        title: 'Order Status Update',
        description: `Your order from "${active.vendorName}" is currently ${active.status}. Estimated arrival is ${active.eta}.`,
      })
    }

    if (data.spendingBreakdown.total > 5000) {
      tips.push({
        icon: <Award size={15} />,
        title: 'Premium Member Status',
        description:
          'You qualify for free delivery on your next 3 orders. Select Premium checkout at payment.',
      })
    }

    tips.push({
      icon: <Brain size={15} />,
      title: 'AI Smart Tip',
      description:
        data.recommendedMeals.length > 0
          ? `We noticed you like ${data.recommendedMeals[0].category} food. We recommend trying "${data.recommendedMeals[0].name}" for a nutritious option.`
          : 'Complete your onboarding preferences to receive personalized daily recipe recommendations.',
    })

    return tips
  }, [data])

  // ✅ UPDATED: Stats with better mobile responsive layout
  const stats = useMemo(
    () => [
      { 
        label: 'Active Meal Plan', 
        value: data?.activeMealPlan ? data.activeMealPlan.tier : 'None',
        subValue: data?.activeMealPlan?.expiresAt ? (
          <CountdownTimer expiresAt={data.activeMealPlan.expiresAt} />
        ) : '',
        icon: Crown, 
        color: 'bg-violet-50 text-violet-600', 
        border: 'border-violet-100' 
      },
      { 
        label: 'Active Orders',
        value: data?.activeFoodOrdersCount ?? 0,
        icon: ShoppingBag,
        color: 'bg-blue-50 text-blue-600', 
        border: 'border-blue-100' 
      },
      { 
        label: 'Total Spent', 
        value: (
          <div className="space-y-1.5">
            {/* ✅ TOTAL FIRST - Larger and bolder */}
            <div className="pb-1.5 border-b border-gray-100">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-base lg:text-xl font-black text-emerald-600">{formatCurrency(data?.spendingBreakdown.total ?? 0)}</p>
            </div>
            {/* ✅ BREAKDOWN BELOW */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500">Orders</span>
                <span className="text-[10px] lg:text-xs font-bold text-gray-900">{formatCurrency(data?.spendingBreakdown.orders.amount ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500">MP Subscription</span>
                <span className="text-[10px] lg:text-xs font-bold text-gray-900">{formatCurrency(data?.spendingBreakdown.subscriptions.amount ?? 0)}</span>
              </div>
            </div>
          </div>
        ),
        icon: ShoppingCart, 
        color: 'bg-emerald-50 text-emerald-600', 
        border: 'border-emerald-100' 
      },
      { 
        label: 'Favorites', 
        value: favoritesCount, 
        icon: Heart, 
        color: 'bg-rose-50 text-rose-600', 
        border: 'border-rose-100' 
      },
    ],
    [data, favoritesCount],
  )

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading dashboard…</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="font-poppins"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900">My Dashboard</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full bg-gradient-to-r from-[#32CD32]/10 to-[#1A5C3A]/10 border border-[#32CD32]/30 text-[10px] lg:text-xs font-bold text-[#1A5C3A]">
              <Sparkles size={12} className="animate-spin-slow" /> Smart Plan
            </span>
          </div>
          <p className="mt-1 text-xs lg:text-sm text-gray-500">
            Welcome back, {data.userName}! Here&rsquo;s what&rsquo;s cooking today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              startTransition(() => {
                void refresh()
              })
            }}
            className="inline-flex items-center gap-1.5 lg:gap-2 rounded-xl border border-gray-200 bg-white px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <a
            href="/shopping"
            className="inline-flex items-center gap-1.5 lg:gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-3 lg:px-5 py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
          >
            <ShoppingCart size={14} />
            <span className="hidden sm:inline">My Shopping List</span>
            <span className="sm:hidden">Cart</span>
            {cart.length > 0 && (
              <span className="ml-1 px-1.5 lg:px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[9px] lg:text-xs font-black">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </a>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs lg:text-sm font-semibold text-red-700"
          >
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}
        {infoMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white shadow-xl px-4 lg:px-5 py-3 lg:py-4 text-xs lg:text-sm font-bold text-emerald-800"
          >
            <CheckCircle2 size={16} /> {infoMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ UPDATED: KPI Stats with better mobile responsive layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-2xl border ${stat.border} p-3 lg:p-5 shadow-sm hover:shadow-md transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <p className="text-[9px] lg:text-xs font-bold text-gray-400 uppercase tracking-wide">{stat.label}</p>
              <div className={`p-1.5 lg:p-2 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon size={14} className="lg:size-5" />
              </div>
            </div>
            <div className="text-left">
              {typeof stat.value === 'string' || typeof stat.value === 'number' ? (
                <p className="text-lg lg:text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              ) : (
                stat.value
              )}
              {stat.subValue && (
                <div className="mt-1.5 lg:mt-2">{stat.subValue}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Smart Tips */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2 lg:gap-2.5">
          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain size={14} className="text-violet-600 animate-pulse lg:hidden" />
            <Brain size={16} className="text-violet-600 animate-pulse hidden lg:block" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-xs lg:text-sm">AI Smart Assistant</h3>
            <p className="text-[9px] lg:text-xs text-gray-500">Real-time alerts, health insights, and menu recommendations</p>
          </div>
        </div>
        <div className="p-3 lg:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 lg:h-16 w-full rounded-xl" />)
          ) : (
            aiTips.map((tip, i) => (
              <div
                key={i}
                className="border-l-4 rounded-r-xl p-3 lg:p-4 border-l-violet-500 bg-violet-50/30"
              >
                <div className="flex items-start gap-2 lg:gap-3">
                  <div className="text-violet-700 mt-0.5">{tip.icon}</div>
                  <div>
                    <p className="text-xs lg:text-sm font-bold text-gray-900">{tip.title}</p>
                    <p className="text-[9px] lg:text-xs text-gray-600 mt-1 leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Orders */}
      {data.activeOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            Active Orders
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] lg:text-xs font-bold">
              {data.activeOrders.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {data.activeOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs lg:text-sm font-mono font-bold text-gray-900">#{order.orderNumber}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] lg:text-xs font-bold border ${
                      STATUS_COLORS[order.status]?.bg || 'bg-gray-50'
                    } ${STATUS_COLORS[order.status]?.text || 'text-gray-700'} ${
                      STATUS_COLORS[order.status]?.border || 'border-gray-200'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <p className="text-xs lg:text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                  <ChefHat size={12} className="text-gray-400 lg:hidden" />
                  <ChefHat size={14} className="text-gray-400 hidden lg:block" />
                  {order.vendorName}
                </p>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] lg:text-xs text-gray-500 font-medium">
                    <span>Preparation Stage</span>
                    <span className="text-emerald-600 font-bold">ETA: {order.eta}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 lg:h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] h-full rounded-full transition-all duration-500"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 lg:mt-4 pt-3 border-t border-gray-50 text-[9px] lg:text-xs">
                  <span className="text-gray-500 font-medium">
                    {order.itemsCount} item{order.itemsCount > 1 ? 's' : ''} &middot; {formatCurrency(order.amount)}
                  </span>
                  <a
                    href={`tel:${order.vendorPhone}`}
                    className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <Phone size={10} className="lg:hidden" />
                    <Phone size={12} className="hidden lg:block" />
                    <span className="hidden lg:inline">Contact</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Meals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base lg:text-lg font-bold text-gray-900">Recommended for You</h2>
          <span className="text-[9px] lg:text-xs text-gray-400">Curated by PikaPlan AI</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 lg:h-64 w-full rounded-2xl" />)}
          </div>
        ) : data.recommendedMeals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-12 text-center flex flex-col items-center justify-center">
            <UtensilsCrossed size={24} className="text-gray-300 mb-2 lg:hidden" />
            <UtensilsCrossed size={32} className="text-gray-300 mb-2 hidden lg:block" />
            <p className="text-sm lg:text-base font-semibold text-gray-800">No recommended meals available</p>
            <p className="text-[9px] lg:text-xs text-gray-400">We are adding new kitchens in your area daily.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
            {data.recommendedMeals.map((meal) => (
              <div
                key={meal.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full"
              >
                <div className="h-36 lg:h-44 overflow-hidden relative bg-gray-50">
                  <img
                    src={meal.image}
                    alt={meal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
                    }}
                  />
                  <div className="absolute top-2 lg:top-2.5 right-2 lg:right-2.5 flex flex-col gap-1 items-end">
                    <span className="px-2 lg:px-2.5 py-0.5 lg:py-1 bg-white/95 backdrop-blur-sm text-[#1A5C3A] rounded-full text-[8px] lg:text-[10px] font-bold shadow-sm uppercase tracking-wide border border-emerald-50">
                      {meal.category}
                    </span>
                    <span className="px-1.5 lg:px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white rounded text-[7px] lg:text-[9px] font-semibold">
                      {meal.cuisine}
                    </span>
                  </div>
                </div>

                <div className="p-3 lg:p-4 flex flex-col flex-1">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-xs lg:text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {meal.name}
                    </p>
                    <p className="text-[9px] lg:text-xs text-gray-400 mt-1 flex items-center gap-1 capitalize">
                      <ChefHat size={10} className="text-gray-400 lg:hidden" />
                      <ChefHat size={12} className="text-gray-400 hidden lg:block" />
                      {meal.vendor}
                    </p>

                    <div className="flex items-center gap-2 lg:gap-3 mt-2 text-[8px] lg:text-[11px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock size={9} className="lg:hidden" />
                        <Clock size={11} className="hidden lg:block" />
                        {meal.prepTime} min
                      </span>
                      <span className="w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full bg-gray-200" />
                      <span className="flex items-center gap-1">
                        <Flame size={9} className="lg:hidden" />
                        <Flame size={11} className="hidden lg:block" />
                        {meal.calories} kcal
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-gray-50">
                    <span className="font-black text-[#1A5C3A] text-sm lg:text-base">{formatCurrency(meal.price)}</span>
                    <span className="flex items-center gap-1 text-[9px] lg:text-xs text-amber-500 font-bold bg-amber-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-lg border border-amber-100">
                      <Star className="w-3 h-3 lg:w-3.5 lg:h-3.5 fill-amber-400 text-amber-400" />
                      {meal.rating.toFixed(1)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(meal)}
                    className="w-full mt-2 lg:mt-3 px-3 lg:px-4 py-2 lg:py-2.5 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white rounded-xl text-[9px] lg:text-xs font-extrabold hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1 lg:gap-1.5"
                  >
                    <ShoppingCart size={11} className="lg:hidden" />
                    <ShoppingCart size={13} className="hidden lg:block" />
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}