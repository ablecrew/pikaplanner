'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Repeat, ShieldCheck, AlertTriangle, Loader2, X, Smartphone,
  CheckCircle2, Info, Pause, Play, History, Calendar, Power,
} from 'lucide-react'
import {
  toggleAutoRenewAction, cancelSubscriptionAction,
  type Subscription, type RenewalHistoryItem,
} from './actions'

const formatMoney = (v: number) => `KES ${v.toLocaleString('en-KE')}`
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

//  Helper type + function — TypeScript-proof
type ToastMessage = { type: 'success' | 'error'; text: string }

type Props = {
  subscription: Subscription
  renewalHistory: RenewalHistoryItem[]
  defaultPhone?: string
  onUpdate: () => void
}

export default function ManageSubscription({
  subscription, renewalHistory, defaultPhone = '', onUpdate,
}: Props) {
  const [showEnableModal, setShowEnableModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [phone, setPhone] = useState(subscription.auto_renew_phone ?? defaultPhone)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<ToastMessage | null>(null)
  const [isPending, startTransition] = useTransition()

  // Helper — always returns a string, never undefined
  const showMessage = (
    type: 'success' | 'error',
    text: string | undefined | null,
    fallback: string = 'Done.'
  ) => {
    setMessage({ type, text: text || fallback })
  }

  const isAutoRenew = subscription.billing_type === 'auto-renew' && subscription.auto_renew
  const isCancelled = !!subscription.cancelled_at

  const handleEnable = () => {
    if (!phone.trim()) {
      showMessage('error', 'Phone number is required.')
      return
    }
    startTransition(async () => {
      const r = await toggleAutoRenewAction(subscription.id, true, phone)
      if (r.success) {
        showMessage('success', r.message, 'Auto-renewal enabled.')
        setShowEnableModal(false)
        onUpdate()
      } else {
        showMessage('error', r.error)
      }
    })
  }

  const handleDisable = () => {
    startTransition(async () => {
      const r = await toggleAutoRenewAction(subscription.id, false)
      if (r.success) {
        showMessage('success', r.message, 'Auto-renewal disabled.')
        onUpdate()
      } else {
        showMessage('error', r.error)
      }
    })
  }

  const handleCancel = () => {
    startTransition(async () => {
      const r = await cancelSubscriptionAction(subscription.id, reason)
      if (r.success) {
        showMessage('success', r.message, 'Subscription cancelled.')
        setShowCancelModal(false)
        onUpdate()
      } else {
        showMessage('error', r.error)
      }
    })
  }

  // ─────────────────────────────────────────────
  // REST OF THE COMPONENT IS UNCHANGED
  // ─────────────────────────────────────────────

  return (
    <div className="mb-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <ShieldCheck size={20} className="text-emerald-600" />
            Billing & Renewals
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage how your subscription renews
          </p>
        </div>

        {isAutoRenew && !isCancelled && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <Repeat size={11} /> Auto-Renew Active
          </span>
        )}
        {isCancelled && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
            <Power size={11} /> Cancelled
          </span>
        )}
        {!isAutoRenew && !isCancelled && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
            <Calendar size={11} /> One-Time Plan
          </span>
        )}
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`mb-5 flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success'
              ? <CheckCircle2 size={14} className="mt-0.5" />
              : <AlertTriangle size={14} className="mt-0.5" />}
            <p className="flex-1">{message.text}</p>
            <button onClick={() => setMessage(null)} className="text-current/60 hover:text-current">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`rounded-2xl border-2 p-5 mb-5 ${
        isAutoRenew
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white'
          : 'border-slate-200 bg-slate-50/30'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
            isAutoRenew ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {isAutoRenew ? <Repeat size={20} /> : <Pause size={20} />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-950">
              {isAutoRenew ? 'Auto-Renewal is ON' : isCancelled ? 'Auto-Renewal Cancelled' : 'Auto-Renewal is OFF'}
            </h3>

            {isAutoRenew && subscription.next_renewal_at && (
              <>
                <p className="text-sm text-slate-600 mt-1">
                  We'll send an M-Pesa prompt to{' '}
                  <strong className="text-slate-900">{subscription.auto_renew_phone}</strong>
                  {' '}on{' '}
                  <strong className="text-emerald-700">{formatDate(subscription.next_renewal_at)}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <Info size={11} /> You'll need to confirm the M-Pesa PIN to complete the renewal.
                </p>
              </>
            )}

            {!isAutoRenew && !isCancelled && (
              <p className="text-sm text-slate-600 mt-1">
                Your plan will expire on <strong>{formatDate(subscription.expires_at!)}</strong>.
                You'll need to subscribe again manually.
              </p>
            )}

            {isCancelled && (
              <p className="text-sm text-slate-600 mt-1">
                Your plan remains active until <strong>{formatDate(subscription.expires_at!)}</strong>.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {!isAutoRenew && !isCancelled && (
                <button
                  onClick={() => setShowEnableModal(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-black uppercase text-white transition disabled:opacity-50"
                >
                  <Repeat size={12} /> Enable Auto-Renewal
                </button>
              )}

              {isAutoRenew && (
                <button
                  onClick={handleDisable}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-300 px-4 py-2 text-xs font-black uppercase text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <Pause size={12} />}
                  Turn Off Auto-Renewal
                </button>
              )}

              {!isCancelled && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 px-4 py-2 transition"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {renewalHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-100 p-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 mb-3">
            <History size={14} /> Renewal History
          </h3>
          <div className="space-y-2">
            {renewalHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    item.status === 'success'
                      ? 'bg-emerald-500'
                      : item.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.status === 'success' && 'Renewed successfully'}
                      {item.status === 'failed' && (item.failure_reason ?? 'Renewal failed')}
                      {item.status === 'pending' && 'Awaiting confirmation'}
                      {item.status === 'user_cancelled' && 'User cancelled renewal'}
                    </p>
                    <p className="text-[10px] text-slate-500">{formatDate(item.attempted_at)}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {item.amount && <p className="text-xs font-black text-slate-700">{formatMoney(item.amount)}</p>}
                  {item.mpesa_receipt && <p className="text-[10px] font-mono text-emerald-600">{item.mpesa_receipt}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ENABLE AUTO-RENEW MODAL ─────────────────── */}
      <AnimatePresence>
        {showEnableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEnableModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowEnableModal(false)}
                className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

              <div className="mb-5">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Repeat size={28} />
                </div>
                <h3 className="text-center text-xl font-black text-slate-950">Enable Auto-Renewal</h3>
                <p className="mt-1 text-center text-sm text-slate-500 max-w-sm mx-auto">
                  We'll send an M-Pesa prompt 1 day before your plan expires.
                  You can cancel any time.
                </p>
              </div>

              <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-800">Never accidentally lose access</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-800">You always confirm with your M-Pesa PIN</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-800">Cancel any time, no fees</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  M-Pesa number to charge
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <button
                onClick={handleEnable}
                disabled={isPending || !phone.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Repeat size={16} />}
                {isPending ? 'Saving...' : 'Enable Auto-Renewal'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CANCEL MODAL ───────────────────────────── */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCancelModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowCancelModal(false)}
                className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

              <div className="mb-5">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-center text-xl font-black text-slate-950">Cancel subscription?</h3>
                <p className="mt-1 text-center text-sm text-slate-500">
                  Your plan stays active until {formatDate(subscription.expires_at!)}.
                  After that, you'll need to subscribe manually.
                </p>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Mind sharing why? (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Too expensive, not using it enough, found alternative..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-y"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-2xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 hover:bg-red-700 py-3 text-sm font-bold text-white transition disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}