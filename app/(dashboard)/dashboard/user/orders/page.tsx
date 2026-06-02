import UserOrdersClient from './UserOrdersClient'
import { fetchUserOrders } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Number(searchParams?.page) || 1
  const initial = await fetchUserOrders(page)

  return <UserOrdersClient initialData={initial} />
}