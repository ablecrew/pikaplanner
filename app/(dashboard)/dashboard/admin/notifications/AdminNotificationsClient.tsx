'use client'

import { useState, useMemo, useRef, useEffect, memo, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, Info, AlertTriangle, CheckCircle, XCircle, Trash2, CheckCheck, Plus, 
  MoreHorizontal, Loader2, AlertCircle, CheckCircle2 
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField'
import { 
  Notification, NotificationType, fetchAdminNotificationsData, createNotificationAction, 
  toggleReadAction, markAllReadAction, deleteNotificationAction, clearAllNotificationsAction 
} from './actions'

type FormState = { title: string; body: string; type: NotificationType }
const initialForm: FormState = { title: '', body: '', type: 'info' }

const typeStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  info: { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Info size={18} /> },
  warning: { bg: 'bg-amber-50', text: 'text-amber-600', icon: <AlertTriangle size={18} /> },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle size={18} /> },
  error: { bg: 'bg-red-50', text: 'text-red-600', icon: <XCircle size={18} /> },
  system: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <Bell size={18} /> },
  order: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle size={18} /> },
  payment: { bg: 'bg-violet-50', text: 'text-violet-600', icon: <CheckCircle size={18} /> },
  vendor: { bg: 'bg-orange-50', text: 'text-orange-600', icon: <Info size={18} /> },
}
const DEFAULT_STYLE = { bg: 'bg-gray-50', text: 'text-gray-600', icon: <Info size={18} /> }
const getStyle = (type: string | null | undefined) => typeStyles[type || ''] || DEFAULT_STYLE

const formatDate = (isoString?: string | null) => {
  if (!isoString) return 'Just now'
  try {
    return new Date(isoString).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch { return 'Unknown date' }
}

// ── Memoized Notification Item ────────────────────────────
const NotificationItem = memo(function NotificationItem({ 
  notif, isExpanded, isActionOpen, onToggleExpand, onToggleAction, onToggleRead, onDelete 
}: { 
  notif: Notification
  isExpanded: boolean
  isActionOpen: boolean
  onToggleExpand: (id: string) => void
  onToggleAction: (id: string) => void
  onToggleRead: (id: string, is_read: boolean) => void
  onDelete: (id: string) => void
}) {
  const style = getStyle(notif.type)
  const actionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActionOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) onToggleAction(notif.id)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isActionOpen, notif.id, onToggleAction])

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative bg-white border rounded-xl shadow-sm transition-all ${!notif.is_read ? 'border-l-4 border-l-emerald-400 border-gray-100' : 'border-gray-100'}`}>
      <div className="absolute right-4 top-4 z-20" ref={actionRef}>
        <button onClick={(e) => { e.stopPropagation(); onToggleAction(notif.id) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
          <MoreHorizontal size={18} />
        </button>
        <AnimatePresence>
          {isActionOpen && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute right-0 bottom-full mb-2 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
              <button onClick={() => { onToggleRead(notif.id, !notif.is_read); onToggleAction(notif.id) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                <CheckCheck size={14} /> {notif.is_read ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button onClick={() => { onDelete(notif.id); onToggleAction(notif.id) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50">
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-5 cursor-pointer" onClick={() => { onToggleExpand(notif.id); if (!notif.is_read) onToggleRead(notif.id, true) }}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>{style.icon}</div>
          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-center justify-between gap-2">
              <h4 className={`text-sm font-semibold truncate ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</h4>
              {!notif.is_read && <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
            </div>
            <AnimatePresence>
              {isExpanded ? (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="mt-3 bg-gray-50 rounded-2xl rounded-tl-none p-4 text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-line">{notif.body}</div>
                </motion.div>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{notif.body}</p>
              )}
            </AnimatePresence>
            <p className="text-xs text-gray-400 mt-2">{formatDate(notif.created_at)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

// ── Main Client Component ─────────────────────────────────
export default function AdminNotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Read'>('All')
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'clear'; id?: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refreshNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminNotificationsData()
      setNotifications(data)
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'Unread') return notifications.filter(n => !n.is_read)
    if (filter === 'Read') return notifications.filter(n => n.is_read)
    return notifications
  }, [notifications, filter])

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications])

  const handleSendNotification = async () => {
    setSaving(true); setError(null)
    const newNotif: Notification = {
      id: `temp-${Date.now()}`, title: form.title, body: form.body, type: form.type, is_read: false, created_at: new Date().toISOString()
    }
    setNotifications(prev => [newNotif, ...prev]) // Optimistic UI
    
    try {
      await createNotificationAction(form.title, form.body, form.type)
      setInfoMessage('Notification sent successfully.')
      setAddModal(false); setForm(initialForm)
      await refreshNotifications() // Replace temp ID with real ID
    } catch (err: any) {
      setError(err.message)
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id)) // Revert
    } finally { setSaving(false) }
  }

  const handleToggleRead = async (id: string, is_read: boolean) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read } : n)) // Optimistic UI
    try { await toggleReadAction(id, is_read) } catch (err: any) { setError(err.message); await refreshNotifications() }
  }

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))) // Optimistic UI
    try { await markAllReadAction(); setInfoMessage('All notifications marked as read.') } catch (err: any) { setError(err.message); await refreshNotifications() }
  }

  const handleDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id)) // Optimistic UI
    try { await deleteNotificationAction(id); setInfoMessage('Notification deleted.') } catch (err: any) { setError(err.message); await refreshNotifications() }
  }

  const handleClearAll = async () => {
    setNotifications([]) // Optimistic UI
    try { await clearAllNotificationsAction(); setInfoMessage('All notifications cleared.') } catch (err: any) { setError(err.message); await refreshNotifications() }
  }

  const handleConfirm = async () => {
    if (!confirm) return
    if (confirm.type === 'clear') await handleClearAll()
    else if (confirm.id) await handleDelete(confirm.id)
    setConfirm(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleMarkAllRead} disabled={unreadCount === 0} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <CheckCheck size={15} /> Mark all read
            </button>
            <button onClick={() => setConfirm({ type: 'clear' })} disabled={notifications.length === 0} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 size={15} /> Clear all
            </button>
            <button onClick={() => setAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition">
              <Plus size={16} /> New Notification
            </button>
          </div>
        }
      />

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</motion.div>}
        {infoMessage && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {infoMessage}</motion.div>}
      </AnimatePresence>

      <div className="flex items-center gap-2 mb-6">
        {(['All', 'Unread', 'Read'] as const).map((f) => (
          <button key={f} onClick={() => startTransition(() => setFilter(f))} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f} {f === 'Unread' && unreadCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-white text-emerald-600 text-xs rounded-full font-bold">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-emerald-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3"><Bell size={36} className="text-gray-300" /><p className="text-gray-400 text-sm">No notifications found.</p></div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((notif) => (
              <NotificationItem 
                key={notif.id} 
                notif={notif} 
                isExpanded={expandedId === notif.id} 
                isActionOpen={openActionId === notif.id}
                onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                onToggleAction={(id) => setOpenActionId(openActionId === id ? null : id)}
                onToggleRead={handleToggleRead}
                onDelete={(id) => setConfirm({ type: 'delete', id })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Send Notification" size="md">
        <div className="space-y-4 text-gray-900">
          <FormField label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" /></FormField>
          <FormField label="Body"><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your notification body..." /></FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NotificationType })} options={[
              { value: 'info', label: 'Info' }, { value: 'success', label: 'Success' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Error' }
            ]} />
          </FormField>
          <div className="flex gap-3 pt-2 text-gray-900">
            <button onClick={() => setAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleSendNotification} disabled={saving || !form.title || !form.body} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-60">
              {saving && <Loader2 size={16} className="animate-spin" />} {saving ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.type === 'clear' ? 'Clear All Notifications' : 'Delete Notification'}
        message={confirm?.type === 'clear' ? 'Are you sure you want to clear all notifications? This cannot be undone.' : 'Are you sure you want to delete this notification?'}
        confirmLabel={confirm?.type === 'clear' ? 'Clear All' : 'Delete'}
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}