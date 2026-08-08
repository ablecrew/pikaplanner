import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getSafeSignupRole(role: string | null) {
  if (role === 'vendor') return 'vendor'
  return 'user'
}

function getRedirectForRole(role?: string | null, onboardingComplete?: boolean | null) {
  // Admin/Superadmin → Admin Dashboard
  if (role === 'admin' || role === 'superadmin') {
    return '/dashboard/admin/overview'
  }

  // Vendor → Check onboarding
  if (role === 'vendor') {
    return onboardingComplete ? '/dashboard/vendor/overview' : '/vendor-signup'
  }

  // User → Check onboarding
  if (role === 'user') {
    return onboardingComplete ? '/dashboard/user/overview' : '/onboarding'
  }

  // Default fallback → User overview
  return '/dashboard/user/overview'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedRole = searchParams.get('role')
  const signupRole = getSafeSignupRole(requestedRole)

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth exchange error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (sessionData?.user) {
      const user = sessionData.user
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User'

      // Check for existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role, onboarding_complete')
        .eq('id', user.id)
        .single()

      const isFirstLogin = !existingProfile

      if (isFirstLogin) {
        console.log(`First login for user ${user.id}, role: ${signupRole}`)

        // Create the user's profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: signupRole,
          is_active: true,
          onboarding_complete: false,
        })

        if (profileError) {
          console.error('Failed to create profile:', profileError)
          return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
        }
      }

      // Idempotent vendor row check (runs on EVERY login for vendors)
      if (signupRole === 'vendor') {
        const { data: existingVendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (!existingVendor) {
          console.log(`Backfilling missing vendor row for ${user.id}`)

          const { error: vendorError } = await supabase.from('vendors').insert({
            profile_id: user.id,
            business_name: `${fullName}'s Kitchen`,
            email: user.email,
            phone: '2547000000',
            location_city: 'Unknown',
            is_verified: false,
            is_active: true,
            is_accepting_orders: false,
            total_orders: 0,
            total_earnings: 0,
            available_balance: 0,
            withdrawal_threshold: 500,
          })

          if (vendorError) {
            console.error('CRITICAL: Failed to backfill vendor record:', vendorError)
          } else {
            console.log(`Successfully created/backfilled vendor record for ${user.id}`)
          }
        }
      }

      // Send notifications
      try {
        const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

        await supabase.from('notification_logs').insert({
          user_id: user.id,
          title: isFirstLogin ? `🎉 Welcome to PikaPlan, ${displayName}!` : `👋 Welcome back, ${displayName}!`,
          body: isFirstLogin
            ? 'Start exploring delicious meals, create your first meal plan, and discover local vendors.'
            : "Ready to continue your meal planning journey?",
          type: 'system',
          channel: 'in_app',
          is_read: false,
          sent_at: new Date().toISOString(),
          metadata: { trigger: 'login', first_login: isFirstLogin },
        })
      } catch (notifError) {
        console.error('Welcome notification failed:', notifError)
      }

      // Fetch final profile state and redirect
      const { data: finalProfile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete')
        .eq('id', user.id)
        .single()

      const redirectTo = getRedirectForRole(finalProfile?.role, finalProfile?.onboarding_complete)

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no_auth_code`)
}