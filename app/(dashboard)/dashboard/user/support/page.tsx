import UserSupportClient from './UserSupportClient'
import { fetchUserSupport } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserSupportPage() {
  const initial = await fetchUserSupport()
  return <UserSupportClient initialData={initial} />
}