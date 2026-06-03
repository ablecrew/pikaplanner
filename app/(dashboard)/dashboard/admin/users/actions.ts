'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createUser } from '@/app/actions/createUser'
import { deleteUser } from '@/app/actions/deleteUser'

export type Role = 'user' | 'vendor' | 'admin' | 'superadmin'
export type Status = 'Active' | 'Inactive'

export type UserRecord = {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  status: Status
  joinedAt: string
  orders: number
}

export async function fetchAdminUsersData(): Promise<UserRecord[]> {
  const supabase = await createClient()

  // PARALLEL FETCHING (Massive speedup)
  const [profilesRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, phone, role, is_active, created_at').order('created_at', { ascending: false }),
    supabase.from('orders').select('user_id')
  ])

  const profiles = profilesRes.data || []
  const orders = ordersRes.data || []

  // Calculate order counts on the server
  const orderCounts = new Map<string, number>()
  orders.forEach((o: any) => {
    if (o.user_id) orderCounts.set(o.user_id, (orderCounts.get(o.user_id) || 0) + 1)
  })

  // Map to UserRecord
  return profiles.map((p: any) => ({
    id: p.id,
    name: p.full_name || 'Unnamed user',
    email: p.email || 'No email',
    phone: p.phone || '—',
    role: (p.role || 'user') as Role,
    status: (p.is_active === false ? 'Inactive' : 'Active') as Status,
    joinedAt: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    orders: orderCounts.get(p.id) || 0,
  }))
}

export async function updateUserAction(id: string, data: { name: string; phone: string; role: Role; status: Status }) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({
    full_name: data.name,
    phone: data.phone || null,
    role: data.role,
    is_active: data.status === 'Active',
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/users')
}

export async function toggleUserStatusAction(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/admin/users')
}

export async function deleteUserAction(id: string) {
  const result = await deleteUser(id)
  revalidatePath('/dashboard/admin/users')
  return result
}

export async function createUserAction(formData: FormData) {
  const result = await createUser(formData)
  revalidatePath('/dashboard/admin/users')
  return result
}