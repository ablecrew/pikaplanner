'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Sparkles, ArrowRight, Check, Star, Flame, ShoppingCart, ChefHat, Users,
  TrendingUp, Globe, Shield, Smartphone, BarChart3, MapPin, Truck, Calendar,
  UtensilsCrossed, Leaf, CheckCircle2, Coffee, Pizza, Cake, Waves, Smile,
  LifeBuoy, Rocket, Cookie, User, X, PenLine,
  ShieldCheck, ChevronLeft, ChevronRight, // 🆕 Added
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

// 🆕 Review system imports
import ReviewModal from '@/app/(public)/_components/reviews/ReviewModal'
import {
  fetchReviewsAction,
  fetchReviewStatsAction,
  type Review,
  type ReviewStats,
} from '@/app/(public)/_components/reviews/actions'

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1800
          const start = performance.now()
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(ease * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

function SectionLabel({ children, color = '#1A5C3A' }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full mb-4 border"
      style={{ background: `${color}12`, borderColor: `${color}25` }}
    >
      <span className="font-poppins font-bold text-[11.5px] uppercase tracking-[1px]" style={{ color }}>
        {children}
      </span>
    </div>
  )
}

const PREVIEW_MEALS = [
  { day: 'Monday', breakfast: 'Uji wa Unga', lunch: 'Ugali & Sukuma', dinner: 'Nyama Choma', cal: 1420 },
  { day: 'Tuesday', breakfast: 'Avocado Toast', lunch: 'Pilau Rice', dinner: 'Fish Curry', cal: 1380 },
  { day: 'Wednesday', breakfast: 'Scrambled Eggs', lunch: 'Chicken Tikka', dinner: 'Pasta Bolognese', cal: 1510 },
  { day: 'Thursday', breakfast: 'Mandazi & Chai', lunch: 'Ugali & Sukuma', dinner: 'Grilled Tilapia', cal: 1290 },
  { day: 'Friday', breakfast: 'Tropical Fruit Bowl', lunch: 'Pasta Napolitana', dinner: 'Nyama Choma', cal: 1460 },
]

const SLOT_COLORS = {
  breakfast: { bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' },
  lunch: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  dinner: { bg: '#DBEAFE', text: '#1E3A8A', dot: '#3B82F6' },
}

function MealPlanPreview() {
  const [activeDay, setActiveDay] = useState(0)
  const meal = PREVIEW_MEALS[activeDay]

  return (
    <div className="bg-white rounded-[20px] border border-emerald-500/[0.12] shadow-[0_24px_60px_rgba(26,92,58,0.12)] overflow-hidden">
      <div className="bg-gradient-to-r from-[#1A5C3A] to-emerald-500 px-5 py-4 flex justify-between items-center">
        <div>
          <p className="text-white font-poppins font-bold text-[15px]">Your Week&apos;s Plan</p>
          <p className="text-white/70 font-poppins text-[11.5px]">AI-curated • 1,400 kcal/day avg</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 rounded-[10px] px-2.5 py-1.5">
          <Sparkles size={13} className="text-white" />
          <span className="text-white font-poppins text-[11px] font-bold">AI Plan</span>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
        {PREVIEW_MEALS.map((m, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 px-3.5 py-2.5 border-b-2 font-poppins text-[12.5px] transition-all duration-150 ${
              activeDay === i
                ? 'border-emerald-500 text-[#1A5C3A] font-bold'
                : 'border-transparent text-gray-400 font-medium hover:text-gray-600'
            }`}
          >
            {m.day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="p-4">
        {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
          <div key={slot} className="flex items-center gap-3 p-3 rounded-[11px] mb-2" style={{ background: SLOT_COLORS[slot].bg }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SLOT_COLORS[slot].dot }} />
            <div className="flex-1 min-w-0">
              <p className="font-poppins font-bold text-[9.5px] uppercase tracking-[0.5px] mb-0.5" style={{ color: SLOT_COLORS[slot].text }}>
                {slot}
              </p>
              <p className="font-poppins font-semibold text-[13.5px] text-gray-900 truncate">{meal[slot]}</p>
            </div>
            <div className="font-poppins font-semibold text-[10px] bg-white/60 px-2 py-0.5 rounded-md" style={{ color: SLOT_COLORS[slot].text }}>
              {slot === 'breakfast' ? '~380' : slot === 'lunch' ? '~520' : '~500'} kcal
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center p-3 rounded-[11px] bg-[#F8FBF9] border border-emerald-500/[0.12]">
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-red-500" />
            <span className="font-poppins text-[12.5px] text-gray-500 font-medium">
              Total: <strong className="text-gray-900">{meal.cal} kcal</strong>
            </span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A5C3A] text-white font-poppins text-[11.5px] font-bold">
            <ShoppingCart size={11} /> Shop
          </button>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
  gradient,
}: {
  icon: any
  title: string
  desc: string
  color: string
  gradient: string
}) {
  return (
    <div className="group bg-white rounded-[18px] p-7 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-250 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
      <div className="w-[52px] h-[52px] rounded-[14px] mb-5 flex items-center justify-center" style={{ background: gradient }}>
        <Icon size={24} style={{ color }} />
      </div>
      <h3 className="font-poppins font-bold text-[17px] text-gray-900 mb-2.5 leading-snug">{title}</h3>
      <p className="font-poppins text-[13.5px] text-gray-500 leading-[1.65]">{desc}</p>
    </div>
  )
}

function ProcessStep({ num, title, desc, icon: Icon, color }: { num: string; title: string; desc: string; icon: any; color: string }) {
  return (
    <div className="flex gap-5 items-start">
      <div
        className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 6px 20px ${color}40` }}
      >
        <Icon size={22} className="text-white" />
      </div>
      <div className="pt-1">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="font-poppins font-extrabold text-[10.5px] tracking-[0.5px] px-2 py-0.5 rounded-lg" style={{ background: `${color}15`, color }}>
            {num}
          </span>
          <h3 className="font-poppins font-bold text-[17px] text-gray-900">{title}</h3>
        </div>
        <p className="font-poppins text-[13.5px] text-gray-500 leading-[1.65]">{desc}</p>
      </div>
    </div>
  )
}

// Fallback hardcoded testimonials (shown when no live reviews yet)
const TESTIMONIALS = [
  {
    name: 'Wanjiku Mwangi',
    role: 'Busy Professional, Nairobi',
    avatar: 'WM',
    color: '#1A5C3A',
    quote:
      'Pika Plan has completely changed how I eat. I save at least KES 3,000 a month on groceries and my meals are so much healthier!',
    stars: 5,
  },
  {
    name: 'James Ochieng',
    role: 'Student, University of Nairobi',
    avatar: 'JO',
    color: '#2D4B8E',
    quote:
      'As a student on a budget, this is a game-changer. I get nutritious meals planned for me and the shopping list saves me so much time.',
    stars: 5,
  },
  {
    name: 'Amina Hassan',
    role: 'Mother of 3, Mombasa',
    avatar: 'AH',
    color: '#C0392B',
    quote:
      'Feeding my family healthy food on a budget was stressful. Pika Plan gave me peace of mind and my kids actually love the meals!',
    stars: 5,
  },
]

function TestimonialCard({ t, featured = false }: { t: (typeof TESTIMONIALS)[0]; featured?: boolean }) {
  return (
    <div
      className={`rounded-[18px] p-6 transition-all duration-200 hover:-translate-y-1 ${
        featured
          ? 'bg-gradient-to-br from-[#1A5C3A] to-[#0d3d26] shadow-[0_20px_50px_rgba(26,92,58,0.3)]'
          : 'bg-white border border-black/[0.07] shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
      }`}
    >
      <div className="flex gap-0.5 mb-3.5">
        {Array.from({ length: t.stars }).map((_, i) => (
          <Star key={i} size={14} className="text-[#F4A535] fill-[#F4A535]" />
        ))}
      </div>
      <p className={`font-poppins text-sm leading-[1.7] mb-5 italic ${featured ? 'text-white/88' : 'text-gray-600'}`}>
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-poppins font-bold text-[13px] ${
            featured ? 'bg-white/20' : ''
          }`}
          style={!featured ? { background: t.color } : undefined}
        >
          {t.avatar}
        </div>
        <div>
          <p className={`font-poppins font-bold text-[13.5px] ${featured ? 'text-white' : 'text-gray-900'}`}>{t.name}</p>
          <p className={`font-poppins text-[11.5px] ${featured ? 'text-white/55' : 'text-gray-400'}`}>{t.role}</p>
        </div>
      </div>
    </div>
  )
}

const PLANS = [
  { tier: 'Free', price: 0, period: 'Forever', features: ['3 meals/week', 'Basic recipes', 'Shopping list'], highlight: false },
  {
    tier: 'Weekly',
    price: 50,
    period: '/week',
    features: ['Full week plan', 'All cuisines', 'AI suggestions', 'Vendor ordering'],
    highlight: true,
  },
  {
    tier: 'Monthly',
    price: 199,
    period: '/month',
    features: ['Full month plan', 'Priority support', 'Advanced analytics', 'All features'],
    highlight: false,
  },
]

const MARQUEE_ITEMS = [
  { icon: MapPin, label: 'Kenyan' },
  { icon: Waves, label: 'Swahili' },
  { icon: Pizza, label: 'Italian' },
  { icon: Globe, label: 'American' },
  { icon: Leaf, label: 'Healthy' },
  { icon: Cake, label: 'Occasion' },
  { icon: Coffee, label: 'Breakfast' },
  { icon: Flame, label: 'Dinner' },
  { icon: Cookie, label: 'Snacks' },
]

// 🆕 Now accepts initial review data from server wrapper
export default function LandingPage({
  initialReviews,
  initialStats,
}: {
  initialReviews: Review[]
  initialStats: ReviewStats
}) {
  const [email, setEmail] = useState('')
  const [featuredIdx, setFeaturedIdx] = useState(0)

  // 🆕 Live review system state
  const [liveReviews, setLiveReviews] = useState<Review[]>(initialReviews)
  const [liveStats, setLiveStats] = useState<ReviewStats>(initialStats)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [liveFeaturedIdx, setLiveFeaturedIdx] = useState(0)

  const hasLiveReviews = liveReviews.length > 0

  useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedIdx((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // 🆕 Auto-rotate live reviews carousel
  useEffect(() => {
    if (liveReviews.length <= 3) return
    const maxIdx = Math.max(0, liveReviews.length - 3)
    const timer = setInterval(() => {
      setLiveFeaturedIdx((prev) => (prev >= maxIdx ? 0 : prev + 1))
    }, 6000)
    return () => clearInterval(timer)
  }, [liveReviews.length])

  // 🆕 Refresh reviews after a new submission
  const handleReviewSuccess = async () => {
    try {
      const [freshReviews, freshStats] = await Promise.all([
        fetchReviewsAction({ limit: 12 }),
        fetchReviewStatsAction(),
      ])
      setLiveReviews(freshReviews)
      setLiveStats(freshStats)
    } catch (err) {
      console.error('Failed to refresh reviews:', err)
    }
  }

  const orderedTestimonials = [TESTIMONIALS[featuredIdx], ...TESTIMONIALS.filter((_, i) => i !== featuredIdx)]

  return (
    <>
      <Navbar />

      <div className="font-poppins bg-white overflow-x-hidden">
        {/* ── HERO ───────────────────────────────────────── */}
        <section
          className="relative min-h-screen flex items-center overflow-hidden pt-16"
          style={{ background: 'linear-gradient(145deg, #fff7ed 0%, #ecfdf5 40%, #f0fdf4 70%, #fff7ed 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-[0.28] saturate-[1.08] contrast-[1.05] scale-[1.03]"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547592180-85f173990554?w=1600&q=80')" }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(26,92,58,0.18) 0%, rgba(34,197,94,0.10) 28%, rgba(250,204,21,0.08) 58%, rgba(244,165,53,0.10) 100%)',
            }}
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 20%, rgba(13,31,19,0.10) 100%)' }} />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.45) 42%, rgba(255,255,255,0.10) 70%, transparent 100%)' }}
          />

          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(244,165,53,0.1) 0%, transparent 70%)' }} />
          <div className="absolute top-[30%] left-[45%] w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(26,92,58,0.06) 0%, transparent 70%)' }} />

          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-[580px]">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-emerald-500/20"
                  style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(244,165,53,0.08) 100%)' }}
                >
                  <Sparkles size={14} className="text-[#F4A535]" />
                  <span className="font-poppins font-bold text-[12.5px] text-[#1A5C3A] uppercase tracking-[0.8px]">AI-Powered Meal Planning</span>
                  <span className="bg-[#F4A535] text-white text-[9.5px] font-bold px-2 py-0.5 rounded-[10px]">NEW</span>
                </div>

                <h1 className="font-poppins font-black text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.12] text-[#0f1923] mb-6">
                  Smart Meal Plans{' '}
                  <span className="bg-gradient-to-r from-[#1A5C3A] via-emerald-500 to-emerald-400 bg-clip-text text-transparent">That Fit</span>{' '}
                  <span className="bg-gradient-to-r from-[#F4A535] to-[#e8921f] bg-clip-text text-transparent">Your Budget</span>
                </h1>

                <p className="font-poppins text-[17px] text-gray-600 leading-[1.7] mb-9 max-w-[500px]">
                  Plan smarter, eat better, and save money with personalized meal plans tailored to your lifestyle, culture, and preferences — from Ugali to Pasta.
                </p>

                <div className="flex gap-3 flex-wrap">
                  <Link
                    href="/signup"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-[14px] bg-gradient-to-r from-[#1A5C3A] to-emerald-500 text-white font-poppins font-bold text-[15px] shadow-[0_8px_24px_rgba(26,92,58,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(26,92,58,0.4)]"
                  >
                    <Sparkles size={17} />
                    Generate My Plan
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/pricing"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-[14px] bg-white text-gray-600 font-poppins font-semibold text-[15px] border-[1.5px] border-gray-200 transition-all duration-200 hover:border-[#1A5C3A] hover:text-[#1A5C3A]"
                  >
                    View Pricing
                  </Link>
                </div>

                <div className="flex items-center gap-5 mt-8 flex-wrap">
                  {[
                    { icon: MapPin, text: 'Built for Kenya' },
                    { icon: Shield, text: 'Secure & Private' },
                    { icon: Sparkles, text: 'Free to start' },
                  ].map(({ icon: BadgeIcon, text }) => (
                    <div key={text} className="flex items-center gap-1.5">
                      <BadgeIcon size={16} className="text-gray-500" />
                      <span className="font-poppins text-[12.5px] text-gray-500 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <MealPlanPreview />

                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  {[
                    { icon: Users, label: 'Happy Users', value: '10K+', color: '#1A5C3A', bg: '#D1FAE5' },
                    { icon: BarChart3, label: 'Meals Planned', value: '50K+', color: '#1E40AF', bg: '#DBEAFE' },
                    { icon: TrendingUp, label: 'Avg. Savings', value: 'KES 2K/mo', color: '#D97706', bg: '#FEF3C7' },
                    { icon: Star, label: 'Rating', value: '4.9', color: '#7C3AED', bg: '#EDE9FE' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                        <stat.icon size={17} style={{ color: stat.color }} />
                      </div>
                      <div>
                        <p className="font-poppins font-extrabold text-sm text-gray-900 leading-none mb-0.5">{stat.value}</p>
                        <p className="font-poppins text-[10.5px] text-gray-400 font-medium">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#1A5C3A] to-emerald-500 py-3.5 overflow-hidden">
          <div className="flex gap-8 whitespace-nowrap animate-[marquee_22s_linear_infinite]">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="flex-shrink-0 inline-flex items-center gap-2 text-white font-poppins font-semibold text-[13.5px]">
                <item.icon size={15} className="text-white/90" />
                {item.label}
                <span className="text-white/30 ml-2">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ───────────────────────────────────── */}
        <section className="py-24 px-6 bg-[#FAFAF9]">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-16">
              <SectionLabel>Why Choose Pika Plan</SectionLabel>
              <h2 className="font-poppins font-extrabold text-[clamp(1.9rem,4vw,2.8rem)] text-[#0f1923] mb-4 leading-tight">
                Everything you need to eat <span className="bg-gradient-to-r from-[#1A5C3A] to-emerald-500 bg-clip-text text-transparent">smarter</span>
              </h2>
              <p className="font-poppins text-base text-gray-500 max-w-[520px] mx-auto leading-[1.7]">
                Built specifically for the African lifestyle, with local cuisines, vendors, and budgets in mind.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Sparkles, title: 'AI Meal Planning', desc: 'Our AI curates personalized weekly plans based on your dietary needs, allergies, and taste preferences — from Ugali to Pasta.', color: '#1A5C3A', gradient: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' },
                { icon: ShoppingCart, title: 'Smart Shopping Lists', desc: 'Auto-generated, organized shopping lists with all quantities calculated. Save time and never forget an ingredient again.', color: '#F4A535', gradient: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' },
                { icon: Truck, title: 'Order from Vendors', desc: 'Too busy to cook? Order directly from verified local vendors who prepare your planned meals fresh.', color: '#1E40AF', gradient: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)' },
                { icon: TrendingUp, title: 'Budget Optimization', desc: "Track your food spending, get cost-per-meal breakdowns, and see exactly how much you're saving each week.", color: '#7C3AED', gradient: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)' },
                { icon: Globe, title: 'Diverse Cuisines', desc: 'From traditional Kenyan dishes to Italian classics — explore 200+ meals across 7 cuisine categories.', color: '#DC2626', gradient: 'linear-gradient(135deg, #FEE2E2, #FECACA)' },
                { icon: BarChart3, title: 'Nutrition Tracking', desc: 'Every meal comes with full nutritional data — calories, protein, carbs, and fat — to help you hit your health goals.', color: '#0891B2', gradient: 'linear-gradient(135deg, #CFFAFE, #A5F3FC)' },
                { icon: Smartphone, title: 'Works Everywhere', desc: 'Fully responsive on mobile, tablet, and desktop. Your meal plan is always in your pocket.', color: '#059669', gradient: 'linear-gradient(135deg, #D1FAE5, #6EE7B7)' },
                { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and never sold. Row-level security ensures only you can access your plans.', color: '#6B7280', gradient: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)' },
              ].map((feat, i) => (
                <FeatureCard key={i} {...feat} />
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────── */}
        <section className="py-24 px-6" style={{ background: 'linear-gradient(170deg, #fff7ed 0%, #ecfdf5 50%, #fff7ed 100%)' }}>
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-16">
              <SectionLabel color="#F4A535">How It Works</SectionLabel>
              <h2 className="font-poppins font-extrabold text-[clamp(1.9rem,4vw,2.8rem)] text-[#0f1923] leading-tight">
                Get started in <span className="bg-gradient-to-r from-[#F4A535] to-[#e8921f] bg-clip-text text-transparent">4 simple steps</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { num: '01', title: 'Tell Us About Yourself', icon: User, color: '#1A5C3A', desc: 'Share your dietary preferences, allergies, budget, and lifestyle. The more we know, the better your plan.' },
                { num: '02', title: 'Get Your Meal Plan', icon: Calendar, color: '#F4A535', desc: 'Receive a customized AI-generated meal plan with delicious local and international recipes.' },
                { num: '03', title: 'Generate Grocery List', icon: ShoppingCart, color: '#1E40AF', desc: 'One-click shopping list with all ingredients, quantities, and estimated costs. Shop smarter.' },
                { num: '04', title: 'Cook or Order', icon: ChefHat, color: '#7C3AED', desc: 'Follow easy recipes or order from verified local vendors. Healthy eating, your way.' },
              ].map((step, i) => (
                <ProcessStep key={i} {...step} />
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ──────────────────────────── */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-13">
              <SectionLabel>Why We&apos;re Different</SectionLabel>
              <h2 className="font-poppins font-extrabold text-[clamp(1.9rem,4vw,2.8rem)] text-[#0f1923] leading-tight">
                Pika Plan vs. the <span className="bg-gradient-to-r from-[#1A5C3A] to-emerald-500 bg-clip-text text-transparent">alternatives</span>
              </h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    {[
                      { label: 'Feature', icon: null },
                      { label: 'Pika Plan', icon: Leaf },
                      { label: 'Generic Apps', icon: Smartphone },
                      { label: 'Manual Planning', icon: Calendar },
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-4 py-3.5 font-poppins font-bold text-[13.5px] text-left ${
                          i === 1 ? 'bg-gradient-to-r from-[#1A5C3A] to-emerald-500 text-white rounded-t-2xl' : i === 0 ? 'bg-transparent text-gray-500' : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {h.icon && <h.icon size={14} className={i === 1 ? 'text-white' : 'text-gray-500'} />}
                          {h.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Kenyan cuisine support', true, false, false],
                    ['AI meal generation', true, 'partial', false],
                    ['Local vendor ordering', true, false, false],
                    ['Auto shopping list', true, 'partial', false],
                    ['Budget tracking', true, false, false],
                    ['Nutrition data', true, true, false],
                    ['M-Pesa payments', true, false, false],
                    ['Free tier available', true, true, false],
                  ].map(([feature, pika, generic, manual], ri) => (
                    <tr key={ri}>
                      {[feature, pika, generic, manual].map((cell, ci) => {
                        const isPika = ci === 1
                        return (
                          <td
                            key={ci}
                            className={`px-4 py-3 font-poppins border-b border-gray-100 ${
                              ci === 0 ? 'text-sm font-semibold text-gray-600' : 'text-[13px] text-gray-500'
                            } ${isPika ? (ri % 2 === 0 ? 'bg-emerald-500/[0.06]' : 'bg-emerald-500/[0.03]') : ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            {ci === 0 ? String(cell) : cell === true ? <Check size={16} className="text-emerald-500" /> : cell === false ? <X size={16} className="text-gray-200" /> : <span className="text-[#F4A535] text-xs font-semibold">Partial</span>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── STATS COUNTER ─────────────────────────────── */}
        <section className="py-20 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d3d26 0%, #1A5C3A 40%, #22c55e 100%)' }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(244,165,53,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)' }}
          />
          <div className="relative max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 10000, suffix: '+', label: 'Happy Users', icon: Smile },
              { value: 50000, suffix: '+', label: 'Meals Planned', icon: UtensilsCrossed },
              { value: 95, suffix: '%', label: 'Satisfaction Rate', icon: Star },
              { value: 24, suffix: '/7', label: 'Support Available', icon: LifeBuoy },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="w-[52px] h-[52px] rounded-[14px] bg-white/[0.12] flex items-center justify-center mx-auto mb-3">
                  <stat.icon size={26} className="text-white/85" />
                </div>
                <p className="font-poppins font-black text-[clamp(2rem,5vw,3rem)] text-white leading-none mb-1.5">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="font-poppins text-sm text-white/65 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 🆕 TESTIMONIALS — LIVE REVIEWS ────────────── */}
        <section className="py-24 px-6 bg-[#FAFAF9]">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-14">
              <SectionLabel>What Users Say</SectionLabel>
              <h2 className="font-poppins font-extrabold text-[clamp(1.9rem,4vw,2.8rem)] text-[#0f1923] mb-4">
                Loved by thousands across <span className="bg-gradient-to-r from-[#F4A535] to-[#e8921f] bg-clip-text text-transparent">Kenya</span>
              </h2>

              {/* 🆕 Live stats row */}
              {hasLiveReviews && liveStats.total > 0 && (
                <div className="mt-4 mb-2 inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={
                            s <= Math.round(liveStats.averageRating)
                              ? 'fill-[#F4A535] text-[#F4A535]'
                              : 'fill-gray-200 text-gray-200'
                          }
                        />
                      ))}
                    </div>
                    <span className="font-poppins font-black text-[15px] text-gray-900">
                      {liveStats.averageRating.toFixed(1)}
                    </span>
                    <span className="font-poppins text-[13px] text-gray-500">
                      ({liveStats.total.toLocaleString()} review{liveStats.total === 1 ? '' : 's'})
                    </span>
                  </div>

                  {liveStats.verifiedCount > 0 && (
                    <div className="flex items-center gap-1.5 text-[13px] font-poppins font-bold text-emerald-700">
                      <ShieldCheck size={13} />
                      {liveStats.verifiedCount.toLocaleString()} verified
                    </div>
                  )}

                  {liveStats.nps !== null && liveStats.nps > 0 && (
                    <div className="flex items-center gap-1.5 text-[13px] font-poppins font-bold text-violet-700">
                      <TrendingUp size={13} />
                      NPS {liveStats.nps}
                    </div>
                  )}
                </div>
              )}

              <div>
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-poppins font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg mt-2"
                  style={{ background: 'linear-gradient(135deg, rgba(26,92,58,0.85) 0%, rgba(244,165,53,0.85) 100%)' }}
                >
                  <PenLine size={15} />
                  Add Review
                </button>
              </div>
            </div>

            {/* 🆕 Live reviews carousel OR hardcoded fallback */}
            {hasLiveReviews ? (
              <LiveReviewsCarousel
                reviews={liveReviews}
                featuredIdx={liveFeaturedIdx}
                setFeaturedIdx={setLiveFeaturedIdx}
              />
            ) : (
              <>
                <div className="flex justify-center gap-2 mb-6">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFeaturedIdx(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
                        i === featuredIdx ? 'bg-[#1A5C3A] w-7' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {orderedTestimonials.map((t, i) => (
                    <TestimonialCard key={t.name} t={t} featured={i === 0} />
                  ))}
                </div>
              </>
            )}

            {/* 🆕 Top themes insights */}
            {hasLiveReviews && (liveStats.topLikes.length > 0 || liveStats.topImprovements.length > 0) && (
              <div className="mt-12 grid sm:grid-cols-2 gap-4">
                {liveStats.topLikes.length > 0 && (
                  <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5">
                    <p className="font-poppins font-extrabold text-[11px] uppercase tracking-[1px] text-[#126e3d] mb-3 flex items-center gap-1.5">
                      💚 What users love
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {liveStats.topLikes.map((like) => (
                        <span
                          key={like.tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 font-poppins text-xs font-bold text-emerald-700 capitalize"
                        >
                          {like.tag.replace(/_/g, ' ')}
                          <span className="text-emerald-500">{like.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {liveStats.topImprovements.length > 0 && (
                  <div className="rounded-2xl bg-orange-50/50 border border-orange-100 p-5">
                    <p className="font-poppins font-extrabold text-[11px] uppercase tracking-[1px] text-[#f97316] mb-3 flex items-center gap-1.5">
                      🚀 We're working on
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {liveStats.topImprovements.map((imp) => (
                        <span
                          key={imp.tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-orange-200 font-poppins text-xs font-bold text-orange-700 capitalize"
                        >
                          {imp.tag.replace(/_/g, ' ')}
                          <span className="text-orange-500">{imp.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────── */}
        <section className="py-24 px-6" style={{ background: 'linear-gradient(170deg, #ecfdf5 0%, #fff7ed 50%, #ecfdf5 100%)' }}>
          <div className="max-w-[960px] mx-auto">
            <div className="text-center mb-14">
              <SectionLabel>Simple Pricing</SectionLabel>
              <h2 className="font-poppins font-extrabold text-[clamp(1.9rem,4vw,2.8rem)] text-[#0f1923] mb-3.5 leading-tight">
                Plans that fit <span className="bg-gradient-to-r from-[#1A5C3A] to-emerald-500 bg-clip-text text-transparent">every budget</span>
              </h2>
              <p className="font-poppins text-[15px] text-gray-500">All prices in Kenyan Shillings. Pay via M-Pesa.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              {PLANS.map((plan) => (
                <div
                  key={plan.tier}
                  className={`rounded-[20px] transition-all duration-200 hover:-translate-y-1 relative ${
                    plan.highlight
                      ? 'bg-gradient-to-b from-[#1A5C3A] to-[#0d3d26] py-8 px-6 shadow-[0_24px_60px_rgba(26,92,58,0.3)]'
                      : 'bg-white py-7 px-6 border-[1.5px] border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#F4A535] to-[#e8921f] text-white rounded-full px-4 py-1 font-poppins text-[11px] font-extrabold uppercase tracking-[0.6px] whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  <p className={`font-poppins font-bold text-base mb-1.5 ${plan.highlight ? 'text-white/70' : 'text-gray-500'}`}>{plan.tier}</p>

                  <div className="flex items-baseline gap-1 mb-1.5">
                    {plan.price > 0 && <span className={`font-poppins font-semibold text-sm ${plan.highlight ? 'text-white/60' : 'text-gray-400'}`}>KES</span>}
                    <span className={`font-poppins font-black text-[38px] leading-none ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price === 0 ? 'Free' : plan.price}
                    </span>
                    <span className={`font-poppins text-[13px] ${plan.highlight ? 'text-white/55' : 'text-gray-400'}`}>{plan.period}</span>
                  </div>

                  <ul className="list-none p-0 my-5 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-center gap-2.5 font-poppins text-[13.5px] ${plan.highlight ? 'text-white/82' : 'text-gray-600'}`}>
                        <CheckCircle2 size={15} className={plan.highlight ? 'text-emerald-400' : 'text-emerald-500'} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`block text-center py-3 rounded-xl font-poppins font-bold text-sm transition-opacity duration-150 hover:opacity-90 ${
                      plan.highlight ? 'bg-gradient-to-r from-[#F4A535] to-[#e8921f] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {plan.price === 0 ? 'Start for Free' : `Get ${plan.tier} Plan`}
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center mt-6 font-poppins text-[13px] text-gray-400">
              Yearly plan available at KES 2,200 — save 33% vs monthly • <Link href="/pricing" className="text-[#1A5C3A] font-semibold">See all plans →</Link>
            </p>
          </div>
        </section>

        {/* ── EMAIL CAPTURE ─────────────────────────────── */}
        <section className="py-20 px-6 bg-white border-t border-gray-100">
          <div className="max-w-[580px] mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(244,165,53,0.08))' }}>
              <Rocket size={30} className="text-[#1A5C3A]" />
            </div>
            <h2 className="font-poppins font-extrabold text-[clamp(1.7rem,4vw,2.4rem)] text-[#0f1923] leading-snug mb-3.5">
              Ready to transform your meals?
            </h2>
            <p className="font-poppins text-[15px] text-gray-500 leading-[1.7] mb-8">
              Join thousands of users already saving time, money, and eating healthier.
              Start your free plan today — no credit card needed.
            </p>

            <div className="flex gap-2.5 max-w-[420px] mx-auto flex-wrap">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border-[1.5px] border-gray-200 font-poppins text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-emerald-500"
              />
              <Link
                href={`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-500 text-white font-poppins font-bold text-sm shadow-[0_6px_20px_rgba(26,92,58,0.28)] whitespace-nowrap"
              >
                Start Planning <ArrowRight size={15} />
              </Link>
            </div>

            <p className="mt-4 font-poppins text-xs text-gray-400">Free forever • No credit card • Cancel anytime</p>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────── */}
        <section className="py-20 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0d3d26 0%, #1A5C3A 40%, #15803d 80%, #0d3d26 100%)' }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(244,165,53,0.1) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 60%)' }}
          />

          <div className="relative max-w-[700px] mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-white/10 flex items-center justify-center">
              <Leaf size={30} className="text-emerald-400" />
            </div>
            <h2 className="font-poppins font-black text-[clamp(1.8rem,4vw,2.6rem)] text-white leading-tight mb-4">
              Smart Meals. <span className="bg-gradient-to-r from-emerald-400 to-[#F4A535] bg-clip-text text-transparent">Smart Living.</span>
            </h2>
            <p className="font-poppins text-base text-white/72 leading-[1.7] mb-9 max-w-[500px] mx-auto">
              Join thousands of Kenyans who have already transformed how they eat, shop, and live.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-gradient-to-r from-[#F4A535] to-[#e8921f] text-white font-poppins font-extrabold text-base shadow-[0_10px_30px_rgba(244,165,53,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(244,165,53,0.55)]"
            >
              <Sparkles size={18} />
              Create Your First Plan
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <Footer />
      </div>

      {/* 🆕 Review Modal */}
      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSuccess={handleReviewSuccess}
      />

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}

// 🆕 ─── Live Reviews Carousel ─────────────────────────────
function LiveReviewsCarousel({
  reviews,
  featuredIdx,
  setFeaturedIdx,
}: {
  reviews: Review[]
  featuredIdx: number
  setFeaturedIdx: (idx: number) => void
}) {
  const visibleCount = 3
  const maxIndex = Math.max(0, reviews.length - visibleCount)

  return (
    <>
      {/* Dots */}
      {reviews.length > visibleCount && (
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setFeaturedIdx(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
                i === featuredIdx ? 'bg-[#1A5C3A] w-7' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Carousel */}
      <div className="relative">
        {reviews.length > visibleCount && (
          <>
            <button
              onClick={() => setFeaturedIdx(Math.max(0, featuredIdx - 1))}
              disabled={featuredIdx === 0}
              className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous"
            >
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <button
              onClick={() => setFeaturedIdx(Math.min(maxIndex, featuredIdx + 1))}
              disabled={featuredIdx === maxIndex}
              className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next"
            >
              <ChevronRight size={18} className="text-gray-700" />
            </button>
          </>
        )}

        <div className="overflow-hidden">
          <div
            className="flex gap-5 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${featuredIdx * (100 / visibleCount)}%)` }}
          >
            {reviews.map((review, idx) => (
              <div
                key={review.id}
                className="flex-shrink-0 w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
              >
                <LiveReviewCard review={review} featured={idx === featuredIdx} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// 🆕 ─── Live Review Card (matches your existing style) ────
function LiveReviewCard({ review, featured }: { review: Review; featured: boolean }) {
  const initials = review.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const colors = ['#1A5C3A', '#2D4B8E', '#C0392B', '#D97706', '#7C3AED', '#0891B2']
  const colorIdx = review.display_name.charCodeAt(0) % colors.length
  const avatarColor = colors[colorIdx]

  return (
    <div
      className={`rounded-[18px] p-6 transition-all duration-200 hover:-translate-y-1 h-full flex flex-col ${
        featured
          ? 'bg-gradient-to-br from-[#1A5C3A] to-[#0d3d26] shadow-[0_20px_50px_rgba(26,92,58,0.3)]'
          : 'bg-white border border-black/[0.07] shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
      }`}
    >
      {/* Top: badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1">
          {review.is_verified && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                featured
                  ? 'bg-white/15 text-emerald-200 border border-white/20'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <ShieldCheck size={9} />
              Verified
            </span>
          )}
          {review.subscription_tier_at_review && review.subscription_tier_at_review !== 'free' && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                featured
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-300/30'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {review.subscription_tier_at_review}
            </span>
          )}
        </div>
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-3.5">
        {Array.from({ length: review.overall_rating }).map((_, i) => (
          <Star key={i} size={14} className="text-[#F4A535] fill-[#F4A535]" />
        ))}
        {Array.from({ length: 5 - review.overall_rating }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={14}
            className={featured ? 'text-white/20' : 'text-gray-200'}
          />
        ))}
      </div>

      {/* Title */}
      {review.title && (
        <h4
          className={`font-poppins font-bold text-sm leading-snug mb-2 line-clamp-1 ${
            featured ? 'text-white' : 'text-gray-900'
          }`}
        >
          {review.title}
        </h4>
      )}

      {/* Body */}
      <p
        className={`font-poppins text-sm leading-[1.7] mb-5 italic line-clamp-4 flex-1 ${
          featured ? 'text-white/88' : 'text-gray-600'
        }`}
      >
        &ldquo;{review.body}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 mt-auto">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-poppins font-bold text-[13px] ${
            featured ? 'bg-white/20' : ''
          }`}
          style={!featured ? { background: avatarColor } : undefined}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p
            className={`font-poppins font-bold text-[13.5px] truncate ${
              featured ? 'text-white' : 'text-gray-900'
            }`}
          >
            {review.display_name}
          </p>
          {review.display_role && (
            <p
              className={`font-poppins text-[11.5px] truncate ${
                featured ? 'text-white/55' : 'text-gray-400'
              }`}
            >
              {review.display_role}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}