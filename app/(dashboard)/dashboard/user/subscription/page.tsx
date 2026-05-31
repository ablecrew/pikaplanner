'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, CheckCircle2, Loader2, AlertCircle, RefreshCw,
  Crown, Star, Zap, TrendingUp, Bell, Calendar,
  Clock, CreditCard, Wallet, Gift, Rocket,
  X, Shield, Smartphone, ChevronRight, ArrowRight,
  Info, CheckCheck, Sun, Moon, Target, Brain,
  ShoppingBag, UtensilsCrossed, ListChecks, BarChart3,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import Link from 'next/link'

type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

type Subscription = {
  id: string
  tier: string
  status: string
  starts_at: string
  expires_at: string | null
  amount_paid: number
  auto_renew: boolean
}

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
    tier: 'daily',
    display_name: 'Daily',
    price_kes: 14,
    duration_days: 1,
    features: [
      'AI meal suggestions for the day',
      'Smart shopping list generation',
      'Breakfast, lunch & dinner recipes',
      'Calorie and nutrition tracking',
      'Access to all meal categories',
    ],
    popular: false,
  },
  {
    tier: 'weekly',
    display_name: 'Weekly',
    price_kes: 50,
    duration_days: 7,
    features: [
      'Everything in Daily, plus:',
      'Full 7-day weekly menu plan',
      'Weekly budget tracking & analytics',
      'Automated grocery shopping list',
      'Meal prep scheduling',
      'Dietary preference customization',
    ],
    popular: true,
  },
  {
    tier: 'monthly',
    display_name: 'Monthly',
    price_kes: 199,
    duration_days: 30,
    features: [
      'Everything in Weekly, plus:',
      'Full 30-day meal planning',
      'Priority customer support',
      'Unlimited meal plan generations',
      'Advanced nutrition insights',
      'Export meal plans to PDF',
      'Seasonal menu recommendations',
    ],
    popular: false,
  },
  {
    tier: 'yearly',
    display_name: 'Yearly',
    price_kes: 2200,
    duration_days: 365,
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
    popular: false,
  },
]

const formatMoney = (value: number) => {
  return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days > 0) return `${days} days remaining`
  if (days === 0) return 'Expires today'
  return `Expired ${Math.abs(days)} days ago`
}

function PlanCard({
  plan,
  isCurrentPlan,
  onSelect,
  isProcessing,
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
      {/* Decorative gradient */}
      {(isPopular || isYearly) && (
        <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl ${
          isPopular ? 'bg-violet-200/30' : 'bg-amber-200/30'
        }`} />
      )}

      {/* Badges */}
      {isCurrentPlan && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <CheckCircle2 size={12} />
            Active
          </span>
        </div>
      )}
      {isPopular && !isCurrentPlan && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Zap size={12} />
            Most Popular
          </span>
        </div>
      )}
      {isYearly && !isCurrentPlan && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Gift size={12} />
            Best Value
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
        isCurrentPlan ? 'bg-emerald-100 text-emerald-600' :
        isPopular ? 'bg-violet-100 text-violet-600' :
        isYearly ? 'bg-amber-100 text-amber-600' :
        'bg-slate-100 text-slate-500'
      }`}>
        {plan.tier === 'daily' ? <Sun size={28} /> :
         plan.tier === 'weekly' ? <Calendar size={28} /> :
         plan.tier === 'monthly' ? <Star size={28} /> :
         <Crown size={28} />}
      </div>

      {/* Plan name & price */}
      <h3 className="text-2xl font-black text-slate-950">{plan.display_name}</h3>
      <p className="mt-1 text-sm font-medium text-slate-400 capitalize">Meal Plan</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-black text-slate-950">{formatMoney(plan.price_kes)}</span>
        <span className="text-sm font-semibold text-slate-400">
          /{plan.tier === 'daily' ? 'day' : plan.tier === 'weekly' ? 'week' : plan.tier === 'monthly' ? 'month' : 'year'}
        </span>
      </div>

      {isYearly && (
        <p className="mt-1 text-xs font-semibold text-emerald-600">
          Save KES 388 compared to monthly
        </p>
      )}

      {/* Features */}
      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">What you get</p>
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${
              isCurrentPlan ? 'text-emerald-500' :
              isPopular ? 'text-violet-500' :
              isYearly ? 'text-amber-500' :
              'text-slate-400'
            }`} />
            <span className="text-sm font-medium text-slate-700">{feature}</span>
          </div>
        ))}
      </div>

      {/* Action button */}
      <div className="mt-8">
        {isCurrentPlan ? (
          <div className="rounded-2xl bg-emerald-100 px-5 py-3 text-center text-sm font-bold text-emerald-700">
            Current Plan — {formatRelativeTime(new Date().toISOString())}
          </div>
        ) : (
          <button
            onClick={onSelect}
            disabled={isProcessing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShoppingBag size={16} />
            )}
            {isProcessing ? 'Processing...' : `Subscribe ${formatMoney(plan.price_kes)}`}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function UserSubscriptionPage() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showMpesaInput, setShowMpesaInput] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('id', user.id)
        .maybeSingle()

      setProfile((profileData ?? null) as UserProfile | null)

      // Get active subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setActiveSubscription((subData ?? null) as Subscription | null)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void loadData() }, [loadData])

  const currentTier = activeSubscription?.tier || 'none'
  const isOnFreeTrial = activeSubscription?.amount_paid === 0 && activeSubscription?.tier === 'daily'

  const handleSubscribe = useCallback((plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setShowMpesaInput(true)
    setPhoneNumber(profile?.phone || '')
  }, [profile])

  const [polling, setPolling] = useState(false)

const handlePayment = useCallback(async () => {
  if (!selectedPlan || !phoneNumber.trim()) return

  setProcessing(true)
  setError(null)
  setSuccess(null)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Generate a unique subscription order ID
    const isVendor = window.location.pathname.includes('/vendor/')
    const prefix = isVendor ? 'VSUB-' : 'SUB-'
    const subOrderId = `${prefix}${user.id}-${Date.now()}`

    // Call STK push
    const res = await fetch('/api/mpesa/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: selectedPlan.price_kes,
        phone: phoneNumber.replace(/[^0-9]/g, ''),
        orderId: subOrderId,
        userId: user.id,
      }),
    })

    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Payment failed')

    setSuccess('STK Push sent! Check your phone and enter your M-Pesa PIN.')
    setShowMpesaInput(false)
    setPolling(true)

    // Poll for subscription activation every 3 seconds
    const tableName = isVendor ? 'vendor_subscriptions' : 'subscriptions'
    const userIdField = isVendor ? 'vendor_id' : 'user_id'
    const tierField = selectedPlan.tier
    const totalAmount = selectedPlan.price_kes

    const checkInterval = setInterval(async () => {
      try {
        // Check if a subscription was created (by the callback)
        const { data: subs } = await supabase
          .from(tableName)
          .select('*')
          .eq(userIdField, user.id)
          .eq('tier', tierField)
          .order('created_at', { ascending: false })
          .limit(1)

        if (subs && subs.length > 0 && subs[0].status === 'active') {
          clearInterval(checkInterval)
          setPolling(false)
          setSuccess(`🎉 ${selectedPlan.display_name} plan activated! Enjoy your premium features.`)
          
          if (isVendor) {
            // Update vendor profile
            await supabase.from('vendors').update({
              subscription_tier: tierField,
              subscription_end_date: subs[0].expires_at,
            }).eq('id', user.id)
          }
          
          setTimeout(() => void loadData(), 1000)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000)

    // Stop polling after 2 minutes (timeout)
    setTimeout(() => {
      clearInterval(checkInterval)
      if (polling) {
        setPolling(false)
        setError('Payment confirmation timed out. If you paid, your subscription will be activated shortly.')
      }
    }, 120000)

  } catch (err: any) {
    setError(err.message || 'Payment failed')
    setProcessing(false)
  }
}, [selectedPlan, phoneNumber, supabase, loadData, polling])

  const daysRemaining = useMemo(() => {
    if (!activeSubscription?.expires_at) return 0
    const diff = new Date(activeSubscription.expires_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [activeSubscription])

  const totalSaved = useMemo(() => {
    if (!activeSubscription) return 0
    if (activeSubscription.tier === 'yearly') return 388
    return 0
  }, [activeSubscription])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
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
          onClick={() => void loadData()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free trial banner */}
      {isOnFreeTrial && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                <Gift size={12} />
                Free Trial Active
              </div>
              <h2 className="text-2xl font-black tracking-tight">You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left!</h2>
              <p className="mt-1 text-sm text-emerald-100">
                Subscribe to continue enjoying meal planning after your free trial ends.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3 text-center ring-1 ring-white/20">
                <p className="text-2xl font-black text-white">{daysRemaining}</p>
                <p className="text-xs font-semibold text-emerald-200">Days left</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active subscription banner */}
      {activeSubscription && !isOnFreeTrial && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-xl md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Active Plan</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight capitalize">{currentTier} Meal Plan</h2>
              <p className="mt-1 text-sm text-slate-300">
                {daysRemaining} days remaining · {formatMoney(activeSubscription.amount_paid)} paid
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
            </div>
          </div>
        </motion.div>
      )}

      {/* Plans grid */}
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

      {/* Why subscribe section */}
      <div className="mb-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-slate-950">Why subscribe to a meal plan?</h2>
          <p className="mt-1 text-sm text-slate-500">Save time, eat better, and never wonder what to cook again</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Brain size={24} />,
              title: 'AI-Powered Suggestions',
              desc: 'Smart meal recommendations based on your dietary preferences, allergies, and budget.',
              color: 'bg-violet-50 text-violet-600',
            },
            {
              icon: <ListChecks size={24} />,
              title: 'Auto Shopping Lists',
              desc: 'Generated shopping lists from your meal plan. No more forgetting ingredients.',
              color: 'bg-emerald-50 text-emerald-600',
            },
            {
              icon: <BarChart3 size={24} />,
              title: 'Nutrition Tracking',
              desc: 'Track calories, protein, carbs, and fat for every meal you plan.',
              color: 'bg-amber-50 text-amber-600',
            },
            {
              icon: <Target size={24} />,
              title: 'Budget Management',
              desc: 'Set a weekly or monthly budget and get meals that fit within it.',
              color: 'bg-sky-50 text-sky-600',
            },
            {
              icon: <UtensilsCrossed size={24} />,
              title: 'Diverse Cuisines',
              desc: 'Explore Kenyan, African, Indian, Italian, Asian, and more cuisines.',
              color: 'bg-rose-50 text-rose-600',
            },
            {
              icon: <Calendar size={24} />,
              title: 'Meal Prep Scheduling',
              desc: 'Plan your prep days and get organized with a clear weekly schedule.',
              color: 'bg-orange-50 text-orange-600',
            },
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

      {/* Payment confirmation polling state */}
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
            <p className="mt-2 text-sm text-white/80">
              Please check your phone and enter your M-Pesa PIN to complete the payment.
            </p>
              <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0s' }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0.2s' }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-white" style={{ animationDelay: '0.4s' }} />
            </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ */}
      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-center text-2xl font-black text-slate-950">Frequently asked questions</h2>

        <div className="mx-auto max-w-2xl space-y-4">
          {[
            {
              q: 'Can I switch plans anytime?',
              a: 'Yes! You can upgrade or downgrade your plan at any time. When you upgrade, the remaining value of your current plan is applied to the new plan.',
            },
            {
              q: 'What happens when my subscription expires?',
              a: 'When your subscription ends, you will lose access to AI meal suggestions and shopping lists. Your basic profile and order history remain accessible.',
            },
            {
              q: 'Can I cancel my subscription?',
              a: 'Yes, you can cancel anytime from your settings page. Your plan remains active until the end of the billing period.',
            },
            {
              q: 'How does the free trial work?',
              a: 'New users get a free 1-day trial of the Daily meal plan. After the trial ends, you can choose any plan to continue.',
            },
            {
              q: 'Can I get a refund?',
              a: 'We offer a 7-day money-back guarantee for Monthly and Yearly plans. Daily and Weekly plans are non-refundable.',
            },
          ].map((faq, i) => (
            <details key={i} className="group rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-slate-900">
                {faq.q}
                <ChevronRight size={16} className="shrink-0 transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-500">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* M-Pesa payment modal */}
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
              className="relative w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <button
                onClick={() => void handlePayment()}
                disabled={processing || !phoneNumber.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Smartphone size={16} />
                )}
                {processing ? 'Processing...' : `Pay ${formatMoney(selectedPlan.price_kes)} with M-Pesa`}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                <Shield size={12} className="inline mr-1" />
                Secure payment via M-Pesa
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}