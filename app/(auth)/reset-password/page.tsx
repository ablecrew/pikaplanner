'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { updatePasswordAction } from '@/app/actions/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const isPasswordValid = Object.values(passwordChecks).every(Boolean)
  const canSubmit = isPasswordValid && passwordsMatch

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError('Please enter a valid password')
      return
    }

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updatePasswordAction(formData)

      if (!result.success) {
        setError(result.error ?? 'Failed to reset password')
        return
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    })
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A5C3A]" />
      </div>
    )
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
            Create new password
          </h2>
          <p className="text-green-200 text-lg">
            Your new password must be different from previous passwords.
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
          {!success ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Reset password</h1>
                <p className="text-gray-500 mt-2">
                  Enter your new password below
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] focus:border-transparent bg-white text-gray-900"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password requirements */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Password must contain:
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { label: '8+ characters', met: passwordChecks.length },
                          { label: 'Uppercase letter', met: passwordChecks.uppercase },
                          { label: 'Lowercase letter', met: passwordChecks.lowercase },
                          { label: 'Number', met: passwordChecks.number },
                          { label: 'Special character', met: passwordChecks.special },
                        ].map((check) => (
                          <p
                            key={check.label}
                            className={`text-xs ${
                              check.met ? 'text-emerald-600' : 'text-gray-400'
                            }`}
                          >
                            {check.met ? '✓' : '○'} {check.label}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 ${
                        confirmPassword && !passwordsMatch
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-200 focus:ring-[#1A5C3A]'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}

                  {confirmPassword && passwordsMatch && (
                    <p className="text-xs text-emerald-600 mt-1">✓ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending || !canSubmit}
                  className="w-full bg-[#1A5C3A] text-white py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Resetting...
                    </>
                  ) : (
                    'Reset Password'
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

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password reset successful!</h1>
              <p className="text-gray-500 mb-8">
                Your password has been reset successfully. Redirecting to login...
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting in 3 seconds...
              </div>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-6 text-[#1A5C3A] font-semibold hover:underline"
              >
                Go to login now
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}