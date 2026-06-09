import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchRecipesPageData } from './actions'
import RecipesClient from './RecipesClient'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const initialData = await fetchRecipesPageData()

  return <RecipesClient initialData={initialData} />
}