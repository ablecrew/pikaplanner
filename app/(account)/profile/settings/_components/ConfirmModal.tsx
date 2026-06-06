'use client'

import { useEffect } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
}

const VARIANTS = {
  danger:  { icon: 'text-red-600', iconBg: 'bg-red-100', button: 'bg-red-600 hover:bg-red-700' },
  warning: { icon: 'text-amber-600', iconBg: 'bg-amber-100', button: 'bg-amber-600 hover:bg-amber-700' },
  info:    { icon: 'text-[#126e3d]', iconBg: 'bg-emerald-100', button: 'bg-[#126e3d] hover:bg-[#0d5530]' },
}

export default function ConfirmModal({
  open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', loading, onClose, onConfirm,
}: Props) {
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
  const v = VARIANTS[variant]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${v.iconBg}`}>
            <AlertTriangle className={v.icon} size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>

        <footer className="p-4 bg-slate-50 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-sm font-bold text-slate-700 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black uppercase transition disabled:opacity-60 ${v.button}`}
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}