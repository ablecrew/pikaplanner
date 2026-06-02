'use server'

import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

export type Meal = {
  id: string
  name: string
  vendor: string
  vendorId: string
  vendorMealId: string
  vendorLocation: string
  category: string
  cuisine: string
  price: number
  description: string
  imageUrl: string
  isPremium: boolean
  difficulty: string
  servings: number
  prepTime: number
  cookTime: number
  calories: number
  protein: number
  carbs: number
  fat: number
  tags: string[]
  rating: number
  createdAt: string
}

export type MealsPayload = {
  meals: Meal[]
  totalMeals: number
  premiumMeals: number
  vendorCount: number
  page: number
  pageSize: number
  totalPages: number
  categories: string[]
  cuisines: string[]
  debug?: {
    vendorMealsFound: number
    mealsFound: number
    vendorsFound: number
    query: BrowseMealsQuery
  }
}

export type BrowseMealsQuery = {
  search: string
  category: string
  cuisine: string
  page: number
}

type VendorRow = {
  id: string
  business_name: string | null
  location_city: string | null
}

type VendorMealWithMeal = {
  id: string
  meal_id: string
  vendor_id: string
  price: number | null
  is_available: boolean | null
  meals: {
    id: string
    name: string | null
    description: string | null
    image_url: string | null
    category: string | null
    cuisine: string | null
    is_premium: boolean | null
    is_active: boolean | null
    difficulty: string | null
    servings: number | null
    prep_time_minutes: number | null
    cook_time_minutes: number | null
    calories_per_serving: number | null
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
    tags: string[] | null
    created_at: string | null
  } | null
}

const PAGE_SIZE = 18
const CACHE_TTL = 60

function sanitize(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback
  return input.trim()
}

function mapMeal(
  vm: VendorMealWithMeal,
  vendor: VendorRow | undefined,
): Meal | null {
  if (!vm.meals) return null
  const m = vm.meals
  return {
    id: vm.meal_id,
    name: m.name || 'Meal',
    vendor: vendor?.business_name || 'Vendor',
    vendorId: vm.vendor_id,
    vendorMealId: vm.id,
    vendorLocation: vendor?.location_city || '—',
    category: m.category || 'General',
    cuisine: m.cuisine || 'Various',
    price: Number(vm.price || 0),
    description: m.description || '',
    imageUrl: m.image_url || '',
    isPremium: Boolean(m.is_premium),
    difficulty: m.difficulty || 'easy',
    servings: Number(m.servings || 1),
    prepTime: Number(m.prep_time_minutes || 0),
    cookTime: Number(m.cook_time_minutes || 0),
    calories: Number(m.calories_per_serving || 0),
    protein: Number(m.protein_g || 0),
    carbs: Number(m.carbs_g || 0),
    fat: Number(m.fat_g || 0),
    tags: m.tags || [],
    rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
    createdAt: m.created_at || '',
  }
}

function emptyPayload(query: BrowseMealsQuery): MealsPayload {
  return {
    meals: [],
    totalMeals: 0,
    premiumMeals: 0,
    vendorCount: 0,
    page: query.page,
    pageSize: PAGE_SIZE,
    totalPages: 0,
    categories: ['All'],
    cuisines: ['All'],
  }
}

async function fetchFacets(): Promise<{
  categories: string[]
  cuisines: string[]
}> {
  const supabase = await createClient()
  const [{ data: cats }, { data: cu }] = await Promise.all([
    supabase.from('meals').select('category').eq('is_active', true),
    supabase.from('meals').select('cuisine').eq('is_active', true),
  ])

  const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v : '')
  const catsSet = new Set<string>()
  ;(cats || []).forEach((row: any) => {
    const c = clean(row.category)
    if (c) catsSet.add(c)
  })
  const cuSet = new Set<string>()
  ;(cu || []).forEach((row: any) => {
    const c = clean(row.cuisine)
    if (c) cuSet.add(c)
  })

  return {
    categories: ['All', ...Array.from(catsSet).sort()],
    cuisines: ['All', ...Array.from(cuSet).sort()],
  }
}

const fetchFacetsCached = unstable_cache(fetchFacets, ['browse-meals-facets'], {
  revalidate: CACHE_TTL * 5,
  tags: ['meals-facets'],
})

async function fetchBrowseMealsRaw(
  query: BrowseMealsQuery,
): Promise<MealsPayload> {
  const supabase = await createClient()

  const page = Math.max(1, Math.floor(query.page))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // 1) Joined query (array form)
  let joinedQuery = supabase
    .from('vendor_meals')
    .select(
      `
      id,
      meal_id,
      vendor_id,
      price,
      is_available,
      meals (
        id,
        name,
        description,
        image_url,
        category,
        cuisine,
        is_premium,
        is_active,
        difficulty,
        servings,
        prep_time_minutes,
        cook_time_minutes,
        calories_per_serving,
        protein_g,
        carbs_g,
        fat_g,
        tags,
        created_at
      )
    `,
    )
    .eq('is_available', true)

  if (query.category && query.category !== 'All') {
    joinedQuery = joinedQuery.eq('meals.category', query.category)
  }
  if (query.cuisine && query.cuisine !== 'All') {
    joinedQuery = joinedQuery.eq('meals.cuisine', query.cuisine)
  }

  joinedQuery = joinedQuery.order('price', { ascending: true })
  joinedQuery = joinedQuery.range(from, to)

  const { data, error } = await joinedQuery
  if (error) {
    console.error('Browse meals query failed:', error)
    return emptyPayload(query)
  }

  const rows = (data || []) as unknown as VendorMealWithMeal[]

  const activeRows = rows.filter((r) => r.meals && r.meals.is_active !== false)

  // Server-side text search
  const search = query.search.trim().toLowerCase()
  const filtered = search
    ? activeRows.filter((row) => {
        if (!row.meals) return false
        const haystack = [
          row.meals.name,
          row.meals.description,
          row.meals.category,
          row.meals.cuisine,
          ...(row.meals.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(search)
      })
    : activeRows

  // Bulk vendor fetch
  const vendorIds = Array.from(new Set(filtered.map((r) => r.vendor_id)))
  let vendorMap = new Map<string, VendorRow>()
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, business_name, location_city')
      .in('id', vendorIds)
    vendorMap = new Map(((vendors || []) as VendorRow[]).map((v) => [v.id, v]))
  }

  const meals: Meal[] = filtered
    .map((r) => mapMeal(r, vendorMap.get(r.vendor_id)))
    .filter((m): m is Meal => m !== null)

  // 2) Total count (array form, head: true, count: exact)
  let countQuery = supabase
    .from('vendor_meals')
    .select('meal_id, meals!inner(is_active, category, cuisine)', {
      count: 'exact',
      head: true,
    })
    .eq('is_available', true)
    .eq('meals.is_active', true)

  if (query.category && query.category !== 'All') {
    countQuery = countQuery.eq('meals.category', query.category)
  }
  if (query.cuisine && query.cuisine !== 'All') {
    countQuery = countQuery.eq('meals.cuisine', query.cuisine)
  }

  const totalRes = await countQuery
  const totalMeals = totalRes.count || meals.length
  const totalPages = Math.max(1, Math.ceil(totalMeals / PAGE_SIZE))

  // 3) Facets
  const facets = await fetchFacetsCached()

  return {
    meals,
    totalMeals,
    premiumMeals: meals.filter((m) => m.isPremium).length,
    vendorCount: new Set(meals.map((m) => m.vendor)).size,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    categories: facets.categories,
    cuisines: facets.cuisines,
    debug: {
      vendorMealsFound: rows.length,
      mealsFound: activeRows.length,
      vendorsFound: vendorMap.size,
      query,
    },
  }
}

const fetchBrowseMealsCached = unstable_cache(
  async (query: BrowseMealsQuery) => fetchBrowseMealsRaw(query),
  ['browse-meals'],
  { revalidate: CACHE_TTL, tags: ['browse-meals'] },
)

export async function fetchBrowseMeals(
  raw: Partial<BrowseMealsQuery> = {},
): Promise<MealsPayload> {
  const query: BrowseMealsQuery = {
    search: sanitize(raw.search, ''),
    category: sanitize(raw.category, 'All'),
    cuisine: sanitize(raw.cuisine, 'All'),
    page: Math.max(1, Math.floor(Number(raw.page) || 1)),
  }

  try {
    return await fetchBrowseMealsCached(query)
  } catch (err) {
    console.error('Cached browse meals failed, falling back:', err)
    return fetchBrowseMealsRaw(query)
  }
}