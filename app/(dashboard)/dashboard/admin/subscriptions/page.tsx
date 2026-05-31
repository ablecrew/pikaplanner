'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, Users, Store, Calendar, Clock, CheckCircle2, XCircle,
  Loader2, RefreshCw, AlertCircle, Sparkles, TrendingUp, TrendingDown,
  Search, Filter, Download, Eye, Ban, CheckCheck, CreditCard,
  Smartphone, ArrowUpRight, ArrowDownLeft, MoreHorizontal,
  BarChart3, PieChart, DollarSign, Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

type ProfileRow = {
  id: string
  full_name?: string
  email?: string
}

type VendorRow = {
  id: string
  business_name?: string
}

type Subscription = {
  id: string
  user_id: string
  vendor_id: string | null
  tier: string
  status: string
  starts_at: string
  expires_at: string | null
  amount_paid: number
  currency: string
  auto_renew: boolean
  mpesa_transaction_id: string | null
  created_at: string
  user_name?: string
  user_email?: string
  vendor_name?: string
}

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'KES 0'
  return `KES ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days > 0) return `${days} days`
  if (days === 0) return 'Today'
  return `Overdue ${Math.abs(days)} days`
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    expired: 'border-red-200 bg-red-50 text-red-700',
    cancelled: 'border-amber-200 bg-amber-50 text-amber-700',
    pending: 'border-sky-200 bg-sky-50 text-sky-700',
  }

  const icons: Record<string, React.ReactNode> = {
    active: <CheckCircle2 size={12} />,
    expired: <XCircle size={12} />,
    cancelled: <Ban size={12} />,
    pending: <Clock size={12} />,
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || 'border-gray-200 bg-gray-50 text-gray-600'}`}>
      {icons[status] || <Clock size={12} />}
      {status}
    </span>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    daily: 'border-sky-200 bg-sky-50 text-sky-700',
    weekly: 'border-violet-200 bg-violet-50 text-violet-700',
    monthly: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    yearly: 'border-amber-200 bg-amber-50 text-amber-700',
    freemium: 'border-slate-200 bg-slate-50 text-slate-600',
    premium: 'border-orange-200 bg-orange-50 text-orange-700',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${styles[tier] || 'border-gray-200 bg-gray-50 text-gray-600'}`}>
      {tier === 'premium' || tier === 'yearly' ? <Crown size={12} /> : <Calendar size={12} />}
      {tier}
    </span>
  )
}

export default function AdminSubscriptionsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch user subscriptions
      const { data: userSubs, error: ue } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (ue) throw ue

      // Fetch vendor subscriptions
      const { data: vendorSubs, error: ve } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (ve) throw ve

      // Get user names and emails
      const userIds = [...new Set((userSubs ?? []).map((s: any) => s.user_id).filter(Boolean))]
      const vendorIds = [...new Set((vendorSubs ?? []).map((s: any) => s.vendor_id).filter(Boolean))]

      const [{ data: profiles }, { data: vendors }] = await Promise.all([
        userIds.length > 0
          ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
          : Promise.resolve({ data: [] }),
        vendorIds.length > 0
          ? supabase.from('vendors').select('id, business_name').in('id', vendorIds)
          : Promise.resolve({ data: [] }),
      ])

      const profileMap = new Map<string, ProfileRow>(
        (profiles ?? []).map((p: any) => [p.id, p as ProfileRow])
      )

      const vendorMap = new Map<string, VendorRow>(
        (vendors ?? []).map((v: any) => [v.id, v as VendorRow])
      )

      // Map user subscriptions
      const userMapped: Subscription[] = (userSubs ?? []).map((s: any) => {
        const profile = profileMap.get(s.user_id)
        return {
          ...s,
          vendor_id: null,
          user_name: profile?.full_name || 'User',
          user_email: profile?.email || '',
          vendor_name: undefined,
        }
      })

      // Map vendor subscriptions
      const vendorMapped: Subscription[] = (vendorSubs ?? []).map((s: any) => {
        const vendor = vendorMap.get(s.vendor_id)
        return {
          ...s,
          user_id: s.vendor_id,
          user_name: vendor?.business_name || 'Vendor',
          user_email: '',
          vendor_name: vendor?.business_name || 'Vendor',
        }
      })

      setSubscriptions([...userMapped, ...vendorMapped])
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void fetchSubscriptions() }, [fetchSubscriptions])

  const stats = useMemo(() => {
    const total = subscriptions.length
    const active = subscriptions.filter(s => s.status === 'active').length
    const expired = subscriptions.filter(s => s.status === 'expired').length
    const revenue = subscriptions.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0)
    const monthly = subscriptions
      .filter(s => s.status === 'active' && s.tier === 'monthly')
      .reduce((sum, s) => sum + Number(s.amount_paid || 0), 0)
    const yearly = subscriptions
      .filter(s => s.status === 'active' && s.tier === 'yearly')
      .reduce((sum, s) => sum + Number(s.amount_paid || 0), 0)
    const freemium = subscriptions.filter(s => s.tier === 'freemium' && s.status === 'active').length
    const premium = subscriptions.filter(s => s.tier === 'premium' && s.status === 'active').length

    return { total, active, expired, revenue, monthly, yearly, freemium, premium }
  }, [subscriptions])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return subscriptions.filter(s => {
      const matchesSearch = !q || 
        (s.user_name?.toLowerCase() || '').includes(q) ||
        (s.user_email?.toLowerCase() || '').includes(q) ||
        s.tier.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter
      const matchesTier = tierFilter === 'All' || s.tier === tierFilter
      return matchesSearch && matchesStatus && matchesTier
    })
  }, [subscriptions, search, statusFilter, tierFilter])

  const tiers = useMemo(() => ['All', ...new Set(subscriptions.map(s => s.tier))], [subscriptions])
  const statuses = ['All', 'active', 'expired', 'cancelled', 'pending']

  const exportCsv = useCallback(() => {
    const rows = [
      ['ID', 'User/Vendor', 'Email', 'Tier', 'Status', 'Amount', 'Currency', 'Start', 'Expires', 'Auto Renew', 'M-Pesa Ref'],
      ...filtered.map(s => [
        s.id, s.user_name, s.user_email, s.tier, s.status, s.amount_paid, s.currency,
        s.starts_at, s.expires_at, s.auto_renew ? 'Yes' : 'No', s.mpesa_transaction_id || '—',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscriptions.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filtered])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            Subscriptions
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs font-bold text-amber-600">
              <Crown size={12} /> {stats.total} total
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage all user and vendor subscriptions across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => void fetchSubscriptions()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-6">
        {[
          { label: 'Total', value: String(stats.total), helper: 'All subscriptions', icon: Crown, accent: 'from-amber-500 to-amber-300' },
          { label: 'Active', value: String(stats.active), helper: `${stats.freemium} freemium · ${stats.premium} premium`, icon: CheckCircle2, accent: 'from-emerald-500 to-emerald-300' },
          { label: 'Expired', value: String(stats.expired), helper: 'Need renewal', icon: XCircle, accent: 'from-red-500 to-red-300' },
          { label: 'Revenue', value: formatMoney(stats.revenue), helper: 'Total collected', icon: DollarSign, accent: 'from-violet-500 to-fuchsia-300' },
          { label: 'Monthly', value: formatMoney(stats.monthly), helper: 'Active monthly MRR', icon: TrendingUp, accent: 'from-sky-500 to-sky-300' },
          { label: 'Yearly', value: formatMoney(stats.yearly), helper: 'Active yearly', icon: Wallet, accent: 'from-orange-500 to-amber-300' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -3 }} transition={{ duration: 0.18 }} className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.accent}`} />
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                <p className="mt-1 text-xl font-black tracking-tight text-gray-900">{s.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{s.helper}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                <s.icon size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search subscribers..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 text-gray-900"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1"><Filter size={12} /> Status:</span>
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === s ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s === 'All' ? 'All' : s}</button>
            ))}
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1 ml-2"><Filter size={12} /> Tier:</span>
            {tiers.map(t => (
              <button key={t} onClick={() => setTierFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tierFilter === t ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t === 'All' ? 'All' : t}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center"><Crown size={28} className="text-amber-500" /></div>
            <p className="text-gray-900 font-semibold">No subscriptions found</p>
            <p className="text-gray-400 text-sm text-center max-w-md">Subscriptions will appear here once users and vendors start subscribing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-50">
                  <th className="px-5 py-3.5 font-semibold">Subscriber</th>
                  <th className="px-5 py-3.5 font-semibold">Tier</th>
                  <th className="px-5 py-3.5 font-semibold">Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Start</th>
                  <th className="px-5 py-3.5 font-semibold">Expires</th>
                  <th className="px-5 py-3.5 font-semibold">Auto</th>
                  <th className="px-5 py-3.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSub(sub)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {sub.user_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{sub.user_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{sub.user_email || sub.vendor_name || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><TierBadge tier={sub.tier} /></td>
                    <td className="px-5 py-4 font-extrabold text-gray-900">{formatMoney(sub.amount_paid)}</td>
                    <td className="px-5 py-4"><StatusBadge status={sub.status} /></td>
                    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(sub.starts_at)}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      <div>
                        <p>{formatDate(sub.expires_at)}</p>
                        <p className="text-gray-400 mt-0.5">{formatRelativeTime(sub.expires_at)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {sub.auto_renew ? (
                        <span className="text-emerald-600 font-semibold">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={e => { e.stopPropagation(); setSelectedSub(sub) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                        <Eye size={15} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSub(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Subscription Details</p>
                    <h3 className="text-xl font-black text-gray-900 mt-1 capitalize">{selectedSub.tier} Plan</h3>
                  </div>
                  <div className="flex gap-2">
                    <TierBadge tier={selectedSub.tier} />
                    <StatusBadge status={selectedSub.status} />
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Subscriber', selectedSub.user_name || '—'],
                    ['Email', selectedSub.user_email || selectedSub.vendor_name || '—'],
                    ['Tier', selectedSub.tier],
                    ['Status', selectedSub.status],
                    ['Amount Paid', formatMoney(selectedSub.amount_paid)],
                    ['Currency', selectedSub.currency || 'KES'],
                    ['Auto Renew', selectedSub.auto_renew ? 'Yes' : 'No'],
                    ['M-Pesa Ref', selectedSub.mpesa_transaction_id || '—'],
                    ['Started', formatDate(selectedSub.starts_at)],
                    ['Expires', formatDate(selectedSub.expires_at)],
                    ['Created', formatDate(selectedSub.created_at)],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{l}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 border-t border-gray-100">
                <button onClick={() => setSelectedSub(null)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}