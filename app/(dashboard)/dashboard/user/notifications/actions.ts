'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NotificationType = 'order' | 'payment' | 'review' | 'system' | 'ai' | 'marketing'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type UserNotification = {
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

export async function fetchUserNotifications(userId: string): Promise<UserNotification[]> {
  const supabase = await createClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  // 🚀 PARALLEL FETCHING (Massive speedup)
  const [ordersRes, logsRes] = await Promise.all([
    supabase.from('orders').select('id, order_number, status, total_amount, created_at, vendor_id')
      .eq('user_id', userId).gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }),
    supabase.from('notification_logs').select('*')
      .eq('user_id', userId).order('sent_at', { ascending: false })
  ])

  const recentOrders = ordersRes.data || []
  const logs = logsRes.data || []

  // Fetch vendors for orders
  const vendorIds = [...new Set(recentOrders.map((o: any) => o.vendor_id).filter(Boolean))]
  let vendorMap = new Map<string, string>()
  
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase.from('vendors').select('id, business_name').in('id', vendorIds)
    vendorMap = new Map((vendors || []).map((v: any) => [v.id, v.business_name]))
  }

  // Map Orders to Notifications
  const orderNotifications: UserNotification[] = recentOrders.map((o: any) => {
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
      type, priority, title, message,
      body: `${message}\nOrder Ref: #${o.order_number}\nAmount: KES ${Number(o.total_amount).toLocaleString()}\n\nTrack order progress in your active orders dashboard.`,
      isRead: !['Pending', 'Preparing', 'Out for Delivery'].includes(o.status),
      isArchived: false,
      createdAt: o.created_at,
      actionUrl: '/dashboard/user/orders',
      actionLabel: 'Track Order',
      channel: 'in_app' as const,
    }
  })

  // Map Logs to Notifications
  const dbNotifications: UserNotification[] = logs.map((l: any) => {
    const title = l.title || 'Alert'
    let type: NotificationType = 'system'
    if (title.toLowerCase().includes('order') || l.metadata?.trigger === 'order') type = 'order'
    else if (title.toLowerCase().includes('payment') || title.toLowerCase().includes('convenience')) type = 'payment'
    else if (title.toLowerCase().includes('review') || title.toLowerCase().includes('rating')) type = 'review'
    else if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('insight')) type = 'ai'
    else if (title.toLowerCase().includes('market') || title.toLowerCase().includes('promo')) type = 'marketing'

    return {
      id: l.id, type, priority: 'medium' as NotificationPriority, title,
      message: l.body || title, body: l.body || title,
      isRead: Boolean(l.is_read), isArchived: false,
      createdAt: l.sent_at || l.created_at, channel: l.channel || 'in_app',
      metadata: l.metadata
    }
  })

  return [...orderNotifications, ...dbNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function markAsReadAction(id: string) {
  const supabase = await createClient()
  await supabase.from('notification_logs').update({ is_read: true }).eq('id', id)
}

export async function markAllReadAction(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  await supabase.from('notification_logs').update({ is_read: true }).in('id', ids)
  revalidatePath('/dashboard/user/notifications')
}

export async function deleteNotificationAction(id: string) {
  const supabase = await createClient()
  await supabase.from('notification_logs').delete().eq('id', id)
  revalidatePath('/dashboard/user/notifications')
}

export async function clearAllNotificationsAction(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  await supabase.from('notification_logs').delete().in('id', ids)
  revalidatePath('/dashboard/user/notifications')
}