'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createMeal, deleteMeal, setMealAvailability, updateMeal } from '@/app/actions/manageMeals'

export type MealStatus = 'Available' | 'Unavailable' | 'Archived'

export type MealRecord = {
  id: string
  name: string
  slug: string
  vendorId: string
  vendor: string
  category: string
  cuisine: string
  price: string
  description: string
  status: MealStatus
  createdAt: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  caloriesPerServing: number
  proteinG: number
  carbsG: number
  fatG: number
  difficulty: string
  tags: string[]
  isPremium: boolean
  imageUrl: string
  createdBy: string
  vendorMealId?: string
}

export type VendorRow = {
  id: string
  business_name?: string | null
  name?: string | null
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function fetchAdminMealsData(): Promise<{ meals: MealRecord[], vendors: VendorRow[] }> {
  const supabase = await createClient()

  // 🚀 PARALLEL FETCHING (Massive speedup)
  const [{ data: mealsData }, { data: vendorMealsData }, { data: vendorsData }] = await Promise.all([
    supabase.from('meals').select('*').order('created_at', { ascending: false }),
    supabase.from('vendor_meals').select('*'),
    supabase.from('vendors').select('id, business_name, name'),
  ])

  const vendors = (vendorsData ?? []) as VendorRow[]
  const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor]))

  const vendorMealMap = new Map<string, any>()
  ;(vendorMealsData ?? []).forEach((entry: any) => {
    if (!vendorMealMap.has(entry.meal_id)) vendorMealMap.set(entry.meal_id, entry)
  })

  const mapped: MealRecord[] = ((mealsData ?? []) as any[]).map((meal) => {
    const vendorMeal = vendorMealMap.get(meal.id)
    const vendor = vendorMeal ? vendorMap.get(vendorMeal.vendor_id) : null

    let status: MealStatus = 'Available'
    if (!meal.is_active) status = 'Archived'
    else if (vendorMeal && vendorMeal.is_available === false) status = 'Unavailable'

    return {
      id: meal.id,
      name: meal.name,
      slug: meal.slug,
      vendorId: vendorMeal?.vendor_id || '',
      vendor: vendor?.business_name || 'No vendor linked',
      category: meal.category,
      cuisine: meal.cuisine,
      price: vendorMeal?.price != null ? `KES ${vendorMeal.price}` : '—',
      description: meal.description || '',
      status,
      createdAt: formatDate(meal.created_at),
      prepTimeMinutes: meal.prep_time_minutes || 0,
      cookTimeMinutes: meal.cook_time_minutes || 0,
      servings: meal.servings,
      caloriesPerServing: meal.calories_per_serving || 0,
      proteinG: meal.protein_g || 0,
      carbsG: meal.carbs_g || 0,
      fatG: meal.fat_g || 0,
      difficulty: meal.difficulty || 'easy',
      tags: meal.tags || [],
      isPremium: meal.is_premium,
      imageUrl: meal.image_url || '',
      createdBy: meal.created_by || '',
      vendorMealId: vendorMeal?.id,
    }
  })

  return { meals: mapped, vendors }
}

// ── Secure Mutation Wrappers ──────────────────────────────

export async function createMealAction(payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const result = await createMeal({ ...payload, createdBy: user?.id })
  revalidatePath('/dashboard/admin/meals')
  return result
}

export async function updateMealAction(payload: any) {
  const result = await updateMeal(payload)
  revalidatePath('/dashboard/admin/meals')
  return result
}

export async function setMealAvailabilityAction(id: string, status: MealStatus) {
  const result = await setMealAvailability(id, status)
  revalidatePath('/dashboard/admin/meals')
  return result
}

export async function deleteMealAction(id: string) {
  const result = await deleteMeal(id)
  revalidatePath('/dashboard/admin/meals')
  return result
}