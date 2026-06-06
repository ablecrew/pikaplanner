'use client'

import { useState, useTransition } from 'react'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import SettingsInput from '../_components/SettingsInput'
import { updatePasswordAction } from '../actions'

export default function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const strength = (() => {
    let s = 0
    if (next.length >= 8) s++
    if (/[A-Z]/.test(next)) s++
    if (/[0-9]/.test(next)) s++
    if (/[^A-Za-z0-9]/.test(next)) s++
    return s
  })()
  const strengthLabel = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][strength]
  const strengthColor = ['#dc2626', '#dc2626', '#f97316', '#16a34a', '#15803d'][strength]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setMessage(null)

    if (next !== confirm) {
      setErrors({ confirm: 'Passwords do not match.' })
      return
    }

    startTransition(async () => {
      const r = await updatePasswordAction(current, next)
      if (!r.success) {
        if (r.field) setErrors({ [r.field]: r.error })
        else setMessage({ type: 'error', text: r.error })
        return
      }
      setMessage({ type: 'success', text: r.message! })
      setCurrent(''); setNext(''); setConfirm('')
    })
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Lock size={18} className="text-[#126e3d]" /> Password
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Use a strong, unique password you don't reuse anywhere.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
        >
          {show ? <EyeOff size={12} /> : <Eye size={12} />}
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <SettingsInput
          label="Current Password"
          type={show ? 'text' : 'password'}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
          error={errors.currentPassword}
        />
        <div>
          <SettingsInput
            label="New Password"
            type={show ? 'text' : 'password'}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            autoComplete="new-password"
            error={errors.newPassword}
          />
          {next && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all rounded-full"
                    style={{ width: `${(strength / 4) * 100}%`, backgroundColor: strengthColor }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: strengthColor }}>
                  {strengthLabel}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Use 8+ characters, with uppercase letters and numbers.
              </p>
            </div>
          )}
        </div>
        <SettingsInput
          label="Confirm New Password"
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          error={errors.confirm}
        />

        {message && (
          <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !current || !next || !confirm}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-3 text-sm font-black uppercase text-white shadow-md hover:shadow-lg transition disabled:opacity-60"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          Update Password
        </button>
      </form>
    </section>
  )
}