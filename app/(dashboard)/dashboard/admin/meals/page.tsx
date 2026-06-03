import AdminMealsClient from './AdminMealsClient'
import { fetchAdminMealsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminMealsPage() {
  const initialData = await fetchAdminMealsData()

  return <AdminMealsClient initialMeals={initialData.meals} initialVendors={initialData.vendors} />
}