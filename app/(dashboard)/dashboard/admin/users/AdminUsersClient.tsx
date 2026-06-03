'use client'

import { useState, useMemo, useRef, useEffect, memo, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle, CheckCircle2, Download, Edit2, Eye, Loader2, MoreHorizontal,
  Minus, Plus, RefreshCw, Search, ShieldOff, UserCheck, UserPlus, Users,
  Store, UserX, X, Trash2, TrendingDown, TrendingUp
} from 'lucide-react'
import { 
  UserRecord, Role, Status, fetchAdminUsersData, updateUserAction, 
  toggleUserStatusAction, deleteUserAction, createUserAction 
} from './actions'

type ModalMode = 'view' | 'edit' | 'invite' | null

type FormState = { name: string; phone: string; role: Role; status: Status }
type InviteFormState = { name: string; email: string; password: string; phone: string; role: Role; status: Status }

const initialForm: FormState = { name: '', phone: '', role: 'user', status: 'Active' }
const initialInviteForm: InviteFormState = { name: '', email: '', password: '', phone: '', role: 'user', status: 'Active' }

function roleLabel(role: Role) {
  if (role === 'superadmin') return 'Super Admin'
  if (role === 'admin') return 'Admin'
  if (role === 'vendor') return 'Vendor'
  return 'Customer'
}

const RoleBadge = memo(function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = { user: 'bg-slate-100 text-slate-700', vendor: 'bg-orange-100 text-orange-700', admin: 'bg-emerald-100 text-emerald-700', superadmin: 'bg-purple-100 text-purple-700' }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[role]}`}>{roleLabel(role)}</span>
})

const StatusBadge = memo(function StatusBadge({ status }: { status: Status }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{status}</span>
})

function OverlayModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, theme, trend }: { label: string; value: number; icon: typeof Users; theme: 'emerald' | 'orange' | 'purple' | 'rose'; trend: { direction: 'up' | 'down'; label: string } }) {
  const styles = { emerald: { card: 'from-emerald-50 to-white border-emerald-100', icon: 'bg-emerald-100 text-emerald-700' }, orange: { card: 'from-orange-50 to-white border-orange-100', icon: 'bg-orange-100 text-orange-700' }, purple: { card: 'from-purple-50 to-white border-purple-100', icon: 'bg-purple-100 text-purple-700' }, rose: { card: 'from-rose-50 to-white border-rose-100', icon: 'bg-rose-100 text-rose-700' } } as const
  const TrendIcon = trend.direction === 'up' ? TrendingUp : TrendingDown
  const SymbolIcon = trend.direction === 'up' ? Plus : Minus
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${styles[theme].card}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[theme].icon}`}><Icon size={20} /></div>
        <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}><SymbolIcon size={11} /><TrendIcon size={11} />{trend.label}</div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-gray-900">{value}</p>
    </div>
  )
}

const ActionMenu = memo(function ActionMenu({ user, onAction }: { user: UserRecord; onAction: (action: 'view' | 'edit' | 'toggle' | 'delete', user: UserRecord) => void }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button onClick={() => setOpen((prev) => !prev)} className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-white hover:text-gray-700" title="Actions"><MoreHorizontal size={16} /></button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
            <button onClick={() => { onAction('view', user); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"><Eye size={14} /> View</button>
            <button onClick={() => { onAction('edit', user); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"><Edit2 size={14} /> Edit</button>
            <button onClick={() => { onAction('toggle', user); setOpen(false) }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${user.status === 'Active' ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>
              {user.status === 'Active' ? <ShieldOff size={14} /> : <UserCheck size={14} />}{user.status === 'Active' ? 'Suspend' : 'Activate'}
            </button>
            <button onClick={() => { onAction('delete', user); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"><Trash2 size={14} /> Delete</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

// ── Memoized Table Row (Crucial for large lists) ──
const UserRow = memo(function UserRow({ 
  user, onAction, onToggle, actionLoadingId 
}: { 
  user: UserRecord; onAction: (action: 'view' | 'edit' | 'toggle' | 'delete', user: UserRecord) => void; onToggle: (user: UserRecord, status: Status) => void; actionLoadingId: string | null 
}) {
  const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const isToggling = actionLoadingId === user.id && user.status === 'Active'

  return (
    <tr className="border-t border-gray-100 transition-colors hover:bg-gray-50">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{initials}</div>
          <div><p className="font-medium text-gray-900">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-gray-600">{user.phone}</td>
      <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
      <td className="px-5 py-3.5 text-gray-600">{user.orders}</td>
      <td className="px-5 py-3.5 text-gray-500">{user.joinedAt}</td>
      <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(user, 'Inactive')} disabled={actionLoadingId === user.id || user.status !== 'Active'} className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" title="Deactivate">
            {isToggling ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
          </button>
          <ActionMenu user={user} onAction={onAction} />
        </div>
      </td>
    </tr>
  )
})

// ── Main Client Component ──
export default function AdminUsersClient({ initialUsers }: { initialUsers: UserRecord[] }) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | Status>('All')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<UserRecord | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [inviteForm, setInviteForm] = useState<InviteFormState>(initialInviteForm)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refreshUsers = useCallback(async () => {
    setLoading(true)
    const newData = await fetchAdminUsersData()
    setUsers(newData)
    setLoading(false)
  }, [])

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    return users.filter((user) => {
      const matchSearch = !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.phone.toLowerCase().includes(query)
      const matchStatus = statusFilter === 'All' || user.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [users, search, statusFilter])

  const stats = useMemo(() => [
    { label: 'Total Users', value: users.length, icon: Users, theme: 'emerald' as const, trend: { direction: 'up' as const, label: `${users.length}` } },
    { label: 'Active', value: users.filter((u) => u.status === 'Active').length, icon: UserCheck, theme: 'purple' as const, trend: { direction: 'up' as const, label: `${users.filter((u) => u.status === 'Active').length}` } },
    { label: 'Inactive', value: users.filter((u) => u.status === 'Inactive').length, icon: UserX, theme: 'rose' as const, trend: { direction: 'down' as const, label: `${users.filter((u) => u.status === 'Inactive').length}` } },
    { label: 'Vendors', value: users.filter((u) => u.role === 'vendor').length, icon: Store, theme: 'orange' as const, trend: { direction: 'up' as const, label: `${users.filter((u) => u.role === 'vendor').length}` } },
  ], [users])

  const openView = (user: UserRecord) => { setSelected(user); setModalMode('view') }
  const openEdit = (user: UserRecord) => { setSelected(user); setForm({ name: user.name, phone: user.phone === '—' ? '' : user.phone, role: user.role, status: user.status }); setModalMode('edit') }
  const openAdd = () => { setInviteForm(initialInviteForm); setModalMode('invite') }

  const handleSave = async () => {
    if (!selected) return
    setActionLoadingId(selected.id); setError(null); setInfoMessage(null)
    setUsers((current) => current.map((u) => u.id === selected.id ? { ...u, name: form.name, phone: form.phone || '—', role: form.role, status: form.status } : u))
    try {
      await updateUserAction(selected.id, form)
      setInfoMessage('User updated successfully.'); setModalMode(null); setSelected(null)
    } catch (err: any) { 
      setError(err.message)
      await refreshUsers() // Revert optimistic UI on error
    } finally { setActionLoadingId(null) }
  }

  const handleInvite = async () => {
    setInviteLoading(true); setError(null); setInfoMessage(null)
    try {
      const formData = new FormData()
      Object.entries(inviteForm).forEach(([key, value]) => formData.append(key, value))
      
      // The action now throws an error directly if it fails
      await createUserAction(formData)
      
      setInfoMessage(`${inviteForm.name} has been created successfully.`)
      setModalMode(null)
      setInviteForm(initialInviteForm)
      await refreshUsers()
    } catch (err: any) { 
      setError(err.message || 'Failed to create user') 
    } finally { 
      setInviteLoading(false) 
    }
  }

  const handleToggleActive = async (user: UserRecord, nextStatus: Status) => {
    setActionLoadingId(user.id); setError(null); setInfoMessage(null)
    setUsers((current) => current.map((u) => u.id === user.id ? { ...u, status: nextStatus } : u))
    try {
      await toggleUserStatusAction(user.id, nextStatus === 'Active')
      setInfoMessage(`${user.name} is now ${nextStatus.toLowerCase()}.`)
    } catch (err: any) { 
      setError(err.message)
      await refreshUsers() // Revert optimistic UI on error
    } finally { setActionLoadingId(null) }
  }

  const handleDelete = async (user: UserRecord) => {
    if (!window.confirm(`Delete ${user.name}? This will permanently remove their auth account and profile.`)) return
    setActionLoadingId(user.id); setError(null); setInfoMessage(null)
    
    // Optimistic UI: Remove immediately
    setUsers((current) => current.filter((u) => u.id !== user.id))
    
    try {
      // The action now throws an error directly if it fails
      await deleteUserAction(user.id)
      setInfoMessage(`${user.name} was deleted successfully.`)
    } catch (err: any) { 
      setError(err.message || 'Failed to delete user')
      await refreshUsers() // Revert optimistic UI on error
    } finally { 
      setActionLoadingId(null) 
    }
  }

  const handleAction = async (action: 'view' | 'edit' | 'toggle' | 'delete', user: UserRecord) => {
    if (action === 'view') openView(user)
    else if (action === 'edit') openEdit(user)
    else if (action === 'toggle') await handleToggleActive(user, user.status === 'Active' ? 'Inactive' : 'Active')
    else if (action === 'delete') await handleDelete(user)
  }

  const exportCsv = () => {
    const rows = [['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Orders', 'Joined'], ...filtered.map((u) => [u.id, u.name, u.email, u.phone, roleLabel(u.role), u.status, String(u.orders), u.joinedAt])]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = 'admin-users.csv'
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
  }

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage real registered users from your database.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={refreshUsers} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"><UserPlus size={16} /> Add User</button>
        </div>
      </div>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</motion.div>}
        {infoMessage && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {infoMessage}</motion.div>}
      </AnimatePresence>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => startTransition(() => setSearch(e.target.value))} placeholder="Search users..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Active', 'Inactive'] as const).map((status) => (
              <button key={status} onClick={() => startTransition(() => setStatusFilter(status))} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${statusFilter === status ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{status}</button>
            ))}
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"><Download size={15} /> Export</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-medium">User</th><th className="px-5 py-3 font-medium">Phone</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Orders</th><th className="px-5 py-3 font-medium">Joined</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400"><div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading users...</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">No users found.</td></tr>
              ) : (
                filtered.map((user) => <UserRow key={user.id} user={user} onAction={handleAction} onToggle={handleToggleActive} actionLoadingId={actionLoadingId} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OverlayModal open={modalMode === 'view'} title="User Details" onClose={() => setModalMode(null)}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">{selected.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div><h3 className="font-semibold text-gray-900">{selected.name}</h3><p className="text-sm text-gray-500">{selected.email}</p><div className="mt-2 flex gap-2"><RoleBadge role={selected.role} /><StatusBadge status={selected.status} /></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[['User ID', selected.id], ['Phone', selected.phone], ['Role', roleLabel(selected.role)], ['Orders', selected.orders], ['Joined', selected.joinedAt], ['Status', selected.status]].map(([label, value]) => (
                <div key={String(label)}><p className="mb-0.5 text-xs text-gray-400">{label}</p><p className="text-sm font-medium text-gray-800">{String(value)}</p></div>
              ))}
            </div>
          </div>
        )}
      </OverlayModal>

      <OverlayModal open={modalMode === 'edit'} title="Edit User" onClose={() => setModalMode(null)}>
        <div className="space-y-4 text-gray-900">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label><input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} placeholder="John Doe" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Phone</label><input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className={inputClass} placeholder="+254 700 000 000" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Role</label><select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))} className={inputClass}><option value="user">Customer</option><option value="vendor">Vendor</option><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Status</label><select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Status }))} className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalMode(null)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={!selected || actionLoadingId === selected.id} className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60">{actionLoadingId === selected?.id ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </OverlayModal>

      <OverlayModal open={modalMode === 'invite'} title="Add New User" onClose={() => setModalMode(null)}>
        <div className="space-y-4 text-gray-900">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label><input value={inviteForm.name} onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))} className={inputClass} placeholder="John Doe" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label><input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))} className={inputClass} placeholder="john@example.com" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password</label><input type="password" value={inviteForm.password} onChange={(e) => setInviteForm((prev) => ({ ...prev, password: e.target.value }))} className={inputClass} placeholder="Min 8 characters" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Phone</label><input value={inviteForm.phone} onChange={(e) => setInviteForm((prev) => ({ ...prev, phone: e.target.value }))} className={inputClass} placeholder="+254 700 000 000" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Role</label><select value={inviteForm.role} onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value as Role }))} className={inputClass}><option value="user">Customer</option><option value="vendor">Vendor</option><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Status</label><select value={inviteForm.status} onChange={(e) => setInviteForm((prev) => ({ ...prev, status: e.target.value as Status }))} className={inputClass}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalMode(null)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50">Cancel</button>
            <button onClick={handleInvite} disabled={inviteLoading || !inviteForm.name || !inviteForm.email || !inviteForm.password} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60">{inviteLoading ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating...</> : 'Create User'}</button>
          </div>
        </div>
      </OverlayModal>
    </motion.div>
  )
}