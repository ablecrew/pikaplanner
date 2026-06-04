'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Sparkles, Calendar, ChevronRight, Flame, Clock, Plus, RefreshCw, Zap,
  ShieldCheck, Loader2, AlertCircle, CheckCircle2, Coffee, Sun, MoonStar,
  Heart, ArrowRight, PackagePlus, UtensilsCrossed,
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import { 
  MealPlanPageData, MealPlan, MealEntry, UserPreferences, 
  fetchMealPlanData, generateAIPlanAction 
} from './actions'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPE_ICONS: Record<string, typeof Coffee> = {
  breakfast: Coffee, lunch: Sun, dinner: MoonStar, snack: Heart,
}

function normalizeDay(value?: string | null) {
  if (!value) return ''
  const lower = value.toLowerCase().trim()
  if (lower.startsWith('mon')) return 'Mon'
  if (lower.startsWith('tue')) return 'Tue'
  if (lower.startsWith('wed')) return 'Wed'
  if (lower.startsWith('thu')) return 'Thu'
  if (lower.startsWith('fri')) return 'Fri'
  if (lower.startsWith('sat')) return 'Sat'
  if (lower.startsWith('sun')) return 'Sun'
  return ''
}

function getDayLabelFromDate(dateValue?: string | null) {
  if (!dateValue) return ''
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return ''
  return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

function getMealTypeName(type?: string | null) {
  if (!type) return 'Meal'
  const lower = type.toLowerCase()
  if (lower.includes('breakfast')) return 'Breakfast'
  if (lower.includes('lunch')) return 'Lunch'
  if (lower.includes('dinner')) return 'Dinner'
  if (lower.includes('snack')) return 'Snack'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function getMealTypeIcon(type?: string | null) {
  if (!type) return UtensilsCrossed
  const lower = type.toLowerCase()
  if (lower.includes('breakfast')) return Coffee
  if (lower.includes('lunch')) return Sun
  if (lower.includes('dinner')) return MoonStar
  if (lower.includes('snack')) return Heart
  return UtensilsCrossed
}

export default function MealPlansClient({ initialData }: { initialData: MealPlanPageData }) {
  const [plan, setPlan] = useState<MealPlan | null>(initialData.plan)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(initialData.preferences)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const data = await fetchMealPlanData()
        setPlan(data.plan)
        setUserPreferences(data.preferences)
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const generateAIPlan = () => {
    startTransition(async () => {
      setError(null)
      setSuccessMessage(null)
      try {
        await generateAIPlanAction(userPreferences)
        setSuccessMessage('New AI meal plan generated successfully.')
        // Fetch the newly generated plan
        const data = await fetchMealPlanData()
        setPlan(data.plan)
      } catch (err: any) {
        setError(err.message || 'Failed to generate AI plan')
      }
    })
  }

  const dayMap = useMemo(() => {
    const map: Record<string, MealEntry | null> = { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null, Sun: null }
    const entries = plan?.meal_plan_entries || []
    for (const e of entries) {
      const fromDay = normalizeDay(e.day_of_week)
      const fromDate = getDayLabelFromDate(e.planned_date)
      const key = fromDay || fromDate
      if (key && !map[key]) map[key] = e
    }
    return map
  }, [plan])

  const filledDays = useMemo(() => DAYS.filter((day) => dayMap[day] !== null).length, [dayMap])
  
  const totalCalories = useMemo(() => DAYS.reduce((sum, day) => {
    const entry = dayMap[day]
    return sum + (entry?.meals?.calories_per_serving ?? entry?.calories ?? 0)
  }, 0), [dayMap])
  
  const totalPrepTime = useMemo(() => DAYS.reduce((sum, day) => {
    const entry = dayMap[day]
    return sum + (entry?.meals?.prep_time_minutes ?? 0) + (entry?.meals?.cook_time_minutes ?? 0)
  }, 0), [dayMap])

  const preferenceChips = useMemo(() => [
    ...(userPreferences?.dietary_preferences ?? []),
    ...(userPreferences?.cuisine_preferences ?? []),
    userPreferences?.budget_range ? `Budget: ${userPreferences.budget_range}` : null,
    userPreferences?.household_size ? `${userPreferences.household_size} people` : null,
  ].filter(Boolean).slice(0, 6) as string[], [userPreferences])

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
                  <Calendar className="h-4 w-4 text-[#32CD32]" /> AI Meal Planning
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">My Meal Plans</h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/75 md:text-base">
                  AI-powered nutrition tailored to your preferences, budget, and household. Regenerate anytime for fresh variety.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleRefresh} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/15 disabled:opacity-50">
                  <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} /> Refresh
                </button>
                <button onClick={generateAIPlan} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#ea580c] disabled:opacity-60">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isPending ? 'Generating...' : 'Generate New Plan'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {error && <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700"><AlertCircle size={16} /><span className="text-sm font-semibold">{error}</span></div>}
        {successMessage && <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700"><CheckCircle2 size={16} /><span className="text-sm font-semibold">{successMessage}</span></div>}

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Calendar size={20} /></div><div><p className="text-2xl font-black text-slate-900">{filledDays}/7</p><p className="text-sm font-bold text-gray-500">Days planned</p></div></div></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Flame size={20} /></div><div><p className="text-2xl font-black text-slate-900">{totalCalories > 0 ? totalCalories : '-'}</p><p className="text-sm font-bold text-gray-500">Total kcal</p></div></div></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Clock size={20} /></div><div><p className="text-2xl font-black text-slate-900">{totalPrepTime > 0 ? `${totalPrepTime} min` : '-'}</p><p className="text-sm font-bold text-gray-500">Total prep time</p></div></div></div>
        </section>

        {/* Preference Chips */}
        {preferenceChips.length > 0 && (
          <section className="mb-6 flex flex-wrap gap-2">
            {preferenceChips.map((chip) => (<span key={chip} className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-black text-[#126e3d]">{chip}</span>))}
          </section>
        )}

        {/* Weekly Grid */}
        {isPending && !plan ? (
          <div className="mb-8 flex min-h-[320px] items-center justify-center rounded-3xl border border-gray-100 bg-white">
            <div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-[#126e3d]" /><p className="text-sm font-bold text-gray-500">Loading your meal plan...</p></div>
          </div>
        ) : (
          <section className="mb-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
              {DAYS.map((day) => {
                const entry = dayMap[day]
                const mealName = entry?.meals?.name || 'No meal'
                const calories = entry?.meals?.calories_per_serving ?? entry?.calories
                const prepTime = entry?.meals?.prep_time_minutes ?? 0
                const cookTime = entry?.meals?.cook_time_minutes ?? 0
                const totalMinutes = prepTime + cookTime
                const cuisine = entry?.meals?.cuisine
                const mealType = entry?.meal_type || ''
                const MealIcon = getMealTypeIcon(mealType)
                const isFilled = entry !== null

                return (
                  <div key={day} className={`group flex flex-col rounded-2xl border p-4 transition-all ${isFilled ? 'border-emerald-100 bg-white shadow-sm hover:shadow-md' : 'border-dashed border-gray-200 bg-gray-50/50'}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isFilled ? 'text-[#126e3d]' : 'text-gray-400'}`}>{day}</span>
                      {isFilled && <MealIcon className="h-4 w-4 text-[#f97316]" />}
                    </div>
                    {isFilled ? (
                      <div className="flex-1 space-y-2">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase">{getMealTypeName(mealType)}</p>
                        <p className="text-sm font-black leading-tight text-slate-900 line-clamp-2">{mealName}</p>
                        <div className="mt-2 space-y-1.5 text-[11px] font-semibold text-gray-500">
                          {calories && <p className="flex items-center gap-1.5"><Flame size={12} className="text-[#f97316]" />{calories} kcal</p>}
                          {totalMinutes > 0 && <p className="flex items-center gap-1.5"><Clock size={12} className="text-[#126e3d]" />{totalMinutes} min</p>}
                          {cuisine && <p className="flex items-center gap-1.5"><Zap size={12} className="text-[#32CD32]" />{cuisine}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-center"><Plus size={20} className="text-gray-300" /></div>
                    )}
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] transition-all duration-500 ${isFilled ? 'w-full' : 'w-0'}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isPending && filledDays === 0 && (
          <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0fdf4]"><Calendar size={30} className="text-[#126e3d]" /></div>
            <p className="text-lg font-black text-gray-900">No meal plan yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-gray-500">Generate your first AI-powered meal plan based on your dietary preferences, budget, and household size.</p>
            <button onClick={generateAIPlan} disabled={isPending} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#126e3d] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f5c33] disabled:opacity-60">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate My First Plan
            </button>
          </section>
        )}

        {/* Action Buttons */}
        {filledDays > 0 && (
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/shopping" className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#126e3d]"><PackagePlus size={22} /></div>
              <div><p className="text-sm font-black text-slate-900">Add to Shopping List</p><p className="text-xs font-medium text-gray-500">Generate ingredients from this plan</p></div>
              <ChevronRight size={18} className="ml-auto text-gray-400" />
            </Link>
            <Link href="/recipes" className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f97316]"><UtensilsCrossed size={22} /></div>
              <div><p className="text-sm font-black text-slate-900">View Full Recipes</p><p className="text-xs font-medium text-gray-500">See ingredients and cooking steps</p></div>
              <ChevronRight size={18} className="ml-auto text-gray-400" />
            </Link>
            <button onClick={generateAIPlan} disabled={isPending} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md disabled:opacity-60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#126e3d]">{isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles size={22} />}</div>
              <div><p className="text-sm font-black text-slate-900">Regenerate Plan</p><p className="text-xs font-medium text-gray-500">Get fresh meal ideas instantly</p></div>
              <ArrowRight size={18} className="ml-auto text-gray-400" />
            </button>
          </section>
        )}

        {/* Info Card */}
        <section className="rounded-[32px] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#f97316]"><ShieldCheck size={22} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900">How AI Meal Planning Works</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">Our AI analyzes your dietary preferences, cuisine tastes, budget, and household size to generate a personalized weekly plan. You can regenerate anytime for fresh variety or adjust meals manually after generation.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-bold text-[#126e3d]">Dietary-aware</span>
                <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-bold text-[#f97316]">Budget-optimized</span>
                <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-bold text-[#2563eb]">Household-sized</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}