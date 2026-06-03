import AdminVendorsClient from './AdminVendorsClient'
import { fetchAdminVendorsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminVendorsPage() {
  const initialVendors = await fetchAdminVendorsData()

  return <AdminVendorsClient initialVendors={initialVendors} />
}