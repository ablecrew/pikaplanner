'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

type Props = {
  value: string
  label?: string
  className?: string
}

export default function CopyButton({ value, label, className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label ?? value}`}
      className={
        className ||
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition'
      }
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-600" /> Copied!
        </>
      ) : (
        <>
          <Copy size={12} /> {label ?? 'Copy'}
        </>
      )}
    </button>
  )
}