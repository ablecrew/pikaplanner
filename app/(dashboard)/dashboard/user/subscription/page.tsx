import UserSubscriptionClient from './UserSubscriptionClient'
import { createClient } from '@/lib/supabase/server'
import { fetchSubscriptionData } from './actions'

export const dynamic = 'force-dynamic'

export default async function UserSubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialProfile = null
  let initialSubscription = null
  let initialRenewals: any[] = []

  if (user) {
    const data = await fetchSubscriptionData(user.id)
    initialProfile = data.profile
    initialSubscription = data.subscription
    initialRenewals = data.renewalHistory
  }

  return (
    <UserSubscriptionClient
      initialProfile={initialProfile}
      initialSubscription={initialSubscription}
      initialRenewals={initialRenewals}
      userId={user?.id || ''}
    />
  )
}