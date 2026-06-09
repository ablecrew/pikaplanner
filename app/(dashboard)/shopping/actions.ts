'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { initiateSTKPush } from '@/lib/payhero/client'
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  generateReference,
} from '@/lib/payhero/utils'

// ── Types ─────────────────────────────────────────────────
export type ShoppingListItem = {
  id: string
  ingredient_name?: string | null
  item_name?: string | null
  name?: string | null
  quantity?: string | number | null
  unit?: string | null
  estimated_price?: number | string | null
  is_checked?: boolean | null
  // Cart-specific fields
  is_cart_item?: boolean | null
  meal_id?: string | null
  vendor_id?: string | null
  vendor_name?: string | null
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
  phone?: string | null
}

export type RecommendedMeal = {
  id: string
  source: 'meal' | 'vendor_meal'
  title: string
  description: string
  vendorName: string
  vendorId?: string
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

// Checkout result type
export type CheckoutResult =
  | { success: true; reference: string; message: string }
  | { success: false; error: string; field?: string }

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
  if (budget.includes('under-500')) return 500
  if (budget.includes('500-1000')) return 1000
  if (budget.includes('1000-2000')) return 2000
  if (budget.includes('above-2000')) return 999999
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
    id: asString(row.id),
    source,
    title: pick(mealRow, ['name', 'title', 'meal_name']) || 'Recommended meal',
    description: pick(mealRow, ['description', 'summary', 'notes']) || 'A meal matched from your Smart Meal preferences.',
    vendorName: pick(vendorRow, ['business_name', 'name', 'vendor_name']) || pick(mealRow, ['vendor_name']) || 'Smart Meal Kitchen',
    vendorId: pick(vendorRow, ['id']) || undefined,
    location: pick(vendorRow, ['location_city', 'location', 'service_area', 'address']) || pick(mealRow, ['location', 'service_area']),
    price,
    tags: rowTags.slice(0, 3),
    matchReasons: matchReasons.length > 0 ? matchReasons.slice(0, 3) : ['Recommended'],
    allergySafe,
    budgetFriendly: budgetCeiling > 0 && price > 0 && price <= budgetCeiling,
  }
}

function scoreRecommendation(meal: RecommendedMeal) {
  let score = meal.matchReasons.length
  if (meal.allergySafe) score += 1
  if (meal.budgetFriendly) score += 1
  return score
}

// ── Main Data Fetching ────────────────────────────────────
export async function fetchShoppingPageData(): Promise<ShoppingPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { list: null, addOns: { profile: null, recommendedMeals: [], suggestedIngredients: [] } }

  const [listRes, profileRes, mealsRes, vendorMealsRes, vendorsRes] = await Promise.all([
    supabase.from('shopping_lists').select('*, shopping_list_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('profiles').select('dietary_preferences, allergies, cuisine_preferences, meal_types, budget_range, location, location_city, household_size, phone').eq('id', user.id).maybeSingle(),
    supabase.from('meals')
      .select('id, name, description, image_url, price, vendor_name, cuisine, category, tags, calories_per_serving, prep_time_minutes, is_premium, is_active, created_by, creator:profiles!meals_created_by_fkey(id, full_name, location_city, location)')
      .eq('is_active', true)
      .limit(24),
    supabase.from('vendor_meals').select('id, price, currency, is_available, preparation_time_minutes, notes, meal:meals(id, name, description, tags, category, cuisine, is_active), vendor:vendors(id, business_name, location_city, location_address, is_accepting_orders)').eq('is_available', true).limit(24),
    supabase.from('vendors').select('*').limit(60),
  ])

  const list = (listRes.data as ShoppingList) || null
  const profile = (profileRes.data as UserProfile) || null
  const vendors = ((vendorsRes.data ?? []) as DataRow[])
  const vendorMap = new Map(vendors.map((vendor) => [asString(vendor.id), vendor]))

  const mealRecommendations = ((mealsRes.data ?? []) as DataRow[]).map((meal) => {
    const creator = meal.creator as DataRow | undefined
    return createMealRecommendation(meal, profile, 'meal', creator)
  })

  const vendorMealRecommendations = ((vendorMealsRes.data ?? []) as DataRow[]).map((meal) => {
    const vendorId = pick(meal, ['vendor_id']) || asString((meal.vendor as DataRow | undefined)?.id)
    return createMealRecommendation(meal, profile, 'vendor_meal', vendorId ? vendorMap.get(vendorId) : undefined)
  })

  const recommendedMeals = [...mealRecommendations, ...vendorMealRecommendations]
    .sort((a, b) => scoreRecommendation(b) - scoreRecommendation(a))
    .slice(0, 6)

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

  // Check if list already exists
  const { data: existing } = await supabase
    .from('shopping_lists')
    .select('*, shopping_list_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing as ShoppingList

  // Create new one
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({ user_id: user.id, title: 'Smart Shopping List', total_estimated_cost: 0 })
    .select('*')
    .single()

  if (error) throw error
  revalidatePath('/shopping')
  return { ...data, shopping_list_items: [] } as ShoppingList
}

export async function addShoppingItemAction(
  listId: string,
  item: { name: string; quantity?: string; unit?: string; estimatedPrice?: number; isCartItem?: boolean; mealId?: string; vendorId?: string; vendorName?: string }
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      shopping_list_id: listId,
      ingredient_name: item.name,
      quantity: item.quantity || '1',
      unit: item.unit || null,
      estimated_price: item.estimatedPrice || 0,
      is_checked: false,
      is_cart_item: item.isCartItem ?? false,
      meal_id: item.mealId ?? null,
      vendor_id: item.vendorId ?? null,
      vendor_name: item.vendorName ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  revalidatePath('/shopping')
  return data as ShoppingListItem
}

// Add a meal directly to the cart (one click → ready to checkout)
export async function addMealToCartAction(meal: {
  id: string
  title: string
  price: number
  source: 'meal' | 'vendor_meal'
  vendorId?: string
  vendorName?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Ensure shopping list exists
  let { data: list } = await supabase
    .from('shopping_lists')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!list) {
    const { data: newList, error: listErr } = await supabase
      .from('shopping_lists')
      .insert({ user_id: user.id, title: 'Smart Shopping List', total_estimated_cost: 0 })
      .select('id')
      .single()
    if (listErr) throw listErr
    list = newList
  }

  // Insert as cart item
  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      shopping_list_id: list.id,
      ingredient_name: meal.title,
      quantity: '1',
      unit: 'meal',
      estimated_price: meal.price,
      is_checked: false,
      is_cart_item: true,
      meal_id: meal.id,
      vendor_id: meal.vendorId ?? null,
      vendor_name: meal.vendorName ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  revalidatePath('/shopping')
  return data as ShoppingListItem
}

export async function addMealIngredientsAction(
  listId: string,
  mealId: string,
  source: 'meal' | 'vendor_meal',
  mealTitle: string,
  mealPrice: number
) {
  const supabase = await createClient()
  if (source !== 'meal') {
    return addShoppingItemAction(listId, { name: mealTitle, quantity: '1', estimatedPrice: mealPrice })
  }
  const { data: ingredients } = await supabase.from('recipe_ingredients').select('*').eq('meal_id', mealId).limit(30)
  if (!ingredients || ingredients.length === 0) {
    return addShoppingItemAction(listId, { name: mealTitle, quantity: '1', estimatedPrice: mealPrice })
  }
  const mapped = ingredients.map((ing: any) => ({
    shopping_list_id: listId,
    ingredient_name: pick(ing, ['ingredient', 'ingredient_name', 'item_name', 'name']),
    quantity: pick(ing, ['quantity', 'amount']) || '1',
    unit: pick(ing, ['unit', 'measurement']) || null,
    estimated_price: asNumber(ing.estimated_price ?? ing.price),
    is_checked: false,
    is_cart_item: false,
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

// ── Payhero Checkout ────────────────────────────────────
export async function checkoutShoppingListAction(input: {
  listId: string
  phone: string
  amount: number
}): Promise<CheckoutResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be signed in to checkout.' }
  }

  // ── Validation ──
  if (!input.amount || input.amount < 10) {
    return { success: false, error: 'Minimum order is KES 10.', field: 'amount' }
  }
  if (input.amount > 250_000) {
    return { success: false, error: 'Maximum order is KES 250,000 per transaction.', field: 'amount' }
  }
  if (!isValidKenyanPhone(input.phone)) {
    return { success: false, error: 'Enter a valid Safaricom/Airtel number.', field: 'phone' }
  }

  const normalizedPhone = normalizeKenyanPhone(input.phone)!

  // Verify shopping list belongs to user
  const { data: shoppingList, error: listErr } = await supabase
    .from('shopping_lists')
    .select('id, user_id, shopping_list_items(*)')
    .eq('id', input.listId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (listErr || !shoppingList) {
    return { success: false, error: 'Shopping list not found.' }
  }

  // Rate limit: max 3 pending payments per 10 mins
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .gte('initiated_at', tenMinAgo)

  if ((recentCount ?? 0) >= 3) {
    return {
      success: false,
      error: 'Too many pending payments. Please wait before trying again.',
    }
  }

  const reference = generateReference('SHOP')

  // Insert transaction
  const { error: txnErr } = await supabase
    .from('transactions')
    .insert({
      reference,
      user_id: user.id,
      amount: input.amount,
      currency: 'KES',
      channel: 'mpesa',
      phone: normalizedPhone,
      status: 'pending',
      purpose: 'shopping_cart',
      related_id: input.listId,
      metadata: {
        listId: input.listId,
        phoneToSave: normalizedPhone,
        itemCount: shoppingList.shopping_list_items?.length ?? 0,
      },
    })

  if (txnErr) {
    console.error('[checkoutShoppingList] Transaction insert failed:', txnErr)
    return { success: false, error: 'Could not record payment. Please try again.' }
  }

  // Initiate STK push
  const callbackUrl = `${process.env.PAYHERO_CALLBACK_BASE_URL ?? 'https://pikaplanner.vercel.app'}/api/payhero/callback`

  const stkResult = await initiateSTKPush({
    amount: input.amount,
    phoneNumber: normalizedPhone,
    externalReference: reference,
    customerName: user.user_metadata?.full_name ?? user.email,
    callbackUrl,
  })

  if (!stkResult.success) {
    await supabase
      .from('transactions')
      .update({
        status: 'failed',
        status_message: stkResult.error ?? 'STK Push failed',
        raw_callback: stkResult as any,
      })
      .eq('reference', reference)

    const rawError = stkResult.error?.toLowerCase() ?? ''
    let friendlyError = stkResult.error ?? 'Could not initiate M-Pesa prompt.'

    if (rawError.includes('insufficient balance') && rawError.includes('merchant')) {
      friendlyError = 'Payment service is temporarily unavailable. Please try again shortly.'
      console.error('🚨 [PAYHERO BALANCE LOW] Top up your Payhero wallet immediately!')
    } else if (rawError.includes('invalid phone')) {
      friendlyError = 'Please check your phone number and try again.'
    }

    return { success: false, error: friendlyError }
  }

  // Update with Payhero references
  await supabase
    .from('transactions')
    .update({
      status: 'processing',
      payhero_reference: stkResult.CheckoutRequestID ?? stkResult.reference,
      status_message: stkResult.CustomerMessage,
    })
    .eq('reference', reference)

  return {
    success: true,
    reference,
    message: stkResult.CustomerMessage ?? 'Check your phone to complete the M-Pesa payment.',
  }
}

// Poll for transaction status
export async function fetchTransactionStatusAction(reference: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('transactions')
    .select('reference, status, status_message, mpesa_receipt, completed_at')
    .eq('reference', reference)
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

// Clear paid items after successful checkout
export async function clearPaidItemsAction(listId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify ownership
  const { data: list } = await supabase
    .from('shopping_lists')
    .select('user_id')
    .eq('id', listId)
    .maybeSingle()

  if (!list || list.user_id !== user.id) {
    throw new Error('Not authorized')
  }

  // Delete all items in the list
  await supabase.from('shopping_list_items').delete().eq('shopping_list_id', listId)

  revalidatePath('/shopping')
  return { success: true }
}