'use client'

import { CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react'

type Props = {
  dirty: boolean
  saving: boolean
  message?: { type: 'success' | 'error'; text: string } | null
  onSave: () => void
  onReset?: () => void
}

export default function SaveBar({ dirty, saving, message, onSave, onReset }: Props) {
  if (!dirty && !message) return null

  return (
    <div className="sticky bottom-4 mt-6 z-30">
      <div className={`rounded-2xl shadow-2xl border-2 px-4 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-lg ${
        message?.type === 'success'
          ? 'bg-emerald-50/95 border-emerald-200'
          : message?.type === 'error'
            ? 'bg-red-50/95 border-red-200'
            : 'bg-slate-900/95 border-slate-800 text-white'
      }`}>
        <div className="flex items-center gap-2 text-sm font-bold">
          {message?.type === 'success' && (
            <>
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-emerald-800">{message.text}</span>
            </>
          )}
          {message?.type === 'error' && (
            <>
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-red-800">{message.text}</span>
            </>
          )}
          {!message && dirty && (
            <span className="text-white">You have unsaved changes</span>
          )}
        </div>

        {dirty && (
          <div className="flex items-center gap-2">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                Discard
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white text-xs font-black uppercase shadow-md hover:shadow-lg transition disabled:opacity-60"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}