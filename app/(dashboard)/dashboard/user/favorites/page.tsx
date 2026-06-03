import UserFavoritesClient from './UserFavoritesClient'
import { createClient } from '@/lib/supabase/server'
import { fetchUserFavorites } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserFavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialFavorites = user ? await fetchUserFavorites(user.id) : []

  return <UserFavoritesClient initialFavorites={initialFavorites} userId={user?.id || ''} />
}