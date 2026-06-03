'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ItemType = 'all' | 'meal' | 'recipe' | 'vendor' | 'vendor_meal'

export interface FavoriteRecord {
  id: string
  user_id: string
  item_type: string
  item_id: string
  created_at: string
  notes: string | null
}

export interface MealData {
  id: string
  name?: string
  title?: string
  description?: string
  image_url?: string
  calories?: number
  prep_time?: number
  servings?: number
  meal_type?: string
  category?: string
  dietary_tags?: string[]
  [key: string]: unknown
}

export interface VendorData {
  id: string
  business_name?: string
  name?: string
  logo_url?: string
  image_url?: string
  cuisine_types?: string[]
  rating?: number
  delivery_option?: string
  service_areas?: string[]
  is_active?: boolean
  [key: string]: unknown
}

export interface VendorMealData {
  id: string
  name?: string
  title?: string
  description?: string
  image_url?: string
  price?: number
  vendor_id?: string
  vendor_name?: string
  calories?: number
  prep_time?: number
  servings?: number
  [key: string]: unknown
}

export interface EnrichedFavorite {
  favorite: FavoriteRecord
  data: MealData | VendorData | VendorMealData | null
}

export async function fetchUserFavorites(userId: string): Promise<EnrichedFavorite[]> {
  const supabase = await createClient()

  const { data: favRecords, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !favRecords || favRecords.length === 0) return []

  const grouped: Record<string, string[]> = {}
  for (const fav of favRecords) {
    if (!grouped[fav.item_type]) grouped[fav.item_type] = []
    grouped[fav.item_type].push(fav.item_id)
  }

  const mealIds = [...(grouped['meal'] || []), ...(grouped['recipe'] || [])]
  const vendorIds = grouped['vendor'] || []
  const vendorMealIds = grouped['vendor_meal'] || []

  // 🚀 PARALLEL FETCHING (Massive speedup)
  const [mealsRes, vendorsRes, vendorMealsRes] = await Promise.all([
    mealIds.length > 0 ? supabase.from('meals').select('*').in('id', mealIds) : Promise.resolve({ data: [] }),
    vendorIds.length > 0 ? supabase.from('vendors').select('*').in('id', vendorIds) : Promise.resolve({ data: [] }),
    vendorMealIds.length > 0 ? supabase.from('vendor_meals').select('*').in('id', vendorMealIds) : Promise.resolve({ data: [] })
  ])

  const dataMap: Record<string, Record<string, unknown>> = {}
  
  ;(mealsRes.data || []).forEach((m: any) => { dataMap[m.id] = m })
  ;(vendorsRes.data || []).forEach((v: any) => { dataMap[v.id] = v })
  ;(vendorMealsRes.data || []).forEach((vm: any) => { dataMap[vm.id] = vm })

  return favRecords.map((fav: any) => ({
    favorite: fav,
    data: (dataMap[fav.item_id] as MealData | VendorData | VendorMealData) || null,
  }))
}

export async function removeFavoriteAction(favoriteId: string) {
  const supabase = await createClient()
  await supabase.from('user_favorites').delete().eq('id', favoriteId)
  revalidatePath('/dashboard/user/favorites')
}

export async function bulkRemoveAction(ids: string[]) {
  const supabase = await createClient()
  await supabase.from('user_favorites').delete().in('id', ids)
  revalidatePath('/dashboard/user/favorites')
}

export async function addToMealPlanAction(userId: string, itemId: string) {
  const supabase = await createClient()
  let { data: plan } = await supabase.from('meal_plans').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
  
  if (!plan) {
    const { data: newPlan } = await supabase.from('meal_plans').insert({ user_id: userId, name: 'My Meal Plan' }).select('id').single()
    plan = newPlan
  }
  
  if (plan) {
    await supabase.from('meal_plan_entries').insert({ meal_plan_id: plan.id, meal_id: itemId })
  }
}

export async function addToShoppingListAction(userId: string, mealId: string) {
  const supabase = await createClient()
  const { data: ingredients } = await supabase.from('recipe_ingredients').select('*').eq('meal_id', mealId)
  if (!ingredients || ingredients.length === 0) return

  let { data: list } = await supabase.from('shopping_lists').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
  
  if (!list) {
    const { data: newList } = await supabase.from('shopping_lists').insert({ user_id: userId, name: 'My Shopping List' }).select('id').single()
    list = newList
  }
  
  if (list) {
    const getField = (obj: any, ...keys: string[]) => {
      for (const key of keys) if (obj[key]) return String(obj[key])
      return 'Item'
    }
    const items = ingredients.map((ing: any) => ({
      shopping_list_id: list!.id,
      name: getField(ing, 'ingredient', 'name', 'item_name'),
      quantity: getField(ing, 'amount', 'quantity', 'measurement'),
      is_checked: false,
    }))
    await supabase.from('shopping_list_items').insert(items)
  }
}