import UserMealsClient from './UserMealsClient'
import { fetchBrowseMeals } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserMealsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    category?: string
    cuisine?: string
    page?: string
  }>
}) {
  const params = await searchParams

  const data = await fetchBrowseMeals({
    search: params?.search,
    category: params?.category,
    cuisine: params?.cuisine,
    page: Number(params?.page) || 1,
  })

  return <UserMealsClient initialData={data} />
}