'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, X, ArrowRight } from 'lucide-react'

type Props = {
  show: boolean
  daysRemaining?: number
  isExpired?: boolean
}

export default function SubscriptionBanner({ show, daysRemaining = 0, isExpired = false }: Props) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't re-show within 24h if dismissed
    const lastDismissed = localStorage.getItem('sub_banner_dismissed')
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('sub_banner_dismissed', String(Date.now()))
  }

  if (!show || dismissed) return null

  return (
    <div className="bg-gradient-to-r from-[#F4A535] to-[#f97316] text-white py-2.5 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm">
        <Crown size={14} />
        <p className="font-bold">
          {isExpired
            ? 'Your subscription has expired.'
            : daysRemaining <= 3 && daysRemaining > 0
              ? `Your plan expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`
              : 'Unlock AI meal plans with a subscription.'}
        </p>
        <Link
          href="/dashboard/user/subscription"
          className="inline-flex items-center gap-1 text-xs font-black uppercase bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
        >
          Upgrade <ArrowRight size={11} />
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}