'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { forgotPasswordAction } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await forgotPasswordAction(formData)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error ?? 'Something went wrong')
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-6">
            If that email exists in our system, you'll receive a reset link shortly.
          </p>
          <Link href="/login" className="text-[#1A5C3A] font-semibold hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forgot password?</h1>
          <p className="text-gray-500 mt-2">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] bg-white"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#1A5C3A] text-white py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link href="/login" className="text-[#1A5C3A] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}