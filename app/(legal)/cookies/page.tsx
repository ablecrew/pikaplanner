import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Cookie, Shield, Settings, Clock, FileLock, Scale, Mail,
  Globe, Eye, ToggleRight, AlertTriangle, CheckCircle2, Database,
} from 'lucide-react'
import PrintButton from './PrintButton'

// ⚖️ LEGAL DATE MANAGEMENT
const COOKIE_POLICY_EFFECTIVE_DATE = '2024-05-24T00:00:00Z'
const COMPANY_NAME = 'Pika Plan Technologies Ltd'
const COMPANY_REG = 'PVR-2024-001234'
const DPO_EMAIL = 'privacy@pikaplan.com'
const SUPPORT_EMAIL = 'support@pikaplan.com'
const ODPC_URL = 'https://www.odpc.go.ke'

const formattedDate = new Date(COOKIE_POLICY_EFFECTIVE_DATE).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
})

// 🔍 SEO METADATA
export const metadata: Metadata = {
  title: 'Cookie Policy | Pika Plan',
  description:
    'Learn how Pika Plan uses cookies and similar tracking technologies, what data is collected, and how you can manage your preferences in compliance with Kenya DPA 2019 and GDPR.',
  keywords: [
    'Pika Plan cookie policy',
    'cookies disclosure',
    'tracking technologies',
    'GDPR cookies',
    'Kenya DPA cookies',
    'cookie consent',
  ],
  authors: [{ name: COMPANY_NAME }],
  alternates: { canonical: '/cookies' },
  openGraph: {
    title: 'Cookie Policy | Pika Plan',
    description:
      'How Pika Plan uses cookies — what they are, why we use them, and how to manage them.',
    url: '/cookies',
    siteName: 'Pika Plan',
    type: 'article',
    locale: 'en_KE',
    publishedTime: COOKIE_POLICY_EFFECTIVE_DATE,
    modifiedTime: COOKIE_POLICY_EFFECTIVE_DATE,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cookie Policy | Pika Plan',
    description:
      'How Pika Plan uses cookies and how you can manage them — compliant with Kenya DPA 2019 & GDPR.',
  },
  category: 'Legal',
}

const TABLE_OF_CONTENTS = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'what-are-cookies', title: '2. What Are Cookies?' },
  { id: 'types', title: '3. Types of Cookies We Use' },
  { id: 'specific-cookies', title: '4. Specific Cookies in Use' },
  { id: 'third-party', title: '5. Third-Party Cookies' },
  { id: 'legal-basis', title: '6. Legal Basis & Consent' },
  { id: 'managing', title: '7. Managing Your Preferences' },
  { id: 'browser-controls', title: '8. Browser-Level Controls' },
  { id: 'do-not-track', title: '9. Do Not Track Signals' },
  { id: 'mobile', title: '10. Mobile App Identifiers' },
  { id: 'retention', title: '11. Cookie Retention Periods' },
  { id: 'updates', title: '12. Updates to This Policy' },
  { id: 'contact', title: '13. Contact Information' },
]

const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction',
    body: `This Cookie Policy explains how ${COMPANY_NAME} ("Pika Plan", "we", "us", or "our") uses cookies and similar tracking technologies on our website, mobile applications, and related digital services (collectively, the "Platform").\n\nThis policy should be read alongside our Privacy Policy and Terms of Service. It is designed to comply with the Kenya Data Protection Act, 2019, the Guidance Note on Consent issued by the Office of the Data Protection Commissioner (ODPC), the EU General Data Protection Regulation (GDPR), and the ePrivacy Directive (Directive 2002/58/EC as amended).`,
  },
  {
    id: 'what-are-cookies',
    title: '2. What Are Cookies?',
    body: `Cookies are small text files placed on your device (computer, tablet, or mobile) when you visit a website. They enable the website to recognise your device, remember your preferences, and improve your overall experience.\n\nWe also use related technologies, including:\n\n• Local Storage & Session Storage: Browser-based storage for offline functionality and faster load times.\n• Pixel Tags / Web Beacons: Small graphic files used to measure email and page engagement.\n• Software Development Kits (SDKs): Used in our mobile apps to deliver similar functions to cookies.\n• Device Identifiers: Such as Apple's IDFA and Google's Advertising ID (only with your consent).\n\nFor simplicity, all of the above are referred to as "cookies" throughout this policy.`,
  },
  {
    id: 'types',
    title: '3. Types of Cookies We Use',
    body: `We categorise cookies according to their function:\n\n• Strictly Necessary Cookies: Essential for the Platform to function. These enable core features such as user authentication, shopping cart functionality, and security. The Platform cannot operate without them, so they do not require your consent.\n\n• Functional Cookies: Allow the Platform to remember choices you make (e.g., language, dietary preferences, household size) to provide enhanced, personalised features.\n\n• Performance / Analytics Cookies: Help us understand how Users interact with the Platform by collecting anonymised usage statistics. This enables us to improve our AI meal recommendations and overall user experience.\n\n• Targeting / Marketing Cookies: Used to deliver advertisements relevant to you and your interests, both on Pika Plan and on third-party platforms. These are only set with your explicit consent.\n\n• Payment & Security Cookies: Set by our payment partners (M-Pesa, Payhero) to securely process transactions and prevent fraud.`,
  },
  {
    id: 'specific-cookies',
    title: '4. Specific Cookies in Use',
    body: `Below is a non-exhaustive list of the primary cookies used on the Platform. The actual cookies set on your device may vary depending on the features you use.\n\n— ESSENTIAL —\n• pika_session — Maintains your authenticated session. (Duration: Session)\n• pika_csrf — Protects against cross-site request forgery attacks. (Duration: Session)\n• pika_consent — Records your cookie consent choices. (Duration: 12 months)\n\n— FUNCTIONAL —\n• pika_prefs — Stores your dietary, language, and display preferences. (Duration: 12 months)\n• pika_cart — Remembers items in your meal plan or order cart. (Duration: 30 days)\n\n— ANALYTICS —\n• _ga, _ga_* — Google Analytics: distinguishes unique users and sessions. (Duration: up to 24 months)\n• _gid — Google Analytics: distinguishes users. (Duration: 24 hours)\n\n— PAYMENT / SECURITY —\n• payhero_session — Payhero transaction session. (Duration: Session)\n• mpesa_ref — M-Pesa transaction reference token. (Duration: 24 hours)\n\nYou can review the current cookies set on your device using your browser's developer tools (Application → Cookies / Storage).`,
  },
  {
    id: 'third-party',
    title: '5. Third-Party Cookies',
    body: `Some cookies are set by third-party services we use to operate, secure, and improve the Platform. We do not control these cookies, and you should refer to the third party's own privacy and cookie policies for full details.\n\nThird parties currently used include:\n\n• Google Analytics — Anonymised usage analytics.\n   ↳ https://policies.google.com/privacy\n• Vercel — Hosting & performance monitoring.\n   ↳ https://vercel.com/legal/privacy-policy\n• Cloudflare — Security, bot mitigation, and CDN delivery.\n   ↳ https://www.cloudflare.com/privacypolicy/\n• M-Pesa (Safaricom PLC) — Payment processing.\n   ↳ https://www.safaricom.co.ke/data-privacy-statement\n• Payhero — Payment processing.\n   ↳ https://payhero.co.ke/privacy\n\nWhere a third party processes your personal data on our behalf, we have a data processing agreement in place that requires them to handle your data in accordance with applicable data protection laws.`,
  },
  {
    id: 'legal-basis',
    title: '6. Legal Basis & Consent',
    body: `Our use of cookies relies on the following legal bases:\n\n• Strictly Necessary Cookies: Set on the basis of our legitimate interest in providing a secure, functional Platform. No consent is required, as recognised under Section 30 of the Kenya Data Protection Act, 2019 and Article 5(3) of the ePrivacy Directive.\n\n• All Other Cookies (Functional, Analytics, Marketing): Set ONLY after you provide explicit, informed, and freely given consent through our cookie consent banner.\n\nWhen you first visit the Platform, you will be presented with a cookie consent banner allowing you to:\n• Accept all cookies.\n• Reject all non-essential cookies.\n• Customise your preferences by category.\n\nYou may withdraw or modify your consent at any time by clicking the "Cookie Settings" link in our footer.`,
  },
  {
    id: 'managing',
    title: '7. Managing Your Preferences',
    body: `You have full control over which non-essential cookies are placed on your device. You can manage your preferences in the following ways:\n\n• On the Platform: Click the "Cookie Settings" link in the footer to open the preference centre. You may enable or disable cookie categories at any time. Changes take effect immediately.\n\n• Withdrawing Consent: Withdrawing consent does not affect the lawfulness of processing carried out prior to withdrawal.\n\n• Account Settings: For mobile app identifiers (IDFA/Google Ad ID), you can also reset or restrict tracking directly within your device's operating system settings.\n\nPlease note: disabling strictly necessary cookies may cause parts of the Platform to malfunction, including login, checkout, and account management features.`,
  },
  {
    id: 'browser-controls',
    title: '8. Browser-Level Controls',
    body: `In addition to our in-app controls, most browsers allow you to block or delete cookies via their settings. Common browsers provide guidance here:\n\n• Google Chrome: chrome://settings/cookies\n• Mozilla Firefox: about:preferences#privacy\n• Apple Safari: Preferences → Privacy\n• Microsoft Edge: edge://settings/content/cookies\n• Opera: opera://settings/cookies\n\nFor more general guidance, visit:\n• https://www.allaboutcookies.org\n• https://www.youronlinechoices.eu\n\nBlocking all cookies in your browser may prevent the Platform from functioning as intended.`,
  },
  {
    id: 'do-not-track',
    title: '9. Do Not Track Signals',
    body: `Some browsers offer a "Do Not Track" (DNT) setting that signals to websites that you do not wish to be tracked. There is currently no universally adopted standard for interpreting DNT signals.\n\nPika Plan currently treats your in-app cookie preferences (set via our consent banner) as the authoritative expression of your tracking choices. Where you have set a Global Privacy Control (GPC) signal, we will treat it as a valid opt-out request for marketing and advertising cookies.`,
  },
  {
    id: 'mobile',
    title: '10. Mobile App Identifiers',
    body: `Our mobile applications do not use traditional cookies but rely on similar technologies, including:\n\n• Local device storage to keep you signed in and store offline data.\n• Push notification tokens to deliver order and meal-plan alerts.\n• Mobile advertising identifiers (IDFA on iOS, Google Ad ID on Android) — only used with your consent and only for analytics or attribution.\n\nYou can manage these via:\n• iOS: Settings → Privacy & Security → Tracking\n• Android: Settings → Google → Ads`,
  },
  {
    id: 'retention',
    title: '11. Cookie Retention Periods',
    body: `Cookies have different lifespans depending on their function:\n\n• Session Cookies: Deleted automatically when you close your browser.\n• Persistent Cookies: Remain on your device for a defined period (e.g., 24 hours, 30 days, or up to 24 months).\n\nWe regularly review the cookies we use and remove those that are no longer necessary. The maximum retention period for any cookie set by Pika Plan is twenty-four (24) months. After this period, the cookie either expires automatically or is renewed only with fresh consent.`,
  },
  {
    id: 'updates',
    title: '12. Updates to This Policy',
    body: `We may update this Cookie Policy from time to time to reflect changes in the cookies we use, technological developments, or legal requirements. When we make material changes, we will:\n\n• Update the "Effective Date" at the top of this page.\n• Re-prompt you to review your cookie preferences via the consent banner.\n• Notify registered Users via email or in-app notice where the change is significant.\n\nWe encourage you to review this policy periodically to stay informed about how we use cookies.`,
  },
  {
    id: 'contact',
    title: '13. Contact Information',
    body: `If you have any questions or concerns about our use of cookies, please contact our Data Protection Officer:\n\n${COMPANY_NAME}\nRegistration No: ${COMPANY_REG}\nNairobi, Kenya\n\nEmail (Privacy / DPO): ${DPO_EMAIL}\nEmail (Support): ${SUPPORT_EMAIL}\n\nYou also have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) at ${ODPC_URL}, or with your local data protection authority in the European Union.`,
  },
]

export default function CookiesPage() {
  // 📋 JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Cookie Policy',
    url: 'https://pikaplanner.vercel.app/cookies',
    dateModified: COOKIE_POLICY_EFFECTIVE_DATE,
    datePublished: COOKIE_POLICY_EFFECTIVE_DATE,
    inLanguage: 'en-KE',
    publisher: {
      '@type': 'Organization',
      name: COMPANY_NAME,
      email: DPO_EMAIL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Nairobi',
        addressCountry: 'KE',
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="font-poppins bg-[#F6F8F6] text-gray-900 min-h-screen print:bg-white print:text-black">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#1A5C3A] via-[#145032] to-[#0d3d26] text-white print:bg-white print:text-black print:border-b print:border-gray-300">
          <div className="max-w-7xl mx-auto px-6 py-16 print:py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5 print:bg-gray-100 print:border-gray-300 print:text-gray-700">
              <Cookie size={14} />
              Legal & Compliance
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Cookie Policy
            </h1>
            <p className="text-white/80 mt-3 max-w-2xl text-lg print:text-gray-600">
              Understanding the cookies and tracking technologies used on the Pika Plan platform, and how you can manage your preferences.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/70 print:text-gray-600">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>
                  <strong className="text-white print:text-black">Effective Date:</strong> {formattedDate}
                </span>
              </div>
              <span className="hidden sm:block text-white/30">|</span>
              <div className="flex items-center gap-2">
                <Scale size={14} />
                <span>
                  <strong className="text-white print:text-black">Jurisdiction:</strong> Kenya & EU (GDPR)
                </span>
              </div>
              <span className="hidden sm:block text-white/30">|</span>
              <div className="flex items-center gap-2">
                <FileLock size={14} />
                <span>
                  <strong className="text-white print:text-black">Version:</strong> 2.1
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <PrintButton />
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="max-w-7xl mx-auto px-6 py-10 print:py-4">
          <div className="grid lg:grid-cols-4 gap-8">

            {/* Sticky Sidebar */}
            <aside className="hidden lg:block lg:col-span-1 print:hidden">
              <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
                  Table of Contents
                </h3>
                <nav className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
                  {TABLE_OF_CONTENTS.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-[#1A5C3A] hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3 space-y-6">

              {/* Trust Badges */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8 print:hidden">
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <Settings className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Full Control</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Customise or withdraw your cookie consent any time.
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <Eye className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Transparent</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Full list of cookies used and their exact purpose.
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <Shield className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Compliant</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Aligned with Kenya DPA 2019, GDPR, and ePrivacy rules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cookie Settings CTA */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm print:break-inside-avoid">
                <div className="flex items-start gap-3">
                  <ToggleRight className="text-emerald-700 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-900">Manage Cookie Preferences</h3>
                    <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
                      You can update your consent for analytics, functional, and marketing cookies at any time. Use the
                      "Cookie Settings" link in our website footer, or your browser's privacy controls.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-6">
                {SECTIONS.map((section) => (
                  <article
                    key={section.id}
                    id={section.id}
                    className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm scroll-mt-24 print:shadow-none print:border-gray-300 print:break-inside-avoid"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {section.title}
                    </h2>
                    <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-line text-[15px]">
                      {section.body}
                    </div>
                  </article>
                ))}
              </div>

              {/* Related Policies */}
              <div className="mt-8 bg-gradient-to-br from-[#1A5C3A] to-[#0d3d26] text-white rounded-2xl p-8 shadow-lg print:hidden">
                <div className="flex items-center gap-3 mb-4">
                  <Database size={24} className="text-[#32CD32]" />
                  <h3 className="text-xl font-bold">Related Legal Policies</h3>
                </div>
                <p className="text-white/80 leading-relaxed max-w-3xl">
                  This Cookie Policy is part of a broader legal framework that governs how {COMPANY_NAME} handles
                  your data and your relationship with the Platform.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/privacy"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-medium"
                  >
                    <Shield size={14} /> Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-medium"
                  >
                    <FileLock size={14} /> Terms of Service
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-white/70">
                  <a
                    href={`mailto:${DPO_EMAIL}`}
                    className="flex items-center gap-2 hover:text-white transition"
                  >
                    <Mail size={16} className="text-[#32CD32]" /> {DPO_EMAIL}
                  </a>
                  <a
                    href={ODPC_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition"
                  >
                    <Globe size={16} className="text-[#32CD32]" /> ODPC Kenya
                  </a>
                </div>
              </div>

              {/* Print-only footer */}
              <div className="hidden print:block mt-12 pt-8 border-t border-gray-300 text-sm text-gray-700">
                <p className="mb-4">
                  This document was printed from the Pika Plan website. The official, binding version of this
                  Cookie Policy is the one published online at the URL below.
                </p>
                <p>
                  <strong>{COMPANY_NAME}</strong> — Registration No: {COMPANY_REG}
                  <br />
                  Effective Date: {formattedDate} &nbsp;|&nbsp; Version 2.1
                  <br />
                  Source: https://pikaplanner.vercel.app/cookies
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}