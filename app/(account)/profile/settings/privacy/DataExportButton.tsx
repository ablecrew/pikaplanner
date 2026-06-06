'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { requestDataExportAction } from '../actions'

export default function DataExportButton() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRequest = () => {
    setMessage(null)
    startTransition(async () => {
      const r = await requestDataExportAction()
      setMessage({ type: r.success ? 'success' : 'error', text: r.success ? r.message! : r.error })
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleRequest}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-[#1A5C3A] hover:bg-[#0d3d26] px-5 py-2.5 text-xs font-black uppercase text-white transition disabled:opacity-60"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        Request Data Export
      </button>

      {message && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-xs font-semibold ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {message.text}
        </div>
      )}
    </>
  )
}