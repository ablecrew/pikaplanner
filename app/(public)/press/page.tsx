import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Newspaper, Download, Mail, Phone, Calendar, ExternalLink,
  Award, Sparkles, Building2, Users, TrendingUp, Store, Globe,
  Image as ImageIcon, FileText, Package, Palette,
  Rocket, Trophy, Banknote, MapPin, ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { FaLinkedin, FaTwitter } from 'react-icons/fa';
import CopyButton from './CopyButton'
import {
  COMPANY, BOILERPLATE, FACTS, MILESTONES,
  MEDIA_COVERAGE, ASSETS, BRAND_COLORS, AWARDS, PRESS_CONTACT,
} from './_data/press'

export const metadata: Metadata = {
  title: 'Press Kit | Pika Plan',
  description:
    'Press kit for Pika Plan — company information, leadership bios, downloadable logos, brand guidelines, fact sheet, and media contact for journalists.',
  keywords: [
    'Pika Plan press kit',
    'Pika Plan media',
    'Kenya foodtech',
    'AI meal planning press',
    'Pika Plan logo download',
    'Pika Plan press contact',
  ],
  alternates: { canonical: '/press' },
  openGraph: {
    title: 'Press Kit | Pika Plan',
    description: 'Company info, brand assets, leadership bios, and press contact for journalists.',
    url: '/press',
    siteName: 'Pika Plan',
    type: 'website',
    locale: 'en_KE',
  },
}

// ── Icon Maps (string → component) ─────────────────────────
const FACT_ICONS: Record<typeof FACTS[number]['iconName'], LucideIcon> = {
  users: Users,
  'trending-up': TrendingUp,
  store: Store,
  globe: Globe,
  award: Award,
  sparkles: Sparkles,
}

const ASSET_ICONS: Record<typeof ASSETS[number]['iconName'], LucideIcon> = {
  image: ImageIcon,
  'file-text': FileText,
  package: Package,
  palette: Palette,
}

const MILESTONE_ICONS: Record<typeof MILESTONES[number]['type'], { icon: LucideIcon; color: string; bg: string }> = {
  launch: { icon: Rocket, color: '#1A5C3A', bg: '#f0fdf4' },
  funding: { icon: Banknote, color: '#7c3aed', bg: '#f5f3ff' },
  milestone: { icon: TrendingUp, color: '#2563eb', bg: '#eff6ff' },
  award: { icon: Trophy, color: '#F4A535', bg: '#fff7ed' },
  expansion: { icon: Globe, color: '#0891b2', bg: '#ecfeff' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function PressPage() {
  // JSON-LD for organization schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.name,
    alternateName: COMPANY.shortName,
    url: COMPANY.website,
    foundingDate: COMPANY.founded,
    description: BOILERPLATE.medium,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'media',
      email: PRESS_CONTACT.email,
      telephone: PRESS_CONTACT.phone,
    },
    //founder: FOUNDERS.map((f) => ({
      //'@type': 'Person',
      //name: f.name,
      //jobTitle: f.role,
    //})),
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
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#32CD32]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-[#F4A535]/10 rounded-full blur-3xl" />

          <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider mb-5 backdrop-blur">
              <Newspaper size={14} className="text-[#32CD32]" />
              Press Kit
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-3xl">
              Everything you need to write about Pika Plan.
            </h1>
            <p className="mt-4 text-lg text-white/80 max-w-2xl leading-relaxed">
              Company background, leadership bios, brand assets, fact sheet, and direct contact
              for journalists, partners, and content creators.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#downloads"
                className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-7 py-3.5 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
              >
                <Download size={16} />
                Download Brand Kit
              </a>
              <a
                href={`mailto:${PRESS_CONTACT.email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 backdrop-blur px-7 py-3.5 text-sm font-black uppercase text-white hover:bg-white/10 transition"
              >
                <Mail size={16} />
                Press Inquiries
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Building2 size={14} />
                <span>Founded <strong className="text-white">{COMPANY.founded}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{COMPANY.headquarters}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span><strong className="text-white">{COMPANY.employees}</strong> employees</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 space-y-20">
          {/* ── QUICK FACTS ───────────────────────────── */}
          <section>
            <SectionHeader
              eyebrow="By the Numbers"
              title="Pika Plan at a Glance"
              subtitle="Key metrics that tell our story."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {FACTS.map((fact) => {
                const Icon = FACT_ICONS[fact.iconName]
                return (
                  <div
                    key={fact.label}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#126e3d] mb-3">
                      <Icon size={18} />
                    </div>
                    <p className="text-2xl font-black text-slate-900">{fact.value}</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{fact.label}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{fact.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── BOILERPLATE / ABOUT ───────────────────── */}
          <section>
            <SectionHeader
              eyebrow="About Pika Plan"
              title="Company Description"
              subtitle="Use these official descriptions in your coverage."
            />

            <div className="space-y-4">
              <BoilerplateCard label="Short (1 sentence)" text={BOILERPLATE.short} />
              <BoilerplateCard label="Medium (paragraph)" text={BOILERPLATE.medium} />
              <BoilerplateCard label="Long (full description)" text={BOILERPLATE.long} />
            </div>
          </section>

          {/* ── COMPANY FACT SHEET ────────────────────── */}
          <section>
            <SectionHeader
              eyebrow="Fact Sheet"
              title="Company Details"
              subtitle="Quick reference for fact-checking and citations."
            />

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <FactRow label="Legal Name" value={COMPANY.name} copyable />
                <FactRow label="Trading Name" value={COMPANY.shortName} copyable />
                <FactRow label="Tagline" value={COMPANY.tagline} copyable />
                <FactRow label="Founded" value={COMPANY.founded} />
                <FactRow label="Headquarters" value={COMPANY.headquarters} />
                <FactRow label="Industry" value={COMPANY.industry} />
                <FactRow label="Employees" value={COMPANY.employees} />
                <FactRow label="Registration No." value={COMPANY.registrationNumber} copyable />
                <FactRow label="Website" value={COMPANY.website} link={COMPANY.website} copyable />
                <FactRow label="Press Contact" value={PRESS_CONTACT.email} link={`mailto:${PRESS_CONTACT.email}`} copyable />
              </dl>
            </div>
          </section>

          {/* ── LEADERSHIP ────────────────────────────── */}
          <section>
            <SectionHeader
              eyebrow="Leadership"
              title="Meet the Team"
              subtitle="Founders and key executives available for interviews and quotes."
            />

            {/*<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              //{FOUNDERS.map((founder) => (
                <FounderCard key={founder.name} founder={founder} />
              ))}
            </div>*/}
          </section>

          {/* ── MILESTONES TIMELINE ───────────────────── */}
          <section>
            <SectionHeader
              eyebrow="Our Story"
              title="Company Milestones"
              subtitle="The key moments that shaped Pika Plan."
            />

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 via-emerald-100 to-transparent" />

              <div className="space-y-4">
                {MILESTONES.map((m, i) => {
                  const meta = MILESTONE_ICONS[m.type]
                  const Icon = meta.icon
                  return (
                    <div key={i} className="relative pl-16">
                      {/* Dot */}
                      <div
                        className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full shadow-md ring-4 ring-[#f8faf8]"
                        style={{ backgroundColor: meta.color, color: 'white' }}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{ color: meta.color }}
                          >
                            {m.month ? `${m.month} ${m.year}` : m.year}
                          </span>
                          <span
                            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: meta.bg, color: meta.color }}
                          >
                            {m.type}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900">{m.title}</h3>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{m.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── DOWNLOADS ─────────────────────────────── */}
          <section id="downloads">
            <SectionHeader
              eyebrow="Brand Assets"
              title="Download Center"
              subtitle="Official logos, screenshots, brand guidelines, and team photos."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ASSETS.map((asset) => {
                const Icon = ASSET_ICONS[asset.iconName]
                return (
                  <a
                    key={asset.name}
                    href={asset.url}
                    download={asset.fileName}
                    className="group flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#126e3d] group-hover:scale-110 transition-transform">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900">{asset.name}</h3>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {asset.fileType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{asset.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-bold">{asset.fileSize}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-black text-[#126e3d] group-hover:translate-x-1 transition-transform">
                          <Download size={11} /> Download
                        </span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>

          {/* ── BRAND COLORS ──────────────────────────── */}
          <section>
            <SectionHeader
              eyebrow="Brand System"
              title="Official Color Palette"
              subtitle="Click any color value to copy."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BRAND_COLORS.map((color) => (
                <div
                  key={color.hex}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  <div className="h-24" style={{ backgroundColor: color.hex }} />
                  <div className="p-4">
                    <h3 className="font-black text-slate-900">{color.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">{color.usage}</p>
                    <div className="mt-3 space-y-1.5">
                      <ColorRow label="HEX" value={color.hex} />
                      <ColorRow label="RGB" value={color.rgb} />
                      {color.cmyk && <ColorRow label="CMYK" value={color.cmyk} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── AWARDS ────────────────────────────────── */}
          <section>
            <SectionHeader
              eyebrow="Recognition"
              title="Awards & Honours"
            />

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {AWARDS.map((award, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    i !== AWARDS.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#F4A535] flex-shrink-0">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-900 text-sm">{award.name}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{award.year}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── MEDIA COVERAGE ───────────────────────── */}
          <section>
            <SectionHeader
              eyebrow="In the News"
              title="Recent Media Coverage"
              subtitle="Selected press features."
            />

            <div className="space-y-3">
              {MEDIA_COVERAGE.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#126e3d]">
                      {article.outlet}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(article.date)}</p>
                  </div>
                  <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-[#126e3d] transition">
                    {article.headline}
                  </h3>
                  {article.excerpt && (
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">
                      "{article.excerpt}"
                    </p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#126e3d]">
                    Read article <ExternalLink size={11} />
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* ── PRESS CONTACT CTA ────────────────────── */}
          <section>
            <div className="rounded-[32px] bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white p-8 lg:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#32CD32]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#F4A535]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur">
                    <Mail size={14} className="text-[#32CD32]" />
                    Press & Media Inquiries
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3">
                    Have a story idea or interview request?
                  </h2>
                  <p className="text-white/80 leading-relaxed">
                    We'd love to hear from you. For all media inquiries, interview bookings,
                    speaker requests, or partnership opportunities, contact our press team directly.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#32CD32] mb-1">
                      Direct Contact
                    </p>
                    {/*<p className="font-black text-white">{PRESS_CONTACT.name}</p>
                    <p className="text-sm text-white/70">{PRESS_CONTACT.role}</p>*/}
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`mailto:${PRESS_CONTACT.email}`}
                      className="flex items-center gap-3 text-sm text-white hover:text-[#32CD32] transition"
                    >
                      <Mail size={14} />
                      {PRESS_CONTACT.email}
                    </a>
                    <a
                      href={`tel:${PRESS_CONTACT.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 text-sm text-white hover:text-[#32CD32] transition"
                    >
                      <Phone size={14} />
                      {PRESS_CONTACT.phone}
                    </a>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-white/60 flex items-center gap-1.5">
                      <Calendar size={11} />
                      {PRESS_CONTACT.responseTime}
                    </p>
                  </div>

                  <a
                    href={`mailto:${PRESS_CONTACT.email}`}
                    className="block bg-[#f97316] hover:bg-[#ea580c] text-white text-center rounded-xl py-3 text-sm font-black uppercase transition"
                  >
                    Email Press Team
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── RELATED LINKS ────────────────────────── */}
          <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/about" className="hover:text-[#126e3d] transition">About Pika Plan</Link>
            <span className="text-gray-300">·</span>
            <Link href="/careers" className="hover:text-[#126e3d] transition">Careers</Link>
            <span className="text-gray-300">·</span>
            <Link href="/blog" className="hover:text-[#126e3d] transition">Blog</Link>
            <span className="text-gray-300">·</span>
            <Link href="/help" className="hover:text-[#126e3d] transition">Help Center</Link>
            <span className="text-gray-300">·</span>
            <Link href="/privacy" className="hover:text-[#126e3d] transition">Privacy Policy</Link>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

// ── Reusable Components ────────────────────────────────────
function SectionHeader({
  eyebrow, title, subtitle,
}: {
  eyebrow: string; title: string; subtitle?: string
}) {
  return (
    <div className="mb-8">
      <p className="text-xs font-black uppercase tracking-widest text-[#126e3d] mb-2">
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{title}</h2>
      {subtitle && <p className="mt-2 text-base text-slate-600">{subtitle}</p>}
    </div>
  )
}

function BoilerplateCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#126e3d]">
          {label}
        </p>
        <CopyButton value={text} />
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
    </div>
  )
}

function FactRow({
  label, value, copyable, link,
}: {
  label: string; value: string; copyable?: boolean; link?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="flex-1 min-w-0">
        <dt className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">
          {label}
        </dt>
        <dd className="text-sm font-bold text-slate-900 break-words">
          {link ? (
            <a href={link} className="text-[#126e3d] hover:underline" target="_blank" rel="noopener noreferrer">
              {value}
            </a>
          ) : (
            value
          )}
        </dd>
      </div>
      {copyable && <CopyButton value={value} className="flex-shrink-0 mt-5 inline-flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-[#126e3d] transition" />}
    </div>
  )
}

function FounderCard({ founder }: { founder: import('./_data/press').Founder }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 hover:shadow-md transition">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] text-white text-2xl font-black flex-shrink-0">
          {founder.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <h3 className="font-black text-slate-900 text-lg">{founder.name}</h3>
          <p className="text-sm text-[#126e3d] font-bold">{founder.role}</p>
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{founder.bio}</p>

      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
        {founder.email && (
          <a
            href={`mailto:${founder.email}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#126e3d] transition"
          >
            <Mail size={12} /> Email
          </a>
        )}
        {founder.linkedinUrl && (
          <a
            href={founder.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0a66c2] transition"
          >
            <FaLinkedin size={12} /> LinkedIn
          </a>
        )}
        {founder.twitterUrl && (
          <a
            href={founder.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1da1f2] transition"
          >
            <FaTwitter size={12} /> Twitter
          </a>
        )}
        <span className="ml-auto">
          <CopyButton value={founder.shortBio} label="Copy bio" />
        </span>
      </div>
    </div>
  )
}

function ColorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-400 font-black uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <code className="font-mono text-slate-700 font-bold">{value}</code>
        <CopyButton value={value} className="text-slate-400 hover:text-[#126e3d] transition" />
      </div>
    </div>
  )
}