'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles, Calendar, ChevronRight, Flame, Clock, Plus, RefreshCw, Zap,
  ShieldCheck, Loader2, AlertCircle, CheckCircle2, Coffee, Sun, MoonStar,
  Heart, ArrowRight, PackagePlus, UtensilsCrossed, Info,
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  MealPlanPageData, MealPlan, MealEntry, UserPreferences,
  fetchMealPlanData, generateAIPlanAction,
} from './actions'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
type DayKey = typeof DAYS[number]

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const

// ── Helpers ────────────────────────────────────────────────
/** Convert a date string to a day label ("Mon"|"Tue"...). */
function getDayLabelFromDate(dateValue?: string | null): DayKey | '' {
  if (!dateValue) return ''
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return ''
  const js = d.getDay() // 0=Sun ... 6=Sat
  return DAYS[js === 0 ? 6 : js - 1]
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

function sortByMealCategory(a: MealEntry, b: MealEntry) {
  const ai = MEAL_ORDER.indexOf((a.meal_category ?? '').toLowerCase() as typeof MEAL_ORDER[number])
  const bi = MEAL_ORDER.indexOf((b.meal_category ?? '').toLowerCase() as typeof MEAL_ORDER[number])
  return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
}

// ── Component ──────────────────────────────────────────────
export default function MealPlansClient({ initialData }: { initialData: MealPlanPageData }) {
  const [plan, setPlan] = useState<MealPlan | null>(initialData.plan)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(initialData.preferences)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Auto-dismiss banners
  useEffect(() => {
    if (!error && !successMessage && !infoMessage) return
    const t = setTimeout(() => {
      setError(null)
      setSuccessMessage(null)
      setInfoMessage(null)
    }, 6000)
    return () => clearTimeout(t)
  }, [error, successMessage, infoMessage])

  const refreshData = async () => {
    const data = await fetchMealPlanData()
    setPlan(data.plan)
    setUserPreferences(data.preferences)
    return data
  }

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        await refreshData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh')
      }
    })
  }

  const generateAIPlan = () => {
    startTransition(async () => {
      setError(null)
      setSuccessMessage(null)
      setInfoMessage(null)

      try {
        const result = await generateAIPlanAction(userPreferences)

        if (!result.success) {
          setError(result.message)
          return
        }

        // Re-fetch the new plan from the DB
        const data = await refreshData()

        console.log('[generateAIPlan] New plan:', data.plan)
        console.log('[generateAIPlan] Entries count:', data.plan?.meal_plan_entries?.length)

        if (!data.plan || !data.plan.meal_plan_entries?.length) {
          setError(
            'The plan was generated but no meals were saved. Please check the server logs or contact support.'
          )
          return
        }

        if (result.source === 'fallback') {
          setInfoMessage(result.message ?? 'Plan built from our curated library.')
        } else {
          setSuccessMessage('New AI meal plan generated successfully.')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate AI plan')
      }
    })
  }

  // Group ALL entries by day, sorted by meal category
  const dayMap = useMemo(() => {
    const map: Record<DayKey, MealEntry[]> = {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
    }
    const entries = plan?.meal_plan_entries ?? []
    for (const e of entries) {
      const key = getDayLabelFromDate(e.scheduled_date)
      if (key) map[key].push(e)
    }
    for (const day of DAYS) map[day].sort(sortByMealCategory)
    return map
  }, [plan])

  const filledDays = useMemo(
    () => DAYS.filter((day) => dayMap[day].length > 0).length,
    [dayMap]
  )

  const totalCalories = useMemo(() =>
    DAYS.reduce((sum, day) => {
      return sum + dayMap[day].reduce((daySum, e) => {
        return daySum + (e.meals?.calories_per_serving ?? 0)
      }, 0)
    }, 0),
    [dayMap]
  )

  const totalPrepTime = useMemo(() =>
    DAYS.reduce((sum, day) => {
      return sum + dayMap[day].reduce((daySum, e) => {
        return daySum + (e.meals?.prep_time_minutes ?? 0) + (e.meals?.cook_time_minutes ?? 0)
      }, 0)
    }, 0),
    [dayMap]
  )

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
                <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                  {plan?.title || 'My Meal Plans'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/75 md:text-base">
                  AI-powered nutrition tailored to your preferences, budget, and household. Regenerate anytime for fresh variety.
                </p>
                {plan?.is_ai_generated !== undefined && (
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/60">
                    {plan.is_ai_generated ? '✨ AI-Generated Plan' : '📚 Curated Plan'}
                  </p>
                )}
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

        {/* Banners */}
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
        )}
        {infoMessage && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-800">
            <Info size={18} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-semibold">{infoMessage}</span>
          </div>
        )}

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Calendar size={20} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{filledDays}/7</p>
                <p className="text-sm font-bold text-gray-500">Days planned</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Flame size={20} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{totalCalories > 0 ? totalCalories.toLocaleString() : '-'}</p>
                <p className="text-sm font-bold text-gray-500">Total kcal</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Clock size={20} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{totalPrepTime > 0 ? `${totalPrepTime} min` : '-'}</p>
                <p className="text-sm font-bold text-gray-500">Total prep time</p>
              </div>
            </div>
          </div>
        </section>

        {/* Preference Chips */}
        {preferenceChips.length > 0 && (
          <section className="mb-6 flex flex-wrap gap-2">
            {preferenceChips.map((chip) => (
              <span key={chip} className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-black text-[#126e3d]">{chip}</span>
            ))}
          </section>
        )}

        {/* Weekly Grid — shows ALL meals per day */}
        {isPending && !plan ? (
          <div className="mb-8 flex min-h-[320px] items-center justify-center rounded-3xl border border-gray-100 bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#126e3d]" />
              <p className="text-sm font-bold text-gray-500">Loading your meal plan...</p>
            </div>
          </div>
        ) : (
          <section className="mb-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {DAYS.map((day) => {
                const entries = dayMap[day]
                const isFilled = entries.length > 0

                return (
                  <div
                    key={day}
                    className={`flex flex-col rounded-2xl border p-4 transition-all ${
                      isFilled
                        ? 'border-emerald-100 bg-white shadow-sm hover:shadow-md'
                        : 'border-dashed border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        isFilled ? 'text-[#126e3d]' : 'text-gray-400'
                      }`}>
                        {day}
                      </span>
                      {isFilled && (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-[#126e3d]">
                          {entries.length}
                        </span>
                      )}
                    </div>

                    {isFilled ? (
                      <div className="flex-1 space-y-3">
                        {entries.map((entry) => {
                          const mealName = entry.meals?.name || 'No meal'
                          const calories = entry.meals?.calories_per_serving
                          const prepTime = entry.meals?.prep_time_minutes ?? 0
                          const cookTime = entry.meals?.cook_time_minutes ?? 0
                          const totalMinutes = prepTime + cookTime
                          const cuisine = entry.meals?.cuisine
                          const mealCategory = entry.meal_category || ''
                          const MealIcon = getMealTypeIcon(mealCategory)

                          return (
                            <div key={entry.id} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
                              <div className="mb-1 flex items-center gap-1.5">
                                <MealIcon className="h-3 w-3 text-[#f97316]" />
                                <p className="text-[10px] font-bold text-gray-500 uppercase">
                                  {getMealTypeName(mealCategory)}
                                </p>
                              </div>
                              <p className="text-sm font-black leading-tight text-slate-900 line-clamp-2">
                                {mealName}
                              </p>
                              <div className="mt-1.5 space-y-0.5 text-[10px] font-semibold text-gray-500">
                                {calories ? (
                                  <p className="flex items-center gap-1">
                                    <Flame size={10} className="text-[#f97316]" />{calories} kcal
                                  </p>
                                ) : null}
                                {totalMinutes > 0 && (
                                  <p className="flex items-center gap-1">
                                    <Clock size={10} className="text-[#126e3d]" />{totalMinutes} min
                                  </p>
                                )}
                                {cuisine && (
                                  <p className="flex items-center gap-1">
                                    <Zap size={10} className="text-[#32CD32]" />{cuisine}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-center py-6">
                        <Plus size={20} className="text-gray-300" />
                      </div>
                    )}

                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] transition-all duration-500 ${
                        isFilled ? 'w-full' : 'w-0'
                      }`} />
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0fdf4]">
              <Calendar size={30} className="text-[#126e3d]" />
            </div>
            <p className="text-lg font-black text-gray-900">No meal plan yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-gray-500">
              Generate your first AI-powered meal plan based on your dietary preferences, budget, and household size.
            </p>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0fdf4] text-[#126e3d]">
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles size={22} />}
              </div>
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
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                Our AI analyzes your dietary preferences, cuisine tastes, budget, and household size to generate a personalized weekly plan.
                You can regenerate anytime for fresh variety or adjust meals manually after generation.
              </p>
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