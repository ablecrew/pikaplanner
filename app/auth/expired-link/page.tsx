'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function ExpiredLinkPage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          
          <p className="text-gray-500 mb-8">
            This password reset link has expired for security reasons. Reset links are valid for <strong>1 hour</strong>.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong> Why did this happen?</strong>
              <br />
              Password reset links expire after 1 hour to protect your account security.
            </p>
          </div>

          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#1A5C3A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#144a2e] transition mb-4"
          >
            <RefreshCw size={18} />
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