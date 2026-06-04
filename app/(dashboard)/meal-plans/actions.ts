'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type MealEntry = {
  id: string
  day_of_week?: string | null
  meal_type?: string | null
  planned_date?: string | null
  calories?: number | null
  meals?: {
    id: string
    name?: string | null
    image_url?: string | null
    prep_time_minutes?: number | null
    cook_time_minutes?: number | null
    calories_per_serving?: number | null
    cuisine?: string | null
    dietary_tags?: string[] | null
  } | null
}

export type MealPlan = {
  id: string
  name?: string | null
  status?: string | null
  generated_by_ai?: boolean | null
  week_start_date?: string | null
  start_date?: string | null
  created_at?: string | null
  meal_plan_entries?: MealEntry[]
}

export type UserPreferences = {
  dietary_preferences?: string[]
  cuisine_preferences?: string[]
  budget_range?: string
  household_size?: number
}

export type MealPlanPageData = {
  plan: MealPlan | null
  preferences: UserPreferences | null
}

// ── Main Data Fetching ────────────────────────────────────
export async function fetchMealPlanData(): Promise<MealPlanPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { plan: null, preferences: null }

  // 🚀 PARALLEL FETCHING (Massive speedup)
  const [planRes, prefRes] = await Promise.all([
    supabase
      .from('meal_plans')
      .select('*, meal_plan_entries(*, meals(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('dietary_preferences, cuisine_preferences, budget_range, household_size')
      .eq('id', user.id)
      .maybeSingle()
  ])

  return {
    plan: (planRes.data as MealPlan) || null,
    preferences: (prefRes.data as UserPreferences) || null,
  }
}

// ── AI Generation Action ──────────────────────────────────
export async function generateAIPlanAction(preferences: UserPreferences | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const budgetPerDay = preferences?.budget_range 
    ? parseInt(preferences.budget_range.split('-')[1] || '1000') 
    : 1000

  const { error } = await supabase.functions.invoke('generate-meal-plan', {
    body: {
      userId: user.id,
      cuisinePreferences: preferences?.cuisine_preferences ?? ['kenyan', 'healthy'],
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      allergies: preferences?.dietary_preferences?.filter((d: string) => d === 'Gluten-Free' || d === 'Dairy-Free') ?? [],
      budgetPerDay,
      targetCalories: 2000,
    },
  })

  if (error) throw new Error(error.message)
  
  revalidatePath('/meal-generator')
  revalidatePath('/dashboard/user/meal-generator')
  return { success: true }
}