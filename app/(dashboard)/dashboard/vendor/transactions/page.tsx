'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Eye, Download, DollarSign, CreditCard, TrendingUp, RefreshCw,
  ArrowDownLeft, ArrowUpRight, Wallet, Clock, CheckCircle2, XCircle, AlertCircle,
  Calendar, Filter, Banknote, Smartphone, Receipt, PieChart as PieIcon, Zap,
  Sparkles, Brain, Target, ArrowRight, Loader2, Plus, Info, TrendingDown,
  FileText, Copy, ExternalLink, Shield, Timer, PiggyBank, CircleDollarSign
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// ── Types ────────────────────────────────────────────────
type TransactionStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded'
type TransactionType = 'order' | 'withdrawal' | 'refund' | 'payout'
type PaymentMethod = 'M-Pesa' | 'Card' | 'Bank' | 'Cash'

type Transaction = {
  id: string
  orderId: string
  type: TransactionType
  customerName: string
  customerEmail: string
  amount: number
  method: PaymentMethod
  date: string
  status: TransactionStatus
  description: string
  mpesaCode?: string
  platformFee: number
  netAmount: number
}

type WithdrawalRequest = {
  id: string
  amount: number
  method: 'mpesa' | 'bank'
  destination: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  processedAt?: string
}

type Profile = {
  id: string
  full_name: string | null
  email: string | null
}

// ── Constants ────────────────────────────────────────────
const STATUS_STYLES: Record<TransactionStatus, { bg: string; text: string; border: string; dot: string }> = {
  'Successful': { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  dot: 'bg-emerald-500' },
  'Pending':    { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    dot: 'bg-amber-500' },
  'Failed':     { bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200',      dot: 'bg-red-500' },
  'Refunded':   { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200',   dot: 'bg-violet-500' },
}

const TYPE_STYLES: Record<TransactionType, { icon: React.ReactNode; color: string; bg: string }> = {
  'order':      { icon: <ArrowUpRight size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'withdrawal': { icon: <ArrowDownLeft size={16} />, color: 'text-blue-600',   bg: 'bg-blue-50' },
  'refund':     { icon: <RefreshCw size={16} />,    color: 'text-violet-600', bg: 'bg-violet-50' },
  'payout':     { icon: <Wallet size={16} />,       color: 'text-amber-600',  bg: 'bg-amber-50' },
}

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  'M-Pesa': <Smartphone size={14} />,
  'Card':   <CreditCard size={14} />,
  'Bank':   <Banknote size={14} />,
  'Cash':   <Receipt size={14} />,
}

const FILTER_STATUSES: (TransactionStatus | 'All')[] = ['All', 'Successful', 'Pending', 'Failed', 'Refunded']
const CHART_COLORS = ['#10b981', '#F4A535', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444']

// ── Helpers ──────────────────────────────────────────────
function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso?: string | null): string {
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
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function getNextPayoutDate(): string {
  const now = new Date()
  const day = now.getDay()
  const daysUntilFriday = (5 - day + 7) % 7 || 7
  const nextFriday = new Date(now)
  nextFriday.setDate(now.getDate() + daysUntilFriday)
  return nextFriday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ── Skeleton ─────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

// ── Status Badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: TransactionStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
      {status}
    </span>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────
export default function VendorTransactionsPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'All'>('All')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [confirm, setConfirm] = useState<{ type: 'refund'; txn: Transaction } | null>(null)
  const [modalMode, setModalMode] = useState<'withdraw' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [withdrawalThreshold, setWithdrawalThreshold] = useState(500)
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', method: 'mpesa' as 'mpesa' | 'bank', destination: '' })
  const [withdrawing, setWithdrawing] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // ── Fetch Data ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get vendor info
      const { data: vendor, error: vendorErr } = await supabase
        .from('vendors')
        .select('id, available_balance, total_earnings, withdrawal_threshold')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (vendorErr) throw vendorErr
      if (!vendor) {
        setLoading(false)
        return
      }

      setVendorId(vendor.id)
      setAvailableBalance(Number(vendor.available_balance || 0))
      setTotalEarnings(Number(vendor.total_earnings || 0))
      setWithdrawalThreshold(Number(vendor.withdrawal_threshold || 500))

      // Get orders for this vendor
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })

      if (ordersErr) throw ordersErr

      // Get unique user IDs for batch profile lookup
      const userIds = [...new Set((orders || []).map((o: any) => o.user_id).filter(Boolean))]

      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        : { data: [] as Profile[] }

      const profileMap = new Map<string, Profile>((profiles || []).map((p: Profile) => [p.id, p]))

      // Map orders to transactions
      const mappedTransactions: Transaction[] = (orders || []).map((o: any) => {
        const profile = profileMap.get(o.user_id)
        const totalAmount = Number(o.total_amount || 0)
        const platformFee = Number(o.platform_fee || 0)

        // Determine transaction status based on order and payment status
        let status: TransactionStatus = 'Pending'
        if (o.payment_status === 'paid' && (o.status === 'Delivered' || o.status === 'Completed')) {
          status = 'Successful'
        } else if (o.payment_status === 'refunded' || o.status === 'Refunded') {
          status = 'Refunded'
        } else if (o.payment_status === 'failed') {
          status = 'Failed'
        }

        // Determine payment method from mpesa code or default
        const method: PaymentMethod = o.mpesa_transaction_id ? 'M-Pesa' : 'Card'

        return {
          id: o.id,
          orderId: o.order_number || o.id.slice(0, 8).toUpperCase(),
          type: status === 'Refunded' ? 'refund' : 'order',
          customerName: profile?.full_name || o.customer_email?.split('@')[0] || 'Customer',
          customerEmail: o.customer_email || profile?.email || '',
          amount: totalAmount,
          method,
          date: o.created_at,
          status,
          description: `Order payment for #${o.order_number}`,
          mpesaCode: o.mpesa_transaction_id || '',
          platformFee,
          netAmount: totalAmount - platformFee,
        }
      })

      setTransactions(mappedTransactions)

      // Fetch withdrawals (if you have a withdrawals table)
      // For now, we'll simulate with empty array
      setWithdrawals([])
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // ── Filtered Transactions ──────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return transactions.filter(t => {
      const matchSearch = !q ||
        t.id.toLowerCase().includes(q) ||
        t.orderId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerEmail.toLowerCase().includes(q) ||
        (t.mpesaCode && t.mpesaCode.toLowerCase().includes(q))
      const matchStatus = statusFilter === 'All' || t.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [transactions, search, statusFilter])

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const successful = transactions.filter(t => t.status === 'Successful')
    const pending = transactions.filter(t => t.status === 'Pending')
    const refunded = transactions.filter(t => t.status === 'Refunded')
    const failed = transactions.filter(t => t.status === 'Failed')

    const totalRevenue = successful.reduce((s, t) => s + t.amount, 0)
    const pendingAmount = pending.reduce((s, t) => s + t.amount, 0)
    const refundedAmount = refunded.reduce((s, t) => s + t.amount, 0)
    const totalFees = successful.reduce((s, t) => s + t.platformFee, 0)

    // Calculate trends (compare last 7 days vs previous 7 days)
    const now = Date.now()
    const weekMs = 7 * 86400000
    const thisWeek = transactions.filter(t => now - new Date(t.date).getTime() < weekMs && t.status === 'Successful')
    const lastWeek = transactions.filter(t => {
      const diff = now - new Date(t.date).getTime()
      return diff >= weekMs && diff < 2 * weekMs && t.status === 'Successful'
    })

    const thisWeekRevenue = thisWeek.reduce((s, t) => s + t.amount, 0)
    const lastWeekRevenue = lastWeek.reduce((s, t) => s + t.amount, 0)
    const revenueTrend = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0

    return {
      totalRevenue,
      pendingAmount,
      refundedAmount,
      totalFees,
      completedCount: successful.length,
      pendingCount: pending.length,
      refundedCount: refunded.length,
      failedCount: failed.length,
      revenueTrend,
      averageOrderValue: successful.length > 0 ? totalRevenue / successful.length : 0,
    }
  }, [transactions])

  // ── Chart Data ─────────────────────────────────────────
  const revenueChart = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const map = new Map<string, { day: string; revenue: number; fees: number }>()

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      map.set(days[d.getDay()], { day: days[d.getDay()], revenue: 0, fees: 0 })
    }

    transactions
      .filter(t => t.status === 'Successful')
      .forEach(t => {
        const d = new Date(t.date)
        if (Date.now() - d.getTime() < 7 * 86400000) {
          const key = days[d.getDay()]
          const existing = map.get(key)
          if (existing) {
            existing.revenue += t.amount
            existing.fees += t.platformFee
          }
        }
      })

    return Array.from(map.values())
  }, [transactions])

  const methodChart = useMemo(() => {
    const counts = new Map<string, number>()
    transactions.forEach(t => counts.set(t.method, (counts.get(t.method) || 0) + 1))
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
  }, [transactions])

  // ── AI Insights ────────────────────────────────────────
  const aiInsights = useMemo(() => {
    const insights: { icon: React.ReactNode; title: string; description: string; color: string }[] = []

    if (stats.revenueTrend > 20) {
      insights.push({
        icon: <TrendingUp size={16} />,
        title: 'Revenue Surge Detected',
        description: `Your revenue is up ${stats.revenueTrend.toFixed(1)}% this week. Consider increasing inventory.`,
        color: 'emerald'
      })
    } else if (stats.revenueTrend < -20) {
      insights.push({
        icon: <TrendingDown size={16} />,
        title: 'Revenue Decline Alert',
        description: `Revenue dropped ${Math.abs(stats.revenueTrend).toFixed(1)}% this week. Review pricing and promotions.`,
        color: 'red'
      })
    }

    if (stats.pendingCount > 5) {
      insights.push({
        icon: <Clock size={16} />,
        title: 'High Pending Balance',
        description: `${formatCurrency(stats.pendingAmount)} is pending. Complete orders to unlock funds.`,
        color: 'amber'
      })
    }

    if (availableBalance >= withdrawalThreshold * 2) {
      insights.push({
        icon: <PiggyBank size={16} />,
        title: 'Withdrawal Opportunity',
        description: `You have ${formatCurrency(availableBalance)} available. Consider withdrawing to your account.`,
        color: 'blue'
      })
    }

    if (stats.refundedCount > 0 && stats.refundedCount / transactions.length > 0.1) {
      insights.push({
        icon: <AlertCircle size={16} />,
        title: 'High Refund Rate',
        description: `${((stats.refundedCount / transactions.length) * 100).toFixed(1)}% of orders are refunded. Check quality and descriptions.`,
        color: 'violet'
      })
    }

    insights.push({
      icon: <Brain size={16} />,
      title: 'AI Prediction',
      description: `Based on trends, expect ~${formatCurrency(stats.averageOrderValue * stats.completedCount * 0.15)} more revenue this week.`,
      color: 'indigo'
    })

    return insights
  }, [stats, availableBalance, withdrawalThreshold, transactions.length])

  // ── Actions ────────────────────────────────────────────
  const handleWithdraw = async () => {
    const amount = Number(withdrawForm.amount)
    if (!amount || amount < withdrawalThreshold || amount > availableBalance) {
      setError(`Amount must be between ${formatCurrency(withdrawalThreshold)} and ${formatCurrency(availableBalance)}`)
      return
    }

    setWithdrawing(true)
    setError(null)

    try {
      // Create withdrawal request (you may want a separate withdrawals table)
      const { error: withdrawErr } = await supabase
        .from('vendors')
        .update({
          available_balance: availableBalance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendorId)

      if (withdrawErr) throw withdrawErr

      // Optionally create a withdrawal record
      // await supabase.from('withdrawals').insert({...})

      setAvailableBalance(prev => prev - amount)
      setInfoMessage(`Withdrawal of ${formatCurrency(amount)} initiated successfully`)
      setModalMode(null)
      setWithdrawForm({ amount: '', method: 'mpesa', destination: '' })
      await fetchData()
    } catch (err) {
      console.error('Withdrawal failed:', err)
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  const processRefund = async (txn: Transaction) => {
    setActionLoadingId(txn.id)
    setError(null)

    try {
      // Update order status to refunded
      const { error: refundErr } = await supabase
        .from('orders')
        .update({
          status: 'Refunded',
          payment_status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', txn.id)

      if (refundErr) throw refundErr

      setTransactions(prev => prev.map(t => t.id === txn.id ? { ...t, status: 'Refunded' as TransactionStatus } : t))
      setInfoMessage(`Refund of ${formatCurrency(txn.amount)} processed successfully`)
      await fetchData()
    } catch (err) {
      console.error('Refund failed:', err)
      setError(err instanceof Error ? err.message : 'Refund failed')
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['Transaction ID', 'Order ID', 'Type', 'Customer', 'Email', 'Amount', 'Fee', 'Net', 'Method', 'Date', 'Status', 'M-Pesa Code'],
      ...filtered.map(t => [
        t.id,
        t.orderId,
        t.type,
        t.customerName,
        t.customerEmail,
        t.amount,
        t.platformFee,
        t.netAmount,
        t.method,
        formatDate(t.date),
        t.status,
        t.mpesaCode || '',
      ]),
    ]

    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vendor-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setInfoMessage('Copied to clipboard')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Transactions</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 text-xs font-bold text-violet-700">
              <Sparkles size={12} /> AI-Powered
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Track earnings, manage payouts, and analyze revenue trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => setModalMode('withdraw')}
            disabled={availableBalance < withdrawalThreshold}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wallet size={15} /> Withdraw
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

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A5C3A] via-emerald-600 to-emerald-700 p-6 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 -ml-24 -mb-24" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide mb-1">Available Balance</p>
              <p className="text-4xl font-black tracking-tight">{formatCurrency(availableBalance)}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Wallet size={32} className="text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide mb-1">Total Earned</p>
              <p className="text-xl font-bold">{formatCurrency(totalEarnings)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide mb-1">Pending</p>
              <p className="text-xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide mb-1">Next Payout</p>
              <p className="text-sm font-semibold">{getNextPayoutDate()}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-100">
            <Info size={12} />
            <span>Minimum withdrawal: {formatCurrency(withdrawalThreshold)}</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-emerald-500', accent: 'bg-emerald-50', trend: `${stats.revenueTrend >= 0 ? '+' : ''}${stats.revenueTrend.toFixed(1)}%`, trendUp: stats.revenueTrend >= 0 },
          { label: 'Completed', value: stats.completedCount, icon: CheckCircle2, color: 'bg-blue-500', accent: 'bg-blue-50', trend: `${stats.failedCount} failed`, trendUp: true },
          { label: 'Platform Fees', value: formatCurrency(stats.totalFees), icon: Receipt, color: 'bg-amber-500', accent: 'bg-amber-50', trend: 'Total deducted', trendUp: false },
          { label: 'Avg Order Value', value: formatCurrency(stats.averageOrderValue), icon: TrendingUp, color: 'bg-violet-500', accent: 'bg-violet-50', trend: 'Per transaction', trendUp: true },
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
              <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${s.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                {s.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {s.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain size={16} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Insights & Predictions</h3>
            <p className="text-xs text-gray-500">Smart analysis of your transaction patterns</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {aiInsights.map((insight, i) => {
            const colors: Record<string, string> = {
              emerald: 'border-l-emerald-500 bg-emerald-50/30',
              red: 'border-l-red-500 bg-red-50/30',
              amber: 'border-l-amber-500 bg-amber-50/30',
              blue: 'border-l-blue-500 bg-blue-50/30',
              violet: 'border-l-violet-500 bg-violet-50/30',
              indigo: 'border-l-indigo-500 bg-indigo-50/30',
            }
            const textColors: Record<string, string> = {
              emerald: 'text-emerald-700',
              red: 'text-red-700',
              amber: 'text-amber-700',
              blue: 'text-blue-700',
              violet: 'text-violet-700',
              indigo: 'text-indigo-700',
            }
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`border-l-4 ${colors[insight.color]} rounded-r-xl p-4`}
              >
                <div className="flex items-start gap-3">
                  <div className={textColors[insight.color]}>{insight.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{insight.title}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Revenue This Week</h3>
              <p className="text-xs text-gray-400">Daily earnings vs platform fees</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
              <TrendingUp size={12} />
              {stats.revenueTrend >= 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4A535" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F4A535" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" />
                <Area type="monotone" dataKey="fees" stroke="#F4A535" strokeWidth={2} fill="url(#feeGrad)" name="Fees" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Payment Methods</h3>
          <p className="text-xs text-gray-400 mb-3">Distribution overview</p>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : methodChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={methodChart} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {methodChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Activity & Payout Schedule */}
      <div className="mb-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Activity</h3>
            <span className="text-xs text-gray-400">Last 5 transactions</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No transactions yet</div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((txn, i) => {
                const typeStyle = TYPE_STYLES[txn.type]
                return (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelected(txn)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeStyle.bg} ${typeStyle.color}`}>
                      {typeStyle.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{txn.customerName}</p>
                      <p className="text-xs text-gray-500 truncate">{txn.orderId} · {formatTimeAgo(txn.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${txn.status === 'Refunded' || txn.status === 'Failed' ? 'text-red-600' : 'text-gray-900'}`}>
                        {txn.status === 'Refunded' ? '-' : '+'}{formatCurrency(txn.amount)}
                      </p>
                      <StatusBadge status={txn.status} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Payout Schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Payout Schedule</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-emerald-600" />
                <p className="text-sm font-bold text-emerald-900">Next Payout</p>
              </div>
              <p className="text-lg font-extrabold text-emerald-700">{getNextPayoutDate()}</p>
              <p className="text-xs text-emerald-600 mt-1">Every Friday at 5:00 PM</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Processing Time</span>
                </div>
                <span className="text-xs font-bold text-gray-900">1-2 hours</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Min Withdrawal</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{formatCurrency(withdrawalThreshold)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Platform Fee</span>
                </div>
                <span className="text-xs font-bold text-gray-900">2.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="relative flex-1 w-full lg:max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, order, customer, M-Pesa..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition text-gray-900"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-gray-400" />
              {FILTER_STATUSES.map((s) => {
                const count = s === 'All' ? transactions.length : transactions.filter(t => t.status === s).length
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Receipt size={28} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700">No transactions found</p>
              <p className="text-sm text-gray-400 text-center max-w-md">
                {transactions.length === 0
                  ? 'Transactions will appear here once you receive orders.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                  <th className="px-5 py-3 font-semibold">Transaction</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Fee</th>
                  <th className="px-5 py-3 font-semibold">Net</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((txn, i) => {
                    const typeStyle = TYPE_STYLES[txn.type]
                    const isActionLoading = actionLoadingId === txn.id
                    return (
                      <motion.tr
                        key={txn.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-gray-50 hover:bg-emerald-50/20 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeStyle.bg} ${typeStyle.color}`}>
                              {typeStyle.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-bold text-gray-900 truncate">#{txn.orderId}</p>
                              {txn.mpesaCode && (
                                <p className="text-[10px] text-gray-400 mt-0.5 font-mono truncate">{txn.mpesaCode}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[140px]">{txn.customerName}</p>
                            <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{txn.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-900">{formatCurrency(txn.amount)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-500">{formatCurrency(txn.platformFee)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-emerald-600">{formatCurrency(txn.netAmount)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 text-xs font-semibold text-gray-700">
                            {METHOD_ICONS[txn.method]}
                            {txn.method}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Clock size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-600">{formatTimeAgo(txn.date)}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{formatDate(txn.date)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={txn.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelected(txn)}
                              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => copyToClipboard(txn.id)}
                              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                              title="Copy ID"
                            >
                              <Copy size={14} />
                            </button>
                            {txn.status === 'Successful' && (
                              <button
                                onClick={() => setConfirm({ type: 'refund', txn })}
                                disabled={isActionLoading}
                                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition disabled:opacity-50"
                                title="Process refund"
                              >
                                {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
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
            <p>Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of <span className="font-semibold text-gray-700">{transactions.length}</span> transactions</p>
            <p className="font-semibold text-gray-700">Total: {formatCurrency(filtered.reduce((s, t) => s + (t.status === 'Successful' ? t.netAmount : 0), 0))}</p>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Transaction Details"
        size="md"
      >
        {selected && (
          <div className="space-y-5 -mx-2 px-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${TYPE_STYLES[selected.type].bg} ${TYPE_STYLES[selected.type].color}`}>
                  {TYPE_STYLES[selected.type].icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">#{selected.orderId}</h3>
                  <p className="text-xs text-gray-500">{formatDate(selected.date)}</p>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            {/* Amount Breakdown */}
            <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gross Amount</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selected.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-semibold text-gray-900">-{formatCurrency(selected.platformFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                <span className="font-bold text-gray-900">Net Amount</span>
                <span className="font-extrabold text-emerald-600">{formatCurrency(selected.netAmount)}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Transaction ID', selected.id.slice(0, 12).toUpperCase()],
                ['Customer', selected.customerName],
                ['Email', selected.customerEmail],
                ['Payment Method', selected.method],
                ['M-Pesa Code', selected.mpesaCode || '—'],
                ['Type', selected.type],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-xs font-bold text-gray-800 truncate">{String(value)}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => copyToClipboard(selected.id)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <Copy size={15} /> Copy ID
              </button>
              {selected.status === 'Successful' && (
                <button
                  onClick={() => setConfirm({ type: 'refund', txn: selected })}
                  className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition flex items-center justify-center gap-2"
                >
                  <RefreshCw size={15} /> Refund
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={modalMode === 'withdraw'}
        onClose={() => setModalMode(null)}
        title="Withdraw Funds"
        size="md"
      >
        <div className="space-y-5 -mx-2 px-2">
          {/* Balance Display */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-5">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Available Balance</p>
            <p className="text-3xl font-black text-emerald-900">{formatCurrency(availableBalance)}</p>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <Info size={12} />
              Minimum withdrawal: {formatCurrency(withdrawalThreshold)}
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Withdrawal Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">KES</span>
              <input
                type="number"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
                min={withdrawalThreshold}
                max={availableBalance}
                className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[500, 1000, 2500, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setWithdrawForm(p => ({ ...p, amount: String(amt) }))}
                  disabled={amt > availableBalance}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Method Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Withdrawal Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWithdrawForm(p => ({ ...p, method: 'mpesa' }))}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  withdrawForm.method === 'mpesa'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone size={20} className={withdrawForm.method === 'mpesa' ? 'text-emerald-600' : 'text-gray-400'} />
                <p className="text-sm font-semibold text-gray-900 mt-2">M-Pesa</p>
                <p className="text-xs text-gray-500">Instant</p>
              </button>
              <button
                onClick={() => setWithdrawForm(p => ({ ...p, method: 'bank' }))}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  withdrawForm.method === 'bank'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote size={20} className={withdrawForm.method === 'bank' ? 'text-emerald-600' : 'text-gray-400'} />
                <p className="text-sm font-semibold text-gray-900 mt-2">Bank Transfer</p>
                <p className="text-xs text-gray-500">1-3 business days</p>
              </button>
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {withdrawForm.method === 'mpesa' ? 'M-Pesa Number' : 'Bank Account'}
            </label>
            <input
              type="text"
              value={withdrawForm.destination}
              onChange={(e) => setWithdrawForm(p => ({ ...p, destination: e.target.value }))}
              placeholder={withdrawForm.method === 'mpesa' ? '07XX XXX XXX' : 'Account number'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900"
            />
          </div>

          {/* Summary */}
          {withdrawForm.amount && Number(withdrawForm.amount) > 0 && (
            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Withdrawal Amount</span>
                <span className="font-semibold text-gray-900">{formatCurrency(Number(withdrawForm.amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-semibold text-gray-900">KES 0.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                <span className="font-bold text-gray-900">You'll Receive</span>
                <span className="font-extrabold text-emerald-600">{formatCurrency(Number(withdrawForm.amount))}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setModalMode(null)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawForm.amount || Number(withdrawForm.amount) < withdrawalThreshold || Number(withdrawForm.amount) > availableBalance || !withdrawForm.destination}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {withdrawing ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
              {withdrawing ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Refund Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title="Process Refund"
        message={`Are you sure you want to refund ${confirm?.txn.amount ? formatCurrency(confirm.txn.amount) : ''} for order #${confirm?.txn.orderId}? This will return the funds to the customer and cannot be undone.`}
        confirmLabel="Process Refund"
        confirmVariant="warning"
        onConfirm={() => confirm && processRefund(confirm.txn)}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}