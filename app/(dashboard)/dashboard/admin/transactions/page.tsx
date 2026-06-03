import AdminTransactionsClient from './AdminTransactionsClient'
import { fetchAdminTransactionsData } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminTransactionsPage() {
  const initialTransactions = await fetchAdminTransactionsData()

  return <AdminTransactionsClient initialTransactions={initialTransactions} />
}