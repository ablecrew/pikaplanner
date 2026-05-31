'use server'

type MealCategory = string
type CuisineType = string
type MealStatus = 'Available' | 'Unavailable' | 'Archived'

type MealInput = {
  id?: string
  name: string
  vendorId?: string
  category: MealCategory
  cuisine: CuisineType
  description?: string
  imageUrl?: string
  servings: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  caloriesPerServing?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  difficulty?: string
  tags?: string[]
  isPremium?: boolean
  status: MealStatus
  price?: number
  createdBy?: string
}

type ActionResult = {
  success: boolean
  message?: string
  error?: string
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return { url, serviceRoleKey }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function supabaseRest<T>(
  url: string,
  serviceRoleKey: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  // Handle empty responses (204 No Content or empty body)
  if (response.status === 204) {
    return null as T
  }

  const text = await response.text()
  if (!text || text.trim() === '') {
    return null as T
  }

  return JSON.parse(text) as T
}

async function upsertVendorMeal(config: NonNullable<ReturnType<typeof getConfig>>, mealId: string, input: MealInput) {
  if (!input.vendorId) return

  const existing = await supabaseRest<Array<{ id: string }>>(
    config.url,
    config.serviceRoleKey,
    `vendor_meals?select=id&meal_id=eq.${mealId}&vendor_id=eq.${input.vendorId}`,
    {
      method: 'GET',
      headers: {
        Prefer: 'return=representation',
      },
    },
  )

  const payload = {
    meal_id: mealId,
    vendor_id: input.vendorId,
    price: input.price ?? 0,
    is_available: input.status === 'Available',
    updated_at: new Date().toISOString(),
  }

  if (existing && existing.length > 0) {
    await supabaseRest(
      config.url,
      config.serviceRoleKey,
      `vendor_meals?id=eq.${existing[0].id}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      },
    )
    return
  }

  await supabaseRest(
    config.url,
    config.serviceRoleKey,
    'vendor_meals',
    {
      method: 'POST',
      headers: {
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        ...payload,
        created_at: new Date().toISOString(),
      }),
    },
  )
}

export async function createMeal(input: MealInput): Promise<ActionResult> {
  const config = getConfig()

  if (!config) {
    return { success: false, error: 'Missing Supabase server configuration.' }
  }

  try {
    const slugBase = slugify(input.name)
    const slug = `${slugBase}-${Date.now().toString().slice(-6)}`

    const meals = await supabaseRest<Array<{ id: string }>>(
      config.url,
      config.serviceRoleKey,
      'meals',
      {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name: input.name,
          slug,
          description: input.description || null,
          category: input.category,
          cuisine: input.cuisine,
          image_url: input.imageUrl || null,
          prep_time_minutes: input.prepTimeMinutes ?? null,
          cook_time_minutes: input.cookTimeMinutes ?? null,
          servings: input.servings,
          calories_per_serving: input.caloriesPerServing ?? null,
          protein_g: input.proteinG ?? null,
          carbs_g: input.carbsG ?? null,
          fat_g: input.fatG ?? null,
          difficulty: input.difficulty || null,
          tags: input.tags ?? [],
          is_premium: Boolean(input.isPremium),
          is_active: input.status !== 'Archived',
          created_by: input.createdBy || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      },
    )

    const mealId = meals?.[0]?.id

    if (!mealId) {
      return { success: false, error: 'Meal was created but no id was returned.' }
    }

    await upsertVendorMeal(config, mealId, input)

    return { success: true, message: 'Meal created successfully.' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create meal.',
    }
  }
}

export async function updateMeal(input: MealInput): Promise<ActionResult> {
  const config = getConfig()

  if (!config) {
    return { success: false, error: 'Missing Supabase server configuration.' }
  }

  if (!input.id) {
    return { success: false, error: 'Meal id is required.' }
  }

  try {
    await supabaseRest(
      config.url,
      config.serviceRoleKey,
      `meals?id=eq.${input.id}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          name: input.name,
          description: input.description || null,
          category: input.category,
          cuisine: input.cuisine,
          image_url: input.imageUrl || null,
          prep_time_minutes: input.prepTimeMinutes ?? null,
          cook_time_minutes: input.cookTimeMinutes ?? null,
          servings: input.servings,
          calories_per_serving: input.caloriesPerServing ?? null,
          protein_g: input.proteinG ?? null,
          carbs_g: input.carbsG ?? null,
          fat_g: input.fatG ?? null,
          difficulty: input.difficulty || null,
          tags: input.tags ?? [],
          is_premium: Boolean(input.isPremium),
          is_active: input.status !== 'Archived',
          updated_at: new Date().toISOString(),
        }),
      },
    )

    await upsertVendorMeal(config, input.id, input)

    return { success: true, message: 'Meal updated successfully.' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update meal.',
    }
  }
}

export async function setMealAvailability(mealId: string, status: MealStatus): Promise<ActionResult> {
  const config = getConfig()

  if (!config) {
    return { success: false, error: 'Missing Supabase server configuration.' }
  }

  try {
    await supabaseRest(
      config.url,
      config.serviceRoleKey,
      `meals?id=eq.${mealId}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          is_active: status !== 'Archived',
          updated_at: new Date().toISOString(),
        }),
      },
    )

    await supabaseRest(
      config.url,
      config.serviceRoleKey,
      `vendor_meals?meal_id=eq.${mealId}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          is_available: status === 'Available',
          updated_at: new Date().toISOString(),
        }),
      },
    )

    return { success: true, message: 'Meal availability updated.' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update meal availability.',
    }
  }
}

export async function deleteMeal(mealId: string): Promise<ActionResult> {
  const config = getConfig()

  if (!config) {
    return { success: false, error: 'Missing Supabase server configuration.' }
  }

  try {
    await supabaseRest(
      config.url,
      config.serviceRoleKey,
      `vendor_meals?meal_id=eq.${mealId}`,
      {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal',
        },
      },
    )

    await supabaseRest(
      config.url,
      config.serviceRoleKey,
      `meals?id=eq.${mealId}`,
      {
        method: 'DELETE',
        headers: {
          Prefer: 'return=minimal',
        },
      },
    )

    return { success: true, message: 'Meal deleted successfully.' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete meal.',
    }
  }
}
