import AdminUsersClient from './AdminUsersClient'
import { fetchAdminUsersData } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const initialUsers = await fetchAdminUsersData()

  return <AdminUsersClient initialUsers={initialUsers} />
}