import Link from 'next/link'
import {
  MapPin, Globe, Mail, Phone, Calendar, Crown, ShieldCheck,
  Edit3, Camera, CheckCircle2,
} from 'lucide-react'
import ShareProfileButton from './ShareProfileButton'
import type { ProfileData } from './actions'

function formatJoinDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric',
  })
}

const ROLE_BADGES = {
  user:       { label: 'Member',      bg: 'bg-emerald-50', text: 'text-[#126e3d]' },
  vendor:     { label: 'Vendor',      bg: 'bg-orange-50',  text: 'text-[#f97316]' },
  admin:      { label: 'Admin',       bg: 'bg-purple-50',  text: 'text-[#7c3aed]' },
  superadmin: { label: 'Super Admin', bg: 'bg-red-50',     text: 'text-[#dc2626]' },
}

export default function ProfileHero({ profile }: { profile: ProfileData }) {
  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : profile.email.charAt(0).toUpperCase()

  const roleBadge = ROLE_BADGES[profile.role] ?? ROLE_BADGES.user
  const isPremium = profile.is_premium || profile.subscription_tier === 'premium'

  return (
    <section className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      {/* ── Banner ───────────────────────────────────────── */}
      <div className="h-32 sm:h-40 bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#32CD32]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#F4A535]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      </div>

      <div className="px-6 sm:px-8 pb-6">
        {/* ── Top Row: ONLY avatar + action buttons overlap banner ── */}
        <div className="-mt-14 sm:-mt-16 mb-5 flex items-end justify-between gap-3 flex-wrap">
          {/* Avatar */}
          <div className="relative inline-block">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? 'Profile'}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] flex items-center justify-center text-white font-black text-3xl border-4 border-white shadow-xl">
                {initials}
              </div>
            )}
            <Link
              href="/profile/settings/general"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white border-2 border-gray-100 shadow-md flex items-center justify-center text-slate-600 hover:text-[#126e3d] transition"
              aria-label="Edit profile photo"
            >
              <Camera size={14} />
            </Link>
          </div>

          {/* Action buttons — wrap below avatar on mobile if needed */}
          <div className="flex items-center gap-2 pb-1 ml-auto">
            <ShareProfileButton
              profileId={profile.id}
              name={profile.full_name ?? 'this user'}
            />
            <Link
              href="/profile/settings/general"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1A5C3A] hover:bg-[#0d3d26] text-white text-xs font-black uppercase transition"
            >
              <Edit3 size={12} /> Edit Profile
            </Link>
          </div>
        </div>

        {/* ── Name + Badges (now safely in the white area) ────────── */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {profile.full_name || 'Anonymous'}
            </h1>
            {isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#F4A535] to-[#f97316] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                <Crown size={10} /> Premium
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${roleBadge.bg} ${roleBadge.text}`}
            >
              {roleBadge.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <Calendar size={12} />
            Joined {formatJoinDate(profile.created_at)}
          </p>
        </div>

        {/* ── Bio ─────────────────────────────────────────────────── */}
        {profile.bio && (
          <p className="text-sm text-slate-600 leading-relaxed mb-4 max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* ── Contact info ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Mail size={12} className="text-[#126e3d]" />
            <span className="break-all">{profile.email}</span>
            {profile.email_verified && (
              <CheckCircle2 size={11} className="text-emerald-600 flex-shrink-0" aria-label="Verified" />
            )}
          </div>

          {profile.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-[#126e3d]" />
              <span>{profile.phone}</span>
              {profile.phone_verified && (
                <CheckCircle2 size={11} className="text-emerald-600 flex-shrink-0" aria-label="Verified" />
              )}
            </div>
          )}

          {profile.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-[#126e3d]" />
              <span>{profile.location}</span>
            </div>
          )}

          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#126e3d] transition"
            >
              <Globe size={12} className="text-[#126e3d]" />
              <span className="truncate max-w-[200px]">
                {profile.website.replace(/^https?:\/\//, '')}
              </span>
            </a>
          )}

          {profile.two_factor_enabled && (
            <div className="flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck size={12} />
              <span className="font-bold">2FA Active</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}