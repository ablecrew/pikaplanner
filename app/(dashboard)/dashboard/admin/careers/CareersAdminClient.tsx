'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import {
  Plus, Search, Filter, MoreVertical, Edit3, Trash2, Copy, Star,
  Eye, EyeOff, Archive, Calendar, MapPin, Briefcase, Users,
  TrendingUp, FileText, Loader2, ChevronDown, CheckCircle2,
} from 'lucide-react'
import {
  fetchCareers, updateCareerStatusAction, toggleCareerFeaturedAction,
  duplicateCareerAction,
  type Career, type CareerStatus,
} from './actions'
import CareerFormModal from './CareerFormModal'
import DeleteConfirmModal from './DeleteConfirmModal'

const STATUS_META: Record<CareerStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft:     { label: 'Draft',     bg: 'bg-amber-50',    text: 'text-amber-800',    dot: 'bg-amber-500' },
  published: { label: 'Published', bg: 'bg-emerald-50',  text: 'text-[#126e3d]',    dot: 'bg-emerald-500' },
  closed:    { label: 'Closed',    bg: 'bg-slate-100',   text: 'text-slate-700',    dot: 'bg-slate-500' },
  archived:  { label: 'Archived',  bg: 'bg-slate-100',   text: 'text-slate-500',    dot: 'bg-slate-400' },
}

export default function CareersAdminClient({ initial }: { initial: Career[] }) {
  const [careers, setCareers] = useState<Career[]>(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CareerStatus | 'all'>('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [editing, setEditing] = useState<Career | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Career | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [, startTransition] = useTransition()

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // Close action menu on outside click
  useEffect(() => {
    if (!openMenu) return
    const handler = () => setOpenMenu(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenu])

  const refresh = async () => {
    const fresh = await fetchCareers()
    setCareers(fresh)
  }

  // Stats
  const stats = useMemo(() => ({
    total: careers.length,
    published: careers.filter((c) => c.status === 'published').length,
    drafts: careers.filter((c) => c.status === 'draft').length,
    featured: careers.filter((c) => c.is_featured).length,
    totalViews: careers.reduce((sum, c) => sum + (c.views ?? 0), 0),
    totalApps: careers.reduce((sum, c) => sum + (c.applications_count ?? 0), 0),
  }), [careers])

  // Filtering
  const filtered = useMemo(() => {
    return careers.filter((c) => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      const q = search.toLowerCase().trim()
      const matchSearch = !q ||
        c.title.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [careers, statusFilter, search])

  // Actions
  const handleStatusChange = (id: string, status: CareerStatus) => {
    startTransition(async () => {
      const result = await updateCareerStatusAction(id, status)
      if (result.success) {
        await refresh()
        setToast({ msg: `Career marked as ${status}.`, type: 'success' })
      } else {
        setToast({ msg: result.error, type: 'error' })
      }
    })
    setOpenMenu(null)
  }

  const handleToggleFeatured = (career: Career) => {
    startTransition(async () => {
      const result = await toggleCareerFeaturedAction(career.id, !career.is_featured)
      if (result.success) {
        await refresh()
        setToast({
          msg: career.is_featured ? 'Removed from featured.' : 'Marked as featured.',
          type: 'success',
        })
      }
    })
    setOpenMenu(null)
  }

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const result = await duplicateCareerAction(id)
      if (result.success) {
        await refresh()
        setToast({ msg: 'Career duplicated as draft.', type: 'success' })
      } else {
        setToast({ msg: result.error, type: 'error' })
      }
    })
    setOpenMenu(null)
  }

  const handleEdit = (career: Career) => {
    setEditing(career)
    setFormOpen(true)
    setOpenMenu(null)
  }

  const handleCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#126e3d] mb-2">
              Admin Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Careers Management
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Create, edit, and publish job openings to your careers page.
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-3.5 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
          >
            <Plus size={16} /> Post New Career
          </button>
        </div>
      </header>

      {/* ── Stats ──────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Briefcase} label="Total Posts" value={stats.total} color="#1A5C3A" />
        <StatCard icon={CheckCircle2} label="Published" value={stats.published} color="#16a34a" />
        <StatCard icon={FileText} label="Drafts" value={stats.drafts} color="#f97316" />
        <StatCard icon={Star} label="Featured" value={stats.featured} color="#F4A535" />
      </section>

      {/* ── Filters ────────────────────────────────────── */}
      <section className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, department, location..."
            className="w-full rounded-xl border-2 border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]/20 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          <div className="flex gap-1">
            {(['all', 'published', 'draft', 'closed', 'archived'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  statusFilter === s
                    ? 'bg-[#1A5C3A] text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Careers Table / Cards ──────────────────────── */}
      <section>
        {filtered.length === 0 ? (
          <EmptyState onCreate={handleCreate} />
        ) : (
          <div className="space-y-3">
            {filtered.map((career) => (
              <CareerRow
                key={career.id}
                career={career}
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
                onEdit={() => handleEdit(career)}
                onDelete={() => { setDeleteTarget(career); setOpenMenu(null) }}
                onDuplicate={() => handleDuplicate(career.id)}
                onStatusChange={(s) => handleStatusChange(career.id, s)}
                onToggleFeatured={() => handleToggleFeatured(career)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Modals ─────────────────────────────────────── */}
      <CareerFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={async () => {
          await refresh()
          setToast({ msg: editing ? 'Career updated.' : 'Career posted!', type: 'success' })
        }}
      />

      <DeleteConfirmModal
        career={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={async () => {
          await refresh()
          setToast({ msg: 'Career deleted.', type: 'success' })
        }}
      />

      {/* ── Toast ──────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <CheckCircle2 size={16} />
            <p className="text-sm font-bold">{toast.msg}</p>
          </div>
        </div>
      )}
    </>
  )
}

// ── Stat Card ───────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: typeof Briefcase; label: string; value: number; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

// ── Career Row ──────────────────────────────────────────────
function CareerRow({
  career, openMenu, setOpenMenu, onEdit, onDelete, onDuplicate, onStatusChange, onToggleFeatured,
}: {
  career: Career
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onStatusChange: (status: CareerStatus) => void
  onToggleFeatured: () => void
}) {
  const status = STATUS_META[career.status]

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status.bg} ${status.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {career.is_featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-700">
                <Star size={10} className="fill-orange-500 text-orange-500" /> Featured
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {career.department}
            </span>
          </div>

          <h3 className="text-lg font-black text-slate-900 leading-tight">{career.title}</h3>
          <p className="mt-1 text-sm text-slate-600 line-clamp-1">{career.short_description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin size={11} /> {career.location}</span>
            <span>·</span>
            <span className="capitalize">{career.work_type.replace('-', ' ')}</span>
            <span>·</span>
            <span className="capitalize">{career.work_mode}</span>
            {career.salary_min && career.salary_max && (
              <>
                <span>·</span>
                <span className="font-semibold text-slate-700">
                  {career.currency ?? 'KES'} {career.salary_min.toLocaleString()}–{career.salary_max.toLocaleString()}
                </span>
              </>
            )}
            <span className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1"><Eye size={11} /> {career.views}</span>
              <span className="flex items-center gap-1"><Users size={11} /> {career.applications_count}</span>
            </span>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenu(openMenu === career.id ? null : career.id)
            }}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
            aria-label="More actions"
          >
            <MoreVertical size={18} className="text-slate-500" />
          </button>

          {openMenu === career.id && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-10"
            >
              <MenuItem icon={Edit3} label="Edit" onClick={onEdit} />
              <MenuItem
                icon={Star}
                label={career.is_featured ? 'Unfeature' : 'Mark as Featured'}
                onClick={onToggleFeatured}
              />
              <MenuItem icon={Copy} label="Duplicate" onClick={onDuplicate} />
              <div className="my-1 border-t border-gray-100" />
              {career.status !== 'published' && (
                <MenuItem icon={Eye} label="Publish" onClick={() => onStatusChange('published')} />
              )}
              {career.status === 'published' && (
                <MenuItem icon={EyeOff} label="Unpublish (draft)" onClick={() => onStatusChange('draft')} />
              )}
              {career.status !== 'closed' && (
                <MenuItem icon={Archive} label="Close listing" onClick={() => onStatusChange('closed')} />
              )}
              <div className="my-1 border-t border-gray-100" />
              <MenuItem icon={Trash2} label="Delete" onClick={onDelete} danger />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function MenuItem({
  icon: Icon, label, onClick, danger,
}: {
  icon: typeof Briefcase; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-left transition ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

// ── Empty State ─────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
        <Briefcase size={28} className="text-[#126e3d]" />
      </div>
      <h3 className="text-lg font-black text-slate-900">No careers yet</h3>
      <p className="mt-2 max-w-md mx-auto text-sm text-slate-500 leading-relaxed">
        Get started by posting your first job opening. You can save it as a draft
        and publish later.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-3 text-sm font-black uppercase text-white shadow-lg transition hover:shadow-xl"
      >
        <Plus size={16} /> Post First Career
      </button>
    </div>
  )
}