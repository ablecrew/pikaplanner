'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Eye, Trash2, CheckCircle, XCircle, Download, Loader2,
  AlertCircle, CheckCircle2, RefreshCw, Filter, Package, Clock,
  Truck, Ban, MapPin, Phone, Mail, Calendar, CreditCard, Hash,
  ClipboardCheck, AlertTriangle, ShoppingBag, TrendingUp, Users,
  ChevronRight, ArrowUpRight, Sparkles, Layers
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { PageHeader } from '@/components/ui/PageHeader'

// ── Types ────────────────────────────────────────────────

type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Refunded'

type DbOrder = {
  id: string
  order_number: string
  user_id: string
  vendor_id: string
  meal_plan_entry_id?: string | null
  status: string
  subtotal: number
  delivery_fee: number
  platform_fee: number
  total_amount: number
  currency: string
  delivery_address?: string | null
  delivery_lat?: number | null
  delivery_lng?: number | null
  customer_phone: string
  customer_email?: string | null
  customer_notes?: string | null
  estimated_delivery_at?: string | null
  delivered_at?: string | null
  rejected_reason?: string | null
  mpesa_transaction_id?: string | null
  payment_status?: string | null
  created_at: string
  updated_at: string
  profiles?: { full_name: string | null; email: string | null } | null
  vendors?: { business_name: string | null } | null
}

type Order = {
  id: string
  orderNumber: string
  customerId: string
  customer: string
  customerEmail: string
  customerPhone: string
  vendorId: string
  vendor: string
  items: number
  subtotal: string
  deliveryFee: string
  platformFee: string
  totalAmount: string
  rawTotal: number
  currency: string
  paymentMethod: string
  paymentStatus: string
  status: OrderStatus
  date: string
  deliveryAddress: string
  customerNotes: string
  estimatedDelivery: string
  deliveredAt: string
  mpesaRef: string
}

// ── Helpers ───────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function statusStyle(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    Processing: 'bg-blue-100 text-blue-700 border-blue-200',
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Cancelled: 'bg-red-100 text-red-700 border-red-200',
    Refunded: 'bg-violet-100 text-violet-700 border-violet-200',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

// ── Toast ─────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-20 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold font-poppins ${
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </motion.div>
  )
}

// ── Stat Card ─────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] opacity-10 ${color}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
            <Icon size={18} className={color.replace('bg-', 'text-')} />
          </div>
        </div>
        <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────

export default function AdminOrdersPage() {
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalMode, setModalMode] = useState<'view' | null>(null)
  const [selected, setSelected] = useState<Order | null>(null)
  const [confirm, setConfirm] = useState<{ type: string; order: Order } | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, user_id, vendor_id, status, subtotal,
          delivery_fee, platform_fee, total_amount, currency,
          delivery_address, customer_phone, customer_email, customer_notes,
          estimated_delivery_at, delivered_at,
          mpesa_transaction_id, payment_status, created_at, updated_at,
          profiles:user_id (full_name, email),
          vendors:vendor_id (business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      const mapped: Order[] = (data || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
        customerId: o.user_id || '',
        customer: o.profiles?.full_name || 'Unknown',
        customerEmail: o.customer_email || o.profiles?.email || '',
        customerPhone: o.customer_phone || '',
        vendorId: o.vendor_id || '',
        vendor: o.vendors?.business_name || 'No Vendor',
        items: 1,
        subtotal: formatCurrency(Number(o.subtotal || 0)),
        deliveryFee: formatCurrency(Number(o.delivery_fee || 0)),
        platformFee: formatCurrency(Number(o.platform_fee || 0)),
        totalAmount: formatCurrency(Number(o.total_amount || 0)),
        rawTotal: Number(o.total_amount || 0),
        currency: o.currency || 'KES',
        paymentMethod: o.mpesa_transaction_id ? 'M-Pesa' : (o.payment_status === 'paid' ? 'Paid' : 'Pending'),
        paymentStatus: o.payment_status || 'pending',
        status: (o.status as OrderStatus) || 'Pending',
        date: formatDate(o.created_at),
        deliveryAddress: o.delivery_address || '',
        customerNotes: o.customer_notes || '',
        estimatedDelivery: formatDateTime(o.estimated_delivery_at),
        deliveredAt: formatDateTime(o.delivered_at),
        mpesaRef: o.mpesa_transaction_id || '',
      }))

      setOrders(mapped)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setToast({ message: 'Failed to load orders', type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  // ── Stats ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'Completed')
    const pending = orders.filter(o => o.status === 'Pending')
    const processing = orders.filter(o => o.status === 'Processing')
    const cancelled = orders.filter(o => o.status === 'Cancelled' || o.status === 'Refunded')
    const revenue = completed.reduce((acc, o) => acc + o.rawTotal, 0)

    const today = new Date()
    const todayOrders = orders.filter(o => {
      const d = new Date(o.date)
      return d.toDateString() === today.toDateString()
    })

    return {
      total: orders.length,
      completed: completed.length,
      pending: pending.length,
      processing: processing.length,
      cancelled: cancelled.length,
      revenue: formatCurrency(revenue),
      todayOrders: todayOrders.length,
      todayRevenue: formatCurrency(todayOrders.reduce((acc, o) => acc + o.rawTotal, 0)),
    }
  }, [orders])

  // ── Filters ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return orders.filter(o => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.vendor.toLowerCase().includes(q) ||
        o.mpesaRef.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      const matchStatus = statusFilter === 'All' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  // ── Actions ─────────────────────────────────────────────
  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    setActionLoadingId(order.id)
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() }
      if (newStatus === 'Completed') updates.delivered_at = new Date().toISOString()
      if (newStatus === 'Cancelled') updates.rejected_reason = 'Cancelled by admin'

      const { error } = await supabase.from('orders').update(updates).eq('id', order.id)
      if (error) throw error

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o))
      setToast({ message: `Order ${order.orderNumber} marked as ${newStatus}`, type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to update order', type: 'error' })
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const handleDelete = async (order: Order) => {
    setActionLoadingId(order.id)
    try {
      const { error } = await supabase.from('orders').delete().eq('id', order.id)
      if (error) throw error

      setOrders(prev => prev.filter(o => o.id !== order.id))
      setToast({ message: `Order ${order.orderNumber} deleted`, type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to delete order', type: 'error' })
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const handleExport = () => {
    const rows = [
      ['Order #', 'Customer', 'Vendor', 'Amount', 'Payment', 'Status', 'Date'],
      ...filtered.map(o => [o.orderNumber, o.customer, o.vendor, o.totalAmount, o.paymentMethod, o.status, o.date]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `pikaplan-orders-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
    setToast({ message: 'Orders exported', type: 'success' })
  }

  const openView = (order: Order) => { setSelected(order); setModalMode('view') }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage all customer orders across vendors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setRefreshing(true); void fetchOrders() }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Orders" value={stats.total} icon={ShoppingBag} color="bg-emerald-500" sub={`${stats.todayOrders} today`} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="bg-green-500" />
        <StatCard label="Processing" value={stats.processing} icon={Truck} color="bg-blue-500" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-amber-500" />
        <StatCard label="Revenue" value={stats.revenue} icon={CreditCard} color="bg-violet-500" sub={`${stats.todayOrders} orders today`} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1 max-w-md w-full">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order #, customer, vendor..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50">
                <th className="px-5 py-3 font-semibold">Order #</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Vendor</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={28} className="animate-spin text-emerald-500" />
                      <p className="text-sm text-gray-400 font-medium">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingBag size={36} className="text-gray-300" />
                      <p className="text-sm text-gray-400 font-medium">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 text-xs">{order.orderNumber}</p>
                      {order.mpesaRef && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[140px]">{order.mpesaRef}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800 text-sm">{order.customer}</p>
                      <p className="text-xs text-gray-400">{order.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 font-medium">{order.vendor}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{order.totalAmount}</p>
                      <p className="text-[10px] text-gray-400">+ {order.deliveryFee} delivery</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{order.date}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ActionMenu actions={[
                        { label: 'View Details', icon: <Eye size={14} />, onClick: () => openView(order) },
                        ...(order.status === 'Pending' || order.status === 'Processing'
                          ? [{ label: 'Mark Complete', icon: <CheckCircle size={14} />, onClick: () => setConfirm({ type: 'complete', order }) }]
                          : []),
                        ...(order.status !== 'Cancelled' && order.status !== 'Completed'
                          ? [{ label: 'Cancel Order', icon: <XCircle size={14} />, onClick: () => setConfirm({ type: 'cancel', order }), variant: 'warning' as const }]
                          : []),
                        { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => setConfirm({ type: 'delete', order }), variant: 'danger' as const },
                      ]} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="Order Details" size="lg">
        {selected && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">{selected.orderNumber}</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{selected.id}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusStyle(selected.status)}`}>
                {selected.status}
              </span>
            </div>

            {/* Amount Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Total Amount</p>
                  <p className="text-3xl font-black text-gray-900">{selected.totalAmount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Subtotal: {selected.subtotal}</p>
                  <p className="text-xs text-gray-400">Delivery: {selected.deliveryFee}</p>
                  <p className="text-xs text-gray-400">Platform fee: {selected.platformFee}</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-5">
              {[
                { icon: Users, label: 'Customer', value: selected.customer },
                { icon: Mail, label: 'Email', value: selected.customerEmail || 'N/A' },
                { icon: Phone, label: 'Phone', value: selected.customerPhone || 'N/A' },
                { icon: Package, label: 'Vendor', value: selected.vendor },
                { icon: CreditCard, label: 'Payment', value: `${selected.paymentMethod} · ${selected.paymentStatus}` },
                { icon: Hash, label: 'M-Pesa Ref', value: selected.mpesaRef || 'N/A' },
                { icon: Calendar, label: 'Order Date', value: selected.date },
                { icon: Truck, label: 'Est. Delivery', value: selected.estimatedDelivery },
                { icon: MapPin, label: 'Address', value: selected.deliveryAddress || 'N/A' },
                { icon: AlertTriangle, label: 'Notes', value: selected.customerNotes || 'None' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title={
          confirm?.type === 'delete' ? 'Delete Order' :
          confirm?.type === 'complete' ? 'Complete Order' :
          'Cancel Order'
        }
        message={
          confirm?.type === 'delete'
            ? `Permanently delete order ${confirm?.order.orderNumber}? This cannot be undone.`
            : confirm?.type === 'complete'
            ? `Mark order ${confirm?.order.orderNumber} as completed?`
            : `Cancel order ${confirm?.order.orderNumber}? This will notify the customer.`
        }
        confirmLabel={
          confirm?.type === 'delete' ? 'Delete' :
          confirm?.type === 'complete' ? 'Mark Complete' :
          'Cancel Order'
        }
        confirmVariant={
          confirm?.type === 'delete' ? 'danger' :
          confirm?.type === 'complete' ? 'primary' :
          'warning'
        }
        onConfirm={() => {
          if (!confirm) return
          if (confirm.type === 'delete') handleDelete(confirm.order)
          else if (confirm.type === 'complete') handleStatusChange(confirm.order, 'Completed')
          else if (confirm.type === 'cancel') handleStatusChange(confirm.order, 'Cancelled')
        }}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}