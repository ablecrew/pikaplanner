'use client'

import { useState, useMemo, useEffect, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Eye, Download as DownloadIcon, DollarSign, RefreshCw,
  Clock, CheckCircle2, XCircle, AlertCircle, Filter, Copy,
  Printer, ChevronLeft, ChevronRight, CreditCard,
  Sparkles, UtensilsCrossed, ShoppingBag, Store,
  ArrowUpRight, ExternalLink, Calendar, Hash, Phone,
  Receipt, TrendingUp, X, ChevronDown,
} from 'lucide-react'
import {
  fetchUserTransactions,
  type TransactionsPayload,
  type TransactionRecord,
  type TransactionStatus,
  type TransactionType,
} from './actions'

// ── Constants ──────────────────────────────────────────

const STATUS_STYLES: Record<TransactionStatus, { bg: string; text: string; border: string; dot: string }> = {
  'Successful': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Processing': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Failed': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  'Cancelled': { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' },
}

const STATUS_FILTERS: (TransactionStatus | 'All')[] = [
  'All', 'Successful', 'Processing', 'Failed', 'Cancelled',
]

const TYPE_STYLES: Record<TransactionType, { bg: string; text: string; icon: any }> = {
  subscription: { bg: 'bg-violet-50', text: 'text-violet-600', icon: Sparkles },
  meal_order: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: UtensilsCrossed },
  shopping_cart: { bg: 'bg-sky-50', text: 'text-sky-600', icon: ShoppingBag },
  vendor_subscription: { bg: 'bg-amber-50', text: 'text-amber-600', icon: Store },
}

const TYPE_FILTERS: (TransactionType | 'All')[] = [
  'All', 'subscription', 'meal_order', 'shopping_cart',
]

const TYPE_FILTER_LABELS: Record<TransactionType | 'All', string> = {
  All: 'All',
  subscription: 'Subscriptions',
  meal_order: 'Orders',
  shopping_cart: 'Shopping',
  vendor_subscription: 'Vendor',
}

// ── Helpers ────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatFullDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return `${formatDateTime(iso)} at ${formatTime(iso)}`
}

function timeAgo(iso?: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ── Main Component ─────────────────────────────────────

export default function UserTransactionsClient({
  initialData,
}: {
  initialData: TransactionsPayload
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<TransactionsPayload>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [selected, setSelected] = useState<TransactionRecord | null>(null)
  const [, startTransition] = useTransition()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'All'>(
    (searchParams.get('status') as TransactionStatus) || 'All'
  )
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'All'>(
    (searchParams.get('type') as TransactionType) || 'All'
  )
  const [page, setPage] = useState(Number(searchParams.get('page') || 1))

  // Debounce search
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  // Fetch data
  const fetchData = useCallback(
    async (next: { search?: string; status?: TransactionStatus | 'All'; type?: TransactionType | 'All'; page?: number }) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        const newSearch = next.search ?? search
        const newStatus = next.status ?? statusFilter
        const newType = next.type ?? typeFilter
        const newPage = next.page ?? page

        if (newSearch) params.set('search', newSearch)
        if (newStatus !== 'All') params.set('status', newStatus)
        if (newType !== 'All') params.set('type', newType)
        if (newPage > 1) params.set('page', String(newPage))

        startTransition(() => { router.push(`?${params.toString()}`) })

        const nextData = await fetchUserTransactions({
          search: newSearch,
          status: newStatus,
          type: newType,
          page: newPage,
        })
        setData(nextData)
        setPage(nextData.page)
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    },
    [searchParams, router, search, statusFilter, typeFilter, page]
  )

  useEffect(() => {
    fetchData({ page: 1 })
  }, [search, statusFilter, typeFilter])

  const transactions = data.transactions

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setToast('✓ Copied to clipboard')
      setTimeout(() => setToast(null), 2500)
    })
  }, [])

  const exportCsv = useCallback(() => {
    const rows = [
      ['Transaction ID', 'Type', 'Description', 'Amount', 'Status', 'Payment Method', 'M-Pesa Receipt', 'Date'],
      ...transactions.map(t => [
        t.id,
        t.typeLabel,
        t.type === 'subscription' ? `${t.subscriptionTierLabel} Plan` :
          t.type === 'meal_order' ? `${t.vendorName ?? 'Order'} (${t.itemCount ?? 0} items)` :
            `Shopping Cart (${t.shoppingItemCount ?? 0} items)`,
        String(t.amount),
        t.status,
        t.method,
        t.mpesaReceipt || '',
        formatFullDateTime(t.initiatedAt),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [transactions])

  const getTransactionDescription = useCallback((t: TransactionRecord): string => {
    if (t.type === 'subscription' || t.type === 'vendor_subscription') {
      return `${t.subscriptionTierLabel ?? t.typeLabel} Plan${t.subscriptionDuration ? ` · ${t.subscriptionDuration}` : ''}`
    }
    if (t.type === 'meal_order') {
      const parts = [t.vendorName, t.itemCount ? `${t.itemCount} item${t.itemCount > 1 ? 's' : ''}` : null].filter(Boolean)
      return parts.length > 0 ? parts.join(' · ') : 'Meal Order'
    }
    if (t.type === 'shopping_cart') {
      return `Shopping Cart${t.shoppingItemCount ? ` · ${t.shoppingItemCount} items` : ''}`
    }
    return t.typeLabel
  }, [])

  // ── Render ──

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="font-poppins"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            Transaction History
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-700">
              <Receipt size={12} /> {data.total} records
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            All your payments, subscriptions and orders in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:shadow-lg transition disabled:opacity-50"
          >
            <DownloadIcon size={15} /> Export CSV
          </button>
          <button
            onClick={() => fetchData({})}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-50 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white shadow-2xl px-5 py-3 text-sm font-bold text-emerald-800"
          >
            <CheckCircle2 size={16} className="text-emerald-500" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Spent',
            value: formatCurrency(data.stats.totalSpent),
            helper: `${data.stats.successfulCount} successful`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
          },
          {
            label: 'Processing',
            value: String(data.stats.processingCount),
            helper: 'Awaiting confirmation',
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
          },
          {
            label: 'Failed',
            value: String(data.stats.failedCount),
            helper: 'Unsuccessful payments',
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
          },
          {
            label: 'Active Plans',
            value: String(data.stats.activeSubscriptions),
            helper: 'Current subscriptions',
            icon: Sparkles,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            border: 'border-violet-100',
          },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>
                <s.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">{s.helper}</p>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search + Filters */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by ID, receipt, merchant..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 text-gray-900 transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Status filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Status</span>
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    statusFilter === s
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="hidden sm:block w-px h-5 bg-gray-200" />

            {/* Type filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Type</span>
              {TYPE_FILTERS.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    typeFilter === t
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {TYPE_FILTER_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <CreditCard size={28} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-800 text-lg">No transactions found</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Your payment history for subscriptions, orders, and shopping will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
                  <th className="px-5 py-3 font-bold">Transaction</th>
                  <th className="px-5 py-3 font-bold">Details</th>
                  <th className="px-5 py-3 font-bold">Amount</th>
                  <th className="px-5 py-3 font-bold">Method</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => {
                  const style = STATUS_STYLES[txn.status]
                  const typeStyle = TYPE_STYLES[txn.type]
                  const TypeIcon = typeStyle.icon

                  return (
                    <tr
                      key={txn.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      onClick={() => setSelected(txn)}
                    >
                      {/* Transaction + Type */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${typeStyle.bg} ${typeStyle.text} flex items-center justify-center shrink-0`}>
                            <TypeIcon size={16} />
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold text-gray-900">{txn.id}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{txn.typeLabel}</p>
                          </div>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4 max-w-[220px]">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {getTransactionDescription(txn)}
                        </p>
                        {txn.mpesaReceipt && (
                          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                            Receipt: {txn.mpesaReceipt}
                          </p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-gray-900">{formatCurrency(txn.amount)}</p>
                      </td>

                      {/* Method */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600 uppercase">
                          <Phone size={10} /> {txn.method}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <p className="text-xs text-gray-600">{formatDateTime(txn.initiatedAt)}</p>
                        <p className="text-[10px] text-gray-400">{timeAgo(txn.initiatedAt)}</p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {txn.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(txn) }}
                          className="p-1.5 rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition opacity-0 group-hover:opacity-100"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">
              Page <span className="font-semibold text-gray-900">{data.page}</span> of{' '}
              <span className="font-semibold text-gray-900">{data.totalPages}</span>
              <span className="text-gray-400"> · {data.total} transactions</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData({ page: data.page - 1 })}
                disabled={data.page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => fetchData({ page: data.page + 1 })}
                disabled={data.page >= data.totalPages || loading}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Modal ────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[1.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {(() => {
                        const ts = TYPE_STYLES[selected.type]
                        const TIcon = ts.icon
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${ts.bg} ${ts.text}`}>
                            <TIcon size={10} /> {selected.typeLabel}
                          </span>
                        )
                      })()}
                    </div>
                    <h3 className="font-mono text-sm font-bold text-gray-900">{selected.id}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[selected.status].bg} ${STATUS_STYLES[selected.status].text} ${STATUS_STYLES[selected.status].border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selected.status].dot}`} />
                    {selected.status}
                  </span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Amount */}
                <div className="text-center py-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount Paid</p>
                  <p className="text-4xl font-black text-gray-900 mt-1">{formatCurrency(selected.amount)}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Type', value: selected.typeLabel },
                    { label: 'Payment Method', value: selected.method },
                    { label: 'Internal Ref', value: selected.internalReference, copy: true },
                    { label: 'External Ref', value: selected.externalReference || '—' },
                    { label: 'M-Pesa Receipt', value: selected.mpesaReceipt || '—', copy: !!selected.mpesaReceipt },
                    { label: 'Initiated', value: formatFullDateTime(selected.initiatedAt) },
                    ...(selected.completedAt ? [{ label: 'Completed', value: formatFullDateTime(selected.completedAt) }] : []),
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50/50 rounded-xl border border-gray-100 p-3">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.value}</p>
                      {'copy' in item && item.copy && item.value !== '—' && (
                        <button
                          onClick={() => copyToClipboard(item.value)}
                          className="text-[10px] text-emerald-600 font-bold mt-1 hover:underline"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Type-specific details */}
                {selected.type === 'subscription' && (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/30 p-4 space-y-2">
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Subscription Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">Plan</p>
                        <p className="text-xs font-bold text-gray-800">{selected.subscriptionTierLabel}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">Duration</p>
                        <p className="text-xs font-bold text-gray-800">{selected.subscriptionDuration}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">Auto-Renew</p>
                        <p className="text-xs font-bold text-gray-800">{selected.autoRenew ? '✅ Enabled' : '❌ Disabled'}</p>
                      </div>
                      {selected.subscriptionExpiresAt && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold">Expires</p>
                          <p className="text-xs font-bold text-gray-800">{formatFullDateTime(selected.subscriptionExpiresAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selected.type === 'meal_order' && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Order Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selected.vendorName && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold">Merchant</p>
                          <p className="text-xs font-bold text-gray-800">{selected.vendorName}</p>
                        </div>
                      )}
                      {selected.itemCount != null && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold">Items</p>
                          <p className="text-xs font-bold text-gray-800">{selected.itemCount} item{selected.itemCount !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                      {selected.deliveryStatus && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold">Delivery Status</p>
                          <p className="text-xs font-bold text-gray-800 capitalize">{selected.deliveryStatus}</p>
                        </div>
                      )}
                      {selected.deliveryAddress && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400 font-bold">Delivery Address</p>
                          <p className="text-xs font-bold text-gray-800">{selected.deliveryAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selected.type === 'shopping_cart' && (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/30 p-4 space-y-2">
                    <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Shopping Cart</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selected.shoppingListName && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold">List Name</p>
                          <p className="text-xs font-bold text-gray-800">{selected.shoppingListName}</p>
                        </div>
                      )}
                      {selected.shoppingItemCount != null && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold">Items</p>
                          <p className="text-xs font-bold text-gray-800">{selected.shoppingItemCount}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Message */}
                {selected.statusMessage && (
                  <div className={`rounded-xl p-3 text-xs leading-relaxed ${
                    selected.status === 'Failed' ? 'bg-red-50 border border-red-100 text-red-700' :
                    selected.status === 'Cancelled' ? 'bg-gray-50 border border-gray-200 text-gray-500' :
                    'bg-amber-50 border border-amber-100 text-amber-700'
                  }`}>
                    <span className="font-bold">Status:</span> {selected.statusMessage}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => copyToClipboard(selected.id)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-100 hover:shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} /> Copy Ref
                </button>
                <button
                  onClick={() => {
                    if (selected.mpesaReceipt) copyToClipboard(selected.mpesaReceipt)
                    else copyToClipboard(selected.internalReference)
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
                >
                  <Hash size={14} /> Copy Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}