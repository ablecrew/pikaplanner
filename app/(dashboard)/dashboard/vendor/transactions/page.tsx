import VendorTransactionsClient from './VendorTransactionsClient'
import { createClient } from '@/lib/supabase/server'
import { fetchVendorTransactionsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function VendorTransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialData = user ? await fetchVendorTransactionsData(user.id) : null

  return <VendorTransactionsClient initialData={initialData} userId={user?.id || ''} />
}