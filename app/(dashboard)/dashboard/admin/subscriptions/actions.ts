'use server'

import { createClient } from '@/lib/supabase/server'

export type Subscription = {
  id: string
  user_id: string
  vendor_id: string | null
  tier: string
  status: string
  starts_at: string
  expires_at: string | null
  amount_paid: number
  currency: string
  auto_renew: boolean
  mpesa_transaction_id: string | null
  created_at: string
  user_name?: string
  user_email?: string
  vendor_name?: string
}

export type SubscriptionStats = {
  total: number
  active: number
  expired: number
  revenue: number
  monthly: number
  yearly: number
  freemium: number
  premium: number
}

export type SubscriptionsPayload = {
  subscriptions: Subscription[]
  stats: SubscriptionStats
}

export async function fetchAdminSubscriptionsData(): Promise<SubscriptionsPayload> {
  const supabase = await createClient()

  // PARALLEL FETCHING (Phase 1: Subscriptions)
  const [{ data: userSubs }, { data: vendorSubs }] = await Promise.all([
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('vendor_subscriptions').select('*').order('created_at', { ascending: false }).limit(100)
  ])

  const userIds = [...new Set((userSubs || []).map((s: any) => s.user_id).filter(Boolean))]
  const vendorIds = [...new Set((vendorSubs || []).map((s: any) => s.vendor_id).filter(Boolean))]

  // PARALLEL FETCHING (Phase 2: Relational Data)
  const [{ data: profiles }, { data: vendors }] = await Promise.all([
    userIds.length > 0 ? supabase.from('profiles').select('id, full_name, email').in('id', userIds) : Promise.resolve({ data: [] }),
    vendorIds.length > 0 ? supabase.from('vendors').select('id, business_name').in('id', vendorIds) : Promise.resolve({ data: [] })
  ])

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  const vendorMap = new Map((vendors || []).map((v: any) => [v.id, v]))

  // Map User Subscriptions
  const userMapped: Subscription[] = (userSubs || []).map((s: any) => {
    const profile = profileMap.get(s.user_id)
    return {
      ...s,
      vendor_id: null,
      user_name: profile?.full_name || 'User',
      user_email: profile?.email || '',
      vendor_name: undefined,
    }
  })

  // Map Vendor Subscriptions
  const vendorMapped: Subscription[] = (vendorSubs || []).map((s: any) => {
    const vendor = vendorMap.get(s.vendor_id)
    return {
      ...s,
      user_id: s.vendor_id,
      user_name: vendor?.business_name || 'Vendor',
      user_email: '',
      vendor_name: vendor?.business_name || 'Vendor',
    }
  })

  const allSubscriptions = [...userMapped, ...vendorMapped]

  // Calculate Stats on the Server
  const activeSubs = allSubscriptions.filter(s => s.status === 'active')
  
  const stats: SubscriptionStats = {
    total: allSubscriptions.length,
    active: activeSubs.length,
    expired: allSubscriptions.filter(s => s.status === 'expired').length,
    revenue: allSubscriptions.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0),
    monthly: activeSubs.filter(s => s.tier === 'monthly').reduce((sum, s) => sum + Number(s.amount_paid || 0), 0),
    yearly: activeSubs.filter(s => s.tier === 'yearly').reduce((sum, s) => sum + Number(s.amount_paid || 0), 0),
    freemium: activeSubs.filter(s => s.tier === 'freemium').length,
    premium: activeSubs.filter(s => s.tier === 'premium').length,
  }

  return { subscriptions: allSubscriptions, stats }
}