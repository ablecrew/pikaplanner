import VendorMealsClient from './VendorMealsClient'
import { createClient } from '@/lib/supabase/server'
import { fetchVendorMealsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function VendorMealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialData = user ? await fetchVendorMealsData(user.id) : null

  return <VendorMealsClient initialData={initialData} userId={user?.id || ''} />
}