import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchMealPlanData } from './actions'
import MealPlansClient from './MealPlansClient'

export const dynamic = 'force-dynamic'

export default async function MealPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  //  fetchMealPlanData returns everything we need:
  //    { plan, preferences, subscription }
  // Subscription gating + rate limiting is handled inside MealPlansClient
  const initialData = await fetchMealPlanData()

  return <MealPlansClient initialData={initialData} />
}