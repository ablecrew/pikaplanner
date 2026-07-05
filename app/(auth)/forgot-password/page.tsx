// app/(auth)/forgot-password/page.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { forgotPasswordAction } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await forgotPasswordAction(formData)

      if (!result.success) {
        setError(result.error ?? 'Failed to send reset link')
        return
      }

      setSuccess(true)
    })
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A5C3A] p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F4A535] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-white font-bold text-2xl">Pika Planner</span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Reset your password
          </h2>
          <p className="text-green-200 text-lg">
            We'll send you a link to reset your password.
          </p>
        </div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#F4A535] opacity-10 rounded-full" />
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-white opacity-5 rounded-full" />
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Back to login */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#1A5C3A] transition mb-8"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>

          {!success ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Forgot password?</h1>
                <p className="text-gray-500 mt-2">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] focus:border-transparent bg-white text-gray-900"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !email.trim()}
                  className="w-full bg-[#1A5C3A] text-white py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link href="/login" className="text-[#1A5C3A] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-gray-500 mb-8">
                We've sent a password reset link to{' '}
                <span className="font-semibold text-gray-900">{email}</span>
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Didn't receive the email?</strong>
                  <br />
                  Check your spam folder or{' '}
                  <button
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                    }}
                    className="text-[#1A5C3A] font-semibold hover:underline"
                  >
                    try another email
                  </button>
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[#1A5C3A] font-semibold hover:underline"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}