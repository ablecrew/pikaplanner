import VendorOrdersClient from './VendorOrdersClient'
import { createClient } from '@/lib/supabase/server'
import { fetchVendorOrdersData } from './actions'

export const dynamic = 'force-dynamic'

export default async function VendorOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialData = user ? await fetchVendorOrdersData(user.id) : null

  return <VendorOrdersClient initialData={initialData} userId={user?.id || ''} />
}