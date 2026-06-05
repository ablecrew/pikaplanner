import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  CheckCircle2, Mail, Home, MessageCircle, Clock, ArrowRight, Copy,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ticket Submitted | Pika Plan',
  robots: { index: false, follow: false },
}

export default function ContactSuccessPage({
  searchParams,
}: {
  searchParams: { ticket?: string }
}) {
  const ticket = searchParams.ticket ?? 'PP-XXXX-XXXX'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#f8faf8] to-white font-poppins flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full p-8 sm:p-12 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] shadow-lg shadow-[#32CD32]/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ticket submitted!
          </h1>
          <p className="text-base text-gray-600 mt-3 leading-relaxed max-w-md mx-auto">
            Thank you for reaching out. Our support team has received your request and will respond
            within <strong className="text-[#126e3d]">1 hour</strong> during business hours.
          </p>

          {/* Ticket number */}
          <div className="mt-8 bg-[#f8faf8] border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
              Your Ticket Number
            </p>
            <p className="font-mono text-2xl font-black text-slate-900 tracking-wider">
              {ticket}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Save this for your records. We will reference it in all correspondence.
            </p>
          </div>

          {/* What happens next */}
          <div className="mt-8 text-left bg-[#f0fdf4] border border-[#32CD32]/20 rounded-2xl p-6">
            <p className="text-sm font-black text-[#126e3d] uppercase tracking-wider mb-4">
              What happens next?
            </p>
            <ul className="space-y-3">
              {[
                { icon: Mail, text: 'A confirmation email has been sent to your inbox.' },
                { icon: Clock, text: 'Our team reviews your ticket and assigns it to the right specialist.' },
                { icon: MessageCircle, text: 'You will receive a personalised response by email or phone.' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#32CD32] flex-shrink-0">
                      <Icon size={13} className="text-white" />
                    </div>
                    <p className="text-sm text-slate-700 pt-0.5 leading-relaxed">{item.text}</p>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 hover:border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition"
            >
              <Home size={16} />
              Back to Help Center
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-3 text-sm font-black text-white shadow-md transition hover:shadow-lg"
            >
              Continue to Pika Plan
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}