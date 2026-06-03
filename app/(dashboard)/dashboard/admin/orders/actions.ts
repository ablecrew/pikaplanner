'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | 'Refunded'

export type Order = {
  id: string
  orderNumber: string
  customerId: string
  customer: string
  customerEmail: string
  customerPhone: string
  vendorId: string
  vendor: string
  items: number
  subtotal: string
  deliveryFee: string
  platformFee: string
  totalAmount: string
  rawTotal: number
  currency: string
  paymentMethod: string
  paymentStatus: string
  status: OrderStatus
  date: string
  deliveryAddress: string
  customerNotes: string
  estimatedDelivery: string
  deliveredAt: string
  mpesaRef: string
}

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export async function fetchAdminOrdersData(): Promise<Order[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, user_id, vendor_id, status, subtotal,
      delivery_fee, platform_fee, total_amount, currency,
      delivery_address, customer_phone, customer_email, customer_notes,
      estimated_delivery_at, delivered_at,
      mpesa_transaction_id, payment_status, created_at, updated_at,
      profiles:user_id (full_name, email),
      vendors:vendor_id (business_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  return (data || []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
    customerId: o.user_id || '',
    customer: o.profiles?.full_name || 'Unknown',
    customerEmail: o.customer_email || o.profiles?.email || '',
    customerPhone: o.customer_phone || '',
    vendorId: o.vendor_id || '',
    vendor: o.vendors?.business_name || 'No Vendor',
    items: 1,
    subtotal: formatCurrency(Number(o.subtotal || 0)),
    deliveryFee: formatCurrency(Number(o.delivery_fee || 0)),
    platformFee: formatCurrency(Number(o.platform_fee || 0)),
    totalAmount: formatCurrency(Number(o.total_amount || 0)),
    rawTotal: Number(o.total_amount || 0),
    currency: o.currency || 'KES',
    paymentMethod: o.mpesa_transaction_id ? 'M-Pesa' : (o.payment_status === 'paid' ? 'Paid' : 'Pending'),
    paymentStatus: o.payment_status || 'pending',
    status: (o.status as OrderStatus) || 'Pending',
    date: formatDate(o.created_at),
    deliveryAddress: o.delivery_address || '',
    customerNotes: o.customer_notes || '',
    estimatedDelivery: formatDateTime(o.estimated_delivery_at),
    deliveredAt: formatDateTime(o.delivered_at),
    mpesaRef: o.mpesa_transaction_id || '',
  }))
}

export async function updateOrderStatusAction(id: string, newStatus: OrderStatus) {
  const supabase = await createClient()
  const updates: any = { status: newStatus, updated_at: new Date().toISOString() }
  
  if (newStatus === 'Completed') updates.delivered_at = new Date().toISOString()
  if (newStatus === 'Cancelled') updates.rejected_reason = 'Cancelled by admin'

  const { error } = await supabase.from('orders').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/admin/orders')
}

export async function deleteOrderAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/admin/orders')
}