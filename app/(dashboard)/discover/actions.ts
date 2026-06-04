'use server'

import { createClient } from '@/lib/supabase/server'

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
export type SortMode = 'recommended' | 'price_low' | 'price_high' | 'calories_low' | 'quickest'

export type MealRow = {
  id: string; name: string; description: string; image_url: string | null
  prep_time_minutes: number | null; cook_time_minutes: number | null
  calories_per_serving: number | null; cuisine: string | null; cuisine_types?: string[] | null
  category: string | null; meal_type: string | null; tags?: string[] | null
  dietary_tags?: string[] | null; difficulty?: string | null; is_premium?: boolean | null
}

export type VendorMealRow = {
  id: string; meal_id: string; vendor_id: string; price: number | null; is_available: boolean | null
}

export type VendorRow = {
  id: string; business_name?: string | null; name?: string | null; location?: string | null
  location_city?: string | null; address?: string | null; service_area?: string | null
  rating?: number | null; is_active?: boolean | null
}

export type ProfileRow = {
  dietary_preferences?: string[] | null; allergies?: string[] | null; cuisine_preferences?: string[] | null
  meal_types?: string[] | null; budget_range?: string | null; location?: string | null; location_city?: string | null
}

export type EnrichedMeal = MealRow & {
  vendorOffers: Array<VendorMealRow & { vendor?: VendorRow | null }>
  minPrice: number | null
  score: number
}

// ── Server-Side Helpers ───────────────────────────────────
function normalizeText(value: string | null | undefined) { return (value ?? '').toLowerCase().trim() }

function getBudgetCeiling(budget?: string | null) {
  if (!budget) return 0
  if (budget.includes('under-500')) return 500
  if (budget.includes('500-1000')) return 1000
  if (budget.includes('1000-2000')) return 2000
  if (budget.includes('above-2000')) return 999999
  return 0
}

function matchesAny(source: string[], targets: string[]) {
  if (targets.length === 0) return false
  return source.some((item) => targets.some((target) => item.includes(target) || target.includes(item)))
}

function computeMealScore(meal: MealRow, profile: ProfileRow | null, minPrice: number | null) {
  if (!profile) return 0
  const diet = (profile.dietary_preferences ?? []).map((item) => item.toLowerCase())
  const cuisinePrefs = (profile.cuisine_preferences ?? []).map((item) => item.toLowerCase())
  const mealTypes = (profile.meal_types ?? []).map((item) => item.toLowerCase())
  const allergies = (profile.allergies ?? []).map((item) => item.toLowerCase()).filter((item) => item !== 'none')
  const budgetCeiling = getBudgetCeiling(profile.budget_range)

  const mealTags = [
    ...(meal.tags ?? []).map((item) => item.toLowerCase()),
    ...(meal.dietary_tags ?? []).map((item) => item.toLowerCase()),
    ...(meal.cuisine_types ?? []).map((item) => item.toLowerCase()),
    normalizeText(meal.cuisine), normalizeText(meal.category), normalizeText(meal.meal_type),
  ].filter(Boolean)

  let score = 0
  if (matchesAny(mealTags, diet)) score += 3
  if (matchesAny(mealTags, cuisinePrefs)) score += 2
  if (matchesAny(mealTags, mealTypes)) score += 2
  if (budgetCeiling > 0 && minPrice !== null && minPrice <= budgetCeiling) score += 2
  if ((meal.calories_per_serving ?? 0) > 0 && (meal.calories_per_serving ?? 0) <= 600) score += 1
  if (((meal.prep_time_minutes ?? 0) + (meal.cook_time_minutes ?? 0)) <= 30) score += 1
  if (!matchesAny(mealTags, allergies)) score += 1
  return score
}

// ── Main Server Action ────────────────────────────────────
export async function fetchDiscoverData(): Promise<{ meals: EnrichedMeal[], profile: ProfileRow | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // PARALLEL FETCHING (Massive speedup)
  const [profileRes, mealsRes, vendorMealsRes, vendorsRes] = await Promise.all([
    user ? supabase.from('profiles').select('dietary_preferences, allergies, cuisine_preferences, meal_types, budget_range, location, location_city').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('meals').select('*').limit(100),
    supabase.from('vendor_meals').select('*').limit(200),
    supabase.from('vendors').select('*').limit(100)
  ])

  const profileData = (profileRes.data as ProfileRow | null) ?? null
  const mealsData = (mealsRes.data as MealRow[]) ?? []
  const vendorMealsData = (vendorMealsRes.data as VendorMealRow[]) ?? []
  const vendorsData = (vendorsRes.data as VendorRow[]) ?? []

  const vendorMap = new Map(vendorsData.map((vendor) => [vendor.id, vendor]))
  
  const groupedVendorMeals = vendorMealsData.reduce<Record<string, Array<VendorMealRow & { vendor?: VendorRow | null }>>>((acc, item) => {
    acc[item.meal_id] = [...(acc[item.meal_id] ?? []), { ...item, vendor: vendorMap.get(item.vendor_id) ?? null }]
    return acc
  }, {})

  // Pre-calculate scores on the server
  const enrichedMeals: EnrichedMeal[] = mealsData.map((meal) => {
    const offers = groupedVendorMeals[meal.id] ?? []
    const minPrice = offers.length > 0 ? Math.min(...offers.map((offer) => offer.price ?? 0).filter((price) => price > 0)) : null
    return {
      ...meal,
      vendorOffers: offers,
      minPrice,
      score: computeMealScore(meal, profileData, minPrice),
    }
  })

  return { meals: enrichedMeals, profile: profileData }
}