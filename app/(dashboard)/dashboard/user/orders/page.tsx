import UserOrdersClient from './UserOrdersClient'
import { fetchUserOrders } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const initial = await fetchUserOrders(page)
  return <UserOrdersClient initialData={initial} />
}