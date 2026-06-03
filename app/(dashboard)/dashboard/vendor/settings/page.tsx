import VendorSettingsClient from './VendorSettingsClient'
import { createClient } from '@/lib/supabase/server'
import { fetchVendorSettingsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function VendorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initialData = user ? await fetchVendorSettingsData(user.id) : null

  return <VendorSettingsClient initialData={initialData} userId={user?.id || ''} userEmail={user?.email || ''} />
}