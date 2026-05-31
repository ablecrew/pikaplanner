'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, Info, AlertTriangle, CheckCircle, XCircle, Trash2, CheckCheck, Plus, 
  MoreHorizontal, Loader2, AlertCircle, CheckCircle2 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField'

type NotificationType = 'info' | 'warning' | 'success' | 'error'

type DbNotification = {
  id: string
  title?: string | null
  body?: string | null
  type?: string | null
  read?: boolean | null
  created_at?: string | null
  read_at?: string | null
}

type FormState = {
  title: string
  body: string
  type: NotificationType
}

const initialForm: FormState = { title: '', body: '', type: 'info' }

// ✅ Fixed: add default + use Record<string, ...> so any string type gets a style
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

// ✅ Fallback for any unmapped type
const DEFAULT_STYLE = { bg: 'bg-gray-50', text: 'text-gray-600', icon: <Info size={18} /> }

export default function AdminNotificationsPage() {
  const supabase = createClient()
  
  const [notifications, setNotifications] = useState<DbNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Read'>('All')
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'clear'; id?: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  
  const actionMenuRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('notification_logs')
        .select('*')
        .order('id', { ascending: false })
      
      if (dbError) throw dbError
      setNotifications(data || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      const message = err instanceof Error ? err.message : 'Failed to load notifications'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = notifications.filter((n) => {
    const isRead = n.read === true
    if (filter === 'Unread') return !isRead
    if (filter === 'Read') return isRead
    return true
  })

  const unreadCount = notifications.filter((n) => n.read !== true).length

  const handleSendNotification = async () => {
    setSaving(true)
    setError(null)
    try {
      const { error: insertError } = await supabase
        .from('notification_logs')
        .insert([{
          title: form.title,
          body: form.body,
          type: form.type,
          read: false,
          is_read: false,
          channel: 'in_app',
          sent_at: new Date().toISOString(),
        }])
      
      if (insertError) throw insertError
      
      setInfoMessage('Notification sent successfully.')
      setAddModal(false)
      setForm(initialForm)
      await fetchNotifications()
    } catch (err) {
      console.error('Failed to send notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setSaving(false)
    }
  }

  const toggleRead = async (id: string, currentRead: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({ read: !currentRead, is_read: !currentRead })
        .eq('id', id)
      
      if (error) throw error
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !currentRead } : n))
    } catch (err) {
      console.error('Failed to update read status:', err)
      setError('Failed to update notification')
    }
  }

  const markAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({ read: true, is_read: true })
        .eq('read', false)
      
      if (error) throw error
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setInfoMessage('All notifications marked as read.')
    } catch (err) {
      console.error('Failed to mark all read:', err)
      setError('Failed to mark all as read')
    }
  }

  const deleteOne = async (id: string) => {
    try {
      const { error } = await supabase.from('notification_logs').delete().eq('id', id)
      if (error) throw error
      
      setNotifications(prev => prev.filter(n => n.id !== id))
      setInfoMessage('Notification deleted.')
    } catch (err) {
      console.error('Failed to delete notification:', err)
      setError('Failed to delete notification')
    }
  }

  const clearAll = async () => {
    try {
      const { error } = await supabase.from('notification_logs').delete().neq('id', '')
      if (error) throw error
      
      setNotifications([])
      setInfoMessage('All notifications cleared.')
    } catch (err) {
      console.error('Failed to clear notifications:', err)
      setError('Failed to clear notifications')
    }
  }

  const handleConfirm = async () => {
    if (!confirm) return
    if (confirm.type === 'clear') await clearAll()
    else if (confirm.id) await deleteOne(confirm.id)
    setConfirm(null)
  }

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Just now'
    try {
      const date = new Date(isoString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return 'Unknown date'
    }
  }

  // ✅ Always-safe style lookup
  const getStyle = (type: string | null | undefined) => {
    return typeStyles[type || ''] || DEFAULT_STYLE
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={markAllRead} 
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck size={15} /> Mark all read
            </button>
            <button 
              onClick={() => setConfirm({ type: 'clear' })} 
              disabled={notifications.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={15} /> Clear all
            </button>
            <button 
              onClick={() => setAddModal(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
            >
              <Plus size={16} /> New Notification
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {infoMessage && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} /> {infoMessage}
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        {(['All', 'Unread', 'Read'] as const).map((f) => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f} {f === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-white text-emerald-600 text-xs rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3">
          <Bell size={36} className="text-gray-300" />
          <p className="text-gray-400 text-sm">No notifications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((notif, i) => {
              // ✅ Always-safe: uses getStyle with fallback
              const style = getStyle(notif.type)
              const isExpanded = expandedId === notif.id
              const isActionOpen = openActionId === notif.id
              const isRead = notif.read === true

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                  className={`relative bg-white border rounded-xl shadow-sm transition-all ${
                    !isRead ? 'border-l-4 border-l-emerald-400 border-gray-100' : 'border-gray-100'
                  }`}
                >
                  <div className="absolute right-4 top-4 z-20" ref={isActionOpen ? actionMenuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenActionId(isActionOpen ? null : notif.id)
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    
                    <AnimatePresence>
                      {isActionOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 bottom-full mb-2 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                        >
                          <button
                            onClick={() => {
                              toggleRead(notif.id, isRead)
                              setOpenActionId(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                          >
                            <CheckCheck size={14} /> {isRead ? 'Mark Unread' : 'Mark Read'}
                          </button>
                          <button
                            onClick={() => {
                              setConfirm({ type: 'delete', id: notif.id })
                              setOpenActionId(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div 
                    className="p-5 cursor-pointer"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : notif.id)
                      if (!isRead) toggleRead(notif.id, false)
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>
                        {style.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-semibold truncate ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.title || 'Notification'}
                          </h4>
                          {!isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                        </div>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 bg-gray-50 rounded-2xl rounded-tl-none p-4 text-sm text-gray-700 leading-relaxed border border-gray-100">
                                {notif.body}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {!isExpanded && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{notif.body}</p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">{formatDate(notif.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Send Notification" size="md">
        <div className="space-y-4 text-gray-900">
          <FormField label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />
          </FormField>
          <FormField label="Body">
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your notification body..." />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NotificationType })} options={[
              { value: 'info', label: 'Info' }, 
              { value: 'success', label: 'Success' }, 
              { value: 'warning', label: 'Warning' }, 
              { value: 'error', label: 'Error' }
            ]} />
          </FormField>
          <div className="flex gap-3 pt-2 text-gray-900">
            <button onClick={() => setAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
            <button 
              onClick={handleSendNotification} 
              disabled={saving || !form.title || !form.body}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Sending...' : 'Send Notification'}
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