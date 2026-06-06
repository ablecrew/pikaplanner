'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Calendar,
  ShoppingCart,
  UtensilsCrossed,
  LayoutDashboard,
  Crown,
  Check,
  ChefHat,
  Shield,
  Package,
  CreditCard,
  Info,
  Loader2,
  Users,
  Store,
  BarChart3,
  ReceiptText,
  Briefcase,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

type Role = 'user' | 'vendor' | 'admin' | 'superadmin'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
}

interface Notification {
  id: string
  title: string
  body: string
  is_read: boolean
  sent_at: string
  metadata?: { type?: string }
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const NOTIF_CFG: Record<
  string,
  { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }
> = {
  order: { icon: Package, color: '#1A5C3A', bg: '#D1FAE5' },
  payment: { icon: CreditCard, color: '#1E40AF', bg: '#DBEAFE' },
  vendor: { icon: ChefHat, color: '#D97706', bg: '#FEF3C7' },
  default: { icon: Info, color: '#6B7280', bg: '#F3F4F6' },
}

const ROLE_NAV: Record<Role, NavItem[]> = {
  user: [
    { href: '/dashboard/user/overview', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/meal-plans', label: 'Meal Plans', icon: Calendar },
    { href: '/discover', label: 'Discover', icon: UtensilsCrossed },
    { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
    { href: '/careers', label: 'Careers', icon: Briefcase },
  ],
  vendor: [
    { href: '/dashboard/vendor/overview', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/vendor/meals', label: 'Meals', icon: UtensilsCrossed },
    { href: '/dashboard/vendor/orders', label: 'Orders', icon: Package },
    { href: '/dashboard/vendor/transactions', label: 'Transactions', icon: ReceiptText },
    { href: '/careers', label: 'Careers', icon: Briefcase },
  ],
  admin: [
    { href: '/dashboard/admin/overview', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users },
    { href: '/dashboard/admin/vendors', label: 'Vendors', icon: Store },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/careers', label: 'Careers', icon: Briefcase },
  ],
  superadmin: [
    { href: '/dashboard/admin/overview', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users },
    { href: '/dashboard/admin/vendors', label: 'Vendors', icon: Store },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/careers', label: 'Careers', icon: Briefcase },
  ],
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function normalizeRole(value: unknown): Role | null {
  if (value === 'user' || value === 'vendor' || value === 'admin' || value === 'superadmin') return value
  return null
}

function getRoleBasePath(role: Role) {
  if (role === 'admin' || role === 'superadmin') return '/dashboard/admin'
  if (role === 'vendor') return '/dashboard/vendor'
  return '/dashboard/user'
}

export function PikaLogo({ size = 36 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="10" fill="#1A5C3A" />
        <path
          d="M12 28 C12 28 14 18 20 16 C26 14 26 20 22 22 C18 24 16 18 20 14"
          stroke="#32CD32"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="26" cy="14" r="3" fill="#F4A535" />
        <path d="M18 28 L22 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 31 L24 31" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  )
}

export function UserAvatar({
  profile,
  fallbackEmail,
  size = 36,
}: {
  profile: Profile | null
  fallbackEmail?: string
  size?: number
}) {
  const [imgErr, setImgErr] = useState(false)

  const initials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : fallbackEmail?.[0]?.toUpperCase() ?? 'U'

  const colors = ['#1A5C3A', '#F4A535', '#32CD32', '#2D4B8E', '#C0392B', '#7C3AED']
  const colorIdx = (initials.charCodeAt(0) || 0) % colors.length

  if (profile?.avatar_url && !imgErr) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name || 'Profile'}
        width={size}
        height={size}
        className="rounded-full object-cover border-2 border-white/30 block"
        style={{ width: size, height: size, flexShrink: 0 }}
        onError={() => setImgErr(true)}
      />
    )
  }

  return (
    <div
      className="rounded-full text-white font-bold flex items-center justify-center border-2 border-white/20 select-none"
      style={{
        width: size,
        height: size,
        background: colors[colorIdx],
        fontSize: Math.round(size * 0.38),
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

function NotificationsDropdown({
  notifications,
  unread,
  loading,
  onMarkAllRead,
}: {
  notifications: Notification[]
  unread: number
  loading: boolean
  onMarkAllRead: () => void
}) {
  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-[340px] max-h-[420px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-[200] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-900">Notifications</span>
          {unread > 0 && (
            <span className="bg-red-500 text-white rounded-full text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={onMarkAllRead} className="text-xs text-emerald-700 font-semibold hover:text-emerald-800">
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={20} className="animate-spin text-emerald-700" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const type = n.metadata?.type || 'default'
            const cfg = NOTIF_CFG[type] || NOTIF_CFG.default
            const Icon = cfg.icon

            return (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-3 border-b border-gray-50 transition ${
                  n.is_read ? 'bg-white' : 'bg-emerald-50/30 border-l-4 border-l-emerald-500'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg }}
                >
                  <Icon size={15} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 mb-0.5 line-clamp-1">{n.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.sent_at)}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ProfileDropdown({
  profile,
  userEmail,
  onClose,
  onSignOut,
  signingOut,
}: {
  profile: Profile | null
  userEmail?: string
  onClose: () => void
  onSignOut: () => Promise<void>
  signingOut: boolean
}) {
  const menuItems = [
    { href: '/profile', label: 'My Profile', icon: User },
    { href: '/profile/settings', label: 'Account Settings', icon: Settings },
    ...(profile?.role === 'vendor'
      ? [{ href: '/dashboard/vendor/overview', label: 'Vendor Dashboard', icon: ChefHat }]
      : []),
    ...(profile?.role === 'admin' || profile?.role === 'superadmin'
      ? [{ href: '/dashboard/admin/overview', label: 'Admin Panel', icon: Shield }]
      : []),
  ]

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-[240px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-[200]">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <UserAvatar profile={profile} fallbackEmail={userEmail} size={38} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {profile?.full_name || userEmail?.split('@')[0] || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate">{profile?.email || userEmail}</p>
        </div>
      </div>

      <div className="py-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="px-4 py-2.5 flex items-center gap-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <item.icon size={14} className="text-gray-500" />
            {item.label}
          </Link>
        ))}

        {profile?.role !== 'vendor' && profile?.role !== 'admin' && profile?.role !== 'superadmin' && (
          <Link
            href="/pricing"
            onClick={onClose}
            className="px-4 py-2.5 flex items-center gap-2.5 text-sm text-amber-700 hover:bg-amber-50 transition font-semibold"
          >
            <Crown size={14} className="text-amber-600" />
            Upgrade Plan
          </Link>
        )}
      </div>

      <div className="border-t border-gray-100 p-2">
        <button
          onClick={() => void onSignOut()}
          disabled={signingOut}
          aria-busy={signingOut}
          className="w-full rounded-xl px-4 py-2.5 flex items-center justify-center gap-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 shadow-sm shadow-red-200 transition hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={14} />}
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}

export default function Navbar() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
    setNotifOpen(false)
  }, [pathname])

  const role: Role = useMemo(() => {
    const fromProfile = normalizeRole(profile?.role)
    const fromAppMeta = normalizeRole(user?.app_metadata?.role)
    const fromUserMeta = normalizeRole(user?.user_metadata?.role)
    return fromProfile || fromAppMeta || fromUserMeta || 'user'
  }, [profile?.role, user?.app_metadata?.role, user?.user_metadata?.role])

  const dashboardBasePath = useMemo(() => getRoleBasePath(role), [role])
  const navLinks = useMemo(() => ROLE_NAV[role] ?? ROLE_NAV.user, [role])
  const showAuthenticatedUI = !!user && !authLoading

  const name =
    profile?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User'

  const email = profile?.email || user?.email || ''
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleSignOut = useCallback(async () => {
    if (loggingOut) return

    setLoggingOut(true)
    setNotifOpen(false)
    setProfileOpen(false)
    setMobileOpen(false)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.replace('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out failed:', error)
      router.replace('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }, [loggingOut, supabase, router])

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    setNotifsLoading(true)

    try {
      const { data } = await supabase
        .from('notification_logs')
        .select('id, title, body, is_read, sent_at, metadata')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20)

      const rows = (data as Notification[]) || []
      setNotifications(rows)
      setUnreadCount(rows.filter((n) => !n.is_read).length)
    } finally {
      setNotifsLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    void loadNotifications()

    const channel = supabase
      .channel(`notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          setNotifications((prev) => [payload.new as unknown as Notification, ...prev])
          setUnreadCount((c) => c + 1)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, loadNotifications, supabase])

  const markAllRead = useCallback(async () => {
    if (!user?.id) return

    await supabase
      .from('notification_logs')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [user?.id, supabase])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] h-16 bg-white/95 backdrop-blur-md border-b border-emerald-200/40 shadow-[0_1px_20px_rgba(26,92,58,0.06)] font-poppins">
        <div className="max-w-[1200px] mx-auto px-5 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href={showAuthenticatedUI ? `${dashboardBasePath}/overview` : '/'} className="flex items-center gap-2.5 flex-shrink-0">
            <PikaLogo size={36} />
            <div>
              <span className="font-extrabold text-[18px] text-[#1A5C3A] leading-none">
                Pika<span className="text-[#F4A535]">Plan</span>
              </span>
              <span className="block text-[8.5px] text-gray-400 tracking-[1px] uppercase">Smart Meals</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          {showAuthenticatedUI && (
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13.5px] transition ${
                    isActive(link.href)
                      ? 'bg-emerald-100/70 text-[#1A5C3A] font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#1A5C3A] font-medium'
                  }`}
                >
                  <link.icon size={15} />
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-gray-500" />
              </div>
            ) : showAuthenticatedUI ? (
              <>
                {role === 'user' && (
                  <Link
                    href="/pricing"
                    className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#F4A535] to-[#e8921f] shadow-[0_2px_10px_rgba(244,165,53,0.35)] hover:opacity-90 transition"
                  >
                    <Crown size={13} />
                    Upgrade
                  </Link>
                )}

                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen((o) => !o)
                      setProfileOpen(false)
                      if (!notifOpen) void loadNotifications()
                    }}
                    aria-label="Notifications"
                    className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center transition ${
                      notifOpen ? 'bg-emerald-50' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Bell size={17} className={notifOpen ? 'text-[#1A5C3A]' : 'text-gray-600'} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9.5px] font-bold min-w-[18px] h-[18px] rounded-full px-1 flex items-center justify-center border-2 border-white animate-[pikaPulse_2s_ease-in-out_infinite]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <NotificationsDropdown
                      notifications={notifications}
                      unread={unreadCount}
                      loading={notifsLoading}
                      onMarkAllRead={() => void markAllRead()}
                    />
                  )}
                </div>

                {/* Profile */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => {
                      setProfileOpen((o) => !o)
                      setNotifOpen(false)
                    }}
                    aria-label="Profile menu"
                    className={`p-0.5 rounded-full transition ${
                      profileOpen ? 'outline outline-2 outline-emerald-500/70 outline-offset-1' : ''
                    }`}
                  >
                    <UserAvatar profile={profile as Profile | null} fallbackEmail={user?.email} size={36} />
                  </button>

                  {profileOpen && (
                    <ProfileDropdown
                      profile={profile as Profile | null}
                      userEmail={user?.email}
                      onClose={() => setProfileOpen(false)}
                      onSignOut={handleSignOut}
                      signingOut={loggingOut}
                    />
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  className="lg:hidden w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center"
                  onClick={() => setMobileOpen((o) => !o)}
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileOpen ? <X size={18} className="text-[#1A5C3A]" /> : <Menu size={18} className="text-gray-600" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#1A5C3A] border border-[#1A5C3A] hover:bg-emerald-50 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#1A5C3A] to-emerald-500 shadow-[0_2px_8px_rgba(26,92,58,0.25)]"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-[99] w-[82%] max-w-[320px] lg:hidden bg-gradient-to-b from-[#1A5C3A] via-[#0d3d26] to-[#111827] shadow-2xl transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {showAuthenticatedUI && (
          <>
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <UserAvatar profile={profile as Profile | null} fallbackEmail={user?.email} size={46} />
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-[15px] truncate">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-white/55 text-xs truncate">{profile?.email || user?.email}</p>
                {role === 'user' && (
                  <span className="inline-block mt-1.5 bg-amber-500/25 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Free Plan
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <p className="text-[9.5px] text-white/35 uppercase tracking-[1.5px] px-2.5 mb-2">Menu</p>

              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 p-3 rounded-xl mb-1 border transition ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-400/35'
                        : 'border-transparent hover:bg-white/5'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <div
                      className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center ${
                        active ? 'bg-emerald-500/20' : 'bg-white/10'
                      }`}
                    >
                      <link.icon size={16} className={active ? 'text-emerald-300' : 'text-white/75'} />
                    </div>
                    <span className={`text-sm flex-1 ${active ? 'text-emerald-300 font-bold' : 'text-white/85 font-medium'}`}>
                      {link.label}
                    </span>
                    {active && <Check size={14} className="text-emerald-300" />}
                  </Link>
                )
              })}

              {role === 'user' && (
                <Link
                  href="/pricing"
                  className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-amber-400/35 bg-amber-500/10"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Crown size={16} className="text-amber-300" />
                  </div>
                  <div>
                    <p className="text-amber-300 font-bold text-sm">Upgrade Plan</p>
                    <p className="text-amber-300/70 text-[11px]">From KES 50/week</p>
                  </div>
                </Link>
              )}

              <Link
                href="/profile/settings"
                className="mt-2 flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition"
                onClick={() => setMobileOpen(false)}
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-white/10 flex items-center justify-center">
                  <Settings size={16} className="text-white/75" />
                </div>
                <span className="text-sm text-white/85 font-medium">Account Settings</span>
              </Link>
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => void handleSignOut()}
                disabled={loggingOut}
                aria-busy={loggingOut}
                className="w-full flex items-center justify-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-400/25 text-red-300 font-semibold text-sm transition hover:bg-red-500/15 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Spacer */}
      <div className="h-16" aria-hidden />

      <style>{`
        @keyframes pikaPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: 0.85; }
        }
      `}</style>
    </>
  )
}