'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type VendorProfile = {
  id: string
  business_name: string | null
  phone: string | null
  subscription_tier: string | null
  subscription_end_date: string | null
  created_at: string | null
  total_orders: number | null
  total_earnings: number | null
  is_verified: boolean | null
}

export type SubscriptionData = {
  vendor: VendorProfile | null
  isFreemiumActive: boolean
  freemiumDaysLeft: number
  currentTier: 'freemium' | 'premium'
}

const FREEMIUM_DAYS = 60

export async function fetchVendorSubscriptionData(userId: string): Promise<SubscriptionData> {
  const supabase = await createClient()
  const emptyData: SubscriptionData = { vendor: null, isFreemiumActive: false, freemiumDaysLeft: 0, currentTier: 'freemium' }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, phone, subscription_tier, subscription_end_date, created_at, total_orders, total_earnings, is_verified')
    .eq('profile_id', userId)
    .maybeSingle()

  if (!vendor) return emptyData

  // Pre-calculate freemium status on the server
  let isFreemiumActive = false
  let freemiumDaysLeft = 0
  
  if (vendor.created_at) {
    const created = new Date(vendor.created_at)
    const now = new Date()
    const freemiumEnd = new Date(created)
    freemiumEnd.setDate(freemiumEnd.getDate() + FREEMIUM_DAYS)
    
    isFreemiumActive = now < freemiumEnd
    const diff = freemiumEnd.getTime() - now.getTime()
    freemiumDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  // Check premium subscription
  const hasPremiumSubscription = vendor.subscription_end_date 
    ? new Date(vendor.subscription_end_date) > new Date() 
    : false

  const currentTier = hasPremiumSubscription ? 'premium' : 'freemium'

  return {
    vendor: vendor as VendorProfile,
    isFreemiumActive,
    freemiumDaysLeft,
    currentTier
  }
}

export async function checkVendorSubscriptionStatusAction(userId: string, tier: string) {
  const supabase = await createClient()
  
  const { data: subs } = await supabase
    .from('vendor_subscriptions')
    .select('*')
    .eq('vendor_id', userId)
    .eq('tier', tier)
    .order('created_at', { ascending: false })
    .limit(1)

  if (subs && subs.length > 0 && subs[0].status === 'active') {
    // Update vendor profile automatically
    await supabase.from('vendors').update({
      subscription_tier: tier,
      subscription_end_date: subs[0].expires_at,
    }).eq('profile_id', userId)
    
    revalidatePath('/dashboard/vendor/subscription')
    return { active: true, expiresAt: subs[0].expires_at }
  }
  
  return { active: false, expiresAt: null }
}