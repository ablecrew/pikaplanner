'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ── Validation schemas ──────────────────────────────────────

const SignupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Invalid phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  role: z.enum(['user', 'vendor', 'admin']).default('user'),
})

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

const ResetPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
})

const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
})

// ── Types ───────────────────────────────────────────────────

type ActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string>
  data?: unknown
}

// ── Sign Up ─────────────────────────────────────────────────

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    password: formData.get('password'),
    role: formData.get('role') || 'user',
  }

  const result = SignupSchema.safeParse(rawData)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors

    return {
      success: false,
      fieldErrors: Object.fromEntries(
        Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] || 'Invalid value'])
      ),
    }
  }

  const { email, password, fullName, role, phone } = result.data
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, phone },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    return { success: false, error: error.message }
  }

  // ✅ NO FREE TRIAL - Users must subscribe to access premium features

  return { success: true, data: { message: 'Check your email to confirm your account.' } }
}

// ── Sign In ─────────────────────────────────────────────────

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const result = LoginSchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: 'Invalid email or password format.' }
  }

  const { email, password } = result.data
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: 'Invalid email or password. Please try again.' }
  }

  // Fetch user profile to determine redirect
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active, onboarding_complete, full_name')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { success: false, error: 'Profile not found. Please contact support.' }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been deactivated. Contact support.' }
  }

  revalidatePath('/', 'layout')

  const fullName = profile?.full_name || data.user.email?.split('@')[0] || 'User'

  try {
    await supabase.from('notification_logs').insert({
      user_id: data.user.id,
      title: `👋 Welcome back, ${fullName}!`,
      body: 'Ready to continue your journey?',
      type: 'system',
      channel: 'in_app',
      is_read: false,
      sent_at: new Date().toISOString(),
      metadata: { trigger: 'login', first_login: false },
    })
  } catch (_) {
    // Ignore notification errors
  }

  // ✅ COMPLETE REDIRECT LOGIC FOR ALL ROLES
  let redirectUrl = '/dashboard/user/overview' // Default fallback

  // Admin/Superadmin → Admin Dashboard
  if (profile.role === 'admin' || profile.role === 'superadmin') {
    redirectUrl = '/dashboard'
  }
  // Vendor → Check onboarding
  else if (profile.role === 'vendor') {
    redirectUrl = profile.onboarding_complete
      ? '/dashboard/vendor/overview'
      : '/vendor-signup'
  }
  // User → Check onboarding
  else if (profile.role === 'user') {
    redirectUrl = profile.onboarding_complete
      ? '/dashboard/user/overview'
      : '/onboarding'
  }

  // Return role, onboarding status, and redirect URL
  return {
    success: true,
    data: {
      role: profile.role,
      onboardingComplete: profile.onboarding_complete ?? false,
      redirect: redirectUrl,
    },
  }
}

// ── Sign Out ────────────────────────────────────────────────

export async function signOutAction() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ── Google OAuth ─────────────────────────────────────────────

export async function signInWithGoogleAction(role: 'user' | 'vendor' | 'admin' = 'user') {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?role=${role}`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error) return { success: false, error: error.message }
  if (data.url) redirect(data.url)
}

// ── Forgot Password ─────────────────────────────────────────

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string
  const result = ResetPasswordSchema.safeParse({ email })

  if (!result.success) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const supabase = await createServerSupabaseClient()

  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  return {
    success: true,
    data: { message: 'If that email exists, you will receive a reset link shortly.' },
  }
}

// ── Update Password ─────────────────────────────────────────

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const password = formData.get('password') as string
  const result = UpdatePasswordSchema.safeParse({ password })

  if (!result.success) {
    return { success: false, error: 'Password does not meet requirements.' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password: result.data.password })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Get Current User ─────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

// ── Verify OTP (for phone) ───────────────────────────────────

export async function verifyOtpAction(phone: string, token: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) return { success: false, error: 'Invalid or expired OTP.' }
  return { success: true }
}