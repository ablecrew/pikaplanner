'use client'

import { useState, useMemo, useCallback, useEffect, useTransition, type ComponentType, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Sparkles, CalendarDays, UtensilsCrossed, WandSparkles, PencilLine, ArrowRight, Clock3, Users, Flame, ChefHat, ListChecks, CheckCircle2, Loader2, RefreshCw, Copy, Share2, BookmarkPlus, ShoppingCart, Leaf, Drumstick, Salad, Sprout, Dumbbell, Scale, Coffee, Sandwich, Apple, Globe2, ShieldCheck, Crown, Plus, Lock, TrendingUp, Gauge, AlertCircle,
} from 'lucide-react'
import {
  MealGeneratorData, MealOption, DietaryPreference, MealSlot, SavedMealPreferences, SubscriptionInfo,
} from './actions'

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const CUISINE_OPTIONS = ['Kenyan', 'African', 'Continental', 'Mediterranean', 'Asian', 'Indian', 'Italian', 'Mexican']

const DIETARY_OPTIONS: Array<{ value: DietaryPreference; label: string; icon: ComponentType<{ size?: number; className?: string }>; helper: string }> = [
  { value: 'balanced', label: 'Balanced', icon: Scale, helper: 'Flexible everyday meals' },
  { value: 'low-carb', label: 'Low Carb', icon: Flame, helper: 'Lower-carb meal choices' },
  { value: 'vegetarian', label: 'Vegetarian', icon: Salad, helper: 'Plant-forward plans' },
  { value: 'keto', label: 'Keto', icon: Drumstick, helper: 'High-fat, low-carb' },
  { value: 'vegan', label: 'Vegan', icon: Sprout, helper: 'Fully plant-based' },
  { value: 'high-protein', label: 'High Protein', icon: Dumbbell, helper: 'More protein per meal' },
]

const SLOT_META: Record<MealSlot, { label: string; icon: ComponentType<{ size?: number; className?: string }>; badge: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, badge: 'bg-amber-100 text-amber-700' },
  lunch: { label: 'Lunch', icon: Sandwich, badge: 'bg-sky-100 text-sky-700' },
  dinner: { label: 'Dinner', icon: ChefHat, badge: 'bg-emerald-100 text-emerald-700' },
}

type GeneratedDayPlan = { day: string; breakfast: string; lunch: string; dinner: string; snacks: string[]; notes?: string }
type GeneratedPlan = { title: string; description?: string; days: GeneratedDayPlan[]; source?: 'ai' | 'fallback' | 'manual' }
type ManualDaySelection = { breakfastId: string; lunchId: string; dinnerId: string }

function clampNumber(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
function clampDays(value: number) { return clampNumber(Math.round(value), 3, 14) }
function normalizeText(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() }
function parseList(value: string): string[] { return value.split(',').map((item) => item.trim()).filter(Boolean) }
function toNumberOrUndefined(value: string): number | undefined { if (!value.trim()) return undefined; const num = Number(value); return Number.isFinite(num) ? num : undefined }
function formatMinutes(minutes: number) { const safe = Math.max(0, Math.round(minutes)); if (safe < 60) return `${safe} min`; const hrs = Math.floor(safe / 60); const mins = safe % 60; return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h` }
function estimateMealCalories(meal?: MealOption | null) { return meal?.calories && Number.isFinite(meal.calories) ? meal.calories : 400 }
function estimateMealPrep(meal?: MealOption | null) { return meal?.prepTime && Number.isFinite(meal.prepTime) ? meal.prepTime : 25 }

function mealFingerprint(meal: MealOption) {
  return normalizeText([meal.name, meal.description, meal.cuisine, meal.category, ...meal.tags, ...meal.ingredients.map((i) => i.name)].join(' '))
}

function mealMatchesDiet(meal: MealOption, diet: DietaryPreference) {
  const text = mealFingerprint(meal)
  const has = (terms: string[]) => terms.some((term) => text.includes(normalizeText(term)))
  switch (diet) {
    case 'vegetarian': return !has(['chicken', 'beef', 'salmon', 'fish', 'pork', 'turkey', 'shrimp', 'bacon', 'steak'])
    case 'vegan': return !has(['chicken', 'beef', 'salmon', 'fish', 'pork', 'turkey', 'shrimp', 'bacon', 'steak', 'egg', 'eggs', 'milk', 'cheese', 'yogurt', 'butter', 'honey'])
    case 'low-carb': return !has(['rice', 'pasta', 'bread', 'oats'])
    case 'keto': return has(['avocado', 'egg', 'eggs', 'salmon', 'chicken', 'beef', 'cheese', 'nuts', 'coconut']) && !has(['rice', 'pasta', 'bread', 'oats'])
    case 'high-protein': return has(['chicken', 'beef', 'fish', 'salmon', 'egg', 'eggs', 'tofu', 'lentil', 'yogurt'])
    default: return true
  }
}

function mealMatchesSlot(meal: MealOption, slot: MealSlot) {
  const text = mealFingerprint(meal)
  const slotKeywords: Record<MealSlot, string[]> = {
    breakfast: ['breakfast', 'morning', 'oat', 'porridge', 'egg', 'toast', 'pancake', 'smoothie', 'parfait'],
    lunch: ['lunch', 'bowl', 'wrap', 'salad', 'rice', 'sandwich', 'quinoa', 'pasta'],
    dinner: ['dinner', 'stew', 'curry', 'roast', 'grill', 'bake', 'salmon', 'chicken', 'tofu'],
  }
  return slotKeywords[slot].some((keyword) => text.includes(normalizeText(keyword)))
}

function slotOptions(meals: MealOption[], slot: MealSlot) {
  const filtered = meals.filter((meal) => mealMatchesSlot(meal, slot))
  return filtered.length > 0 ? filtered : meals
}

function matchMealByLabelInLibrary(label: string, meals: MealOption[]) {
  const target = normalizeText(label)
  if (!target) return null
  const direct = meals.find((meal) => normalizeText(meal.name) === target)
  if (direct) return direct
  return meals.find((meal) => mealFingerprint(meal).includes(target) || target.includes(normalizeText(meal.name))) ?? null
}

function adaptPlanToDays(plan: GeneratedPlan, targetDays: number): GeneratedPlan {
  const sourceDays = plan.days.length > 0 ? plan.days : []
  if (sourceDays.length === 0) {
    return { ...plan, days: Array.from({ length: targetDays }, (_, i) => ({ day: WEEKDAY_NAMES[i % 7], breakfast: 'Select a breakfast', lunch: 'Select a lunch', dinner: 'Select a dinner', snacks: ['Seasonal fruit'], notes: undefined })) }
  }
  if (sourceDays.length === targetDays) return plan
  return { ...plan, days: Array.from({ length: targetDays }, (_, i) => ({ ...sourceDays[i % sourceDays.length], day: `${sourceDays[i % sourceDays.length].day}${targetDays > sourceDays.length ? ` • Week ${Math.floor(i / sourceDays.length) + 1}` : ''}` })) }
}

function MealSlotCard({ slot, mealName, matchedMeal }: { slot: MealSlot; mealName: string; matchedMeal: MealOption | null }) {
  const cfg = SLOT_META[slot]
  const Icon = cfg.icon
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${cfg.badge}`}><Icon size={14} /></div>{cfg.label}
      </div>
      <p className="mt-3 text-sm font-bold text-slate-900 leading-snug">{mealName}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
        {matchedMeal ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1"><Flame size={11} className="text-[#f97316]" />{estimateMealCalories(matchedMeal)} kcal</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1"><Clock3 size={11} className="text-[#126e3d]" />{formatMinutes(estimateMealPrep(matchedMeal))}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1"><Globe2 size={11} className="text-slate-700" />{matchedMeal.cuisine}</span>
            {matchedMeal.ingredients.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1"><ListChecks size={11} className="text-[#1A5C3A]" />{matchedMeal.ingredients.length} ingredients</span>}
          </>
        ) : <span className="text-slate-500">No catalog match yet</span>}
      </div>
    </div>
  )
}

// ── 🆕 Subscription Gate (shown to non-subscribers) ───────────
const GATE_FEATURES = [
  { icon: WandSparkles, title: 'AI Meal Generation', description: 'Personalized 3-14 day plans generated from your preferences.', color: 'bg-violet-50 text-violet-600' },
  { icon: PencilLine, title: 'Manual Builder', description: 'Hand-pick exact meals from the curated catalogue.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: ShoppingCart, title: 'Auto Shopping Lists', description: 'Ingredient lists generated from your plan, ready to copy.', color: 'bg-orange-50 text-orange-600' },
  { icon: ChefHat, title: 'Premium Cuisines', description: 'Unlock all cuisines, dietary modes, and snacks.', color: 'bg-sky-50 text-sky-600' },
]

const GATE_PLANS = [
  { tier: 'daily',   label: 'Daily',   price: 17,    duration: 'per day',   popular: false },
  { tier: 'weekly',  label: 'Weekly',  price: 55,    duration: 'per week',  popular: true },
  { tier: 'monthly', label: 'Monthly', price: 199,   duration: 'per month', popular: false },
  { tier: 'yearly',  label: 'Yearly',  price: 2200,  duration: 'per year',  popular: false },
]

function SubscriptionGate({ subscription }: { subscription: SubscriptionInfo }) {
  const isExpired = !subscription.isActive && subscription.tier && subscription.tier !== 'free'

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f8faf8]">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] px-6 py-16 lg:py-20">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#32CD32]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#F4A535]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-2 text-xs font-black uppercase tracking-wider mb-4 text-white">
              {isExpired ? <Lock size={12} /> : <Crown size={12} className="text-[#F4A535]" />}
              {isExpired ? 'Subscription Expired' : 'Premium Feature'}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {isExpired ? 'Renew to keep generating' : 'Unlock the meal generator'}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-xl mx-auto">
              {isExpired
                ? `Your ${subscription.tier} plan has expired. Renew now to continue generating personalized meal plans.`
                : 'Subscribe to start generating personalized meal plans tailored to your preferences, dietary needs, and budget.'}
            </p>
            <Link
              href="/dashboard/user/subscription"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] px-7 py-4 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
            >
              <Sparkles size={16} />
              {isExpired ? 'Renew Subscription' : 'Start From KES 17/day'}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-black text-slate-950 mb-8 text-center">What you'll unlock</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {GATE_FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-emerald-300 hover:shadow-md transition">
                    <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                )
              })}
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-950 mb-6 text-center">Choose your plan</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {GATE_PLANS.map((plan) => (
                  <Link
                    key={plan.tier}
                    href="/dashboard/user/subscription"
                    className={`group relative rounded-2xl border-2 p-5 text-center transition hover:-translate-y-1 ${
                      plan.popular ? 'border-violet-300 bg-violet-50/30 hover:border-violet-400' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
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
                <Link href="/dashboard/user/subscription" className="inline-flex items-center gap-1.5 text-sm font-black text-[#126e3d] hover:underline">
                  View all plans & features <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}

// ── 🆕 Usage Meter Component ──────────────────────────────────
function UsageMeter({ subscription }: { subscription: SubscriptionInfo }) {
  const dailyUsagePercent =
    subscription.dailyLimit > 0
      ? Math.min(100, (subscription.generationsToday / subscription.dailyLimit) * 100)
      : 0

  const dailyRemaining = Math.max(0, subscription.dailyLimit - subscription.generationsToday)
  const periodRemaining = Math.max(0, subscription.periodLimit - subscription.generationsThisPeriod)
  const isNearDailyLimit = dailyRemaining <= 1 && subscription.dailyLimit > 1
  const isAtDailyLimit = dailyRemaining === 0
  const isUnlimited = subscription.periodLimit >= 9999

  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-[#126e3d]" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Generation Usage</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-black text-[#126e3d] uppercase">
            <Crown size={9} /> {subscription.tier} Plan
          </span>
        </div>
        {(isNearDailyLimit || isAtDailyLimit) && subscription.tier !== 'yearly' && (
          <Link
            href="/dashboard/user/subscription"
            className="inline-flex items-center gap-1 text-xs font-black text-[#f97316] hover:underline"
          >
            <TrendingUp size={11} /> Upgrade for more
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-600">Today</span>
            <span className={`text-xs font-black ${isAtDailyLimit ? 'text-red-600' : isNearDailyLimit ? 'text-amber-600' : 'text-slate-700'}`}>
              {subscription.generationsToday} / {subscription.dailyLimit === 999 ? '∞' : subscription.dailyLimit}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all rounded-full ${isAtDailyLimit ? 'bg-red-500' : isNearDailyLimit ? 'bg-amber-500' : 'bg-gradient-to-r from-[#32CD32] to-[#1A5C3A]'}`}
              style={{ width: subscription.dailyLimit === 999 ? '5%' : `${dailyUsagePercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">
            {subscription.dailyLimit === 999
              ? 'Unlimited generations today'
              : dailyRemaining > 0
                ? `${dailyRemaining} more generation${dailyRemaining === 1 ? '' : 's'} today`
                : 'Daily limit reached — resets at midnight'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-600">
              This {subscription.tier === 'daily' ? 'day' : subscription.tier === 'weekly' ? 'week' : subscription.tier === 'monthly' ? 'month' : 'year'}
            </span>
            <span className="text-xs font-black text-slate-700">
              {subscription.generationsThisPeriod} / {isUnlimited ? '∞' : subscription.periodLimit}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all rounded-full"
              style={{
                width: isUnlimited ? '5%' : `${Math.min(100, (subscription.generationsThisPeriod / subscription.periodLimit) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">
            {isUnlimited ? 'Unlimited generations' : `${periodRemaining} remaining this period`}
          </p>
        </div>
      </div>

      {subscription.daysRemaining > 0 && subscription.daysRemaining <= 3 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 font-semibold">
            Your plan expires in {subscription.daysRemaining} day{subscription.daysRemaining === 1 ? '' : 's'}.
            <Link href="/dashboard/user/subscription" className="ml-1 underline font-black">
              Renew now
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────
export default function MealGeneratorClient({ initialData }: { initialData: MealGeneratorData }) {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionInfo>(initialData.subscription)

  // 🆕 Gate non-subscribers entirely
  if (!subscription.isActive || !subscription.isPremium) {
    return <SubscriptionGate subscription={subscription} />
  }

  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [days, setDays] = useState(initialData.preferences?.days ? clampDays(initialData.preferences.days) : 7)
  const [diet, setDiet] = useState<DietaryPreference>(initialData.preferences?.diet || 'balanced')
  const [servings, setServings] = useState(initialData.preferences?.servings ? clampNumber(initialData.preferences.servings, 1, 12) : 4)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(initialData.preferences?.cuisines || [])
  const [dislikes, setDislikes] = useState(initialData.preferences?.dislikes?.join(', ') || '')
  const [allergies, setAllergies] = useState(initialData.preferences?.allergies?.join(', ') || '')
  const [budget, setBudget] = useState(initialData.preferences?.budget ? String(initialData.preferences.budget) : '')
  const [caloriesPerDay, setCaloriesPerDay] = useState(initialData.preferences?.caloriesPerDay ? String(initialData.preferences.caloriesPerDay) : '')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const [availableMeals] = useState<MealOption[]>(initialData.meals)
  const [manualSelections, setManualSelections] = useState<ManualDaySelection[]>([])
  const [isPremiumUser] = useState(initialData.isPremium)
  const [isPending, startTransition] = useTransition()

  // 🆕 Rate limit calculations
  const dailyRemaining = Math.max(0, subscription.dailyLimit - subscription.generationsToday)
  const isAtDailyLimit = dailyRemaining === 0

  useEffect(() => {
    if (infoMessage) {
      const timer = window.setTimeout(() => setInfoMessage(null), 3000)
      return () => window.clearTimeout(timer)
    }
  }, [infoMessage])

  const mealLibrary = useMemo(() => availableMeals, [availableMeals])
  const hasMeals = mealLibrary.length > 0

  const preferencePayload = useMemo(() => ({
    cuisines: selectedCuisines, dislikes: parseList(dislikes), allergies: parseList(allergies),
    budget: toNumberOrUndefined(budget), caloriesPerDay: toNumberOrUndefined(caloriesPerDay), mealsPerDay: 3, servings, days, diet,
  }), [selectedCuisines, dislikes, allergies, budget, caloriesPerDay, servings, days, diet])

  const preferredLibrary = useMemo(() => {
    const dislikesList = parseList(dislikes)
    const allergiesList = parseList(allergies)
    const calorieTarget = toNumberOrUndefined(caloriesPerDay)
    const matched = mealLibrary.filter((meal) => {
      const fp = mealFingerprint(meal)
      const cuisineOk = selectedCuisines.length === 0 || selectedCuisines.some((c) => fp.includes(normalizeText(c)))
      const blocked = [...dislikesList, ...allergiesList].some((term) => fp.includes(normalizeText(term)))
      const dietOk = mealMatchesDiet(meal, diet)
      const caloriesOk = !calorieTarget || meal.calories <= Math.ceil((calorieTarget / Math.max(1, 3)) * 1.35)
      return cuisineOk && !blocked && dietOk && caloriesOk
    })
    return matched.length > 0 ? matched : mealLibrary
  }, [mealLibrary, selectedCuisines, dislikes, allergies, caloriesPerDay, diet])

  const breakfastPool = useMemo(() => { const p = slotOptions(preferredLibrary, 'breakfast'); return p.length > 0 ? p : slotOptions(mealLibrary, 'breakfast') }, [preferredLibrary, mealLibrary])
  const lunchPool = useMemo(() => { const p = slotOptions(preferredLibrary, 'lunch'); return p.length > 0 ? p : slotOptions(mealLibrary, 'lunch') }, [preferredLibrary, mealLibrary])
  const dinnerPool = useMemo(() => { const p = slotOptions(preferredLibrary, 'dinner'); return p.length > 0 ? p : slotOptions(mealLibrary, 'dinner') }, [preferredLibrary, mealLibrary])
  const snackPool = useMemo(() => { const p = slotOptions(preferredLibrary, 'breakfast'); return p.length > 0 ? p : slotOptions(mealLibrary, 'breakfast') }, [preferredLibrary, mealLibrary])

  const dayLabels = useMemo(() => Array.from({ length: days }, (_, i) => days > 7 ? `${WEEKDAY_NAMES[i % 7]} • Week ${Math.floor(i / 7) + 1}` : WEEKDAY_NAMES[i % 7]), [days])

  useEffect(() => { setManualSelections((prev) => Array.from({ length: days }, (_, i) => prev[i] ?? { breakfastId: '', lunchId: '', dinnerId: '' })) }, [days])
  useEffect(() => {
    if (mode !== 'manual') return
    setManualSelections((prev) => {
      if (prev.some((s) => s.breakfastId || s.lunchId || s.dinnerId)) return prev
      return Array.from({ length: days }, (_, i) => ({ breakfastId: breakfastPool[i % breakfastPool.length]?.id ?? '', lunchId: lunchPool[i % lunchPool.length]?.id ?? '', dinnerId: dinnerPool[i % dinnerPool.length]?.id ?? '' }))
    })
  }, [mode, days, breakfastPool, lunchPool, dinnerPool])

  const matchMealByLabel = useCallback((label: string) => matchMealByLabelInLibrary(label, mealLibrary), [mealLibrary])

  const enrichedDays = useMemo(() => generatedPlan ? generatedPlan.days.map((day) => ({ ...day, breakfastMatch: matchMealByLabel(day.breakfast), lunchMatch: matchMealByLabel(day.lunch), dinnerMatch: matchMealByLabel(day.dinner) })) : [], [generatedPlan, matchMealByLabel])

  const shoppingList = useMemo(() => {
    if (!generatedPlan) return []
    const counter = new Map<string, number>()
    enrichedDays.forEach((day) => {
      ;[day.breakfastMatch, day.lunchMatch, day.dinnerMatch].forEach((meal) => {
        if (!meal) return
        meal.ingredients.forEach((i) => { if (i.name.trim()) counter.set(i.name.trim(), (counter.get(i.name.trim()) ?? 0) + 1) })
      })
    })
    return Array.from(counter.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [enrichedDays, generatedPlan])

  const planStats = useMemo(() => {
    if (!generatedPlan) return null
    const matchedMeals = enrichedDays.flatMap((day) => [day.breakfastMatch, day.lunchMatch, day.dinnerMatch].filter(Boolean) as MealOption[])
    const matchedCalories = matchedMeals.reduce((sum, meal) => sum + estimateMealCalories(meal), 0)
    const matchedPrep = matchedMeals.reduce((sum, meal) => sum + estimateMealPrep(meal), 0)
    return { matchedMeals: matchedMeals.length, estimatedCalories: matchedCalories > 0 ? matchedCalories : generatedPlan.days.length * 3 * 420, estimatedPrep: matchedPrep > 0 ? matchedPrep : generatedPlan.days.length * 3 * 25, shoppingItems: shoppingList.length, preferenceMatches: preferredLibrary.length }
  }, [enrichedDays, generatedPlan, preferredLibrary.length, shoppingList.length])

  const buildAutoSelections = useCallback(() => Array.from({ length: days }, (_, i) => ({ breakfastId: breakfastPool[i % breakfastPool.length]?.id ?? '', lunchId: lunchPool[i % lunchPool.length]?.id ?? '', dinnerId: dinnerPool[i % dinnerPool.length]?.id ?? '' })), [days, breakfastPool, lunchPool, dinnerPool])

  const updateManualSelection = (dayIndex: number, slot: MealSlot, mealId: string) => setManualSelections((prev) => { const next = [...prev]; next[dayIndex] = { ...next[dayIndex], [`${slot}Id`]: mealId }; return next })

  const buildManualPlan = useCallback((selections: ManualDaySelection[]): GeneratedPlan => {
    const daysData: GeneratedDayPlan[] = Array.from({ length: days }, (_, i) => {
      const selection = selections[i] ?? { breakfastId: '', lunchId: '', dinnerId: '' }
      const breakfast = mealLibrary.find((m) => m.id === selection.breakfastId) ?? breakfastPool[i % breakfastPool.length] ?? mealLibrary[0]
      const lunch = mealLibrary.find((m) => m.id === selection.lunchId) ?? lunchPool[i % lunchPool.length] ?? mealLibrary[0]
      const dinner = mealLibrary.find((m) => m.id === selection.dinnerId) ?? dinnerPool[i % dinnerPool.length] ?? mealLibrary[0]
      const snack = snackPool[i % snackPool.length] ?? mealLibrary[0]
      const notes: string[] = []
      if (selectedCuisines.length > 0) notes.push(`Cuisine focus: ${selectedCuisines[0]}`)
      notes.push(`Diet: ${diet}`)
      if (preferredLibrary.length > 0) notes.push(`${preferredLibrary.length} meals matched your filters`)
      return { day: dayLabels[i], breakfast: breakfast?.name ?? 'Select a breakfast', lunch: lunch?.name ?? 'Select a lunch', dinner: dinner?.name ?? 'Select a dinner', snacks: snack?.name ? [snack.name] : [], notes: notes.join(' · ') }
    })
    return { title: selectedCuisines.length > 0 ? `${selectedCuisines[0]} ${diet.replace('-', ' ')} Plan` : `${diet.replace('-', ' ')} Meal Plan`, description: 'Built from your database meal library and manual selections.', days: daysData, source: 'manual' }
  }, [days, mealLibrary, breakfastPool, lunchPool, dinnerPool, snackPool, selectedCuisines, diet, preferredLibrary.length, dayLabels])

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null); setInfoMessage(null); setShowUpgradePrompt(false)

    // 🆕 Client-side rate limit check (server enforces too)
    if (isAtDailyLimit) {
      setError(`You've reached your daily limit of ${subscription.dailyLimit} meal plan${subscription.dailyLimit === 1 ? '' : 's'}. Try again tomorrow or upgrade for higher limits.`)
      setShowUpgradePrompt(true)
      return
    }

    startTransition(async () => {
      setIsGenerating(true)
      try {
        if (mode === 'manual') {
          if (!hasMeals) throw new Error('No meals are available in the database yet.')
          const selections = manualSelections.some((s) => s.breakfastId || s.lunchId || s.dinnerId) ? manualSelections : buildAutoSelections()
          setGeneratedPlan(adaptPlanToDays(buildManualPlan(selections), days))
          setInfoMessage('Manual meal plan created successfully.')
        } else {
          const response = await fetch('/api/meal-plan/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferences: preferencePayload, isPremium: isPremiumUser }),
          })
          const result = await response.json()

          // 🆕 Handle subscription/rate limit errors from API
          if (response.status === 402 || result.reason === 'subscription_required') {
            setError(result.error || 'A subscription is required to generate AI meal plans.')
            setShowUpgradePrompt(true)
            setTimeout(() => router.push('/dashboard/user/subscription'), 4000)
            return
          }
          if (response.status === 429 || result.reason === 'rate_limit') {
            setError(result.error || 'Rate limit reached. Try again later or upgrade for more.')
            setShowUpgradePrompt(true)
            return
          }

          if (!response.ok || !result.success || !result.data) throw new Error(result.error || 'Failed to generate meal plan')
          setGeneratedPlan(adaptPlanToDays({ title: result.data.title, description: result.data.description, days: result.data.days, source: result.source ?? 'ai' }, days))
          setInfoMessage(result.source === 'fallback' ? 'Generated using your database meal library.' : 'AI meal plan generated successfully.')
        }
        window.setTimeout(() => document.getElementById('meal-plan-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 55)
      } catch (err: any) { setError(err.message) } finally { setIsGenerating(false) }
    })
  }

  const handleSavePlan = () => { if (!generatedPlan) return; try { localStorage.setItem('pikaplan:last-meal-plan', JSON.stringify(generatedPlan)); setInfoMessage('Meal plan saved to your browser.') } catch { setError('Could not save this plan.') } }
  const handleCopySummary = async () => { if (!generatedPlan) return; try { await navigator.clipboard.writeText(`PikaPlan Meal Plan\nTitle: ${generatedPlan.title}\nDays: ${generatedPlan.days.length}\nDiet: ${diet}\nServings: ${servings}\nCalories: ${planStats?.estimatedCalories ?? 'N/A'}`); setInfoMessage('Summary copied.') } catch { setError('Could not copy.') } }
  const handleSharePlan = async () => { if (!generatedPlan) return; try { if (navigator.share) await navigator.share({ title: generatedPlan.title, text: `PikaPlan: ${generatedPlan.title}` }); else { await navigator.clipboard.writeText(generatedPlan.title); setInfoMessage('Copied.') } } catch { setError('Could not share.') } }
  const handleReset = () => { setGeneratedPlan(null); setError(null); setInfoMessage(null); setShowUpgradePrompt(false) }

  const sourceLabel = generatedPlan?.source ?? (mode === 'manual' ? 'manual' : 'ai')
  const sourceMeta: Record<'ai' | 'fallback' | 'manual', { label: string; icon: ComponentType<{ size?: number; className?: string }>; className: string }> = {
    ai: { label: 'AI Generated', icon: Sparkles, className: 'bg-violet-50 text-violet-700 border-violet-200' },
    fallback: { label: 'Database Fallback', icon: ShieldCheck, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    manual: { label: 'Manual Builder', icon: PencilLine, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }
  const SourceIcon = sourceMeta[sourceLabel].icon
  const submitDisabled = isGenerating || isPending || (mode === 'manual' && !hasMeals) || (mode === 'ai' && isAtDailyLimit)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f8faf8]">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] px-6 py-16 lg:py-24">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2332CD32\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm"><Sparkles size={16} className="text-[#32CD32]" /><span className="text-sm font-medium text-white/90">AI-Powered Meal Planning</span></div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl" style={{ fontFamily: 'Poppins, sans-serif' }}>Generate Your Desired Meal Plan</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/80">Build a personalized meal plan from your onboarding preferences or craft one manually from your database meal library.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm"><CalendarDays size={14} className="text-[#32CD32]" />3 / 5 / 7 / 14 Day Plans</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm"><ListChecks size={14} className="text-[#32CD32]" />Shopping List Included</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F4A535]/20 backdrop-blur px-4 py-2 text-sm font-semibold text-white"><Crown size={14} className="text-[#F4A535]" />{subscription.tier} Plan Active</span>
            </div>
          </div>
        </section>

        <section className="-mt-8 px-6 py-12 lg:py-16">
          <div className="mx-auto max-w-6xl">
            {/* 🆕 Usage Meter */}
            <UsageMeter subscription={subscription} />

            {error && (
              <div className="mb-6 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span>{error}</span>
                  {showUpgradePrompt && (
                    <div className="mt-2">
                      <Link
                        href="/dashboard/user/subscription"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-black uppercase text-white transition"
                      >
                        <ArrowRight size={11} /> Upgrade Now
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            {infoMessage && <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {infoMessage}</div>}

            {!generatedPlan ? (
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl lg:p-10 relative">
                <form onSubmit={handleGenerate} className="space-y-8">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => setMode('ai')} className={`rounded-2xl border-2 p-5 text-left transition ${mode === 'ai' ? 'border-[#32CD32] bg-[#32CD32]/10 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mode === 'ai' ? 'bg-[#1A5C3A] text-white' : 'bg-slate-100 text-slate-500'}`}><WandSparkles size={18} /></div><div><p className="font-bold text-slate-900">AI Auto-Generate</p><p className="text-sm text-slate-500">Uses onboarding preferences and your catalog</p></div></div>
                    </button>
                    <button type="button" onClick={() => setMode('manual')} className={`rounded-2xl border-2 p-5 text-left transition ${mode === 'manual' ? 'border-[#32CD32] bg-[#32CD32]/10 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mode === 'manual' ? 'bg-[#1A5C3A] text-white' : 'bg-slate-100 text-slate-500'}`}><PencilLine size={18} /></div><div><p className="font-bold text-slate-900">Manual Builder</p><p className="text-sm text-slate-500">Pick exact meals for every day</p></div></div>
                    </button>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-2">
                    <div className="space-y-7">
                      <div><label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><CalendarDays className="h-4 w-4 text-[#126e3d]" />Plan Duration</label><select value={days} onChange={(e) => setDays(clampDays(Number(e.target.value)))} className="w-full cursor-pointer rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 font-medium text-slate-900 transition focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]"><option value={3}>3 Days</option><option value={5}>5 Days</option><option value={7}>7 Days</option><option value={14}>14 Days</option></select></div>
                      <div><label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Users className="h-4 w-4 text-[#126e3d]" />Servings</label><div className="flex items-center gap-4"><input type="range" min="1" max="12" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="h-2 flex-1 cursor-pointer appearance-none rounded-lg accent-[#32CD32]" /><div className="flex h-12 w-16 min-w-[4rem] items-center justify-center rounded-xl bg-[#126e3d] text-lg font-bold text-white">{servings}</div></div></div>
                      <div><label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><UtensilsCrossed className="h-4 w-4 text-[#126e3d]" />Dietary Preference</label><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{DIETARY_OPTIONS.map((option) => (<button key={option.value} type="button" onClick={() => setDiet(option.value)} className={`rounded-2xl border-2 p-3 text-left transition ${diet === option.value ? 'border-[#32CD32] bg-[#32CD32]/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}><div className="flex items-start gap-3"><div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${diet === option.value ? 'bg-[#1A5C3A] text-white' : 'bg-slate-100 text-slate-500'}`}><option.icon size={16} /></div><div><p className="text-sm font-bold text-slate-900">{option.label}</p><p className="text-xs text-slate-500">{option.helper}</p></div></div></button>))}</div></div>
                      <div><label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Globe2 className="h-4 w-4 text-[#126e3d]" />Preferred Cuisines</label><div className="flex flex-wrap gap-2">{CUISINE_OPTIONS.map((cuisine) => (<button key={cuisine} type="button" onClick={() => setSelectedCuisines((prev) => prev.includes(cuisine) ? prev.filter((item) => item !== cuisine) : [...prev, cuisine])} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedCuisines.includes(cuisine) ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#126e3d]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>{selectedCuisines.includes(cuisine) && <CheckCircle2 size={14} />}{cuisine}</button>))}</div></div>
                    </div>

                    <div className="space-y-7">
                      <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                        <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">Plan Summary</p><h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">What we'll use</h3></div><div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1A5C3A] ring-1 ring-slate-200">{preferredLibrary.length} matched meals</div></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Diet</p><p className="mt-1 text-sm font-bold text-slate-900">{DIETARY_OPTIONS.find((item) => item.value === diet)?.label ?? diet}</p></div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Servings</p><p className="mt-1 text-sm font-bold text-slate-900">{servings}</p></div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Budget</p><p className="mt-1 text-sm font-bold text-slate-900">{budget ? `KES ${Number(budget).toLocaleString('en-KE')}` : 'Optional'}</p></div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Calories</p><p className="mt-1 text-sm font-bold text-slate-900">{caloriesPerDay ? `${Number(caloriesPerDay).toLocaleString('en-KE')} / day` : 'Optional'}</p></div>
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"><Crown size={15} />{subscription.tier} Plan Active</div>
                      </div>
                      <div><label className="mb-2 block text-sm font-semibold text-slate-700">Dislikes</label><input value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="e.g. mushrooms, liver" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]" /></div>
                      <div><label className="mb-2 block text-sm font-semibold text-slate-700">Allergies</label><input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. nuts, dairy" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]" /></div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div><label className="mb-2 block text-sm font-semibold text-slate-700">Budget (KES)</label><input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Optional" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]" /></div>
                        <div><label className="mb-2 block text-sm font-semibold text-slate-700">Calories / Day</label><input type="number" value={caloriesPerDay} onChange={(e) => setCaloriesPerDay(e.target.value)} placeholder="Optional" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]" /></div>
                      </div>
                    </div>
                  </div>

                  {mode === 'manual' && (
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 lg:p-6">
                      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div><div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1A5C3A] ring-1 ring-slate-200"><ListChecks size={12} />Manual Builder</div><h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Select your meals day by day</h3></div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setManualSelections(buildAutoSelections())} disabled={!hasMeals} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><WandSparkles size={15} />Auto-fill</button>
                          <button type="button" onClick={() => setManualSelections(Array.from({ length: days }, () => ({ breakfastId: '', lunchId: '', dinnerId: '' })))} disabled={!hasMeals} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={15} />Reset</button>
                        </div>
                      </div>
                      {!hasMeals ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center"><ShoppingCart size={28} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No meals available yet</p></div>
                      ) : (
                        <div className="space-y-4">
                          {dayLabels.map((dayLabel, index) => (
                            <div key={dayLabel} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="mb-4 flex items-center justify-between gap-3"><h4 className="text-lg font-black text-slate-950">{dayLabel}</h4><div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><ShieldCheck size={12} />{preferredLibrary.length} matches</div></div>
                              <div className="grid gap-3 md:grid-cols-3">
                                {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => {
                                  const options = slot === 'breakfast' ? breakfastPool : slot === 'lunch' ? lunchPool : dinnerPool
                                  const value = slot === 'breakfast' ? manualSelections[index]?.breakfastId ?? '' : slot === 'lunch' ? manualSelections[index]?.lunchId ?? '' : manualSelections[index]?.dinnerId ?? ''
                                  return (
                                    <label key={slot} className="block">
                                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{SLOT_META[slot].label}</span>
                                      <select value={value} onChange={(e) => updateManualSelection(index, slot, e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]">
                                        <option value="">Choose a meal</option>
                                        {options.map((meal) => (<option key={meal.id} value={meal.id}>{meal.name} — {meal.cuisine} • {meal.calories} kcal</option>))}
                                      </select>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="submit" disabled={submitDisabled} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-5 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70">
                      {isGenerating || isPending ? <><Loader2 className="h-5 w-5 animate-spin" />Generating...</> :
                       mode === 'ai' && isAtDailyLimit ? <><Lock className="h-5 w-5" />Daily Limit Reached</> :
                       mode === 'ai' ? <><WandSparkles className="h-5 w-5" />Generate with AI</> :
                       !hasMeals ? <><ShieldCheck className="h-5 w-5" />Meals Not Ready</> :
                       <><PencilLine className="h-5 w-5" />Build Manual Plan</>}
                      {!isGenerating && !isPending && !isAtDailyLimit && <ArrowRight className="h-5 w-5" />}
                    </button>
                    <button type="button" onClick={handleReset} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"><RefreshCw className="h-5 w-5" />Clear Result</button>
                  </div>
                </form>
              </div>
            ) : (
              <div id="meal-plan-results" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl lg:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${sourceMeta[sourceLabel].className}`}><SourceIcon size={12} />{sourceMeta[sourceLabel].label}</div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"><CalendarDays size={12} />{generatedPlan.days.length} days</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"><Users size={12} />{servings} servings</span>
                      </div>
                      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{generatedPlan.title}</h2>
                      <p className="mt-2 text-slate-600">{generatedPlan.description ?? 'A personalized meal plan generated from your preferences.'}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#1A5C3A]/10 px-3 py-1 text-xs font-semibold text-[#1A5C3A]"><Leaf size={12} />{DIETARY_OPTIONS.find((item) => item.value === diet)?.label ?? diet}</span>
                        {selectedCuisines.map((cuisine) => (<span key={cuisine} className="inline-flex items-center gap-2 rounded-full bg-[#f4a535]/10 px-3 py-1 text-xs font-semibold text-[#a16207]"><Plus size={11} />{cuisine}</span>))}
                        {planStats && <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"><CheckCircle2 size={12} />{planStats.matchedMeals} matched meals</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <button onClick={handleSavePlan} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><BookmarkPlus size={15} />Save Plan</button>
                      <button onClick={handleCopySummary} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Copy size={15} />Copy Summary</button>
                      <button onClick={handleSharePlan} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Share2 size={15} />Share</button>
                      <button onClick={handleReset} className="inline-flex items-center gap-2 rounded-2xl bg-[#1A5C3A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#13462d]"><RefreshCw size={15} />Start Over</button>
                    </div>
                  </div>
                  {planStats && (
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estimated Calories</p><p className="mt-2 text-2xl font-black text-slate-950">{planStats.estimatedCalories.toLocaleString('en-KE')}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prep Time</p><p className="mt-2 text-2xl font-black text-slate-950">{formatMinutes(planStats.estimatedPrep)}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shopping Items</p><p className="mt-2 text-2xl font-black text-slate-950">{planStats.shoppingItems}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preference Matches</p><p className="mt-2 text-2xl font-black text-slate-950">{planStats.preferenceMatches}</p></div>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                  <div className="space-y-4">
                    {enrichedDays.map((day, index) => (
                      <div key={`${day.day}-${index}`} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Day {index + 1}</p><h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{day.day}</h3></div>
                          {day.notes && <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{day.notes}</div>}
                        </div>
                        <div className="grid gap-3 p-5 md:grid-cols-3">
                          <MealSlotCard slot="breakfast" mealName={day.breakfast} matchedMeal={day.breakfastMatch} />
                          <MealSlotCard slot="lunch" mealName={day.lunch} matchedMeal={day.lunchMatch} />
                          <MealSlotCard slot="dinner" mealName={day.dinner} matchedMeal={day.dinnerMatch} />
                        </div>
                        {day.snacks.length > 0 && (
                          <div className="border-t border-slate-100 px-5 py-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400"><Apple size={12} />Snacks</div>
                            <div className="flex flex-wrap gap-2">{day.snacks.map((snack) => (<span key={snack} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"><Apple size={12} className="text-[#1A5C3A]" />{snack}</span>))}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    <div className="sticky top-24 rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
                      <div className="mb-4 flex items-center gap-2.5"><ShoppingCart size={18} className="text-[#1A5C3A]" /><div><h3 className="font-bold text-slate-950">Shopping List</h3><p className="text-xs text-slate-500">Built from matched meal ingredients</p></div></div>
                      {shoppingList.length > 0 ? (
                        <div className="space-y-2">
                          {shoppingList.map((item) => (<div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"><span className="text-sm font-semibold text-slate-700">{item.name}</span><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#1A5C3A] ring-1 ring-slate-200">x{item.count}</span></div>))}
                          <button onClick={async () => { try { await navigator.clipboard.writeText(shoppingList.map((item) => `${item.name} x${item.count}`).join('\n')); setInfoMessage('Shopping list copied.') } catch { setError('Could not copy.') } }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Copy size={15} />Copy Shopping List</button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center"><ShoppingCart className="mx-auto mb-2 text-slate-300" size={28} /><p className="text-sm font-semibold text-slate-700">No shopping items available yet</p></div>
                      )}
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-[#1A5C3A] to-[#0f3b24] p-5 text-white shadow-lg">
                      <div className="flex items-center gap-2.5"><Sparkles size={18} className="text-[#F4A535]" /><h3 className="font-bold">Competitive Edge</h3></div>
                      <ul className="mt-4 space-y-3 text-sm text-white/85">
                        <li className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 text-[#32CD32]" />Auto-uses onboarding preferences for a personal touch.</li>
                        <li className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 text-[#32CD32]" />Manual builder lets customers choose exact meals.</li>
                        <li className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 text-[#32CD32]" />Shopping list is generated from matched meal ingredients.</li>
                        <li className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 text-[#32CD32]" />AI fallback still works if the model fails.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        <Footer />
      </div>
    </>
  )
}