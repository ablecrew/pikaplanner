import AdminNotificationsClient from './AdminNotificationsClient'
import { fetchAdminNotificationsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminNotificationsPage() {
  const initialNotifications = await fetchAdminNotificationsData()

  return <AdminNotificationsClient initialNotifications={initialNotifications} />
}