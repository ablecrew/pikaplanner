'use server'

import { createClient } from '@/lib/supabase/server'

export type SubscriptionStatus = {
  isActive: boolean
  isPremium: boolean         // any paid plan
  isFree: boolean            // explicit 'free' tier or no subscription
  tier: string | null        // 'free' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  expiresAt: string | null
  daysRemaining: number
  subscription: any | null
}

export async function getSubscriptionStatus(userId?: string): Promise<SubscriptionStatus> {
  const supabase = await createClient()

  // If userId not provided, use current user
  let uid = userId
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        isActive: false, isPremium: false, isFree: true,
        tier: null, expiresAt: null, daysRemaining: 0, subscription: null,
      }
    }
    uid = user.id
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', uid)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) {
    return {
      isActive: false, isPremium: false, isFree: true,
      tier: 'free', expiresAt: null, daysRemaining: 0, subscription: null,
    }
  }

  const daysRemaining = sub.expires_at
    ? Math.max(0, Math.ceil(
        (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    : 0

  const isPremium = sub.tier !== 'free' && sub.tier !== null

  return {
    isActive: true,
    isPremium,
    isFree: sub.tier === 'free',
    tier: sub.tier,
    expiresAt: sub.expires_at,
    daysRemaining,
    subscription: sub,
  }
}

export async function requireSubscription(): Promise<{ ok: true; status: SubscriptionStatus } | { ok: false; reason: string; status: SubscriptionStatus }> {
  const status = await getSubscriptionStatus()

  if (!status.isActive || !status.isPremium) {
    return {
      ok: false,
      reason: 'subscription_required',
      status,
    }
  }

  return { ok: true, status }
}