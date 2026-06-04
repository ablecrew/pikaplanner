'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ShoppingListItem = {
  id: string
  ingredient_name?: string | null
  item_name?: string | null
  name?: string | null
  quantity?: string | number | null
  unit?: string | null
  estimated_price?: number | string | null
  is_checked?: boolean | null
}

export type ShoppingList = {
  id: string
  title?: string | null
  status?: string | null
  total_estimated_cost?: number | null
  shopping_list_items?: ShoppingListItem[]
}

export type UserProfile = {
  dietary_preferences?: string[] | null
  allergies?: string[] | null
  cuisine_preferences?: string[] | null
  meal_types?: string[] | null
  budget_range?: string | null
  location?: string | null
  location_city?: string | null
  household_size?: number | null
}

export type RecommendedMeal = {
  id: string
  source: 'meal' | 'vendor_meal'
  title: string
  description: string
  vendorName: string
  location: string
  price: number
  tags: string[]
  matchReasons: string[]
  allergySafe: boolean
  budgetFriendly: boolean
}

export type SuggestedIngredient = {
  id: string
  name: string
  quantity: string
  unit: string
  estimatedPrice: number
  sourceMeal: string
}

export type AddOnState = {
  profile: UserProfile | null
  recommendedMeals: RecommendedMeal[]
  suggestedIngredients: SuggestedIngredient[]
}

export type ShoppingPageData = {
  list: ShoppingList | null
  addOns: AddOnState
}

// ── Server-Side Helpers ───────────────────────────────────
type DataRow = Record<string, unknown>
function asString(value: unknown) { return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '' }
function asNumber(value: unknown) { return typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) || 0 : 0 }
function pick(row: DataRow | undefined, keys: string[]) { if (!row) return ''; for (const key of keys) { const value = asString(row[key]); if (value) return value } return '' }
function pickArray(row: DataRow | undefined, keys: string[]) {
  if (!row) return [] as string[]
  for (const key of keys) {
    const value = row[key]
    if (Array.isArray(value)) return value.map((item) => asString(item).toLowerCase()).filter(Boolean)
    if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
  }
  return [] as string[]
}
function normalizeList(values?: string[] | null) { return (values ?? []).map((value) => value.toLowerCase()).filter(Boolean) }
function containsAny(source: string[], targets: string[]) { return targets.length > 0 && source.some((item) => targets.some((target) => item.includes(target) || target.includes(item))) }
function getBudgetCeiling(budget?: string | null) {
  if (!budget) return 0
  if (budget.includes('under-500')) return 500; if (budget.includes('500-1000')) return 1000; if (budget.includes('1000-2000')) return 2000; if (budget.includes('above-2000')) return 999999
  return 0
}

function createMealRecommendation(row: DataRow, profile: UserProfile | null, source: 'meal' | 'vendor_meal', vendor?: DataRow): RecommendedMeal {
  const mealRow = (row.meal as DataRow | undefined) || row
  const vendorRow = (row.vendor as DataRow | undefined) || vendor
  const dietary = normalizeList(profile?.dietary_preferences)
  const cuisines = normalizeList(profile?.cuisine_preferences)
  const mealTypes = normalizeList(profile?.meal_types)
  const allergies = normalizeList(profile?.allergies).filter((item) => item !== 'none')
  const location = (profile?.location_city || profile?.location || '').toLowerCase()
  const budgetCeiling = getBudgetCeiling(profile?.budget_range)
  const rowTags = [...pickArray(mealRow, ['dietary_tags', 'dietary_options', 'tags', 'labels']), ...pickArray(mealRow, ['cuisine_types', 'cuisine', 'category']), pick(mealRow, ['meal_type', 'type', 'category']).toLowerCase()].filter(Boolean)
  const vendorLocation = pick(vendorRow, ['location', 'location_city', 'address', 'service_area']).toLowerCase()
  const allergens = pickArray(mealRow, ['allergens', 'allergies', 'contains'])
  const price = asNumber(row.price ?? row.amount ?? row.cost ?? row.estimated_price)
  const matchReasons: string[] = []
  if (containsAny(rowTags, dietary)) matchReasons.push('Matches diet')
  if (containsAny(rowTags, cuisines)) matchReasons.push('Cuisine match')
  if (containsAny(rowTags, mealTypes)) matchReasons.push('Meal type match')
  if (location && vendorLocation.includes(location)) matchReasons.push('Near you')
  if (budgetCeiling > 0 && price > 0 && price <= budgetCeiling) matchReasons.push('Budget-friendly')
  const allergySafe = !containsAny(allergens, allergies)
  if (allergySafe && allergies.length > 0) matchReasons.push('Allergy-safe')
  return {
    id: asString(row.id), source, title: pick(mealRow, ['name', 'title', 'meal_name']) || 'Recommended meal',
    description: pick(mealRow, ['description', 'summary', 'notes']) || 'A meal matched from your Smart Meal preferences.',
    vendorName: pick(vendorRow, ['business_name', 'name', 'vendor_name']) || pick(mealRow, ['vendor_name']) || 'Smart Meal Kitchen',
    location: pick(vendorRow, ['location_city', 'location', 'service_area', 'address']) || pick(mealRow, ['location', 'service_area']),
    price, tags: rowTags.slice(0, 3), matchReasons: matchReasons.length > 0 ? matchReasons.slice(0, 3) : ['Recommended'], allergySafe, budgetFriendly: budgetCeiling > 0 && price > 0 && price <= budgetCeiling,
  }
}

function scoreRecommendation(meal: RecommendedMeal) {
  let score = meal.matchReasons.length; if (meal.allergySafe) score += 1; if (meal.budgetFriendly) score += 1; return score
}

// ── Main Data Fetching ────────────────────────────────────
export async function fetchShoppingPageData(): Promise<ShoppingPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { list: null, addOns: { profile: null, recommendedMeals: [], suggestedIngredients: [] } }

  // 🚀 PARALLEL FETCHING (Massive speedup)
  const [listRes, profileRes, mealsRes, vendorMealsRes, vendorsRes] = await Promise.all([
    supabase.from('shopping_lists').select('*, shopping_list_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('profiles').select('dietary_preferences, allergies, cuisine_preferences, meal_types, budget_range, location, location_city, household_size').eq('id', user.id).maybeSingle(),
    supabase.from('meals').select('*').limit(24),
    supabase.from('vendor_meals').select('id, price, currency, is_available, preparation_time_minutes, notes, meal:meals (id, name, description, tags, category, cuisine, is_active), vendor:vendors (id, business_name, location_city, location_address, is_accepting_orders)').eq('is_available', true).limit(24),
    supabase.from('vendors').select('*').limit(60)
  ])

  const list = (listRes.data as ShoppingList) || null
  const profile = (profileRes.data as UserProfile) || null
  const vendors = ((vendorsRes.data ?? []) as DataRow[])
  const vendorMap = new Map(vendors.map((vendor) => [asString(vendor.id), vendor]))

  const mealRecommendations = ((mealsRes.data ?? []) as DataRow[]).map((meal) => createMealRecommendation(meal, profile, 'meal'))
  const vendorMealRecommendations = ((vendorMealsRes.data ?? []) as DataRow[]).map((meal) => {
    const vendorId = pick(meal, ['vendor_id']) || asString((meal.vendor as DataRow | undefined)?.id)
    return createMealRecommendation(meal, profile, 'vendor_meal', vendorId ? vendorMap.get(vendorId) : undefined)
  })

  const recommendedMeals = [...mealRecommendations, ...vendorMealRecommendations].sort((a, b) => scoreRecommendation(b) - scoreRecommendation(a)).slice(0, 6)
  const recommendedMealIds = recommendedMeals.filter((meal) => meal.source === 'meal').map((meal) => meal.id)

  let suggestedIngredients: SuggestedIngredient[] = []
  if (recommendedMealIds.length > 0) {
    const { data: ingredientsData } = await supabase.from('recipe_ingredients').select('*').in('meal_id', recommendedMealIds).limit(40)
    const currentItemNames = new Set((list?.shopping_list_items ?? []).map((item) => (item.ingredient_name || item.item_name || item.name || '').toLowerCase()).filter(Boolean))
    const mealTitleById = new Map(recommendedMeals.map((meal) => [meal.id, meal.title]))

    suggestedIngredients = ((ingredientsData ?? []) as DataRow[])
      .map((ingredient) => ({
        id: asString(ingredient.id) || `${pick(ingredient, ['meal_id', 'recipe_id'])}-${pick(ingredient, ['ingredient', 'ingredient_name', 'item_name'])}`,
        name: pick(ingredient, ['ingredient', 'ingredient_name', 'item_name', 'name']),
        quantity: pick(ingredient, ['quantity', 'amount']) || '1',
        unit: pick(ingredient, ['unit', 'measurement']) || '',
        estimatedPrice: asNumber(ingredient.estimated_price ?? ingredient.price),
        sourceMeal: mealTitleById.get(pick(ingredient, ['meal_id', 'recipe_id'])) || 'Recommended meal',
      }))
      .filter((ingredient) => ingredient.name && !currentItemNames.has(ingredient.name.toLowerCase()))
      .slice(0, 8)
  }

  return { list, addOns: { profile, recommendedMeals, suggestedIngredients } }
}

// ── Server Mutations ──────────────────────────────────────
export async function ensureShoppingListAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase.from('shopping_lists').insert({ user_id: user.id, title: 'Smart Shopping List', total_estimated_cost: 0 }).select('*').maybeSingle()
  if (error) throw error
  revalidatePath('/shopping')
  return data as ShoppingList
}

export async function addShoppingItemAction(listId: string, item: { name: string; quantity?: string; unit?: string; estimatedPrice?: number }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('shopping_list_items').insert({ shopping_list_id: listId, ingredient_name: item.name, quantity: item.quantity || '1', unit: item.unit || null, estimated_price: item.estimatedPrice || 0, is_checked: false }).select('*').single()
  if (error) throw error
  revalidatePath('/shopping')
  return data as ShoppingListItem
}

export async function addMealIngredientsAction(listId: string, mealId: string, source: 'meal' | 'vendor_meal', mealTitle: string, mealPrice: number) {
  const supabase = await createClient()
  if (source !== 'meal') {
    return addShoppingItemAction(listId, { name: mealTitle, quantity: '1', estimatedPrice: mealPrice })
  }
  const { data: ingredients } = await supabase.from('recipe_ingredients').select('*').eq('meal_id', mealId).limit(30)
  if (!ingredients || ingredients.length === 0) {
    return addShoppingItemAction(listId, { name: mealTitle, quantity: '1', estimatedPrice: mealPrice })
  }
  const mapped = ingredients.map((ing: any) => ({
    shopping_list_id: listId, ingredient_name: pick(ing, ['ingredient', 'ingredient_name', 'item_name', 'name']), quantity: pick(ing, ['quantity', 'amount']) || '1', unit: pick(ing, ['unit', 'measurement']) || null, estimated_price: asNumber(ing.estimated_price ?? ing.price), is_checked: false
  })).filter((ing: any) => ing.ingredient_name)
  
  const { data, error } = await supabase.from('shopping_list_items').insert(mapped).select('*')
  if (error) throw error
  revalidatePath('/shopping')
  return data as ShoppingListItem[]
}

export async function toggleItemAction(itemId: string, isChecked: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('shopping_list_items').update({ is_checked: isChecked }).eq('id', itemId)
  if (error) throw error
  revalidatePath('/shopping')
}

export async function removeItemAction(itemId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('shopping_list_items').delete().eq('id', itemId)
  if (error) throw error
  revalidatePath('/shopping')
}