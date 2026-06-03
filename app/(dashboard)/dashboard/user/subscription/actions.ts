'use server'

import { createClient } from '@/lib/supabase/server'

export type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export type Subscription = {
  id: string
  tier: string
  status: string
  starts_at: string
  expires_at: string | null
  amount_paid: number
  auto_renew: boolean
}

export async function fetchSubscriptionData(userId: string) {
  const supabase = await createClient()

  // 🚀 PARALLEL FETCHING (Massive speedup)
  const [profileRes, subRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, phone').eq('id', userId).maybeSingle(),
    supabase.from('subscriptions').select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  return {
    profile: profileRes.data as UserProfile | null,
    subscription: subRes.data as Subscription | null
  }
}

export async function checkSubscriptionStatusAction(userId: string, tier: string, isVendor: boolean) {
  const supabase = await createClient()
  const tableName = isVendor ? 'vendor_subscriptions' : 'subscriptions'
  const userIdField = isVendor ? 'vendor_id' : 'user_id'

  const { data } = await supabase
    .from(tableName)
    .select('*')
    .eq(userIdField, userId)
    .eq('tier', tier)
    .order('created_at', { ascending: false })
    .limit(1)

  if (data && data.length > 0 && data[0].status === 'active') {
    if (isVendor) {
      await supabase.from('vendors').update({
        subscription_tier: tier,
        subscription_end_date: data[0].expires_at,
      }).eq('id', userId)
    }
    return { active: true, subscription: data[0] as Subscription }
  }
  
  return { active: false, subscription: null }
}