'use server'

import { createClient } from '@/lib/supabase/server'

export type DietaryPreference = 'balanced' | 'low-carb' | 'vegetarian' | 'keto' | 'vegan' | 'high-protein'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner'

export type MealIngredient = { name: string; amount?: string }

export type MealOption = {
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

export type SavedMealPreferences = {
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

// Subscription info shared with client
export type SubscriptionInfo = {
  isActive: boolean
  isPremium: boolean
  tier: string | null
  expiresAt: string | null
  daysRemaining: number
  generationsToday: number
  generationsThisPeriod: number
  dailyLimit: number
  periodLimit: number
  canGenerate: boolean
}

export type MealGeneratorData = {
  meals: MealOption[]
  preferences: SavedMealPreferences | null
  isPremium: boolean
  subscription: SubscriptionInfo
}

// Tier-based rate limits
const TIER_LIMITS: Record<string, { perDay: number; perPeriod: number; periodDays: number }> = {
  daily:   { perDay: 1,   perPeriod: 1,    periodDays: 1 },
  weekly:  { perDay: 3,   perPeriod: 10,   periodDays: 7 },
  monthly: { perDay: 5,   perPeriod: 50,   periodDays: 30 },
  yearly:  { perDay: 999, perPeriod: 9999, periodDays: 365 },
  free:    { perDay: 0,   perPeriod: 0,    periodDays: 1 },
}

// ── Server-Side Normalization Helpers ─────────────────────
function normalizeStringArray(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((item) => String(item)).filter(Boolean)
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean)
    } catch {}
    return input.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function normalizeIngredients(input: unknown): MealIngredient[] {
  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === 'string') return { name: item.trim() }
      if (item && typeof item === 'object' && 'name' in item) {
        const ingredient = item as { name?: unknown; amount?: unknown }
        return { name: String(ingredient.name ?? '').trim(), amount: ingredient.amount != null ? String(ingredient.amount) : undefined }
      }
      return null
    }).filter(Boolean) as MealIngredient[]
  }
  if (typeof input === 'string') {
    try { return normalizeIngredients(JSON.parse(input)) } catch {}
    return input.split(',').map((item) => ({ name: item.trim() })).filter((item) => item.name.length > 0)
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
    const key = meal.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Subscription Helper ─────────────────────────────────
export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, tier, status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tier = sub?.tier ?? null
  const isActive = !!sub

  // ✅ Any active subscription (including trial/daily) unlocks generation
  const isPremium = isActive && tier !== 'free' && tier !== null

  const limits = TIER_LIMITS[tier ?? 'free'] ?? TIER_LIMITS.free

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: dayCount } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_ai_generated', true)
    .gte('created_at', todayStart.toISOString())

  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - limits.periodDays)

  const { count: periodCount } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_ai_generated', true)
    .gte('created_at', periodStart.toISOString())

  const generationsToday = dayCount ?? 0
  const generationsThisPeriod = periodCount ?? 0

  const daysRemaining = sub?.expires_at
    ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const canGenerate =
    isActive &&                              // ✅ active sub (trial counts)
    generationsToday < limits.perDay &&
    generationsThisPeriod < limits.perPeriod

  return {
    isActive, isPremium, tier,
    expiresAt: sub?.expires_at ?? null,
    daysRemaining, generationsToday, generationsThisPeriod,
    dailyLimit: limits.perDay,
    periodLimit: limits.perPeriod,
    canGenerate,
  }
}

// ── Main Data Fetching ────────────────────────────────────
export async function fetchMealGeneratorData(): Promise<MealGeneratorData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const emptySub: SubscriptionInfo = {
    isActive: false, isPremium: false, tier: null, expiresAt: null,
    daysRemaining: 0, generationsToday: 0, generationsThisPeriod: 0,
    dailyLimit: 0, periodLimit: 0, canGenerate: false,
  }

  if (!user) return { meals: [], preferences: null, isPremium: false, subscription: emptySub }

  // PARALLEL FETCHING (Massive speedup)
  const [profileRes, mealsRes, subInfo] = await Promise.all([
    supabase.from('profiles').select('meal_preferences, subscription_tier, dietary_preferences, cuisine_preferences, budget_range, household_size').eq('id', user.id).maybeSingle(),
    supabase.from('meals').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(120),
    getSubscriptionInfo(user.id), 
  ])

  const profile = profileRes.data as any
  const rawPrefs = profile?.meal_preferences
  let prefs: SavedMealPreferences | null = null

  if (rawPrefs && typeof rawPrefs === 'object') {
    prefs = rawPrefs as SavedMealPreferences
  } else if (typeof rawPrefs === 'string') {
    try { prefs = JSON.parse(rawPrefs) as SavedMealPreferences } catch {}
  }

  if (!prefs) {
    prefs = {
      diet: profile?.dietary_preferences?.[0] as DietaryPreference,
      cuisines: profile?.cuisine_preferences,
      budget: profile?.budget_range,
      servings: profile?.household_size,
    }
  }

  const dbMeals = (mealsRes.data ?? []).map((row: Record<string, unknown>) => normalizeMealRecord(row))
  // Treat any active subscription as "premium" for feature unlocks
  const isPremium = subInfo.isPremium

  return {
    meals: dedupeMeals(dbMeals),
    preferences: prefs,
    isPremium,
    subscription: subInfo,
  }
}