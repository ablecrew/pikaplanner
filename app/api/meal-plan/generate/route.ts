import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { MealPlanSchema, type MealPlan } from '@/lib/schemas/ai-plan'

const RequestSchema = z.object({
  preferences: z.object({
    cuisines: z.array(z.string()).default([]),
    dislikes: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    budget: z.number().optional(),
    caloriesPerDay: z.number().optional(),
    mealsPerDay: z.number().default(3),
  }),
  isPremium: z.boolean().default(false),
})

type RequestBody = z.infer<typeof RequestSchema>

type DbMeal = {
  id: string
  name: string | null
  cuisine: string | null
  category: string | null
  calories_per_serving: number | null
  difficulty: string | null
  tags: string[] | null
  is_active: boolean | null
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase()
}

function mealText(meal: DbMeal) {
  return [
    meal.name,
    meal.cuisine,
    meal.category,
    ...(meal.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function matchesPreferences(meal: DbMeal, preferences: RequestBody['preferences']) {
  const text = mealText(meal)

  const cuisineOk =
    preferences.cuisines.length === 0 ||
    preferences.cuisines.some((cuisine) => normalize(cuisine) === normalize(meal.cuisine))

  const disliked = preferences.dislikes.some((item) => text.includes(normalize(item)))
  const allergy = preferences.allergies.some((item) => text.includes(normalize(item)))

  const calorieOk =
    !preferences.caloriesPerDay ||
    meal.calories_per_serving == null ||
    meal.calories_per_serving <= (preferences.caloriesPerDay / Math.max(1, preferences.mealsPerDay)) * 1.4

  return cuisineOk && !disliked && !allergy && calorieOk
}

function scoreMeal(meal: DbMeal, preferences: RequestBody['preferences']) {
  let score = 0

  const cuisine = normalize(meal.cuisine)
  const category = normalize(meal.category)

  if (preferences.cuisines.some((c) => normalize(c) === cuisine)) score += 20
  if (category.includes('breakfast')) score += 8
  if (category.includes('lunch')) score += 8
  if (category.includes('dinner')) score += 8
  if (category.includes('snack')) score += 4

  if (preferences.caloriesPerDay && meal.calories_per_serving != null) {
    const target = preferences.caloriesPerDay / Math.max(1, preferences.mealsPerDay)
    const diff = Math.abs(meal.calories_per_serving - target)
    score += Math.max(0, 10 - diff / 50)
  }

  if (meal.difficulty) {
    const diff = normalize(meal.difficulty)
    if (diff === 'easy') score += 2
    if (diff === 'medium') score += 1
  }

  return score
}

function pickMeal(pool: DbMeal[], index: number): DbMeal | null {
  if (pool.length === 0) return null
  return pool[index % pool.length]
}

function mealName(meal: DbMeal | null, fallback: string) {
  return meal?.name?.trim() || fallback
}

async function buildFallbackMealPlan(preferences: RequestBody['preferences']): Promise<MealPlan> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role configuration is missing')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: meals, error } = await supabase
    .from('meals')
    .select('id, name, cuisine, category, calories_per_serving, difficulty, tags, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  const allMeals = (meals || []) as DbMeal[]

  if (allMeals.length === 0) {
    throw new Error('No meals available in the database for fallback generation')
  }

  const matchedMeals = allMeals
    .filter((meal) => matchesPreferences(meal, preferences))
    .sort((a, b) => scoreMeal(b, preferences) - scoreMeal(a, preferences))

  const usableMeals = matchedMeals.length > 0 ? matchedMeals : allMeals

  const breakfastPool = usableMeals.filter((meal) => normalize(meal.category).includes('breakfast'))
  const lunchPool = usableMeals.filter((meal) => normalize(meal.category).includes('lunch'))
  const dinnerPool = usableMeals.filter((meal) => normalize(meal.category).includes('dinner'))
  const snackPool = usableMeals.filter((meal) => normalize(meal.category).includes('snack'))

  const title =
    preferences.cuisines.length > 0
      ? `${preferences.cuisines[0]} Weekly Meal Plan`
      : 'Personalized Meal Plan'

  const description =
    matchedMeals.length > 0
      ? 'Generated from meals matched to your preferences in the database.'
      : 'Generated from available meals in the database.'

  const plan: MealPlan = {
        title,
        description,
        days: DAYS.map((day, index) => {
          const breakfast = pickMeal(breakfastPool.length > 0 ? breakfastPool : usableMeals, index)
          const lunch = pickMeal(lunchPool.length > 0 ? lunchPool : usableMeals, index + 2)
          const dinner = pickMeal(dinnerPool.length > 0 ? dinnerPool : usableMeals, index + 4)
          const snack = pickMeal(snackPool.length > 0 ? snackPool : usableMeals, index + 6)
      
          const notes: string[] = []
      
          if (preferences.cuisines.length > 0) {
            notes.push(`Cuisine focus: ${preferences.cuisines[0]}`)
          }
      
          if (preferences.caloriesPerDay) {
            notes.push(`Target daily calories: ${preferences.caloriesPerDay}`)
          }
      
          return {
            day,
            breakfast: mealName(breakfast, `${day} breakfast`),
            lunch: mealName(lunch, `${day} lunch`),
            dinner: mealName(dinner, `${day} dinner`),
            snacks: snack?.name ? [snack.name] : [],
            notes: notes.join(' · '),
          }
        }),
   }

  return MealPlanSchema.parse(plan)
}

export async function POST(req: Request) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = RequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { preferences, isPremium } = parsed.data

  try {
    const model = isPremium ? openai('gpt-4.1') : openai('gpt-4o-mini')

    const result = await generateObject({
      model,
      schema: MealPlanSchema,
      prompt: `
You are a meal planning assistant.

Generate a 7-day meal plan based on these user preferences:

${JSON.stringify(preferences, null, 2)}

Rules:
- Respect cuisines, allergies, dislikes, and budget if provided
- Make meals realistic and practical
- Use simple, clear meal names
- Return exactly 7 days
- Every day must include:
  - day
  - breakfast
  - lunch
  - dinner
  - snacks (array, can be empty)
  - notes (string, can be empty)
- Do not include any extra text outside the schema
      `,
    })

    return NextResponse.json({
      success: true,
      source: 'ai',
      data: result.object,
    })
  } catch (error) {
    console.error('Meal generation failed, using fallback:', error)

    try {
      const fallbackPlan = await buildFallbackMealPlan(preferences)

      return NextResponse.json({
        success: true,
        source: 'fallback',
        data: fallbackPlan,
      })
    } catch (fallbackError) {
      console.error('Fallback meal generation failed:', fallbackError)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate meal plan',
        },
        { status: 500 }
      )
    }
  }
}