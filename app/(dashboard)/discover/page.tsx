import DiscoverClient from './DiscoverClient'
import { fetchDiscoverData } from './actions'

export const dynamic = 'force-dynamic'

export default async function DiscoverPage() {
  const initialData = await fetchDiscoverData()

  return <DiscoverClient initialMeals={initialData.meals} initialProfile={initialData.profile} />
}