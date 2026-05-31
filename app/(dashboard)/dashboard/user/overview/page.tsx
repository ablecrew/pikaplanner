'use client'

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Clock, CheckCircle2, XCircle, Loader2, RefreshCw,
  Store, MapPin, ShoppingBag, ArrowRight, AlertCircle, Sparkles,
  ReceiptText, Eye, ChevronDown, Star, Truck, ChefHat, Ban, Search
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';

type VendorData = {
  id: string
  business_name?: string | null
  location_city?: string | null
}

type Order = {
  id: string
  orderNumber: string
  vendor: string
  vendorLocation: string
  mealName: string
  amount: number
  subtotal: number
  deliveryFee: number
  platformFee: number
  netAmount: number
  status: string
  paymentStatus: string
  items: number
  deliveryAddress: string
  customerNotes: string
  transactionId: string
  createdAt: string
  updatedAt: string
}

const moneyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES', minimumFractionDigits: 2,
})

function formatMoney(value: number) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0)
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

// Function to get order items summary from order_items table (uses ingredient_name, not meal_id)
const getOrderItemsSummary = async (
  supabase: any,
  orderIds: string[]
): Promise<Map<string, string>> => {
  const summaryMap = new Map<string, string>()

  if (orderIds.length === 0) return summaryMap

  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select('order_id, ingredient_name, item_description, quantity')
    .in('order_id', orderIds)

  if (error) return summaryMap

  orderIds.forEach((orderId) => {
    const items = (orderItems ?? []).filter((item: any) => item.order_id === orderId)
    if (items.length === 0) {
      summaryMap.set(orderId, 'Order')
    } else {
      const firstName = items[0].ingredient_name || items[0].item_description || 'Order'
      if (items.length === 1) {
        summaryMap.set(orderId, firstName)
      } else {
        summaryMap.set(orderId, `${firstName} & ${items.length - 1} more`)
      }
    }
  })

  return summaryMap
}

export default function UserOrdersPage() {
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Get orders - NO meal_id reference
      const { data: orderRows, error: oe } = await supabase
        .from('orders')
        .select('id, order_number, vendor_id, subtotal, total_amount, platform_fee, delivery_fee, status, payment_status, delivery_address, customer_notes, mpesa_transaction_id, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (oe) throw oe

      // Get meal names from order_items by ingredient_name (NO meal_id)
      const orderIds = (orderRows ?? []).map((o: any) => o.id)
      const itemsSummary = await getOrderItemsSummary(supabase, orderIds)

      // Get vendor names
      const vendorIds = Array.from(new Set((orderRows ?? []).map((o: any) => o.vendor_id).filter(Boolean))) as string[]

      const { data: vData } = vendorIds.length > 0
        ? await supabase.from('vendors').select('id, business_name, location_city').in('id', vendorIds)
        : { data: [] as VendorData[] }

      const vendorMap = new Map<string, VendorData>((vData ?? []).map((v: VendorData) => [v.id, v]))

      const result: Order[] = (orderRows ?? []).map((o: any) => {
        const vendor: VendorData | undefined = vendorMap.get(o.vendor_id)
        const mealName = itemsSummary.get(o.id) || 'Order'

        const amount = Number(o.total_amount ?? 0)
        return {
          id: o.id,
          orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
          vendor: vendor?.business_name || 'Vendor',
          vendorLocation: vendor?.location_city || '—',
          mealName,
          amount: Math.abs(amount),
          subtotal: Math.abs(Number(o.subtotal ?? amount)),
          deliveryFee: Math.abs(Number(o.delivery_fee ?? 0)),
          platformFee: Math.abs(Number(o.platform_fee ?? 0)),
          netAmount: Math.abs(amount - Number(o.delivery_fee ?? 0) - Number(o.platform_fee ?? 0)),
          status: o.status || 'Pending',
          paymentStatus: o.payment_status || 'Pending',
          items: 1,
          deliveryAddress: o.delivery_address || '—',
          customerNotes: o.customer_notes || '—',
          transactionId: o.mpesa_transaction_id || '—',
          createdAt: o.created_at || '',
          updatedAt: o.updated_at || '',
        }
      })
      setOrders(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void fetchOrders() }, [fetchOrders])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      const s = !q || o.orderNumber.toLowerCase().includes(q) || o.vendor.toLowerCase().includes(q) || o.mealName.toLowerCase().includes(q)
      const f = statusFilter === 'All' || o.status === statusFilter
      return s && f
    })
  }, [orders, search, statusFilter])

  const activeOrders = useMemo(() => orders.filter(o => ['Pending', 'Processing', 'Preparing', 'On the way'].includes(o.status)), [orders])
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'Completed' || o.status === 'delivered'), [orders])
  const totalSpent = completedOrders.reduce((s, o) => s + o.amount, 0)
  const statuses = ['All', 'Pending', 'Processing', 'Preparing', 'On the way', 'Completed', 'Cancelled', 'Refunded']

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            My Orders
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 text-xs font-bold text-blue-600">
              <Sparkles size={12} /> {orders.length} orders
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Track your current and past orders.</p>
        </div>
        <button onClick={() => void fetchOrders()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: String(orders.length), helper: `${activeOrders.length} active`, icon: Package, accent: 'from-emerald-500 to-emerald-300' },
          { label: 'Active', value: String(activeOrders.length), helper: 'In progress', icon: Clock, accent: 'from-blue-500 to-sky-300' },
          { label: 'Completed', value: String(completedOrders.length), helper: 'Delivered successfully', icon: CheckCircle2, accent: 'from-amber-500 to-amber-300' },
          { label: 'Total Spent', value: formatMoney(totalSpent), helper: `Avg ${orders.length > 0 ? formatMoney(totalSpent / orders.length) : '—'}`, icon: ReceiptText, accent: 'from-violet-500 to-fuchsia-300' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -3 }} transition={{ duration: 0.18 }} className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === s ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center"><Package size={28} className="text-blue-500" /></div>
            <p className="text-gray-900 font-semibold">No orders found</p>
            <p className="text-gray-400 text-sm text-center max-w-md">Browse meals and place your first order to see it here.</p>
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
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{order.vendor.charAt(0)}</div>
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
                      <button onClick={e => { e.stopPropagation(); setSelectedOrder(order) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"><Eye size={15} /></button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5"><Sparkles size={14} className="text-amber-500" /> AI Insights</h3>
          <div className="space-y-2">
            <div className="border-l-4 border-l-emerald-500 rounded-r-xl p-3 bg-emerald-50/50">
              <p className="text-xs font-bold text-gray-900">{activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{activeOrders.length > 0 ? 'Your food is being prepared or on the way.' : 'No active orders right now.'}</p>
            </div>
            {completedOrders.length > 5 && (
              <div className="border-l-4 border-l-amber-500 rounded-r-xl p-3 bg-amber-50/50">
                <p className="text-xs font-bold text-gray-900">Regular customer</p>
                <p className="text-[11px] text-gray-500 mt-0.5">You have placed {completedOrders.length} completed orders.</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5"><ReceiptText size={14} className="text-emerald-500" /> Quick Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total spent</p><p className="text-sm font-bold text-gray-900 mt-0.5">{formatMoney(totalSpent)}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Cancelled</p><p className="text-sm font-bold text-gray-900 mt-0.5">{orders.filter(o => o.status === 'Cancelled').length}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Refunded</p><p className="text-sm font-bold text-gray-900 mt-0.5">{orders.filter(o => o.status === 'Refunded').length}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Avg order</p><p className="text-sm font-bold text-gray-900 mt-0.5">{orders.length > 0 ? formatMoney(totalSpent / orders.length) : '—'}</p></div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
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
                    ['Subtotal', formatMoney(selectedOrder.subtotal)],
                    ['Delivery Fee', formatMoney(selectedOrder.deliveryFee)],
                    ['Platform Fee', formatMoney(selectedOrder.platformFee)],
                    ['Net Amount', formatMoney(selectedOrder.netAmount)],
                    ['Payment', selectedOrder.paymentStatus],
                    ['Transaction ID', selectedOrder.transactionId === '—' ? 'Pending' : selectedOrder.transactionId],
                    ['Delivery Address', selectedOrder.deliveryAddress],
                    ['Notes', selectedOrder.customerNotes],
                    ['Created', formatDateTime(selectedOrder.createdAt)],
                    ['Updated', formatDateTime(selectedOrder.updatedAt)],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{l}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 border-t border-gray-100">
                <button onClick={() => setSelectedOrder(null)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}