'use client'

import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, CheckCircle2, Loader2, AlertCircle, RefreshCw,
  Crown, Star, Zap, Bell, Calendar, CreditCard, Gift, X,
  Shield, Smartphone, ChevronRight, Info, Sun, Target,
  Brain, ShoppingBag, UtensilsCrossed, ListChecks, BarChart3,
  Repeat, Clock,
} from 'lucide-react'
import {
  UserProfile, Subscription, RenewalHistoryItem,
  fetchSubscriptionData, checkSubscriptionStatusAction,
  setupAutoRenewAtCheckoutAction, initiateSubscriptionPaymentAction,
} from './actions'
import ManageSubscription from './ManageSubscription'

type BillingType = 'one-time' | 'auto-renew'

type SubscriptionPlan = {
  tier: string
  display_name: string
  price_kes: number
  duration_days: number | null
  features: string[]
  popular: boolean
}

const MEAL_PLANS: SubscriptionPlan[] = [
  {
    tier: 'daily', display_name: 'Daily', price_kes: 21, duration_days: 1, popular: false,
    features: [
      'AI meal suggestions for the day',
      'Smart shopping list generation',
      'Breakfast, lunch & dinner recipes',
      'Calorie and nutrition tracking',
      'Access to all meal categories',
    ],
  },
  {
    tier: 'weekly', display_name: 'Weekly', price_kes: 67, duration_days: 7, popular: true,
    features: [
      'Everything in Daily, plus:',
      'Full 7-day weekly menu plan',
      'Weekly budget tracking & analytics',
      'Automated grocery shopping list',
      'Meal prep scheduling',
      'Dietary preference customization',
    ],
  },
  {
    tier: 'monthly', display_name: 'Monthly', price_kes: 217, duration_days: 30, popular: false,
    features: [
      'Everything in Weekly, plus:',
      'Full 30-day meal planning',
      'Priority customer support',
      'Unlimited meal plan generations',
      'Advanced nutrition insights',
      'Export meal plans to PDF',
      'Seasonal menu recommendations',
    ],
  },
  {
    tier: 'yearly', display_name: 'Yearly', price_kes: 2500, duration_days: 365, popular: false,
    features: [
      'Everything in Monthly, plus:',
      'Best value — save KES 388/year',
      'Early access to new features',
      'Exclusive premium recipes',
      'Personalized AI coach',
      'Family meal planning (up to 6)',
      'Priority beta features',
      'VIP community access',
    ],
  },
]

const POLL_INTERVAL = 4000
const MAX_POLL_ATTEMPTS = 75
const REDIRECT_DELAY_MS = 2500
const MEAL_GENERATOR_URL = '/meal-generator'

// ✅ FIXED: Handles null/undefined values
const formatMoney = (value: number | null | undefined) => {
  if (value == null) return 'KES 0'
  return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return '—'
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days > 0) return `${days} days remaining`
  if (days === 0) return 'Expires today'
  return `Expired ${Math.abs(days)} days ago`
}

// ── Memoized Plan Card ──
const PlanCard = memo(function PlanCard({
  plan, isCurrentPlan, onSelect, isProcessing,
}: {
  plan: SubscriptionPlan
  isCurrentPlan: boolean
  onSelect: () => void
  isProcessing: boolean
}) {
  const isPopular = plan.popular
  const isYearly = plan.tier === 'yearly'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-[2rem] border-2 p-6 md:p-8 transition-all ${
        isCurrentPlan
          ? 'border-emerald-400 bg-emerald-50/50 shadow-[0_24px_80px_rgba(16,185,129,0.15)]'
          : isPopular
            ? 'border-violet-200 bg-gradient-to-b from-violet-50/30 to-white shadow-sm hover:shadow-[0_24px_80px_rgba(139,92,246,0.12)]'
            : isYearly
              ? 'border-amber-200 bg-gradient-to-b from-amber-50/30 to-white shadow-sm hover:shadow-[0_24px_80px_rgba(245,158,11,0.12)]'
              : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
      }`}
    >
      {(isPopular || isYearly) && (
        <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl ${
          isPopular ? 'bg-violet-200/30' : 'bg-amber-200/30'
        }`} />
      )}
      {isCurrentPlan && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <CheckCircle2 size={12} /> Active
          </span>
        </div>
      )}
      {isPopular && !isCurrentPlan && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Zap size={12} /> Most Popular
          </span>
        </div>
      )}
      {isYearly && !isCurrentPlan && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Gift size={12} /> Best Value
          </span>
        </div>
      )}

      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
        isCurrentPlan ? 'bg-emerald-100 text-emerald-600'
          : isPopular ? 'bg-violet-100 text-violet-600'
            : isYearly ? 'bg-amber-100 text-amber-600'
              : 'bg-slate-100 text-slate-500'
      }`}>
        {plan.tier === 'daily' ? <Sun size={28} />
          : plan.tier === 'weekly' ? <Calendar size={28} />
            : plan.tier === 'monthly' ? <Star size={28} />
              : <Crown size={28} />}
      </div>

      <h3 className="text-2xl font-black text-slate-950">{plan.display_name}</h3>
      <p className="mt-1 text-sm font-medium text-slate-400 capitalize">Meal Plan</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-black text-slate-950">{formatMoney(plan.price_kes)}</span>
        <span className="text-sm font-semibold text-slate-400">
          /{plan.tier === 'daily' ? 'day' : plan.tier === 'weekly' ? 'week' : plan.tier === 'monthly' ? 'month' : 'year'}
        </span>
      </div>
      {isYearly && (
        <p className="mt-1 text-xs font-semibold text-emerald-600">Save KES 388 compared to monthly</p>
      )}

      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">What you get</p>
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <CheckCircle2
              size={16}
              className={`mt-0.5 shrink-0 ${
                isCurrentPlan ? 'text-emerald-500'
                  : isPopular ? 'text-violet-500'
                    : isYearly ? 'text-amber-500'
                      : 'text-slate-400'
              }`}
            />
            <span className="text-sm font-medium text-slate-700">{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        {isCurrentPlan ? (
          <a
            href={MEAL_GENERATOR_URL}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <UtensilsCrossed size={16} />
            Start Planning
          </a>
        ) : (
          <button
            onClick={onSelect}
            disabled={isProcessing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
            {isProcessing ? 'Processing...' : `Subscribe ${formatMoney(plan.price_kes)}`}
          </button>
        )}
      </div>
    </motion.div>
  )
})

// ── Main Client Component ──
export default function UserSubscriptionClient({
  initialProfile,
  initialSubscription,
  initialRenewals = [],
  userId,
}: {
  initialProfile: UserProfile | null
  initialSubscription: Subscription | null
  initialRenewals?: RenewalHistoryItem[]
  userId: string
}) {
  const [profile, setProfile] = useState(initialProfile)
  const [activeSubscription, setActiveSubscription] = useState(initialSubscription)
  const [renewalHistory, setRenewalHistory] = useState<RenewalHistoryItem[]>(initialRenewals)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showMpesaInput, setShowMpesaInput] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [billingType, setBillingType] = useState<BillingType>('auto-renew')

  // Polling state
  const [polling, setPolling] = useState(false)
  const [pollAttempts, setPollAttempts] = useState(0)
  const [pollMessage, setPollMessage] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTier = activeSubscription?.tier || 'none'
  
  // ✅ FIXED: Null-safe check
  const isOnFreeTrial = (activeSubscription?.amount_paid ?? 0) === 0 && activeSubscription?.tier === 'daily'

  // ✅ FIXED: Handles invalid dates
  const daysRemaining = useMemo(() => {
    if (!activeSubscription?.expires_at) return 0
    const expires = new Date(activeSubscription.expires_at)
    if (isNaN(expires.getTime())) return 0
    return Math.max(
      0,
      Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    )
  }, [activeSubscription])

  // ✅ FIXED: Added missing totalSaved calculation
  const totalSaved = useMemo(
    () => (activeSubscription?.tier === 'yearly' ? 388 : 0),
    [activeSubscription?.tier]
  )

  // Cleanup everything on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (redirectRef.current) clearTimeout(redirectRef.current)
    }
  }, [])

  // Redirect to meal generator after delay
  const redirectToMealGenerator = useCallback((delay = REDIRECT_DELAY_MS) => {
    setIsRedirecting(true)
    redirectRef.current = setTimeout(() => {
      window.location.href = MEAL_GENERATOR_URL
    }, delay)
  }, [])

  // Cancel pending redirect
  const cancelRedirect = useCallback(() => {
    if (redirectRef.current) {
      clearTimeout(redirectRef.current)
      redirectRef.current = null
    }
    setIsRedirecting(false)
  }, [])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setPolling(false)
    setPollAttempts(0)
    setPollMessage('')
  }, [])

  // Refresh data helper
  const refreshData = useCallback(async () => {
    if (!userId) return
    const data = await fetchSubscriptionData(userId)
    setProfile(data.profile)
    setActiveSubscription(data.subscription)
    setRenewalHistory(data.renewalHistory)
    return data
  }, [userId])

  // ── Start polling (FIXED: now accepts subscriptionId) ──
  const startPolling = useCallback((
    plan: SubscriptionPlan,
    isVendor: boolean,
    subscriptionId: string
  ) => {
    console.log('[startPolling] Starting with subscriptionId:', subscriptionId)
    
    setPolling(true)
    setPollAttempts(0)
    setPollMessage('Waiting for M-Pesa payment confirmation...')

    let attempts = 0

    const poll = setInterval(async () => {
      attempts++
      setPollAttempts(attempts)

      if (attempts <= 5) {
        setPollMessage('Please check your phone and enter your M-Pesa PIN...')
      } else if (attempts <= 15) {
        setPollMessage('Still waiting for payment confirmation...')
      } else if (attempts <= 30) {
        setPollMessage('This is taking longer than usual. Please ensure you completed the payment.')
      } else {
        setPollMessage('Payment is being verified. Please wait a bit longer...')
      }

      try {
        console.log('[startPolling] Calling checkSubscriptionStatusAction with:', { subscriptionId, tier: plan.tier })
        
        const status = await checkSubscriptionStatusAction(
          subscriptionId,
          plan.tier,
          isVendor
        )

        console.log('[startPolling] Status result:', status)

        if (status.active) {
          console.log('[startPolling] Subscription active! Redirecting...')
          
          clearInterval(poll)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          intervalRef.current = null
          timeoutRef.current = null

          setPolling(false)
          setActiveSubscription(status.subscription)

          const fresh = await fetchSubscriptionData(userId)
          setProfile(fresh.profile)
          setActiveSubscription(fresh.subscription)
          setRenewalHistory(fresh.renewalHistory)

          setSuccess(
            `🎉 ${plan.display_name} plan activated! Redirecting to meal planner...`
          )
          redirectToMealGenerator()
          return
        }

        if (status.failed) {
          clearInterval(poll)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          intervalRef.current = null
          timeoutRef.current = null

          setPolling(false)
          setError('Payment was not completed. Please try again.')
          return
        }
      } catch (err) {
        console.error('[startPolling] Polling error:', err)
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        clearInterval(poll)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        intervalRef.current = null
        timeoutRef.current = null

        setPolling(false)
        setPollMessage('')
        setError(
          'Payment confirmation timed out. If you completed the payment, your subscription will be activated shortly. You can also try refreshing this page.'
        )
      }
    }, POLL_INTERVAL)

    intervalRef.current = poll

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setPolling(false)
        setPollMessage('')
        setError(
          'Payment confirmation timed out. If you paid successfully, please refresh the page.'
        )
      }
    }, MAX_POLL_ATTEMPTS * POLL_INTERVAL + 5000)
  }, [userId, redirectToMealGenerator])

  // Manual refresh during polling
  const handleManualRefresh = useCallback(async () => {
    const data = await refreshData()
    if (data?.subscription && data.subscription.status === 'active') {
      stopPolling()
      setSuccess('✅ Your subscription is active! Redirecting to meal planner...')
      redirectToMealGenerator(1500)
    }
  }, [refreshData, stopPolling, redirectToMealGenerator])

  const handleSubscribe = useCallback(
    (plan: SubscriptionPlan) => {
      setSelectedPlan(plan)
      setShowMpesaInput(true)
      setPhoneNumber(profile?.phone || '')
      setBillingType('auto-renew')
    },
    [profile]
  )

  // ── Handle Payment (FIXED: passes subscriptionId to startPolling) ──
  const handlePayment = useCallback(async () => {
    if (!selectedPlan || !phoneNumber.trim() || !userId) return
    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const isVendor =
        typeof window !== 'undefined' && window.location.pathname.includes('/vendor/')

      console.log('[handlePayment] Initiating payment...', { tier: selectedPlan.tier, amount: selectedPlan.price_kes })

      const result = await initiateSubscriptionPaymentAction({
        tier: selectedPlan.tier,
        amount: selectedPlan.price_kes,
        durationDays: selectedPlan.duration_days ?? 30,
        phone: phoneNumber,
        billingType,
        isVendor,
      })

      console.log('[handlePayment] Result:', result)

      if (!result.success) {
        throw new Error(result.error)
      }

      setSuccess(result.message)
      setShowMpesaInput(false)
      setProcessing(false)

      console.log('[handlePayment] Starting polling with subscriptionId:', result.subscriptionId)
      startPolling(selectedPlan, isVendor, result.subscriptionId)
    } catch (err: any) {
      console.error('[handlePayment] Error:', err)
      setError(err.message || 'Payment failed')
      setProcessing(false)
    }
  }, [selectedPlan, phoneNumber, userId, billingType, startPolling])

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
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            Meal Plan Subscription
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 text-xs font-bold text-violet-600">
              <Sparkles size={12} /> {activeSubscription ? currentTier : 'Free trial'}
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {activeSubscription
              ? `Your ${currentTier} plan is active — ${daysRemaining} days remaining`
              : 'Choose a plan that fits your lifestyle and start planning smarter meals.'}
          </p>
        </div>
        <button
          onClick={refreshData}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Banners */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <AlertCircle size={16} /> {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
          >
            {isRedirecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span className="flex-1">{success}</span>
            {isRedirecting && (
              <button
                onClick={cancelRedirect}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-200 transition"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free Trial Banner */}
      {isOnFreeTrial && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                <Gift size={12} /> Free Trial Active
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left!
              </h2>
              <p className="mt-1 text-sm text-emerald-100">
                Subscribe to continue enjoying meal planning after your free trial ends.
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 text-center ring-1 ring-white/20">
              <p className="text-2xl font-black text-white">{daysRemaining}</p>
              <p className="text-xs font-semibold text-emerald-200">Days left</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Plan Banner */}
      {activeSubscription && !isOnFreeTrial && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-xl md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Active Plan
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight capitalize">
                {currentTier} Meal Plan
              </h2>
              {/* ✅ FIXED: Null-safe amount_paid */}
              <p className="mt-1 text-sm text-slate-300">
                {daysRemaining} days remaining · {formatMoney(activeSubscription?.amount_paid)} paid
                {totalSaved > 0 && ` · Saved ${formatMoney(totalSaved)}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/10">
                <p className="text-2xl font-black text-white">{daysRemaining}</p>
                <p className="text-xs font-semibold text-slate-400">Days left</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/10">
                <p className="text-2xl font-black text-white capitalize">{currentTier}</p>
                <p className="text-xs font-semibold text-slate-400">Plan</p>
              </div>
              <a
                href={MEAL_GENERATOR_URL}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition text-center"
              >
                <UtensilsCrossed size={16} />
                Start Planning
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manage Subscription */}
      {activeSubscription && !isOnFreeTrial && (
        <ManageSubscription
          subscription={activeSubscription}
          renewalHistory={renewalHistory}
          defaultPhone={profile?.phone ?? ''}
          onUpdate={refreshData}
        />
      )}

      {/* Plan Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {MEAL_PLANS.map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            isCurrentPlan={currentTier === plan.tier}
            onSelect={() => handleSubscribe(plan)}
            isProcessing={processing}
          />
        ))}
      </div>

      {/* Why Subscribe */}
      <div className="mb-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-slate-950">Why subscribe to a meal plan?</h2>
          <p className="mt-1 text-sm text-slate-500">
            Save time, eat better, and never wonder what to cook again
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <Brain size={24} />, title: 'AI-Powered Suggestions', desc: 'Smart meal recommendations based on your dietary preferences, allergies, and budget.', color: 'bg-violet-50 text-violet-600' },
            { icon: <ListChecks size={24} />, title: 'Auto Shopping Lists', desc: 'Generated shopping lists from your meal plan. No more forgetting ingredients.', color: 'bg-emerald-50 text-emerald-600' },
            { icon: <BarChart3 size={24} />, title: 'Nutrition Tracking', desc: 'Track calories, protein, carbs, and fat for every meal you plan.', color: 'bg-amber-50 text-amber-600' },
            { icon: <Target size={24} />, title: 'Budget Management', desc: 'Set a weekly or monthly budget and get meals that fit within it.', color: 'bg-sky-50 text-sky-600' },
            { icon: <UtensilsCrossed size={24} />, title: 'Diverse Cuisines', desc: 'Explore Kenyan, African, Indian, Italian, Asian, and more cuisines.', color: 'bg-rose-50 text-rose-600' },
            { icon: <Calendar size={24} />, title: 'Meal Prep Scheduling', desc: 'Plan your prep days and get organized with a clear weekly schedule.', color: 'bg-orange-50 text-orange-600' },
          ].map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Polling Banner */}
      <AnimatePresence>
        {polling && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-8 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-center text-white shadow-xl"
          >
            <Loader2 size={40} className="mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-black">Waiting for payment confirmation...</h3>
            <p className="mt-2 text-sm text-white/80">{pollMessage}</p>

            <div className="mt-4 mx-auto max-w-xs">
              <div className="flex justify-between text-xs font-semibold text-white/60 mb-1">
                <span>Checking payment...</span>
                <span>{Math.min(pollAttempts * 4, 300)}s / 300s</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-white/60"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min((pollAttempts / MAX_POLL_ATTEMPTS) * 100, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0s' }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0.2s' }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0.4s' }} />
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-white/30 transition"
              >
                <RefreshCw size={14} />
                Check Now
              </button>
              <button
                onClick={stopPolling}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white/80 backdrop-blur hover:bg-white/20 transition"
              >
                <X size={14} />
                Stop Checking
              </button>
            </div>

            <p className="mt-3 text-xs text-white/50">
              We check every {POLL_INTERVAL / 1000}s. Max wait: {MAX_POLL_ATTEMPTS * POLL_INTERVAL / 1000 / 60} min.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ */}
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-center text-2xl font-black text-slate-950">Frequently asked questions</h2>
        <div className="mx-auto max-w-2xl space-y-4">
          {[
            { q: 'Can I switch plans anytime?', a: 'Yes! You can upgrade or downgrade your plan at any time. When you upgrade, the remaining value of your current plan is applied to the new plan.' },
            { q: 'What happens when my subscription expires?', a: 'When your subscription ends, you will lose access to AI meal suggestions and shopping lists. Your basic profile and order history remain accessible.' },
            { q: 'How does auto-renewal work?', a: 'When enabled, we send an M-Pesa STK push to your saved phone 1 day before your plan expires. You confirm with your PIN to renew. You can disable auto-renewal anytime from the Billing & Renewals section.' },
            { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your subscription page. Your plan remains active until the end of the billing period.' },
            { q: 'How does the free trial work?', a: 'New users get a free 1-day trial of the Daily meal plan. After the trial ends, you can choose any plan to continue.' },
            { q: 'Can I get a refund?', a: 'We offer a 7-day money-back guarantee for Monthly and Yearly plans. Daily and Weekly plans are non-refundable.' },
          ].map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-slate-900">
                {faq.q}
                <ChevronRight size={16} className="shrink-0 transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-500">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showMpesaInput && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowMpesaInput(false); setSelectedPlan(null) }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl"
            >
              <button
                onClick={() => { setShowMpesaInput(false); setSelectedPlan(null) }}
                className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Crown size={28} />
                </div>
                <h3 className="text-center text-xl font-black text-slate-950">
                  Subscribe to {selectedPlan.display_name}
                </h3>
                <p className="mt-1 text-center text-sm text-slate-500">
                  Pay {formatMoney(selectedPlan.price_kes)} for the {selectedPlan.display_name.toLowerCase()} meal plan
                </p>
              </div>

              <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">Amount</p>
                <p className="text-3xl font-black text-emerald-700">{formatMoney(selectedPlan.price_kes)}</p>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              {/* Billing Type */}
              <div className="mb-5 rounded-2xl border-2 border-slate-100 p-3 space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">
                  Billing
                </p>

                <label className="flex cursor-pointer items-start gap-3 p-3 rounded-xl border-2 transition hover:bg-slate-50 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50/50 border-transparent">
                  <input
                    type="radio"
                    name="billing"
                    value="auto-renew"
                    checked={billingType === 'auto-renew'}
                    onChange={() => setBillingType('auto-renew')}
                    className="mt-1 accent-emerald-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Repeat size={12} /> Auto-Renew
                      </p>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      We'll send an M-Pesa prompt 1 day before expiry. Cancel anytime.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 p-3 rounded-xl border-2 transition hover:bg-slate-50 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50/50 border-transparent">
                  <input
                    type="radio"
                    name="billing"
                    value="one-time"
                    checked={billingType === 'one-time'}
                    onChange={() => setBillingType('one-time')}
                    className="mt-1 accent-emerald-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar size={12} /> One-time Payment
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Pay once. Subscribe manually when this ends.
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing || !phoneNumber.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                {processing
                  ? 'Processing...'
                  : `Pay ${formatMoney(selectedPlan.price_kes)} with M-Pesa`}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <Shield size={11} /> Secure payment via M-Pesa
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}