'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Clock, CheckCircle2, XCircle, Loader2, RefreshCw,
  AlertCircle, Sparkles, ReceiptText, Eye, Truck, ChefHat, Ban, Search,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  fetchUserOrders,
  type OrdersPage,
  type ServerOrder,
} from './actions'

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency', currency: 'KES', minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function formatRelativeTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000))
  if (diff < 60) return `${diff}m ago`
  const hours = Math.round(diff / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { tone: string; icon: React.ReactNode }> = {
    Completed: { tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: <CheckCircle2 size={12} /> },
    delivered: { tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: <CheckCircle2 size={12} /> },
    Processing: { tone: 'border-blue-200 bg-blue-50 text-blue-700', icon: <ChefHat size={12} /> },
    Preparing: { tone: 'border-sky-200 bg-sky-50 text-sky-700', icon: <ChefHat size={12} /> },
    'On the way': { tone: 'border-amber-200 bg-amber-50 text-amber-700', icon: <Truck size={12} /> },
    Pending: { tone: 'border-amber-200 bg-amber-50 text-amber-700', icon: <Clock size={12} /> },
    Cancelled: { tone: 'border-red-200 bg-red-50 text-red-700', icon: <XCircle size={12} /> },
    Refunded: { tone: 'border-violet-200 bg-violet-50 text-violet-700', icon: <Ban size={12} /> },
  }
  const c = config[status] || { tone: 'border-gray-200 bg-gray-50 text-gray-600', icon: <Clock size={12} /> }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${c.tone}`}>
      {c.icon} {status}
    </span>
  )
}

export default function UserOrdersClient({ initialData }: { initialData: OrdersPage }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<OrdersPage>(initialData)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState<ServerOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const page = data.page
  const totalPages = data.totalPages

  const goToPage = async (next: number) => {
    if (next < 1 || next > totalPages || next === page) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(next))
      startTransition(() => {
        router.push(`?${params.toString()}`)
      })
      const next_data = await fetchUserOrders(next)
      setData(next_data)
    } catch (err: any) {
      setError(err.message || 'Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.orders.filter(o => {
      const s = !q || o.orderNumber.toLowerCase().includes(q) || o.vendor.toLowerCase().includes(q) || o.mealName.toLowerCase().includes(q)
      const f = statusFilter === 'All' || o.status === statusFilter
      return s && f
    })
  }, [data.orders, search, statusFilter])

  const activeOrders = useMemo(() => data.orders.filter(o => ['Pending', 'Processing', 'Preparing', 'On the way'].includes(o.status)), [data.orders])
  const completedOrders = useMemo(() => data.orders.filter(o => o.status === 'Completed' || o.status === 'delivered'), [data.orders])
  const totalSpent = completedOrders.reduce((s, o) => s + o.amount, 0)
  const statuses = ['All', 'Pending', 'Processing', 'Preparing', 'On the way', 'Completed', 'Cancelled', 'Refunded']

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            My Orders
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 text-xs font-bold text-blue-600">
              <Sparkles size={12} /> {data.total} orders
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Track your current and past orders.</p>
        </div>
        <button
          onClick={() => void goToPage(page)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Page Orders', value: String(filtered.length), helper: `of ${data.total} total`, icon: Package, accent: 'from-emerald-500 to-emerald-300' },
          { label: 'Active', value: String(activeOrders.length), helper: 'In progress', icon: Clock, accent: 'from-blue-500 to-sky-300' },
          { label: 'Completed', value: String(completedOrders.length), helper: 'Delivered successfully', icon: CheckCircle2, accent: 'from-amber-500 to-amber-300' },
          { label: 'Total Spent', value: formatMoney(totalSpent), helper: `Page ${page} of ${totalPages}`, icon: ReceiptText, accent: 'from-violet-500 to-fuchsia-300' },
        ].map(s => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.18 }}
            className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.accent}`} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-gray-900">{s.value}</p>
                <p className="mt-1 text-xs text-gray-500">{s.helper}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                <s.icon size={18} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search this page..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statuses.map(s => (
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
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Package size={28} className="text-blue-500" />
            </div>
            <p className="text-gray-900 font-semibold">No orders found</p>
            <p className="text-gray-400 text-sm text-center max-w-md">
              Browse meals and place your first order to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50">
                  <th className="px-5 py-3.5 font-semibold">Order</th>
                  <th className="px-5 py-3.5 font-semibold">Vendor</th>
                  <th className="px-5 py-3.5 font-semibold">Meal</th>
                  <th className="px-5 py-3.5 font-semibold">Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-5 py-4"><p className="font-extrabold text-gray-900 text-xs">#{order.orderNumber}</p></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {order.vendor.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{order.vendor}</p>
                          <p className="text-xs text-gray-400">{order.vendorLocation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-700">{order.mealName}</td>
                    <td className="px-5 py-4 font-extrabold text-gray-900">{formatMoney(order.amount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-4 text-xs text-gray-500">{formatRelativeTime(order.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedOrder(order) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && data.total > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void goToPage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <button
                onClick={() => void goToPage(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order Details</p>
                    <h3 className="text-xl font-black text-gray-900 mt-1">#{selectedOrder.orderNumber}</h3>
                  </div>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Vendor', selectedOrder.vendor],
                    ['Location', selectedOrder.vendorLocation],
                    ['Meal', selectedOrder.mealName],
                    ['Amount', formatMoney(selectedOrder.amount)],
                    ['Payment', selectedOrder.paymentStatus],
                    ['Transaction ID', selectedOrder.transactionId === '—' ? 'Pending' : selectedOrder.transactionId],
                    ['Delivery Address', selectedOrder.deliveryAddress],
                    ['Notes', selectedOrder.customerNotes],
                    ['Created', formatDateTime(selectedOrder.createdAt)],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{l}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 border-t border-gray-100">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}