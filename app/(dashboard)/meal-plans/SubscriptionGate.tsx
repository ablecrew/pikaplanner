import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Crown, Sparkles, Calendar, ChefHat, ShoppingCart, ArrowRight,
  Lock, Star, Zap, CheckCircle2,
} from 'lucide-react'
import type { SubscriptionStatus } from '@/lib/subscriptions/utils'

type Props = {
  status: SubscriptionStatus
}

export default function SubscriptionGate({ status }: Props) {
  const isExpired = !status.isActive && status.tier && status.tier !== 'free'
  const isFreeUser = status.isFree

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] p-8 md:p-12 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#32CD32]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#F4A535]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-black uppercase tracking-wider mb-4">
                {isExpired ? <Lock size={12} /> : <Crown size={12} className="text-[#F4A535]" />}
                {isExpired ? 'Subscription Expired' : 'Premium Feature'}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-3">
                {isExpired
                  ? 'Renew to keep generating meal plans'
                  : 'Unlock AI-powered meal planning'}
              </h1>

              <p className="text-white/80 leading-relaxed mb-8 max-w-xl">
                {isExpired
                  ? `Your ${status.tier} plan has expired. Renew now to continue creating personalized weekly meal plans tailored to your preferences, budget, and dietary needs.`
                  : 'Get personalized 7-day meal plans crafted by AI based on your dietary preferences, household size, and budget. Plus auto-generated shopping lists.'}
              </p>

              <Link
                href="/dashboard/user/subscription"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] px-7 py-3.5 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
              >
                <Sparkles size={16} />
                {isExpired ? 'Renew Subscription' : 'Start From KES 14/day'}
                <ArrowRight size={16} />
              </Link>

              <p className="mt-3 text-xs text-white/60">
                Daily, weekly, monthly, or yearly plans available
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <section className="mt-10">
            <h2 className="text-2xl font-black text-slate-950 mb-6 text-center">
              What you get with a subscription
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300 hover:shadow-md transition"
                  >
                    <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Pricing Preview */}
          <section className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-950 mb-6 text-center">
              Choose your plan
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLANS.map((plan) => (
                <Link
                  key={plan.tier}
                  href="/dashboard/user/subscription"
                  className={`group relative rounded-2xl border-2 p-5 text-center transition hover:-translate-y-1 ${
                    plan.popular
                      ? 'border-violet-300 bg-violet-50/30 hover:border-violet-400'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[9px] font-black uppercase tracking-wider">
                      Popular
                    </div>
                  )}
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{plan.label}</p>
                  <p className="text-2xl font-black text-slate-950">KES {plan.price}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{plan.duration}</p>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/dashboard/user/subscription"
                className="inline-flex items-center gap-1.5 text-sm font-black text-[#126e3d] hover:underline"
              >
                View all plans & features <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          {/* Testimonial / Social Proof */}
          <section className="mt-10 text-center">
            <div className="inline-flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-[#F4A535] text-[#F4A535]" />
              ))}
            </div>
            <p className="text-sm text-slate-600 italic max-w-md mx-auto">
              "Pika Plan saves me hours every week. I just generate the plan and let the AI do the
              thinking. Highly recommend for busy Kenyan families."
            </p>
            <p className="mt-2 text-xs font-bold text-slate-500">— Sarah K., Nairobi</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ── Data ──────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Calendar,
    title: 'AI-Powered 7-Day Plans',
    description: 'Personalized meal plans generated in seconds based on your preferences.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: ChefHat,
    title: 'Diverse Cuisines',
    description: 'Kenyan, African, Indian, Italian, Asian, and more — variety guaranteed.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: ShoppingCart,
    title: 'Auto Shopping Lists',
    description: 'Generated grocery lists from your meal plan. Never forget ingredients.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Budget Tracking',
    description: 'Set a weekly budget and get meals that fit within it.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Sparkles,
    title: 'Nutrition Insights',
    description: 'Calories, protein, carbs, and fat tracked for every meal.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: CheckCircle2,
    title: 'Cancel Anytime',
    description: 'No long-term commitments. Cancel or pause your plan with one click.',
    color: 'bg-rose-50 text-rose-600',
  },
]

const PLANS = [
  { tier: 'daily',   label: 'Daily',   price: 17,    duration: 'per day',   popular: false },
  { tier: 'weekly',  label: 'Weekly',  price: 55,    duration: 'per week',  popular: true },
  { tier: 'monthly', label: 'Monthly', price: 199,   duration: 'per month', popular: false },
  { tier: 'yearly',  label: 'Yearly',  price: 2200,  duration: 'per year',  popular: false },
]