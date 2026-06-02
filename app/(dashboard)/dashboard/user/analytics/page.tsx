import UserAnalyticsClient from './UserAnalyticsClient'
import { fetchUserAnalytics } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const range = (params?.range as '7d' | '30d' | '180d' | '365d') || '180d'
  const initial = await fetchUserAnalytics(range, 0)
  return <UserAnalyticsClient initialData={initial} />
}