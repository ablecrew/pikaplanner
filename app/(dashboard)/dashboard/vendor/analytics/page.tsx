import VendorAnalyticsClient from './VendorAnalyticsClient'
import { createClient } from '@/lib/supabase/server'
import { fetchVendorAnalyticsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function VendorAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialData = user ? await fetchVendorAnalyticsData(user.id, '30d') : null

  return <VendorAnalyticsClient initialData={initialData} userId={user?.id || ''} />
}