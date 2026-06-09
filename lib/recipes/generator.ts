import 'server-only'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// ── Recipe schema for AI generation ──────────────────────────────
// NOTE: OpenAI structured output requires ALL nested properties
// to be required. Use .default() instead of .optional().
const RecipeSchema = z.object({
  description: z.string().describe('A 2-3 sentence appetizing description of the meal'),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  ingredients: z.array(
    z.object({
      name: z.string().describe('Name of the ingredient'),
      quantity: z.string().describe('Amount needed, e.g. "2" or "1/2"'),
      unit: z.string().describe('Unit of measurement, e.g. "cups", "pieces", "tbsp"'),
      notes: z.string().describe('Preparation notes or substitute info, e.g. "finely chopped"'),
      estimated_price: z.number().describe('Estimated price in KES for this ingredient'),
      is_optional: z.boolean().describe('Whether this ingredient can be skipped'),
    })
  ).min(3).max(20),
  instructions: z.array(
    z.object({
      step: z.number().describe('Step number starting from 1'),
      title: z.string().describe('Short title for this step'),
      description: z.string().describe('Detailed instructions for this step'),
      duration_minutes: z.number().describe('Approximate time for this step in minutes'),
      tip: z.string().describe('Helpful tip for this step'),
    })
  ).min(3).max(15),
  tips: z.array(z.string()).min(2).max(6),
  equipment_needed: z.array(z.string()).describe('List of kitchen equipment needed'),
  prep_notes: z.string().describe('General preparation notes'),
  storage_instructions: z.string().describe('How to store leftovers'),
  nutrition_notes: z.string().describe('Brief nutrition information'),
})

export type GeneratedRecipe = z.infer<typeof RecipeSchema>

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Generates and caches a recipe for a meal using AI.
 * If the recipe already exists, returns the cached version.
 */
export async function generateRecipeForMeal(mealId: string): Promise<{
  success: true
  cached: boolean
} | {
  success: false
  error: string
}> {
  const supabase = getServiceClient()

  // 1. Fetch the meal
  const { data: meal, error: mealErr } = await supabase
    .from('meals')
    .select('*')
    .eq('id', mealId)
    .maybeSingle()

  if (mealErr || !meal) {
    return { success: false, error: 'Meal not found' }
  }

  // 2. Check if recipe already exists
  const { count: ingredientCount } = await supabase
    .from('recipe_ingredients')
    .select('*', { count: 'exact', head: true })
    .eq('meal_id', mealId)

  if (
    ingredientCount !== null &&
    ingredientCount > 0 &&
    meal.instructions &&
    Array.isArray(meal.instructions) &&
    meal.instructions.length > 0
  ) {
    return { success: true, cached: true }
  }

  // 3. Generate the recipe via AI
  try {
    const { object: recipe } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: RecipeSchema,
      prompt: `Generate a detailed recipe for "${meal.name}".

CONTEXT:
- Cuisine: ${meal.cuisine ?? 'general'}
- Category: ${meal.category ?? 'main meal'}
- Servings: ${meal.servings ?? 4}
- Calories per serving: ${meal.calories_per_serving ?? 400}
- Existing tags: ${(meal.tags ?? []).join(', ') || 'none'}

REQUIREMENTS:
- Use authentic ingredients and methods typical for ${meal.cuisine ?? 'this cuisine'}
- Adapt to Kenyan home kitchens (basic equipment, locally-available ingredients)
- Use Kenyan ingredient names where appropriate (e.g., "sukuma wiki" instead of just "collard greens")
- Provide realistic price estimates in KES per ingredient
- Instructions must be clear enough for a beginner home cook
- Include practical tips for storage, prep ahead, substitutions
- Equipment should be common household items (avoid specialty gadgets)
- Mention any common allergens in ingredient notes
- EVERY field must have a value - use "N/A" or empty string only as absolute last resort

Be specific and practical. Aim for delicious, achievable home-cooked results.`,
      maxRetries: 2,
    })

    // 4. Persist to database
    await supabase
      .from('meals')
      .update({
        description: meal.description || recipe.description,
        difficulty_level: recipe.difficulty_level,
        instructions: recipe.instructions,
        tips: recipe.tips,
        equipment_needed: recipe.equipment_needed ?? [],
        prep_notes: recipe.prep_notes || null,
        storage_instructions: recipe.storage_instructions || null,
        nutrition_notes: recipe.nutrition_notes || null,
        recipe_generated_at: new Date().toISOString(),
        recipe_source: 'ai',
      })
      .eq('id', mealId)

    // 5. Insert ingredients
    if (recipe.ingredients.length > 0) {
      await supabase.from('recipe_ingredients').delete().eq('meal_id', mealId)

      const ingredientsToInsert = recipe.ingredients.map((ing, idx) => ({
        meal_id: mealId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit || null,
        notes: ing.notes || null,
        estimated_price: ing.estimated_price || 0,
        is_optional: ing.is_optional || false,
        display_order: idx,
      }))

      await supabase.from('recipe_ingredients').insert(ingredientsToInsert)
    }

    return { success: true, cached: false }
  } catch (err) {
    console.error('[generateRecipeForMeal]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Recipe generation failed',
    }
  }
}

/**
 * Bulk-generate recipes for multiple meals (background task).
 */
export async function bulkGenerateRecipes(mealIds: string[]) {
  const results = await Promise.allSettled(
    mealIds.map((id) => generateRecipeForMeal(id))
  )

  return {
    total: results.length,
    succeeded: results.filter((r) => r.status === 'fulfilled' && r.value.success).length,
    failed: results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length,
  }
}