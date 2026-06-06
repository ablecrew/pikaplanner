'use client'

import { useTransition, useEffect } from 'react'
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { deleteCareerAction, type Career } from './actions'

type Props = {
  career: Career | null
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteConfirmModal({ career, onClose, onDeleted }: Props) {
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!career) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [career])

  if (!career) return null

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCareerAction(career.id)
      if (result.success) {
        onDeleted()
        onClose()
      }
    })
  }

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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="text-red-600" size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Delete this career?</h2>
          <p className="mt-2 text-sm text-slate-600">
            You're about to permanently delete <strong>"{career.title}"</strong>.
            This action cannot be undone.
          </p>
        </div>

        <footer className="p-4 bg-slate-50 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-sm font-bold text-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-black uppercase transition disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 size={14} /> Delete Forever
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}