'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Search, Filter, Eye, CheckCircle2, Clock, ChefHat, Truck,
  Package, XCircle, AlertCircle, Download, Printer, Phone, MapPin, MessageSquare,
  RefreshCw, TrendingUp, DollarSign, TrendingDown, Calendar, MoreHorizontal,
  Loader2, ChevronRight, Bell, BellOff, Star, UtensilsCrossed, ArrowUpRight,
  Flame, Zap, CreditCard, Banknote, User, Hash, FileText, Check, X, Ban,
  Timer, CircleDot, CircleDashed
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// ── Types ────────────────────────────────────────────────

type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Refunded'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

type MealInfo = {
  id: string
  name?: string
  image_url?: string
}

type ProfileInfo = {
  id: string
  full_name?: string
  email?: string
}

type OrderItem = {
  meal_id: string
  meal_name: string
  quantity: number
  price: number
  notes?: string
}

type VendorOrder = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  platformFee: number
  deliveryFee: number
  totalAmount: number
  paymentStatus: PaymentStatus
  status: OrderStatus
  deliveryAddress: string
  customerNotes: string
  mpesaCode: string
  createdAt: string
  updatedAt: string
}

// ── Constants ────────────────────────────────────────────

const STATUS_FLOW: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered']

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; border: string; icon: React.ReactNode; dot: string; hex: string }> = {
  'Pending':           { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    icon: <Clock size={12} />,           dot: 'bg-amber-500',   hex: '#f59e0b' },
  'Confirmed':         { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',     icon: <CheckCircle2 size={12} />,    dot: 'bg-blue-500',    hex: '#3b82f6' },
  'Preparing':         { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200',   icon: <ChefHat size={12} />,         dot: 'bg-violet-500',  hex: '#8b5cf6' },
  'Ready':             { bg: 'bg-cyan-50',     text: 'text-cyan-700',     border: 'border-cyan-200',     icon: <Package size={12} />,         dot: 'bg-cyan-500',    hex: '#06b6d4' },
  'Out for Delivery':  { bg: 'bg-indigo-50',   text: 'text-indigo-700',   border: 'border-indigo-200',   icon: <Truck size={12} />,           dot: 'bg-indigo-500',  hex: '#6366f1' },
  'Delivered':         { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  icon: <CheckCircle2 size={12} />,    dot: 'bg-emerald-500', hex: '#10b981' },
  'Cancelled':         { bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200',      icon: <XCircle size={12} />,         dot: 'bg-red-500',     hex: '#ef4444' },
  'Refunded':          { bg: 'bg-slate-50',    text: 'text-slate-700',    border: 'border-slate-200',    icon: <Ban size={12} />,             dot: 'bg-slate-500',   hex: '#64748b' },
}

const PAYMENT_STYLES: Record<PaymentStatus, { bg: string; text: string }> = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700' },
  paid:     { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  failed:   { bg: 'bg-red-50',     text: 'text-red-700' },
  refunded: { bg: 'bg-slate-50',   text: 'text-slate-700' },
}

const CHART_COLORS = ['#10b981', '#F4A535', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#f97316']

const FILTER_STATUSES: (OrderStatus | 'All')[] = ['All', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled']

// ── Helpers ──────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatTimeAgo(iso?: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current)
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
}

// ── Skeleton ─────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

// ── Status Badge ─────────────────────────────────────────

function StatusBadge({ status, size = 'sm' }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Pending']
  const sizeClass = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${s.bg} ${s.text} ${s.border} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
      {s.icon}
      {status}
    </span>
  )
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_STYLES[status] || PAYMENT_STYLES.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>
      {status === 'paid' && <CheckCircle2 size={10} />}
      {status === 'pending' && <Clock size={10} />}
      {status === 'failed' && <XCircle size={10} />}
      {status === 'refunded' && <Ban size={10} />}
      {status}
    </span>
  )
}

// ── Order Timeline ───────────────────────────────────────

function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = STATUS_FLOW.indexOf(status)
  const isCancelled = status === 'Cancelled' || status === 'Refunded'

  return (
    <div className="flex items-center justify-between gap-1">
      {STATUS_FLOW.map((step, i) => {
        const isComplete = !isCancelled && i <= currentIndex
        const isCurrent = !isCancelled && i === currentIndex

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isCancelled
                  ? 'bg-red-100 border-2 border-red-300'
                  : isComplete
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-200'
                    : 'bg-gray-100 border-2 border-gray-200'
              } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}>
                {isCancelled ? (
                  <XCircle size={13} className="text-red-600" />
                ) : isComplete ? (
                  <Check size={13} className="text-white" strokeWidth={3} />
                ) : (
                  <CircleDashed size={13} className="text-gray-400" />
                )}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
                )}
              </div>
              <span className={`text-[10px] font-semibold text-center ${
                isCurrent ? 'text-emerald-700' : isComplete ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {step}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${
                !isCancelled && i < currentIndex ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────

export default function VendorOrdersPage() {
  const supabase = createClient()

  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [selected, setSelected] = useState<VendorOrder | null>(null)
  const [modalMode, setModalMode] = useState<'view' | null>(null)
  const [confirm, setConfirm] = useState<{ type: 'advance' | 'cancel'; order: VendorOrder } | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [liveOrdersCount, setLiveOrdersCount] = useState(0)

  // ── Fetch Data ─────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get vendor
      const { data: vendor, error: vendorErr } = await supabase
        .from('vendors')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (vendorErr) throw vendorErr
      if (!vendor) {
        setOrders([])
        setLoading(false)
        return
      }

      setVendorId(vendor.id)

      // Get orders for this vendor
      const { data: orderRows, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })

      if (ordersErr) throw ordersErr

      // Get unique user IDs for batch profile lookup
      const userIds = [...new Set((orderRows || []).map((o: any) => o.user_id).filter(Boolean))]
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        : { data: [] }
      const profileMap = new Map<string, ProfileInfo>(
        (profiles || []).map((p: any) => [p.id, p as ProfileInfo])
      )

      // Get order items for all orders
      const orderIds = (orderRows || []).map((o: any) => o.id)
      const { data: orderItems } = orderIds.length > 0
        ? await supabase.from('order_items').select('*').in('order_id', orderIds)
        : { data: [] }

      // Get meal names
      const mealIds = [...new Set((orderItems || []).map((oi: any) => oi.meal_id).filter(Boolean))]
      const { data: meals } = mealIds.length > 0
        ? await supabase.from('meals').select('id, name, image_url').in('id', mealIds)
        : { data: [] }
      const mealMap = new Map<string, MealInfo>(
        (meals || []).map((m: any) => [m.id, m as MealInfo])
      )

      // Group order items by order_id
      const itemsByOrder = new Map<string, any[]>()
      ;(orderItems || []).forEach((item: any) => {
        if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, [])
        itemsByOrder.get(item.order_id)!.push(item)
      })

      // Map to VendorOrder
      const mapped: VendorOrder[] = (orderRows || []).map((o: any) => {
        const profile = profileMap.get(o.user_id)
        const items = (itemsByOrder.get(o.id) || []).map((item: any) => {
          const meal = mealMap.get(item.meal_id)
          return {
            meal_id: item.meal_id,
            meal_name: meal?.name || 'Meal',
            quantity: item.quantity || 1,
            price: Number(item.price || 0),
            notes: item.notes || '',
          }
        })

        return {
          id: o.id,
          orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
          customerName: profile?.full_name || o.customer_email?.split('@')[0] || 'Customer',
          customerEmail: o.customer_email || profile?.email || '',
          customerPhone: o.customer_phone || '',
          items,
          subtotal: Number(o.subtotal || 0),
          platformFee: Number(o.platform_fee || 0),
          deliveryFee: Number(o.delivery_fee || 0),
          totalAmount: Number(o.total_amount || 0),
          paymentStatus: (o.payment_status as PaymentStatus) || 'pending',
          status: (o.status as OrderStatus) || 'Pending',
          deliveryAddress: o.delivery_address || '',
          customerNotes: o.customer_notes || '',
          mpesaCode: o.mpesa_transaction_id || '',
          createdAt: o.created_at,
          updatedAt: o.updated_at || o.created_at,
        }
      })

      setOrders(mapped)
      setLiveOrdersCount(mapped.filter(o => o.status === 'Pending').length)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => void fetchOrders(), 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // ── Filtered Orders ────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const now = Date.now()
    const dayMs = 86400000

    return orders.filter(o => {
      const matchSearch = !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)

      const matchStatus = statusFilter === 'All' || o.status === statusFilter

      let matchDate = true
      if (dateFilter !== 'all') {
        const orderTime = new Date(o.createdAt).getTime()
        const diff = now - orderTime
        if (dateFilter === 'today') matchDate = diff < dayMs
        else if (dateFilter === 'week') matchDate = diff < 7 * dayMs
        else if (dateFilter === 'month') matchDate = diff < 30 * dayMs
      }

      return matchSearch && matchStatus && matchDate
    })
  }, [orders, search, statusFilter, dateFilter])

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = Date.now()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayOrders = orders.filter(o => new Date(o.createdAt).getTime() >= todayStart.getTime())
    const pendingCount = orders.filter(o => o.status === 'Pending').length
    const activeCount = orders.filter(o => ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)).length
    const completedOrders = orders.filter(o => o.status === 'Delivered')
    const todayRevenue = todayOrders.filter(o => o.status === 'Delivered').reduce((s, o) => s + o.totalAmount, 0)
    const totalRevenue = completedOrders.reduce((s, o) => s + o.totalAmount, 0)
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

    return {
      todayOrders: todayOrders.length,
      pendingCount,
      activeCount,
      todayRevenue,
      totalRevenue,
      avgOrderValue,
      completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0,
    }
  }, [orders])

  // ── Chart Data ─────────────────────────────────────────
  const revenueChart = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const map = new Map<string, number>()
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      map.set(days[d.getDay()], 0)
    }
    orders
      .filter(o => o.status === 'Delivered')
      .forEach(o => {
        const d = new Date(o.createdAt)
        if (Date.now() - d.getTime() < 7 * 86400000) {
          const key = days[d.getDay()]
          map.set(key, (map.get(key) || 0) + o.totalAmount)
        }
      })
    return Array.from(map.entries()).map(([day, revenue]) => ({ day, revenue }))
  }, [orders])

  const statusChart = useMemo(() => {
    const counts = new Map<string, number>()
    orders.forEach(o => counts.set(o.status, (counts.get(o.status) || 0) + 1))
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
  }, [orders])

  // ── Actions ────────────────────────────────────────────
  const advanceStatus = async (order: VendorOrder) => {
    const next = getNextStatus(order.status)
    if (!next) return

    setActionLoadingId(order.id)
    setError(null)

    try {
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq('id', order.id)

      if (updateErr) throw updateErr

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next, updatedAt: new Date().toISOString() } : o))
      setInfoMessage(`Order #${order.orderNumber} is now ${next}`)

      if (selected?.id === order.id) {
        setSelected({ ...order, status: next, updatedAt: new Date().toISOString() })
      }
    } catch (err) {
      console.error('Status update failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to update order status')
    } finally {
      setActionLoadingId(null)
    }
  }

  const cancelOrder = async (order: VendorOrder) => {
    setActionLoadingId(order.id)
    setError(null)

    try {
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
        .eq('id', order.id)

      if (updateErr) throw updateErr

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' as OrderStatus } : o))
      setInfoMessage(`Order #${order.orderNumber} has been cancelled`)

      if (selected?.id === order.id) {
        setSelected({ ...order, status: 'Cancelled' })
      }
    } catch (err) {
      console.error('Cancel failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.type === 'advance') advanceStatus(confirm.order)
    else if (confirm.type === 'cancel') cancelOrder(confirm.order)
  }

  const openView = (order: VendorOrder) => {
    setSelected(order)
    setModalMode('view')
  }

  const printOrder = (order: VendorOrder) => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html>
        <head><title>Order #${order.orderNumber}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd; }
          .total { font-weight: bold; font-size: 16px; margin-top: 12px; padding-top: 12px; border-top: 2px solid #000; display: flex; justify-content: space-between; }
          .section { margin-top: 16px; }
          .label { font-size: 11px; color: #999; text-transform: uppercase; font-weight: 600; }
        </style>
        </head>
        <body>
          <h1>🍴 Pika Plan</h1>
          <div class="meta">Order #${order.orderNumber} · ${formatDateTime(order.createdAt)}</div>
          <div class="section">
            <div class="label">Customer</div>
            <div>${order.customerName}</div>
            <div>${order.customerPhone}</div>
          </div>
          <div class="section">
            <div class="label">Items</div>
            ${order.items.map(i => `<div class="item"><span>${i.quantity}× ${i.meal_name}</span><span>${formatCurrency(i.price * i.quantity)}</span></div>`).join('')}
          </div>
          <div class="total"><span>TOTAL</span><span>${formatCurrency(order.totalAmount)}</span></div>
          ${order.customerNotes ? `<div class="section"><div class="label">Notes</div><div>${order.customerNotes}</div></div>` : ''}
          <div class="section"><div class="label">Delivery Address</div><div>${order.deliveryAddress}</div></div>
        </body></html>
    `)
    w.document.close()
    w.print()
  }

  const exportCsv = () => {
    const rows = [
      ['Order #', 'Customer', 'Phone', 'Items', 'Amount', 'Status', 'Payment', 'Date'],
      ...filtered.map(o => [
        o.orderNumber,
        o.customerName,
        o.customerPhone,
        o.items.map(i => `${i.quantity}× ${i.meal_name}`).join('; '),
        o.totalAmount,
        o.status,
        o.paymentStatus,
        formatDateTime(o.createdAt),
      ]),
    ]
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vendor-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Orders</h1>
            {liveOrdersCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs font-bold text-amber-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                {liveOrdersCount} pending
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">Manage incoming orders and track fulfillment in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationsEnabled(p => !p)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              notificationsEnabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {notificationsEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            {notificationsEnabled ? 'Alerts On' : 'Alerts Off'}
          </button>
          <button
            onClick={() => void fetchOrders()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        {infoMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} /> {infoMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today\'s Orders', value: stats.todayOrders, icon: ShoppingCart, color: 'bg-blue-500', accent: 'bg-blue-50', trend: `${stats.activeCount} active` },
          { label: 'Pending Review', value: stats.pendingCount, icon: Clock, color: 'bg-amber-500', accent: 'bg-amber-50', trend: 'Needs action' },
          { label: 'Today\'s Revenue', value: formatCurrency(stats.todayRevenue), icon: DollarSign, color: 'bg-emerald-500', accent: 'bg-emerald-50', trend: `+${stats.completionRate}% rate` },
          { label: 'Avg Order Value', value: formatCurrency(stats.avgOrderValue), icon: TrendingUp, color: 'bg-violet-500', accent: 'bg-violet-50', trend: 'Per order' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[48px] opacity-10 ${s.color} group-hover:opacity-20 transition`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.accent}`}>
                  <s.icon size={17} className={s.color.replace('bg-', 'text-')} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{s.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Revenue This Week</h3>
              <p className="text-xs text-gray-400">Daily earnings from delivered orders</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
              <TrendingUp size={12} />
              {formatCurrency(stats.totalRevenue)} total
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Order Status</h3>
          <p className="text-xs text-gray-400 mb-3">Distribution overview</p>
          {loading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : statusChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusChart} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {statusChart.map((entry, i) => {
                    const style = STATUS_STYLES[entry.name as OrderStatus]
                    return <Cell key={i} fill={style?.hex || CHART_COLORS[i % CHART_COLORS.length]} />
                  })}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">No orders yet</div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="relative flex-1 w-full lg:max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, customer, phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition text-gray-900"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                <Calendar size={13} className="text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-gray-400" />
            {FILTER_STATUSES.map((s) => {
              const count = s === 'All' ? orders.length : orders.filter(o => o.status === s).length
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === s
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      statusFilter === s ? 'bg-white/20' : 'bg-white'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <ShoppingCart size={28} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700">No orders found</p>
              <p className="text-sm text-gray-400 text-center max-w-md">
                {orders.length === 0
                  ? 'Orders will appear here once customers start placing them.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((order, i) => {
                    const nextStatus = getNextStatus(order.status)
                    const canAdvance = !!nextStatus
                    const canCancel = ['Pending', 'Confirmed', 'Preparing'].includes(order.status)
                    const isActionLoading = actionLoadingId === order.id

                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-gray-50 hover:bg-emerald-50/20 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gray-900">#{order.orderNumber}</span>
                            {order.status === 'Pending' && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{order.mpesaCode || '—'}</p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {order.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate max-w-[160px]">{order.customerName}</p>
                              <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                <Phone size={9} />
                                <span className="truncate max-w-[120px]">{order.customerPhone || 'No phone'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-700 truncate max-w-[200px]">
                              {order.items.map(i => `${i.quantity}× ${i.meal_name}`).join(', ')}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-extrabold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                          {order.deliveryFee > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5">+{formatCurrency(order.deliveryFee)} delivery</p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <PaymentBadge status={order.paymentStatus} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-600">{formatTimeAgo(order.createdAt)}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{formatDateTime(order.createdAt)}</p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {canAdvance && (
                              <button
                                onClick={() => advanceStatus(order)}
                                disabled={isActionLoading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:shadow-md transition disabled:opacity-50"
                              >
                                {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
                                {nextStatus === 'Confirmed' ? 'Accept' : nextStatus === 'Preparing' ? 'Start' : nextStatus === 'Ready' ? 'Ready' : nextStatus === 'Out for Delivery' ? 'Dispatch' : 'Deliver'}
                              </button>
                            )}
                            <button
                              onClick={() => openView(order)}
                              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => printOrder(order)}
                              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                              title="Print receipt"
                            >
                              <Printer size={14} />
                            </button>
                            {canCancel && (
                              <button
                                onClick={() => setConfirm({ type: 'cancel', order })}
                                disabled={isActionLoading}
                                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
                                title="Cancel order"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between text-xs text-gray-500">
            <p>Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of <span className="font-semibold text-gray-700">{orders.length}</span> orders</p>
            <p className="font-semibold text-gray-700">Total: {formatCurrency(filtered.reduce((s, o) => s + o.totalAmount, 0))}</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={modalMode === 'view' && !!selected}
        onClose={() => { setModalMode(null); setSelected(null) }}
        title={`Order #${selected?.orderNumber}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-5 -mx-2 px-2">
            {/* Timeline */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <CircleDot size={12} /> Order Progress
              </p>
              <OrderTimeline status={selected.status} />
            </div>

            {/* Customer & Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
                </div>
                <p className="font-bold text-gray-900">{selected.customerName}</p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                  <Phone size={12} /> {selected.customerPhone || 'No phone'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{selected.customerEmail}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <MapPin size={14} className="text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selected.deliveryAddress || 'No address provided'}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center gap-2">
                <UtensilsCrossed size={14} className="text-emerald-600" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Items</p>
              </div>
              <div className="divide-y divide-gray-50">
                {selected.items.map((item, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                        {item.quantity}×
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.meal_name}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-gray-50/50 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selected.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>{formatCurrency(selected.platformFee)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{formatCurrency(selected.deliveryFee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-extrabold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(selected.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {selected.customerNotes && (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-amber-700" />
                  <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">Customer Notes</p>
                </div>
                <p className="text-sm text-amber-900 leading-relaxed">{selected.customerNotes}</p>
              </div>
            )}

            {/* Meta Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Order ID', selected.id.slice(0, 8).toUpperCase()],
                ['Payment', selected.paymentStatus],
                ['M-Pesa', selected.mpesaCode || '—'],
                ['Placed', formatDateTime(selected.createdAt)],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-xs font-bold text-gray-800 truncate">{String(value)}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 sticky bottom-0 bg-white pb-1">
              <button
                onClick={() => printOrder(selected)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <Printer size={15} /> Print
              </button>
              {getNextStatus(selected.status) && (
                <button
                  onClick={() => advanceStatus(selected)}
                  disabled={actionLoadingId === selected.id}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoadingId === selected.id ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpRight size={15} />}
                  Move to {getNextStatus(selected.status)}
                </button>
              )}
              {['Pending', 'Confirmed', 'Preparing'].includes(selected.status) && (
                <button
                  onClick={() => setConfirm({ type: 'cancel', order: selected })}
                  disabled={actionLoadingId === selected.id}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.type === 'cancel' ? 'Cancel Order' : 'Advance Order'}
        message={
          confirm?.type === 'cancel'
            ? `Cancel order #${confirm?.order.orderNumber}? This will notify the customer and issue a refund if applicable.`
            : `Move order #${confirm?.order.orderNumber} to "${getNextStatus(confirm?.order.status || 'Pending')}"?`
        }
        confirmLabel={confirm?.type === 'cancel' ? 'Cancel Order' : 'Confirm'}
        confirmVariant={confirm?.type === 'cancel' ? 'danger' : 'primary'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}