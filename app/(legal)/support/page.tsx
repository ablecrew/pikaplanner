import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  LifeBuoy, Mail, Phone, MessageCircle, Clock, ChevronRight,
  User, ChefHat, CreditCard, Truck, Store, Settings, Lock, Sparkles,
  BookOpen, PlayCircle, AlertCircle, CheckCircle2, ExternalLink,
  Search, HelpCircle, Shield, Zap, FileText, Activity,
} from 'lucide-react'
import HelpSearch from './HelpSearch'

// ── Constants ─────────────────────────────────────────────
const SUPPORT_EMAIL = 'support@pikaplan.com'
const SUPPORT_PHONE = '+254 797 846 624'
const WHATSAPP_URL = 'https://wa.me/254797846624'
const STATUS_URL = 'https://status.pikaplan.com'
const SITE_URL = 'https://pikaplanner.vercel.app'

// ── SEO Metadata ──────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Help & Support | Pika Plan',
  description:
    'Get help with your Pika Plan account, meal plans, orders, payments, and more. Browse FAQs, contact support, or chat with our team — we are here to help.',
  keywords: [
    'Pika Plan help',
    'meal planning support',
    'food delivery help',
    'customer support Kenya',
    'M-Pesa payment help',
    'vendor support',
  ],
  alternates: { canonical: '/support' },
  openGraph: {
    title: 'Help & Support | Pika Plan',
    description: 'Browse FAQs, contact support, and get help with everything Pika Plan.',
    url: '/support',
    siteName: 'Pika Plan',
    type: 'website',
    locale: 'en_KE',
  },
}

// ── Content Data (Server-Rendered = Fast) ─────────────────
const QUICK_CATEGORIES = [
  {
    id: 'account',
    title: 'Account & Profile',
    description: 'Sign up, login, password reset, account settings',
    icon: User,
    color: '#1A5C3A',
    bg: '#f0fdf4',
    articles: 12,
  },
  {
    id: 'meal-plans',
    title: 'Meal Plans & AI',
    description: 'Generate plans, dietary preferences, customisation',
    icon: ChefHat,
    color: '#f97316',
    bg: '#fff7ed',
    articles: 18,
  },
  {
    id: 'orders',
    title: 'Orders & Delivery',
    description: 'Placing orders, tracking, cancellations, refunds',
    icon: Truck,
    color: '#2563eb',
    bg: '#eff6ff',
    articles: 15,
  },
  {
    id: 'payments',
    title: 'Payments & Billing',
    description: 'M-Pesa, cards, subscriptions, invoices',
    icon: CreditCard,
    color: '#7c3aed',
    bg: '#f5f3ff',
    articles: 10,
  },
  {
    id: 'vendors',
    title: 'Vendors & Partners',
    description: 'Becoming a vendor, listings, payouts',
    icon: Store,
    color: '#dc2626',
    bg: '#fef2f2',
    articles: 14,
  },
  {
    id: 'technical',
    title: 'Technical Issues',
    description: 'App errors, browser compatibility, performance',
    icon: Settings,
    color: '#475569',
    bg: '#f1f5f9',
    articles: 8,
  },
]

const POPULAR_FAQS = [
  {
    category: 'account',
    q: 'How do I create a Pika Plan account?',
    a: 'Click "Sign Up" at the top of any page, enter your email and phone number, choose a password, and verify your email via the link we send. The whole process takes under a minute.',
  },
  {
    category: 'account',
    q: 'I forgot my password — how do I reset it?',
    a: 'On the login page, click "Forgot Password" and enter your registered email. We will send a secure reset link valid for one hour. If you do not see the email, check your spam folder.',
  },
  {
    category: 'account',
    q: 'How do I delete my account?',
    a: 'Go to Settings → Account → Delete Account. We will keep your data for 30 days in case you change your mind, then permanently delete it in compliance with the Kenya Data Protection Act, 2019.',
  },
  {
    category: 'meal-plans',
    q: 'How does AI meal planning work?',
    a: 'Our AI analyses your dietary preferences, cuisine tastes, budget, and household size to generate a personalised 7-day meal plan. You can regenerate any time for fresh variety or manually adjust meals after generation.',
  },
  {
    category: 'meal-plans',
    q: 'Can I customise my meal plan after it is generated?',
    a: 'Yes! Click any meal in your plan to swap it for an alternative, mark it as cooked, add notes, or remove it entirely. Changes are saved automatically.',
  },
  {
    category: 'meal-plans',
    q: 'What if a meal does not match my dietary restrictions?',
    a: 'We respect all dietary tags you have set in your profile (vegetarian, halal, gluten-free, etc.). If a meal slips through, please report it via the meal card → "Report Issue" so we can improve our AI.',
  },
  {
    category: 'orders',
    q: 'How long does delivery take?',
    a: 'Most vendors fulfill orders within 30–60 minutes during business hours. Each meal listing shows the vendor\'s estimated prep time. You will receive real-time updates via SMS and in-app notifications.',
  },
  {
    category: 'orders',
    q: 'Can I cancel my order?',
    a: 'Orders can be cancelled within 5 minutes of placement with no fee. After 5 minutes, the vendor may have already started preparing — cancellation may incur a small charge depending on the vendor\'s policy.',
  },
  {
    category: 'orders',
    q: 'What if my order arrives damaged or incorrect?',
    a: 'Go to Orders → [Your Order] → "Report Issue" within 24 hours. Upload a photo and describe the problem. We typically resolve issues within 1 business day with a refund or replacement.',
  },
  {
    category: 'payments',
    q: 'What payment methods do you accept?',
    a: 'We accept M-Pesa (most popular), Visa, Mastercard, and bank transfers via Payhero. All payments are encrypted end-to-end and we never store your full card details.',
  },
  {
    category: 'payments',
    q: 'How do refunds work?',
    a: 'Refunds are processed within 3–5 business days back to your original payment method. M-Pesa refunds usually arrive same-day. You will receive an email confirmation when the refund is issued.',
  },
  {
    category: 'payments',
    q: 'Is my payment information secure?',
    a: 'Absolutely. We use bank-grade AES-256 encryption, tokenised payment processing via M-Pesa and Payhero, and we are compliant with PCI-DSS standards. We never see or store your raw card numbers.',
  },
  {
    category: 'vendors',
    q: 'How do I become a vendor on Pika Plan?',
    a: 'Visit our Vendor Signup page, complete the application (takes about 5 minutes), upload your business license and food safety certificate, and our team will review within 1–3 business days.',
  },
  {
    category: 'vendors',
    q: 'When do vendors get paid?',
    a: 'Vendor payouts are processed weekly every Monday via M-Pesa or bank transfer. You can track your earnings and pending payouts in real-time from the Vendor Dashboard.',
  },
  {
    category: 'technical',
    q: 'The app is loading slowly — what can I do?',
    a: 'Try: (1) clearing your browser cache, (2) updating to the latest browser version, (3) checking your internet connection, (4) disabling browser extensions. If the issue persists, please contact support with your device and browser details.',
  },
  {
    category: 'technical',
    q: 'Which browsers and devices do you support?',
    a: 'Pika Plan works on the latest 2 versions of Chrome, Safari, Firefox, and Edge. On mobile, we support iOS 14+ and Android 10+. We test extensively on common Kenyan-market devices.',
  },
]

const CONTACT_CHANNELS = [
  {
    icon: FileText,
    title: 'Submit a Ticket',
    description: 'Detailed form with file attachments — best for complex issues',
    cta: 'Open contact form',
    href: '/support/contact',
    color: '#7c3aed',
    bg: '#f5f3ff',
    badge: 'With attachments',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Chat',
    description: 'Fastest way to reach us — typical reply under 30 mins',
    cta: 'Chat on WhatsApp',
    href: WHATSAPP_URL,
    color: '#16a34a',
    bg: '#f0fdf4',
    badge: 'Fastest',
    external: true,
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'For detailed enquiries — we respond within 24 hours',
    cta: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    color: '#1A5C3A',
    bg: '#f0fdf4',
    badge: '24h response',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly to our team during business hours',
    cta: SUPPORT_PHONE,
    href: `tel:${SUPPORT_PHONE.replace(/\s/g, '')}`,
    color: '#f97316',
    bg: '#fff7ed',
    badge: 'Mon–Sat, 8am–8pm',
  },
]

const SELF_SERVICE = [
  { icon: Lock, title: 'Reset Password', href: '/forgot-password', description: 'Get back into your account' },
  { icon: User, title: 'Update Profile', href: '/profile', description: 'Change your details, dietary preferences' },
  { icon: CreditCard, title: 'Manage Subscription', href: '/billing', description: 'View plan, update payment, cancel' },
  { icon: Truck, title: 'Track an Order', href: '/orders', description: 'See real-time order status' },
  { icon: Shield, title: 'Privacy Settings', href: '/settings/privacy', description: 'Control your data & cookies' },
  { icon: Activity, title: 'System Status', href: STATUS_URL, description: 'Check if everything is running', external: true },
]

const RESOURCES = [
  { icon: BookOpen, title: 'User Guide', description: 'Complete getting-started handbook', href: '/guide' },
  { icon: PlayCircle, title: 'Video Tutorials', description: 'Watch how to use Pika Plan features', href: '/tutorials' },
  { icon: FileText, title: 'Vendor Handbook', description: 'Best practices for selling on Pika Plan', href: '/vendor-guide' },
  { icon: Sparkles, title: 'What\'s New', description: 'Latest features and updates', href: '/changelog' },
]

// ── JSON-LD for Rich Search Results ───────────────────────
function generateJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: POPULAR_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}

// ── Page Component ────────────────────────────────────────
export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJsonLd()) }}
      />

      <Navbar />

      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        {/* ── HERO with Search ──────────────────────────── */}
        <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur">
              <LifeBuoy size={14} className="text-[#32CD32]" />
              Help Center
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
              How can we help you?
            </h1>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Search our knowledge base or browse common topics below. Need a human? We are one click away.
            </p>

            <div className="mt-8 max-w-2xl mx-auto">
              <HelpSearch />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Avg. response: <strong className="text-white">under 1 hour</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#32CD32]" />
                <span><strong className="text-white">98%</strong> issue resolution</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[#F4A535]" />
                <span><strong className="text-white">24/7</strong> WhatsApp chat</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          {/* No Results Banner */}
          <div
            id="no-results-banner"
            style={{ display: 'none' }}
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center"
          >
            <HelpCircle className="mx-auto mb-2 text-amber-600" size={28} />
            <p className="font-bold text-amber-900">No matching articles found</p>
            <p className="text-sm text-amber-800 mt-1">
              Try a different search, browse the categories below, or{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline font-semibold">
                contact support
              </a>
              .
            </p>
          </div>

          {/* ── QUICK CATEGORIES ─────────────────────────── */}
          <section data-section className="mb-12">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
              <h2 className="text-2xl font-black text-slate-900 mb-1">Browse by category</h2>
              <p className="text-sm text-gray-500 mb-6">Pick a topic to find relevant articles fast.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {QUICK_CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <a
                      key={cat.id}
                      href={`#${cat.id}`}
                      data-search={`${cat.title} ${cat.description}`}
                      className="group flex items-start gap-4 rounded-2xl border border-gray-100 p-5 transition-all hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: cat.bg, color: cat.color }}
                      >
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900">{cat.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{cat.description}</p>
                        <p className="text-xs font-semibold text-[#126e3d] mt-2">
                          {cat.articles} articles →
                        </p>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── CONTACT CHANNELS ─────────────────────────── */}
          <section data-section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Talk to a human</h2>
                <p className="text-sm text-gray-500 mt-1">Our team is here to help when you need us.</p>
              </div>
            </div>
            {/* ✅ New grid — adapts to 4 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CONTACT_CHANNELS.map((channel) => {
                const Icon = channel.icon
                return (
                  <a
                    key={channel.title}
                    href={channel.href}
                    target={channel.external ? '_blank' : undefined}
                    rel={channel.external ? 'noopener noreferrer' : undefined}
                    data-search={`${channel.title} ${channel.description} ${channel.cta}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-6 transition-all hover:border-emerald-200 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: channel.bg, color: channel.color }}
                      >
                        <Icon size={22} />
                      </div>
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{ backgroundColor: channel.bg, color: channel.color }}
                      >
                        {channel.badge}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 mb-1">{channel.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{channel.description}</p>
                    <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: channel.color }}>
                      {channel.cta}
                      {channel.external ? <ExternalLink size={12} /> : <ChevronRight size={14} />}
                    </p>
                  </a>
                )
              })}
            </div>
          </section>

          {/* ── POPULAR FAQs (Grouped by Category) ───────── */}
          {QUICK_CATEGORIES.map((cat) => {
            const faqs = POPULAR_FAQS.filter((f) => f.category === cat.id)
            if (faqs.length === 0) return null
            const Icon = cat.icon

            return (
              <section key={cat.id} id={cat.id} data-section className="mb-10 scroll-mt-20">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: cat.bg, color: cat.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{cat.title}</h2>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <details
                      key={faq.q}
                      data-search={`${faq.q} ${faq.a}`}
                      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all hover:border-emerald-200 open:border-emerald-200 open:shadow-md"
                    >
                      <summary className="flex items-start justify-between gap-4 p-5 cursor-pointer list-none">
                        <span className="font-bold text-slate-900 flex-1">{faq.q}</span>
                        <ChevronRight
                          size={20}
                          className="text-gray-400 flex-shrink-0 transition-transform group-open:rotate-90 mt-0.5"
                        />
                      </summary>
                      <div className="px-5 pb-5 -mt-1">
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <p className="text-xs text-gray-400">Was this helpful?</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={`mailto:${SUPPORT_EMAIL}?subject=Help with: ${encodeURIComponent(faq.q)}`}
                              className="text-xs font-bold text-[#126e3d] hover:underline"
                            >
                              Still need help? Contact us →
                            </a>
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )
          })}

          {/* ── SELF-SERVICE TOOLS ───────────────────────── */}
          <section data-section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Self-service tools</h2>
                <p className="text-sm text-gray-500 mt-1">Solve common issues yourself in seconds.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SELF_SERVICE.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    target={tool.external ? '_blank' : undefined}
                    rel={tool.external ? 'noopener noreferrer' : undefined}
                    data-search={`${tool.title} ${tool.description}`}
                    className="flex items-center gap-4 rounded-xl bg-white border border-gray-100 p-4 transition-all hover:border-emerald-200 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#126e3d]">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{tool.title}</p>
                      <p className="text-xs text-gray-500 truncate">{tool.description}</p>
                    </div>
                    {tool.external ? (
                      <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </section>

          {/* ── RESOURCES ────────────────────────────────── */}
          <section data-section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Learning resources</h2>
                <p className="text-sm text-gray-500 mt-1">Deep-dive guides to get the most out of Pika Plan.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RESOURCES.map((resource) => {
                const Icon = resource.icon
                return (
                  <Link
                    key={resource.title}
                    href={resource.href}
                    data-search={`${resource.title} ${resource.description}`}
                    className="group flex items-center gap-4 rounded-2xl bg-white border border-gray-100 p-5 transition-all hover:border-orange-200 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#f97316] group-hover:scale-110 transition-transform">
                      <Icon size={22} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{resource.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{resource.description}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                )
              })}
            </div>
          </section>

          {/* ── BUSINESS HOURS & STATUS ──────────────────── */}
          <section data-section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#126e3d]">
                  <Clock size={20} />
                </div>
                <h3 className="font-black text-slate-900">Support Hours</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between text-gray-700">
                  <span className="font-semibold">Monday – Friday</span>
                  <span>8:00 AM – 8:00 PM EAT</span>
                </li>
                <li className="flex justify-between text-gray-700">
                  <span className="font-semibold">Sunday</span>
                  <span>9:00 AM – 6:00 PM EAT</span>
                </li>
                <li className="flex justify-between text-gray-700">
                  <span className="font-semibold">Saturday</span>
                  <span className="text-[#f97316]">WhatsApp & Email only</span>
                </li>
              </ul>
            </div>

            <a
              href={STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#126e3d]">
                    <Activity size={20} />
                  </div>
                  <h3 className="font-black text-slate-900">System Status</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#126e3d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#32CD32] animate-pulse" />
                  All systems operational
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Check real-time status of meal generation, payments, and order processing on our status page.
              </p>
              <p className="text-sm font-bold text-[#126e3d] mt-3 flex items-center gap-1">
                View status page <ExternalLink size={12} />
              </p>
            </a>
          </section>

          {/* ── FINAL CTA ────────────────────────────────── */}
          <section className="mb-12">
            <div className="rounded-[32px] bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white p-8 lg:p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#32CD32]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#F4A535]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur">
                  <Sparkles size={14} className="text-[#32CD32]" />
                  Still stuck?
                </div>
                <h2 className="text-3xl lg:text-4xl font-black mb-3">
                  Our team is one message away
                </h2>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Cannot find what you are looking for? Send us a message and we will get back to you with a personalised response — usually within an hour.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-8 py-4 text-base font-black uppercase text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <MessageCircle size={18} />
                    Chat on WhatsApp
                  </a>
                  <a
                    href="/support/contact"   
                    className="..."
                  >
                   <Mail size={18} />
                    Submit a Ticket
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── RELATED LINKS ────────────────────────────── */}
          <section className="mb-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-[#126e3d] transition">Privacy Policy</Link>
            <span className="text-gray-300">·</span>
            <Link href="/terms" className="hover:text-[#126e3d] transition">Terms of Service</Link>
            <span className="text-gray-300">·</span>
            <Link href="/cookies" className="hover:text-[#126e3d] transition">Cookie Policy</Link>
            <span className="text-gray-300">·</span>
            <Link href="/vendor-signup" className="hover:text-[#126e3d] transition">Become a Vendor</Link>
            <span className="text-gray-300">·</span>
            <Link href="/about" className="hover:text-[#126e3d] transition">About Pika Plan</Link>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}