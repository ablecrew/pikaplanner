'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import {
  Smartphone, CheckCircle2, XCircle, Loader2, Clock, RefreshCw,
  AlertCircle, Sparkles, ArrowRight, Copy, Check,
} from 'lucide-react'
import { fetchTransactionAction, syncTransactionStatusAction, type Transaction } from './actions'
import { formatKES, maskPhone } from '@/lib/payhero/utils'
import Link from 'next/link'

type Props = {
  reference: string
  amount: number
  statusMessage?: string | null
  onSuccess?: () => void
  onRetry?: () => void
}

export default function PaymentStatus({
  reference, amount, statusMessage, onSuccess, onRetry,
}: Props) {
  const [txn, setTxn] = useState<Transaction | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Elapsed time counter
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Poll for status every 3 seconds
  useEffect(() => {
    const poll = async () => {
      const fresh = await fetchTransactionAction(reference)
      if (fresh) setTxn(fresh)

      // Stop polling on terminal states
      if (fresh && ['success', 'failed', 'cancelled', 'expired'].includes(fresh.status)) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (timerRef.current) clearInterval(timerRef.current)
        if (fresh.status === 'success' && onSuccess) onSuccess()
      }
    }

    // Initial fetch
    poll()
    intervalRef.current = setInterval(poll, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [reference, onSuccess])

  // Manual status sync (calls Payhero directly)
  const handleSync = () => {
    startTransition(async () => {
      const fresh = await syncTransactionStatusAction(reference)
      if (fresh) setTxn(fresh)
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const status = txn?.status ?? 'pending'

  // ── Status configurations ────────────────────────
  const STATUS_CONFIG = {
    pending: {
      icon: Smartphone,
      color: '#1A5C3A',
      bg: 'bg-emerald-50',
      title: 'Sending payment request…',
      subtitle: 'Please wait while we connect to M-Pesa.',
    },
    processing: {
      icon: Smartphone,
      color: '#F4A535',
      bg: 'bg-amber-50',
      title: 'Check your phone',
      subtitle: 'Enter your M-Pesa PIN to complete the payment.',
    },
    success: {
      icon: CheckCircle2,
      color: '#16a34a',
      bg: 'bg-emerald-50',
      title: 'Payment successful! 🎉',
      subtitle: 'Your transaction was completed.',
    },
    failed: {
      icon: XCircle,
      color: '#dc2626',
      bg: 'bg-red-50',
      title: 'Payment failed',
      subtitle: txn?.status_message ?? 'Something went wrong. Please try again.',
    },
    cancelled: {
      icon: XCircle,
      color: '#64748b',
      bg: 'bg-slate-50',
      title: 'Payment cancelled',
      subtitle: 'You cancelled the M-Pesa prompt.',
    },
    expired: {
      icon: Clock,
      color: '#dc2626',
      bg: 'bg-red-50',
      title: 'Payment expired',
      subtitle: 'The M-Pesa prompt timed out.',
    },
  }

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = config.icon
  const isTerminal = ['success', 'failed', 'cancelled', 'expired'].includes(status)
  const isProcessing = ['pending', 'processing'].includes(status)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-w-md mx-auto">
      {/* Hero */}
      <div className={`${config.bg} px-6 py-10 text-center border-b border-gray-100`}>
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md"
          style={{ color: config.color }}
        >
          {isProcessing ? (
            <div className="relative">
              <Icon size={32} />
              <div className="absolute inset-0 -m-2 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
            </div>
          ) : (
            <Icon size={36} />
          )}
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-1">{config.title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
          {config.subtitle}
        </p>

        {isProcessing && (
          <p className="mt-4 text-xs font-bold text-slate-500">
            Waiting… {elapsed}s
          </p>
        )}
      </div>

      {/* Details */}
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</span>
          <span className="text-lg font-black text-slate-900">{formatKES(amount)}</span>
        </div>

        {txn?.phone && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</span>
            <span className="text-sm font-bold text-slate-900">{maskPhone(txn.phone)}</span>
          </div>
        )}

        {txn?.mpesa_receipt && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">M-Pesa Receipt</span>
            <span className="text-sm font-mono font-bold text-[#126e3d]">{txn.mpesa_receipt}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</span>
          <button
            onClick={handleCopy}
            className="text-xs font-mono font-bold text-slate-700 hover:text-[#126e3d] inline-flex items-center gap-1.5"
          >
            {reference}
            {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
          </button>
        </div>

        {/* Pending tip */}
        {isProcessing && elapsed > 30 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 mt-3">
            <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-900">Still waiting?</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Make sure you have network coverage and check your phone for the M-Pesa prompt.
              </p>
              <button
                onClick={handleSync}
                className="mt-2 text-xs font-black uppercase text-amber-700 inline-flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={10} /> Refresh status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-slate-50 border-t border-gray-100">
        {status === 'success' && (
          <Link
            href="/dashboard/user/overview"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] py-3 text-sm font-black uppercase text-white shadow-md transition hover:shadow-lg"
          >
            <Sparkles size={14} /> Continue
            <ArrowRight size={14} />
          </Link>
        )}

        {(status === 'failed' || status === 'cancelled' || status === 'expired') && (
          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-xs font-black uppercase text-slate-700 hover:border-slate-300 transition"
            >
              Try Again
            </button>
            <Link
              href="/dashboard/user/overview"
              className="flex-1 text-center rounded-xl bg-slate-700 py-3 text-xs font-black uppercase text-white hover:bg-slate-800 transition"
            >
              Cancel
            </Link>
          </div>
        )}

        {isProcessing && (
          <p className="text-center text-[10px] text-slate-400">
            We'll automatically update when your payment confirms.
          </p>
        )}
      </div>
    </div>
  )
}