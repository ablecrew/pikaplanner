import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Sparkles, Zap, Wrench, Shield, AlertTriangle, Rocket, Rss,
  Bell, Users, TrendingUp, Bug, Star, Calendar, GitCommit,
  ChevronRight, ArrowRight, Tag,
  type LucideIcon,
  Filter,
} from 'lucide-react'
import { FaTwitter } from 'react-icons/fa';
import ChangelogFilters from './ChangelogFilters'
import SubscribeForm from './SubscribeForm'
import {
  RELEASES, CHANGE_TYPE_META,
  getTotalReleasesThisYear, getChangesByType,
  getAverageReleaseSize, getTotalUsersImpacted, getAverageFeedbackScore,
  type Release, type ChangeType,
} from './_data/releases'

export const metadata: Metadata = {
  title: 'What\'s New | Pika Plan',
  description:
    'Everything new at Pika Plan — features, improvements, fixes, and the impact of each release. Updated regularly.',
  keywords: [
    'Pika Plan changelog',
    'Pika Plan updates',
    'What\'s new Pika Plan',
    'product release notes',
  ],
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'What\'s New | Pika Plan',
    description: 'See every update we\'ve shipped and the real impact on our users.',
    url: '/changelog',
    siteName: 'Pika Plan',
    type: 'article',
    locale: 'en_KE',
  },
}

const TYPE_ICONS: Record<ChangeType, LucideIcon> = {
  feature: Sparkles,
  improvement: Zap,
  fix: Wrench,
  security: Shield,
  breaking: AlertTriangle,
  performance: Rocket,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function ChangelogPage() {
  const totalUsers = getTotalUsersImpacted()
  const releasesThisYear = getTotalReleasesThisYear()
  const avgReleaseSize = getAverageReleaseSize()
  const avgScore = getAverageFeedbackScore()
  const featureCount = getChangesByType('feature')
  const fixCount = getChangesByType('fix')

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Pika Plan Changelog',
    itemListElement: RELEASES.map((r, i) => ({
      '@type': 'SoftwareApplication',
      position: i + 1,
      name: `Pika Plan ${r.version}`,
      softwareVersion: r.version,
      releaseNotes: r.summary,
      datePublished: r.date,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        {/* ── HERO ─────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white relative overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#32CD32]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-[#F4A535]/15 rounded-full blur-3xl" />

          <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider mb-5 backdrop-blur">
              <Tag size={14} className="text-[#32CD32]" />
              What's New
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-3xl">
              Everything we've shipped.
            </h1>
            <p className="mt-4 text-lg text-white/80 max-w-2xl leading-relaxed">
              We ship updates every week. Browse our complete history — and see the
              real impact each release had on our users.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <GitCommit size={14} />
                <span>
                  <strong className="text-white">{RELEASES.length}</strong> releases shipped
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>
                  <strong className="text-white">{releasesThisYear}</strong> this year
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#32CD32]" />
                <span>
                  Latest <strong className="text-white">{timeAgo(RELEASES[0]?.date)}</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
          {/* ── ANALYTICS DASHBOARD ───────────────────── */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8 mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#126e3d] mb-1">
                  Live Analytics
                </p>
                <h2 className="text-xl font-black text-slate-900">Impact at a glance</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticCard
                icon={Users}
                label="Users Impacted"
                value={totalUsers.toLocaleString()}
                suffix="+"
                color="#1A5C3A"
                bg="#f0fdf4"
                trend="+24% MoM"
              />
              <AnalyticCard
                icon={Sparkles}
                label="Features Shipped"
                value={featureCount.toString()}
                color="#2563eb"
                bg="#eff6ff"
                trend={`avg ${avgReleaseSize}/release`}
              />
              <AnalyticCard
                icon={Bug}
                label="Bugs Squashed"
                value={fixCount.toString()}
                color="#f97316"
                bg="#fff7ed"
                trend="Stable & fast"
              />
              <AnalyticCard
                icon={Star}
                label="User Rating"
                value={avgScore.toFixed(1)}
                suffix="/5"
                color="#F4A535"
                bg="#fffbeb"
                trend="From 8k+ reviews"
              />
            </div>
          </section>

          {/* ── FILTERS ──────────────────────────────── */}
          <section className="mb-8">
            <ChangelogFilters />
          </section>

          {/* ── NO RESULTS BANNER ────────────────────── */}
          <div
            id="no-changes-found"
            style={{ display: 'none' }}
            className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"
          >
            <Filter className="mx-auto mb-2 text-amber-600" size={28} />
            <p className="font-bold text-amber-900">No matching changes</p>
            <p className="text-sm text-amber-800 mt-1">
              Try selecting a different filter category.
            </p>
          </div>

          {/* ── RELEASES TIMELINE ────────────────────── */}
          <section className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-[35px] top-3 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

            <div className="space-y-12">
              {RELEASES.map((release, idx) => (
                <ReleaseCard key={release.version} release={release} isLatest={idx === 0} />
              ))}
            </div>
          </section>

          {/* ── SUBSCRIBE CTA ─────────────────────────── */}
          <section className="my-16">
            <div className="rounded-[32px] bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white p-8 lg:p-10 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#32CD32]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F4A535]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider mb-3 backdrop-blur">
                  <Bell size={11} className="text-[#32CD32]" />
                  Stay in the loop
                </div>
                <h2 className="text-2xl sm:text-3xl font-black mb-2 leading-tight">
                  Get notified when we ship something new
                </h2>
                <p className="text-white/80 mb-6 leading-relaxed text-sm">
                  One monthly email rounding up everything we've shipped. No spam, no fluff.
                </p>
                <SubscribeForm />
              </div>
            </div>
          </section>

          {/* ── EXTERNAL LINKS ────────────────────────── */}
          <section className="mb-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a
              href="/rss/changelog.xml"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#126e3d] transition font-bold"
            >
              <Rss size={12} /> RSS Feed
            </a>
            <span className="text-gray-300">·</span>
            <a
              href="https://twitter.com/pikaplan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#126e3d] transition font-bold"
            >
              <FaTwitter size={12} /> Follow on Twitter
            </a>
            <span className="text-gray-300">·</span>
            <Link href="/blog" className="text-slate-500 hover:text-[#126e3d] transition font-bold">
              Read the Blog
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/press" className="text-slate-500 hover:text-[#126e3d] transition font-bold">
              Press Kit
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

// ── Release Card ──────────────────────────────────────────
function ReleaseCard({ release, isLatest }: { release: Release; isLatest: boolean }) {
  return (
    <article
      data-release
      id={`v${release.version}`}
      className="relative md:pl-20 scroll-mt-24"
    >
      {/* Timeline dot */}
      <div className="hidden md:flex absolute left-0 top-0 h-[70px] w-[70px] items-center justify-center">
        <div
          className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-md ring-4 ring-[#f8faf8] ${
            release.isMajor
              ? 'bg-gradient-to-br from-[#F4A535] to-[#f97316] text-white'
              : 'bg-white border-2 border-slate-200 text-[#126e3d]'
          }`}
        >
          {release.isMajor ? <Star size={20} className="fill-white" /> : <GitCommit size={20} />}
        </div>
      </div>

      {/* Card */}
      <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
        release.isMajor
          ? 'border-[#F4A535]/30 shadow-md shadow-orange-100/50'
          : 'border-gray-100'
      }`}>
        {/* Header */}
        <div className={`p-6 sm:p-8 border-b border-gray-100 ${
          release.isMajor ? 'bg-gradient-to-br from-orange-50 to-white' : ''
        }`}>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1 font-mono text-sm font-black text-[#126e3d] bg-emerald-50 px-2.5 py-1 rounded-lg">
              <Tag size={11} /> v{release.version}
            </span>
            {release.isMajor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#F4A535] to-[#f97316] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                <Star size={10} className="fill-white" /> Major Release
              </span>
            )}
            {release.isBeta && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                Beta
              </span>
            )}
            {isLatest && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={10} /> Latest
              </span>
            )}
            <span className="text-xs font-bold text-slate-400 ml-auto">
              {formatDate(release.date)} · {timeAgo(release.date)}
            </span>
          </div>

          <h2 className={`font-black text-slate-900 leading-tight ${
            release.isMajor ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
          }`}>
            {release.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{release.summary}</p>

          {release.heroChange && release.isMajor && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white border border-orange-200 p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#f97316]">
                <Sparkles size={14} />
              </div>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {release.heroChange}
              </p>
            </div>
          )}

          {/* Release Metrics */}
          {release.metrics && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {release.metrics.usersImpacted && (
                <MetricChip
                  icon={Users}
                  label="Users impacted"
                  value={release.metrics.usersImpacted.toLocaleString()}
                  color="#1A5C3A"
                />
              )}
              {release.metrics.adoptionRate !== undefined && (
                <MetricChip
                  icon={TrendingUp}
                  label="Adoption"
                  value={`${release.metrics.adoptionRate}%`}
                  color="#2563eb"
                />
              )}
              {release.metrics.feedbackScore && (
                <MetricChip
                  icon={Star}
                  label={`${release.metrics.feedbackCount ?? 0} reviews`}
                  value={`${release.metrics.feedbackScore}/5`}
                  color="#F4A535"
                />
              )}
              {release.metrics.performanceGain && (
                <MetricChip
                  icon={Rocket}
                  label="Performance"
                  value={release.metrics.performanceGain}
                  color="#7c3aed"
                />
              )}
              {release.metrics.bugsFixed && !release.metrics.performanceGain && (
                <MetricChip
                  icon={Bug}
                  label="Bugs fixed"
                  value={release.metrics.bugsFixed.toString()}
                  color="#f97316"
                />
              )}
            </div>
          )}
        </div>

        {/* Changes List */}
        <div className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
            What changed
          </p>
          <ul className="space-y-3">
            {release.changes.map((change, i) => {
              const meta = CHANGE_TYPE_META[change.type]
              const Icon = TYPE_ICONS[change.type]
              return (
                <li
                  key={i}
                  data-change-item
                  data-type={change.type}
                  className="flex items-start gap-3 group"
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl mt-0.5"
                    style={{ backgroundColor: meta.bg, color: meta.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                      <h3 className="font-bold text-slate-900 text-sm">{change.title}</h3>
                      {change.area && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          · {change.area}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{change.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </article>
  )
}

// ── Analytics Card ────────────────────────────────────────
function AnalyticCard({
  icon: Icon, label, value, suffix, color, bg, trend,
}: {
  icon: LucideIcon
  label: string
  value: string
  suffix?: string
  color: string
  bg: string
  trend?: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: bg, color }}
        >
          <Icon size={18} />
        </div>
        {trend && (
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-slate-900 leading-none">
        {value}
        {suffix && <span className="text-lg text-slate-400">{suffix}</span>}
      </p>
      <p className="text-xs text-slate-500 font-bold mt-1">{label}</p>
    </div>
  )
}

// ── Metric Chip ───────────────────────────────────────────
function MetricChip({
  icon: Icon, label, value, color,
}: {
  icon: LucideIcon
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={11} style={{ color }} />
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          {label}
        </p>
      </div>
      <p className="text-base font-black text-slate-900 leading-none">{value}</p>
    </div>
  )
}