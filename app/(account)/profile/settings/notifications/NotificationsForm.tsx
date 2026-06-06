'use client'

import { useState, useTransition } from 'react'
import { Bell, Mail, MessageSquare, Smartphone, Moon } from 'lucide-react'
import { Toggle } from '../_components/SettingsInput'
import SaveBar from '../_components/SaveBar'
import { updateNotificationsAction, type UserPreferences } from '../actions'

export default function NotificationsForm({ initial }: { initial: UserPreferences }) {
  const [prefs, setPrefs] = useState(initial)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const dirty = JSON.stringify(prefs) !== JSON.stringify(initial)
  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }))

  const handleSave = () => {
    startTransition(async () => {
      const r = await updateNotificationsAction(prefs)
      setMessage({ type: r.success ? 'success' : 'error', text: r.success ? r.message! : r.error })
    })
  }

  return (
    <div className="space-y-6">
      {/* Email */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <Mail size={18} className="text-[#126e3d]" /> Email Notifications
        </h2>
        <p className="text-sm text-slate-500 mb-3">Choose what you'd like to hear about.</p>
        <div className="divide-y divide-gray-100">
          <Toggle
            label="Order updates"
            description="Confirmations, status changes, and delivery alerts"
            checked={prefs.email_orders}
            onChange={(v) => update('email_orders', v)}
          />
          <Toggle
            label="Meal plan reminders"
            description="Weekly suggestions and reminders to generate new plans"
            checked={prefs.email_meal_reminders}
            onChange={(v) => update('email_meal_reminders', v)}
          />
          <Toggle
            label="Weekly digest"
            description="A summary of your week's meals, savings, and tips every Friday"
            checked={prefs.email_weekly_digest}
            onChange={(v) => update('email_weekly_digest', v)}
          />
          <Toggle
            label="Product updates"
            description="New features, improvements, and important changes"
            checked={prefs.email_product_updates}
            onChange={(v) => update('email_product_updates', v)}
          />
          <Toggle
            label="Marketing emails"
            description="Promotions, vendor spotlights, and seasonal campaigns"
            checked={prefs.email_marketing}
            onChange={(v) => update('email_marketing', v)}
          />
        </div>
      </section>

      {/* SMS */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <MessageSquare size={18} className="text-[#126e3d]" /> SMS Notifications
        </h2>
        <p className="text-sm text-slate-500 mb-3">SMS charges may apply depending on your carrier.</p>
        <div className="divide-y divide-gray-100">
          <Toggle
            label="Order alerts"
            description="Critical order updates via SMS"
            checked={prefs.sms_orders}
            onChange={(v) => update('sms_orders', v)}
          />
          <Toggle
            label="Promotions"
            description="Special offers and discounts via SMS"
            checked={prefs.sms_promotions}
            onChange={(v) => update('sms_promotions', v)}
          />
        </div>
      </section>

      {/* Push */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <Smartphone size={18} className="text-[#126e3d]" /> Push Notifications
        </h2>
        <p className="text-sm text-slate-500 mb-3">In-app and browser push alerts.</p>
        <div className="divide-y divide-gray-100">
          <Toggle
            label="Order updates"
            description="Real-time order status changes"
            checked={prefs.push_orders}
            onChange={(v) => update('push_orders', v)}
          />
          <Toggle
            label="Meal reminders"
            description="Time-based meal prep reminders"
            checked={prefs.push_meal_reminders}
            onChange={(v) => update('push_meal_reminders', v)}
          />
          <Toggle
            label="Promotions"
            description="Limited-time offers and flash sales"
            checked={prefs.push_promotions}
            onChange={(v) => update('push_promotions', v)}
          />
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <Moon size={18} className="text-[#126e3d]" /> Quiet Hours
        </h2>
        <p className="text-sm text-slate-500 mb-3">Pause non-critical notifications during these hours.</p>
        <Toggle
          label="Enable quiet hours"
          description="Order updates and emergency alerts will still come through"
          checked={prefs.quiet_hours_enabled}
          onChange={(v) => update('quiet_hours_enabled', v)}
        />
        {prefs.quiet_hours_enabled && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Start</label>
              <input
                type="time"
                value={prefs.quiet_hours_start}
                onChange={(e) => update('quiet_hours_start', e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-[#32CD32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">End</label>
              <input
                type="time"
                value={prefs.quiet_hours_end}
                onChange={(e) => update('quiet_hours_end', e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-[#32CD32] focus:outline-none"
              />
            </div>
          </div>
        )}
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