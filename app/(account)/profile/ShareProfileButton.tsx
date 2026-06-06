'use client'

import { useState, useEffect } from 'react'
import { Share2, Check, Link as LinkIcon, X } from 'lucide-react'

type Props = {
  profileId: string
  name: string
}

export default function ShareProfileButton({ profileId, name }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  // Build URL only after mount (avoids SSR mismatch)
  useEffect(() => {
    setUrl(`${window.location.origin}/u/${profileId}`)
  }, [profileId])

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleClick = async () => {
    // Native share API for mobile
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      url
    ) {
      try {
        await navigator.share({
          title: `${name} on Pika Plan`,
          url,
        })
        return
      } catch {
        // User cancelled or share failed — fall back to modal
      }
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-300 text-xs font-black uppercase transition"
      >
        <Share2 size={12} />
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">Share Profile</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Copy this link to share {name}'s profile:
            </p>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
              <LinkIcon size={14} className="text-slate-400 flex-shrink-0" />
              <code className="flex-1 text-xs font-mono text-slate-700 truncate">
                {url}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#1A5C3A] text-white text-xs font-bold px-3 py-1.5 hover:bg-[#0d3d26] transition"
              >
                {copied ? <Check size={11} /> : <LinkIcon size={11} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Check out ${name}'s profile on Pika Plan: ${url}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-3 py-2 rounded-lg bg-emerald-50 text-[#126e3d] text-xs font-bold hover:bg-emerald-100 transition"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  url
                )}&text=${encodeURIComponent(`Check out ${name} on Pika Plan`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-3 py-2 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 transition"
              >
                Twitter
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  `${name} on Pika Plan`
                )}&body=${encodeURIComponent(url)}`}
                className="flex-1 text-center px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}