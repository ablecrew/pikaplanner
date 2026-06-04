import MealGeneratorClient from './MealGeneratorClient'
import { fetchMealGeneratorData } from './actions'

export const dynamic = 'force-dynamic'

export default async function MealGeneratorPage() {
  const initialData = await fetchMealGeneratorData()

  return <MealGeneratorClient initialData={initialData} />
}