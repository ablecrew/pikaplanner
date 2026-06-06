'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react'
import SettingsInput, { SettingsTextarea } from '../_components/SettingsInput'
import { requestAccountDeletionAction } from '../actions'

export default function DeleteAccountModal() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canDelete = confirm === 'DELETE' && password.length > 0

  const handleDelete = () => {
    if (!canDelete) return
    setError(null)
    startTransition(async () => {
      const r = await requestAccountDeletionAction(password, reason)
      if (!r.success) setError(r.error)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-black uppercase text-white transition"
      >
        <Trash2 size={12} /> Delete My Account
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-6 py-5 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <AlertTriangle className="text-red-600" size={18} />
                </div>
                <div>
                  <h2 className="font-black text-red-900">Delete Account</h2>
                  <p className="text-xs text-red-700">This action is irreversible after 30 days</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-red-100">
                <X size={16} className="text-red-700" />
              </button>
            </header>

            <div className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-bold text-amber-900 mb-2">What happens next?</p>
                <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                  <li>Your account is scheduled for deletion in 30 days</li>
                  <li>You can cancel any time by signing in</li>
                  <li>Vendors you've ordered from will retain order records (legally required)</li>
                  <li>After 30 days, all personal data is permanently erased</li>
                </ul>
              </div>

              <SettingsInput
                label="Why are you leaving? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve..."
              />

              <SettingsInput
                label="Current Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                hint="We need to verify it's really you"
              />

              <SettingsInput
                label={`Type DELETE to confirm`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
                required
              />

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle size={12} /> {error}
                </div>
              )}
            </div>

            <footer className="p-4 bg-slate-50 flex gap-2 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-700"
              >
                Keep My Account
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete || isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase transition disabled:opacity-60"
              >
                {isPending && <Loader2 size={12} className="animate-spin" />}
                Schedule Deletion
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}