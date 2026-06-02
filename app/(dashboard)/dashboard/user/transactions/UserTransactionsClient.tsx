'use client'

import { useState, useMemo, useEffect, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Eye, Download as DownloadIcon, DollarSign, RefreshCw,
  Clock, CheckCircle2, XCircle, AlertCircle, Filter, Copy,
  Printer, ChevronLeft, ChevronRight, CreditCard, ArrowRight,
} from 'lucide-react'
import {
  fetchUserTransactions,
  type TransactionsPayload,
  type TransactionRecord,
  type TransactionStatus,
} from './actions'

const STATUS_STYLES: Record<TransactionStatus, { bg: string; text: string; border: string; dot: string }> = {
  'Successful': { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  dot: 'bg-emerald-500' },
  'Pending':    { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    dot: 'bg-amber-500' },
  'Failed':     { bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200',      dot: 'bg-red-500' },
  'Refunded':   { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200',   dot: 'bg-violet-500' },
}

const FILTER_STATUSES: (TransactionStatus | 'All')[] = [
  'All', 'Successful', 'Pending', 'Failed', 'Refunded',
]

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

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
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [selected, setSelected] = useState<TransactionRecord | null>(null)
  const [, startTransition] = useTransition()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'All'>(
    (searchParams.get('status') as TransactionStatus) || 'All',
  )
  const [page, setPage] = useState(Number(searchParams.get('page') || 1))

  // Debounce search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const fetchData = useCallback(
    async (next: {
      search?: string
      status?: TransactionStatus | 'All'
      page?: number
    }) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams(searchParams.toString())
        const newSearch = next.search ?? search
        const newStatus = next.status ?? statusFilter
        const newPage = next.page ?? page

        if (newSearch) params.set('search', newSearch)
        else params.delete('search')

        if (newStatus && newStatus !== 'All') params.set('status', newStatus)
        else params.delete('status')

        if (newPage > 1) params.set('page', String(newPage))
        else params.delete('page')

        startTransition(() => {
          router.push(`?${params.toString()}`)
        })

        const nextData = await fetchUserTransactions({
          search: newSearch,
          status: newStatus,
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
    [searchParams, router, search, statusFilter, page],
  )

  // Push search/status changes to the server
  useEffect(() => {
    fetchData({ page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter])

  const transactions = data.transactions

  const statusCounts = useMemo(() => {
    const counts: Record<TransactionStatus | 'All', number> = {
      All: data.total,
      Successful: 0,
      Pending: 0,
      Failed: 0,
      Refunded: 0,
    }
    data.transactions.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1
    })
    return counts
  }, [data.transactions, data.total])

  const copyToClipboard = useCallback((text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setInfoMessage('✓ Transaction ID copied to clipboard')
        window.setTimeout(() => setInfoMessage(null), 3000)
      })
    }
  }, [])

  const printReceipt = useCallback((txn: TransactionRecord) => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html>
        <head>
          <title>Receipt - Transaction #${txn.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 25px; max-width: 320px; margin: 0 auto; color: #000; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 12px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .meta { font-size: 11px; margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <h2 class="center">🍴 PIKAPLAN INVOICE</h2>
          <p class="center meta">Transaction ID: ${txn.id}</p>
          <p class="center meta">Order #: ${txn.orderNumber}</p>
          <p class="center meta">${formatDateTime(txn.date)}</p>
          <div class="divider"></div>
          <div class="meta bold">Merchant:</div>
          <div class="meta">${txn.vendorName}</div>
          <div class="divider"></div>
          <div class="flex-between meta"><span>Subtotal</span><span>${formatCurrency(txn.subtotal)}</span></div>
          <div class="flex-between meta"><span>Platform Fee</span><span>${formatCurrency(txn.platformFee)}</span></div>
          <div class="flex-between meta"><span>Delivery Fee</span><span>${formatCurrency(txn.deliveryFee)}</span></div>
          <div class="divider"></div>
          <div class="flex-between bold" style="margin-top: 8px; font-size: 14px;">
            <span>TOTAL</span>
            <span>${formatCurrency(txn.amount)}</span>
          </div>
          <div class="divider"></div>
          <div class="meta bold">Payment Details:</div>
          <div class="meta">Status: ${txn.status.toUpperCase()}</div>
          <div class="meta">Method: ${txn.method}</div>
          ${txn.mpesaCode ? `<div class="meta">Ref: ${txn.mpesaCode}</div>` : ''}
          <div class="divider"></div>
          <p class="center bold" style="font-size: 12px; margin-top: 20px;">Thank you for your payment!</p>
        </body>
      </html>
    `)
    w.document.close()
    w.print()
  }, [])

  const exportCsv = useCallback(() => {
    const rows = [
      ['Transaction ID', 'Order #', 'Merchant', 'Amount', 'Subtotal', 'Delivery Fee', 'Platform Fee', 'Method', 'M-Pesa Code', 'Status', 'Date'],
      ...transactions.map((t) => [
        t.id, t.orderNumber, t.vendorName, t.amount, t.subtotal, t.deliveryFee, t.platformFee, t.method, t.mpesaCode || '', t.status, formatDateTime(t.date),
      ]),
    ]
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-transactions.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [transactions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="font-poppins"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            My Transactions
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-700">
              <CreditCard size={12} /> {data.total} total
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review complete details of your payments and payouts.
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
            Refresh
          </button>
        </div>
      </div>

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
        {infoMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white shadow-xl px-5 py-4 text-sm font-bold text-emerald-800"
          >
            <CheckCircle2 size={18} className="text-emerald-500" /> {infoMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Spent', value: formatCurrency(data.stats.spent), helper: `${data.stats.successfulCount} successful`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Pending Payment', value: formatCurrency(data.stats.pending), helper: `${data.stats.pendingCount} in progress`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Total Refunded', value: formatCurrency(data.stats.refunded), helper: `${data.stats.refundedCount} transactions`, icon: RefreshCw, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Failed Payments', value: data.stats.failedCount, helper: 'Unsuccessful attempts', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <div className={`p-2 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
                <s.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.helper}</p>
          </div>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by ID, M-Pesa code, chef..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Filter size={12} /> Status:
            </span>
            {FILTER_STATUSES.map((s) => {
              const count = statusCounts[s]
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === s
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                  {count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        statusFilter === s ? 'bg-white/25' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <CreditCard size={28} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-800 text-lg">No transactions found</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                Payments made for completed kitchen orders will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50 bg-gray-50/50">
                  <th className="px-5 py-3.5 font-semibold">Transaction</th>
                  <th className="px-5 py-3.5 font-semibold">Order</th>
                  <th className="px-5 py-3.5 font-semibold">Merchant</th>
                  <th className="px-5 py-3.5 font-semibold">Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Method</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const style = STATUS_STYLES[txn.status] || STATUS_STYLES['Pending']
                  return (
                    <tr
                      key={txn.id}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelected(txn)}
                    >
                      <td className="px-5 py-4 font-mono text-xs font-bold text-gray-900">{txn.id}</td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">#{txn.orderNumber}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {txn.vendorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800">{txn.vendorName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-extrabold text-gray-900">{formatCurrency(txn.amount)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">
                          {txn.method}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">{formatDateTime(txn.date)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(txn)
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
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
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-900">{data.page}</span> of{' '}
              <span className="font-semibold text-gray-900">{data.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData({ page: data.page - 1 })}
                disabled={data.page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <button
                onClick={() => fetchData({ page: data.page + 1 })}
                disabled={data.page >= data.totalPages || loading}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Transaction Ref
                  </p>
                  <h3 className="font-mono text-base font-bold text-gray-900 mt-0.5">
                    {selected.id}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    STATUS_STYLES[selected.status].bg
                  } ${STATUS_STYLES[selected.status].text} ${
                    STATUS_STYLES[selected.status].border
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selected.status].dot}`} />
                  {selected.status}
                </span>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="rounded-xl border border-gray-100 p-4 space-y-2 bg-gray-50/50">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Items Subtotal</span>
                    <span>{formatCurrency(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Platform Convenience Fee</span>
                    <span>{formatCurrency(selected.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Delivery Charge</span>
                    <span>{formatCurrency(selected.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-black text-gray-900">
                    <span>Grand Total Paid</span>
                    <span className="text-emerald-700">
                      {formatCurrency(selected.amount)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    ['Order Number', `#${selected.orderNumber}`],
                    ['Merchant Kitchen', selected.vendorName],
                    ['Payment Method', selected.method],
                    ['M-Pesa Reference', selected.mpesaCode || '—'],
                    ['Date Placed', formatDateTime(selected.date)],
                    ['Delivery Destination', selected.deliveryAddress || '—'],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="bg-gray-50/20 rounded-xl border border-gray-100 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                        {l}
                      </p>
                      <p className="font-semibold text-gray-800 truncate">{String(v)}</p>
                    </div>
                  ))}
                </div>

                {selected.customerNotes && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-900 leading-relaxed">
                    <span className="font-bold block mb-1">Invoicing Notes:</span>
                    {selected.customerNotes}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-2.5">
                <button
                  onClick={() => printReceipt(selected)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} /> Print Receipt
                </button>
                <button
                  onClick={() => copyToClipboard(selected.id)}
                  className="flex-1 py-3 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white rounded-xl text-xs font-extrabold hover:shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} /> Copy ID Reference
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}