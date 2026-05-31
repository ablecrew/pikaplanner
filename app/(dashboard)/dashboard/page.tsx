'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const redirectUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      // Use RPC function to bypass RLS
      const rpcResult = await supabase.rpc('get_my_profile').single()
      const data = rpcResult.data as {
        id: string
        role: string
        is_active: boolean
        onboarding_complete: boolean
      } | null
      const error = rpcResult.error

      if (error || !data) {
        // Profile doesn't exist yet — create it
        await supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          role: session.user.user_metadata?.role || 'user',
          is_active: true,
          onboarding_complete: false,
        }, { onConflict: 'id' })

        router.replace('/onboarding')
        return
      }

      if (!data.is_active) {
        await supabase.auth.signOut()
        router.replace('/login?error=account_deactivated')
        return
      }

      const role = data.role

      if (role === 'admin' || role === 'superadmin') {
        router.replace('/dashboard/admin/overview')
      } else if (role === 'vendor') {
        router.replace('/dashboard/vendor/overview')
      } else {
        router.replace('/dashboard/user/overview')
      }
    }

    redirectUser()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Loading dashboard...
    </div>
  )
}