'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User, Shield, Bell, Settings as SettingsIcon, Lock, CreditCard,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  user: User,
  shield: Shield,
  bell: Bell,
  settings: SettingsIcon,
  lock: Lock,
  'credit-card': CreditCard,
}

type Tab = {
  href: string
  label: string
  icon: 'user' | 'shield' | 'bell' | 'settings' | 'lock' | 'credit-card'
  description: string
}

export default function SettingsNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname()

  return (
    <nav className="lg:sticky lg:top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1">
      {tabs.map((tab) => {
        const Icon = ICONS[tab.icon]
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition group ${
              active
                ? 'bg-[#f0fdf4] text-[#126e3d]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition ${
              active ? 'bg-[#32CD32] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
            }`}>
              <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold leading-tight ${active ? 'text-[#126e3d]' : 'text-slate-700'}`}>
                {tab.label}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{tab.description}</p>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}