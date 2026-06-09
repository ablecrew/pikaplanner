'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Types ─────────────────────────────────────────────────
export type ReviewUseCase =
  | 'meal_planning' | 'vendor_orders' | 'shopping_lists'
  | 'family_meals' | 'budget' | 'recipes' | 'other'

export type ReviewLike =
  | 'ai_quality' | 'variety' | 'speed' | 'ease_of_use' | 'recipes'
  | 'vendor_options' | 'pricing' | 'support' | 'design' | 'mobile_app'

export type ReviewImprovement =
  | 'more_cuisines' | 'pricing' | 'mobile_experience' | 'meal_variety'
  | 'vendor_coverage' | 'delivery_speed' | 'recipe_details' | 'family_features'
  | 'language_support' | 'offline_mode'

export type Review = {
  id: string
  user_id: string | null
  display_name: string
  display_role: string | null
  display_avatar_url: string | null
  overall_rating: number
  meal_quality_rating?: number | null
  variety_rating?: number | null
  ease_of_use_rating?: number | null
  value_rating?: number | null
  customer_support_rating?: number | null
  would_recommend?: number | null
  title: string
  body: string
  primary_use_case?: ReviewUseCase | null
  liked_most?: ReviewLike[]
  would_like_improved?: ReviewImprovement[]
  photo_urls?: string[]
  is_verified: boolean
  verification_type?: string | null
  subscription_tier_at_review?: string | null
  status: string
  helpful_count: number
  not_helpful_count: number
  is_featured: boolean
  admin_response?: string | null
  admin_response_at?: string | null
  created_at: string
}

export type ReviewStats = {
  total: number
  averageRating: number
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
  nps: number | null              // Net Promoter Score
  verifiedCount: number
  topLikes: { tag: ReviewLike; count: number }[]
  topImprovements: { tag: ReviewImprovement; count: number }[]
}

export type ReviewFormData = {
  display_name: string
  display_role?: string
  overall_rating: number
  meal_quality_rating?: number
  variety_rating?: number
  ease_of_use_rating?: number
  value_rating?: number
  customer_support_rating?: number
  would_recommend?: number
  title: string
  body: string
  primary_use_case?: ReviewUseCase
  liked_most?: ReviewLike[]
  would_like_improved?: ReviewImprovement[]
  photo_urls?: string[]
}

export type ReviewSubmitResult =
  | { success: true; reviewId: string; message: string; isVerified: boolean }
  | { success: false; error: string; field?: string }

// ── Verification Check ────────────────────────────────────
async function checkVerificationStatus(userId: string) {
  const supabase = await createClient()

  // Check for active subscription (any tier)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, tier, status, expires_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hasActiveSubscription =
    sub && sub.status === 'active' && new Date(sub.expires_at) > new Date()

  const isLongTermUser = sub
    ? (Date.now() - new Date(sub.created_at).getTime()) > 30 * 24 * 60 * 60 * 1000
    : false

  // Could also check for completed orders here
  // const { count: completedOrders } = await supabase.from('orders')...

  let verificationType: string | null = null
  if (hasActiveSubscription && isLongTermUser) verificationType = 'long_term_user'
  else if (hasActiveSubscription) verificationType = 'subscriber'

  return {
    isVerified: !!verificationType,
    verificationType,
    currentTier: sub?.tier ?? null,
  }
}

// ── Submit Review ─────────────────────────────────────────
export async function submitReviewAction(data: ReviewFormData): Promise<ReviewSubmitResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be signed in to leave a review.' }
  }

  // Validation
  if (!data.display_name?.trim() || data.display_name.length < 2) {
    return { success: false, error: 'Please enter your name.', field: 'display_name' }
  }
  if (!data.overall_rating || data.overall_rating < 1 || data.overall_rating > 5) {
    return { success: false, error: 'Please provide an overall rating.', field: 'overall_rating' }
  }
  if (!data.title?.trim() || data.title.length < 5) {
    return { success: false, error: 'Title must be at least 5 characters.', field: 'title' }
  }
  if (data.title.length > 100) {
    return { success: false, error: 'Title must be under 100 characters.', field: 'title' }
  }
  if (!data.body?.trim() || data.body.length < 20) {
    return { success: false, error: 'Review must be at least 20 characters.', field: 'body' }
  }
  if (data.body.length > 2000) {
    return { success: false, error: 'Review must be under 2,000 characters.', field: 'body' }
  }

  // Rate limit: max 1 review per day per user
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneDayAgo)

  if ((recentCount ?? 0) >= 1) {
    return {
      success: false,
      error: 'You can only submit one review per day. Edit your existing review instead.',
    }
  }

  // Check verification status
  const verification = await checkVerificationStatus(user.id)

  // Insert review
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      display_name: data.display_name.trim(),
      display_role: data.display_role?.trim() || null,
      overall_rating: data.overall_rating,
      meal_quality_rating: data.meal_quality_rating ?? null,
      variety_rating: data.variety_rating ?? null,
      ease_of_use_rating: data.ease_of_use_rating ?? null,
      value_rating: data.value_rating ?? null,
      customer_support_rating: data.customer_support_rating ?? null,
      would_recommend: data.would_recommend ?? null,
      title: data.title.trim(),
      body: data.body.trim(),
      primary_use_case: data.primary_use_case ?? null,
      liked_most: data.liked_most ?? [],
      would_like_improved: data.would_like_improved ?? [],
      photo_urls: data.photo_urls ?? [],
      is_verified: verification.isVerified,
      verified_at: verification.isVerified ? new Date().toISOString() : null,
      verification_type: verification.verificationType,
      subscription_tier_at_review: verification.currentTier,
      status: 'approved', // Auto-approve for now; flip to 'pending' if you want manual moderation
      device_type: typeof navigator !== 'undefined' && /mobile/i.test(navigator.userAgent ?? '') ? 'mobile' : 'desktop',
      source_page: '/',
    })
    .select('id')
    .single()

  if (error || !review) {
    console.error('[submitReview]', error)
    return { success: false, error: 'Could not submit your review. Please try again.' }
  }

  revalidatePath('/')
  revalidatePath('/reviews')

  return {
    success: true,
    reviewId: review.id,
    message: verification.isVerified
      ? 'Thank you! Your verified review is now live. ⭐'
      : 'Thank you! Your review is now live. ⭐',
    isVerified: verification.isVerified,
  }
}

// ── Upload Review Photo ───────────────────────────────────
export async function uploadReviewPhotoAction(formData: FormData): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const file = formData.get('photo')
  if (!(file instanceof File)) return { success: false, error: 'No file provided.' }
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'Photo must be under 5 MB.' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('review-photos')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadErr) {
    console.error('[uploadReviewPhoto]', uploadErr)
    return { success: false, error: 'Upload failed.' }
  }

  const { data: { publicUrl } } = supabase.storage.from('review-photos').getPublicUrl(path)
  return { success: true, url: publicUrl }
}

// ── Fetch Reviews ─────────────────────────────────────────
export async function fetchReviewsAction(options: {
  limit?: number
  featured?: boolean
  verified?: boolean
  minRating?: number
} = {}): Promise<Review[]> {
  const supabase = await createClient()
  const { limit = 12, featured, verified, minRating } = options

  let query = supabase
    .from('reviews')
    .select('*')
    .eq('status', 'approved')

  if (featured) query = query.eq('is_featured', true)
  if (verified) query = query.eq('is_verified', true)
  if (minRating) query = query.gte('overall_rating', minRating)

  query = query
    .order('is_featured', { ascending: false })
    .order('helpful_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data } = await query
  return (data as Review[]) ?? []
}

// ── Fetch Review Stats ────────────────────────────────────
export async function fetchReviewStatsAction(): Promise<ReviewStats> {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('overall_rating, would_recommend, is_verified, liked_most, would_like_improved')
    .eq('status', 'approved')

  if (!reviews || reviews.length === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      nps: null,
      verifiedCount: 0,
      topLikes: [],
      topImprovements: [],
    }
  }

  const total = reviews.length
  const sumRating = reviews.reduce((s, r) => s + (r.overall_rating ?? 0), 0)
  const averageRating = Math.round((sumRating / total) * 10) / 10

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
  reviews.forEach((r) => {
    const rating = r.overall_rating as 1 | 2 | 3 | 4 | 5
    if (rating >= 1 && rating <= 5) ratingDistribution[rating]++
  })

  // NPS calculation
  const npsResponses = reviews.filter((r) => r.would_recommend !== null && r.would_recommend !== undefined)
  let nps: number | null = null
  if (npsResponses.length > 0) {
    const promoters = npsResponses.filter((r) => (r.would_recommend ?? 0) >= 9).length
    const detractors = npsResponses.filter((r) => (r.would_recommend ?? 0) <= 6).length
    nps = Math.round(((promoters - detractors) / npsResponses.length) * 100)
  }

  const verifiedCount = reviews.filter((r) => r.is_verified).length

  // Top likes
  const likeMap = new Map<string, number>()
  reviews.forEach((r) => {
    (r.liked_most ?? []).forEach((tag: string) => {
      likeMap.set(tag, (likeMap.get(tag) ?? 0) + 1)
    })
  })
  const topLikes = Array.from(likeMap.entries())
    .map(([tag, count]) => ({ tag: tag as ReviewLike, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Top improvements requested
  const improvementMap = new Map<string, number>()
  reviews.forEach((r) => {
    (r.would_like_improved ?? []).forEach((tag: string) => {
      improvementMap.set(tag, (improvementMap.get(tag) ?? 0) + 1)
    })
  })
  const topImprovements = Array.from(improvementMap.entries())
    .map(([tag, count]) => ({ tag: tag as ReviewImprovement, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    total,
    averageRating,
    ratingDistribution,
    nps,
    verifiedCount,
    topLikes,
    topImprovements,
  }
}

// ── Vote Helpful ──────────────────────────────────────────
export async function voteReviewAction(reviewId: string, vote: 'helpful' | 'not_helpful') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sign in to vote.' }

  // Remove existing vote first (allows toggling)
  await supabase.from('review_votes').delete().eq('review_id', reviewId).eq('user_id', user.id)

  const { error } = await supabase
    .from('review_votes')
    .insert({ review_id: reviewId, user_id: user.id, vote })

  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  return { success: true }
}

// ── Report Review ─────────────────────────────────────────
export async function reportReviewAction(reviewId: string, reason: string, details?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sign in to report.' }

  const { error } = await supabase
    .from('review_reports')
    .insert({ review_id: reviewId, reporter_id: user.id, reason, details: details || null })

  if (error) return { success: false, error: error.message }

  return { success: true }
}