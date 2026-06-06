'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  X, Save, Loader2, Plus, Trash2, AlertCircle, CheckCircle2,
  Briefcase, MapPin, DollarSign, Clock, Award, Sparkles,
  FileText, Link as LinkIcon, Mail, Calendar, Star, Eye, EyeOff,
} from 'lucide-react'
import {
  createCareerAction, updateCareerAction,
  type Career, type CareerFormInput, type CareerStatus,
  type WorkType, type WorkMode, type ExperienceLevel,
} from './actions'

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'Operations', 'Customer Support', 'Finance', 'People & Culture', 'Other',
]

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-Site' },
]

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Entry-level' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Principal' },
]

// 🎨 Shared input class — ALWAYS visible text!
const INPUT_CLASS =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium ' +
  'text-slate-900 placeholder:text-slate-400 transition focus:outline-none ' +
  'focus:border-[#32CD32] focus:ring-2 focus:ring-[#32CD32]/20 disabled:bg-slate-50'

const LABEL_CLASS = 'block text-sm font-bold text-slate-700 mb-1.5'

const EMPTY_FORM: CareerFormInput = {
  title: '',
  department: 'Engineering',
  location: 'Nairobi, Kenya',
  work_type: 'full-time',
  work_mode: 'hybrid',
  experience_level: 'mid',
  salary_min: undefined,
  salary_max: undefined,
  currency: 'KES',
  short_description: '',
  description: '',
  responsibilities: [],
  requirements: [],
  benefits: [],
  skills: [],
  application_url: '',
  application_email: '',
  application_deadline: '',
  is_featured: false,
  status: 'draft',
}

type Props = {
  open: boolean
  editing: Career | null
  onClose: () => void
  onSaved: () => void
}

export default function CareerFormModal({ open, editing, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CareerFormInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Reset form when modal opens / editing changes
  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          title: editing.title,
          department: editing.department,
          location: editing.location,
          work_type: editing.work_type,
          work_mode: editing.work_mode,
          experience_level: editing.experience_level,
          salary_min: editing.salary_min ?? undefined,
          salary_max: editing.salary_max ?? undefined,
          currency: editing.currency ?? 'KES',
          short_description: editing.short_description,
          description: editing.description,
          responsibilities: editing.responsibilities ?? [],
          requirements: editing.requirements ?? [],
          benefits: editing.benefits ?? [],
          skills: editing.skills ?? [],
          application_url: editing.application_url ?? '',
          application_email: editing.application_email ?? '',
          application_deadline: editing.application_deadline ?? '',
          is_featured: editing.is_featured,
          status: editing.status,
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setError(null)
    }
  }, [open, editing])

  // Lock body scroll + close on Escape
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const update = <K extends keyof CareerFormInput>(key: K, value: CareerFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateArray = (key: 'responsibilities' | 'requirements' | 'benefits' | 'skills', idx: number, value: string) => {
    setForm((prev) => {
      const arr = [...(prev[key] ?? [])]
      arr[idx] = value
      return { ...prev, [key]: arr }
    })
  }

  const addToArray = (key: 'responsibilities' | 'requirements' | 'benefits' | 'skills') => {
    setForm((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), ''] }))
  }

  const removeFromArray = (key: 'responsibilities' | 'requirements' | 'benefits' | 'skills', idx: number) => {
    setForm((prev) => {
      const arr = [...(prev[key] ?? [])]
      arr.splice(idx, 1)
      return { ...prev, [key]: arr }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Clean array fields — remove empty strings
    const payload: CareerFormInput = {
      ...form,
      responsibilities: form.responsibilities.map((s) => s.trim()).filter(Boolean),
      requirements: form.requirements.map((s) => s.trim()).filter(Boolean),
      benefits: form.benefits.map((s) => s.trim()).filter(Boolean),
      skills: form.skills.map((s) => s.trim()).filter(Boolean),
    }

    startTransition(async () => {
      const result = editing
        ? await updateCareerAction(editing.id, payload)
        : await createCareerAction(payload)

      if (!result.success) {
        setError(result.error)
        return
      }
      onSaved()
      onClose()
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-5 bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Briefcase size={20} className="text-[#32CD32]" />
            </div>
            <div>
              <h2 className="text-xl font-black">
                {editing ? 'Edit Career' : 'Post New Career'}
              </h2>
              <p className="text-xs text-white/70 mt-0.5">
                {editing ? 'Update job posting details' : 'Fill in the details to publish a new opening'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 sm:p-8 space-y-7">

            {/* ── BASIC INFO ──────────────────────────── */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#126e3d] mb-4 flex items-center gap-2">
                <Sparkles size={14} /> Basic Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className={LABEL_CLASS}>
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    maxLength={100}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="short" className={LABEL_CLASS}>
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="short"
                    type="text"
                    required
                    value={form.short_description}
                    onChange={(e) => update('short_description', e.target.value)}
                    placeholder="One sentence summary (shows on the careers listing card)"
                    maxLength={160}
                    className={INPUT_CLASS}
                  />
                  <p className="mt-1 text-xs text-slate-400">{form.short_description.length}/160</p>
                </div>

                <div>
                  <label htmlFor="desc" className={LABEL_CLASS}>
                    Full Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="desc"
                    required
                    rows={6}
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Detailed overview of the role, what success looks like, and who they'll work with..."
                    className={`${INPUT_CLASS} resize-y leading-relaxed`}
                  />
                  <p className="mt-1 text-xs text-slate-400">Markdown not supported — keep it plain prose.</p>
                </div>
              </div>
            </section>

            {/* ── ROLE DETAILS ────────────────────────── */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#126e3d] mb-4 flex items-center gap-2">
                <Award size={14} /> Role Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dept" className={LABEL_CLASS}>Department</label>
                  <select
                    id="dept"
                    value={form.department}
                    onChange={(e) => update('department', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="loc" className={LABEL_CLASS}>Location</label>
                  <input
                    id="loc"
                    type="text"
                    value={form.location}
                    onChange={(e) => update('location', e.target.value)}
                    placeholder="e.g. Nairobi, Kenya"
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Work Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {WORK_TYPES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('work_type', opt.value)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold border-2 transition ${
                          form.work_type === opt.value
                            ? 'border-[#32CD32] bg-emerald-50 text-[#126e3d]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Work Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {WORK_MODES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('work_mode', opt.value)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold border-2 transition ${
                          form.work_mode === opt.value
                            ? 'border-[#32CD32] bg-emerald-50 text-[#126e3d]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>Experience Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EXPERIENCE_LEVELS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('experience_level', opt.value)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold border-2 transition ${
                          form.experience_level === opt.value
                            ? 'border-[#32CD32] bg-emerald-50 text-[#126e3d]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── COMPENSATION ────────────────────────── */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#126e3d] mb-4 flex items-center gap-2">
                <DollarSign size={14} /> Compensation (Optional)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="currency" className={LABEL_CLASS}>Currency</label>
                  <select
                    id="currency"
                    value={form.currency ?? 'KES'}
                    onChange={(e) => update('currency', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="smin" className={LABEL_CLASS}>Min Salary (monthly)</label>
                  <input
                    id="smin"
                    type="number"
                    min={0}
                    value={form.salary_min ?? ''}
                    onChange={(e) => update('salary_min', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 80000"
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="smax" className={LABEL_CLASS}>Max Salary (monthly)</label>
                  <input
                    id="smax"
                    type="number"
                    min={0}
                    value={form.salary_max ?? ''}
                    onChange={(e) => update('salary_max', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 150000"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </section>

            {/* ── LIST FIELDS ─────────────────────────── */}
            <ListField
              label="Key Responsibilities"
              items={form.responsibilities}
              onAdd={() => addToArray('responsibilities')}
              onChange={(i, v) => updateArray('responsibilities', i, v)}
              onRemove={(i) => removeFromArray('responsibilities', i)}
              placeholder="e.g. Build scalable features used by 10,000+ users"
            />

            <ListField
              label="Requirements & Qualifications"
              items={form.requirements}
              onAdd={() => addToArray('requirements')}
              onChange={(i, v) => updateArray('requirements', i, v)}
              onRemove={(i) => removeFromArray('requirements', i)}
              placeholder="e.g. 5+ years experience in React / Next.js"
            />

            <ListField
              label="Benefits & Perks"
              items={form.benefits}
              onAdd={() => addToArray('benefits')}
              onChange={(i, v) => updateArray('benefits', i, v)}
              onRemove={(i) => removeFromArray('benefits', i)}
              placeholder="e.g. Comprehensive health insurance for you and dependants"
            />

            <ListField
              label="Skills / Technologies"
              items={form.skills}
              onAdd={() => addToArray('skills')}
              onChange={(i, v) => updateArray('skills', i, v)}
              onRemove={(i) => removeFromArray('skills', i)}
              placeholder="e.g. TypeScript, React, Supabase"
            />

            {/* ── APPLICATION ─────────────────────────── */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#126e3d] mb-4 flex items-center gap-2">
                <LinkIcon size={14} /> How to Apply
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Provide at least one application channel — URL or email.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="applyUrl" className={LABEL_CLASS}>Application URL</label>
                  <input
                    id="applyUrl"
                    type="url"
                    value={form.application_url ?? ''}
                    onChange={(e) => update('application_url', e.target.value)}
                    placeholder="https://..."
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="applyEmail" className={LABEL_CLASS}>Application Email</label>
                  <input
                    id="applyEmail"
                    type="email"
                    value={form.application_email ?? ''}
                    onChange={(e) => update('application_email', e.target.value)}
                    placeholder="careers@pikaplan.com"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="deadline" className={LABEL_CLASS}>Application Deadline (optional)</label>
                  <input
                    id="deadline"
                    type="date"
                    value={form.application_deadline ?? ''}
                    onChange={(e) => update('application_deadline', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </section>

            {/* ── PUBLISHING ──────────────────────────── */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#126e3d] mb-4 flex items-center gap-2">
                <Eye size={14} /> Publishing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['draft', 'published', 'closed', 'archived'] as CareerStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update('status', s)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-bold capitalize border-2 transition ${
                          form.status === s
                            ? statusActiveClass(s)
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Featured?</label>
                  <button
                    type="button"
                    onClick={() => update('is_featured', !form.is_featured)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold border-2 transition flex items-center gap-3 ${
                      form.is_featured
                        ? 'border-[#f97316] bg-orange-50 text-[#9a3412]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Star
                      size={16}
                      className={form.is_featured ? 'text-[#f97316] fill-[#f97316]' : 'text-slate-400'}
                    />
                    {form.is_featured ? 'Featured on careers page' : 'Mark as featured'}
                  </button>
                </div>
              </div>
            </section>

            {/* ── Error ──────────────────────────────── */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-sm font-bold text-slate-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-3 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={16} /> {editing ? 'Update Career' : 'Post Career'}
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

// ── Reusable List Field ─────────────────────────────────────
function ListField({
  label, items, onAdd, onChange, onRemove, placeholder,
}: {
  label: string
  items: string[]
  onAdd: () => void
  onChange: (idx: number, value: string) => void
  onRemove: (idx: number) => void
  placeholder: string
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#126e3d] flex items-center gap-2">
          <FileText size={14} /> {label}
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#126e3d] text-xs font-bold hover:bg-emerald-100 transition"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#126e3d] transition"
        >
          + Add your first item
        </button>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#126e3d] text-xs font-black">
                {i + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => onChange(i, e.target.value)}
                placeholder={placeholder}
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function statusActiveClass(status: CareerStatus) {
  return {
    draft: 'border-amber-300 bg-amber-50 text-amber-800',
    published: 'border-emerald-400 bg-emerald-50 text-[#126e3d]',
    closed: 'border-slate-300 bg-slate-50 text-slate-700',
    archived: 'border-slate-300 bg-slate-100 text-slate-600',
  }[status]
}