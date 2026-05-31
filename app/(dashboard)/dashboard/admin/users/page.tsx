'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit2,
  Eye,
  Loader2,
  MoreHorizontal,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldOff,
  UserCheck,
  UserPlus,
  Users,
  Store,
  UserX,
  X,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createUser } from '@/app/actions/createUser'
import { deleteUser } from '@/app/actions/deleteUser'

type Role = 'user' | 'vendor' | 'admin' | 'superadmin'
type Status = 'Active' | 'Inactive'

type ProfileRow = {
  id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  role?: Role | null
  is_active?: boolean | null
  created_at?: string | null
}

type OrderRow = {
  user_id?: string | null
}

type UserRecord = {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  status: Status
  joinedAt: string
  orders: number
}

type ModalMode = 'view' | 'edit' | 'invite' | null

type FormState = {
  name: string
  phone: string
  role: Role
  status: Status
}

type InviteFormState = {
  name: string
  email: string
  password: string
  phone: string
  role: Role
  status: Status
}

const initialForm: FormState = {
  name: '',
  phone: '',
  role: 'user',
  status: 'Active',
}

const initialInviteForm: InviteFormState = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'user',
  status: 'Active',
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function roleLabel(role: Role) {
  if (role === 'superadmin') return 'Super Admin'
  if (role === 'admin') return 'Admin'
  if (role === 'vendor') return 'Vendor'
  return 'Customer'
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    user: 'bg-slate-100 text-slate-700',
    vendor: 'bg-orange-100 text-orange-700',
    admin: 'bg-emerald-100 text-emerald-700',
    superadmin: 'bg-purple-100 text-purple-700',
  }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[role]}`}>{roleLabel(role)}</span>
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
      }`}
    >
      {status}
    </span>
  )
}

function OverlayModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  theme,
  trend,
}: {
  label: string
  value: number
  icon: typeof Users
  theme: 'emerald' | 'orange' | 'purple' | 'rose'
  trend: { direction: 'up' | 'down'; label: string }
}) {
  const styles = {
    emerald: {
      card: 'from-emerald-50 to-white border-emerald-100',
      icon: 'bg-emerald-100 text-emerald-700',
    },
    orange: {
      card: 'from-orange-50 to-white border-orange-100',
      icon: 'bg-orange-100 text-orange-700',
    },
    purple: {
      card: 'from-purple-50 to-white border-purple-100',
      icon: 'bg-purple-100 text-purple-700',
    },
    rose: {
      card: 'from-rose-50 to-white border-rose-100',
      icon: 'bg-rose-100 text-rose-700',
    },
  } as const
  const trendClasses = trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
  const TrendIcon = trend.direction === 'up' ? TrendingUp : TrendingDown
  const SymbolIcon = trend.direction === 'up' ? Plus : Minus
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${styles[theme].card}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[theme].icon}`}>
          <Icon size={20} />
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${trendClasses}`}>
          <SymbolIcon size={11} />
          <TrendIcon size={11} />
          {trend.label}
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-gray-900">{value}</p>
    </div>
  )
}

function ActionMenu({
  user,
  onAction,
}: {
  user: UserRecord
  onAction: (action: 'view' | 'edit' | 'toggle' | 'delete', user: UserRecord) => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-white hover:text-gray-700"
        title="Actions"
      >
        <MoreHorizontal size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
          >
            <button
              onClick={() => {
                onAction('view', user)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <Eye size={14} /> View
            </button>
            <button
              onClick={() => {
                onAction('edit', user)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              onClick={() => {
                onAction('toggle', user)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                user.status === 'Active'
                  ? 'text-amber-700 hover:bg-amber-50'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {user.status === 'Active' ? <ShieldOff size={14} /> : <UserCheck size={14} />}
              {user.status === 'Active' ? 'Suspend' : 'Activate'}
            </button>
            <button
              onClick={() => {
                onAction('delete', user)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminUsersPage() {
  const supabase = createClient()

  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
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

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    setInfoMessage(null)

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, is_active, created_at')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      let orderCounts: Record<string, number> = {}
      // Note: If 'orders' table is restricted, this part might fail. 
      // It is wrapped in a try/catch logic implicitly via the if check, but good to be aware.
      const { data: orders, error: ordersError } = await supabase.from('orders').select('user_id')
      if (!ordersError) {
        orderCounts = ((orders ?? []) as OrderRow[]).reduce<Record<string, number>>((acc, order) => {
          const currentUserId = order.user_id ?? ''
          if (!currentUserId) return acc
          acc[currentUserId] = (acc[currentUserId] ?? 0) + 1
          return acc
        }, {})
      }

      const mapped: UserRecord[] = ((profiles ?? []) as ProfileRow[]).map((profile) => ({
        id: profile.id,
        name: profile.full_name || 'Unnamed user',
        email: profile.email || 'No email',
        phone: profile.phone || '—',
        role: (profile.role || 'user') as Role,
        status: (profile.is_active === false ? 'Inactive' : 'Active') as Status,
        joinedAt: formatDate(profile.created_at),
        orders: orderCounts[profile.id] ?? 0,
      }))

      setUsers(mapped)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    return users.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query)
      const matchStatus = statusFilter === 'All' || user.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [users, search, statusFilter])

  const stats = useMemo(
    () => [
      {
        label: 'Total Users',
        value: users.length,
        icon: Users,
        theme: 'emerald' as const,
        trend: { direction: 'up' as const, label: `${users.length}` },
      },
      {
        label: 'Active',
        value: users.filter((user) => user.status === 'Active').length,
        icon: UserCheck,
        theme: 'purple' as const,
        trend: {
          direction: 'up' as const,
          label: `${users.filter((user) => user.status === 'Active').length}`,
        },
      },
      {
        label: 'Inactive',
        value: users.filter((user) => user.status === 'Inactive').length,
        icon: UserX,
        theme: 'rose' as const,
        trend: {
          direction: 'down' as const,
          label: `${users.filter((user) => user.status === 'Inactive').length}`,
        },
      },
      {
        label: 'Vendors',
        value: users.filter((user) => user.role === 'vendor').length,
        icon: Store,
        theme: 'orange' as const,
        trend: {
          direction: 'up' as const,
          label: `${users.filter((user) => user.role === 'vendor').length}`,
        },
      },
    ],
    [users],
  )

  const openView = (user: UserRecord) => {
    setSelected(user)
    setModalMode('view')
  }

  const openEdit = (user: UserRecord) => {
    setSelected(user)
    setForm({
      name: user.name,
      phone: user.phone === '—' ? '' : user.phone,
      role: user.role,
      status: user.status,
    })
    setModalMode('edit')
  }

  const openAdd = () => {
    setInviteForm(initialInviteForm)
    setModalMode('invite')
  }

  const handleSave = async () => {
    if (!selected) return
    setActionLoadingId(selected.id)
    setError(null)
    setInfoMessage(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: form.name,
          phone: form.phone || null,
          role: form.role,
          is_active: form.status === 'Active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selected.id)

      if (updateError) throw updateError

      setUsers((current) =>
        current.map((user) =>
          user.id === selected.id
            ? {
                ...user,
                name: form.name,
                phone: form.phone || '—',
                role: form.role,
                status: form.status,
              }
            : user,
        ),
      )

      setInfoMessage('User updated successfully.')
      setModalMode(null)
      setSelected(null)
    } catch (err) {
      console.error('Failed to update user:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleInvite = async () => {
    setInviteLoading(true)
    setError(null)
    setInfoMessage(null)

    try {
      // FIX: Construct FormData object to match the expected input type of createUser
      const formData = new FormData()
      formData.append('name', inviteForm.name)
      formData.append('email', inviteForm.email)
      formData.append('password', inviteForm.password)
      formData.append('phone', inviteForm.phone)
      formData.append('role', inviteForm.role)
      formData.append('status', inviteForm.status)

      const result = await createUser(formData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user')
      }

      // FIX: Removed result.message usage as it doesn't exist on the return type
      setInfoMessage(`${inviteForm.name} has been created successfully.`)
      setModalMode(null)
      setInviteForm(initialInviteForm)
      await fetchUsers()
    } catch (err) {
      console.error('Failed to create user:', err)
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleToggleActive = async (user: UserRecord, nextStatus: Status) => {
    setActionLoadingId(user.id)
    setError(null)
    setInfoMessage(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_active: nextStatus === 'Active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setUsers((current) =>
        current.map((entry) =>
          entry.id === user.id
            ? {
                ...entry,
                status: nextStatus,
              }
            : entry,
        ),
      )
      setInfoMessage(`${user.name} is now ${nextStatus.toLowerCase()}.`)
    } catch (err) {
      console.error('Failed to update status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user status')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (user: UserRecord) => {
    const confirmed = window.confirm(`Delete ${user.name}? This will remove the auth user and profile.`)
    if (!confirmed) return

    setActionLoadingId(user.id)
    setError(null)
    setInfoMessage(null)

    try {
      const result = await deleteUser(user.id)
      if (!result.success) throw new Error(result.error || 'Failed to delete user')
      
      setUsers((current) => current.filter((entry) => entry.id !== user.id))
      // FIX: Removed result.message usage
      setInfoMessage(`${user.name} was deleted successfully.`)
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleAction = async (action: 'view' | 'edit' | 'toggle' | 'delete', user: UserRecord) => {
    if (action === 'view') {
      openView(user)
      return
    }
    if (action === 'edit') {
      openEdit(user)
      return
    }
    if (action === 'toggle') {
      const nextStatus: Status = user.status === 'Active' ? 'Inactive' : 'Active'
      await handleToggleActive(user, nextStatus)
      return
    }
    if (action === 'delete') {
      await handleDelete(user)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Orders', 'Joined'],
      ...filtered.map((user) => [
        user.id,
        user.name,
        user.email,
        user.phone,
        roleLabel(user.role),
        user.status,
        String(user.orders),
        user.joinedAt,
      ]),
    ]

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'admin-users.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage real registered users from your database.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void fetchUsers()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

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

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Active', 'Inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === status
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            <Download size={15} /> Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Loading users...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-t border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                          {user.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{user.phone}</td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{user.orders}</td>
                    <td className="px-5 py-3.5 text-gray-500">{user.joinedAt}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void handleToggleActive(user, 'Inactive')}
                          disabled={actionLoadingId === user.id || user.status !== 'Active'}
                          className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Deactivate"
                        >
                          {actionLoadingId === user.id && user.status === 'Active' ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                        </button>
                        <ActionMenu user={user} onAction={handleAction} />
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OverlayModal open={modalMode === 'view'} title="User Details" onClose={() => setModalMode(null)}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
                {selected.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.email}</p>
                <div className="mt-2 flex gap-2">
                  <RoleBadge role={selected.role} />
                  <StatusBadge status={selected.status} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[
                ['User ID', selected.id],
                ['Phone', selected.phone],
                ['Role', roleLabel(selected.role)],
                ['Orders', selected.orders],
                ['Joined', selected.joinedAt],
                ['Status', selected.status],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="mb-0.5 text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </OverlayModal>

      <OverlayModal open={modalMode === 'edit'} title="Edit User" onClose={() => setModalMode(null)}>
        <div className="space-y-4 text-gray-900">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="+254 700 000 000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="user">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Status }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalMode(null)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={!selected || actionLoadingId === selected.id}
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {selected && actionLoadingId === selected.id ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </OverlayModal>

      <OverlayModal open={modalMode === 'invite'} title="Add New User" onClose={() => setModalMode(null)}>
        <div className="space-y-4 text-gray-900">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              value={inviteForm.name}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password</label>
            <input
              type="password"
              value={inviteForm.password}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input
              value={inviteForm.phone}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="+254 700 000 000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value as Role }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="user">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={inviteForm.status}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, status: e.target.value as Status }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalMode(null)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleInvite()}
              disabled={inviteLoading || !inviteForm.name || !inviteForm.email || !inviteForm.password}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {inviteLoading && <Loader2 size={16} className="animate-spin" />}
              {inviteLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </OverlayModal>
    </motion.div>
  )
}