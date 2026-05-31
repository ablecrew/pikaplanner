'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock } from 'lucide-react'
import { signInAction, signInWithGoogleAction } from '@/app/actions/auth'

// We extract the form logic into a sub-component because it uses useSearchParams
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await signInAction(formData)

      if (!result.success) {
        setError(result.error ?? 'Login failed')
        return
      }

      const { role, onboardingComplete } = result.data as {
        role?: string
        onboardingComplete?: boolean
      }

      // 1. Admins: Always go to dashboard
      if (role === 'admin' || role === 'superadmin') {
        router.push('/dashboard')
        return
      }

      // 2. Vendors: If onboarding incomplete, go to vendor-signup, else dashboard
      if (role === 'vendor') {
        if (!onboardingComplete) {
          router.push('/vendor-signup')
        } else {
          router.push(redirectTo)
        }
        return
      }

      // 3. Customers (Default): If onboarding incomplete, go to onboarding, else dashboard
      // This is now strictly separated from the vendor logic
      if (!onboardingComplete) {
        router.push('/onboarding')
      } else {
        router.push(redirectTo)
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-2">Sign in to your Pika Plan account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] focus:border-transparent bg-white text-gray-900"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
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
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-[#1A5C3A] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#1A5C3A] text-white py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400">or continue with</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="space-y-3">
        <button
          onClick={() => signInWithGoogleAction('user')}
          className="w-full border border-gray-200 bg-white py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-3"
        >
          <img src="/google-icon.svg" alt="" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[#1A5C3A] font-semibold hover:underline">
          Create one free
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
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
            Smart meal planning for every day
          </h2>
          <p className="text-green-200 text-lg">
            Plan, cook, or order — all in one place.
          </p>
        </div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#F4A535] opacity-10 rounded-full" />
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-white opacity-5 rounded-full" />
      </div>

      {/* Right panel - form wrapper */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <Suspense fallback={<div className="w-full max-w-md h-96 flex items-center justify-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}