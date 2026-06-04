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

export type MealGeneratorData = {
  meals: MealOption[]
  preferences: SavedMealPreferences | null
  isPremium: boolean
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

// ── Main Data Fetching ────────────────────────────────────
export async function fetchMealGeneratorData(): Promise<MealGeneratorData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { meals: [], preferences: null, isPremium: false }

  // PARALLEL FETCHING (Massive speedup)
  const [profileRes, mealsRes] = await Promise.all([
    supabase.from('profiles').select('meal_preferences, subscription_tier, dietary_preferences, cuisine_preferences, budget_range, household_size').eq('id', user.id).maybeSingle(),
    supabase.from('meals').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(120)
  ])

  const profile = profileRes.data as any
  const rawPrefs = profile?.meal_preferences
  let prefs: SavedMealPreferences | null = null

  if (rawPrefs && typeof rawPrefs === 'object') {
    prefs = rawPrefs as SavedMealPreferences
  } else if (typeof rawPrefs === 'string') {
    try { prefs = JSON.parse(rawPrefs) as SavedMealPreferences } catch {}
  }

  // Fallback to root profile fields if meal_preferences is empty
  if (!prefs) {
    prefs = {
      diet: profile?.dietary_preferences?.[0] as DietaryPreference,
      cuisines: profile?.cuisine_preferences,
      budget: profile?.budget_range,
      servings: profile?.household_size,
    }
  }

  const dbMeals = (mealsRes.data ?? []).map((row: Record<string, unknown>) => normalizeMealRecord(row))
  const isPremium = profile?.subscription_tier === 'premium'

  return {
    meals: dedupeMeals(dbMeals),
    preferences: prefs,
    isPremium,
  }
}