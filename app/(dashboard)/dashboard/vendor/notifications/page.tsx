import VendorNotificationsClient from './VendorNotificationsClient'
import { createClient } from '@/lib/supabase/server'
import { fetchVendorNotificationsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function VendorNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialData = user ? await fetchVendorNotificationsData(user.id) : null

  return <VendorNotificationsClient initialData={initialData} userId={user?.id || ''} />
}