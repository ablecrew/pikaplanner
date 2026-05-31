'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, BellRing, Search, Filter, Trash2, Check, CheckCheck,
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2, ShoppingBag,
  DollarSign, Star, Info, Brain, Sparkles, AlertTriangle, Calendar,
  Settings, Eye, EyeOff, Archive, Volume2, Loader2, Award, Users,
  Gift, Receipt, ShoppingCart, ChefHat, CircleDollarSign, Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'

// ── Types ────────────────────────────────────────────────

type NotificationType = 'order' | 'payment' | 'review' | 'system' | 'ai' | 'marketing'
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'
type NotificationCategory = 'all' | 'unread' | NotificationType

type UserNotification = {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  body: string
  isRead: boolean
  isArchived: boolean
  createdAt: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  channel: 'in_app' | 'email' | 'sms' | 'push'
}

// ── Constants ────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  bg: string
  text: string
  border: string
  gradient: string
}> = {
  order:      { icon: ShoppingBag,    color: 'text-emerald-600', bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  gradient: 'from-emerald-500 to-emerald-600' },
  payment:    { icon: DollarSign,     color: 'text-blue-600',    bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',     gradient: 'from-blue-500 to-blue-600' },
  review:     { icon: Star,           color: 'text-amber-600',   bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    gradient: 'from-amber-500 to-amber-600' },
  system:     { icon: Info,           color: 'text-slate-600',   bg: 'bg-slate-50',    text: 'text-slate-700',    border: 'border-slate-200',    gradient: 'from-slate-500 to-slate-600' },
  ai:         { icon: Brain,          color: 'text-violet-600',  bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200',   gradient: 'from-violet-500 to-violet-600' },
  marketing:  { icon: Gift,           color: 'text-pink-600',    bg: 'bg-pink-50',     text: 'text-pink-700',     border: 'border-pink-200',     gradient: 'from-pink-500 to-pink-600' },
}

const PRIORITY_CONFIG: Record<NotificationPriority, {
  label: string
  color: string
  bg: string
  border: string
}> = {
  low:      { label: 'Low',      color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200' },
  medium:   { label: 'Medium',   color: 'text-blue-600',    bg: 'bg-blue-100',    border: 'border-blue-200' },
  high:     { label: 'High',     color: 'text-amber-600',   bg: 'bg-amber-100',   border: 'border-amber-200' },
  urgent:   { label: 'Urgent',   color: 'text-red-600',     bg: 'bg-red-100',     border: 'border-red-200' },
}

const CATEGORIES: { key: NotificationCategory; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'all',       label: 'All',          icon: Bell },
  { key: 'unread',    label: 'Unread',       icon: BellRing },
  { key: 'order',     label: 'Orders',       icon: ShoppingBag },
  { key: 'payment',   label: 'Payments',     icon: DollarSign },
  { key: 'review',    label: 'Reviews',      icon: Star },
  { key: 'ai',        label: 'AI Alerts',    icon: Brain },
  { key: 'system',    label: 'System',       icon: Info },
]

// ── Helpers ──────────────────────────────────────────────

function formatTimeAgo(iso?: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(iso?: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function groupByDate(notifications: UserNotification[]): { label: string; items: UserNotification[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000

  const groups: Record<string, UserNotification[]> = {
    'Today': [],
    'Yesterday': [],
    'Older': [],
  }

  notifications.forEach(n => {
    const t = new Date(n.createdAt).getTime()
    if (t >= today) groups['Today'].push(n)
    else if (t >= yesterday) groups['Yesterday'].push(n)
    else groups['Older'].push(n)
  })

  return Object.entries(groups)
    .filter(([_, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

const supabase = createClient()

// ── MAIN PAGE ────────────────────────────────────────────

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<NotificationCategory>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'clear'; id?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // ── Fetch User Notifications ───────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch dynamic order alerts
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, vendor_id')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('created_at', { ascending: false })

      // Batch fetch vendor names
      const vendorIds = [...new Set((recentOrders || []).map((o: any) => o.vendor_id).filter(Boolean))]
      const { data: vendors } = vendorIds.length > 0
        ? await supabase.from('vendors').select('id, business_name').in('id', vendorIds)
        : { data: [] }
      const vendorMap = new Map((vendors || []).map((v: any) => [v.id, v.business_name]))

      const orderNotifications: UserNotification[] = (recentOrders || []).map((o: any) => {
        const vendorName = vendorMap.get(o.vendor_id) || 'Pika Kitchen'
        let priority: NotificationPriority = 'medium'
        let title = 'Order Confirmed'
        let message = `Your order #${o.order_number} from ${vendorName} is being prepared!`
        let type: NotificationType = 'order'

        if (o.status === 'Pending') {
          title = 'Order Received'
          message = `Your order #${o.order_number} has been received by ${vendorName}.`
        } else if (o.status === 'Ready') {
          title = 'Meal Ready!'
          message = `Your meal is ready for collection or dispatch from ${vendorName}.`
          priority = 'high'
        } else if (o.status === 'Out for Delivery') {
          title = 'Order Out for Delivery'
          message = `Your order #${o.order_number} is on the way!`
          priority = 'high'
        } else if (o.status === 'Delivered') {
          title = 'Order Delivered'
          message = `Enjoy your meal from ${vendorName}!`
          priority = 'low'
        } else if (o.status === 'Cancelled') {
          title = 'Order Cancelled'
          message = `Your order #${o.order_number} from ${vendorName} was cancelled.`
          priority = 'urgent'
          type = 'system'
        }

        return {
          id: `order-notif-${o.id}`,
          type,
          priority,
          title,
          message,
          body: `${message}\nOrder Ref: #${o.order_number}\nAmount: KES ${Number(o.total_amount).toLocaleString()}\n\nTrack order progress in your active orders dashboard to contact courier.`,
          isRead: !['Pending', 'Preparing', 'Out for Delivery'].includes(o.status),
          isArchived: false,
          createdAt: o.created_at,
          actionUrl: '/dashboard/user/orders',
          actionLabel: 'Track Order',
          channel: 'in_app',
        }
      })

      // Fetch stored notification logs
      const { data: logs, error: logsErr } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })

      if (logsErr) throw logsErr

      const dbNotifications: UserNotification[] = (logs || []).map((l: any) => {
        const title = l.title || 'Alert'
        let type: NotificationType = 'system'
        if (title.toLowerCase().includes('order') || l.metadata?.trigger === 'order') type = 'order'
        else if (title.toLowerCase().includes('payment') || title.toLowerCase().includes('convenience')) type = 'payment'
        else if (title.toLowerCase().includes('review') || title.toLowerCase().includes('rating')) type = 'review'
        else if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('insight')) type = 'ai'
        else if (title.toLowerCase().includes('market') || title.toLowerCase().includes('promo')) type = 'marketing'

        return {
          id: l.id,
          type,
          priority: 'medium',
          title,
          message: l.body || title,
          body: l.body || title,
          isRead: Boolean(l.is_read),
          isArchived: false,
          createdAt: l.sent_at || l.created_at,
          channel: l.channel || 'in_app',
        }
      })

      const combined = [...orderNotifications, ...dbNotifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setNotifications(combined)
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  // ── Filters & Search ───────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return notifications.filter(n => {
      if (n.isArchived) return false

      const matchSearch = !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)

      let matchCategory = true
      if (category === 'unread') matchCategory = !n.isRead
      else if (category !== 'all') matchCategory = n.type === category

      return matchSearch && matchCategory
    })
  }, [notifications, search, category])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  // ── Calculated Statistics ──────────────────────────────
  const stats = useMemo(() => {
    const active = notifications.filter(n => !n.isRead && !n.isArchived)
    const unread = active.length
    const urgent = active.filter(n => n.priority === 'urgent' || n.priority === 'high').length
    const today = notifications.filter(n => {
      const t = new Date(n.createdAt).getTime()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      return t >= todayStart.getTime() && !n.isArchived
    }).length

    const byType = {
      order: notifications.filter(n => n.type === 'order' && !n.isArchived).length,
      payment: notifications.filter(n => n.type === 'payment' && !n.isArchived).length,
      review: notifications.filter(n => n.type === 'review' && !n.isArchived).length,
      ai: notifications.filter(n => n.type === 'ai' && !n.isArchived).length,
    }

    return { total: notifications.filter(n => !n.isArchived).length, unread, urgent, today, byType }
  }, [notifications])

  // ── Expand/Mark Read Action ────────────────────────────
  const toggleExpanded = useCallback(async (id: string, isRead: boolean) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

    if (!isRead) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      if (!id.startsWith('order-notif-')) {
        await supabase.from('notification_logs').update({ is_read: true }).eq('id', id)
      }
    }
  }, [])

  const markAllRead = async () => {
    setActionLoadingId('all-read')
    try {
      const unreadIds = notifications.filter(n => !n.isRead && !n.id.startsWith('order-notif-')).map(n => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('notification_logs').update({ is_read: true }).in('id', unreadIds)
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setInfoMessage('✓ All notifications marked as read')
      setTimeout(() => setInfoMessage(null), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoadingId(null)
    }
  }

  const deleteNotification = async (id: string) => {
    setActionLoadingId(id)
    try {
      if (!id.startsWith('order-notif-')) {
        await supabase.from('notification_logs').delete().eq('id', id)
      }
      setNotifications(prev => prev.filter(n => n.id !== id))
      setInfoMessage('✓ Notification deleted successfully')
      setTimeout(() => setInfoMessage(null), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const clearAllNotifications = async () => {
    setActionLoadingId('clear-all')
    try {
      const deletableIds = notifications.filter(n => !n.id.startsWith('order-notif-')).map(n => n.id)
      if (deletableIds.length > 0) {
        await supabase.from('notification_logs').delete().in('id', deletableIds)
      }
      setNotifications(prev => prev.filter(n => n.id.startsWith('order-notif-')))
      setInfoMessage('✓ Notification logs cleared')
      setTimeout(() => setInfoMessage(null), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.type === 'clear') clearAllNotifications()
    else if (confirm.type === 'delete' && confirm.id) deleteNotification(confirm.id)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <PageHeader
        title="Notifications"
        subtitle={`${stats.unread} unread alerts requiring attention.`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:shadow-lg transition"
            >
              <CheckCheck size={15} /> Mark all read
            </button>
            <button
              onClick={() => setConfirm({ type: 'clear' })}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Trash2 size={15} /> Clear all
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

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Unread Alerts', value: stats.unread, icon: BellRing, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
          { label: 'Critical Items', value: stats.urgent, icon: AlertTriangle, color: 'bg-red-50 text-red-600', border: 'border-red-100' },
          { label: 'Recent Orders', value: stats.byType.order, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
          { label: 'Total Received', value: stats.total, icon: Bell, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <div className={`p-2 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categories</p>
            <div className="space-y-1">
              {CATEGORIES.map(cat => {
                const count = cat.key === 'all' ? stats.total
                  : cat.key === 'unread' ? stats.unread
                  : stats.byType[cat.key as keyof typeof stats.byType] || 0
                const Icon = cat.icon
                const isActive = category === cat.key

                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-100'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} />
                      <span className="capitalize">{cat.label}</span>
                    </div>
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
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

        {/* List Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alerts, content, metadata..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition text-gray-900"
              />
            </div>
          </div>

          {/* List Items */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : grouped.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <BellOff size={28} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-800 text-lg">No alerts found</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">When new store updates or order statuses are triggered, they will display here.</p>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.label}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                    {group.items.length}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                </div>

                <div className="space-y-2.5">
                  {group.items.map(notif => {
                    const typeCfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG['system']
                    const priorityCfg = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG['medium']
                    const isExpanded = expandedIds.has(notif.id)
                    const TypeIcon = typeCfg.icon

                    return (
                      <div
                        key={notif.id}
                        onClick={() => toggleExpanded(notif.id, notif.isRead)}
                        className={`group relative rounded-2xl border transition-all cursor-pointer ${
                          notif.isRead
                            ? 'border-gray-100 bg-white hover:border-gray-200'
                            : `${typeCfg.border} bg-white shadow-sm hover:shadow-md`
                        } p-4 pl-5 flex items-start gap-4`}
                      >
                        {/* Priority indicator stripe */}
                        {!notif.isRead && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${typeCfg.gradient}`} />
                        )}

                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${typeCfg.bg} ${typeCfg.color} transition-transform group-hover:scale-105`}>
                          <TypeIcon size={18} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-bold text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notif.title}
                              </h4>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}>
                                {notif.priority === 'urgent' && <AlertTriangle size={9} />}
                                {priorityCfg.label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>

                          <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                            {notif.message}
                          </p>

                          {/* Expandable details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 pt-3 border-t border-gray-100"
                              >
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                  {notif.body || notif.message}
                                </p>

                                {/* Metadata details */}
                                {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    {Object.entries(notif.metadata).map(([key, value]) => (
                                      <div key={key} className="rounded-lg bg-gray-50 p-2">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">
                                          {key.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-800 truncate">
                                          {String(value)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Channel and timestamp details */}
                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                  <Clock size={12} />
                                  <span>{formatFullDate(notif.createdAt)}</span>
                                  <span className="text-gray-300">·</span>
                                  <span className="uppercase">{notif.channel.replace('_', ' ')}</span>
                                </div>

                                {/* Custom quick action triggers */}
                                <div className="mt-3 flex items-center gap-2">
                                  {notif.actionUrl && (
                                    <a
                                      href={notif.actionUrl}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${typeCfg.gradient} text-white text-xs font-bold shadow-sm hover:shadow-md transition`}
                                    >
                                      {notif.actionLabel || 'View Details'}
                                      <ChevronRight size={12} />
                                    </a>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setConfirm({ type: 'delete', id: notif.id }) }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition"
                                  >
                                    <Trash2 size={12} /> Delete Alert
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Expand status indicator */}
                        <div className="flex-shrink-0 pt-1 text-gray-400">
                          <ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.type === 'clear' ? 'Clear All Notifications' : 'Delete Notification'}
        message={
          confirm?.type === 'clear'
            ? 'Are you sure you want to clear all notification logs? This action is permanent and cannot be undone.'
            : 'Are you sure you want to delete this notification alert?'
        }
        confirmLabel={confirm?.type === 'clear' ? 'Clear All' : 'Delete'}
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}
