import PaymentStatus from '../PaymentStatus'

export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: Promise<{
    transactionId?: string
    subscriptionId?: string
    tier?: string
    amount?: string
  }>
}) {
  const params = await searchParams
  
  const transactionId = params.transactionId
  const subscriptionId = params.subscriptionId
  const tier = params.tier || 'weekly'
  const amount = params.amount ? Number(params.amount) : 0

  if (!transactionId) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-gray-500">No transaction found. Please start a new payment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
      <PaymentStatus
        reference={transactionId}
        subscriptionId={subscriptionId}
        tier={tier}
        amount={amount}
      />
    </div>
  )
}