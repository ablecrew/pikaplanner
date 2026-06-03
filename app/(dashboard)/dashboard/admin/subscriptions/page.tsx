import AdminSubscriptionsClient from './AdminSubscriptionsClient'
import { fetchAdminSubscriptionsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminSubscriptionsPage() {
  const initialData = await fetchAdminSubscriptionsData()

  return <AdminSubscriptionsClient initialData={initialData} />
}