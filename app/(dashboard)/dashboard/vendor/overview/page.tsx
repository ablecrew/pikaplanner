import VendorOverviewClient from './VendorOverviewClient'
import { createClient } from '@/lib/supabase/server'
import { fetchVendorDashboardData } from './actions'

export const dynamic = 'force-dynamic'

export default async function VendorOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialData = user ? await fetchVendorDashboardData(user.id) : null

  return <VendorOverviewClient initialData={initialData} userId={user?.id || ''} />
}