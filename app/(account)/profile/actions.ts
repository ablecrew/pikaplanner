'use server'

import { createClient } from '@/lib/supabase/server'

export type ProfileData = {
  // Core profile
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  bio: string | null
  date_of_birth: string | null
  gender: string | null
  location: string | null
  website: string | null
  role: 'user' | 'vendor' | 'admin' | 'superadmin'
  subscription_tier: string | null
  created_at: string

  // Preferences
  dietary_preferences: string[] | null
  cuisine_preferences: string[] | null
  budget_range: string | null
  household_size: number | null
  is_premium: boolean | null

  // Verification flags
  email_verified: boolean
  phone_verified: boolean
  two_factor_enabled: boolean
}

export type ProfileStats = {
  meal_plans_created: number
  meals_cooked: number
  orders_placed: number
  total_spent: number
  vendors_supported: number
  weeks_active: number
  recipes_saved: number
  longest_streak: number
}

export type Achievement = {
  id: string
  title: string
  description: string
  iconName: 'sparkles' | 'flame' | 'trophy' | 'heart' | 'star' | 'zap' | 'crown' | 'rocket'
  earned: boolean
  earnedAt?: string
  color: string
  bg: string
  progress?: { current: number; target: number }
}

export type ActivityItem = {
  id: string
  type: 'meal_plan' | 'order' | 'meal_cooked' | 'achievement' | 'review' | 'profile_update'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

// ── Fetch Profile ──────────────────────────────────────────
export async function fetchProfile(): Promise<ProfileData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return null

  // Check 2FA status
  const { data: mfa } = await supabase.auth.mfa.listFactors()
  const has2FA = (mfa?.totp ?? []).some((f) => f.status === 'verified')

  return {
    ...profile,
    email_verified: !!user.email_confirmed_at,
    phone_verified: !!user.phone_confirmed_at,
    two_factor_enabled: has2FA,
  } as ProfileData
}

// ── Fetch Stats ────────────────────────────────────────────
export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient()

  const [planRes, entriesRes, ordersRes] = await Promise.all([
    supabase.from('meal_plans').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('meal_plan_entries')
      .select('id', { count: 'exact', head: true })
      .eq('is_cooked', true)
      .in('meal_plan_id', (
        await supabase.from('meal_plans').select('id').eq('user_id', userId)
      ).data?.map((p) => p.id) ?? []),
    supabase.from('orders' as any).select('*').eq('user_id', userId).limit(1000).maybeSingle(),
  ])

  // Calculate weeks active from account creation
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single()

  const weeksActive = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : 0

  return {
    meal_plans_created: planRes.count ?? 0,
    meals_cooked: entriesRes.count ?? 0,
    orders_placed: 0,
    total_spent: 0,
    vendors_supported: 0,
    weeks_active: weeksActive,
    recipes_saved: 0,
    longest_streak: Math.min(weeksActive, 12),
  }
}

// ── Achievements (computed from stats) ────────────────────
export async function fetchAchievements(stats: ProfileStats, has2FA: boolean): Promise<Achievement[]> {
  return [
    {
      id: 'first-plan',
      title: 'First Steps',
      description: 'Generated your very first meal plan',
      iconName: 'sparkles',
      earned: stats.meal_plans_created >= 1,
      earnedAt: stats.meal_plans_created >= 1 ? new Date().toISOString() : undefined,
      color: '#1A5C3A',
      bg: '#f0fdf4',
    },
    {
      id: 'meal-master',
      title: 'Meal Master',
      description: 'Generated 10 meal plans',
      iconName: 'trophy',
      earned: stats.meal_plans_created >= 10,
      color: '#F4A535',
      bg: '#fff7ed',
      progress: stats.meal_plans_created < 10
        ? { current: stats.meal_plans_created, target: 10 }
        : undefined,
    },
    {
      id: 'cooking-streak',
      title: 'On Fire',
      description: 'Marked 25 meals as cooked',
      iconName: 'flame',
      earned: stats.meals_cooked >= 25,
      color: '#f97316',
      bg: '#fff7ed',
      progress: stats.meals_cooked < 25
        ? { current: stats.meals_cooked, target: 25 }
        : undefined,
    },
    {
      id: 'loyal',
      title: 'Loyal Customer',
      description: 'Placed 10 orders from local vendors',
      iconName: 'heart',
      earned: stats.orders_placed >= 10,
      color: '#dc2626',
      bg: '#fef2f2',
      progress: stats.orders_placed < 10
        ? { current: stats.orders_placed, target: 10 }
        : undefined,
    },
    {
      id: 'veteran',
      title: 'Veteran',
      description: 'Active for 12 weeks',
      iconName: 'star',
      earned: stats.weeks_active >= 12,
      color: '#7c3aed',
      bg: '#f5f3ff',
      progress: stats.weeks_active < 12
        ? { current: stats.weeks_active, target: 12 }
        : undefined,
    },
    {
      id: 'secure',
      title: 'Security First',
      description: 'Enabled two-factor authentication',
      iconName: 'zap',
      earned: has2FA,
      color: '#2563eb',
      bg: '#eff6ff',
    },
    {
      id: 'premium-member',
      title: 'Premium Member',
      description: 'Upgraded to Premium subscription',
      iconName: 'crown',
      earned: false,
      color: '#F4A535',
      bg: '#fffbeb',
    },
    {
      id: 'explorer',
      title: 'Cuisine Explorer',
      description: 'Tried meals from 5 different cuisines',
      iconName: 'rocket',
      earned: false,
      color: '#0891b2',
      bg: '#ecfeff',
    },
  ]
}

// ── Activity Feed ──────────────────────────────────────────
export async function fetchRecentActivity(userId: string): Promise<ActivityItem[]> {
  const supabase = await createClient()

  // Fetch recent meal plans
  const { data: plans } = await supabase
    .from('meal_plans')
    .select('id, title, is_ai_generated, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recently cooked meals
  const { data: cookedEntries } = await supabase
    .from('meal_plan_entries')
    .select('id, scheduled_date, updated_at, meals(name)')
    .eq('is_cooked', true)
    .order('updated_at', { ascending: false })
    .limit(5)

  const activities: ActivityItem[] = []

  // Add plans
  for (const plan of plans ?? []) {
    activities.push({
      id: `plan-${plan.id}`,
      type: 'meal_plan',
      title: plan.is_ai_generated ? 'Generated AI meal plan' : 'Created meal plan',
      description: plan.title ?? 'Weekly Meal Plan',
      timestamp: plan.created_at ?? new Date().toISOString(),
    })
  }

  // Add cooked meals
  for (const entry of cookedEntries ?? []) {
    const mealName = (entry as any).meals?.name ?? 'a meal'
    activities.push({
      id: `cooked-${entry.id}`,
      type: 'meal_cooked',
      title: 'Cooked a meal',
      description: mealName,
      timestamp: entry.updated_at ?? new Date().toISOString(),
    })
  }

  // Sort by timestamp descending
  activities.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return activities.slice(0, 10)
}