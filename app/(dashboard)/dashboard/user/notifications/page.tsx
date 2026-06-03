import UserNotificationsClient from './UserNotificationsClient'
import { createClient } from '@/lib/supabase/server'
import { fetchUserNotifications } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialNotifications = user ? await fetchUserNotifications(user.id) : []

  return <UserNotificationsClient initialNotifications={initialNotifications} />
}