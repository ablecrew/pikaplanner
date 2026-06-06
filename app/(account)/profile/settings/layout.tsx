import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  User, Shield, Bell, Settings as SettingsIcon, Lock, CreditCard,
  ArrowLeft, Sparkles,
} from 'lucide-react'
import SettingsNav from './SettingsNav'

export const metadata: Metadata = {
  title: 'Account Settings | Pika Plan',
  description: 'Manage your Pika Plan account, security, notifications, and privacy preferences.',
  robots: { index: false, follow: false },
}

const TABS = [
  { href: '/profile/settings/general',       label: 'General',       icon: 'user' as const,         description: 'Personal info' },
  { href: '/profile/settings/security',      label: 'Security',      icon: 'shield' as const,       description: 'Password & 2FA' },
  { href: '/profile/settings/notifications', label: 'Notifications', icon: 'bell' as const,         description: 'Email & SMS' },
  { href: '/profile/settings/preferences',   label: 'Preferences',   icon: 'settings' as const,     description: 'Language & theme' },
  { href: '/profile/settings/privacy',       label: 'Privacy',       icon: 'lock' as const,         description: 'Data & deletion' },
  { href: '/profile/settings/billing',       label: 'Billing',       icon: 'credit-card' as const,  description: 'Plan & invoices' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        {/* Header */}
        <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white mb-3 transition"
            >
              <ArrowLeft size={12} /> Back to profile
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider mb-3 backdrop-blur">
              <SettingsIcon size={11} className="text-[#32CD32]" />
              Account Settings
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Manage your account
            </h1>
            <p className="mt-2 text-sm text-white/70 max-w-xl">
              Update your personal info, security, notifications, and privacy preferences.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <SettingsNav tabs={TABS} />
            </aside>

            {/* Content */}
            <div className="lg:col-span-3">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}