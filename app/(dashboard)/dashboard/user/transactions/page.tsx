import UserTransactionsClient from './UserTransactionsClient'
import { fetchUserTransactions } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    type?: string
    page?: string
  }>
}) {
  const params = await searchParams

  const initial = await fetchUserTransactions({
    search: params?.search,
    status: params?.status as any,
    type: params?.type as any,
    page: Number(params?.page) || 1,
  })

  return <UserTransactionsClient initialData={initial} />
}