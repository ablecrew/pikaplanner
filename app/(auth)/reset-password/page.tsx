'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { updatePasswordAction } from '@/app/actions/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updatePasswordAction(formData)
      if (result.success) {
        router.push('/dashboard?message=password_updated')
      } else {
        setError(result.error ?? 'Failed to update password')
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Set new password</h1>
          <p className="text-gray-500 mt-2">Choose a strong password for your account.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] bg-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Min 8 chars, uppercase, lowercase, number & special character
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#1A5C3A] text-white py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}