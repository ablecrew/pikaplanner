'use client'

import { useEffect, useState } from 'react'
import { X, Shield, Settings, BarChart3, Megaphone, Lock } from 'lucide-react'
import Link from 'next/link'
import {
  type ConsentCategories,
  DEFAULT_CONSENT,
} from './useCookieConsent'

type Props = {
  open: boolean
  initial: ConsentCategories | null
  onClose: () => void
  onSave: (categories: ConsentCategories) => void
}

const CATEGORY_META = [
  {
    key: 'necessary' as const,
    icon: Lock,
    title: 'Strictly Necessary',
    required: true,
    description:
      'Essential for the Platform to function — authentication, security, and shopping-cart features. These cannot be disabled.',
    examples: 'pika_session, pika_csrf, pika_consent',
  },
  {
    key: 'functional' as const,
    icon: Settings,
    title: 'Functional',
    required: false,
    description:
      'Remember your preferences (language, dietary restrictions, household size) for a personalised experience.',
    examples: 'pika_prefs, pika_cart',
  },
  {
    key: 'analytics' as const,
    icon: BarChart3,
    title: 'Performance & Analytics',
    required: false,
    description:
      'Help us understand how the Platform is used so we can improve our AI recommendations and user experience.',
    examples: 'Google Analytics (_ga, _gid)',
  },
  {
    key: 'marketing' as const,
    icon: Megaphone,
    title: 'Marketing',
    required: false,
    description:
      'Deliver advertising that is relevant to you and measure the performance of marketing campaigns.',
    examples: 'Ad platform identifiers (only when active)',
  },
]

export default function CookiePreferencesModal({
  open,
  initial,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<ConsentCategories>(
    initial ?? DEFAULT_CONSENT
  )

  // Sync when reopened
  useEffect(() => {
    if (open) setDraft(initial ?? DEFAULT_CONSENT)
  }, [open, initial])

  // Close on Escape + lock body scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const acceptAll = () =>
    onSave({ necessary: true, functional: true, analytics: true, marketing: true })

  const rejectAll = () =>
    onSave({ necessary: true, functional: false, analytics: false, marketing: false })

  const saveCustom = () => onSave(draft)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-prefs-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-[#1A5C3A] to-[#0d3d26] text-white">
          <div className="flex items-center gap-3">
            <Shield size={22} className="text-[#32CD32]" />
            <h2 id="cookie-prefs-title" className="text-lg font-bold">
              Cookie Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cookie preferences"
            className="p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto custom-scrollbar text-sm text-gray-700">
          <p className="leading-relaxed">
            We use cookies and similar technologies to operate Pika Plan, personalise your
            experience, and analyse platform usage. You can enable or disable each category
            below. For full details, see our{' '}
            <Link href="/cookies" className="text-[#1A5C3A] underline font-medium">
              Cookie Policy
            </Link>
            .
          </p>

          <div className="mt-5 space-y-3">
            {CATEGORY_META.map((cat) => {
              const Icon = cat.icon
              const enabled = draft[cat.key]
              return (
                <div
                  key={cat.key}
                  className="border border-gray-200 rounded-xl p-4 flex items-start gap-4"
                >
                  <Icon className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-gray-900">{cat.title}</h3>
                      <Toggle
                        checked={enabled}
                        disabled={cat.required}
                        onChange={(v) =>
                          setDraft((prev) => ({ ...prev, [cat.key]: v }))
                        }
                        label={`${cat.title} cookies`}
                      />
                    </div>
                    <p className="text-gray-600 mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 font-mono">
                      Examples: {cat.examples}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer actions */}
        <footer className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-2 sm:justify-between">
          <button
            onClick={rejectAll}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
          >
            Reject All
          </button>
          <div className="flex gap-2">
            <button
              onClick={saveCustom}
              className="px-4 py-2.5 rounded-lg border border-[#1A5C3A] text-[#1A5C3A] hover:bg-emerald-50 text-sm font-semibold transition"
            >
              Save Preferences
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2.5 rounded-lg bg-[#1A5C3A] hover:bg-[#145032] text-white text-sm font-semibold transition"
            >
              Accept All
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* Accessible toggle switch */
function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition
        ${checked ? 'bg-[#1A5C3A]' : 'bg-gray-300'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}