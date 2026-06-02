import UserVendorsClient from './UserVendorsClient'
import { fetchUserVendors } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    category?: string
    page?: string
    sort?: string
  }>
}) {
  const params = await searchParams
  const initial = await fetchUserVendors({
    search: params?.search,
    category: params?.category,
    page: Number(params?.page) || 1,
    sort: (params?.sort as any) || 'newest',
  })
  return <UserVendorsClient initialData={initial} />
}