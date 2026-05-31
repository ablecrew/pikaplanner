'use client'

import { useCallback, useEffect, useMemo, useState, type ComponentType, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Sparkles,
  CalendarDays,
  UtensilsCrossed,
  WandSparkles,
  PencilLine,
  ArrowRight,
  Clock3,
  Users,
  Flame,
  ChefHat,
  ListChecks,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Copy,
  Share2,
  BookmarkPlus,
  ShoppingCart,
  Leaf,
  Drumstick,
  Salad,
  Sprout,
  Dumbbell,
  Scale,
  Coffee,
  Sandwich,
  Apple,
  Globe2,
  ShieldCheck,
  Crown,
  Plus,
} from 'lucide-react'

type DietaryPreference = 'balanced' | 'low-carb' | 'vegetarian' | 'keto' | 'vegan' | 'high-protein'
type MealSlot = 'breakfast' | 'lunch' | 'dinner'

type MealIngredient = { name: string; amount?: string }

type MealOption = {
  id: string
  name: string
  description: string
  servings: number
  calories: number
  prepTime: number
  cuisine: string
  category: string
  ingredients: MealIngredient[]
  steps: string[]
  tags: string[]
  image?: string | null
}

type GeneratedDayPlan = {
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snacks: string[]
  notes?: string
}

type GeneratedPlan = {
  title: string
  description?: string
  days: GeneratedDayPlan[]
  source?: 'ai' | 'fallback' | 'manual'
}

type ManualDaySelection = {
  breakfastId: string
  lunchId: string
  dinnerId: string
}

type SavedMealPreferences = {
  cuisines?: string[]
  dislikes?: string[]
  allergies?: string[]
  budget?: number | string
  caloriesPerDay?: number | string
  mealsPerDay?: number
  diet?: DietaryPreference
  servings?: number
  days?: number
}

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const CUISINE_OPTIONS = [
  'Kenyan',
  'African',
  'Continental',
  'Mediterranean',
  'Asian',
  'Indian',
  'Italian',
  'Mexican',
]

const DIETARY_OPTIONS: Array<{
  value: DietaryPreference
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  helper: string
}> = [
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

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampDays(value: number) {
  return clampNumber(Math.round(value), 3, 14)
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toNumberOrUndefined(value: string): number | undefined {
  if (!value.trim()) return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

function normalizeStringArray(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((item) => String(item)).filter(Boolean)

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean)
    } catch {
      // ignore
    }

    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeIngredients(input: unknown): MealIngredient[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (typeof item === 'string') {
          return { name: item.trim() } satisfies MealIngredient
        }

        if (item && typeof item === 'object' && 'name' in item) {
          const ingredient = item as { name?: unknown; amount?: unknown }
          return {
            name: String(ingredient.name ?? '').trim(),
            amount: ingredient.amount != null ? String(ingredient.amount) : undefined,
          } satisfies MealIngredient
        }

        return null
      })
      .filter(Boolean) as MealIngredient[]
  }

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      return normalizeIngredients(parsed)
    } catch {
      return input
        .split(',')
        .map((item) => ({ name: item.trim() }))
        .filter((item) => item.name.length > 0)
    }
  }

  return []
}

function normalizeMealRecord(raw: Record<string, unknown>): MealOption {
  const name = String(raw.name ?? raw.title ?? 'Untitled meal')
  const description = String(raw.description ?? '')
  const caloriesRaw = Number(raw.calories_per_serving ?? raw.calories ?? 400)
  const prepTimeRaw = Number(raw.preparation_time_minutes ?? raw.prep_time_minutes ?? raw.prepTime ?? 25)

  return {
    id: String(raw.id ?? name),
    name,
    description,
    servings: Number(raw.servings ?? 1) || 1,
    calories: Number.isFinite(caloriesRaw) ? caloriesRaw : 400,
    prepTime: Number.isFinite(prepTimeRaw) ? prepTimeRaw : 25,
    cuisine: String(raw.cuisine ?? 'Various'),
    category: String(raw.category ?? 'General'),
    ingredients: normalizeIngredients(raw.ingredients),
    steps: normalizeStringArray(raw.steps),
    tags: normalizeStringArray(raw.tags),
    image: raw.image_url ? String(raw.image_url) : raw.image ? String(raw.image) : null,
  }
}

function dedupeMeals(meals: MealOption[]) {
  const seen = new Set<string>()
  return meals.filter((meal) => {
    const key = normalizeText(meal.name)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function mealFingerprint(meal: MealOption) {
  return normalizeText(
    [
      meal.name,
      meal.description,
      meal.cuisine,
      meal.category,
      ...meal.tags,
      ...meal.ingredients.map((ingredient) => ingredient.name),
    ].join(' ')
  )
}

function mealMatchesDiet(meal: MealOption, diet: DietaryPreference) {
  const text = mealFingerprint(meal)

  const has = (terms: string[]) => terms.some((term) => text.includes(normalizeText(term)))

  switch (diet) {
    case 'vegetarian':
      return !has(['chicken', 'beef', 'salmon', 'fish', 'pork', 'turkey', 'shrimp', 'bacon', 'steak'])
    case 'vegan':
      return !has([
        'chicken',
        'beef',
        'salmon',
        'fish',
        'pork',
        'turkey',
        'shrimp',
        'bacon',
        'steak',
        'egg',
        'eggs',
        'milk',
        'cheese',
        'yogurt',
        'butter',
        'honey',
      ])
    case 'low-carb':
      return !has(['rice', 'pasta', 'bread', 'oats'])
    case 'keto':
      return has(['avocado', 'egg', 'eggs', 'salmon', 'chicken', 'beef', 'cheese', 'nuts', 'coconut']) &&
        !has(['rice', 'pasta', 'bread', 'oats'])
    case 'high-protein':
      return has(['chicken', 'beef', 'fish', 'salmon', 'egg', 'eggs', 'tofu', 'lentil', 'yogurt'])
    default:
      return true
  }
}

function mealMatchesSlot(meal: MealOption, slot: MealSlot) {
  const text = mealFingerprint(meal)

  const slotKeywords: Record<MealSlot, string[]> = {
    breakfast: ['breakfast', 'morning', 'oat', 'porridge', 'egg', 'toast', 'pancake', 'smoothie', 'parfait'],
    lunch: ['lunch', 'bowl', 'wrap', 'salad', 'rice', 'sandwich', 'quinoa', 'pasta'],
    dinner: ['dinner', 'stew', 'curry', 'roast', 'grill', 'bake', 'salmon', 'chicken', 'tofu'],
  }

  const keywords = slotKeywords[slot]
  return keywords.some((keyword) => text.includes(normalizeText(keyword)))
}

function slotOptions(meals: MealOption[], slot: MealSlot) {
  const filtered = meals.filter((meal) => mealMatchesSlot(meal, slot))
  return filtered.length > 0 ? filtered : meals
}

function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.round(minutes))
  if (safe < 60) return `${safe} min`
  const hrs = Math.floor(safe / 60)
  const mins = safe % 60
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

function estimateMealCalories(meal?: MealOption | null) {
  return meal?.calories && Number.isFinite(meal.calories) ? meal.calories : 400
}

function estimateMealPrep(meal?: MealOption | null) {
  return meal?.prepTime && Number.isFinite(meal.prepTime) ? meal.prepTime : 25
}

function matchMealByLabelInLibrary(label: string, meals: MealOption[]) {
  const target = normalizeText(label)
  if (!target) return null

  const direct = meals.find((meal) => normalizeText(meal.name) === target)
  if (direct) return direct

  const loose = meals.find((meal) => {
    const fp = mealFingerprint(meal)
    return fp.includes(target) || target.includes(normalizeText(meal.name))
  })

  return loose ?? null
}

function adaptPlanToDays(plan: GeneratedPlan, targetDays: number): GeneratedPlan {
  const sourceDays = plan.days.length > 0 ? plan.days : []

  if (sourceDays.length === 0) {
    const emptyDays = Array.from({ length: targetDays }, (_, index) => ({
      day: WEEKDAY_NAMES[index % 7],
      breakfast: 'Select a breakfast',
      lunch: 'Select a lunch',
      dinner: 'Select a dinner',
      snacks: ['Seasonal fruit'],
      notes: undefined,
    }))

    return { ...plan, days: emptyDays }
  }

  if (sourceDays.length === targetDays) return plan

  const normalized = Array.from({ length: targetDays }, (_, index) => {
    const base = sourceDays[index % sourceDays.length]
    const weekSuffix = targetDays > sourceDays.length ? ` • Week ${Math.floor(index / sourceDays.length) + 1}` : ''
    return {
      ...base,
      day: `${base.day}${weekSuffix}`,
    }
  })

  return { ...plan, days: normalized }
}

function MealSlotCard({
  slot,
  mealName,
  matchedMeal,
}: {
  slot: MealSlot
  mealName: string
  matchedMeal: MealOption | null
}) {
  const cfg = SLOT_META[slot]
  const Icon = cfg.icon

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${cfg.badge}`}>
          <Icon size={14} />
        </div>
        {cfg.label}
      </div>

      <p className="mt-3 text-sm font-bold text-slate-900 leading-snug">{mealName}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
        {matchedMeal ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">
              <Flame size={11} className="text-[#f97316]" />
              {estimateMealCalories(matchedMeal)} kcal
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">
              <Clock3 size={11} className="text-[#126e3d]" />
              {formatMinutes(estimateMealPrep(matchedMeal))}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">
              <Globe2 size={11} className="text-slate-700" />
              {matchedMeal.cuisine}
            </span>
            {matchedMeal.ingredients.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1">
                <ListChecks size={11} className="text-[#1A5C3A]" />
                {matchedMeal.ingredients.length} ingredients
              </span>
            )}
          </>
        ) : (
          <span className="text-slate-500">No catalog match yet</span>
        )}
      </div>
    </div>
  )
}

export default function MealGeneratorPage() {
  const supabase = useMemo(() => createClient(), [])

  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [days, setDays] = useState(7)
  const [diet, setDiet] = useState<DietaryPreference>('balanced')
  const [servings, setServings] = useState(4)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [dislikes, setDislikes] = useState('')
  const [allergies, setAllergies] = useState('')
  const [budget, setBudget] = useState('')
  const [caloriesPerDay, setCaloriesPerDay] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const [availableMeals, setAvailableMeals] = useState<MealOption[]>([])
  const [mealsLoading, setMealsLoading] = useState(true)
  const [manualSelections, setManualSelections] = useState<ManualDaySelection[]>([])
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  const refreshMeals = useCallback(async () => {
    setMealsLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('meals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(120)

      if (fetchError) throw fetchError

      const dbMeals = (data ?? []).map((row: Record<string, unknown>) => normalizeMealRecord(row as Record<string, unknown>))
      setAvailableMeals(dedupeMeals(dbMeals))
    } catch (err) {
      setAvailableMeals([])
      setError(err instanceof Error ? err.message : 'Failed to load meals from the database.')
    } finally {
      setMealsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void refreshMeals()
  }, [refreshMeals])

  useEffect(() => {
    const timer = window.setTimeout(() => setInfoMessage(null), 3000)
    return () => window.clearTimeout(timer)
  }, [infoMessage])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile || cancelled) return

        const rawPrefs = (profile as { meal_preferences?: unknown; subscription_tier?: string }).meal_preferences
        let prefs: SavedMealPreferences | null = null

        if (rawPrefs && typeof rawPrefs === 'object') {
          prefs = rawPrefs as SavedMealPreferences
        } else if (typeof rawPrefs === 'string') {
          try {
            prefs = JSON.parse(rawPrefs) as SavedMealPreferences
          } catch {
            prefs = null
          }
        }

        if (prefs) {
          if (Array.isArray(prefs.cuisines)) setSelectedCuisines(prefs.cuisines.filter(Boolean))
          if (Array.isArray(prefs.dislikes)) setDislikes(prefs.dislikes.join(', '))
          if (Array.isArray(prefs.allergies)) setAllergies(prefs.allergies.join(', '))
          if (prefs.budget != null) setBudget(String(prefs.budget))
          if (prefs.caloriesPerDay != null) setCaloriesPerDay(String(prefs.caloriesPerDay))
          if (prefs.diet) setDiet(prefs.diet)
          if (prefs.servings) setServings(clampNumber(Number(prefs.servings), 1, 12))
          if (prefs.days) setDays(clampDays(Number(prefs.days)))
        }

        setIsPremiumUser((profile as { subscription_tier?: string }).subscription_tier === 'premium')
      } catch {
        // no-op
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [supabase])

  const mealLibrary = useMemo(() => dedupeMeals([...availableMeals]), [availableMeals])
  const hasMeals = mealLibrary.length > 0

  const preferencePayload = useMemo(() => {
    const dislikesList = parseList(dislikes)
    const allergiesList = parseList(allergies)

    return {
      cuisines: selectedCuisines,
      dislikes: dislikesList,
      allergies: allergiesList,
      budget: toNumberOrUndefined(budget),
      caloriesPerDay: toNumberOrUndefined(caloriesPerDay),
      mealsPerDay: 3,
      servings,
      days,
      diet,
    }
  }, [selectedCuisines, dislikes, allergies, budget, caloriesPerDay, servings, days, diet])

  const preferredLibrary = useMemo(() => {
    const dislikesList = parseList(dislikes)
    const allergiesList = parseList(allergies)
    const calorieTarget = toNumberOrUndefined(caloriesPerDay)

    const matched = mealLibrary.filter((meal) => {
      const fp = mealFingerprint(meal)

      const cuisineOk =
        selectedCuisines.length === 0 ||
        selectedCuisines.some((cuisine) => fp.includes(normalizeText(cuisine)))

      const blocked = [...dislikesList, ...allergiesList].some((term) => fp.includes(normalizeText(term)))
      const dietOk = mealMatchesDiet(meal, diet)

      const caloriesOk =
        !calorieTarget ||
        meal.calories <= Math.ceil((calorieTarget / Math.max(1, 3)) * 1.35)

      return cuisineOk && !blocked && dietOk && caloriesOk
    })

    return matched.length > 0 ? matched : mealLibrary
  }, [mealLibrary, selectedCuisines, dislikes, allergies, caloriesPerDay, diet])

  const breakfastPoolPreferred = useMemo(() => slotOptions(preferredLibrary, 'breakfast'), [preferredLibrary])
  const lunchPoolPreferred = useMemo(() => slotOptions(preferredLibrary, 'lunch'), [preferredLibrary])
  const dinnerPoolPreferred = useMemo(() => slotOptions(preferredLibrary, 'dinner'), [preferredLibrary])
  const snackPoolPreferred = useMemo(() => slotOptions(preferredLibrary, 'breakfast'), [preferredLibrary])

  const breakfastPool = breakfastPoolPreferred.length > 0 ? breakfastPoolPreferred : slotOptions(mealLibrary, 'breakfast')
  const lunchPool = lunchPoolPreferred.length > 0 ? lunchPoolPreferred : slotOptions(mealLibrary, 'lunch')
  const dinnerPool = dinnerPoolPreferred.length > 0 ? dinnerPoolPreferred : slotOptions(mealLibrary, 'dinner')
  const snackPool = snackPoolPreferred.length > 0 ? snackPoolPreferred : slotOptions(mealLibrary, 'breakfast')

  const dayLabels = useMemo(
    () =>
      Array.from({ length: days }, (_, index) => {
        const base = WEEKDAY_NAMES[index % 7]
        return days > 7 ? `${base} • Week ${Math.floor(index / 7) + 1}` : base
      }),
    [days]
  )

  useEffect(() => {
    setManualSelections((prev) =>
      Array.from({ length: days }, (_, index) => prev[index] ?? { breakfastId: '', lunchId: '', dinnerId: '' })
    )
  }, [days])

  useEffect(() => {
    if (mode !== 'manual') return

    setManualSelections((prev) => {
      const hasAny = prev.some((selection) => selection.breakfastId || selection.lunchId || selection.dinnerId)
      if (hasAny) return prev

      return Array.from({ length: days }, (_, index) => ({
        breakfastId: breakfastPool[index % breakfastPool.length]?.id ?? '',
        lunchId: lunchPool[index % lunchPool.length]?.id ?? '',
        dinnerId: dinnerPool[index % dinnerPool.length]?.id ?? '',
      }))
    })
  }, [mode, days, breakfastPool, lunchPool, dinnerPool])

  const matchMealByLabel = useCallback(
    (label: string) => matchMealByLabelInLibrary(label, mealLibrary),
    [mealLibrary]
  )

  const enrichedDays = useMemo(() => {
    if (!generatedPlan) return []

    return generatedPlan.days.map((day) => ({
      ...day,
      breakfastMatch: matchMealByLabel(day.breakfast),
      lunchMatch: matchMealByLabel(day.lunch),
      dinnerMatch: matchMealByLabel(day.dinner),
    }))
  }, [generatedPlan, matchMealByLabel])

  const shoppingList = useMemo(() => {
    if (!generatedPlan) return []

    const counter = new Map<string, number>()

    enrichedDays.forEach((day) => {
      ;[day.breakfastMatch, day.lunchMatch, day.dinnerMatch].forEach((meal) => {
        if (!meal) return

        meal.ingredients.forEach((ingredient) => {
          const name = ingredient.name.trim()
          if (!name) return
          counter.set(name, (counter.get(name) ?? 0) + 1)
        })
      })
    })

    return Array.from(counter.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [generatedPlan, enrichedDays])

  const planStats = useMemo(() => {
    if (!generatedPlan) return null

    const matchedMeals = enrichedDays.flatMap((day) =>
      [day.breakfastMatch, day.lunchMatch, day.dinnerMatch].filter(Boolean) as MealOption[]
    )

    const matchedCalories = matchedMeals.reduce((sum, meal) => sum + estimateMealCalories(meal), 0)
    const matchedPrep = matchedMeals.reduce((sum, meal) => sum + estimateMealPrep(meal), 0)

    return {
      matchedMeals: matchedMeals.length,
      estimatedCalories: matchedCalories > 0 ? matchedCalories : generatedPlan.days.length * 3 * 420,
      estimatedPrep: matchedPrep > 0 ? matchedPrep : generatedPlan.days.length * 3 * 25,
      shoppingItems: shoppingList.length,
      preferenceMatches: preferredLibrary.length,
    }
  }, [generatedPlan, enrichedDays, shoppingList.length, preferredLibrary.length])

  const buildAutoSelections = useCallback(() => {
    return Array.from({ length: days }, (_, index) => ({
      breakfastId: breakfastPool[index % breakfastPool.length]?.id ?? '',
      lunchId: lunchPool[index % lunchPool.length]?.id ?? '',
      dinnerId: dinnerPool[index % dinnerPool.length]?.id ?? '',
    }))
  }, [days, breakfastPool, lunchPool, dinnerPool])

  const updateManualSelection = (dayIndex: number, slot: MealSlot, mealId: string) => {
    setManualSelections((prev) => {
      const next = [...prev]
      const current = next[dayIndex] ?? { breakfastId: '', lunchId: '', dinnerId: '' }

      next[dayIndex] = {
        ...current,
        [`${slot}Id`]: mealId,
      } as ManualDaySelection

      return next
    })
  }

  const autoFillManualSelections = useCallback(() => {
    const next = buildAutoSelections()
    setManualSelections(next)
    return next
  }, [buildAutoSelections])

  const buildManualPlan = useCallback(
    (selections: ManualDaySelection[]): GeneratedPlan => {
      if (!hasMeals) {
        throw new Error('No meals are available in the database to build a manual plan.')
      }

      const daysData: GeneratedDayPlan[] = Array.from({ length: days }, (_, index) => {
        const selection = selections[index] ?? { breakfastId: '', lunchId: '', dinnerId: '' }

        const breakfast =
          mealLibrary.find((meal) => meal.id === selection.breakfastId) ??
          breakfastPool[index % breakfastPool.length] ??
          mealLibrary[0]

        const lunch =
          mealLibrary.find((meal) => meal.id === selection.lunchId) ??
          lunchPool[index % lunchPool.length] ??
          mealLibrary[0]

        const dinner =
          mealLibrary.find((meal) => meal.id === selection.dinnerId) ??
          dinnerPool[index % dinnerPool.length] ??
          mealLibrary[0]

        const snack = snackPool[index % snackPool.length] ?? mealLibrary[0]

        const notes: string[] = []
        if (selectedCuisines.length > 0) notes.push(`Cuisine focus: ${selectedCuisines[0]}`)
        notes.push(`Diet: ${diet}`)
        if (preferredLibrary.length > 0) notes.push(`${preferredLibrary.length} meals matched your filters`)

        return {
          day: dayLabels[index],
          breakfast: breakfast?.name ?? 'Select a breakfast',
          lunch: lunch?.name ?? 'Select a lunch',
          dinner: dinner?.name ?? 'Select a dinner',
          snacks: snack?.name ? [snack.name] : [],
          notes: notes.join(' · '),
        }
      })

      const title =
        selectedCuisines.length > 0
          ? `${selectedCuisines[0]} ${diet.replace('-', ' ')} Plan`
          : `${diet.replace('-', ' ')} Meal Plan`

      return {
        title,
        description: 'Built from your database meal library and manual selections.',
        days: daysData,
        source: 'manual',
      }
    },
    [days, mealLibrary, breakfastPool, lunchPool, dinnerPool, snackPool, selectedCuisines, diet, preferredLibrary.length, dayLabels, hasMeals]
  )

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfoMessage(null)
    setIsGenerating(true)

    try {
      if (mode === 'manual') {
        if (mealsLoading) {
          throw new Error('Meals are still loading from the database. Please wait a moment.')
        }

        if (!hasMeals) {
          throw new Error('No meals are available in the database yet. Please add meals first.')
        }

        const hasAnySelection = manualSelections.some((selection) => selection.breakfastId || selection.lunchId || selection.dinnerId)
        const selections = hasAnySelection ? manualSelections : autoFillManualSelections()

        const plan = buildManualPlan(selections)
        const adapted = adaptPlanToDays(plan, days)

        setGeneratedPlan(adapted)
        setInfoMessage('Manual meal plan created successfully.')
        window.setTimeout(() => {
          document.getElementById('meal-plan-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 50)
        return
      }

      const response = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: preferencePayload,
          isPremium: isPremiumUser,
        }),
      })

      const result = (await response.json()) as {
        success: boolean
        source?: 'ai' | 'fallback'
        data?: { title: string; description?: string; days: GeneratedDayPlan[] }
        error?: string
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate meal plan')
      }

      const plan: GeneratedPlan = adaptPlanToDays(
        {
          title: result.data.title,
          description: result.data.description,
          days: result.data.days,
          source: result.source ?? 'ai',
        },
        days
      )

      setGeneratedPlan(plan)
      setInfoMessage(result.source === 'fallback' ? 'Generated using your database meal library.' : 'AI meal plan generated successfully.')
      window.setTimeout(() => {
        document.getElementById('meal-plan-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate meal plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePlan = () => {
    if (!generatedPlan) return
    try {
      localStorage.setItem('pikaplan:last-meal-plan', JSON.stringify(generatedPlan))
      setInfoMessage('Meal plan saved to your browser.')
    } catch {
      setError('Could not save this plan in your browser.')
    }
  }

  const handleCopySummary = async () => {
    if (!generatedPlan) return
    const summary = [
      `PikaPlan Meal Plan`,
      `Title: ${generatedPlan.title}`,
      `Source: ${generatedPlan.source ?? 'ai'}`,
      `Days: ${generatedPlan.days.length}`,
      `Diet: ${diet}`,
      `Servings: ${servings}`,
      `Cuisines: ${selectedCuisines.length > 0 ? selectedCuisines.join(', ') : 'Any'}`,
      `Estimated calories: ${planStats?.estimatedCalories ?? 'N/A'}`,
      `Estimated prep time: ${planStats ? formatMinutes(planStats.estimatedPrep) : 'N/A'}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(summary)
      setInfoMessage('Plan summary copied to clipboard.')
    } catch {
      setError('Could not copy the summary to clipboard.')
    }
  }

  const handleSharePlan = async () => {
    if (!generatedPlan) return

    const text = [
      `PikaPlan: ${generatedPlan.title}`,
      `${generatedPlan.days.length} days • ${diet} • ${servings} servings`,
      `Cuisines: ${selectedCuisines.length > 0 ? selectedCuisines.join(', ') : 'Any'}`,
    ].join(' · ')

    try {
      if (navigator.share) {
        await navigator.share({
          title: generatedPlan.title,
          text,
        })
      } else {
        await navigator.clipboard.writeText(text)
        setInfoMessage('Plan text copied to clipboard.')
      }
    } catch {
      setError('Could not share this plan.')
    }
  }

  const handleReset = () => {
    setGeneratedPlan(null)
    setError(null)
    setInfoMessage(null)
  }

  const sourceLabel = generatedPlan?.source ?? (mode === 'manual' ? 'manual' : 'ai')
  const sourceMeta: Record<
    'ai' | 'fallback' | 'manual',
    { label: string; icon: ComponentType<{ size?: number; className?: string }>; className: string }
  > = {
    ai: { label: 'AI Generated', icon: Sparkles, className: 'bg-violet-50 text-violet-700 border-violet-200' },
    fallback: { label: 'Database Fallback', icon: ShieldCheck, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    manual: { label: 'Manual Builder', icon: PencilLine, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }

  const SourceIcon = sourceMeta[sourceLabel].icon
  const manualDisabled = mealsLoading || !hasMeals
  const submitDisabled = isGenerating || (mode === 'manual' && manualDisabled)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f8faf8]">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] px-6 py-16 lg:py-24">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2332CD32\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles size={16} className="text-[#32CD32]" />
              <span className="text-sm font-medium text-white/90">AI-Powered Meal Planning</span>
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Generate Your Desired Meal Plan
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/80">
              Build a personalized meal plan from your onboarding preferences or craft one manually from your database meal library.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <CalendarDays size={14} className="text-[#32CD32]" />
                3 / 5 / 7 / 14 Day Plans
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                <ListChecks size={14} className="text-[#32CD32]" />
                Shopping List Included
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
                {isPremiumUser ? (
                  <>
                    <Crown size={14} className="text-[#F4A535]" />
                    AI Chef Pro Active
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-[#F4A535]" />
                    AI Chef Ready
                  </>
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="-mt-8 px-6 py-12 lg:py-16">
          <div className="mx-auto max-w-6xl">
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <ShieldCheck size={16} /> {error}
              </div>
            )}

            {infoMessage && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} /> {infoMessage}
              </div>
            )}

            {!generatedPlan ? (
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl lg:p-10">
                <div className="absolute -z-10 hidden h-40 w-40 rounded-full bg-gradient-to-br from-[#f97316]/10 to-transparent lg:block" />
                <div className="absolute -z-10 hidden h-32 w-32 rounded-full bg-gradient-to-tr from-[#32CD32]/10 to-transparent lg:block" />

                <form onSubmit={handleGenerate} className="space-y-8">
                  {/* Mode Toggle */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode('ai')}
                      className={`rounded-2xl border-2 p-5 text-left transition ${
                        mode === 'ai'
                          ? 'border-[#32CD32] bg-[#32CD32]/10 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mode === 'ai' ? 'bg-[#1A5C3A] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <WandSparkles size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">AI Auto-Generate</p>
                          <p className="text-sm text-slate-500">Uses onboarding preferences and your catalog</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('manual')}
                      className={`rounded-2xl border-2 p-5 text-left transition ${
                        mode === 'manual'
                          ? 'border-[#32CD32] bg-[#32CD32]/10 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mode === 'manual' ? 'bg-[#1A5C3A] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <PencilLine size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Manual Builder</p>
                          <p className="text-sm text-slate-500">Pick exact meals for every day</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-2">
                    {/* Preferences */}
                    <div className="space-y-7">
                      {/* Duration */}
                      <div>
                        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <CalendarDays className="h-4 w-4 text-[#126e3d]" />
                          Plan Duration
                        </label>
                        <select
                          value={days}
                          onChange={(e) => setDays(clampDays(Number(e.target.value)))}
                          className="w-full cursor-pointer rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 font-medium text-slate-900 transition focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]"
                        >
                          <option value={3}>3 Days (Weekend Prep)</option>
                          <option value={5}>5 Days (Work Week)</option>
                          <option value={7}>7 Days (Full Week)</option>
                          <option value={14}>14 Days (Bi-weekly)</option>
                        </select>
                        <p className="mt-2 text-xs text-slate-500">AI results are expanded locally to match your selected duration.</p>
                      </div>

                      {/* Servings */}
                      <div>
                        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Users className="h-4 w-4 text-[#126e3d]" />
                          Number of Servings
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="12"
                            value={servings}
                            onChange={(e) => setServings(Number(e.target.value))}
                            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg accent-[#32CD32]"
                          />
                          <div className="flex h-12 w-16 min-w-[4rem] items-center justify-center rounded-xl bg-[#126e3d] text-lg font-bold text-white">
                            {servings}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">Adjust for individuals or families</p>
                      </div>

                      {/* Dietary Preference */}
                      <div>
                        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <UtensilsCrossed className="h-4 w-4 text-[#126e3d]" />
                          Dietary Preference
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {DIETARY_OPTIONS.map((option) => {
                            const Icon = option.icon
                            const active = diet === option.value

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setDiet(option.value)}
                                className={`rounded-2xl border-2 p-3 text-left transition ${
                                  active
                                    ? 'border-[#32CD32] bg-[#32CD32]/10'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-[#1A5C3A] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <Icon size={16} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{option.label}</p>
                                    <p className="text-xs text-slate-500">{option.helper}</p>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Cuisines */}
                      <div>
                        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Globe2 className="h-4 w-4 text-[#126e3d]" />
                          Preferred Cuisines
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {CUISINE_OPTIONS.map((cuisine) => {
                            const active = selectedCuisines.includes(cuisine)
                            return (
                              <button
                                key={cuisine}
                                type="button"
                                onClick={() =>
                                  setSelectedCuisines((prev) =>
                                    prev.includes(cuisine) ? prev.filter((item) => item !== cuisine) : [...prev, cuisine]
                                  )
                                }
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                  active
                                    ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#126e3d]'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {active && <CheckCircle2 size={14} />}
                                {cuisine}
                              </button>
                            )
                          })}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">You can select multiple cuisines from onboarding or by preference.</p>
                      </div>
                    </div>

                    {/* More Filters */}
                    <div className="space-y-7">
                      <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">Plan Summary</p>
                            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">What we’ll use</h3>
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1A5C3A] ring-1 ring-slate-200">
                            {preferredLibrary.length} matched meals
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Diet</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {DIETARY_OPTIONS.find((item) => item.value === diet)?.label ?? diet}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Servings</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{servings}</p>
                          </div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Budget</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{budget ? `KES ${Number(budget).toLocaleString('en-KE')}` : 'Optional'}</p>
                          </div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Calories</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{caloriesPerDay ? `${Number(caloriesPerDay).toLocaleString('en-KE')} / day` : 'Optional'}</p>
                          </div>
                        </div>

                        {selectedCuisines.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedCuisines.map((cuisine) => (
                              <span
                                key={cuisine}
                                className="inline-flex items-center gap-1 rounded-full bg-[#1A5C3A] px-3 py-1 text-xs font-semibold text-white"
                              >
                                <Plus size={11} />
                                {cuisine}
                              </span>
                            ))}
                          </div>
                        )}

                        {isPremiumUser ? (
                          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                            <Crown size={15} />
                            Premium AI Chef enabled
                          </div>
                        ) : (
                          <Link
                            href="/pricing"
                            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                          >
                            <Crown size={15} />
                            Unlock GPT-4.1 AI Chef
                          </Link>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Dislikes</label>
                        <input
                          value={dislikes}
                          onChange={(e) => setDislikes(e.target.value)}
                          placeholder="e.g. mushrooms, liver, peanuts"
                          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]"
                        />
                        <p className="mt-2 text-xs text-slate-500">Comma-separated list of foods to avoid.</p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Allergies</label>
                        <input
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          placeholder="e.g. nuts, dairy, gluten"
                          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]"
                        />
                        <p className="mt-2 text-xs text-slate-500">Important for both AI and manual planning.</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">Budget (KES)</label>
                          <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="Optional"
                            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">Calories / Day</label>
                          <input
                            type="number"
                            value={caloriesPerDay}
                            onChange={(e) => setCaloriesPerDay(e.target.value)}
                            placeholder="Optional"
                            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual Builder */}
                  {mode === 'manual' && (
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 lg:p-6">
                      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1A5C3A] ring-1 ring-slate-200">
                            <ListChecks size={12} />
                            Manual Builder
                          </div>
                          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Select your meals day by day</h3>
                          <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Use the meal library to pick exact breakfast, lunch, and dinner options. You can auto-fill, then edit any day.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setManualSelections(buildAutoSelections())}
                            disabled={manualDisabled}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <WandSparkles size={15} />
                            Auto-fill
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setManualSelections(
                                Array.from({ length: days }, () => ({ breakfastId: '', lunchId: '', dinnerId: '' }))
                              )
                            }
                            disabled={manualDisabled}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RefreshCw size={15} />
                            Reset
                          </button>
                        </div>
                      </div>

                      {mealsLoading ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                          <Loader2 size={28} className="mx-auto animate-spin text-[#1A5C3A]" />
                          <p className="mt-3 font-semibold text-slate-700">Loading meals from the database...</p>
                        </div>
                      ) : !hasMeals ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                          <ShoppingCart size={28} className="mx-auto text-slate-300" />
                          <p className="mt-3 font-semibold text-slate-700">No meals available yet</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Add meal records to your database to enable manual meal planning.
                          </p>
                          <button
                            type="button"
                            onClick={() => void refreshMeals()}
                            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#1A5C3A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#13462d]"
                          >
                            <RefreshCw size={15} />
                            Refresh Meals
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dayLabels.map((dayLabel, index) => (
                            <div key={dayLabel} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    Day {index + 1}
                                  </p>
                                  <h4 className="text-lg font-black text-slate-950">{dayLabel}</h4>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                  <ShieldCheck size={12} />
                                  {preferredLibrary.length} matches
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-3">
                                {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => {
                                  const options =
                                    slot === 'breakfast'
                                      ? breakfastPool
                                      : slot === 'lunch'
                                        ? lunchPool
                                        : dinnerPool

                                  const value =
                                    slot === 'breakfast'
                                      ? manualSelections[index]?.breakfastId ?? ''
                                      : slot === 'lunch'
                                        ? manualSelections[index]?.lunchId ?? ''
                                        : manualSelections[index]?.dinnerId ?? ''

                                  return (
                                    <label key={slot} className="block">
                                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                        {SLOT_META[slot].label}
                                      </span>
                                      <select
                                        value={value}
                                        onChange={(e) => updateManualSelection(index, slot, e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]"
                                      >
                                        <option value="">Choose a meal</option>
                                        {options.map((meal) => (
                                          <option key={meal.id} value={meal.id}>
                                            {meal.name} — {meal.cuisine} • {meal.calories} kcal
                                          </option>
                                        ))}
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

                  {/* Submit */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={submitDisabled}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-5 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : mode === 'ai' ? (
                        <>
                          <WandSparkles className="h-5 w-5" />
                          Generate with AI
                        </>
                      ) : manualDisabled ? (
                        <>
                          <ShieldCheck className="h-5 w-5" />
                          Meals Not Ready
                        </>
                      ) : (
                        <>
                          <PencilLine className="h-5 w-5" />
                          Build Manual Plan
                        </>
                      )}
                      {!isGenerating && <ArrowRight className="h-5 w-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <RefreshCw className="h-5 w-5" />
                      Clear Result
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div id="meal-plan-results" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Summary Header */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl lg:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${sourceMeta[sourceLabel].className}`}>
                          <SourceIcon size={12} />
                          {sourceMeta[sourceLabel].label}
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          <CalendarDays size={12} />
                          {generatedPlan.days.length} days
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          <Users size={12} />
                          {servings} servings
                        </span>
                      </div>

                      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                        {generatedPlan.title}
                      </h2>
                      <p className="mt-2 text-slate-600">
                        {generatedPlan.description ??
                          'A personalized meal plan generated from your preferences and meal library.'}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#1A5C3A]/10 px-3 py-1 text-xs font-semibold text-[#1A5C3A]">
                          <Leaf size={12} />
                          {DIETARY_OPTIONS.find((item) => item.value === diet)?.label ?? diet}
                        </span>

                        {selectedCuisines.map((cuisine) => (
                          <span
                            key={cuisine}
                            className="inline-flex items-center gap-2 rounded-full bg-[#f4a535]/10 px-3 py-1 text-xs font-semibold text-[#a16207]"
                          >
                            <Plus size={11} />
                            {cuisine}
                          </span>
                        ))}

                        {planStats && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                            <CheckCircle2 size={12} />
                            {planStats.matchedMeals} matched meals
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <button
                        onClick={handleSavePlan}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <BookmarkPlus size={15} />
                        Save Plan
                      </button>
                      <button
                        onClick={handleCopySummary}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Copy size={15} />
                        Copy Summary
                      </button>
                      <button
                        onClick={handleSharePlan}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Share2 size={15} />
                        Share
                      </button>
                      <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#1A5C3A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#13462d]"
                      >
                        <RefreshCw size={15} />
                        Start Over
                      </button>
                    </div>
                  </div>

                  {planStats && (
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estimated Calories</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">
                          {planStats.estimatedCalories.toLocaleString('en-KE')}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prep Time</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{formatMinutes(planStats.estimatedPrep)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shopping Items</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{planStats.shoppingItems}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preference Matches</p>
                        <p className="mt-2 text-2xl font-black text-slate-950">{planStats.preferenceMatches}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Plan + Shopping List */}
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                  <div className="space-y-4">
                    {enrichedDays.map((day, index) => (
                      <div
                        key={`${day.day}-${index}`}
                        className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                              Day {index + 1}
                            </p>
                            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{day.day}</h3>
                          </div>
                          {day.notes && (
                            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {day.notes}
                            </div>
                          )}
                        </div>

                        <div className="grid gap-3 p-5 md:grid-cols-3">
                          <MealSlotCard slot="breakfast" mealName={day.breakfast} matchedMeal={day.breakfastMatch} />
                          <MealSlotCard slot="lunch" mealName={day.lunch} matchedMeal={day.lunchMatch} />
                          <MealSlotCard slot="dinner" mealName={day.dinner} matchedMeal={day.dinnerMatch} />
                        </div>

                        {day.snacks.length > 0 && (
                          <div className="border-t border-slate-100 px-5 py-4">
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                              <Apple size={12} />
                              Snacks
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {day.snacks.map((snack) => (
                                <span
                                  key={snack}
                                  className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                                >
                                  <Apple size={12} className="text-[#1A5C3A]" />
                                  {snack}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="sticky top-24 rounded-3xl border border-slate-100 bg-white p-5 shadow-lg">
                      <div className="mb-4 flex items-center gap-2.5">
                        <ShoppingCart size={18} className="text-[#1A5C3A]" />
                        <div>
                          <h3 className="font-bold text-slate-950">Shopping List</h3>
                          <p className="text-xs text-slate-500">Built from matched meal ingredients</p>
                        </div>
                      </div>

                      {shoppingList.length > 0 ? (
                        <div className="space-y-2">
                          {shoppingList.map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"
                            >
                              <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#1A5C3A] ring-1 ring-slate-200">
                                x{item.count}
                              </span>
                            </div>
                          ))}

                          <button
                            onClick={async () => {
                              const list = shoppingList.map((item) => `${item.name} x${item.count}`).join('\n')
                              try {
                                await navigator.clipboard.writeText(list)
                                setInfoMessage('Shopping list copied to clipboard.')
                              } catch {
                                setError('Could not copy shopping list.')
                              }
                            }}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Copy size={15} />
                            Copy Shopping List
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                          <ShoppingCart className="mx-auto mb-2 text-slate-300" size={28} />
                          <p className="text-sm font-semibold text-slate-700">No shopping items available yet</p>
                          <p className="mt-1 text-xs text-slate-500">
                            If the meal names match items in your catalog, ingredients will show up here.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-[#1A5C3A] to-[#0f3b24] p-5 text-white shadow-lg">
                      <div className="flex items-center gap-2.5">
                        <Sparkles size={18} className="text-[#F4A535]" />
                        <h3 className="font-bold">Competitive Edge</h3>
                      </div>
                      <ul className="mt-4 space-y-3 text-sm text-white/85">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="mt-0.5 text-[#32CD32]" />
                          Auto-uses onboarding preferences for a personal touch.
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="mt-0.5 text-[#32CD32]" />
                          Manual builder lets customers choose exact meals.
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="mt-0.5 text-[#32CD32]" />
                          Shopping list is generated from matched meal ingredients.
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="mt-0.5 text-[#32CD32]" />
                          AI fallback still works if the model fails.
                        </li>
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