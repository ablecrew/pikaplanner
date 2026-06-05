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

export type MealPlanPageData = {
  plan: MealPlan | null
  preferences: UserPreferences | null
}

export type GenerateResult =
  | { success: true; source: 'ai' | 'fallback'; message?: string }
  | { success: false; reason: 'auth' | 'quota' | 'no_meals' | 'unknown'; message: string }

// ── Module-Scope Constants ────────────────────────────────
// All possible meal categories — used for Zod validation
const ALL_MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealCategory = typeof ALL_MEAL_CATEGORIES[number]

// ── Data Fetching ─────────────────────────────────────────
export async function fetchMealPlanData(): Promise<MealPlanPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { plan: null, preferences: null }

  const [planRes, prefRes] = await Promise.all([
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
  ])

  if (planRes.error) console.error('[fetchMealPlanData] plan error:', planRes.error)
  if (prefRes.error) console.error('[fetchMealPlanData] pref error:', prefRes.error)

  return {
    plan: (planRes.data as MealPlan) || null,
    preferences: (prefRes.data as UserPreferences) || null,
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

  // 1. Fetch the meal catalog (AI picks from this — guarantees valid enum values)
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

  // 2. Subscription tier (for model + meal category selection)
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, is_premium')
    .eq('id', user.id)
    .maybeSingle()

  const isPremium =
    profile?.subscription_tier === 'premium' || profile?.is_premium === true

  // ✅ Decide which meal categories this user gets (now in correct scope)
  const MEAL_CATEGORIES: readonly MealCategory[] = isPremium
    ? ['breakfast', 'lunch', 'dinner', 'snack']
    : ['breakfast', 'lunch', 'dinner']

  const TOTAL_ENTRIES = MEAL_CATEGORIES.length * 7

  const householdSize = preferences?.household_size ?? 1
  const cuisines = (preferences?.cuisine_preferences ?? []).map((c) =>
    c.toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_')
  )
  const restrictions = preferences?.dietary_preferences ?? []

  // 3. Filter premium meals for non-premium users
  // ✅ Better
const freeMeals = catalog.filter((m) => !m.is_premium)
const premiumOnly = catalog.length - freeMeals.length
// 3. Filter premium meals for non-premium users
const allowedMeals = catalog.filter((m) => isPremium || !m.is_premium)

// We need at least ONE meal per category to build a plan (repeats allowed across days)
const mealsByCategory = new Map<string, typeof allowedMeals>()
for (const cat of MEAL_CATEGORIES) {
  // Try to match meals to category; fall back to all meals if category is empty
  const matching = allowedMeals.filter((m) => m.category?.toLowerCase() === cat)
  mealsByCategory.set(cat, matching.length > 0 ? matching : allowedMeals)
}

// Hard minimum: must have at least 1 meal total
if (allowedMeals.length === 0) {
  return {
    success: false,
    reason: 'no_meals',
    message: isPremium
      ? 'No meals available in our library yet. Please contact support.'
      : 'No free meals available yet. Upgrade to premium to unlock our full catalogue.',
  }
}

// Soft minimum: warn if variety is low but still proceed
const MIN_RECOMMENDED = MEAL_CATEGORIES.length * 3 // ~3 unique meals per category
const limitedVariety = allowedMeals.length < MIN_RECOMMENDED

  // ── 4. Try AI Selection ───────────────────────────────
  try {
    const model = isPremium ? openai('gpt-4o') : openai('gpt-4o-mini')

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

    // 5. Validate AI selections — must use a real meal ID AND an allowed category
    const validSelections = aiPlan.selections.filter(
      (s) => validIdSet.has(s.meal_id) && allowedCats.has(s.meal_category)
    ) as Array<{ day_index: number; meal_category: MealCategory; meal_id: string }>

    // 6. Top up any missing day/category combos with random picks
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

    // ── 7. Fallback: random selection ─────────────────────
    try {
        const cuisinePrefs = cuisines

        const selections: Array<{
          day_index: number
          meal_category: MealCategory
          meal_id: string
        }> = []
        
        // Track recent picks per category to minimize back-to-back repeats
        const recentByCategory = new Map<string, string[]>()
        const RECENT_WINDOW = 2 // don't repeat same meal within 2 days
        
        for (let day = 0; day < 7; day++) {
          for (const cat of MEAL_CATEGORIES) {
            // Get the pool for this category (already prepared above)
            const categoryPool = mealsByCategory.get(cat) ?? allowedMeals
        
            // Prefer matching cuisines if user has preferences
            let pool = categoryPool
            if (cuisinePrefs.length > 0) {
              const cuisineMatched = categoryPool.filter(
                (m) => m.cuisine && cuisinePrefs.includes(m.cuisine.toLowerCase())
              )
              if (cuisineMatched.length > 0) pool = cuisineMatched
            }
        
            // Filter out recently-used meals (avoid back-to-back repeats)
            const recent = recentByCategory.get(cat) ?? []
            const fresh = pool.filter((m) => !recent.includes(m.id))
            const finalPool = fresh.length > 0 ? fresh : pool
        
            const pick = finalPool[Math.floor(Math.random() * finalPool.length)]
            selections.push({ day_index: day, meal_category: cat, meal_id: pick.id })
        
            // Update recency tracker
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
        ? `Plan built from our limited free catalogue (${allowedMeals.length} meals available). Meals may repeat — upgrade for more variety!`
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

// ── Persist Helper (matches real schema) ──────────────────
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

  // 1. Deactivate any previously active plans for this user
  const { error: deactivateErr } = await supabase
    .from('meal_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (deactivateErr) console.warn('[persistPlan] deactivate error:', deactivateErr)

  // 2. Insert the new plan
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

  // 3. Insert entries
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
    // Roll back the plan if entries failed
    await supabase.from('meal_plans').delete().eq('id', planRow.id)
    throw new Error(entriesErr.message)
  }

  return planRow.id
}