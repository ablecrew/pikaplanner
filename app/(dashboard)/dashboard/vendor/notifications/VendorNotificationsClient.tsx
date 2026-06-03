'use client'

import { useState, useMemo, memo, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, BellRing, Search, Trash2, Check, CheckCheck,
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2, ShoppingBag, 
  DollarSign, Star, Info, Brain, Sparkles, AlertTriangle, Calendar, 
  Settings, Archive, Volume2, Loader2, Clock
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { 
  DashboardData, Notification, NotificationType, NotificationPriority, 
  fetchVendorNotificationsData, markAsReadAction, markAllAsReadAction, 
  deleteNotificationAction, deleteAllReadAction 
} from './actions'

const formatTimeAgo = (iso?: string | null) => {
  if (!iso) return ''
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const formatFullDate = (iso?: string | null) => !iso ? '' : new Date(iso).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const groupByDate = (notifications: Notification[]) => {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000; const thisWeek = today - 7 * 86400000
  const groups: Record<string, Notification[]> = { 'Today': [], 'Yesterday': [], 'This Week': [], 'Older': [] }
  notifications.forEach(n => {
    const t = new Date(n.createdAt).getTime()
    if (t >= today) groups['Today'].push(n)
    else if (t >= yesterday) groups['Yesterday'].push(n)
    else if (t >= thisWeek) groups['This Week'].push(n)
    else groups['Older'].push(n)
  })
  return Object.entries(groups).filter(([_, items]) => items.length > 0).map(([label, items]) => ({ label, items }))
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ComponentType<{ size?: number }>; color: string; bg: string; text: string; border: string; gradient: string }> = {
  order: { icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
  payment: { icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600' },
  review: { icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-500 to-amber-600' },
  system: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', gradient: 'from-slate-500 to-slate-600' },
  ai: { icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', gradient: 'from-violet-500 to-violet-600' },
  marketing: { icon: Bell, color: 'text-pink-600', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', gradient: 'from-pink-500 to-pink-600' },
  promotion: { icon: Sparkles, color: 'text-orange-600', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', gradient: 'from-orange-500 to-orange-600' },
}

const PRIORITY_CONFIG: Record<NotificationPriority, { label: string; color: string; bg: string; border: string }> = {
  low: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  high: { label: 'High', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
}

const CATEGORIES: { key: NotificationType | 'all' | 'unread'; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'all', label: 'All', icon: Bell }, { key: 'unread', label: 'Unread', icon: BellRing },
  { key: 'order', label: 'Orders', icon: ShoppingBag }, { key: 'payment', label: 'Payments', icon: DollarSign },
  { key: 'review', label: 'Reviews', icon: Star }, { key: 'ai', label: 'AI Insights', icon: Brain }, { key: 'system', label: 'System', icon: Info },
]

// ── Memoized Notification Item (Crucial for long lists) ──
const NotificationItem = memo(function NotificationItem({ 
  notification, isExpanded, onToggle, onMarkRead, onArchive, onDelete, isActionLoading 
}: { 
  notification: Notification, isExpanded: boolean, onToggle: (id: string) => void, onMarkRead: (id: string) => void, onArchive: (id: string) => void, onDelete: (id: string) => void, isActionLoading: boolean 
}) {
  const typeCfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system
  const priorityCfg = PRIORITY_CONFIG[notification.priority] || PRIORITY_CONFIG.medium
  const TypeIcon = typeCfg.icon

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className={`group relative rounded-2xl border transition-all overflow-hidden ${notification.isRead ? 'border-gray-100 bg-white hover:border-gray-200' : `${typeCfg.border} bg-white hover:shadow-md`}`}>
      {!notification.isRead && <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${typeCfg.gradient}`} />}
      {!notification.isRead && notification.priority === 'urgent' && <div className="absolute top-3 right-3 flex items-center gap-1.5"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" /></span></div>}
      
      <div onClick={() => { onToggle(notification.id); if (!notification.isRead) onMarkRead(notification.id) }} className="w-full text-left p-4 pl-5 flex items-start gap-4 cursor-pointer">
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${typeCfg.bg} ${typeCfg.color} transition-transform group-hover:scale-105`}><TypeIcon size={20} /></div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-bold text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</h4>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityCfg.bg} ${priorityCfg.color} ${priorityCfg.border}`}>{notification.priority === 'urgent' && <AlertTriangle size={9} />}{priorityCfg.label}</span>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">{formatTimeAgo(notification.createdAt)}</span>
          </div>
          <p className={`text-sm leading-relaxed ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>{notification.message}</p>

          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{notification.body || notification.message}</p>
                {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">{Object.entries(notification.metadata).map(([key, value]) => (<div key={key} className="rounded-lg bg-gray-50 p-2"><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{key.replace(/_/g, ' ')}</p><p className="text-xs font-semibold text-gray-800 truncate">{String(value)}</p></div>))}</div>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400"><Clock size={12} /><span>{formatFullDate(notification.createdAt)}</span><span className="text-gray-300">·</span><span className="uppercase">{notification.channel.replace('_', ' ')}</span></div>
                <div className="mt-3 flex items-center gap-2">
                  {notification.actionUrl && <a href={notification.actionUrl} onClick={(e) => e.stopPropagation()} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${typeCfg.gradient} text-white text-xs font-bold shadow-sm hover:shadow-md transition`}>{notification.actionLabel || 'View Details'}<ChevronRight size={12} /></a>}
                  {!notification.isRead && <button onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"><Check size={12} /> Mark as Read</button>}
                  <button onClick={(e) => { e.stopPropagation(); onArchive(notification.id) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"><Archive size={12} /> Archive</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(notification.id) }} disabled={isActionLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50">{isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex-shrink-0 pt-1"><motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400"><ChevronRight size={18} /></motion.div></div>
      </div>
      {!notification.isRead && <div className="absolute top-4 left-2 flex items-center justify-center"><span className={`w-2 h-2 rounded-full bg-gradient-to-br ${typeCfg.gradient}`} /></div>}
    </motion.div>
  )
})

// ── Main Client Component ──
export default function VendorNotificationsClient({ initialData, userId }: { initialData: DashboardData | null, userId: string }) {
  const [data, setData] = useState<DashboardData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<NotificationType | 'all' | 'unread'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'deleteAll'; id?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const notifications = data?.notifications || []
  const stats = data?.stats || { unread: 0, urgent: 0, today: 0, total: 0, byType: { order: 0, payment: 0, review: 0, ai: 0 } }

  const refreshData = useCallback(async () => {
    setLoading(true)
    const newData = await fetchVendorNotificationsData(userId)
    setData(newData)
    setLoading(false)
  }, [userId])

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

  const toggleExpanded = (id: string) => setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  const markAsRead = async (id: string) => {
    if (id.startsWith('order-')) return
    setData(prev => prev ? { ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) } : null)
    await markAsReadAction(id)
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead && !n.id.startsWith('order-')).map(n => n.id)
    setData(prev => prev ? { ...prev, notifications: prev.notifications.map(n => ({ ...n, isRead: true })) } : null)
    if (unreadIds.length > 0) await markAllAsReadAction(unreadIds)
    setInfoMessage('All notifications marked as read')
  }

  const archiveNotification = (id: string) => {
    setData(prev => prev ? { ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, isArchived: true } : n) } : null)
    setInfoMessage('Notification archived')
  }

  const deleteNotification = async (id: string) => {
    setActionLoadingId(id)
    setData(prev => prev ? { ...prev, notifications: prev.notifications.filter(n => n.id !== id) } : null)
    if (!id.startsWith('order-')) await deleteNotificationAction(id)
    setActionLoadingId(null); setConfirm(null)
    setInfoMessage('Notification deleted')
  }

  const deleteAllRead = async () => {
    const readIds = notifications.filter(n => n.isRead && !n.id.startsWith('order-')).map(n => n.id)
    setData(prev => prev ? { ...prev, notifications: prev.notifications.filter(n => !n.isRead || n.id.startsWith('order-')) } : null)
    if (readIds.length > 0) await deleteAllReadAction(readIds)
    setConfirm(null)
    setInfoMessage('Read notifications deleted')
  }

  const iconMap: Record<string, React.ReactNode> = { bellRing: <BellRing size={16} />, alertTriangle: <AlertTriangle size={16} />, shoppingBag: <ShoppingBag size={16} />, star: <Star size={16} />, sparkles: <Sparkles size={16} /> }
  const colorMap: Record<string, string> = { emerald: 'border-l-emerald-500 bg-emerald-50/30 text-emerald-700', red: 'border-l-red-500 bg-red-50/30 text-red-700', amber: 'border-l-amber-500 bg-amber-50/30 text-amber-700', violet: 'border-l-violet-500 bg-violet-50/30 text-violet-700' }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Notifications</h1>
            {stats.unread > 0 && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-md shadow-red-200"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-white" /></span>{stats.unread} new</span>}
          </div>
          <p className="mt-1 text-sm text-gray-500">Stay updated with orders, payments, reviews, and AI insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreferencesOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"><Settings size={15} /> Preferences</button>
          <button onClick={refreshData} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          {stats.unread > 0 && <button onClick={markAllAsRead} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"><CheckCheck size={15} /> Mark All Read</button>}
        </div>
      </div>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</motion.div>}
        {infoMessage && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {infoMessage}</motion.div>}
      </AnimatePresence>

      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Total', value: stats.total, icon: Bell, color: 'bg-blue-500', accent: 'bg-blue-50' }, { label: 'Unread', value: stats.unread, icon: BellRing, color: 'bg-amber-500', accent: 'bg-amber-50' }, { label: 'Urgent', value: stats.urgent, icon: AlertTriangle, color: 'bg-red-500', accent: 'bg-red-50' }, { label: 'Today', value: stats.today, icon: Calendar, color: 'bg-emerald-500', accent: 'bg-emerald-50' }].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[48px] opacity-10 ${s.color} group-hover:opacity-20 transition`} />
            <div className="relative"><div className="flex items-center justify-between mb-3"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.accent}`}><s.icon size={17} className={s.color.replace('bg-', 'text-')} /></div></div><p className="text-2xl font-extrabold text-gray-900 tracking-tight">{s.value}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center"><Brain size={16} className="text-violet-600" /></div><div><h3 className="font-bold text-gray-900 text-sm">AI Notification Summary</h3><p className="text-xs text-gray-500">Smart overview of your notification activity</p></div></div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.aiSummary.map((insight, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`border-l-4 ${colorMap[insight.color]} rounded-r-xl p-4`}>
              <div className="flex items-start gap-3"><div>{iconMap[insight.iconKey]}</div><div><p className="text-sm font-bold text-gray-900">{insight.title}</p><p className="text-xs text-gray-600 mt-1 leading-relaxed">{insight.description}</p></div></div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filter by Type</p>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
                const count = cat.key === 'all' ? stats.total : cat.key === 'unread' ? stats.unread : stats.byType[cat.key] || 0
                const Icon = cat.icon
                return (
                  <button key={cat.key} onClick={() => startTransition(() => setCategory(cat.key))} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${category === cat.key ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-200' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2.5"><Icon size={15} /><span>{cat.label}</span></div>
                    {count > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${category === cat.key ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</p>
            <button onClick={markAllAsRead} disabled={stats.unread === 0} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"><CheckCheck size={15} className="text-emerald-600" /> Mark All Read</button>
            <button onClick={() => setConfirm({ type: 'deleteAll' })} disabled={notifications.filter(n => n.isRead).length === 0} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={15} className="text-red-600" /> Delete All Read</button>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><Volume2 size={18} className="text-violet-600" /></div><div className="flex-1"><p className="text-sm font-bold text-gray-900">Sound Alerts</p><p className="text-xs text-gray-500">Play sound for new notifications</p></div><button className="relative w-11 h-6 rounded-full bg-violet-500 transition"><span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform translate-x-5" /></button></div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => startTransition(() => setSearch(e.target.value))} placeholder="Search notifications..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition text-gray-900" /></div>
          </div>

          {grouped.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center"><BellOff size={32} className="text-purple-400" /></div>
              <div className="text-center"><p className="text-gray-900 font-bold text-lg mb-1">{search ? 'No notifications found' : category === 'unread' ? 'All caught up!' : 'No notifications'}</p><p className="text-gray-400 text-sm max-w-md">{search ? 'Try different keywords or clear your search.' : category === 'unread' ? "You've read all your notifications. Great job!" : 'When you receive orders, payments, or reviews, they will appear here.'}</p></div>
              {(search || category !== 'all') && <button onClick={() => { setSearch(''); setCategory('all') }} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition">Clear Filters</button>}
            </motion.div>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3 px-1"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.label}</h3><span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">{group.items.length}</span><div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" /></div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {group.items.map((notif) => (
                      <NotificationItem key={notif.id} notification={notif} isExpanded={expanded.has(notif.id)} onToggle={toggleExpanded} onMarkRead={markAsRead} onArchive={archiveNotification} onDelete={(id) => setConfirm({ type: 'delete', id })} isActionLoading={actionLoadingId === notif.id} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={preferencesOpen} onClose={() => setPreferencesOpen(false)} title="Notification Preferences" size="md">
        <div className="space-y-5 -mx-2 px-2">
          <div><h4 className="text-sm font-bold text-gray-900 mb-3">Delivery Channels</h4><div className="space-y-2">{[{ key: 'email', label: 'Email Notifications', desc: 'Receive updates via email', icon: '📧' }, { key: 'push', label: 'Push Notifications', desc: 'Browser and mobile push alerts', icon: '🔔' }, { key: 'sms', label: 'SMS Notifications', desc: 'Text message alerts for critical items', icon: '💬' }].map((item) => (<label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition cursor-pointer"><div className="flex items-center gap-3"><span className="text-xl">{item.icon}</span><div><p className="text-sm font-semibold text-gray-900">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div></div><input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /></label>))}</div></div>
          <div className="flex gap-3 pt-2 border-t border-gray-100"><button onClick={() => setPreferencesOpen(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button><button onClick={() => { setPreferencesOpen(false); setInfoMessage('Preferences saved successfully') }} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg transition">Save Preferences</button></div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirm} title={confirm?.type === 'delete' ? 'Delete Notification' : 'Delete All Read Notifications'} message={confirm?.type === 'delete' ? 'This notification will be permanently deleted. This cannot be undone.' : `Delete all ${notifications.filter(n => n.isRead).length} read notifications? This cannot be undone.`} confirmLabel="Delete" confirmVariant="danger" onConfirm={() => { if (confirm?.type === 'delete' && confirm.id) deleteNotification(confirm.id); else if (confirm?.type === 'deleteAll') deleteAllRead() }} onCancel={() => setConfirm(null)} />
    </motion.div>
  )
}