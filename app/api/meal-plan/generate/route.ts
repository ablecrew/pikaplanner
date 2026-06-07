import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { MealPlanSchema, type MealPlan } from '@/lib/schemas/ai-plan'

// ── Validation Schema ─────────────────────────────────────
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

// ── Subscription Tier Limits ────────────────────────────
const TIER_LIMITS: Record<string, { perDay: number; perPeriod: number; periodDays: number }> = {
  daily:   { perDay: 1,   perPeriod: 1,    periodDays: 1 },
  weekly:  { perDay: 3,   perPeriod: 10,   periodDays: 7 },
  monthly: { perDay: 5,   perPeriod: 50,   periodDays: 30 },
  yearly:  { perDay: 999, perPeriod: 9999, periodDays: 365 },
  free:    { perDay: 0,   perPeriod: 0,    periodDays: 1 },
}

// ── Subscription Check Helper ───────────────────────────
async function checkSubscriptionAccess(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role configuration is missing')
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

  // Fetch active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, tier, status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const tier = sub?.tier ?? null
  const isActive = !!sub
  const isPremium = isActive && tier !== 'free' && tier !== null

  if (!isPremium) {
    return {
      allowed: false,
      tier,
      reason: 'subscription_required' as const,
      message: tier === 'free' || !tier
        ? 'A subscription is required to generate AI meal plans.'
        : 'Your subscription has expired. Renew to continue generating meal plans.',
    }
  }

  const limits = TIER_LIMITS[tier ?? 'free'] ?? TIER_LIMITS.free

  // Count today's generations
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: dayCount } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_ai_generated', true)
    .gte('created_at', todayStart.toISOString())

  if ((dayCount ?? 0) >= limits.perDay) {
    return {
      allowed: false,
      tier,
      reason: 'rate_limit' as const,
      message: `You've reached your daily limit of ${limits.perDay} meal plan${
        limits.perDay === 1 ? '' : 's'
      }. ${tier === 'yearly' ? 'Try again tomorrow.' : 'Try again tomorrow or upgrade for higher limits.'}`,
    }
  }

  // Count this period's generations
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - limits.periodDays)

  const { count: periodCount } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_ai_generated', true)
    .gte('created_at', periodStart.toISOString())

  if ((periodCount ?? 0) >= limits.perPeriod) {
    return {
      allowed: false,
      tier,
      reason: 'rate_limit' as const,
      message: `You've used all ${limits.perPeriod} generations for this ${tier} period. Upgrade to a higher tier for more.`,
    }
  }

  return {
    allowed: true,
    tier,
    isPremium,
    generationsToday: dayCount ?? 0,
    generationsThisPeriod: periodCount ?? 0,
    dailyLimit: limits.perDay,
    periodLimit: limits.perPeriod,
    // Premium-tier features
    hasFullCatalog: tier === 'yearly' || tier === 'monthly',
  }
}

// ── Track Generation (for rate-limit counting) ──────────
async function trackGeneration(userId: string, planTitle: string, source: 'ai' | 'fallback') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

  const today = new Date()
  const startDate = today.toISOString().slice(0, 10)
  const endDateObj = new Date(today)
  endDateObj.setDate(today.getDate() + 6)
  const endDate = endDateObj.toISOString().slice(0, 10)

  // Insert a minimal meal_plan record so rate-limit counting works
  // This is just for tracking — the actual plan is what the API returns
  const { error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      title: planTitle,
      plan_type: 'weekly',
      start_date: startDate,
      end_date: endDate,
      is_ai_generated: source === 'ai',
      is_active: false, // Mark as inactive so it doesn't conflict with the main meal-plans page
      notes: `Generated via meal generator (${source})`,
    })

  if (error) {
    console.warn('[trackGeneration] Could not log meal plan:', error)
  }
}

// ── Helper Functions ──────────────────────────────────────
function normalize(value?: string | null) {
  return (value ?? '').trim().toLowerCase()
}

function mealText(meal: DbMeal) {
  return [meal.name, meal.cuisine, meal.category, ...(meal.tags ?? [])]
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
    meal.calories_per_serving <=
      (preferences.caloriesPerDay / Math.max(1, preferences.mealsPerDay)) * 1.4

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

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

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

// ── Main Handler ──────────────────────────────────────────
export async function POST(req: Request) {
  // ── 1. AUTH CHECK ────────────────────────────────────
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'You must be signed in to generate a meal plan.',
        reason: 'auth',
      },
      { status: 401 }
    )
  }

  // ── 2. SUBSCRIPTION + RATE LIMIT CHECK ───────────────
  let accessCheck
  try {
    accessCheck = await checkSubscriptionAccess(user.id)
  } catch (err) {
    console.error('[Meal Generator] Subscription check failed:', err)
    return NextResponse.json(
      { success: false, error: 'Could not verify subscription. Please try again.' },
      { status: 500 }
    )
  }

  if (!accessCheck.allowed) {
    const statusCode = accessCheck.reason === 'subscription_required' ? 402 : 429
    return NextResponse.json(
      {
        success: false,
        error: accessCheck.message,
        reason: accessCheck.reason,
        upgradeUrl: '/dashboard/user/subscription',
        tier: accessCheck.tier,
      },
      { status: statusCode }
    )
  }

  // ── 3. Parse Request Body ───────────────────────────────
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

  const { preferences } = parsed.data
  // Use server-verified subscription tier instead of trusting client
  const isPremium = accessCheck.hasFullCatalog ?? false

  // ── 4. AI Generation Attempt ────────────────────────────
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

    // Track the generation for rate-limit counting
    await trackGeneration(user.id, result.object.title, 'ai')

    return NextResponse.json({
      success: true,
      source: 'ai',
      data: result.object,
      // Return updated usage info
      usage: {
        generationsToday: (accessCheck.generationsToday ?? 0) + 1,
        dailyLimit: accessCheck.dailyLimit,
        generationsThisPeriod: (accessCheck.generationsThisPeriod ?? 0) + 1,
        periodLimit: accessCheck.periodLimit,
      },
    })
  } catch (error) {
    console.error('Meal generation failed, using fallback:', error)

    try {
      const fallbackPlan = await buildFallbackMealPlan(preferences)

      // Track the fallback generation too
      await trackGeneration(user.id, fallbackPlan.title, 'fallback')

      return NextResponse.json({
        success: true,
        source: 'fallback',
        data: fallbackPlan,
        usage: {
          generationsToday: (accessCheck.generationsToday ?? 0) + 1,
          dailyLimit: accessCheck.dailyLimit,
          generationsThisPeriod: (accessCheck.generationsThisPeriod ?? 0) + 1,
          periodLimit: accessCheck.periodLimit,
        },
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