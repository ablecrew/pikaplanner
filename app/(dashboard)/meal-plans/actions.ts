'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

// ── Types (match REAL schema) ─────────────────────────────
export type MealEntry = {
  id: string
  meal_plan_id?: string | null
  meal_id?: string | null
  scheduled_date?: string | null
  meal_category?: string | null
  servings?: number | null
  is_ordered?: boolean | null
  is_cooked?: boolean | null
  notes?: string | null
  meals?: {
    id: string
    name?: string | null
    slug?: string | null
    image_url?: string | null
    prep_time_minutes?: number | null
    cook_time_minutes?: number | null
    calories_per_serving?: number | null
    cuisine?: string | null
    category?: string | null
    tags?: string[] | null
  } | null
}

export type MealPlan = {
  id: string
  user_id?: string | null
  title?: string | null
  plan_type?: string | null
  start_date?: string | null
  end_date?: string | null
  is_ai_generated?: boolean | null
  is_active?: boolean | null
  notes?: string | null
  created_at?: string | null
  meal_plan_entries?: MealEntry[]
}

export type UserPreferences = {
  dietary_preferences?: string[]
  cuisine_preferences?: string[]
  budget_range?: string
  household_size?: number
}

// Subscription info exposed to client
export type SubscriptionInfo = {
  isActive: boolean
  isPremium: boolean
  tier: string | null
  expiresAt: string | null
  daysRemaining: number
  generationsToday: number
  generationsThisPeriod: number
  dailyLimit: number
  periodLimit: number
  canGenerate: boolean
}

export type MealPlanPageData = {
  plan: MealPlan | null
  preferences: UserPreferences | null
  subscription: SubscriptionInfo 
}

// Updated to include subscription_required + rate_limit
export type GenerateResult =
  | { success: true; source: 'ai' | 'fallback'; message?: string }
  | {
      success: false
      reason: 'auth' | 'subscription_required' | 'rate_limit' | 'quota' | 'no_meals' | 'unknown'
      message: string
      upgradeUrl?: string
    }

// ── Module-Scope Constants ────────────────────────────────
const ALL_MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealCategory = typeof ALL_MEAL_CATEGORIES[number]

// Rate limits per subscription tier
const TIER_LIMITS: Record<string, { perDay: number; perPeriod: number; periodDays: number }> = {
  daily:   { perDay: 1,   perPeriod: 1,    periodDays: 1 },
  weekly:  { perDay: 3,   perPeriod: 10,   periodDays: 7 },
  monthly: { perDay: 5,   perPeriod: 50,   periodDays: 30 },
  yearly:  { perDay: 999, perPeriod: 9999, periodDays: 365 },
  free:    { perDay: 0,   perPeriod: 0,    periodDays: 1 },
}

// ── Subscription Helper ───────────────────────────────────
async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const supabase = await createClient()

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

  const limits = TIER_LIMITS[tier ?? 'free'] ?? TIER_LIMITS.free

  // Count today's AI generations
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: dayCount } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_ai_generated', true)
    .gte('created_at', todayStart.toISOString())

  // Count this period's generations
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - limits.periodDays)

  const { count: periodCount } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_ai_generated', true)
    .gte('created_at', periodStart.toISOString())

  const generationsToday = dayCount ?? 0
  const generationsThisPeriod = periodCount ?? 0

  const daysRemaining = sub?.expires_at
    ? Math.max(
        0,
        Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0

  const canGenerate =
    isPremium &&
    generationsToday < limits.perDay &&
    generationsThisPeriod < limits.perPeriod

  return {
    isActive,
    isPremium,
    tier,
    expiresAt: sub?.expires_at ?? null,
    daysRemaining,
    generationsToday,
    generationsThisPeriod,
    dailyLimit: limits.perDay,
    periodLimit: limits.perPeriod,
    canGenerate,
  }
}

// ── Data Fetching ─────────────────────────────────────────
export async function fetchMealPlanData(): Promise<MealPlanPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      plan: null,
      preferences: null,
      subscription: {
        isActive: false,
        isPremium: false,
        tier: null,
        expiresAt: null,
        daysRemaining: 0,
        generationsToday: 0,
        generationsThisPeriod: 0,
        dailyLimit: 0,
        periodLimit: 0,
        canGenerate: false,
      },
    }
  }

  const [planRes, prefRes, subInfo] = await Promise.all([
    supabase
      .from('meal_plans')
      .select('*, meal_plan_entries(*, meals(*))')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('dietary_preferences, cuisine_preferences, budget_range, household_size')
      .eq('id', user.id)
      .maybeSingle(),
    getSubscriptionInfo(user.id), // 🆕
  ])

  if (planRes.error) console.error('[fetchMealPlanData] plan error:', planRes.error)
  if (prefRes.error) console.error('[fetchMealPlanData] pref error:', prefRes.error)

  return {
    plan: (planRes.data as MealPlan) || null,
    preferences: (prefRes.data as UserPreferences) || null,
    subscription: subInfo,
  }
}

// ── AI Generation Action ──────────────────────────────────
export async function generateAIPlanAction(
  preferences: UserPreferences | null
): Promise<GenerateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, reason: 'auth', message: 'You must be signed in to generate a meal plan.' }
  }

  // ── SUBSCRIPTION GATE ───────────────────────────────
  const subInfo = await getSubscriptionInfo(user.id)

  if (!subInfo.isActive || !subInfo.isPremium) {
    return {
      success: false,
      reason: 'subscription_required',
      message:
        subInfo.tier === 'free' || !subInfo.tier
          ? 'Subscribe to a meal plan to start generating AI-powered weekly meal plans.'
          : 'Your subscription has expired. Renew to continue generating meal plans.',
      upgradeUrl: '/dashboard/user/subscription',
    }
  }

  // ── RATE LIMIT CHECK ────────────────────────────────
  const limits = TIER_LIMITS[subInfo.tier ?? 'free']

  if (subInfo.generationsToday >= limits.perDay) {
    return {
      success: false,
      reason: 'rate_limit',
      message: `You've reached your daily limit of ${limits.perDay} meal plan${
        limits.perDay === 1 ? '' : 's'
      }. ${
        subInfo.tier === 'yearly'
          ? 'Try again tomorrow.'
          : 'Upgrade for higher limits, or try again tomorrow.'
      }`,
      upgradeUrl: '/dashboard/user/subscription',
    }
  }

  if (subInfo.generationsThisPeriod >= limits.perPeriod) {
    return {
      success: false,
      reason: 'rate_limit',
      message: `You've used all ${limits.perPeriod} generations for this ${subInfo.tier} period. Upgrade to a higher tier for more.`,
      upgradeUrl: '/dashboard/user/subscription',
    }
  }

  // 1. Fetch the meal catalog
  const { data: catalog, error: catalogErr } = await supabase
    .from('meals')
    .select('id, name, cuisine, category, calories_per_serving, prep_time_minutes, cook_time_minutes, tags, is_premium')
    .eq('is_active', true)
    .limit(200)

  if (catalogErr || !catalog?.length) {
    console.error('[generateAIPlanAction] catalog error:', catalogErr)
    return {
      success: false,
      reason: 'no_meals',
      message: 'No meals available in the library yet. Please add meals first.',
    }
  }

  // 2. Tier-based feature access (monthly/yearly get full catalog + snacks)
  const hasFullCatalog = subInfo.tier === 'yearly' || subInfo.tier === 'monthly'

  // 3. Decide which meal categories this user gets
  const MEAL_CATEGORIES: readonly MealCategory[] = hasFullCatalog
    ? ['breakfast', 'lunch', 'dinner', 'snack']
    : ['breakfast', 'lunch', 'dinner']

  const TOTAL_ENTRIES = MEAL_CATEGORIES.length * 7

  const householdSize = preferences?.household_size ?? 1
  const cuisines = (preferences?.cuisine_preferences ?? []).map((c) =>
    c.toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_')
  )
  const restrictions = preferences?.dietary_preferences ?? []

  // 4. Filter premium meals
  const allowedMeals = catalog.filter((m) => hasFullCatalog || !m.is_premium)

  const mealsByCategory = new Map<string, typeof allowedMeals>()
  for (const cat of MEAL_CATEGORIES) {
    const matching = allowedMeals.filter((m) => m.category?.toLowerCase() === cat)
    mealsByCategory.set(cat, matching.length > 0 ? matching : allowedMeals)
  }

  if (allowedMeals.length === 0) {
    return {
      success: false,
      reason: 'no_meals',
      message: hasFullCatalog
        ? 'No meals available in our library yet. Please contact support.'
        : 'No meals available for your tier. Upgrade to monthly or yearly for our full catalogue.',
    }
  }

  const MIN_RECOMMENDED = MEAL_CATEGORIES.length * 3
  const limitedVariety = allowedMeals.length < MIN_RECOMMENDED

  // ── 5. Try AI Selection ───────────────────────────────
  try {
    const model = hasFullCatalog ? openai('gpt-4o') : openai('gpt-4o-mini')

    const catalogContext = allowedMeals
      .map((m) =>
        `${m.id} | ${m.name} | ${m.cuisine ?? 'n/a'} | ${m.category ?? 'n/a'} | ${m.calories_per_serving ?? '?'}kcal | tags: ${(m.tags ?? []).join(',')}`
      )
      .join('\n')

    const validIds = allowedMeals.map((m) => m.id)
    const validIdSet = new Set(validIds)
    const allowedCats = new Set<string>(MEAL_CATEGORIES)

    const { object: aiPlan } = await generateObject({
      model,
      schema: z.object({
        selections: z
          .array(
            z.object({
              day_index: z.number().min(0).max(6).describe('0=Mon, 6=Sun'),
              meal_category: z.enum(ALL_MEAL_CATEGORIES),
              meal_id: z.string().describe('Must be one of the IDs from the catalog'),
            })
          )
          .length(TOTAL_ENTRIES)
          .describe(`${TOTAL_ENTRIES} entries: ${MEAL_CATEGORIES.length} meals × 7 days`),
      }),
      prompt: `You are a nutrition planner. From the meal catalog below, select a 7-day meal plan (${MEAL_CATEGORIES.length} meals per day = ${TOTAL_ENTRIES} total).

USER PREFERENCES:
- Household size: ${householdSize}
- Preferred cuisines: ${cuisines.length ? cuisines.join(', ') : 'any'}
- Dietary restrictions / preferences: ${restrictions.length ? restrictions.join(', ') : 'none'}

RULES:
- Return exactly ${TOTAL_ENTRIES} selections: ${MEAL_CATEGORIES.length} per day (${MEAL_CATEGORIES.join(', ')}) for days 0-6.
- Every meal_id MUST come from the catalog below — do NOT invent IDs.
- Vary meals across the week (avoid repeating the same meal more than twice).
- Match preferred cuisines where possible; otherwise pick balanced options.
- Avoid meals whose tags conflict with the user's restrictions.

MEAL CATALOG:
${catalogContext}`,
      maxRetries: 2,
    })

    // 6. Validate AI selections
    const validSelections = aiPlan.selections.filter(
      (s) => validIdSet.has(s.meal_id) && allowedCats.has(s.meal_category)
    ) as Array<{ day_index: number; meal_category: MealCategory; meal_id: string }>

    // 7. Top up missing combos
    if (validSelections.length < TOTAL_ENTRIES) {
      console.warn(
        `[generateAIPlanAction] AI returned ${validSelections.length}/${TOTAL_ENTRIES} valid selections — topping up from catalog`
      )
      const used = new Set(validSelections.map((s) => `${s.day_index}-${s.meal_category}`))
      for (let day = 0; day < 7; day++) {
        for (const cat of MEAL_CATEGORIES) {
          if (!used.has(`${day}-${cat}`)) {
            const pool = mealsByCategory.get(cat) ?? allowedMeals
            const random = pool[Math.floor(Math.random() * pool.length)]
            validSelections.push({ day_index: day, meal_category: cat, meal_id: random.id })
          }
        }
      }
    }

    await persistPlan({
      userId: user.id,
      selections: validSelections,
      isAi: true,
      title: 'AI Weekly Plan',
    })

    revalidatePath('/meal-plans')
    revalidatePath('/meal-generator')
    revalidatePath('/dashboard/user/meal-generator')

    return { success: true, source: 'ai' }
  } catch (aiErr) {
    const msg = aiErr instanceof Error ? aiErr.message : String(aiErr)
    const isQuota = /insufficient_quota|quota|billing|rate.?limit|429/i.test(msg)
    console.warn('[generateAIPlanAction] AI failed, using fallback:', msg)

    // ── 8. Fallback: random selection ─────────────────────
    try {
      const cuisinePrefs = cuisines

      const selections: Array<{
        day_index: number
        meal_category: MealCategory
        meal_id: string
      }> = []

      const recentByCategory = new Map<string, string[]>()
      const RECENT_WINDOW = 2

      for (let day = 0; day < 7; day++) {
        for (const cat of MEAL_CATEGORIES) {
          const categoryPool = mealsByCategory.get(cat) ?? allowedMeals

          let pool = categoryPool
          if (cuisinePrefs.length > 0) {
            const cuisineMatched = categoryPool.filter(
              (m) => m.cuisine && cuisinePrefs.includes(m.cuisine.toLowerCase())
            )
            if (cuisineMatched.length > 0) pool = cuisineMatched
          }

          const recent = recentByCategory.get(cat) ?? []
          const fresh = pool.filter((m) => !recent.includes(m.id))
          const finalPool = fresh.length > 0 ? fresh : pool

          const pick = finalPool[Math.floor(Math.random() * finalPool.length)]
          selections.push({ day_index: day, meal_category: cat, meal_id: pick.id })

          const updated = [...recent, pick.id].slice(-RECENT_WINDOW)
          recentByCategory.set(cat, updated)
        }
      }

      await persistPlan({
        userId: user.id,
        selections,
        isAi: false,
        title: 'Curated Weekly Plan',
      })

      revalidatePath('/meal-plans')
      revalidatePath('/meal-generator')
      revalidatePath('/dashboard/user/meal-generator')

      return {
        success: true,
        source: 'fallback',
        message: limitedVariety
          ? `Plan built from our limited catalogue (${allowedMeals.length} meals available). Meals may repeat — upgrade for more variety!`
          : isQuota
            ? 'Our AI is busy right now — we built your plan from our curated library instead.'
            : 'AI generation was unavailable, so we built your plan from our curated library.',
      }
    } catch (fallbackErr) {
      console.error('[generateAIPlanAction] Fallback also failed:', fallbackErr)
      return {
        success: false,
        reason: isQuota ? 'quota' : 'unknown',
        message: isQuota
          ? 'Our AI is temporarily unavailable and we could not build a fallback plan. Please try again later.'
          : `Could not generate your plan: ${fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'}`,
      }
    }
  }
}

// ── Persist Helper ────────────────────────────────────────
async function persistPlan({
  userId,
  selections,
  isAi,
  title,
}: {
  userId: string
  selections: Array<{ day_index: number; meal_category: MealCategory; meal_id: string }>
  isAi: boolean
  title: string
}) {
  const supabase = await createClient()
  const today = new Date()
  const startDate = today.toISOString().slice(0, 10)
  const endDateObj = new Date(today)
  endDateObj.setDate(today.getDate() + 6)
  const endDate = endDateObj.toISOString().slice(0, 10)

  const { error: deactivateErr } = await supabase
    .from('meal_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (deactivateErr) console.warn('[persistPlan] deactivate error:', deactivateErr)

  const { data: planRow, error: planErr } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      title,
      plan_type: 'weekly',
      start_date: startDate,
      end_date: endDate,
      is_ai_generated: isAi,
      is_active: true,
    })
    .select('id')
    .single()

  if (planErr || !planRow) {
    console.error('[persistPlan] meal_plans insert error:', planErr)
    throw new Error(planErr?.message ?? 'Failed to create meal plan')
  }

  const entries = selections.map((s) => {
    const date = new Date(today)
    date.setDate(today.getDate() + s.day_index)
    return {
      meal_plan_id: planRow.id,
      meal_id: s.meal_id,
      scheduled_date: date.toISOString().slice(0, 10),
      meal_category: s.meal_category,
      servings: 1,
      is_ordered: false,
      is_cooked: false,
    }
  })

  const { error: entriesErr } = await supabase.from('meal_plan_entries').insert(entries)

  if (entriesErr) {
    console.error('[persistPlan] meal_plan_entries insert error:', entriesErr)
    await supabase.from('meal_plans').delete().eq('id', planRow.id)
    throw new Error(entriesErr.message)
  }

  return planRow.id
}