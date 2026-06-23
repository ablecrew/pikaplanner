import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import CheckoutForm from './CheckoutForm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    amount?: string
    tier?: string
    durationDays?: string
    purpose?: string
    related_id?: string
  }>
}) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .maybeSingle()

  // ✅ Support both old (purpose-based) and new (tier-based) flows
  const amount = Number(params.amount ?? 0)
  const tier = params.tier ?? 'weekly'
  const durationDays = params.durationDays 
    ? Number(params.durationDays) 
    : tier === 'daily' ? 1 : tier === 'weekly' ? 7 : tier === 'monthly' ? 30 : 365
  const purpose = (params.purpose ?? 'subscription') as any
  const relatedId = params.related_id

  if (!amount || amount < 10) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-6 font-poppins">
          <div className="text-center">
            <p className="text-slate-600">Invalid checkout request.</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ✅ Map tier to description
  const tierDescriptions: Record<string, string> = {
    daily: 'Daily meal plan subscription',
    weekly: 'Weekly meal plan subscription',
    monthly: 'Monthly meal plan subscription',
    yearly: 'Yearly meal plan subscription',
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8faf8] font-poppins py-10">
        <CheckoutForm
          amount={amount}
          tier={tier}
          durationDays={durationDays}
          defaultPhone={profile?.phone ?? ''}
          description={tierDescriptions[tier] || 'Pay securely with M-Pesa'}
        />
      </main>
      <Footer />
    </>
  )
}