import AdminOverviewClient from './AdminOverviewClient'
import { fetchAdminDashboardData } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  // Fetch default 30-day data on the server
  const initialData = await fetchAdminDashboardData('30d')

  return <AdminOverviewClient initialData={initialData} />
}