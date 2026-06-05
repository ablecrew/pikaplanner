'use client'

import { useState } from 'react'
import { Mail, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')

    try {
      await new Promise((r) => setTimeout(r, 800))
      setStatus('success')
      setMessage('You\'re subscribed! Look out for our next newsletter.')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  const disabled = status === 'loading' || status === 'success'

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={disabled}
            required
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/60 focus:border-[#32CD32] focus:bg-white/20 focus:outline-none transition disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-6 py-3.5 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition disabled:opacity-60 whitespace-nowrap"
        >
          {status === 'loading' && (
            <>
              <Loader2 size={16} className="animate-spin" /> Subscribing…
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 size={16} /> Subscribed!
            </>
          )}
          {(status === 'idle' || status === 'error') && (
            <>
              <Send size={16} /> Subscribe
            </>
          )}
        </button>
      </div>

      {(status === 'error' || status === 'success') && (
        <p
          className={`mt-3 text-xs font-bold flex items-center justify-center gap-1.5 ${
            status === 'error' ? 'text-red-200' : 'text-emerald-200'
          }`}
        >
          {status === 'error' ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
          {message}
        </p>
      )}

      <p className="text-xs text-white/60 text-center mt-3">
        No spam. Unsubscribe anytime. We respect your privacy.
      </p>
    </form>
  )
}