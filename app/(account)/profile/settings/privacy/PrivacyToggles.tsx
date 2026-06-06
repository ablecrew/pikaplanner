'use client'

import { useState, useTransition } from 'react'
import { Toggle } from '../_components/SettingsInput'
import SaveBar from '../_components/SaveBar'
import { updatePreferencesAction, type UserPreferences } from '../actions'

export default function PrivacyToggles({ initial }: { initial: UserPreferences }) {
  const [prefs, setPrefs] = useState(initial)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const dirty = JSON.stringify(prefs) !== JSON.stringify(initial)

  const handleSave = () => {
    startTransition(async () => {
      const r = await updatePreferencesAction({
        marketing_consent: prefs.marketing_consent,
        analytics_consent: prefs.analytics_consent,
        profile_visibility: prefs.profile_visibility,
      })
      setMessage({ type: r.success ? 'success' : 'error', text: r.success ? r.message! : r.error })
    })
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        <Toggle
          label="Marketing communications"
          description="Allow us to send promotional emails and SMS campaigns"
          checked={prefs.marketing_consent}
          onChange={(v) => setPrefs({ ...prefs, marketing_consent: v })}
        />
        <Toggle
          label="Analytics & performance tracking"
          description="Help us improve by sharing anonymized usage data"
          checked={prefs.analytics_consent}
          onChange={(v) => setPrefs({ ...prefs, analytics_consent: v })}
        />
        <Toggle
          label="Public profile"
          description="Make your profile visible to other Pika Plan users"
          checked={prefs.profile_visibility === 'public'}
          onChange={(v) => setPrefs({ ...prefs, profile_visibility: v ? 'public' : 'private' })}
        />
      </div>

      <SaveBar dirty={dirty} saving={isPending} message={message} onSave={handleSave} onReset={() => setPrefs(initial)} />
    </>
  )
}