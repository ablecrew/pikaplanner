import UserOverviewClient from './UserOverviewClient'
import { fetchUserOverview } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserOverviewPage() {
  const data = await fetchUserOverview()
  return <UserOverviewClient initialData={data} />
}