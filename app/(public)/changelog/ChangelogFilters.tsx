'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles, Zap, Wrench, Shield, AlertTriangle, Rocket, Filter, X,
  type LucideIcon,
} from 'lucide-react'
import type { ChangeType } from './_data/releases'

const TYPE_ICONS: Record<ChangeType, LucideIcon> = {
  feature: Sparkles,
  improvement: Zap,
  fix: Wrench,
  security: Shield,
  breaking: AlertTriangle,
  performance: Rocket,
}

const FILTER_OPTIONS: { value: ChangeType | 'all'; label: string; color: string }[] = [
  { value: 'all',         label: 'All Changes',  color: '#1A5C3A' },
  { value: 'feature',     label: 'Features',     color: '#1A5C3A' },
  { value: 'improvement', label: 'Improvements', color: '#2563eb' },
  { value: 'fix',         label: 'Fixes',        color: '#f97316' },
  { value: 'performance', label: 'Performance',  color: '#7c3aed' },
  { value: 'security',    label: 'Security',     color: '#dc2626' },
  { value: 'breaking',    label: 'Breaking',     color: '#F4A535' },
]

export default function ChangelogFilters() {
  const [active, setActive] = useState<ChangeType | 'all'>('all')

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-change-item]').forEach((el) => {
      const type = el.dataset.type as ChangeType
      el.style.display = active === 'all' || type === active ? '' : 'none'
    })

    // Hide release blocks where ALL changes are now hidden
    document.querySelectorAll<HTMLElement>('[data-release]').forEach((release) => {
      const visibleItems = release.querySelectorAll<HTMLElement>(
        '[data-change-item]:not([style*="display: none"])'
      )
      release.style.display = visibleItems.length > 0 ? '' : 'none'
    })

    // Toggle no-results banner
    const noResults = document.getElementById('no-changes-found')
    const allReleases = document.querySelectorAll<HTMLElement>('[data-release]:not([style*="display: none"])')
    if (noResults) noResults.style.display = allReleases.length === 0 ? '' : 'none'
  }, [active])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-slate-500 mr-1">
        <Filter size={11} /> Filter
      </span>
      {FILTER_OPTIONS.map((opt) => {
        const isActive = active === opt.value
        const Icon = opt.value === 'all' ? Filter : TYPE_ICONS[opt.value as ChangeType]
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setActive(opt.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
              isActive
                ? 'shadow-md text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
            style={isActive ? { backgroundColor: opt.color } : {}}
          >
            <Icon size={11} />
            {opt.label}
          </button>
        )
      })}
      {active !== 'all' && (
        <button
          type="button"
          onClick={() => setActive('all')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X size={10} /> Clear
        </button>
      )}
    </div>
  )
}