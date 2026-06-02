'use server'

import { createClient } from '@/lib/supabase/server'
import { unstable_cache, revalidateTag } from 'next/cache'
import {
  SORT_OPTIONS,
  CATEGORY_OPTIONS,
  CITY_COORDS,
  PAGE_SIZE,
  CACHE_TTL,
} from './constants'

export type VendorStatus = 'Active' | 'Pending' | 'Suspended' | 'Archived'

export type VendorRecord = {
  id: string
  name: string
  email: string
  phone: string
  whatsapp: string
  category: string
  cuisine: string
  location: string
  status: VendorStatus
  joinedAt: string
  totalOrders: number
  rating: number
  isAcceptingOrders: boolean
  isVerified: boolean
  logoUrl: string
  coverUrl: string
  description: string
  minOrder: number
  deliveryRadius: number
  prepTime: number
  operatingHours: string
  lat: number | null
  lng: number | null
  distanceKm: number | null
}

export type VendorDetail = VendorRecord & {
  recentMeals: Array<{
    id: string
    name: string
    category: string
    price: number
    imageUrl: string
  }>
}

export type VendorsStats = {
  total: number
  categoriesCount: number
  avgRating: string
}

export type VendorsPayload = {
  vendors: VendorRecord[]
  stats: VendorsStats
  totalVendors: number
  page: number
  pageSize: number
  totalPages: number
  categories: string[]
  sort: SortOption
  debug?: {
    vendorsFound: number
  }
}

export type SortOption = 'newest' | 'rating' | 'popular' | 'alpha' | 'nearest'

export type VendorsQuery = {
  search: string
  category: string
  page: number
  sort: SortOption
  userLat?: number
  userLng?: number
}

function sanitize(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback
  return input.trim()
}

function isSortOption(value: unknown): value is SortOption {
  return (
    value === 'newest' ||
    value === 'rating' ||
    value === 'popular' ||
    value === 'alpha' ||
    value === 'nearest'
  )
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getCityCoords(city?: string | null) {
  if (!city) return null
  return CITY_COORDS[city.trim().toLowerCase()] || null
}

function deriveStatus(v: any): VendorStatus {
  if (v.is_verified && v.is_active) return 'Active'
  if (v.is_verified && !v.is_active) return 'Suspended'
  if (!v.is_verified && !v.is_active) return 'Archived'
  return 'Pending'
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function mapVendor(
  v: any,
  userLat?: number,
  userLng?: number
): VendorRecord {
  const coordFromCity = getCityCoords(v.location_city)
  const lat =
    v.location_lat != null
      ? Number(v.location_lat)
      : coordFromCity?.lat ?? null
  const lng =
    v.location_lng != null
      ? Number(v.location_lng)
      : coordFromCity?.lng ?? null

  let distanceKm: number | null = null
  if (
    isFiniteNumber(userLat) &&
    isFiniteNumber(userLng) &&
    lat !== null &&
    lng !== null
  ) {
    distanceKm = haversineKm(userLat, userLng, lat, lng)
  }

  return {
    id: v.id,
    name: v.business_name || v.name || 'Unnamed Kitchen',
    email: v.email || '',
    phone: v.phone || '',
    whatsapp: v.whatsapp_number || '',
    category: v.category || 'General',
    cuisine: v.cuisine || 'Various',
    location: v.location_city || v.location || '',
    status: deriveStatus(v),
    joinedAt: v.created_at
      ? new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '—',
    totalOrders: Number(v.total_orders || 0),
    rating: Number(v.rating || v.average_rating || 0),
    isAcceptingOrders: Boolean(v.is_accepting_orders),
    isVerified: Boolean(v.is_verified),
    logoUrl: v.logo_url || '',
    coverUrl: v.cover_url || '',
    description: v.business_description || v.description || '',
    minOrder: Number(v.min_order_amount || 0),
    deliveryRadius: Number(v.delivery_radius_km || 0),
    prepTime: Number(v.prep_time || 0),
    operatingHours:
      typeof v.operating_hours === 'string' ? v.operating_hours : '—',
    lat,
    lng,
    distanceKm,
  }
}

function buildStats(vendors: VendorRecord[]): VendorsStats {
  const active = vendors.filter(
    (v) => v.status === 'Active' || v.isVerified
  )
  const avgRating =
    active.length > 0
      ? active.reduce((acc, v) => acc + v.rating, 0) / active.length
      : 0
  const uniqueCategories = new Set(
    vendors.map((v) => v.category.trim()).filter(Boolean)
  )
  return {
    total: active.length,
    categoriesCount: uniqueCategories.size,
    avgRating: avgRating > 0 ? avgRating.toFixed(1) : 'New',
  }
}

function sortKey(sort: SortOption) {
  switch (sort) {
    case 'rating':
      return { column: 'average_rating', ascending: false }
    case 'popular':
      return { column: 'total_orders', ascending: false }
    case 'alpha':
      return { column: 'business_name', ascending: true }
    case 'newest':
    case 'nearest':
    default:
      return { column: 'created_at', ascending: false }
  }
}

async function getFallbackUserLocation(
  supabase: any
): Promise<{ lat?: number; lng?: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data: profile } = await supabase
      .from('profiles')
      .select('location_lat, location_lng, location_city')
      .eq('id', user.id)
      .maybeSingle()

    if (
      profile?.location_lat != null &&
      profile?.location_lng != null
    ) {
      return {
        lat: Number(profile.location_lat),
        lng: Number(profile.location_lng),
      }
    }

    if (profile?.location_city) {
      const fallback = getCityCoords(profile.location_city)
      if (fallback) return fallback
    }
  } catch (e) {
    // ignore
  }
  return {}
}

async function fetchVendorsRaw(query: VendorsQuery): Promise<VendorsPayload> {
  const supabase = await createClient()

  const page = Math.max(1, Math.floor(query.page))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const key = sortKey(query.sort)

  let queryBuilder = supabase
    .from('vendors')
    .select(
      'id, business_name, name, email, phone, whatsapp_number, category, cuisine, location_city, location, location_lat, location_lng, business_description, description, is_active, is_verified, is_accepting_orders, total_orders, rating, average_rating, min_order_amount, delivery_radius_km, prep_time, operating_hours, logo_url, cover_url, created_at',
    )
    .eq('is_active', true)
    .order(key.column, { ascending: key.ascending })
    .range(from, to)

  if (query.category && query.category !== 'All') {
    queryBuilder = queryBuilder.ilike('category', query.category)
  }

  const { data, error } = await queryBuilder
  if (error) {
    console.error('vendors fetch error:', error)
    return emptyPayload(query)
  }

  let userLat = query.userLat
  let userLng = query.userLng
  if (
    (userLat === undefined || userLng === undefined) &&
    query.sort === 'nearest'
  ) {
    const fallback = await getFallbackUserLocation(supabase)
    userLat = userLat ?? fallback.lat
    userLng = userLng ?? fallback.lng
  }

  const rows = (data || []) as any[]
  let mapped: VendorRecord[] = rows.map((r) =>
    mapVendor(r, userLat, userLng)
  )

  // Server-side text search
  const search = query.search.trim().toLowerCase()
  if (search) {
    mapped = mapped.filter((v) => {
      const haystack = `${v.name} ${v.category} ${v.cuisine} ${v.location}`.toLowerCase()
      return haystack.includes(search)
    })
  }

  if (query.sort === 'nearest') {
    mapped = [...mapped].sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY
      return da - db
    })
  }

  // Total count
  let countQuery = supabase
    .from('vendors')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
  if (query.category && query.category !== 'All') {
    countQuery = countQuery.ilike('category', query.category)
  }
  const countRes = await countQuery

  const totalVendors = countRes.count || mapped.length
  const totalPages = Math.max(1, Math.ceil(totalVendors / PAGE_SIZE))

  return {
    vendors: mapped,
    stats: buildStats(mapped),
    totalVendors,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    categories: CATEGORY_OPTIONS,
    sort: query.sort,
    debug: {
      vendorsFound: rows.length,
    },
  }
}

function emptyPayload(query: VendorsQuery): VendorsPayload {
  return {
    vendors: [],
    stats: { total: 0, categoriesCount: 0, avgRating: 'New' },
    totalVendors: 0,
    page: query.page,
    pageSize: PAGE_SIZE,
    totalPages: 0,
    categories: CATEGORY_OPTIONS,
    sort: query.sort,
  }
}

const fetchVendorsCached = unstable_cache(
  async (query: VendorsQuery) => fetchVendorsRaw(query),
  ['user-vendors'],
  { revalidate: CACHE_TTL, tags: ['user-vendors'] }
)

export async function fetchUserVendors(
  raw: Partial<VendorsQuery> = {}
): Promise<VendorsPayload> {
  const sort: SortOption = isSortOption(raw.sort) ? raw.sort : 'newest'
  const query: VendorsQuery = {
    search: sanitize(raw.search, ''),
    category: sanitize(raw.category, 'All'),
    page: Math.max(1, Math.floor(Number(raw.page) || 1)),
    sort,
    userLat: isFiniteNumber(raw.userLat) ? raw.userLat : undefined,
    userLng: isFiniteNumber(raw.userLng) ? raw.userLng : undefined,
  }

  try {
    return await fetchVendorsCached(query)
  } catch (err) {
    console.error('Cached vendors failed, falling back:', err)
    return fetchVendorsRaw(query)
  }
}

async function fetchVendorDetailRaw(
  vendorId: string
): Promise<VendorDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vendors')
    .select(
      'id, business_name, name, email, phone, whatsapp_number, category, cuisine, location_city, location, location_lat, location_lng, business_description, description, is_active, is_verified, is_accepting_orders, total_orders, rating, average_rating, min_order_amount, delivery_radius_km, prep_time, operating_hours, logo_url, cover_url, created_at',
    )
    .eq('id', vendorId)
    .maybeSingle()

  if (error || !data) {
    console.error('vendor detail error:', error)
    return null
  }

  const vendor = mapVendor(data)

  const { data: mealRows } = await supabase
    .from('vendor_meals')
    .select('id, price, meals ( id, name, category, image_url )')
    .eq('vendor_id', vendorId)
    .eq('is_available', true)
    .limit(6)

  const recentMeals = ((mealRows || []) as unknown as Array<{
    id: string
    price: number | null
    meals: {
      id: string
      name: string
      category: string | null
      image_url: string | null
    } | null
  }>)
    .filter((row) => row.meals)
    .map((row) => ({
      id: row.meals!.id,
      name: row.meals!.name,
      category: row.meals!.category || 'Meal',
      price: Number(row.price || 0),
      imageUrl: row.meals!.image_url || '',
    }))

  return { ...vendor, recentMeals }
}

const fetchVendorDetailCached = unstable_cache(
  async (vendorId: string) => fetchVendorDetailRaw(vendorId),
  ['user-vendor-detail'],
  { revalidate: CACHE_TTL, tags: ['user-vendor-detail', 'user-vendors'] }
)

export async function fetchVendorDetail(
  vendorId: string
): Promise<VendorDetail | null> {
  if (!vendorId) return null
  try {
    return await fetchVendorDetailCached(vendorId)
  } catch (err) {
    console.error('Cached vendor detail failed, falling back:', err)
    return fetchVendorDetailRaw(vendorId)
  }
}

/**
 * Invalidate all vendor-related caches.
 * Call this from a vendor's profile update action.
 */
export async function invalidateVendorCaches() {
  revalidateTag('user-vendors', 'max')
  revalidateTag('user-vendor-detail', 'max')
}