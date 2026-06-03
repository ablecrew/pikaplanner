'use client'

import { useState, useMemo, useCallback, memo, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, BellRing, Search, Trash2, Check, CheckCheck,
  ChevronRight, AlertCircle, CheckCircle2, ShoppingBag,
  DollarSign, Star, Info, Brain, AlertTriangle, Clock, Gift
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { 
  UserNotification, NotificationType, NotificationPriority, 
  markAsReadAction, markAllReadAction, deleteNotificationAction, clearAllNotificationsAction 
} from './actions'

type NotificationCategory = 'all' | 'unread' | NotificationType

const TYPE_CONFIG: Record<NotificationType, { icon: React.ComponentType<{ size?: number }>; color: string; bg: string; border: string; gradient: string }> = {
  order:     { icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
  payment:   { icon: DollarSign,  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    gradient: 'from-blue-500 to-blue-600' },
  review:    { icon: Star,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   gradient: 'from-amber-500 to-amber-600' },
  system:    { icon: Info,        color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   gradient: 'from-slate-500 to-slate-600' },
  ai:        { icon: Brain,       color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200',  gradient: 'from-violet-500 to-violet-600' },
  marketing: { icon: Gift,        color: 'text-pink-600',    bg: 'bg-pink-50',    border: 'border-pink-200',    gradient: 'from-pink-500 to-pink-600' },
}

const PRIORITY_CONFIG: Record<NotificationPriority, { label: string; color: string; bg: string; border: string }> = {
  low:    { label: 'Low',    color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  medium: { label: 'Medium', color: 'text-blue-600',  bg: 'bg-blue-100',  border: 'border-blue-200' },
  high:   { label: 'High',   color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  urgent: { label: 'Urgent', color: 'text-red-600',   bg: 'bg-red-100',   border: 'border-red-200' },
}

const CATEGORIES: { key: NotificationCategory; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'all',     label: 'All',      icon: Bell },
  { key: 'unread',  label: 'Unread',   icon: BellRing },
  { key: 'order',   label: 'Orders',   icon: ShoppingBag },
  { key: 'payment', label: 'Payments', icon: DollarSign },
  { key: 'review',  label: 'Reviews',  icon: Star },
  { key: 'ai',      label: 'AI Alerts',icon: Brain },
  { key: 'system',  label: 'System',   icon: Info },
]

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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(iso?: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function groupByDate(notifications: UserNotification[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const groups: Record<string, UserNotification[]> = { 'Today': [], 'Yesterday': [], 'Older': [] }
  notifications.forEach(n => {
    const t = new Date(n.createdAt).getTime()
    if (t >= today) groups['Today'].push(n)
    else if (t >= yesterday) groups['Yesterday'].push(n)
    else groups['Older'].push(n)
  })
  return Object.entries(groups).filter(([_, items]) => items.length > 0).map(([label, items]) => ({ label, items }))
}

// ── Memoized Notification Item (Prevents list re-renders) ──
const NotificationItem = memo(function NotificationItem({ 
  notif, isExpanded, onToggle, onDelete, isDeleting 
}: { 
  notif: UserNotification, isExpanded: boolean, onToggle: () => void, onDelete: () => void, isDeleting: boolean 
}) {
  const typeCfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG['system']
  const priorityCfg = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG['medium']
  const TypeIcon = typeCfg.icon

  return (
    <div onClick={onToggle} className={`group relative rounded-2xl border transition-all cursor-pointer ${notif.isRead ? 'border-gray-100 bg-white hover:border-gray-200' : `${typeCfg.border} bg-white shadow-sm hover:shadow-md`} p-4 pl-5 flex items-start gap-4`}>
      {!notif.isRead && <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${typeCfg.gradient}`} />}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${typeCfg.bg} ${typeCfg.color} transition-transform group-hover:scale-105`}><TypeIcon size={18} /></div>
      
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-bold text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h4>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}>
              {notif.priority === 'urgent' && <AlertTriangle size={9} />} {priorityCfg.label}
            </span>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">{formatTimeAgo(notif.createdAt)}</span>
        </div>
        <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>{notif.message}</p>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{notif.body || notif.message}</p>
              {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {Object.entries(notif.metadata).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">{key.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-semibold text-gray-800 truncate">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <Clock size={12} /><span>{formatFullDate(notif.createdAt)}</span><span className="text-gray-300">·</span><span className="uppercase">{notif.channel.replace('_', ' ')}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {notif.actionUrl && (
                  <a href={notif.actionUrl} onClick={(e) => e.stopPropagation()} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${typeCfg.gradient} text-white text-xs font-bold shadow-sm hover:shadow-md transition`}>
                    {notif.actionLabel || 'View Details'} <ChevronRight size={12} />
                  </a>
                )}
                <button onClick={(e) => { e.stopPropagation(); onDelete() }} disabled={isDeleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50">
                  <Trash2 size={12} /> Delete Alert
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex-shrink-0 pt-1 text-gray-400"><ChevronRight size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} /></div>
    </div>
  )
})

// ── Main Client Component ──
export default function UserNotificationsClient({ initialNotifications }: { initialNotifications: UserNotification[] }) {
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<NotificationCategory>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'clear'; id?: string } | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const showInfo = (msg: string) => { setInfoMessage(msg); setTimeout(() => setInfoMessage(null), 3000) }

  const toggleExpanded = useCallback(async (id: string, isRead: boolean) => {
    setExpandedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
    if (!isRead) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      if (!id.startsWith('order-notif-')) await markAsReadAction(id)
    }
  }, [])

  const markAllRead = async () => {
    setActionLoadingId('all-read')
    const unreadIds = notifications.filter(n => !n.isRead && !n.id.startsWith('order-notif-')).map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    if (unreadIds.length > 0) await markAllReadAction(unreadIds)
    showInfo('✓ All notifications marked as read')
    setActionLoadingId(null)
  }

  const deleteNotification = async (id: string) => {
    setActionLoadingId(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (!id.startsWith('order-notif-')) await deleteNotificationAction(id)
    showInfo('✓ Notification deleted successfully')
    setActionLoadingId(null)
    setConfirm(null)
  }

  const clearAllNotifications = async () => {
    setActionLoadingId('clear-all')
    const deletableIds = notifications.filter(n => !n.id.startsWith('order-notif-')).map(n => n.id)
    setNotifications(prev => prev.filter(n => n.id.startsWith('order-notif-')))
    if (deletableIds.length > 0) await clearAllNotificationsAction(deletableIds)
    showInfo('✓ Notification logs cleared')
    setActionLoadingId(null)
    setConfirm(null)
  }

  // Instant in-memory filtering
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return notifications.filter(n => {
      if (n.isArchived) return false
      const matchSearch = !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      const matchCategory = category === 'all' ? true : category === 'unread' ? !n.isRead : n.type === category
      return matchSearch && matchCategory
    })
  }, [notifications, search, category])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const stats = useMemo(() => {
    const active = notifications.filter(n => !n.isRead && !n.isArchived)
    return {
      total: notifications.filter(n => !n.isArchived).length,
      unread: active.length,
      urgent: active.filter(n => n.priority === 'urgent' || n.priority === 'high').length,
      byType: { order: 0, payment: 0, review: 0, ai: 0 }
    }
  }, [notifications])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <PageHeader
        title="Notifications"
        subtitle={`${stats.unread} unread alerts requiring attention.`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} disabled={actionLoadingId === 'all-read'} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:shadow-lg transition disabled:opacity-50">
              <CheckCheck size={15} /> Mark all read
            </button>
            <button onClick={() => setConfirm({ type: 'clear' })} className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm">
              <Trash2 size={15} /> Clear all
            </button>
          </div>
        }
      />

      <AnimatePresence>
        {infoMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white shadow-xl px-5 py-4 text-sm font-bold text-emerald-800">
            <CheckCircle2 size={18} className="text-emerald-500" /> {infoMessage}
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className={`p-2 rounded-xl ${s.color} flex items-center justify-center`}><s.icon size={18} /></div>
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categories</p>
            <div className="space-y-1">
              {CATEGORIES.map(cat => {
                const count = cat.key === 'all' ? stats.total : cat.key === 'unread' ? stats.unread : stats.byType[cat.key as keyof typeof stats.byType] || 0
                const Icon = cat.icon
                return (
                  <button key={cat.key} onClick={() => startTransition(() => setCategory(cat.key))} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${category === cat.key ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-100' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2.5"><Icon size={15} /><span className="capitalize">{cat.label}</span></div>
                    {count > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${category === cat.key ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => startTransition(() => setSearch(e.target.value))} placeholder="Search alerts, content, metadata..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition text-gray-900" />
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center"><BellOff size={28} className="text-gray-300" /></div>
              <p className="font-bold text-gray-800 text-lg">No alerts found</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">When new store updates or order statuses are triggered, they will display here.</p>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.label}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">{group.items.length}</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                </div>
                <div className="space-y-2.5">
                  {group.items.map(notif => (
                    <NotificationItem 
                      key={notif.id} 
                      notif={notif} 
                      isExpanded={expandedIds.has(notif.id)} 
                      onToggle={() => toggleExpanded(notif.id, notif.isRead)} 
                      onDelete={() => setConfirm({ type: 'delete', id: notif.id })}
                      isDeleting={actionLoadingId === notif.id}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.type === 'clear' ? 'Clear All Notifications' : 'Delete Notification'}
        message={confirm?.type === 'clear' ? 'Are you sure you want to clear all notification logs? This action is permanent.' : 'Are you sure you want to delete this notification alert?'}
        confirmLabel={confirm?.type === 'clear' ? 'Clear All' : 'Delete'}
        confirmVariant="danger"
        onConfirm={() => { if (confirm?.type === 'clear') clearAllNotifications(); else if (confirm?.id) deleteNotification(confirm.id) }}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}