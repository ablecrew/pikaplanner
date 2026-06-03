'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProfileData = {
  id?: string
  email?: string
  full_name?: string | null
  phone?: string | null
  avatar_url?: string | null
  location_city?: string | null
  bio?: string | null
  role?: string
}

export type SiteConfig = {
  site_name: string
  support_email: string
  default_currency: string
  timezone: string
  language: string
  maintenance_mode: boolean
  announcement: string
  data_retention_months?: number
}

export type NotificationPrefs = {
  new_user: boolean
  new_vendor: boolean
  new_order: boolean
  order_failed: boolean
  payment_failed: boolean
  vendor_complaint: boolean
  system_alerts: boolean
  weekly_report: boolean
}

export type AppearancePrefs = {
  theme: string
  accent: string
}

export type AdminSettingsPayload = {
  profile: ProfileData
  siteConfig: SiteConfig
  notificationPrefs: NotificationPrefs
  appearance: AppearancePrefs
}

export async function fetchAdminSettingsData(): Promise<AdminSettingsPayload> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  // 🚀 PARALLEL FETCHING
  const [{ data: profile }, { data: siteConfig }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('site_config').select('*').limit(1).single()
  ])

  const defaultPrefs: NotificationPrefs = {
    new_user: true, new_vendor: true, new_order: true, order_failed: true,
    payment_failed: true, vendor_complaint: true, system_alerts: true, weekly_report: false,
  }

  return {
    profile: {
      id: user.id,
      email: user.email || '',
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || null,
      location_city: profile?.location_city || '',
      bio: profile?.bio || '',
      role: profile?.role || 'admin'
    },
    siteConfig: {
      site_name: siteConfig?.site_name || 'PikaPlan',
      support_email: siteConfig?.support_email || '',
      default_currency: siteConfig?.default_currency || 'KES',
      timezone: siteConfig?.timezone || 'Africa/Nairobi',
      language: siteConfig?.language || 'en',
      maintenance_mode: siteConfig?.maintenance_mode || false,
      announcement: siteConfig?.announcement || '',
      data_retention_months: siteConfig?.data_retention_months || 12
    },
    notificationPrefs: (profile?.notification_prefs as NotificationPrefs) || defaultPrefs,
    appearance: (profile?.preferences as AppearancePrefs) || { theme: 'light', accent: 'emerald' }
  }
}

export async function saveProfileAction(data: ProfileData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('profiles').upsert({
    id: user.id, email: user.email, full_name: data.full_name, phone: data.phone,
    location_city: data.location_city, bio: data.bio, updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/settings')
}

export async function uploadAvatarAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('avatar') as File
  if (!file) throw new Error('No file provided')

  const fileExt = file.name.split('.').pop()
  const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
  const { error } = await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id)
  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/admin/settings')
  return urlData.publicUrl
}

export async function saveSiteConfigAction(data: SiteConfig) {
  const supabase = await createClient()
  const { error } = await supabase.from('site_config').upsert({ id: 1, ...data, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/settings')
}

export async function saveNotificationPrefsAction(prefs: NotificationPrefs) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('profiles').update({ notification_prefs: prefs, updated_at: new Date().toISOString() }).eq('id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/settings')
}

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

export async function saveAppearanceAction(theme: string, accent: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('profiles').update({ preferences: { theme, accent }, updated_at: new Date().toISOString() }).eq('id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/settings')
}

export async function saveDataRetentionAction(months: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('site_config').upsert({ id: 1, data_retention_months: months, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/settings')
}

export async function signOutAllAction() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
}