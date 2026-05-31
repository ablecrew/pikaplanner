'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Eye, Download, CreditCard, DollarSign, TrendingUp, RefreshCw,
  Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Filter, Phone,
  MapPin, Copy, FileText, Printer, ArrowUpRight, ArrowDownLeft, ShieldCheck,
  Building, Smartphone as SmartphoneIcon, Smartphone
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'

// ── Types ────────────────────────────────────────────────

type TransactionStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded'

type TransactionRecord = {
  id: string
  orderId: string
  orderNumber: string
  vendorId: string
  vendorName: string
  amount: number
  method: 'M-Pesa' | 'Card' | 'Bank'
  date: string
  status: TransactionStatus
  mpesaCode: string
  subtotal: number
  deliveryFee: number
  platformFee: number
  deliveryAddress: string
  customerNotes: string
}

const STATUS_STYLES: Record<TransactionStatus, { bg: string; text: string; border: string; dot: string; hex: string }> = {
  'Successful': { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  dot: 'bg-emerald-500', hex: '#10b981' },
  'Pending':    { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    dot: 'bg-amber-500',   hex: '#f59e0b' },
  'Failed':     { bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200',      dot: 'bg-red-500',     hex: '#ef4444' },
  'Refunded':   { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200',   dot: 'bg-violet-500',  hex: '#8b5cf6' },
}

const FILTER_STATUSES: (TransactionStatus | 'All')[] = ['All', 'Successful', 'Pending', 'Failed', 'Refunded']

// ── Helpers ──────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const supabase = createClient()

export default function UserTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'All'>('All')
  const [selected, setSelected] = useState<TransactionRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // ── Fetch Transaction History Data ───────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Query user's orders (orders are the source of transactions)
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, order_number, vendor_id, subtotal, total_amount, platform_fee, delivery_fee, status, payment_status, delivery_address, customer_notes, mpesa_transaction_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersErr) throw ordersErr

      // Batch fetch vendors
      const vendorIds = [...new Set((orders || []).map((o: any) => o.vendor_id).filter(Boolean))]
      const { data: vendors } = vendorIds.length > 0
        ? await supabase.from('vendors').select('id, business_name').in('id', vendorIds)
        : { data: [] }
      const vendorMap = new Map((vendors || []).map((v: any) => [v.id, v.business_name]))

      // Map orders to TransactionRecord
      const mapped: TransactionRecord[] = (orders || []).map((o: any) => {
        const vendorName = vendorMap.get(o.vendor_id) || 'Pika Kitchen'
        
        // Map status
        let status: TransactionStatus = 'Pending'
        if (o.payment_status === 'paid') status = 'Successful'
        else if (o.payment_status === 'refunded' || o.status === 'Refunded') status = 'Refunded'
        else if (o.payment_status === 'failed') status = 'Failed'

        // Map method based on transaction references
        const method = o.mpesa_transaction_id ? 'M-Pesa' : 'Card'

        return {
          id: `TXN-${o.id.slice(0, 8).toUpperCase()}`,
          orderId: o.id,
          orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
          vendorId: o.vendor_id || '',
          vendorName,
          amount: Number(o.total_amount || 0),
          method,
          date: o.created_at,
          status,
          mpesaCode: o.mpesa_transaction_id || '',
          subtotal: Number(o.subtotal || 0),
          deliveryFee: Number(o.delivery_fee || 0),
          platformFee: Number(o.platform_fee || 0),
          deliveryAddress: o.delivery_address || '',
          customerNotes: o.customer_notes || '',
        }
      })

      setTransactions(mapped)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTransactions()
  }, [fetchTransactions])

  // ── Filters & Search ───────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return transactions.filter(t => {
      const matchSearch = !q ||
        t.id.toLowerCase().includes(q) ||
        t.orderNumber.toLowerCase().includes(q) ||
        t.vendorName.toLowerCase().includes(q) ||
        (t.mpesaCode && t.mpesaCode.toLowerCase().includes(q))

      const matchStatus = statusFilter === 'All' || t.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [transactions, search, statusFilter])

  // ── Calculated Statistics ──────────────────────────────
  const stats = useMemo(() => {
    const successful = transactions.filter(t => t.status === 'Successful')
    const pending = transactions.filter(t => t.status === 'Pending')
    const refunded = transactions.filter(t => t.status === 'Refunded')
    const failed = transactions.filter(t => t.status === 'Failed')

    const totalSpent = successful.reduce((sum, t) => sum + t.amount, 0)
    const pendingAmount = pending.reduce((sum, t) => sum + t.amount, 0)
    const refundedAmount = refunded.reduce((sum, t) => sum + t.amount, 0)

    return {
      spent: totalSpent,
      pending: pendingAmount,
      refunded: refundedAmount,
      successfulCount: successful.length,
      pendingCount: pending.length,
      refundedCount: refunded.length,
      failedCount: failed.length,
    }
  }, [transactions])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setInfoMessage('✓ Transaction ID copied to clipboard')
    setTimeout(() => setInfoMessage(null), 3000)
  }

  // ── Receipt Printing Format ─────────────────────────────
  const printReceipt = (txn: TransactionRecord) => {
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
  }

  const exportCsv = () => {
    const rows = [
      ['Transaction ID', 'Order #', 'Merchant', 'Amount', 'Subtotal', 'Delivery Fee', 'Platform Fee', 'Method', 'M-Pesa Code', 'Status', 'Date'],
      ...filtered.map(t => [
        t.id, t.orderNumber, t.vendorName, t.amount, t.subtotal, t.deliveryFee, t.platformFee, t.method, t.mpesaCode || '', t.status, formatDateTime(t.date)
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'my-transactions.csv'
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <PageHeader
        title="My Transactions"
        subtitle="Review complete details of your payments and payouts."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:shadow-lg transition"
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              onClick={() => void fetchTransactions()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        {infoMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white shadow-xl px-5 py-4 text-sm font-bold text-emerald-800">
            <CheckCircle2 size={18} className="text-emerald-500" /> {infoMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Spent', value: formatCurrency(stats.spent), helper: `${stats.successfulCount} successful`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Pending Payment', value: formatCurrency(stats.pending), helper: `${stats.pendingCount} in progress`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Total Refunded', value: formatCurrency(stats.refunded), helper: `${stats.refundedCount} transactions`, icon: RefreshCw, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          { label: 'Failed Payments', value: stats.failedCount, helper: 'Unsuccessful attempts', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
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
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, M-Pesa code, chef..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1"><Filter size={12} /> Status:</span>
            {FILTER_STATUSES.map((s) => {
              const count = s === 'All' ? transactions.length : transactions.filter(t => t.status === s).length
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === s ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                  {count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      statusFilter === s ? 'bg-white/25' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <CreditCard size={28} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-800 text-lg">No transactions found</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">Payments made for completed kitchen orders will appear here.</p>
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
                {filtered.map((txn) => {
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
                          onClick={(e) => { e.stopPropagation(); setSelected(txn) }}
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
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Transaction Invoice"
        size="md"
      >
        {selected && (
          <div className="space-y-5 -mx-2 px-2 text-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Transaction Ref</p>
                <h3 className="font-mono text-base font-bold text-gray-900 mt-0.5">{selected.id}</h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[selected.status].bg} ${STATUS_STYLES[selected.status].text} ${STATUS_STYLES[selected.status].border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selected.status].dot}`} />
                {selected.status}
              </span>
            </div>

            {/* Pricing Summary */}
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
                <span className="text-emerald-700">{formatCurrency(selected.amount)}</span>
              </div>
            </div>

            {/* Metadata Grid */}
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
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{l}</p>
                  <p className="font-semibold text-gray-800 truncate">{String(v)}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            {selected.customerNotes && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-1">Invoicing Notes:</span>
                {selected.customerNotes}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-3 border-t border-gray-100">
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
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
