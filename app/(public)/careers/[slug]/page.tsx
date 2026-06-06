import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  ArrowLeft, MapPin, Briefcase, Clock, DollarSign, Star,
  CheckCircle2, Sparkles, Mail, ExternalLink, Calendar,
  Award, Users, Share2, Globe, ArrowRight, ChevronRight,
  Heart, Zap,
} from 'lucide-react'
import { fetchCareerBySlug, fetchRelatedCareers, type Career } from '../actions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const career = await fetchCareerBySlug(slug)

  if (!career) return { title: 'Position Not Found | Pika Plan' }

  return {
    title: `${career.title} | Pika Plan Careers`,
    description: career.short_description,
    alternates: { canonical: `/careers/${career.slug}` },
    openGraph: {
      title: `${career.title} at Pika Plan`,
      description: career.short_description,
      url: `/careers/${career.slug}`,
      siteName: 'Pika Plan',
      type: 'article',
      locale: 'en_KE',
    },
  }
}

function formatSalary(career: Career) {
  if (!career.salary_min && !career.salary_max) return null
  const currency = career.currency ?? 'KES'
  if (career.salary_min && career.salary_max) {
    return `${currency} ${career.salary_min.toLocaleString()} – ${career.salary_max.toLocaleString()} / month`
  }
  if (career.salary_min) return `From ${currency} ${career.salary_min.toLocaleString()}`
  return `Up to ${currency} ${career.salary_max!.toLocaleString()}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const career = await fetchCareerBySlug(slug)

  if (!career) notFound()

  const related = await fetchRelatedCareers(career.slug, career.department, 3)
  const salary = formatSalary(career)

  const applyUrl = career.application_url ||
    (career.application_email ? `mailto:${career.application_email}?subject=Application: ${career.title}` : '#')

  // JSON-LD JobPosting schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: career.title,
    description: career.description,
    datePosted: career.published_at ?? career.created_at,
    validThrough: career.application_deadline,
    employmentType: career.work_type.toUpperCase().replace('-', '_'),
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Pika Plan',
      sameAs: 'https://pikaplanner.vercel.app',
    },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: career.location, addressCountry: 'KE' },
    },
    ...(career.salary_min && career.salary_max && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: career.currency ?? 'KES',
        value: {
          '@type': 'QuantitativeValue',
          minValue: career.salary_min,
          maxValue: career.salary_max,
          unitText: 'MONTH',
        },
      },
    }),
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
        <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition mb-6"
            >
              <ArrowLeft size={14} /> Back to all careers
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] font-black uppercase tracking-wider">
                {career.department}
              </span>
              {career.is_featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f97316] text-white text-[10px] font-black uppercase tracking-wider">
                  <Star size={11} className="fill-white" /> Featured Role
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {career.title}
            </h1>

            <p className="mt-4 text-lg text-white/80 max-w-2xl leading-relaxed">
              {career.short_description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#32CD32]" />
                <span><strong className="text-white">Location:</strong> {career.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-[#32CD32]" />
                <span className="capitalize">
                  <strong className="text-white">Type:</strong> {career.work_type.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-[#32CD32]" />
                <span className="capitalize">
                  <strong className="text-white">Mode:</strong> {career.work_mode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={14} className="text-[#32CD32]" />
                <span className="capitalize">
                  <strong className="text-white">Level:</strong> {career.experience_level}
                </span>
              </div>
              {salary && (
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-[#32CD32]" />
                  <span><strong className="text-white">Salary:</strong> {salary}</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={applyUrl}
                target={career.application_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-8 py-4 text-base font-black uppercase text-white shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
              >
                <Briefcase size={16} />
                Apply for This Role
                <ArrowRight size={16} />
              </a>
              <ShareButton title={career.title} />
            </div>

            {career.application_deadline && (
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-white/70">
                <Calendar size={12} />
                Application deadline: <strong className="text-white">{formatDate(career.application_deadline)}</strong>
              </p>
            )}
          </div>
        </section>

        {/* ── MAIN CONTENT ──────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Description */}
            <article className="lg:col-span-2 space-y-8">
              {/* About the Role */}
              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#126e3d]" /> About the Role
                </h2>
                <div className="prose prose-slate max-w-none">
                  {career.description.split('\n\n').map((para, i) => (
                    <p key={i} className="text-base text-slate-700 leading-relaxed mb-4">{para}</p>
                  ))}
                </div>
              </section>

              {/* Responsibilities */}
              {career.responsibilities.length > 0 && (
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-[#f97316]" /> What You'll Do
                  </h2>
                  <ul className="space-y-3">
                    {career.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-[#126e3d] flex-shrink-0 mt-0.5" />
                        <span className="text-base text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requirements */}
              {career.requirements.length > 0 && (
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Award size={18} className="text-[#7c3aed]" /> What We're Looking For
                  </h2>
                  <ul className="space-y-3">
                    {career.requirements.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-[#7c3aed] text-xs font-black flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-base text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Benefits */}
              {career.benefits.length > 0 && (
                <section className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 p-6 sm:p-8">
                  <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Heart size={18} className="text-[#dc2626]" /> What We Offer
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {career.benefits.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 bg-white border border-emerald-100 rounded-xl p-3"
                      >
                        <CheckCircle2 size={16} className="text-[#16a34a] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Skills */}
              {career.skills.length > 0 && (
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-[#2563eb]" /> Skills & Technologies
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {career.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Apply CTA */}
              <section className="rounded-3xl bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white p-8 lg:p-10 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#32CD32]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-black mb-3">
                    Ready to apply?
                  </h2>
                  <p className="text-white/80 mb-6 leading-relaxed max-w-md mx-auto">
                    Send us your application and we'll get back to you within 5 business days.
                  </p>
                  <a
                    href={applyUrl}
                    target={career.application_url ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-8 py-4 text-base font-black uppercase text-white shadow-lg hover:shadow-xl transition"
                  >
                    {career.application_email && !career.application_url ? <Mail size={16} /> : <Briefcase size={16} />}
                    Apply Now
                    {career.application_url && <ExternalLink size={14} />}
                  </a>

                  <p className="mt-4 text-xs text-white/60">
                    Or email us directly:{' '}
                    <a href={`mailto:${career.application_email ?? 'careers@pikaplan.com'}`} className="underline">
                      {career.application_email ?? 'careers@pikaplan.com'}
                    </a>
                  </p>
                </div>
              </section>
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-4">
                {/* Job Summary Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                    Position Summary
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-bold text-slate-500 mb-0.5">Department</dt>
                      <dd className="text-slate-900 font-bold">{career.department}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-slate-500 mb-0.5">Location</dt>
                      <dd className="text-slate-900 font-bold">{career.location}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-slate-500 mb-0.5">Work Type</dt>
                      <dd className="text-slate-900 font-bold capitalize">{career.work_type.replace('-', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-slate-500 mb-0.5">Work Mode</dt>
                      <dd className="text-slate-900 font-bold capitalize">{career.work_mode}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-slate-500 mb-0.5">Experience Level</dt>
                      <dd className="text-slate-900 font-bold capitalize">{career.experience_level}</dd>
                    </div>
                    {salary && (
                      <div>
                        <dt className="text-xs font-bold text-slate-500 mb-0.5">Salary</dt>
                        <dd className="text-slate-900 font-bold">{salary}</dd>
                      </div>
                    )}
                    {career.application_deadline && (
                      <div className="pt-3 border-t border-gray-100">
                        <dt className="text-xs font-bold text-slate-500 mb-0.5">Apply by</dt>
                        <dd className="text-[#dc2626] font-bold flex items-center gap-1.5">
                          <Calendar size={12} />
                          {formatDate(career.application_deadline)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Quick Apply */}
                <a
                  href={applyUrl}
                  target={career.application_url ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="block bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white text-center rounded-2xl p-4 font-black uppercase text-sm shadow-lg hover:shadow-xl transition hover:-translate-y-0.5"
                >
                  <Briefcase size={16} className="inline mr-2" />
                  Apply Now
                </a>

                {/* About Pika Plan mini */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-[#126e3d] mb-2">
                    About Pika Plan
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We're building the future of meal planning in Kenya — combining AI, a curated
                    vendor network, and smart logistics to help every family eat better.
                  </p>
                  <Link
                    href="/about"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#126e3d] hover:underline"
                  >
                    Learn more about us <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          {/* Related Roles */}
          {related.length > 0 && (
            <section className="mt-16">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#126e3d] mb-1">
                    Also Hiring
                  </p>
                  <h2 className="text-xl font-black text-slate-900">
                    Other {career.department} Roles
                  </h2>
                </div>
                <Link
                  href="/careers"
                  className="text-xs font-bold text-[#126e3d] hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/careers/${r.slug}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-md transition"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#126e3d] mb-1">
                      {r.department}
                    </p>
                    <h4 className="font-black text-slate-900 leading-tight group-hover:text-[#126e3d] transition">
                      {r.title}
                    </h4>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{r.short_description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={11} />
                      <span>{r.location}</span>
                      <span className="ml-auto inline-flex items-center text-[#126e3d] font-bold">
                        View <ChevronRight size={11} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

// ── Share Button (Server-rendered with mailto fallback) ─────
function ShareButton({ title }: { title: string }) {
  return (
    <a
      href={`mailto:?subject=${encodeURIComponent(`Job opportunity: ${title}`)}&body=${encodeURIComponent(`I thought you might be interested in this role at Pika Plan: `)}`}
      className="inline-flex items-center gap-2 rounded-xl border border-white/30 backdrop-blur px-7 py-4 text-base font-black uppercase text-white hover:bg-white/10 transition"
    >
      <Share2 size={16} /> Share
    </a>
  )
}