'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type NotificationType = 'order' | 'payment' | 'review' | 'system' | 'ai' | 'marketing' | 'promotion'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type Notification = {
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

export type Stats = {
  unread: number
  urgent: number
  today: number
  total: number
  byType: Record<string, number>
}

export type AISummary = { iconKey: string; title: string; description: string; color: string }[]

export type DashboardData = {
  notifications: Notification[]
  stats: Stats
  aiSummary: AISummary
}

export async function fetchVendorNotificationsData(userId: string): Promise<DashboardData | null> {
  const supabase = await createClient()
  const emptyData: DashboardData = { notifications: [], stats: { unread: 0, urgent: 0, today: 0, total: 0, byType: {} }, aiSummary: [] }

  const { data: vendor } = await supabase.from('vendors').select('id').eq('profile_id', userId).maybeSingle()
  
  // 🚀 PARALLEL FETCHING
  const [logsRes, ordersRes] = await Promise.all([
    supabase.from('notification_logs').select('*').eq('user_id', userId).order('sent_at', { ascending: false }).limit(200),
    vendor ? supabase.from('orders').select('id, order_number, status, total_amount, created_at, customer_email, user_id').eq('vendor_id', vendor.id).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] })
  ])

  const rows = logsRes.data || []
  const recentOrders = ordersRes.data || []

  // Fetch profiles for orders
  const userIds = [...new Set(recentOrders.map((o: any) => o.user_id).filter(Boolean))]
  let profileMap = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
    profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]))
  }

  // Map Orders to Notifications
  const orderNotifs: Notification[] = recentOrders.map((o: any) => {
    const customerName = profileMap.get(o.user_id) || o.customer_email?.split('@')[0] || 'Customer'
    const priority: NotificationPriority = o.status === 'Pending' ? 'high' : o.status === 'Cancelled' ? 'urgent' : 'medium'
    return {
      id: `order-${o.id}`, type: 'order', priority,
      title: o.status === 'Pending' ? '🛍️ New Order Received!' : o.status === 'Delivered' ? '✅ Order Delivered' : o.status === 'Cancelled' ? '❌ Order Cancelled' : `Order ${o.status}`,
      message: `${customerName} placed order #${o.order_number} for KES ${Number(o.total_amount).toLocaleString()}`,
      body: `Order #${o.order_number}\nCustomer: ${customerName}\nAmount: KES ${Number(o.total_amount).toLocaleString()}\nStatus: ${o.status}\n\nReview this order in your orders dashboard.`,
      isRead: o.status !== 'Pending', isArchived: false, createdAt: o.created_at,
      actionUrl: '/dashboard/vendor/orders', actionLabel: 'View Order',
      metadata: { order_number: o.order_number, amount: `KES ${Number(o.total_amount).toLocaleString()}`, status: o.status, customer: customerName },
      channel: 'in_app'
    }
  })

  // Map DB Logs to Notifications
  const dbNotifs: Notification[] = rows.map((n: any) => {
    const title = n.title || 'Notification'
    let type: NotificationType = 'system'
    if (title.toLowerCase().includes('order') || n.metadata?.trigger === 'order') type = 'order'
    else if (title.toLowerCase().includes('payment') || title.toLowerCase().includes('withdraw')) type = 'payment'
    else if (title.toLowerCase().includes('review') || title.toLowerCase().includes('rating')) type = 'review'
    else if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('insight')) type = 'ai'
    else if (title.toLowerCase().includes('promo') || title.toLowerCase().includes('offer')) type = 'promotion'
    else if (title.toLowerCase().includes('welcome') || title.toLowerCase().includes('market')) type = 'marketing'

    return {
      id: n.id, type, priority: 'medium', title, message: n.body || title, body: n.body || title,
      isRead: Boolean(n.is_read), isArchived: false, createdAt: n.sent_at || n.created_at,
      metadata: n.metadata || {}, channel: n.channel || 'in_app'
    }
  })

  const notifications = [...orderNotifs, ...dbNotifs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Calculate Stats on Server
  const active = notifications.filter(n => !n.isArchived)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const stats: Stats = {
    unread: active.filter(n => !n.isRead).length,
    urgent: active.filter(n => n.priority === 'urgent' && !n.isRead).length,
    today: active.filter(n => new Date(n.createdAt).getTime() >= todayStart.getTime()).length,
    total: active.length,
    byType: { order: 0, payment: 0, review: 0, ai: 0 }
  }
  active.forEach(n => { if (stats.byType[n.type] !== undefined) stats.byType[n.type]++ })

  // Generate AI Summary on Server
  const aiSummary: AISummary = []
  if (stats.unread > 10) aiSummary.push({ iconKey: 'bellRing', title: `${stats.unread} Unread Notifications`, description: 'You have a backlog. Consider reviewing and clearing them to stay focused.', color: 'amber' })
  if (stats.urgent > 0) aiSummary.push({ iconKey: 'alertTriangle', title: `${stats.urgent} Urgent Items`, description: 'Critical notifications require immediate attention. Review them first.', color: 'red' })
  if (stats.byType.order > 5) aiSummary.push({ iconKey: 'shoppingBag', title: `${stats.byType.order} Order Updates`, description: 'Your store is active. Ensure timely order fulfillment to maintain ratings.', color: 'emerald' })
  if (stats.byType.review > 0) aiSummary.push({ iconKey: 'star', title: `${stats.byType.review} New Reviews`, description: 'Customer feedback received. Respond to reviews to build loyalty.', color: 'violet' })
  if (aiSummary.length === 0) aiSummary.push({ iconKey: 'sparkles', title: 'All Caught Up!', description: 'No urgent notifications. Great job staying on top of things.', color: 'emerald' })

  return { notifications, stats, aiSummary }
}

export async function markAsReadAction(id: string) {
  const supabase = await createClient()
  await supabase.from('notification_logs').update({ is_read: true }).eq('id', id)
  revalidatePath('/dashboard/vendor/notifications')
}

export async function markAllAsReadAction(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  await supabase.from('notification_logs').update({ is_read: true }).in('id', ids)
  revalidatePath('/dashboard/vendor/notifications')
}

export async function deleteNotificationAction(id: string) {
  const supabase = await createClient()
  await supabase.from('notification_logs').delete().eq('id', id)
  revalidatePath('/dashboard/vendor/notifications')
}

export async function deleteAllReadAction(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  await supabase.from('notification_logs').delete().in('id', ids)
  revalidatePath('/dashboard/vendor/notifications')
}