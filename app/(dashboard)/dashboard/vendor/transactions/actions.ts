'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TransactionStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded'
export type TransactionType = 'order' | 'withdrawal' | 'refund' | 'payout'
export type PaymentMethod = 'M-Pesa' | 'Card' | 'Bank' | 'Cash'

export type Transaction = {
  id: string
  orderId: string
  type: TransactionType
  customerName: string
  customerEmail: string
  amount: number
  method: PaymentMethod
  date: string
  status: TransactionStatus
  description: string
  mpesaCode?: string
  platformFee: number
  netAmount: number
}

export type Stats = {
  totalRevenue: number
  pendingAmount: number
  refundedAmount: number
  totalFees: number
  completedCount: number
  pendingCount: number
  refundedCount: number
  failedCount: number
  revenueTrend: number
  averageOrderValue: number
}

export type RevenueChartData = { day: string; revenue: number; fees: number }[]
export type MethodChartData = { name: string; value: number }[]

export type AIInsight = {
  iconKey: 'trendingUp' | 'trendingDown' | 'clock' | 'piggyBank' | 'alert' | 'brain'
  title: string
  description: string
  color: 'emerald' | 'red' | 'amber' | 'blue' | 'violet' | 'indigo'
}

export type DashboardData = {
  vendorId: string | null
  availableBalance: number
  totalEarnings: number
  withdrawalThreshold: number
  transactions: Transaction[]
  stats: Stats
  revenueChart: RevenueChartData
  methodChart: MethodChartData
  aiInsights: AIInsight[]
}

export async function fetchVendorTransactionsData(userId: string): Promise<DashboardData> {
  const supabase = await createClient()
  const emptyData: DashboardData = {
    vendorId: null, availableBalance: 0, totalEarnings: 0, withdrawalThreshold: 500,
    transactions: [], stats: { totalRevenue: 0, pendingAmount: 0, refundedAmount: 0, totalFees: 0, completedCount: 0, pendingCount: 0, refundedCount: 0, failedCount: 0, revenueTrend: 0, averageOrderValue: 0 },
    revenueChart: [], methodChart: [], aiInsights: []
  }

  const { data: vendor } = await supabase.from('vendors').select('id, available_balance, total_earnings, withdrawal_threshold').eq('profile_id', userId).maybeSingle()
  if (!vendor) return emptyData

  const { data: orders } = await supabase.from('orders').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false })
  if (!orders || orders.length === 0) {
    return { ...emptyData, vendorId: vendor.id, availableBalance: Number(vendor.available_balance || 0), totalEarnings: Number(vendor.total_earnings || 0), withdrawalThreshold: Number(vendor.withdrawal_threshold || 500) }
  }

  const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length > 0 ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds) : { data: [] }
  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  const transactions: Transaction[] = orders.map(o => {
    const profile = profileMap.get(o.user_id)
    const totalAmount = Number(o.total_amount || 0)
    const platformFee = Number(o.platform_fee || 0)
    let status: TransactionStatus = 'Pending'
    if (o.payment_status === 'paid' && (o.status === 'Delivered' || o.status === 'Completed')) status = 'Successful'
    else if (o.payment_status === 'refunded' || o.status === 'Refunded') status = 'Refunded'
    else if (o.payment_status === 'failed') status = 'Failed'

    return {
      id: o.id, orderId: o.order_number || o.id.slice(0, 8).toUpperCase(),
      type: status === 'Refunded' ? 'refund' : 'order',
      customerName: profile?.full_name || o.customer_email?.split('@')[0] || 'Customer',
      customerEmail: o.customer_email || profile?.email || '',
      amount: totalAmount, method: o.mpesa_transaction_id ? 'M-Pesa' : 'Card',
      date: o.created_at, status, description: `Order payment for #${o.order_number}`,
      mpesaCode: o.mpesa_transaction_id || '', platformFee, netAmount: totalAmount - platformFee,
    }
  })

  // Calculate Stats on Server
  const successful = transactions.filter(t => t.status === 'Successful')
  const pending = transactions.filter(t => t.status === 'Pending')
  const refunded = transactions.filter(t => t.status === 'Refunded')
  const failed = transactions.filter(t => t.status === 'Failed')
  const totalRevenue = successful.reduce((s, t) => s + t.amount, 0)
  const totalFees = successful.reduce((s, t) => s + t.platformFee, 0)

  const now = Date.now()
  const weekMs = 7 * 86400000
  const thisWeekRev = transactions.filter(t => now - new Date(t.date).getTime() < weekMs && t.status === 'Successful').reduce((s, t) => s + t.amount, 0)
  const lastWeekRev = transactions.filter(t => { const diff = now - new Date(t.date).getTime(); return diff >= weekMs && diff < 2 * weekMs && t.status === 'Successful' }).reduce((s, t) => s + t.amount, 0)
  const revenueTrend = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : 0

  const stats: Stats = {
    totalRevenue, pendingAmount: pending.reduce((s, t) => s + t.amount, 0), refundedAmount: refunded.reduce((s, t) => s + t.amount, 0), totalFees,
    completedCount: successful.length, pendingCount: pending.length, refundedCount: refunded.length, failedCount: failed.length,
    revenueTrend, averageOrderValue: successful.length > 0 ? totalRevenue / successful.length : 0,
  }

  // Calculate Charts on Server
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const revMap = new Map<string, { day: string; revenue: number; fees: number }>()
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); revMap.set(days[d.getDay()], { day: days[d.getDay()], revenue: 0, fees: 0 }) }
  successful.forEach(t => {
    const d = new Date(t.date)
    if (Date.now() - d.getTime() < 7 * 86400000) {
      const key = days[d.getDay()]
      const existing = revMap.get(key)
      if (existing) { existing.revenue += t.amount; existing.fees += t.platformFee }
    }
  })
  const revenueChart = Array.from(revMap.values())

  const methodMap = new Map<string, number>()
  transactions.forEach(t => methodMap.set(t.method, (methodMap.get(t.method) || 0) + 1))
  const methodChart = Array.from(methodMap.entries()).map(([name, value]) => ({ name, value }))

  // Calculate AI Insights on Server
  const aiInsights: AIInsight[] = []
  if (revenueTrend > 20) aiInsights.push({ iconKey: 'trendingUp', title: 'Revenue Surge Detected', description: `Your revenue is up ${revenueTrend.toFixed(1)}% this week. Consider increasing inventory.`, color: 'emerald' })
  else if (revenueTrend < -20) aiInsights.push({ iconKey: 'trendingDown', title: 'Revenue Decline Alert', description: `Revenue dropped ${Math.abs(revenueTrend).toFixed(1)}% this week. Review pricing and promotions.`, color: 'red' })
  if (stats.pendingCount > 5) aiInsights.push({ iconKey: 'clock', title: 'High Pending Balance', description: `KES ${stats.pendingAmount.toLocaleString()} is pending. Complete orders to unlock funds.`, color: 'amber' })
  if (Number(vendor.available_balance) >= Number(vendor.withdrawal_threshold) * 2) aiInsights.push({ iconKey: 'piggyBank', title: 'Withdrawal Opportunity', description: `You have KES ${Number(vendor.available_balance).toLocaleString()} available. Consider withdrawing to your account.`, color: 'blue' })
  if (stats.refundedCount > 0 && (stats.refundedCount / transactions.length) > 0.1) aiInsights.push({ iconKey: 'alert', title: 'High Refund Rate', description: `${((stats.refundedCount / transactions.length) * 100).toFixed(1)}% of orders are refunded. Check quality and descriptions.`, color: 'violet' })
  aiInsights.push({ iconKey: 'brain', title: 'AI Prediction', description: `Based on trends, expect ~KES ${(stats.averageOrderValue * stats.completedCount * 0.15).toLocaleString()} more revenue this week.`, color: 'indigo' })

  return {
    vendorId: vendor.id, availableBalance: Number(vendor.available_balance || 0), totalEarnings: Number(vendor.total_earnings || 0), withdrawalThreshold: Number(vendor.withdrawal_threshold || 500),
    transactions, stats, revenueChart, methodChart, aiInsights
  }
}

export async function processWithdrawalAction(vendorId: string, amount: number) {
  const supabase = await createClient()
  const { data: vendor } = await supabase.from('vendors').select('available_balance').eq('id', vendorId).single()
  if (!vendor || vendor.available_balance < amount) throw new Error('Insufficient balance')
  
  await supabase.from('vendors').update({ available_balance: vendor.available_balance - amount, updated_at: new Date().toISOString() }).eq('id', vendorId)
  revalidatePath('/dashboard/vendor/transactions')
}

export async function processRefundAction(orderId: string) {
  const supabase = await createClient()
  await supabase.from('orders').update({ status: 'Refunded', payment_status: 'refunded', updated_at: new Date().toISOString() }).eq('id', orderId)
  revalidatePath('/dashboard/vendor/transactions')
}