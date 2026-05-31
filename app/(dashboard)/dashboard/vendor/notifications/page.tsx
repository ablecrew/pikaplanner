'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, BellRing, Search, Filter, Trash2, Check, CheckCheck,
  ChevronDown, ChevronRight, MoreHorizontal, RefreshCw, AlertCircle,
  CheckCircle2, ShoppingBag, DollarSign, Star, Info, Brain, Sparkles,
  Zap, Package, Truck, Clock, XCircle, Heart, MessageSquare, TrendingUp,
  AlertTriangle, Calendar, Settings, Eye, EyeOff, Archive, Volume2,
  VolumeX, Loader2, Sparkle, Target, Award, Rocket, Users, Gift,
  CircleDollarSign, Receipt, ShoppingCart, ChefHat, UtensilsCrossed
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// ── Types ────────────────────────────────────────────────

type NotificationType = 'order' | 'payment' | 'review' | 'system' | 'ai' | 'marketing' | 'promotion'
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'
type NotificationCategory = 'all' | 'unread' | NotificationType

type Notification = {
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
  promotion:  { icon: Sparkles,       color: 'text-orange-600',  bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-200',   gradient: 'from-orange-500 to-orange-600' },
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
  { key: 'ai',        label: 'AI Insights',  icon: Brain },
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
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(iso?: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const thisWeek = today - 7 * 86400000

  const groups: Record<string, Notification[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Older': [],
  }

  notifications.forEach(n => {
    const t = new Date(n.createdAt).getTime()
    if (t >= today) groups['Today'].push(n)
    else if (t >= yesterday) groups['Yesterday'].push(n)
    else if (t >= thisWeek) groups['This Week'].push(n)
    else groups['Older'].push(n)
  })

  return Object.entries(groups)
    .filter(([_, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

// ── Skeleton ─────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

// ── Notification Item ────────────────────────────────────

function NotificationItem({
  notification,
  isExpanded,
  onToggle,
  onMarkRead,
  onArchive,
  onDelete,
  actionLoadingId,
}: {
  notification: Notification
  isExpanded: boolean
  onToggle: () => void
  onMarkRead: () => void
  onArchive: () => void
  onDelete: () => void
  actionLoadingId: string | null
}) {
  const typeCfg = TYPE_CONFIG[notification.type]
  const priorityCfg = PRIORITY_CONFIG[notification.priority]
  const TypeIcon = typeCfg.icon
  const isLoading = actionLoadingId === notification.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border transition-all overflow-hidden ${
        notification.isRead
          ? 'border-gray-100 bg-white hover:border-gray-200'
          : `${typeCfg.border} bg-gradient-to-br ${notification.priority === 'urgent' ? 'from-red-50/50 to-white' : 'from-white to-white'} hover:shadow-md`
      }`}
    >
      {/* Priority indicator stripe */}
      {!notification.isRead && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${typeCfg.gradient}`} />
      )}

      {/* Urgent pulse */}
      {!notification.isRead && notification.priority === 'urgent' && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        </div>
      )}

      {/* Main clickable header */}
      <div
        onClick={() => {
          onToggle()
          if (!notification.isRead) onMarkRead()
        }}
        className="w-full text-left p-4 pl-5 flex items-start gap-4 cursor-pointer"
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${typeCfg.bg} ${typeCfg.color} transition-transform group-hover:scale-105`}>
          <TypeIcon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-bold text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}>
                {notification.priority === 'urgent' && <AlertTriangle size={9} />}
                {priorityCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${typeCfg.bg} ${typeCfg.text}`}>
                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
              </span>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>

          <p className={`text-sm leading-relaxed ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>

          {/* Expanded content */}
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
                  {notification.body || notification.message}
                </p>

                {/* Metadata */}
                {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {Object.entries(notification.metadata).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-gray-50 p-2">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Full timestamp */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{formatFullDate(notification.createdAt)}</span>
                  <span className="text-gray-300">·</span>
                  <span className="uppercase">{notification.channel.replace('_', ' ')}</span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${typeCfg.gradient} text-white text-xs font-bold shadow-sm hover:shadow-md transition`}
                    >
                      {notification.actionLabel || 'View Details'}
                      <ChevronRight size={12} />
                    </a>
                  )}
                  {!notification.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onMarkRead() }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                    >
                      <Check size={12} /> Mark as Read
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onArchive() }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    <Archive size={12} /> Archive
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete() }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0 pt-1">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            <ChevronRight size={18} />
          </motion.div>
        </div>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="absolute top-4 left-2 flex items-center justify-center">
          <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${typeCfg.gradient}`} />
        </div>
      )}
    </motion.div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────

export default function VendorNotificationsPage() {
  const supabase = createClient()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<NotificationCategory>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'deleteAll' | 'archiveAll'; id?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    sms: false,
    orderAlerts: true,
    paymentAlerts: true,
    reviewAlerts: true,
    aiInsights: true,
    marketing: false,
  })

  // ── Fetch Data ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get vendor ID for context
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      // Fetch notifications from notification_logs
      const { data: rows, error: notifErr } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(200)

      if (notifErr) throw notifErr

      // Also fetch recent orders to create order notifications dynamically
      if (vendor) {
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id, order_number, status, total_amount, created_at, customer_email')
          .eq('vendor_id', vendor.id)
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .order('created_at', { ascending: false })
          .limit(20)

        // Get user IDs for customer names
        const userIds = [...new Set((recentOrders || []).map((o: any) => o.user_id).filter(Boolean))]
        const { data: profiles } = userIds.length > 0
          ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
          : { data: [] as { id: string; full_name: string | null }[] }
        const profileMap = new Map((profiles || []).map((p: { id: any; full_name: any }) => [p.id, p.full_name]))

        // Create order notifications
        const orderNotifs: Notification[] = (recentOrders || []).map((o: any) => {
          const customerName = profileMap.get(o.user_id) || o.customer_email?.split('@')[0] || 'Customer'
          let priority: NotificationPriority = 'medium'
          if (o.status === 'Pending') priority = 'high'
          if (o.status === 'Cancelled') priority = 'urgent'

          return {
            id: `order-${o.id}`,
            type: 'order' as NotificationType,
            priority,
            title: o.status === 'Pending' ? '🛍️ New Order Received!' :
                   o.status === 'Delivered' ? '✅ Order Delivered' :
                   o.status === 'Cancelled' ? '❌ Order Cancelled' :
                   `Order ${o.status}`,
            message: `${customerName} placed order #${o.order_number} for KES ${Number(o.total_amount).toLocaleString()}`,
            body: `Order #${o.order_number}\nCustomer: ${customerName}\nAmount: KES ${Number(o.total_amount).toLocaleString()}\nStatus: ${o.status}\n\nReview this order in your orders dashboard to take action.`,
            isRead: o.status !== 'Pending',
            isArchived: false,
            createdAt: o.created_at,
            actionUrl: '/dashboard/vendor/orders',
            actionLabel: 'View Order',
            metadata: {
              order_number: o.order_number,
              amount: `KES ${Number(o.total_amount).toLocaleString()}`,
              status: o.status,
              customer: customerName,
            },
            channel: 'in_app',
          }
        })

        // Combine with DB notifications
        const dbNotifs: Notification[] = (rows || []).map((n: any) => {
          const title = n.title || 'Notification'
          let type: NotificationType = 'system'
          if (title.toLowerCase().includes('order') || n.metadata?.trigger === 'order') type = 'order'
          else if (title.toLowerCase().includes('payment') || title.toLowerCase().includes('withdraw')) type = 'payment'
          else if (title.toLowerCase().includes('review') || title.toLowerCase().includes('rating')) type = 'review'
          else if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('insight')) type = 'ai'
          else if (title.toLowerCase().includes('promo') || title.toLowerCase().includes('offer')) type = 'promotion'
          else if (title.toLowerCase().includes('welcome') || title.toLowerCase().includes('market')) type = 'marketing'

          return {
            id: n.id,
            type,
            priority: 'medium' as NotificationPriority,
            title,
            message: n.body || title,
            body: n.body || title,
            isRead: Boolean(n.is_read),
            isArchived: false,
            createdAt: n.sent_at || n.created_at,
            actionUrl: undefined,
            actionLabel: undefined,
            metadata: n.metadata || {},
            channel: (n.channel as any) || 'in_app',
          }
        })

        // Sort combined by date
        const combined = [...orderNotifs, ...dbNotifs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setNotifications(combined)
      } else {
        const dbNotifs: Notification[] = (rows || []).map((n: any) => ({
          id: n.id,
          type: 'system' as NotificationType,
          priority: 'medium' as NotificationPriority,
          title: n.title || 'Notification',
          message: n.body || n.title || '',
          body: n.body || n.title || '',
          isRead: Boolean(n.is_read),
          isArchived: false,
          createdAt: n.sent_at || n.created_at,
          actionUrl: undefined,
          actionLabel: undefined,
          metadata: n.metadata || {},
          channel: (n.channel as any) || 'in_app',
        }))
        setNotifications(dbNotifs)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  // ── Filtered ───────────────────────────────────────────
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

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const unread = notifications.filter(n => !n.isRead && !n.isArchived).length
    const urgent = notifications.filter(n => n.priority === 'urgent' && !n.isRead && !n.isArchived).length
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

    return { unread, urgent, today, total: notifications.filter(n => !n.isArchived).length, byType }
  }, [notifications])

  // ── AI Summary ─────────────────────────────────────────
  const aiSummary = useMemo(() => {
    const insights: { icon: React.ReactNode; title: string; description: string; color: string }[] = []

    if (stats.unread > 10) {
      insights.push({
        icon: <BellRing size={16} />,
        title: `${stats.unread} Unread Notifications`,
        description: 'You have a backlog. Consider reviewing and clearing them to stay focused.',
        color: 'amber'
      })
    }

    if (stats.urgent > 0) {
      insights.push({
        icon: <AlertTriangle size={16} />,
        title: `${stats.urgent} Urgent Items`,
        description: 'Critical notifications require immediate attention. Review them first.',
        color: 'red'
      })
    }

    if (stats.byType.order > 5) {
      insights.push({
        icon: <ShoppingBag size={16} />,
        title: `${stats.byType.order} Order Updates`,
        description: 'Your store is active. Ensure timely order fulfillment to maintain ratings.',
        color: 'emerald'
      })
    }

    if (stats.byType.review > 0) {
      insights.push({
        icon: <Star size={16} />,
        title: `${stats.byType.review} New Reviews`,
        description: 'Customer feedback received. Respond to reviews to build loyalty.',
        color: 'violet'
      })
    }

    if (insights.length === 0) {
      insights.push({
        icon: <Sparkles size={16} />,
        title: 'All Caught Up!',
        description: 'No urgent notifications. Great job staying on top of things.',
        color: 'emerald'
      })
    }

    return insights
  }, [stats])

  // ── Actions ────────────────────────────────────────────
  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const markAsRead = async (id: string) => {
    setActionLoadingId(id)
    try {
      // Update in DB if it's a real notification_logs entry
      if (!id.startsWith('order-')) {
        await supabase
          .from('notification_logs')
          .update({ is_read: true })
          .eq('id', id)
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const markAllAsRead = async () => {
    setActionLoadingId('all')
    try {
      const unreadIds = notifications.filter(n => !n.isRead && !n.id.startsWith('order-')).map(n => n.id)
      if (unreadIds.length > 0) {
        await supabase
          .from('notification_logs')
          .update({ is_read: true })
          .in('id', unreadIds)
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setInfoMessage('All notifications marked as read')
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      setError('Failed to mark all as read')
    } finally {
      setActionLoadingId(null)
    }
  }

  const archiveNotification = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: true } : n))
    setInfoMessage('Notification archived')
  }

  const deleteNotification = async (id: string) => {
    setActionLoadingId(id)
    try {
      if (!id.startsWith('order-')) {
        await supabase.from('notification_logs').delete().eq('id', id)
      }
      setNotifications(prev => prev.filter(n => n.id !== id))
      setInfoMessage('Notification deleted')
    } catch (err) {
      console.error('Failed to delete:', err)
      setError('Failed to delete notification')
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const deleteAllRead = async () => {
    setActionLoadingId('deleteAll')
    try {
      const readIds = notifications
        .filter(n => n.isRead && !n.id.startsWith('order-'))
        .map(n => n.id)
      if (readIds.length > 0) {
        await supabase.from('notification_logs').delete().in('id', readIds)
      }
      setNotifications(prev => prev.filter(n => !n.isRead || n.id.startsWith('order-')))
      setInfoMessage('Read notifications deleted')
    } catch (err) {
      console.error('Failed to delete all:', err)
      setError('Failed to delete notifications')
    } finally {
      setActionLoadingId(null)
      setConfirm(null)
    }
  }

  const handleConfirm = () => {
    if (!confirm) return
    if (confirm.type === 'delete' && confirm.id) deleteNotification(confirm.id)
    else if (confirm.type === 'deleteAll') deleteAllRead()
    setConfirm(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Notifications</h1>
            {stats.unread > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-md shadow-red-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                {stats.unread} new
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">Stay updated with orders, payments, reviews, and AI insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={setPreferencesOpen.bind(null, true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Settings size={15} /> Preferences
          </button>
          <button
            onClick={() => void fetchNotifications()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={actionLoadingId === 'all'}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {actionLoadingId === 'all' ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
              Mark All Read
            </button>
          )}
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

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Bell, color: 'bg-blue-500', accent: 'bg-blue-50' },
          { label: 'Unread', value: stats.unread, icon: BellRing, color: 'bg-amber-500', accent: 'bg-amber-50' },
          { label: 'Urgent', value: stats.urgent, icon: AlertTriangle, color: 'bg-red-500', accent: 'bg-red-50' },
          { label: 'Today', value: stats.today, icon: Calendar, color: 'bg-emerald-500', accent: 'bg-emerald-50' },
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
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain size={16} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Notification Summary</h3>
            <p className="text-xs text-gray-500">Smart overview of your notification activity</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {aiSummary.map((insight, i) => {
            const colors: Record<string, string> = {
              emerald: 'border-l-emerald-500 bg-emerald-50/30 text-emerald-700',
              red: 'border-l-red-500 bg-red-50/30 text-red-700',
              amber: 'border-l-amber-500 bg-amber-50/30 text-amber-700',
              violet: 'border-l-violet-500 bg-violet-50/30 text-violet-700',
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
                  <div>{insight.icon}</div>
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

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Category Filter */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filter by Type</p>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
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
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} />
                      <span>{cat.label}</span>
                    </div>
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20' : 'bg-gray-100'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</p>
            <button
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck size={15} className="text-emerald-600" /> Mark All Read
            </button>
            <button
              onClick={() => setConfirm({ type: 'deleteAll' })}
              disabled={notifications.filter(n => n.isRead).length === 0}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={15} className="text-red-600" /> Delete All Read
            </button>
          </div>

          {/* Sound Toggle */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Volume2 size={18} className="text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Sound Alerts</p>
                <p className="text-xs text-gray-500">Play sound for new notifications</p>
              </div>
              <button className="relative w-11 h-6 rounded-full bg-violet-500 transition">
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform translate-x-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition text-gray-900"
              />
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : grouped.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <BellOff size={32} className="text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg mb-1">
                  {search ? 'No notifications found' : category === 'unread' ? 'All caught up!' : 'No notifications'}
                </p>
                <p className="text-gray-400 text-sm max-w-md">
                  {search
                    ? 'Try different keywords or clear your search.'
                    : category === 'unread'
                    ? "You've read all your notifications. Great job staying on top of things!"
                    : 'When you receive orders, payments, or reviews, they will appear here.'}
                </p>
              </div>
              {(search || category !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setCategory('all') }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.label}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                    {group.items.length}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {group.items.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        isExpanded={expanded.has(notif.id)}
                        onToggle={() => toggleExpanded(notif.id)}
                        onMarkRead={() => markAsRead(notif.id)}
                        onArchive={() => archiveNotification(notif.id)}
                        onDelete={() => setConfirm({ type: 'delete', id: notif.id })}
                        actionLoadingId={actionLoadingId}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preferences Modal */}
      <Modal isOpen={preferencesOpen} onClose={() => setPreferencesOpen(false)} title="Notification Preferences" size="md">
        <div className="space-y-5 -mx-2 px-2">
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Delivery Channels</h4>
            <div className="space-y-2">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email', icon: '📧' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser and mobile push alerts', icon: '🔔' },
                { key: 'sms', label: 'SMS Notifications', desc: 'Text message alerts for critical items', icon: '💬' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[item.key as keyof typeof preferences] as boolean}
                    onChange={(e) => setPreferences(p => ({ ...p, [item.key]: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Notification Types</h4>
            <div className="space-y-2">
              {[
                { key: 'orderAlerts', label: 'Order Alerts', desc: 'New orders, status changes, cancellations', icon: <ShoppingBag size={16} /> },
                { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Payments, withdrawals, refunds', icon: <DollarSign size={16} /> },
                { key: 'reviewAlerts', label: 'Review Alerts', desc: 'New customer reviews and ratings', icon: <Star size={16} /> },
                { key: 'aiInsights', label: 'AI Insights', desc: 'Smart predictions and recommendations', icon: <Brain size={16} /> },
                { key: 'marketing', label: 'Marketing & Promotions', desc: 'Offers, tips, and platform updates', icon: <Gift size={16} /> },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[item.key as keyof typeof preferences] as boolean}
                    onChange={(e) => setPreferences(p => ({ ...p, [item.key]: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => setPreferencesOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => { setPreferencesOpen(false); setInfoMessage('Preferences saved successfully') }}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg transition"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.type === 'delete' ? 'Delete Notification' : 'Delete All Read Notifications'}
        message={
          confirm?.type === 'delete'
            ? 'This notification will be permanently deleted. This cannot be undone.'
            : `Delete all ${notifications.filter(n => n.isRead).length} read notifications? This cannot be undone.`
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}
