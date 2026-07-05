// app/auth/confirm/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | null

  if (token_hash && type) {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type,
    })

    if (!error) {
      // ✅ Password recovery → Redirect to reset password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

      // ✅ Email signup confirmation → Redirect to login or dashboard
      if (type === 'signup' || type === 'magiclink') {
        return NextResponse.redirect(`${origin}/login?message=email_confirmed`)
      }

      // ✅ Email change confirmation → Redirect to profile
      if (type === 'email_change') {
        return NextResponse.redirect(`${origin}/dashboard/user/profile?message=email_updated`)
      }

      // ✅ Default → Redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    // Token verification failed
    console.error('OTP verification error:', error.message)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
  }

  // Missing required parameters
  return NextResponse.redirect(`${origin}/login?error=invalid_confirmation_link`)
}