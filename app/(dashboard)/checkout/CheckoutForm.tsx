'use client'

import { useState, useTransition } from 'react'
import {
  Smartphone, Loader2, AlertCircle, CheckCircle2, Lock, Shield, Sparkles,
} from 'lucide-react'
import { initiatePaymentAction } from './actions'
import PaymentStatus from './PaymentStatus'
import { formatKES, normalizeKenyanPhone } from '@/lib/payhero/utils'
import type { PaymentPurpose } from '@/lib/payhero/types'

type Props = {
  amount: number
  purpose: PaymentPurpose
  relatedId?: string
  defaultPhone?: string
  description?: string
  onSuccess?: () => void
}

export default function CheckoutForm({
  amount, purpose, relatedId, defaultPhone = '', description, onSuccess,
}: Props) {
  const [phone, setPhone] = useState(defaultPhone)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [activeRef, setActiveRef] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGlobalError(null)

    startTransition(async () => {
      const result = await initiatePaymentAction({
        amount,
        phone,
        purpose,
        relatedId,
      })

      if (!result.success) {
        if (result.field) setErrors({ [result.field]: result.error })
        else setGlobalError(result.error)
        return
      }

      setActiveRef(result.reference)
      setStatusMessage(result.message)
    })
  }

  const formattedPhone = phone ? normalizeKenyanPhone(phone) : null

  // Show status polling UI once payment is initiated
  if (activeRef) {
    return (
      <PaymentStatus
        reference={activeRef}
        amount={amount}
        statusMessage={statusMessage}
        onSuccess={onSuccess}
        onRetry={() => setActiveRef(null)}
      />
    )
  }

  // Initial payment form
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Smartphone size={18} className="text-[#32CD32]" />
          </div>
          <div>
            <h2 className="font-black text-lg">M-Pesa Checkout</h2>
            <p className="text-xs text-white/70">Pay securely via M-Pesa STK Push</p>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="px-6 py-5 bg-emerald-50 border-b border-emerald-100 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-[#126e3d] mb-1">
          Amount to pay
        </p>
        <p className="text-4xl font-black text-slate-900">{formatKES(amount)}</p>
        {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-1.5">
            M-Pesa Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
              +254
            </span>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s]/g, ''))}
              placeholder="712 345 678"
              required
              disabled={isPending}
              className={`w-full rounded-xl border-2 bg-white pl-14 pr-4 py-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:border-[#32CD32] focus:ring-2 focus:ring-[#32CD32]/20 disabled:opacity-60 ${
                errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.phone ? (
            <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle size={11} /> {errors.phone}
            </p>
          ) : formattedPhone ? (
            <p className="mt-1.5 text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 size={11} /> {formattedPhone}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">
              Enter your Safaricom or Airtel number
            </p>
          )}
        </div>

        {globalError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-800">{globalError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !phone}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] py-4 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending STK Push…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Pay {formatKES(amount)} via M-Pesa
            </>
          )}
        </button>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 pt-2 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-1">
            <Lock size={10} /> Secured by Payhero
          </div>
          <div className="flex items-center gap-1">
            <Shield size={10} /> Encrypted
          </div>
        </div>
      </form>
    </div>
  )
}