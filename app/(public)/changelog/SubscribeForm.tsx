'use client'

import { useState } from 'react'
import { Mail, Bell, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      setMessage('Please enter a valid email.')
      return
    }
    setStatus('loading')
    try {
      // 🔌 Plug in your service (Resend, Mailchimp, etc.)
      await new Promise((r) => setTimeout(r, 800))
      setStatus('success')
      setMessage('You\'re subscribed! We\'ll email you when we ship something new.')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Try again.')
    }
  }

  const disabled = status === 'loading' || status === 'success'

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={disabled}
            required
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/60 focus:border-[#32CD32] focus:bg-white/20 focus:outline-none transition disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-5 py-3 text-xs font-black uppercase text-white shadow-md transition disabled:opacity-60 whitespace-nowrap"
        >
          {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
          {status === 'success' && <CheckCircle2 size={14} />}
          {(status === 'idle' || status === 'error') && <Bell size={14} />}
          {status === 'success' ? 'Subscribed' : 'Subscribe'}
        </button>
      </div>

      {(status === 'success' || status === 'error') && (
        <p className={`mt-2 text-xs font-bold flex items-center justify-center gap-1.5 ${
          status === 'success' ? 'text-emerald-200' : 'text-red-200'
        }`}>
          {status === 'success' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
          {message}
        </p>
      )}

      <p className="text-[10px] text-white/60 text-center mt-2">
        Monthly updates only. No spam. Unsubscribe anytime.
      </p>
    </form>
  )
}