'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; field?: string }

export type Profile = {
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
  role: string
  subscription_tier: string | null
}

export type UserPreferences = {
  email_marketing: boolean
  email_orders: boolean
  email_meal_reminders: boolean
  email_weekly_digest: boolean
  email_product_updates: boolean
  sms_orders: boolean
  sms_promotions: boolean
  push_orders: boolean
  push_meal_reminders: boolean
  push_promotions: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  language: 'en' | 'sw'
  timezone: string
  currency: string
  theme: 'light' | 'dark' | 'system'
  marketing_consent: boolean
  analytics_consent: boolean
  profile_visibility: 'public' | 'private'
}

export type Session = {
  id: string
  device_name: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  location: string | null
  is_current: boolean
  last_active_at: string
  created_at: string
}

// ── Fetchers ───────────────────────────────────────────────
export async function fetchProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return data as Profile | null
}

export async function fetchPreferences(): Promise<UserPreferences | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Create default row if none exists
  if (!data) {
    await supabase.from('user_preferences').insert({ user_id: user.id })
    return fetchPreferences()
  }

  return data as UserPreferences
}

export async function fetchSessions(): Promise<Session[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('last_active_at', { ascending: false })
    .limit(20)

  return (data as Session[]) ?? []
}

// ── General Info ───────────────────────────────────────────
export async function updateGeneralAction(formData: {
  full_name: string
  bio?: string
  phone?: string
  location?: string
  website?: string
  date_of_birth?: string
  gender?: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  if (!formData.full_name?.trim() || formData.full_name.length < 2) {
    return { success: false, error: 'Name must be at least 2 characters.', field: 'full_name' }
  }
  if (formData.phone && !/^\+?\d[\d\s\-]{7,}$/.test(formData.phone)) {
    return { success: false, error: 'Invalid phone number.', field: 'phone' }
  }
  if (formData.website && !/^https?:\/\//.test(formData.website)) {
    return { success: false, error: 'Website must start with http:// or https://', field: 'website' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: formData.full_name.trim(),
      bio: formData.bio?.trim() || null,
      phone: formData.phone?.trim() || null,
      location: formData.location?.trim() || null,
      website: formData.website?.trim() || null,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[updateGeneral]', error)
    return { success: false, error: 'Could not save your changes.' }
  }

  revalidatePath('/profile/settings/general')
  return { success: true, message: 'Profile updated successfully.' }
}

export async function updateEmailAction(newEmail: string): Promise<ActionResult> {
  const supabase = await createClient()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { success: false, error: 'Invalid email address.' }
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) return { success: false, error: error.message }

  return {
    success: true,
    message: 'Check your new email for a confirmation link to complete the change.',
  }
}

// ── Avatar Upload ──────────────────────────────────────────
export async function uploadAvatarAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const file = formData.get('avatar')
  if (!(file instanceof File)) return { success: false, error: 'No file provided.' }
  if (file.size > 5 * 1024 * 1024) return { success: false, error: 'Image must be under 5 MB.' }
  if (!file.type.startsWith('image/')) return { success: false, error: 'Only images allowed.' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/avatar-${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadErr) {
    console.error('[uploadAvatar]', uploadErr)
    return { success: false, error: 'Upload failed.' }
  }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)

  revalidatePath('/profile/settings/general')
  return { success: true, data: { url: publicUrl }, message: 'Avatar updated.' }
}

// ── Security: Password ─────────────────────────────────────
export async function updatePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: 'Not authenticated.' }

  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters.', field: 'newPassword' }
  }
  if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return { success: false, error: 'Password must include an uppercase letter and a number.', field: 'newPassword' }
  }

  // Verify current password
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInErr) {
    return { success: false, error: 'Current password is incorrect.', field: 'currentPassword' }
  }

  const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
  if (updateErr) {
    return { success: false, error: updateErr.message }
  }

  return { success: true, message: 'Password updated successfully.' }
}

// ── Security: 2FA ──────────────────────────────────────────
export async function enroll2FAAction(): Promise<ActionResult<{ qr: string; secret: string; factorId: string }>> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator App',
  })

  if (error) return { success: false, error: error.message }

  return {
    success: true,
    data: {
      qr: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    },
  }
}

export async function verify2FAAction(factorId: string, code: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
  if (chErr) return { success: false, error: chErr.message }

  const { error: verifyErr } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  })

  if (verifyErr) return { success: false, error: 'Invalid code. Please try again.', field: 'code' }

  revalidatePath('/profile/settings/security')
  return { success: true, message: 'Two-factor authentication enabled.' }
}

export async function disable2FAAction(factorId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) return { success: false, error: error.message }

  revalidatePath('/profile/settings/security')
  return { success: true, message: '2FA disabled.' }
}

export async function fetch2FAFactors() {
  const supabase = await createClient()
  const { data } = await supabase.auth.mfa.listFactors()
  return data?.totp ?? []
}

// ── Security: Sessions ─────────────────────────────────────
export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/profile/settings/security')
  return { success: true, message: 'Session revoked.' }
}

export async function revokeAllSessionsAction(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  await supabase.from('user_sessions').delete().eq('user_id', user.id).eq('is_current', false)
  return { success: true, message: 'All other sessions revoked.' }
}

// ── Notifications ──────────────────────────────────────────
export async function updateNotificationsAction(prefs: Partial<UserPreferences>): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/profile/settings/notifications')
  return { success: true, message: 'Notification preferences saved.' }
}

// ── Preferences ────────────────────────────────────────────
export async function updatePreferencesAction(prefs: Partial<UserPreferences>): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' })

  if (error) return { success: false, error: error.message }

  revalidatePath('/profile/settings/preferences')
  return { success: true, message: 'Preferences saved.' }
}

// ── Data Export ────────────────────────────────────────────
export async function requestDataExportAction(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  // Check recent request (rate limit: 1 per 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('data_export_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('requested_at', oneDayAgo)

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: 'You have already requested an export in the last 24 hours.',
    }
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('data_export_requests').insert({
    user_id: user.id,
    status: 'pending',
    expires_at: expiresAt,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/profile/settings/privacy')
  return {
    success: true,
    message: 'Export requested. We will email you within 30 days when your data is ready.',
  }
}

// ── Account Deletion ───────────────────────────────────────
export async function requestAccountDeletionAction(
  password: string,
  reason?: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: 'Not authenticated.' }

  // Verify password
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (signInErr) {
    return { success: false, error: 'Password incorrect.', field: 'password' }
  }

  const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('account_deletion_requests')
    .upsert({ user_id: user.id, reason: reason || null, scheduled_for: scheduledFor }, {
      onConflict: 'user_id',
    })

  if (error) return { success: false, error: error.message }

  await supabase.auth.signOut()
  redirect('/?deleted=scheduled')
}

export async function cancelDeletionAction(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  await supabase.from('account_deletion_requests').delete().eq('user_id', user.id)

  revalidatePath('/profile/settings/privacy')
  return { success: true, message: 'Deletion cancelled. Your account is safe.' }
}

export async function fetchDeletionStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('account_deletion_requests')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

export async function fetchExportHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('requested_at', { ascending: false })
    .limit(5)

  return data ?? []
}