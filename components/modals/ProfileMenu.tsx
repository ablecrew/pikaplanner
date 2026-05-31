'use client'
import Link from 'next/link'
import { User, Settings, LogOut, Crown, ChefHat, Shield } from 'lucide-react'
import { signOutAction } from '@/app/actions/auth'
import { UserAvatar } from '@/components/navbar/Navbar'

export function ProfileMenu({ profile, onClose }: { profile: any; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: 240,
        background: 'white',
        borderRadius: 14,
        border: '1px solid #E8EAE8',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* Profile header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 10, alignItems: 'center' }}>
        <UserAvatar profile={profile} size={40} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.full_name || 'User'}
          </p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.email}
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '8px 0' }}>
        {[
          { href: '/profile', label: 'My Profile', icon: User },
          { href: '/profile/settings', label: 'Settings', icon: Settings },
          ...(profile?.role === 'vendor' ? [{ href: '/vendor/dashboard', label: 'Vendor Dashboard', icon: ChefHat }] : []),
          ...(profile?.role === 'admin' ? [{ href: '/admin', label: 'Admin Panel', icon: Shield }] : []),
          { href: '/pricing', label: 'Upgrade Plan', icon: Crown, highlight: true },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', textDecoration: 'none',
              color: (item as any).highlight ? '#D97706' : '#333',
              background: 'transparent',
              fontSize: 13.5,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: (item as any).highlight ? 600 : 500,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <item.icon size={15} />
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ height: 1, background: '#F3F4F6' }} />

      <div style={{ padding: '8px 0' }}>
        <button
          onClick={() => signOutAction()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', border: 'none', background: 'none',
            color: '#EF4444', cursor: 'pointer',
            fontSize: 13.5, fontFamily: "'Poppins', sans-serif", fontWeight: 500,
            transition: 'background 0.1s', textAlign: 'left',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )
}