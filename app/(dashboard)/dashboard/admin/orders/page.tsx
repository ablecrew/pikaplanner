import AdminOrdersClient from './AdminOrdersClient'
import { fetchAdminOrdersData } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const initialOrders = await fetchAdminOrdersData()

  return <AdminOrdersClient initialOrders={initialOrders} />
}