import ShoppingClient from './ShoppingClient'
import { fetchShoppingPageData } from './actions'

export const dynamic = 'force-dynamic'

export default async function ShoppingPage() {
  const initialData = await fetchShoppingPageData()

  return <ShoppingClient initialData={initialData} />
}