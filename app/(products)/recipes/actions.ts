'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateRecipeForMeal } from '@/lib/recipes/generator'

export type Recipe = {
  id: string
  name: string
  slug: string
  description: string | null
  cuisine: string | null
  category: string | null
  image_url: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  calories_per_serving: number | null
  difficulty_level: string | null
  tags: string[] | null
  instructions: any[] | null
  tips: string[] | null
  equipment_needed: string[] | null
  prep_notes: string | null
  storage_instructions: string | null
  nutrition_notes: string | null
  is_premium: boolean
  is_active: boolean
  views: number
  recipe_generated_at: string | null
  recipe_source: string | null
  ingredients?: RecipeIngredient[]
  is_saved?: boolean
  view_count?: number
}

export type RecipeIngredient = {
  id: string
  name: string
  quantity: string | null
  unit: string | null
  notes: string | null
  estimated_price: number
  is_optional: boolean
  display_order: number
}

export type RecipesPageData = {
  recipes: Recipe[]
  cuisines: string[]
  categories: string[]
  savedRecipeIds: string[]
}

// ── Fetch all recipes (for library page) ──────────────────
export async function fetchRecipesPageData(): Promise<RecipesPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [recipesRes, savedRes] = await Promise.all([
    supabase
      .from('meals')
      .select('id, name, slug, description, cuisine, category, image_url, prep_time_minutes, cook_time_minutes, servings, calories_per_serving, difficulty_level, tags, is_premium, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(60),
    user
      ? supabase.from('saved_recipes').select('meal_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const recipes = (recipesRes.data ?? []) as Recipe[]
  const savedRecipeIds = (savedRes.data ?? []).map((s: any) => s.meal_id)

  const cuisines = Array.from(new Set(recipes.map((r) => r.cuisine).filter(Boolean))) as string[]
  const categories = Array.from(new Set(recipes.map((r) => r.category).filter(Boolean))) as string[]

  return {
    recipes: recipes.map((r) => ({ ...r, is_saved: savedRecipeIds.includes(r.id) })),
    cuisines: cuisines.sort(),
    categories: categories.sort(),
    savedRecipeIds,
  }
}

// ── Fetch single recipe by slug (with on-demand generation) ──
export async function fetchRecipeBySlug(slug: string): Promise<Recipe | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
  
    // 1. Fetch meal (NO join to avoid errors)
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
  
    if (!meal || mealError) return null
  
    // 2. Fetch ingredients separately (without display_order)
    const { data: ingredients } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('meal_id', meal.id)
  
    // 3. Check if recipe needs generation
    const needsGeneration =
      !ingredients ||
      ingredients.length === 0 ||
      !meal.instructions ||
      !Array.isArray(meal.instructions) ||
      meal.instructions.length === 0
  
    if (needsGeneration) {
      const result = await generateRecipeForMeal(meal.id)
      if (result.success) {
        const { data: newIngredients } = await supabase
          .from('recipe_ingredients')
          .select('*')
          .eq('meal_id', meal.id)
        if (newIngredients) {
          ingredients?.push(...newIngredients)
        }
      }
    }
  
    // 4. Track view (fire-and-forget)
    if (user) {
      supabase
        .from('recipe_views')
        .insert({ meal_id: meal.id, user_id: user.id, source: 'recipes_page' })
        .then(() => {})
    }
  
    // 5. Check if saved
    let isSaved = false
    if (user) {
      const { data: saved } = await supabase
        .from('saved_recipes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('meal_id', meal.id)
        .maybeSingle()
      isSaved = !!saved
    }
  
    // 6. Get view count
    const { count: viewCount } = await supabase
      .from('recipe_views')
      .select('*', { count: 'exact', head: true })
      .eq('meal_id', meal.id)
  
    return {
      ...meal,
      ingredients: ingredients ?? [],
      is_saved: isSaved,
      view_count: viewCount ?? 0,
    } as Recipe
  }

// ── Toggle save/unsave a recipe ───────────────────────────
export async function toggleSaveRecipeAction(mealId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check current state
  const { data: existing } = await supabase
    .from('saved_recipes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('meal_id', mealId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', user.id)
      .eq('meal_id', mealId)

    revalidatePath('/recipes')
    return { success: true, saved: false, message: 'Recipe removed from favorites' }
  }

  await supabase.from('saved_recipes').insert({ user_id: user.id, meal_id: mealId })

  revalidatePath('/recipes')
  return { success: true, saved: true, message: 'Recipe saved!' }
}

// ── Get recipe from a meal_plan_entry context ─────────────
export async function fetchRecipeForMealPlanEntry(entryId: string): Promise<Recipe | null> {
  const supabase = await createClient()

  // Get the meal_id from the entry
  const { data: entry } = await supabase
    .from('meal_plan_entries')
    .select('meal_id, meals(slug)')
    .eq('id', entryId)
    .maybeSingle()

  if (!entry || !entry.meals) return null

  const meal = entry.meals as any
  return fetchRecipeBySlug(meal.slug)
}

// ── Admin: Manually trigger recipe generation ─────────────
export async function generateRecipeAction(mealId: string) {
  const result = await generateRecipeForMeal(mealId)
  if (result.success) {
    revalidatePath('/recipes')
  }
  return result
}