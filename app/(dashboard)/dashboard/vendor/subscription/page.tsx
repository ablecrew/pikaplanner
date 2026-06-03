import VendorSubscriptionClient from './VendorSubscriptionClient'
import { createClient } from '@/lib/supabase/server'
import { fetchVendorSubscriptionData } from './actions'

export const dynamic = 'force-dynamic'

export default async function VendorSubscriptionPage() {
  const supabase = await createClient() 
  const { data: { user } } = await supabase.auth.getUser()

  const initialData = user ? await fetchVendorSubscriptionData(user.id) : null

  return <VendorSubscriptionClient initialData={initialData} userId={user?.id || ''} />
}