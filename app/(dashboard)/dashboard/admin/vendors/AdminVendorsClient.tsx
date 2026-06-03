'use client'

import { useState, useMemo, memo, useTransition, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Search, Eye, Edit2, Trash2, ShieldOff, Archive, UserCheck, Star, Download,
  Loader2, CheckCircle2, AlertCircle, Store, TrendingUp, TrendingDown, Users, UserCheck2, UserX2
} from 'lucide-react'
import type { Vendor, VendorStatus } from './actions'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormField, Input, Select } from '@/components/ui/FormField'
import { 
  fetchAdminVendorsData, createVendorAction, updateVendorAction, 
  updateVendorStatusAction, deleteVendorAction 
} from './actions'

const initialForm = { name: '', email: '', phone: '', category: 'Healthy', location: '', status: 'Pending' as VendorStatus }

// ── Memoized Table Row (Crucial for large lists) ──
const VendorRow = memo(function VendorRow({ 
  vendor, onView, onEdit, onConfirm 
}: { 
  vendor: Vendor
  onView: (v: Vendor) => void
  onEdit: (v: Vendor) => void
  onConfirm: (type: string, vendor: Vendor) => void
}) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {vendor.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{vendor.name}</p>
            <p className="text-xs text-gray-500">{vendor.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-gray-600">{vendor.category}</td>
      <td className="px-5 py-3.5 text-gray-600">{vendor.location}</td>
      <td className="px-5 py-3.5 text-gray-600">{vendor.totalOrders}</td>
      <td className="px-5 py-3.5 font-medium text-gray-800">{vendor.revenue}</td>
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-1 text-amber-500 font-medium">
          <Star size={13} fill="currentColor" /> {vendor.rating}
        </span>
      </td>
      <td className="px-5 py-3.5"><Badge status={vendor.status} /></td>
      <td className="px-5 py-3.5">
        <ActionMenu actions={[
          { label: 'View', icon: <Eye size={14} />, onClick: () => onView(vendor) },
          { label: 'Edit', icon: <Edit2 size={14} />, onClick: () => onEdit(vendor) },
          ...(vendor.status === 'Pending'
            ? [{ label: 'Approve', icon: <UserCheck size={14} />, onClick: () => onConfirm('approve', vendor), variant: 'default' as const }]
            : []),
          ...(vendor.status === 'Active'
            ? [{ label: 'Suspend', icon: <ShieldOff size={14} />, onClick: () => onConfirm('suspend', vendor), variant: 'warning' as const }]
            : []),
          ...(vendor.status === 'Suspended'
            ? [{ label: 'Activate', icon: <UserCheck size={14} />, onClick: () => onConfirm('activate', vendor), variant: 'default' as const }]
            : []),
          { label: 'Archive', icon: <Archive size={14} />, onClick: () => onConfirm('archive', vendor), variant: 'warning' as const },
          { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => onConfirm('delete', vendor), variant: 'danger' as const },
        ]} />
      </td>
    </tr>
  )
})

// ── Main Client Component ──
export default function AdminVendorsClient({ initialVendors }: { initialVendors: Vendor[] }) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Vendor | null>(null)
  const [form, setForm] = useState(initialForm)
  const [confirm, setConfirm] = useState<{ type: string; vendor: Vendor } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refreshVendors = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminVendorsData()
      setVendors(data)
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }, [])

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const q = search.toLowerCase().trim()
      const matchSearch = !q || v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || v.location.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || v.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [vendors, search, statusFilter])

  const stats = useMemo(() => {
    const active = vendors.filter(v => v.status === 'Active').length
    const pending = vendors.filter(v => v.status === 'Pending').length
    const suspended = vendors.filter(v => v.status === 'Suspended').length

    return [
      { label: 'Total Vendors', value: vendors.length, icon: Store, trend: '+5%', isIncrease: true, color: 'emerald' },
      { label: 'Active', value: active, icon: UserCheck2, trend: '+2%', isIncrease: true, color: 'sky' },
      { label: 'Pending', value: pending, icon: Users, trend: '+1%', isIncrease: true, color: 'orange' },
      { label: 'Suspended', value: suspended, icon: UserX2, trend: '-1%', isIncrease: false, color: 'red' },
    ]
  }, [vendors])

  const openAdd = () => { setForm(initialForm); setSelected(null); setModalMode('add'); setError(null) }
  const openEdit = (v: Vendor) => { setForm({ name: v.name, email: v.email, phone: v.phone, category: v.category, location: v.location, status: v.status }); setSelected(v); setModalMode('edit'); setError(null) }
  const openView = (v: Vendor) => { setSelected(v); setModalMode('view') }

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      if (modalMode === 'add') {
        const newVendor = await createVendorAction(form)
        if (newVendor) setVendors(prev => [newVendor, ...prev])
        setInfoMessage('Vendor added successfully.')
      } else if (modalMode === 'edit' && selected) {
        // Optimistic UI
        setVendors(prev => prev.map(v => v.id === selected.id ? { ...v, ...form } : v))
        await updateVendorAction(selected.id, form)
        setInfoMessage('Vendor updated successfully.')
      }
      setModalMode(null)
    } catch (err: any) {
      setError(err.message)
      await refreshVendors() // Revert on error
    } finally { setSaving(false) }
  }

  const handleConfirm = async () => {
    if (!confirm) return
    const { type, vendor } = confirm
    setSaving(true); setError(null)

    // Optimistic UI mapping
    const statusMap: Record<string, VendorStatus> = { suspend: 'Suspended', archive: 'Archived', activate: 'Active', approve: 'Active' }

    try {
      if (type === 'delete') {
        setVendors(prev => prev.filter(v => v.id !== vendor.id))
        await deleteVendorAction(vendor.id)
        setInfoMessage('Vendor deleted successfully.')
      } else if (statusMap[type]) {
        const nextStatus = statusMap[type]
        setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, status: nextStatus } : v))
        await updateVendorStatusAction(vendor.id, nextStatus)
        setInfoMessage(`Vendor ${type}d successfully.`)
      }
      setConfirm(null)
    } catch (err: any) {
      setError(err.message)
      await refreshVendors() // Revert on error
    } finally { setSaving(false) }
  }

  const exportCsv = () => {
    const rows = [['ID', 'Name', 'Email', 'Phone', 'Category', 'Location', 'Status', 'Orders', 'Revenue', 'Rating', 'Joined'], ...filtered.map((v) => [v.id, v.name, v.email, v.phone, v.category, v.location, v.status, v.totalOrders, v.revenue, v.rating, v.joinedAt])]
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = 'admin-vendors.csv'
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
  }

  const colorMap: Record<string, string> = { emerald: 'bg-emerald-100 text-emerald-600', sky: 'bg-sky-100 text-sky-600', orange: 'bg-orange-100 text-orange-600', red: 'bg-red-100 text-red-600' }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Vendors"
        subtitle="Manage all food vendors on Pika Plan."
        action={
          <button onClick={openAdd} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Vendor
          </button>
        }
      />

      {error && <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</div>}
      {infoMessage && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {infoMessage}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.isIncrease ? TrendingUp : TrendingDown
          const trendColor = stat.isIncrease ? 'text-emerald-600' : 'text-red-600'
          return (
            <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[stat.color] || 'bg-gray-100 text-gray-600'}`}><Icon size={18} /></div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}><TrendIcon size={14} />{stat.trend}</div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => startTransition(() => setSearch(e.target.value))} placeholder="Search vendors..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Active', 'Pending', 'Suspended', 'Archived'].map((s) => (
              <button key={s} onClick={() => startTransition(() => setStatusFilter(s))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"><Download size={15} /> Export</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Vendor</th><th className="px-5 py-3 font-medium">Category</th><th className="px-5 py-3 font-medium">Location</th><th className="px-5 py-3 font-medium">Orders</th><th className="px-5 py-3 font-medium">Revenue</th><th className="px-5 py-3 font-medium">Rating</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400"><div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading vendors...</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">No vendors found.</td></tr>
              ) : (
                filtered.map((vendor) => (
                  <VendorRow key={vendor.id} vendor={vendor} onView={openView} onEdit={openEdit} onConfirm={(type, v) => setConfirm({ type, vendor: v })} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalMode === 'add' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={modalMode === 'add' ? 'Add New Vendor' : 'Edit Vendor'} size="md">
        <div className="space-y-4 text-gray-900">
          <FormField label="Vendor Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Green Bowl Kitchen" /></FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@vendor.com" /></FormField>
          <FormField label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 700 000000" /></FormField>
          <FormField label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Nairobi, Kenya" /></FormField>
          <div className="grid grid-cols-2 gap-4 text-gray-900">
            <FormField label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={['Healthy', 'Indian', 'Salads', 'Asian', 'Burgers', 'Japanese', 'Mexican', 'Italian', 'Fast Food', 'Kenyan', 'Swahili'].map(c => ({ value: c, label: c }))} />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VendorStatus })} options={[{ value: 'Active', label: 'Active' }, { value: 'Pending', label: 'Pending' }, { value: 'Suspended', label: 'Suspended' }, { value: 'Archived', label: 'Archived' }]} />
            </FormField>
          </div>
          <div className="flex gap-3 pt-2 text-gray-900">
            <button onClick={() => setModalMode(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.email} className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />} {modalMode === 'add' ? 'Add Vendor' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalMode === 'view'} onClose={() => setModalMode(null)} title="Vendor Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">{selected.name.charAt(0)}</div>
              <div><h3 className="font-semibold text-gray-900">{selected.name}</h3><p className="text-sm text-gray-500">{selected.email}</p><Badge status={selected.status} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[['Vendor ID', selected.id], ['Phone', selected.phone], ['Category', selected.category], ['Location', selected.location], ['Total Orders', selected.totalOrders], ['Revenue', selected.revenue], ['Rating', `${selected.rating} ★`], ['Joined', selected.joinedAt]].map(([k, v]) => (
                <div key={String(k)}><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="text-sm font-medium text-gray-800">{String(v)}</p></div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirm}
        title={`${confirm?.type.charAt(0).toUpperCase()}${confirm?.type.slice(1)} Vendor`}
        message={`Are you sure you want to ${confirm?.type} ${confirm?.vendor.name}?${confirm?.type === 'delete' ? ' This cannot be undone.' : ''}`}
        confirmLabel={`${confirm?.type.charAt(0).toUpperCase()}${confirm?.type.slice(1)}`}
        confirmVariant={confirm?.type === 'delete' ? 'danger' : confirm?.type === 'approve' ? 'primary' : 'warning'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}