'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Extract the content that uses useSearchParams into a separate component
function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Unknown error'

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h1>
          
          <p className="text-gray-500 mb-8">
            {error === 'otp_expired' 
              ? 'This link has expired. Please request a new one.' 
              : 'This link is invalid or has already been used.'}
          </p>

          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#1A5C3A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition mb-4"
          >
            Request New Link
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-[#1A5C3A] font-semibold hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1A5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  )
}