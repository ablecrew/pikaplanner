import UserSettingsClient from './UserSettingsClient'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/app/actions/manageProfile'

export const dynamic = 'force-dynamic'

export default async function UserSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialProfile = null
  if (user) {
    const res = await getUserProfile(user.id)
    if (res.success) initialProfile = res.data
  }

  // Ensure this matches the export in UserSettingsClient.tsx
  return <UserSettingsClient user={user} initialProfile={initialProfile} />
}