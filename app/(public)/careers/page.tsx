import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Briefcase, MapPin, Clock, ArrowRight, Sparkles, Heart,
  Star, TrendingUp, Users, Zap, Globe, Award, Coffee,
  Calendar, ChevronRight, Mail, Search,
} from 'lucide-react'
import CareersFilters from './CareersFilters'
import { fetchPublishedCareers, type Career } from './actions'

export const metadata: Metadata = {
  title: 'Careers | Pika Plan',
  description:
    'Join the Pika Plan team. Browse open roles in engineering, product, design, operations, and more. Build the future of food in Kenya.',
  keywords: [
    'Pika Plan careers',
    'jobs Kenya',
    'tech jobs Nairobi',
    'food tech jobs',
    'remote jobs Kenya',
  ],
  alternates: { canonical: '/careers' },
  openGraph: {
    title: 'Careers at Pika Plan',
    description: 'Join the team building the future of meal planning in Kenya.',
    url: '/careers',
    siteName: 'Pika Plan',
    type: 'website',
    locale: 'en_KE',
  },
}

// ── Company Values ────────────────────────────────────────
const VALUES = [
  { icon: Heart, title: 'Mission-Driven', description: 'We exist to help every Kenyan family eat better.', color: '#dc2626' },
  { icon: Zap, title: 'Move Fast', description: 'Ship fast, learn faster. We value bold action over perfect plans.', color: '#f97316' },
  { icon: Users, title: 'Team First', description: 'We win together, learn together, and celebrate together.', color: '#2563eb' },
  { icon: TrendingUp, title: 'Always Growing', description: 'Continuous learning, regular feedback, real career growth.', color: '#16a34a' },
]

// ── Benefits ──────────────────────────────────────────────
const BENEFITS = [
  { icon: Heart, title: 'Comprehensive Health Cover', description: 'Inpatient & outpatient cover for you and dependants.', color: '#dc2626' },
  { icon: Coffee, title: 'Flexible Work', description: 'Hybrid by default. Remote-friendly for the right roles.', color: '#f97316' },
  { icon: Calendar, title: '25 Days Leave', description: 'Plus public holidays and a paid birthday off.', color: '#1A5C3A' },
  { icon: Award, title: 'Equity Options', description: 'Share in our success. Every full-time hire gets equity.', color: '#7c3aed' },
  { icon: TrendingUp, title: 'Learning Budget', description: 'KES 50,000/year for books, courses, and conferences.', color: '#2563eb' },
  { icon: Globe, title: 'Quarterly Offsites', description: 'Team retreats in Naivasha, Mombasa, and beyond.', color: '#0891b2' },
]

export default async function CareersPage() {
  const careers = await fetchPublishedCareers()
  const featured = careers.filter((c) => c.is_featured)
  const departments = Array.from(new Set(careers.map((c) => c.department))).sort()

  // JSON-LD for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Open Positions at Pika Plan',
    itemListElement: careers.map((c, i) => ({
      '@type': 'JobPosting',
      position: i + 1,
      title: c.title,
      description: c.short_description,
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Pika Plan',
        sameAs: 'https://pikaplanner.vercel.app',
      },
      datePosted: c.published_at ?? c.created_at,
      employmentType: c.work_type.toUpperCase().replace('-', '_'),
      jobLocation: {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: c.location },
      },
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
        {/* ── HERO ───────────────────────────────────────── */}
        <section className="relative bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2332CD32' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#32CD32]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-[#F4A535]/10 rounded-full blur-3xl" />

          <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 lg:py-24">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider mb-5 backdrop-blur">
              <Briefcase size={14} className="text-[#32CD32]" />
              Open Positions
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-3xl">
              Build the future of food in Kenya.
            </h1>
            <p className="mt-4 text-lg text-white/80 max-w-2xl leading-relaxed">
              We're hiring talented people who care deeply about helping every Kenyan family
              eat better. If that sounds like you, we'd love to meet you.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Briefcase size={14} />
                <span>
                  <strong className="text-white">{careers.length}</strong> open {careers.length === 1 ? 'role' : 'roles'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>Nairobi & Remote</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#32CD32]" />
                <span>Growing fast</span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#open-positions"
                className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-7 py-3.5 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
              >
                <Briefcase size={16} />
                Browse Open Roles
              </a>
              <a
                href="#values"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 backdrop-blur px-7 py-3.5 text-sm font-black uppercase text-white hover:bg-white/10 transition"
              >
                Learn More About Us
              </a>
            </div>
          </div>
        </section>

        {/* ── COMPANY VALUES ─────────────────────────────── */}
        <section id="values" className="py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-widest text-[#126e3d] mb-2">
                What We Believe
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Our Values</h2>
              <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
                These aren't just words on a wall — they shape how we hire, build, and treat each other.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VALUES.map((v) => {
                const Icon = v.icon
                return (
                  <div
                    key={v.title}
                    className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl mb-4 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${v.color}18`, color: v.color }}
                    >
                      <Icon size={22} />
                    </div>
                    <h3 className="font-black text-slate-900 mb-2">{v.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{v.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── BENEFITS ──────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-black uppercase tracking-widest text-[#126e3d] mb-2">
                The Perks
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                Why You'll Love Working Here
              </h2>
              <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
                Competitive compensation, real growth, and benefits that actually matter.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BENEFITS.map((b) => {
                const Icon = b.icon
                return (
                  <div
                    key={b.title}
                    className="flex items-start gap-4 bg-[#f8faf8] rounded-2xl p-5 border border-gray-100 hover:border-emerald-200 transition"
                  >
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${b.color}18`, color: b.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">{b.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{b.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── OPEN POSITIONS ────────────────────────────── */}
        <section id="open-positions" className="py-16 lg:py-20 bg-[#f8faf8]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-xs font-black uppercase tracking-widest text-[#126e3d] mb-2">
                Open Positions
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                <span id="careers-count">{careers.length}</span> open {careers.length === 1 ? 'role' : 'roles'}
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Find your next challenge below — or refine using the filters.
              </p>
            </div>

            {/* Featured Roles */}
            {featured.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={14} className="text-[#f97316] fill-[#f97316]" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#f97316]">
                    Featured Roles
                  </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {featured.map((career) => (
                    <FeaturedCareerCard key={career.id} career={career} />
                  ))}
                </div>
              </section>
            )}

            {/* Filters + Results Grid */}
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Sidebar Filters (Desktop) */}
              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <CareersFilters departments={departments} />
                </div>
              </aside>

              {/* Listings */}
              <div className="lg:col-span-3">
                {careers.length === 0 ? (
                  <NoOpenRoles />
                ) : (
                  <div className="space-y-3">
                    {careers.map((career) => (
                      <CareerCard key={career.id} career={career} />
                    ))}

                    {/* No results banner */}
                    <div
                      id="no-careers-results"
                      style={{ display: 'none' }}
                      className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center"
                    >
                      <Search className="mx-auto mb-2 text-amber-600" size={28} />
                      <p className="font-black text-amber-900">No matching positions</p>
                      <p className="text-sm text-amber-800 mt-1">
                        Try adjusting your filters or clearing the search.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── DON'T SEE A FIT CTA ───────────────────────── */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[32px] bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white p-8 lg:p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#32CD32]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#F4A535]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur">
                  <Heart size={14} className="text-[#32CD32]" />
                  We're Always Looking for Talent
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 leading-tight">
                  Don't see your perfect role?
                </h2>
                <p className="text-white/80 mb-6 leading-relaxed max-w-xl mx-auto">
                  We're growing fast and always interested in meeting talented people.
                  Send us your CV and tell us what you'd love to build.
                </p>
                <a
                  href="mailto:careers@pikaplan.com"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-7 py-3.5 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition"
                >
                  <Mail size={16} />
                  Send Us Your CV
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

// ── Featured Career Card ────────────────────────────────────
function FeaturedCareerCard({ career }: { career: Career }) {
  return (
    <Link
      href={`/careers/${career.slug}`}
      data-career
      data-search={`${career.title} ${career.department} ${career.location} ${(career.skills ?? []).join(' ')}`}
      data-department={career.department}
      data-work-type={career.work_type}
      data-work-mode={career.work_mode}
      data-experience={career.experience_level}
      className="group block bg-gradient-to-br from-white to-orange-50/30 border-2 border-orange-200/60 rounded-3xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 inline-flex items-center gap-1.5 bg-[#f97316] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-bl-2xl shadow-md">
        <Star size={11} className="fill-white" /> Featured
      </div>

      <div className="mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316] mb-1">
          {career.department}
        </p>
        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-[#126e3d] transition-colors">
          {career.title}
        </h3>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
        {career.short_description}
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Pill icon={MapPin} text={career.location} />
        <Pill text={career.work_type.replace('-', ' ')} className="capitalize" />
        <Pill text={career.work_mode} className="capitalize" />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-orange-100">
        <p className="text-xs text-slate-500">
          {career.experience_level === 'lead' ? 'Lead / Principal' : `${career.experience_level}-level`}
        </p>
        <p className="inline-flex items-center gap-1 text-sm font-black text-[#f97316]">
          View role <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </p>
      </div>
    </Link>
  )
}

// ── Regular Career Card ─────────────────────────────────────
function CareerCard({ career }: { career: Career }) {
  return (
    <Link
      href={`/careers/${career.slug}`}
      data-career
      data-search={`${career.title} ${career.department} ${career.location} ${(career.skills ?? []).join(' ')}`}
      data-department={career.department}
      data-work-type={career.work_type}
      data-work-mode={career.work_mode}
      data-experience={career.experience_level}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#126e3d]">
              {career.department}
            </span>
            {career.is_featured && (
              <Star size={10} className="text-[#f97316] fill-[#f97316]" />
            )}
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#126e3d] transition-colors">
            {career.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600 line-clamp-1">
            {career.short_description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill icon={MapPin} text={career.location} />
            <Pill text={career.work_type.replace('-', ' ')} className="capitalize" />
            <Pill text={career.work_mode} className="capitalize" />
            <Pill text={`${career.experience_level}-level`} className="capitalize" />
          </div>
        </div>

        <ChevronRight
          size={20}
          className="flex-shrink-0 text-slate-300 group-hover:text-[#126e3d] group-hover:translate-x-1 transition-all mt-1"
        />
      </div>
    </Link>
  )
}

// ── Reusable Pill ───────────────────────────────────────────
function Pill({
  icon: Icon, text, className = '',
}: {
  icon?: typeof MapPin
  text: string
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 ${className}`}>
      {Icon && <Icon size={11} />}
      {text}
    </span>
  )
}

// ── Empty State ─────────────────────────────────────────────
function NoOpenRoles() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
        <Briefcase size={28} className="text-[#126e3d]" />
      </div>
      <h3 className="text-lg font-black text-slate-900">No open positions right now</h3>
      <p className="mt-2 max-w-md mx-auto text-sm text-slate-500 leading-relaxed">
        We don't have any open roles at the moment, but we're always growing.
        Drop us a note and we'll keep you in mind for future opportunities.
      </p>
      <a
        href="mailto:careers@pikaplan.com"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-3 text-sm font-black uppercase text-white shadow-lg transition hover:shadow-xl"
      >
        <Mail size={16} /> Send Us Your CV
      </a>
    </div>
  )
}