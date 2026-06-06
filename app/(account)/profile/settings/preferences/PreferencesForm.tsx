'use client'

import { useState, useTransition } from 'react'
import { Globe, Sun, Moon, Monitor, Languages, Clock as ClockIcon } from 'lucide-react'
import { SettingsSelect } from '../_components/SettingsInput'
import SaveBar from '../_components/SaveBar'
import { updatePreferencesAction, type UserPreferences } from '../actions'

const TIMEZONES = [
  'Africa/Nairobi', 'Africa/Cairo', 'Africa/Lagos', 'Africa/Johannesburg',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai',
]

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'TZS', 'UGX']

export default function PreferencesForm({ initial }: { initial: UserPreferences }) {
  const [prefs, setPrefs] = useState(initial)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const dirty = JSON.stringify(prefs) !== JSON.stringify(initial)
  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }))

  const handleSave = () => {
    startTransition(async () => {
      const r = await updatePreferencesAction(prefs)
      setMessage({ type: r.success ? 'success' : 'error', text: r.success ? r.message! : r.error })
    })
  }

  return (
    <div className="space-y-6">
      {/* Language & Region */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Globe size={18} className="text-[#126e3d]" /> Language & Region
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SettingsSelect
            label="Language"
            value={prefs.language}
            onChange={(e) => update('language', e.target.value as 'en' | 'sw')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'sw', label: 'Kiswahili' },
            ]}
          />
          <SettingsSelect
            label="Timezone"
            value={prefs.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            options={TIMEZONES.map((tz) => ({ value: tz, label: tz.replace('_', ' ') }))}
          />
          <SettingsSelect
            label="Currency"
            value={prefs.currency}
            onChange={(e) => update('currency', e.target.value)}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </section>

      {/* Theme */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Sun size={18} className="text-[#126e3d]" /> Appearance
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light' as const, label: 'Light', icon: Sun },
            { value: 'dark' as const, label: 'Dark', icon: Moon },
            { value: 'system' as const, label: 'System', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => {
            const active = prefs.theme === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => update('theme', value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                  active
                    ? 'border-[#32CD32] bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Icon size={20} className={active ? 'text-[#126e3d]' : 'text-slate-500'} />
                <span className={`text-xs font-bold ${active ? 'text-[#126e3d]' : 'text-slate-700'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Dark mode coming soon — your preference will apply when it launches.
        </p>
      </section>

      <SaveBar
        dirty={dirty}
        saving={isPending}
        message={message}
        onSave={handleSave}
        onReset={() => setPrefs(initial)}
      />
    </div>
  )
}