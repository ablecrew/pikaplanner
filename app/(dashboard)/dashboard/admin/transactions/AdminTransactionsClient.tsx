'use client'

import { useState, useEffect, useCallback, useMemo, memo, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Eye, RefreshCw, Download, Loader2, AlertCircle, CheckCircle2,
  ArrowDownToLine, Filter, Wallet, TrendingUp, TrendingDown, CreditCard, 
  Clock, Receipt, X, Smartphone, Building2, CircleDollarSign, RefreshCw as RefreshIcon
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { 
  Transaction, TransactionStatus, WithdrawForm, fetchAdminTransactionsData, 
  refundTransactionAction, withdrawFundsAction 
} from './actions'

// ── Helpers ───────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusColor(status: TransactionStatus): string {
  const map: Record<TransactionStatus, string> = {
    Successful: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    Failed: 'bg-red-100 text-red-700 border-red-200',
    Refunded: 'bg-violet-100 text-violet-700 border-violet-200',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

// ── Memoized Components ───────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold font-poppins ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </motion.div>
  )
}

const StatCard = memo(function StatCard({ label, value, icon: Icon, trend, trendUp, color }: {
  label: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }>; trend?: string; trendUp?: boolean; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] opacity-10 ${color}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}><Icon size={18} className={color.replace('bg-', 'text-')} /></div>
        </div>
        <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>
        {trend && (
          <p className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{trend}
          </p>
        )}
      </div>
    </div>
  )
})

const TransactionRow = memo(function TransactionRow({ 
  txn, onView, onRefund, actionLoadingId 
}: { 
  txn: Transaction
  onView: (txn: Transaction) => void
  onRefund: (txn: Transaction) => void
  actionLoadingId: string | null
}) {
  const isProcessing = actionLoadingId === txn.id

  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-4">
        <p className="font-semibold text-gray-900 text-xs">{txn.orderId}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{txn.reference}</p>
      </td>
      <td className="px-5 py-4">
        <p className="font-medium text-gray-800 text-sm">{txn.customer}</p>
        <p className="text-xs text-gray-400">{txn.customerEmail}</p>
      </td>
      <td className="px-5 py-4 text-sm text-gray-700 font-medium">{txn.vendor}</td>
      <td className="px-5 py-4">
        <p className="font-bold text-gray-900">{txn.amount}</p>
        {txn.rawFee > 0 && <p className="text-[10px] text-gray-400">Fee: {txn.fee}</p>}
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">{txn.method}</span>
      </td>
      <td className="px-5 py-4 text-sm text-gray-500">{txn.date}</td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor(txn.status)}`}>
          {isProcessing ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
          {txn.status}
        </span>
      </td>
      <td className="px-5 py-4">
        <ActionMenu actions={[
          { label: 'View Details', icon: <Eye size={14} />, onClick: () => onView(txn) },
          ...(txn.status === 'Successful' ? [{ label: 'Refund', icon: <RefreshIcon size={14} />, onClick: () => onRefund(txn), variant: 'warning' as const }] : []),
        ]} />
      </td>
    </tr>
  )
})

// ── Withdraw Modal ────────────────────────────────────────
function WithdrawModal({ isOpen, onClose, onSubmit, balance, loading }: { isOpen: boolean; onClose: () => void; onSubmit: (data: WithdrawForm) => void; balance: number; loading: boolean }) {
  const [form, setForm] = useState<WithdrawForm>({ amount: '', method: 'mpesa', phoneOrAccount: '', description: '' })
  const isValid = form.amount && Number(form.amount) > 0 && Number(form.amount) <= balance && form.phoneOrAccount

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds" size="md">
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl p-4 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Available Balance</p>
          <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(balance)}</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (KES)</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">KES</div>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Enter amount" className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition" />
          </div>
          {form.amount && Number(form.amount) > balance && <p className="text-xs text-red-500 mt-1.5 font-medium">Amount exceeds available balance</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Withdrawal Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setForm({ ...form, method: 'mpesa' })} className={`p-4 rounded-xl border-2 text-left transition-all ${form.method === 'mpesa' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
              <Smartphone className={form.method === 'mpesa' ? 'text-emerald-600' : 'text-gray-400'} />
              <p className="text-sm font-semibold text-gray-900 mt-2">M-Pesa</p>
              <p className="text-xs text-gray-400 mt-0.5">Instant</p>
            </button>
            <button onClick={() => setForm({ ...form, method: 'bank' })} className={`p-4 rounded-xl border-2 text-left transition-all ${form.method === 'bank' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
              <Building2 className={form.method === 'bank' ? 'text-emerald-600' : 'text-gray-400'} />
              <p className="text-sm font-semibold text-gray-900 mt-2">Bank Transfer</p>
              <p className="text-xs text-gray-400 mt-0.5">1-3 business days</p>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{form.method === 'mpesa' ? 'M-Pesa Number' : 'Bank Account Number'}</label>
          <input type="text" value={form.phoneOrAccount} onChange={(e) => setForm({ ...form, phoneOrAccount: e.target.value })} placeholder={form.method === 'mpesa' ? '07XX XXX XXX' : 'Account number'} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition" />
        </div>
        {form.amount && Number(form.amount) > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-900">{formatCurrency(Number(form.amount))}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fee (1%)</span><span className="font-semibold text-amber-600">- {formatCurrency(Number(form.amount) * 0.01)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2"><span className="font-semibold text-gray-700">You receive</span><span className="font-bold text-emerald-600">{formatCurrency(Number(form.amount) * 0.99)}</span></div>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={() => onSubmit(form)} disabled={!isValid || loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
            {loading ? 'Processing...' : 'Withdraw Funds'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Client Component ─────────────────────────────────

export default function AdminTransactionsClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'All'>('All')
  const [methodFilter, setMethodFilter] = useState('All')
  const [modalMode, setModalMode] = useState<'view' | 'withdraw' | null>(null)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [confirm, setConfirm] = useState<Transaction | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  const refreshTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminTransactionsData()
      setTransactions(data)
    } catch (err) {
      setToast({ message: 'Failed to load transactions', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  const stats = useMemo(() => {
    const successful = transactions.filter(t => t.status === 'Successful')
    const totalRevenue = successful.reduce((acc, t) => acc + t.rawAmount, 0)
    const totalFees = successful.reduce((acc, t) => acc + t.rawFee, 0)
    const totalNet = totalRevenue - totalFees

    const now = new Date()
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.createdAtIso)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.status === 'Successful'
    })
    const lastMonth = transactions.filter(t => {
      const d = new Date(t.createdAtIso)
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() && t.status === 'Successful'
    })

    const thisMonthRev = thisMonth.reduce((acc, t) => acc + t.rawNet, 0)
    const lastMonthRev = lastMonth.reduce((acc, t) => acc + t.rawNet, 0)
    const trend = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100) : 0
    const pendingAmount = transactions.filter(t => t.status === 'Pending').reduce((acc, t) => acc + t.rawAmount, 0)

    return {
      totalRevenue: formatCurrency(totalRevenue),
      totalNet: formatCurrency(totalNet),
      trend: trend !== 0 ? `${Math.abs(trend).toFixed(1)}% vs last month` : undefined,
      trendUp: trend >= 0,
      totalTransactions: transactions.length,
      successfulCount: successful.length,
      failedCount: transactions.filter(t => t.status === 'Failed' || t.status === 'Refunded').length,
      pendingAmount: formatCurrency(pendingAmount),
      availableBalance: totalNet,
    }
  }, [transactions])

  const paymentMethods = useMemo(() => ['All', ...Array.from(new Set(transactions.map(t => t.method)))].sort(), [transactions])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return transactions.filter(t => {
      const matchSearch = !q || t.id.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q) || t.orderId.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || t.status === statusFilter
      const matchMethod = methodFilter === 'All' || t.method === methodFilter
      return matchSearch && matchStatus && matchMethod
    })
  }, [transactions, search, statusFilter, methodFilter])

  const handleRefund = async (txn: Transaction) => {
    setActionLoadingId(txn.id)
    // Optimistic UI
    setTransactions(prev => prev.map(t => t.id === txn.id ? { ...t, status: 'Refunded' as TransactionStatus } : t))
    
    try {
      await refundTransactionAction(txn.id)
      setToast({ message: `Transaction ${txn.orderId} refunded successfully`, type: 'success' })
    } catch (err) {
      setToast({ message: 'Refund failed', type: 'error' })
      await refreshTransactions() // Revert on error
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const handleWithdraw = async (data: WithdrawForm) => {
    setWithdrawLoading(true)
    const amount = Number(data.amount)
    const netAmount = amount * 0.99
    
    // Optimistic UI: Create a mock transaction to show immediately
    const mockTxn: Transaction = {
      id: `WDR-${Date.now()}`,
      orderId: `WDR-${Date.now().toString().slice(-8)}`,
      customerId: 'Admin',
      customer: 'Admin Withdrawal',
      customerEmail: '',
      vendorId: 'Admin',
      vendor: 'Platform',
      amount: formatCurrency(netAmount),
      fee: formatCurrency(amount * 0.01),
      netAmount: formatCurrency(netAmount),
      method: data.method === 'mpesa' ? 'M-Pesa' : 'Bank',
      reference: `WDR-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAtIso: new Date().toISOString(),
      status: 'Successful',
      description: data.description || 'Admin withdrawal',
      rawAmount: netAmount,
      rawFee: amount * 0.01,
      rawNet: netAmount,
    }
    setTransactions(prev => [mockTxn, ...prev])

    try {
      await withdrawFundsAction(data)
      setToast({ message: `Withdrawal of ${formatCurrency(netAmount)} initiated`, type: 'success' })
      setModalMode(null)
    } catch (err) {
      setToast({ message: 'Withdrawal failed. Please try again.', type: 'error' })
      await refreshTransactions() // Revert on error
    } finally {
      setWithdrawLoading(false)
    }
  }

  const handleExport = () => {
    const rows = [['Txn ID', 'Order ID', 'Customer', 'Vendor', 'Amount', 'Method', 'Date', 'Status'], ...filtered.map(t => [t.id, t.orderId, t.customer, t.vendor, t.amount, t.method, t.date, t.status])]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `pikaplan-transactions-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
    setToast({ message: 'CSV exported', type: 'success' })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor payments, process refunds, and withdraw funds.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refreshTransactions} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setModalMode('withdraw')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all hover:-translate-y-0.5">
            <ArrowDownToLine size={16} /> Withdraw Funds
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={stats.totalRevenue} icon={CircleDollarSign} color="bg-emerald-500" trend={stats.trend} trendUp={stats.trendUp} />
        <StatCard label="Available Balance" value={stats.totalNet} icon={Wallet} color="bg-violet-500" />
        <StatCard label="Pending" value={stats.pendingAmount} icon={Clock} color="bg-amber-500" />
        <StatCard label="Transactions" value={String(stats.totalTransactions)} icon={Receipt} color="bg-blue-500" trend={`${stats.successfulCount} successful · ${stats.failedCount} failed`} trendUp />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-1 max-w-md w-full">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => startTransition(() => setSearch(e.target.value))} placeholder="Search by ID, customer, vendor..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl border transition ${showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              <Filter size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Successful', 'Pending', 'Failed', 'Refunded'].map((s) => (
              <button key={s} onClick={() => startTransition(() => setStatusFilter(s as any))} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"><Download size={15} /> Export CSV</button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Method</span>
                {paymentMethods.map((m) => (
                  <button key={m} onClick={() => startTransition(() => setMethodFilter(m))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${methodFilter === m ? 'bg-violet-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{m}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50">
                <th className="px-5 py-3 font-semibold">Txn ID</th><th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Vendor</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Method</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center"><div className="flex flex-col items-center gap-3"><Loader2 size={28} className="animate-spin text-emerald-500" /><p className="text-sm text-gray-400 font-medium">Loading transactions...</p></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center"><div className="flex flex-col items-center gap-3"><Receipt size={36} className="text-gray-300" /><p className="text-sm text-gray-400 font-medium">No transactions found</p></div></td></tr>
              ) : (
                filtered.map((txn) => (
                  <TransactionRow key={txn.id} txn={txn} onView={(t) => { setSelected(t); setModalMode('view') }} onRefund={(t) => setConfirm(t)} actionLoadingId={actionLoadingId} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="Transaction Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-extrabold text-gray-900">{selected.orderId}</h3><p className="text-xs text-gray-400 mt-0.5">{selected.id}</p></div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusColor(selected.status)}`}>{selected.status}</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100 text-center">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Transaction Amount</p>
              <p className="text-3xl font-black text-gray-900">{selected.amount}</p>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                <span>Fee: {selected.fee}</span><span className="w-1 h-1 rounded-full bg-gray-300" /><span>Net: {selected.netAmount}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-5">
              {[['Customer', selected.customer], ['Email', selected.customerEmail], ['Vendor', selected.vendor], ['Payment Method', selected.method], ['Reference', selected.reference], ['Date', selected.date]].map(([k, v]) => (
                <div key={String(k)}><p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{k}</p><p className="text-sm font-semibold text-gray-800">{String(v)}</p></div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <WithdrawModal isOpen={modalMode === 'withdraw'} onClose={() => setModalMode(null)} onSubmit={handleWithdraw} balance={stats.availableBalance} loading={withdrawLoading} />

      <ConfirmDialog
        isOpen={!!confirm}
        title="Process Refund"
        message={`Are you sure you want to refund ${confirm?.amount} for transaction ${confirm?.orderId}? This will return funds to ${confirm?.customer}.`}
        confirmLabel="Yes, Refund"
        confirmVariant="warning"
        onConfirm={() => confirm && handleRefund(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}