'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'system' | 'order' | 'payment' | 'vendor'

export type Notification = {
  id: string
  title: string
  body: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

export async function fetchAdminNotificationsData(): Promise<Notification[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('notification_logs')
    .select('*')
    .order('id', { ascending: false })
  
  if (error) throw new Error(error.message)

  return (data || []).map((n: any) => ({
    id: n.id,
    title: n.title || 'Notification',
    body: n.body || '',
    type: (n.type as NotificationType) || 'info',
    is_read: n.is_read === true || n.read === true,
    created_at: n.created_at || n.sent_at || new Date().toISOString(),
  }))
}

export async function createNotificationAction(title: string, body: string, type: NotificationType) {
  const supabase = await createClient()
  const { error } = await supabase.from('notification_logs').insert({
    title, body, type, read: false, is_read: false, channel: 'in_app', sent_at: new Date().toISOString()
  })
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/notifications')
}

export async function toggleReadAction(id: string, is_read: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('notification_logs').update({ read: is_read, is_read }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/notifications')
}

export async function markAllReadAction() {
  const supabase = await createClient()
  const { error } = await supabase.from('notification_logs').update({ read: true, is_read: true }).eq('is_read', false)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/notifications')
}

export async function deleteNotificationAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notification_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/notifications')
}

export async function clearAllNotificationsAction() {
  const supabase = await createClient()
  const { error } = await supabase.from('notification_logs').delete().neq('id', '')
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/notifications')
}