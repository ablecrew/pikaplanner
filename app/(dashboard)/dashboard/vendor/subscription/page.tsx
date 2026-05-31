'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, CheckCircle2, Loader2, AlertCircle, RefreshCw,
  Crown, Star, Shield, TrendingUp, Bell, MessageSquare,
  Mail, Smartphone, Store, ChevronRight, ArrowRight,
  Clock, CreditCard, Wallet, Zap, Menu, MapPin,
  BarChart3, Package, Users, Globe, Gift, Rocket,
  X, Info, HelpCircle, CheckCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import Link from 'next/link'

type VendorProfile = {
  id: string
  business_name: string | null
  phone: string | null
  subscription_tier: string | null
  subscription_end_date: string | null
  created_at: string | null
  total_orders: number | null
  total_earnings: number | null
  is_verified: boolean | null
}

type SubscriptionPlan = {
  tier: string
  display_name: string
  price_kes: number
  duration_days: number | null
  features: string[]
  is_active: boolean
}

const FREEMIUM_DAYS = 60 // 2 months

const VENDOR_PLANS: SubscriptionPlan[] = [
  {
    tier: 'freemium',
    display_name: 'Starter',
    price_kes: 0,
    duration_days: FREEMIUM_DAYS,
    features: [
      'Vendor profile creation',
      'Upload up to 10 meals',
      'Set your location',
      'Receive up to 30 orders/week',
      'Basic dashboard analytics',
      'Email support',
    ],
    is_active: true,
  },
  {
    tier: 'premium',
    display_name: 'Premium',
    price_kes: 999,
    duration_days: 30,
    features: [
      'Unlimited meal listings',
      'Priority visibility on homepage',
      'Featured vendor badge',
      'Unlimited orders',
      'WhatsApp order notifications',
      'SMS order notifications',
      'Email order notifications',
      'In-app push notifications',
      'Advanced analytics dashboard',
      'Dedicated support',
      'Promotional campaigns',
    ],
    is_active: true,
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
  isFreemiumActive,
  freemiumDaysLeft,
  onSelect,
  isProcessing,
}: {
  plan: SubscriptionPlan
  isCurrentPlan: boolean
  isFreemiumActive: boolean
  freemiumDaysLeft: number
  onSelect: () => void
  isProcessing: boolean
}) {
  const isPremium = plan.tier === 'premium'
  const isFree = plan.tier === 'freemium'
  const canUpgrade = plan.tier === 'premium' && !isCurrentPlan

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-[2rem] border-2 p-6 md:p-8 transition-all ${
        isCurrentPlan
          ? 'border-emerald-400 bg-emerald-50/50 shadow-[0_24px_80px_rgba(16,185,129,0.15)]'
          : isPremium
            ? 'border-amber-200 bg-gradient-to-b from-amber-50/30 to-white shadow-sm hover:shadow-[0_24px_80px_rgba(245,158,11,0.12)]'
            : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
      }`}
    >
      {/* Decorative gradient for premium */}
      {isPremium && (
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-amber-200/30 to-orange-200/20 blur-3xl" />
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <CheckCircle2 size={12} />
            Current Plan
          </span>
        </div>
      )}

      {/* Premium badge */}
      {isPremium && !isCurrentPlan && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Crown size={12} />
            Recommended
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
        isCurrentPlan ? 'bg-emerald-100 text-emerald-600' :
        isPremium ? 'bg-amber-100 text-amber-600' :
        'bg-slate-100 text-slate-500'
      }`}>
        {isPremium ? <Crown size={28} /> : <Store size={28} />}
      </div>

      {/* Plan name & price */}
      <h3 className="text-2xl font-black text-slate-950">{plan.display_name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-black text-slate-950">
          {isFree ? 'Free' : formatMoney(plan.price_kes)}
        </span>
        {!isFree && (
          <span className="text-sm font-semibold text-slate-400">/month</span>
        )}
      </div>

      {isFree && isFreemiumActive && (
        <p className="mt-1 text-sm font-semibold text-emerald-600">
          {freemiumDaysLeft} days remaining in trial
        </p>
      )}

      {/* Features */}
      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
          {isFree ? 'Limited features' : 'Everything in Starter, plus:'}
        </p>
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${
              isCurrentPlan ? 'text-emerald-500' :
              isPremium ? 'text-amber-500' :
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
            {isFree 
              ? `${freemiumDaysLeft > 0 ? `${freemiumDaysLeft} days remaining` : 'Trial ended'}`
              : 'Active subscription'}
          </div>
        ) : canUpgrade ? (
          <button
            onClick={onSelect}
            disabled={isProcessing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Crown size={16} />
            )}
            {isProcessing ? 'Processing...' : `Upgrade to ${plan.display_name}`}
          </button>
        ) : null}
      </div>
    </motion.div>
  )
}

function FeatureComparisonRow({
  feature,
  freemium,
  premium,
}: {
  feature: string
  freemium: boolean | string
  premium: boolean | string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 transition hover:bg-slate-50">
      <div className="flex-1 text-sm font-medium text-slate-700">{feature}</div>
      <div className="flex w-24 items-center justify-center">
        {typeof freemium === 'boolean' ? (
          freemium ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <X size={18} className="text-slate-300" />
          )
        ) : (
          <span className="text-xs font-semibold text-slate-500">{freemium}</span>
        )}
      </div>
      <div className="flex w-24 items-center justify-center">
        {typeof premium === 'boolean' ? (
          premium ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <X size={18} className="text-slate-300" />
          )
        ) : (
          <span className="text-xs font-semibold text-slate-500">{premium}</span>
        )}
      </div>
    </div>
  )
}

export default function VendorSubscriptionPage() {
  const supabase = useMemo(() => createClient(), [])
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showMpesaInput, setShowMpesaInput] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [polling, setPolling] = useState(false)

  const loadVendor = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, business_name, phone, subscription_tier, subscription_end_date, created_at, total_orders, total_earnings, is_verified')
        .eq('profile_id', user.id)
        .maybeSingle()

      setVendor((vendorData ?? null) as VendorProfile | null)
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void loadVendor()
  }, [loadVendor])

  const isFreemiumActive = useMemo(() => {
    if (!vendor?.created_at) return false
    const created = new Date(vendor.created_at)
    const now = new Date()
    const freemiumEnd = new Date(created)
    freemiumEnd.setDate(freemiumEnd.getDate() + FREEMIUM_DAYS)
    return now < freemiumEnd
  }, [vendor?.created_at])

  const freemiumDaysLeft = useMemo(() => {
    if (!vendor?.created_at) return 0
    const created = new Date(vendor.created_at)
    const now = new Date()
    const freemiumEnd = new Date(created)
    freemiumEnd.setDate(freemiumEnd.getDate() + FREEMIUM_DAYS)
    const diff = freemiumEnd.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [vendor?.created_at])

  const hasPremiumSubscription = useMemo(() => {
    if (!vendor?.subscription_end_date) return false
    return new Date(vendor.subscription_end_date) > new Date()
  }, [vendor?.subscription_end_date])

  const currentTier = useMemo(() => {
    if (hasPremiumSubscription) return 'premium'
    return 'freemium'
  }, [hasPremiumSubscription])

  const handleUpgrade = useCallback((plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setShowMpesaInput(true)
    setPhoneNumber(vendor?.phone || '')
  }, [vendor])

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
      setProcessing(false)

      // Poll for subscription activation every 3 seconds
      const tableName = isVendor ? 'vendor_subscriptions' : 'subscriptions'
      const userIdField = isVendor ? 'vendor_id' : 'user_id'
      const tierField = selectedPlan.tier

      let activated = false

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval)
        if (!activated) {
          setPolling(false)
          setProcessing(false)
          setError('Payment confirmation timed out. If you paid, your subscription will be activated shortly.')
        }
      }, 120000)

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
            activated = true
            clearInterval(checkInterval)
            clearTimeout(timeoutId)
            setPolling(false)
            setProcessing(false)
            setSuccess(`🎉 ${selectedPlan.display_name} plan activated! Enjoy your premium features.`)

            if (isVendor) {
              // Update vendor profile
              await supabase.from('vendors').update({
                subscription_tier: tierField,
                subscription_end_date: subs[0].expires_at,
              }).eq('id', user.id)
            }

            setTimeout(() => void loadVendor(), 1000)
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Payment failed')
      setProcessing(false)
      setPolling(false)
    }
  }, [selectedPlan, phoneNumber, supabase, loadVendor])

  const comparisonFeatures = [
    { feature: 'Meal listings', freemium: 'Up to 10', premium: 'Unlimited' },
    { feature: 'Weekly orders', freemium: 'Up to 30', premium: 'Unlimited' },
    { feature: 'Homepage visibility', freemium: false, premium: true },
    { feature: 'Featured badge', freemium: false, premium: true },
    { feature: 'WhatsApp notifications', freemium: false, premium: true },
    { feature: 'SMS notifications', freemium: false, premium: true },
    { feature: 'Email notifications', freemium: false, premium: true },
    { feature: 'In-app notifications', freemium: false, premium: true },
    { feature: 'Advanced analytics', freemium: false, premium: true },
    { feature: 'Promotional campaigns', freemium: false, premium: true },
    { feature: 'Priority support', freemium: false, premium: true },
  ]

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
            Subscription
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs font-bold text-amber-600">
              <Sparkles size={12} /> {currentTier === 'premium' ? 'Premium' : 'Starter'}
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage your vendor subscription and unlock premium features.</p>
        </div>
        <button
          onClick={() => void loadVendor()}
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

      {/* Current status card */}
      <motion.div
        whileHover={{ y: -2 }}
        className="mb-8 rounded-[2rem] border border-slate-100 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-xl md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Current Plan</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              {currentTier === 'premium' ? 'Premium' : 'Starter (Free)'}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {vendor?.business_name || 'Your Vendor Account'}
            </p>
            {currentTier === 'freemium' && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {freemiumDaysLeft > 0 ? `${freemiumDaysLeft} days remaining in trial` : 'Trial ended'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {freemiumDaysLeft > 0 ? 'Upgrade to Premium to continue enjoying full features' : 'Your free trial has ended. Upgrade to continue.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/10">
              <p className="text-2xl font-black text-white">{vendor?.total_orders || 0}</p>
              <p className="text-xs font-semibold text-slate-400">Orders</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/10">
              <p className="text-2xl font-black text-white">KES {vendor?.total_earnings?.toFixed(0) || '0'}</p>
              <p className="text-xs font-semibold text-slate-400">Earnings</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/10">
              <p className="text-2xl font-black text-white">{vendor?.is_verified ? 'Yes' : 'No'}</p>
              <p className="text-xs font-semibold text-slate-400">Verified</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plans grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {VENDOR_PLANS.map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            isCurrentPlan={currentTier === plan.tier}
            isFreemiumActive={isFreemiumActive}
            freemiumDaysLeft={freemiumDaysLeft}
            onSelect={() => handleUpgrade(plan)}
            isProcessing={processing}
          />
        ))}
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

      {/* Feature comparison table */}
      <div className="mb-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Feature Comparison</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">What you get</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Starter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-slate-500">Premium</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {comparisonFeatures.map((row) => (
            <FeatureComparisonRow
              key={row.feature}
              feature={row.feature}
              freemium={row.freemium}
              premium={row.premium}
            />
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
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Crown size={28} />
                </div>
                <h3 className="text-center text-xl font-black text-slate-950">
                  Upgrade to {selectedPlan.display_name}
                </h3>
                <p className="mt-1 text-center text-sm text-slate-500">
                  Pay {formatMoney(selectedPlan.price_kes)} to activate premium features
                </p>
              </div>

              <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-600">Amount</p>
                <p className="text-3xl font-black text-amber-700">{formatMoney(selectedPlan.price_kes)}</p>
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <button
                onClick={() => void handlePayment()}
                disabled={processing || !phoneNumber.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
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