'use client'

import { useState, useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'

type Props = {
  departments: string[]
}

export default function CareersFilters({ departments }: Props) {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [workType, setWorkType] = useState('all')
  const [workMode, setWorkMode] = useState('all')
  const [experience, setExperience] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const q = search.toLowerCase().trim()
    let visibleCount = 0

    const cards = document.querySelectorAll<HTMLElement>('[data-career]')
    cards.forEach((el) => {
      const text = (el.dataset.search ?? '').toLowerCase()
      const dept = el.dataset.department ?? ''
      const wt = el.dataset.workType ?? ''
      const wm = el.dataset.workMode ?? ''
      const exp = el.dataset.experience ?? ''

      const matchSearch = q === '' || text.includes(q)
      const matchDept = department === 'all' || dept === department
      const matchType = workType === 'all' || wt === workType
      const matchMode = workMode === 'all' || wm === workMode
      const matchExp = experience === 'all' || exp === experience

      const show = matchSearch && matchDept && matchType && matchMode && matchExp
      el.style.display = show ? '' : 'none'
      if (show) visibleCount++
    })

    const countEl = document.getElementById('careers-count')
    if (countEl) countEl.textContent = String(visibleCount)

    const noResults = document.getElementById('no-careers-results')
    if (noResults) noResults.style.display = visibleCount === 0 ? '' : 'none'
  }, [search, department, workType, workMode, experience])

  const activeCount = [department, workType, workMode, experience].filter((v) => v !== 'all').length

  const clearAll = () => {
    setSearch('')
    setDepartment('all')
    setWorkType('all')
    setWorkMode('all')
    setExperience('all')
  }

  const workTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full-Time' },
    { value: 'part-time', label: 'Part-Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ]

  const workModeOptions = [
    { value: 'all', label: 'All Modes' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'on-site', label: 'On-Site' },
  ]

  const experienceOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'entry', label: 'Entry' },
    { value: 'mid', label: 'Mid' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
  ]

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...departments.map((d) => ({ value: d, label: d })),
  ]

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, skills, or keywords..."
          className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-14 pr-14 py-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]/20 transition shadow-sm"
          aria-label="Search careers"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Mobile toggle */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden inline-flex items-center gap-2 rounded-xl bg-white border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm"
        >
          <Filter size={14} />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1A5C3A] text-white text-[10px] font-black">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-bold text-[#126e3d] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filter groups */}
      <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Department
          </p>
          <div className="flex flex-wrap gap-2">
            {departmentOptions.map((opt) => {
              const active = department === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDepartment(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    active
                      ? 'bg-[#1A5C3A] text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Work Type
          </p>
          <div className="flex flex-wrap gap-2">
            {workTypeOptions.map((opt) => {
              const active = workType === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWorkType(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    active
                      ? 'bg-[#1A5C3A] text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Work Mode
          </p>
          <div className="flex flex-wrap gap-2">
            {workModeOptions.map((opt) => {
              const active = workMode === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWorkMode(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    active
                      ? 'bg-[#1A5C3A] text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Experience
          </p>
          <div className="flex flex-wrap gap-2">
            {experienceOptions.map((opt) => {
              const active = experience === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExperience(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    active
                      ? 'bg-[#1A5C3A] text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}