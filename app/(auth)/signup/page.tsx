'use client'
 
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock, User, Phone, ChefHat, ShoppingBag } from 'lucide-react'
import { signUpAction } from '@/app/actions/auth'
 
export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'user' | 'vendor'>('user')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
 
  // Password strength checker
  const [password, setPassword] = useState('')
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length
 
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
 
    const formData = new FormData(event.currentTarget)
    formData.set('role', role)
 
    startTransition(async () => {
      const result = await signUpAction(formData)
 
      if (!result.success) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
        else setError(result.error ?? 'Signup failed')
        return
      }
 
      // After successful signup, show success message with subscription info
      if (role === 'user') {
        setSuccessMessage('Your account has been created! You have a FREE 1-day meal plan trial. Check your email to activate your account.')
      } else {
        setSuccessMessage('Your vendor account has been created! Check your email to activate your account.')
      }
      setSuccess(true)
    })
  }
 
  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Pika Planner!</h2>
          <p className="text-gray-500 mb-6">
            {successMessage}
          </p>
          <Link href="/login" className="inline-block bg-[#1A5C3A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }
 
  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#1A5C3A] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">Pika Planner</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Start planning your meals today</p>
        </div>
 
        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
              role === 'user' ? 'bg-white shadow text-[#1A5C3A]' : 'text-gray-500'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            I'm a User
          </button>
          <button
            type="button"
            onClick={() => setRole('vendor')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
              role === 'vendor' ? 'bg-white shadow text-[#F4A535]' : 'text-gray-500'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            I'm a Vendor
          </button>
        </div>

        {/* Free trial info for users */}
        {role === 'user' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
            <p className="font-semibold mb-1">🎁 Free 1-Day Trial</p>
            <p>You get a free daily meal plan for your first day. After that, subscribe for just KES 14/day, KES 50/week, KES 199/month, or KES 2,200/year.</p>
          </div>
        )}

        {/* Freemium info for vendors */}
        {role === 'vendor' && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
            <p className="font-semibold mb-1">🎉 2 Months Free</p>
            <p>Enjoy 2 months free with limited features. After that, upgrade to premium for KES 999/month for unlimited listings and priority visibility.</p>
          </div>
        )}
 
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="fullName"
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] bg-white text-gray-900"
                placeholder="Jane Wanjiku"
              />
            </div>
            {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] bg-white text-gray-900"
                placeholder="you@example.com"
              />
            </div>
            {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="phone"
                type="tel"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] bg-white text-gray-900"
                placeholder="+254 712 345 678"
              />
            </div>
            {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A5C3A] bg-white text-gray-900"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= passwordStrength ? ['bg-red-400','bg-orange-400','bg-yellow-400','bg-blue-400','bg-green-500'][passwordStrength-1] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries({ '8+ characters': passwordChecks.length, 'Uppercase': passwordChecks.uppercase, 'Lowercase': passwordChecks.lowercase, 'Number': passwordChecks.number, 'Special char': passwordChecks.special }).map(([label, met]) => (
                    <span key={label} className={`text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                      {met ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
          </div>
 
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#1A5C3A] text-white py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </form>
 
        <p className="mt-4 text-center text-xs text-gray-400">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
 
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1A5C3A] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}