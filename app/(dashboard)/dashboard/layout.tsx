'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Users, Store, UtensilsCrossed, ShoppingCart, CreditCard,
  BarChart3, Bell, Settings, LogOut, Menu, X, ChevronDown, Search,
  User as UserIcon, Package, Heart, HelpCircle, BarChart4, Leaf, Crown,
  Calendar, Home, Compass, Sparkles, ShoppingBag,
  Building2
} from 'lucide-react'

type Role = 'user' | 'vendor' | 'admin' | 'superadmin'

interface SidebarItem {
  label: string
  icon: React.ReactNode
  path: string
}

const ROLE_PRIORITY: Record<Role, number> = { user: 0, vendor: 1, admin: 2, superadmin: 3 }

const adminSidebar: SidebarItem[] = [
  { label: 'Overview', icon: <LayoutDashboard size={18} />, path: '/dashboard/admin/overview' },
  { label: 'Users', icon: <Users size={18} />, path: '/dashboard/admin/users' },
  { label: 'Vendors', icon: <Store size={18} />, path: '/dashboard/admin/vendors' },
  { label: 'Meals', icon: <UtensilsCrossed size={18} />, path: '/dashboard/admin/meals' },
  { label: 'Orders', icon: <ShoppingCart size={18} />, path: '/dashboard/admin/orders' },
  { label: 'Transactions', icon: <CreditCard size={18} />, path: '/dashboard/admin/transactions' },
  { label: 'Analytics', icon: <BarChart3 size={18} />, path: '/dashboard/admin/analytics' },
  { label: 'Notifications', icon: <Bell size={18} />, path: '/dashboard/admin/notifications' },
  { label: 'Subscriptions', icon: <Crown size={18} />, path: '/dashboard/admin/subscriptions' },
  { label: 'Careers', icon: <Building2 size={18} />, path: '/dashboard/admin/careers' },
  { label: 'Settings', icon: <Settings size={18} />, path: '/dashboard/admin/settings' },
]

const vendorSidebar: SidebarItem[] = [
  { label: 'Overview', icon: <LayoutDashboard size={18} />, path: '/dashboard/vendor/overview' },
  { label: 'My Meals', icon: <UtensilsCrossed size={18} />, path: '/dashboard/vendor/meals' },
  { label: 'Orders', icon: <ShoppingCart size={18} />, path: '/dashboard/vendor/orders' },
  { label: 'Transactions', icon: <CreditCard size={18} />, path: '/dashboard/vendor/transactions' },
  { label: 'Analytics', icon: <BarChart3 size={18} />, path: '/dashboard/vendor/analytics' },
  { label: 'Notifications', icon: <Bell size={18} />, path: '/dashboard/vendor/notifications' },
  { label: 'Subscription', icon: <Crown size={18} />, path: '/dashboard/vendor/subscription' },
  { label: 'Settings', icon: <Settings size={18} />, path: '/dashboard/vendor/settings' },
]

const userSidebar: SidebarItem[] = [
  { label: 'Overview', icon: <LayoutDashboard size={18} />, path: '/dashboard/user/overview' },
  { label: 'Browse Meals', icon: <UtensilsCrossed size={18} />, path: '/dashboard/user/meals' },
  { label: 'Browse Vendors', icon: <Store size={18} />, path: '/dashboard/user/vendors' },
  { label: 'My Orders', icon: <Package size={18} />, path: '/dashboard/user/orders' },
  { label: 'Favorites', icon: <Heart size={18} />, path: '/dashboard/user/favorites' },
  { label: 'Order History', icon: <ShoppingCart size={18} />, path: '/dashboard/user/history' },
  { label: 'Transactions', icon: <CreditCard size={18} />, path: '/dashboard/user/transactions' },
  { label: 'Notifications', icon: <Bell size={18} />, path: '/dashboard/user/notifications' },
  { label: 'Analytics', icon: <BarChart4 size={18} />, path: '/dashboard/user/analytics' },
  { label: 'Meal Plan', icon: <Calendar size={18} />, path: '/dashboard/user/subscription' },
  { label: 'Help & Support', icon: <HelpCircle size={18} />, path: '/dashboard/user/support' },
  { label: 'Settings', icon: <Settings size={18} />, path: '/dashboard/user/settings' },
]

// ── Customer Quick Nav Component ──────────────────────────────────────────────
function CustomerQuickNav({ pathname }: { pathname: string }) {
  const quickLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/discover', label: 'Discovery', icon: Compass },
    { href: '/meal-generator', label: 'AI Meal Gen', icon: Sparkles },
    { href: '/shopping', label: 'Shopping', icon: ShoppingBag },
  ]

  return (
    <div className="mb-6 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-white border-b border-gray-100 lg:bg-transparent lg:border-none lg:p-0 lg:mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 hidden lg:block whitespace-nowrap">
          Quick Access
        </span>
        {quickLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-600'
              }`}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
// ───────────────────────────────────────────────────────────────────────────────

function isValidRole(value: unknown): value is Role {
  return value === 'user' || value === 'vendor' || value === 'admin' || value === 'superadmin'
}

function normalizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null
  return isValidRole(value) ? value : null
}

function mergeRole(current: Role | null, next: unknown): Role | null {
  const candidate = normalizeRole(next)
  if (!candidate) return current
  if (!current) return candidate
  return ROLE_PRIORITY[candidate] >= ROLE_PRIORITY[current] ? candidate : current
}

const getSidebarItems = (role: Role) => {
  if (role === 'admin' || role === 'superadmin') return adminSidebar
  if (role === 'vendor') return vendorSidebar
  return userSidebar
}

const getRoleLabel = (role: Role) => {
  if (role === 'superadmin') return 'Super Admin'
  if (role === 'admin') return 'Administrator'
  if (role === 'vendor') return 'Vendor'
  return 'Customer'
}

const getDashboardBasePath = (role: Role) => {
  if (role === 'admin' || role === 'superadmin') return '/dashboard/admin'
  if (role === 'vendor') return '/dashboard/vendor'
  return '/dashboard/user'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [role, setRole] = useState<Role | null>(null)
  const [loadingRole, setLoadingRole] = useState(true)

  const roleFetchRef = useRef<string | null>(null)

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    let cancelled = false

    if (!user) {
      setLoadingRole(true)
      const loginTimeout = setTimeout(() => {
        if (!user) router.push('/login')
      }, 3000)
      return () => { cancelled = true; clearTimeout(loginTimeout) }
    }

    const cacheKey = `pikaplan:role:${user.id}`
    roleFetchRef.current = cacheKey

    const cachedRole = typeof window !== 'undefined' ? normalizeRole(localStorage.getItem(cacheKey)) : null

    if (cachedRole) {
      setRole(cachedRole)
      setLoadingRole(false)
    } else {
      setLoadingRole(true)
    }

    const loadRole = async () => {
      let resolved: Role | null = cachedRole

      try {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        resolved = mergeRole(resolved, profile?.role)
      } catch {}

      try {
        const { data: rpcData } = await supabase.rpc('get_my_profile')
        const rpcRole = Array.isArray(rpcData)
          ? normalizeRole((rpcData[0] as { role?: string } | undefined)?.role)
          : normalizeRole((rpcData as { role?: string } | null)?.role)
        resolved = mergeRole(resolved, rpcRole)
      } catch {}

      resolved = mergeRole(resolved, user.app_metadata?.role)
      resolved = mergeRole(resolved, user.user_metadata?.role)

      if (!resolved) resolved = 'user'
      if (cancelled) return

      setRole(resolved)
      setLoadingRole(false)

      if (typeof window !== 'undefined') {
        try { localStorage.setItem(cacheKey, resolved) } catch {}
      }
    }

    void loadRole()
    return () => { cancelled = true }
  }, [user, supabase, router])

  useEffect(() => {
    if (!profileOpen) return
    const close = () => setProfileOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [profileOpen])

  if (!user || loadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const resolvedRole: Role = role || 'user'
  const dashboardBasePath = getDashboardBasePath(resolvedRole)
  const sidebarItems = getSidebarItems(resolvedRole)

  const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const email = user.email || ''
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const unreadCount = 3

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`)

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar drawer */}
      <aside className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-[82%] max-w-[320px] bg-white border-r border-gray-100 shadow-2xl transform transition-transform duration-300 lg:hidden overflow-hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <Link key={item.path} href={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(item.path) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`} onClick={() => setMobileOpen(false)}>
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            {avatarUrl ? <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-100" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">{initials}</div>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition font-medium">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-full bg-white border-r border-gray-100 shadow-sm flex-col transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0">
          <Link href={`${dashboardBasePath}/overview`} className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-200"><Leaf size={18} className="text-white" /></div>
            {sidebarOpen && <span className="text-xl font-bold tracking-tight whitespace-nowrap"><span className="text-emerald-600">Pika</span><span className="text-orange-500">Plan</span></span>}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <Link key={item.path} href={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(item.path) ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'} ${!sidebarOpen ? 'justify-center' : ''}`} title={item.label}>
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          <div className={`flex items-center gap-3 px-3 py-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            {avatarUrl ? <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-100" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">{initials}</div>}
            {sidebarOpen && <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{name}</p><p className="text-xs text-gray-500 truncate">{email}</p></div>}
          </div>
          {sidebarOpen && (
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition font-medium">
              <LogOut size={16} /> Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex min-h-screen flex-col transition-all duration-300 overflow-x-hidden ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} ml-0`}>
        {/* TopNav */}
        <header className="h-16 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
            <div className="relative hidden sm:block min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search anything..." className="w-56 md:w-64 lg:w-80 pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`${dashboardBasePath}/notifications`} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition text-gray-500 hover:text-gray-700">
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm shadow-emerald-200">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </Link>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen) }} className="flex items-center gap-2.5 p-1.5 pl-2 hover:bg-gray-100 rounded-xl transition">
                {avatarUrl ? <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-100" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">{initials}</div>}
                <div className="hidden md:block text-left"><p className="text-sm font-medium text-gray-900 leading-tight">{name}</p><p className="text-[11px] text-gray-500 leading-tight">{getRoleLabel(resolvedRole)}</p></div>
                <ChevronDown size={14} className="text-gray-400 hidden md:block" />
              </button>
              {profileOpen && (
                <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    {avatarUrl ? <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">{initials}</div>}
                    <div className="min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{name}</p><p className="text-xs text-gray-500 truncate">{email}</p><span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">{getRoleLabel(resolvedRole)}</span></div>
                  </div>
                  <div className="py-1">
                    <Link href={`${dashboardBasePath}/settings`} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"><UserIcon size={16} className="text-gray-400" />Profile</Link>
                    <Link href={`${dashboardBasePath}/settings`} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"><Settings size={16} className="text-gray-400" />Settings</Link>
                  </div>
                  <div className="border-t border-gray-100 pt-1">
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium"><LogOut size={16} />Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden overflow-y-auto">
          
          {/* 👇 CONDITIONAL QUICK NAV FOR CUSTOMERS ONLY 👇 */}
          {resolvedRole === 'user' && <CustomerQuickNav pathname={pathname} />}

          {children}
        </main>
      </div>
    </div>
  )
}