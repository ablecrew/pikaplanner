'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type VendorStatus = 'Active' | 'Pending' | 'Suspended' | 'Archived'

export type Vendor = {
  id: string
  name: string
  email: string
  phone: string
  category: string
  location: string
  status: VendorStatus
  joinedAt: string
  totalOrders: number
  revenue: string
  rating: number
}

// ── Mapping helpers ───────────────────────────────────────
function deriveVendorStatus(is_verified: boolean | null, is_active: boolean | null): VendorStatus {
  if (!is_verified) return 'Pending'
  if (is_active === false) return 'Suspended'
  return 'Active'
}

function booleansFromStatus(status: VendorStatus) {
  switch (status) {
    case 'Active':    return { is_verified: true,  is_active: true,  is_accepting_orders: true  }
    case 'Pending':   return { is_verified: false, is_active: true,  is_accepting_orders: false }
    case 'Suspended': return { is_verified: true,  is_active: false, is_accepting_orders: false }
    case 'Archived':  return { is_verified: false, is_active: false, is_accepting_orders: false }
    default:          return { is_verified: false, is_active: false, is_accepting_orders: false }
  }
}

function mapDbVendorToUI(v: any): Vendor {
  const statusFromBooleans = deriveVendorStatus(v.is_verified, v.is_active)
  const status: VendorStatus = (v.status && ['Active', 'Pending', 'Suspended', 'Archived'].includes(v.status))
    ? v.status
    : statusFromBooleans

  const earnings = Number(v.total_earnings ?? v.revenue ?? 0)

  return {
    id: v.id,
    name: v.business_name || v.name || 'Unnamed Vendor',
    email: v.email || '',
    phone: v.phone || '',
    category: v.category || 'General',
    location: v.location_city || v.location || '',
    status,
    joinedAt: v.created_at
      ? new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    totalOrders: Number(v.total_orders ?? 0),
    revenue: `$${earnings.toFixed(2)}`,
    rating: Number(v.rating ?? 0),
  }
}

function buildVendorDbPayload(form: { name: string; email: string; phone: string; category?: string; location: string; status: VendorStatus }) {
  const booleans = booleansFromStatus(form.status)
  return {
    business_name: form.name,
    email: form.email,
    phone: form.phone,
    location_city: form.location,
    category: form.category || 'General',
    ...booleans,
  }
}

// ── Server Actions ────────────────────────────────────────

export async function fetchAdminVendorsData(): Promise<Vendor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapDbVendorToUI)
}

export async function createVendorAction(form: any) {
  const supabase = await createClient()
  const payload = buildVendorDbPayload(form)
  
  const { data, error } = await supabase.from('vendors').insert([{
    ...payload,
    total_orders: 0,
    total_earnings: 0,
    available_balance: 0,
    withdrawal_threshold: 500,
    rating: 0,
  }]).select()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/vendors')
  return data && data.length > 0 ? mapDbVendorToUI(data[0]) : null
}

export async function updateVendorAction(id: string, form: any) {
  const supabase = await createClient()
  const payload = buildVendorDbPayload(form)
  
  const { error } = await supabase.from('vendors').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/vendors')
}

export async function updateVendorStatusAction(id: string, status: VendorStatus) {
  const supabase = await createClient()
  const booleans = booleansFromStatus(status)
  
  const { error } = await supabase.from('vendors').update(booleans).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/vendors')
}

export async function deleteVendorAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('vendors').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/vendors')
}