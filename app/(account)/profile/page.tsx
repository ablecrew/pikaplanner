import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Settings, ChevronRight, Calendar, ShoppingBag, Heart, ChefHat,
  TrendingUp, Sparkles, Briefcase, Store, Shield, AlertCircle,
  CheckCircle2, ArrowRight, Crown, Mail, ShieldCheck, Smartphone,
} from 'lucide-react'

import {
  fetchProfile, fetchProfileStats, fetchAchievements, fetchRecentActivity,
} from './actions'
import ProfileHero from './ProfileHero'
import StatsGrid from './StatsGrid'
import AchievementsList from './AchievementsList'
import ActivityFeed from './ActivityFeed'

export const metadata: Metadata = {
  title: 'My Profile | Pika Plan',
  description: 'View your activity, achievements, and account information on Pika Plan.',
  robots: { index: false, follow: false },
}

const QUICK_LINKS = [
  { href: '/meal-plans',              label: 'My Meal Plans',    icon: Calendar,   color: '#1A5C3A', bg: '#f0fdf4' },
  { href: '/orders',                  label: 'My Orders',        icon: ShoppingBag, color: '#2563eb', bg: '#eff6ff' },
  { href: '/favorites',               label: 'Saved Recipes',    icon: Heart,      color: '#dc2626', bg: '#fef2f2' },
  { href: '/profile/settings/billing', label: 'Subscription',     icon: Crown,      color: '#F4A535', bg: '#fffbeb' },
]

export default async function ProfilePage() {
  const profile = await fetchProfile()
  if (!profile) redirect('/login')

  const [stats, activities] = await Promise.all([
    fetchProfileStats(profile.id),
    fetchRecentActivity(profile.id),
  ])
  const achievements = await fetchAchievements(stats, profile.two_factor_enabled)

  const isVendor = profile.role === 'vendor'
  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin'
  const profileCompleteness = calculateCompleteness(profile)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero */}
          <ProfileHero profile={profile} />

          {/* Profile Completeness Banner */}
          {profileCompleteness.percent < 100 && (
            <section className="mb-6">
              <div className="bg-gradient-to-r from-emerald-50 via-white to-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#32CD32]/15 text-[#126e3d] flex-shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-black text-slate-900">Complete your profile</h3>
                      <span className="text-xs font-black text-[#126e3d] bg-[#f0fdf4] px-2 py-0.5 rounded-full">
                        {profileCompleteness.percent}% done
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      {profileCompleteness.missing.length > 0
                        ? `Add ${profileCompleteness.missing.slice(0, 2).join(' & ')} to get the most personalised experience.`
                        : 'Just a few more steps to a fully optimised profile.'}
                    </p>
                    <div className="h-2 bg-emerald-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] transition-all"
                        style={{ width: `${profileCompleteness.percent}%` }}
                      />
                    </div>
                    <Link
                      href="/profile/settings/general"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#126e3d] hover:underline"
                    >
                      Complete profile <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Security Reminders */}
          {(!profile.two_factor_enabled || !profile.email_verified) && (
            <section className="mb-6 space-y-3">
              {!profile.email_verified && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <Mail size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">Verify your email address</p>
                    <p className="text-xs text-amber-700 mt-0.5">Confirm your email to unlock all features.</p>
                  </div>
                  <button className="text-xs font-bold text-amber-700 hover:underline">
                    Resend
                  </button>
                </div>
              )}
              {!profile.two_factor_enabled && (
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <ShieldCheck size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-900">Enable two-factor authentication</p>
                    <p className="text-xs text-blue-700 mt-0.5">Add an extra layer of security to your account.</p>
                  </div>
                  <Link
                    href="/profile/settings/security"
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    Enable
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Stats */}
          <StatsGrid stats={stats} />

          {/* Achievements */}
          <AchievementsList achievements={achievements} />

          {/* Two-column layout: Activity + Sidebar */}
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <ActivityFeed activities={activities} />
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Quick Links */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                  Quick Access
                </h3>
                <div className="space-y-1">
                  {QUICK_LINKS.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: link.bg, color: link.color }}
                        >
                          <Icon size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 flex-1">
                          {link.label}
                        </span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                      </Link>
                    )
                  })}

                  {/* Role-specific links */}
                  {isVendor && (
                    <Link
                      href="/dashboard/vendor/overview"
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#f97316]">
                        <Store size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 flex-1">Vendor Dashboard</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      href="/dashboard/admin/overview"
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7c3aed]">
                        <Shield size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 flex-1">Admin Panel</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                    </Link>
                  )}
                </div>
              </section>

              {/* My Preferences Summary */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    My Preferences
                  </h3>
                  <Link
                    href="/dashboard/user/settings"
                    className="text-xs font-bold text-[#126e3d] hover:underline"
                  >
                    Edit
                  </Link>
                </div>

                <dl className="space-y-3 text-xs">
                  {profile.dietary_preferences && profile.dietary_preferences.length > 0 && (
                    <div>
                      <dt className="font-bold text-slate-500 mb-1.5">Dietary</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {profile.dietary_preferences.map((d) => (
                          <span key={d} className="px-2 py-0.5 rounded bg-emerald-50 text-[#126e3d] font-bold">
                            {d}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}

                  {profile.cuisine_preferences && profile.cuisine_preferences.length > 0 && (
                    <div>
                      <dt className="font-bold text-slate-500 mb-1.5">Cuisines</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {profile.cuisine_preferences.slice(0, 5).map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded bg-orange-50 text-[#f97316] font-bold capitalize">
                            {c.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}

                  {profile.budget_range && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <dt className="font-bold text-slate-500">Budget</dt>
                      <dd className="font-bold text-slate-900">{profile.budget_range}</dd>
                    </div>
                  )}

                  {profile.household_size && (
                    <div className="flex items-center justify-between">
                      <dt className="font-bold text-slate-500">Household</dt>
                      <dd className="font-bold text-slate-900">{profile.household_size} {profile.household_size === 1 ? 'person' : 'people'}</dd>
                    </div>
                  )}

                  {(!profile.dietary_preferences?.length && !profile.cuisine_preferences?.length) && (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-500 mb-2">
                        No preferences set yet
                      </p>
                      <Link
                        href="/dashboard/user/settings"
                        className="text-xs font-bold text-[#126e3d] hover:underline"
                      >
                        Set them now →
                      </Link>
                    </div>
                  )}
                </dl>
              </section>

              {/* CTA Card */}
              {!(profile.is_premium || profile.subscription_tier === 'premium') && (
                <section className="rounded-2xl bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#32CD32]/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] font-black uppercase tracking-wider mb-3">
                      <Crown size={11} className="text-[#F4A535]" /> Pro
                    </div>
                    <h3 className="font-black text-lg mb-1.5">Unlock Premium</h3>
                    <p className="text-xs text-white/80 mb-4 leading-relaxed">
                      Unlimited AI plans, 4 meals/day, ad-free experience, and more.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-4 py-2.5 text-xs font-black uppercase text-white shadow-md transition w-full justify-center"
                    >
                      Upgrade Now <ArrowRight size={11} />
                    </Link>
                  </div>
                </section>
              )}

              {/* Account Settings Link */}
              <section>
                <Link
                  href="/profile/settings"
                  className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 px-4 py-3 text-xs font-bold text-slate-700 transition"
                >
                  <Settings size={13} /> Account Settings
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ── Helper ─────────────────────────────────────────────────
function calculateCompleteness(profile: any) {
  const fields = [
    { key: 'full_name', label: 'your name' },
    { key: 'avatar_url', label: 'a profile photo' },
    { key: 'phone', label: 'a phone number' },
    { key: 'bio', label: 'a bio' },
    { key: 'location', label: 'your location' },
    { key: 'dietary_preferences', label: 'dietary preferences' },
    { key: 'cuisine_preferences', label: 'cuisine preferences' },
    { key: 'household_size', label: 'household size' },
  ]

  const completed = fields.filter((f) => {
    const v = profile[f.key]
    if (Array.isArray(v)) return v.length > 0
    return !!v
  })

  const missing = fields.filter((f) => {
    const v = profile[f.key]
    if (Array.isArray(v)) return v.length === 0
    return !v
  }).map((f) => f.label)

  return {
    percent: Math.round((completed.length / fields.length) * 100),
    missing,
  }
}