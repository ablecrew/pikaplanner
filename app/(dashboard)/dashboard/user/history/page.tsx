import UserHistoryClient from './UserHistoryClient'
import { createClient } from '@/lib/supabase/server'
import { fetchUserOrders } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialOrders = user ? await fetchUserOrders(user.id) : []

  return <UserHistoryClient initialOrders={initialOrders} />
}