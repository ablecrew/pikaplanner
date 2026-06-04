import MealPlansClient from './MealPlansClient'
import { fetchMealPlanData } from './actions'

export const dynamic = 'force-dynamic'

export default async function MealPlansPage() {
  const initialData = await fetchMealPlanData()

  return <MealPlansClient initialData={initialData} />
}