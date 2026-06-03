'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DaySchedule = { day: string; isOpen: boolean; openTime: string; closeTime: string }

export type VendorSettings = {
  id: string
  businessName: string
  email: string
  phone: string
  description: string
  category: string
  cuisine: string
  locationCity: string
  locationAddress: string
  logoUrl: string
  coverUrl: string
  website: string
  instagram: string
  facebook: string
  twitter: string
  isVerified: boolean
  isActive: boolean
  isAcceptingOrders: boolean
  minimumOrder: number
  deliveryRadius: number
  deliveryFee: number
  prepTime: number
  withdrawalThreshold: number
  payoutMethod: 'mpesa' | 'bank'
  mpesaNumber: string
  bankName: string
  bankAccount: string
  taxId: string
  businessRegistration: string
  business_reg_document_url: string
  food_handler_cert_url: string
  tax_compliance_cert_url: string
  national_id_url: string
  bank_statement_url: string
  schedule: DaySchedule[]
  preferences: {
    emailNotifications: boolean; smsNotifications: boolean; pushNotifications: boolean;
    orderAlerts: boolean; paymentAlerts: boolean; reviewAlerts: boolean; marketingEmails: boolean; aiInsights: boolean;
    theme: 'light' | 'dark' | 'system'; language: string; currency: string; timezone: string;
  }
  security: { twoFactorEnabled: boolean; loginAlerts: boolean; sessionTimeout: number }
}

const INITIAL_SCHEDULE: DaySchedule[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
  day, isOpen: day !== 'Sunday', openTime: '08:00', closeTime: '22:00',
}))

export async function fetchVendorSettingsData(userId: string): Promise<VendorSettings | null> {
  const supabase = await createClient()
  
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle()

  if (!vendor) return null

  const np = vendor.notification_preferences || {}
  
  return {
    id: vendor.id,
    businessName: vendor.business_name || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    description: vendor.description || '',
    category: vendor.category || 'Restaurant',
    cuisine: vendor.cuisine || 'Kenyan',
    locationCity: vendor.location_city || '',
    locationAddress: vendor.location_address || '',
    logoUrl: vendor.logo_url || '',
    coverUrl: vendor.cover_url || '',
    website: vendor.website || '',
    instagram: vendor.instagram || '',
    facebook: vendor.facebook || '',
    twitter: vendor.twitter || '',
    isVerified: vendor.is_verified || false,
    isActive: vendor.is_active ?? true,
    isAcceptingOrders: vendor.is_accepting_orders ?? true,
    minimumOrder: Number(vendor.minimum_order || 500),
    deliveryRadius: Number(vendor.delivery_radius || 10),
    deliveryFee: Number(vendor.delivery_fee || 100),
    prepTime: Number(vendor.prep_time || 30),
    withdrawalThreshold: Number(vendor.withdrawal_threshold || 500),
    payoutMethod: (vendor.payout_method as 'mpesa' | 'bank') || 'mpesa',
    mpesaNumber: vendor.mpesa_number || '',
    bankName: vendor.bank_name || '',
    bankAccount: vendor.bank_account || '',
    taxId: vendor.tax_id || '',
    businessRegistration: vendor.business_registration || '',
    business_reg_document_url: vendor.business_reg_document_url || '',
    food_handler_cert_url: vendor.food_handler_cert_url || '',
    tax_compliance_cert_url: vendor.tax_compliance_cert_url || '',
    national_id_url: vendor.national_id_url || '',
    bank_statement_url: vendor.bank_statement_url || '',
    schedule: (vendor.operating_hours && Array.isArray(vendor.operating_hours) && vendor.operating_hours.length > 0) ? vendor.operating_hours : INITIAL_SCHEDULE,
    preferences: {
      emailNotifications: np.email ?? true, smsNotifications: np.sms ?? false, pushNotifications: np.push ?? true,
      orderAlerts: np.order_alerts ?? true, paymentAlerts: np.payment_alerts ?? true, reviewAlerts: np.review_alerts ?? true,
      marketingEmails: np.marketing ?? false, aiInsights: np.ai_insights ?? true,
      theme: vendor.theme || 'light', language: vendor.language || 'en', currency: vendor.currency || 'KES', timezone: vendor.timezone || 'Africa/Nairobi',
    },
    security: {
      twoFactorEnabled: vendor.two_factor_enabled ?? false,
      loginAlerts: vendor.login_alerts ?? true,
      sessionTimeout: vendor.session_timeout || 30,
    }
  }
}

export async function saveVendorSettingsAction(vendorId: string, tab: string, payload: any) {
  const supabase = await createClient()
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }

  if (tab === 'profile') {
    Object.assign(updateData, {
      business_name: payload.businessName, email: payload.email, phone: payload.phone, description: payload.description,
      category: payload.category, cuisine: payload.cuisine, location_city: payload.locationCity, location_address: payload.locationAddress,
      logo_url: payload.logoUrl, cover_url: payload.coverUrl, website: payload.website, instagram: payload.instagram,
      facebook: payload.facebook, twitter: payload.twitter,
    })
  } else if (tab === 'operations') {
    Object.assign(updateData, {
      is_active: payload.isActive, is_accepting_orders: payload.isAcceptingOrders, minimum_order: payload.minimumOrder,
      delivery_radius: payload.deliveryRadius, delivery_fee: payload.deliveryFee, prep_time: payload.prepTime, operating_hours: payload.schedule,
    })
  } else if (tab === 'payments') {
    Object.assign(updateData, {
      withdrawal_threshold: payload.withdrawalThreshold, payout_method: payload.payoutMethod,
      mpesa_number: payload.payoutMethod === 'mpesa' ? payload.mpesaNumber : null,
      bank_name: payload.payoutMethod === 'bank' ? payload.bankName : null,
      bank_account: payload.payoutMethod === 'bank' ? payload.bankAccount : null,
      tax_id: payload.taxId || null, business_registration: payload.businessRegistration || null,
    })
  } else if (tab === 'preferences') {
    Object.assign(updateData, {
      theme: payload.theme, language: payload.language, currency: payload.currency, timezone: payload.timezone,
      notification_preferences: {
        email: payload.emailNotifications, sms: payload.smsNotifications, push: payload.pushNotifications,
        order_alerts: payload.orderAlerts, payment_alerts: payload.paymentAlerts, review_alerts: payload.reviewAlerts,
        ai_insights: payload.aiInsights, marketing: payload.marketingEmails,
      },
    })
  } else if (tab === 'security') {
    Object.assign(updateData, {
      two_factor_enabled: payload.twoFactorEnabled, session_timeout: payload.sessionTimeout, login_alerts: payload.loginAlerts,
    })
  } else if (tab === 'documents') {
    Object.assign(updateData, {
      business_reg_document_url: payload.business_reg_document_url || null, food_handler_cert_url: payload.food_handler_cert_url || null,
      tax_compliance_cert_url: payload.tax_compliance_cert_url || null, national_id_url: payload.national_id_url || null,
      bank_statement_url: payload.bank_statement_url || null,
    })
  }

  const { error } = await supabase.from('vendors').update(updateData).eq('id', vendorId)
  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/vendor/settings')
  return { success: true }
}

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deactivateVendorAccountAction(userId: string) {
  const supabase = await createClient()
  await supabase.from('vendors').update({ is_active: false, is_accepting_orders: false }).eq('profile_id', userId)
  await supabase.auth.signOut()
  revalidatePath('/')
}