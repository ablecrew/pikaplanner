import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  Shield, Lock, Database, Eye, UserCheck, Mail, FileLock,
  Scale, Globe, Clock, Users, ChevronRight, Download
} from 'lucide-react'
import PrintButton from './PrintButton'

// ⚖️ LEGAL DATE MANAGEMENT
// Update this ISO string ONLY when the legal text is actually revised.
// This ensures the "Last Updated" date reflects real legal changes, not app deployments.
const POLICY_EFFECTIVE_DATE = '2024-05-24T00:00:00Z'
const COMPANY_NAME = 'Pika Plan Ltd'
const COMPANY_REG = 'PVR-2024-001234' // Replace with actual reg number
const DPO_EMAIL = 'privacy@pikaplan.com'
const ODPC_URL = 'https://www.odpc.go.ke'

const formattedDate = new Date(POLICY_EFFECTIVE_DATE).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric'
})

// 🔍 SEO METADATA
export const metadata: Metadata = {
  title: 'Privacy Policy | Pika Plan',
  description:
    'Learn how Pika Plan Ltd collects, uses, and protects your personal data in compliance with the Kenya Data Protection Act, 2019 and GDPR.',
  keywords: [
    'Pika Plan privacy policy',
    'data protection',
    'GDPR compliance',
    'Kenya Data Protection Act 2019',
    'meal planning privacy',
    'food delivery data protection',
  ],
  authors: [{ name: COMPANY_NAME }],
  alternates: {
    canonical: '/privacy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  openGraph: {
    title: 'Privacy Policy | Pika Plan',
    description:
      'Your data, protected. How Pika Plan safeguards your personal information under Kenya DPA 2019 and GDPR.',
    url: '/privacy',
    siteName: 'Pika Plan',
    type: 'article',
    locale: 'en_KE',
    publishedTime: POLICY_EFFECTIVE_DATE,
    modifiedTime: POLICY_EFFECTIVE_DATE,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Pika Plan',
    description:
      'How Pika Plan collects, uses, and protects your data — compliant with Kenya DPA 2019 & GDPR.',
  },
  category: 'Legal',
}

const TABLE_OF_CONTENTS = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'controller', title: '2. Data Controller' },
  { id: 'collection', title: '3. Information We Collect' },
  { id: 'legal-basis', title: '4. Legal Basis for Processing' },
  { id: 'usage', title: '5. How We Use Your Data' },
  { id: 'sharing', title: '6. Data Sharing & Third Parties' },
  { id: 'transfers', title: '7. International Data Transfers' },
  { id: 'retention', title: '8. Data Retention' },
  { id: 'rights', title: '9. Your Data Protection Rights' },
  { id: 'security', title: '10. Data Security' },
  { id: 'children', title: '11. Children\'s Privacy' },
  { id: 'cookies', title: '12. Cookies & Analytics' },
  { id: 'changes', title: '13. Changes to This Policy' },
  { id: 'contact', title: '14. Contact Information' },
]

const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction',
    body: `Welcome to Pika Plan. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how ${COMPANY_NAME} ("we", "us", or "our") collects, uses, discloses, and safeguards your information when you use our platform to discover meal plans, order from vendors, and manage your dietary preferences. This policy is designed to comply with the Data Protection Act, 2019 (Kenya) and the General Data Protection Regulation (GDPR) where applicable.`
  },
  {
    id: 'controller',
    title: '2. Data Controller',
    body: `For the purposes of the Data Protection Act, 2019 and the GDPR, ${COMPANY_NAME} (Registration No: ${COMPANY_REG}) is the Data Controller responsible for your personal data. Our registered office is located in Nairobi, Kenya. We have appointed a Data Protection Officer (DPO) who is responsible for overseeing questions in relation to this privacy policy.`
  },
  {
    id: 'collection',
    title: '3. Information We Collect',
    body: `We collect information that you voluntarily provide to us, information collected automatically, and information from third parties:\n\n• Account Data: Name, email address, phone number, and password.\n• Profile & Preferences: Dietary restrictions, allergies, cuisine preferences, household size, and budget ranges.\n• Transaction Data: Order history, payment method details (processed securely via M-Pesa and Payhero), and billing addresses.\n• Location Data: Delivery addresses and approximate location (if permitted) to match you with nearby vendors.\n• Usage Data: IP address, browser type, device information, and interaction data to improve our platform.`
  },
  {
    id: 'legal-basis',
    title: '4. Legal Basis for Processing',
    body: `Under the Data Protection Act, 2019 and GDPR, we rely on the following legal bases to process your personal data:\n\n• Performance of a Contract: To process your orders, manage your account, and facilitate deliveries.\n• Consent: Where you have explicitly agreed (e.g., marketing emails, precise location tracking).\n• Legitimate Interests: To improve our AI meal recommendations, detect fraud, and ensure platform security.\n• Legal Obligation: To comply with tax, financial, and regulatory requirements.`
  },
  {
    id: 'usage',
    title: '5. How We Use Your Data',
    body: `We use your data to:\n• Generate personalized, AI-driven meal plans and shopping lists.\n• Facilitate secure transactions between you and food vendors.\n• Process payments and handle refunds via our payment partners.\n• Send transactional notifications (order confirmations, delivery updates).\n• Improve our machine learning algorithms for better dietary matching.\n• Comply with legal and regulatory obligations.`
  },
  {
    id: 'sharing',
    title: '6. Data Sharing & Third Parties',
    body: `We do not sell your personal data. We only share data with trusted third parties necessary to operate the platform:\n\n• Food Vendors: When you place an order, we share your name, delivery address, and order details with the specific vendor to fulfill your request.\n• Payment Processors: M-Pesa, Payhero, and card processors handle your financial data securely. We do not store full card numbers.\n• Cloud & Infrastructure: Secure hosting providers (e.g., AWS, Vercel) to maintain platform uptime.\n• Legal Authorities: When required by law or to protect our legal rights.`
  },
  {
    id: 'transfers',
    title: '7. International Data Transfers',
    body: `Our platform is hosted on secure cloud infrastructure that may process data outside of Kenya or the European Economic Area (EEA). Where we transfer your data internationally, we ensure it is protected by Standard Contractual Clauses (SCCs) approved by the European Commission and compliant with Section 48 of the Kenya Data Protection Act, 2019.`
  },
  {
    id: 'retention',
    title: '8. Data Retention',
    body: `We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:\n\n• Account Data: Retained until you request account deletion.\n• Transaction & Financial Data: Retained for 7 years to comply with Kenyan tax and financial regulations.\n• Usage & Analytics Data: Anonymized after 24 months.\nOnce the retention period expires, data is securely deleted or anonymized.`
  },
  {
    id: 'rights',
    title: '9. Your Data Protection Rights',
    body: `Under the Data Protection Act, 2019 and GDPR, you have the following rights:\n\n• Right of Access: Request a copy of the personal data we hold about you.\n• Right to Rectification: Request correction of inaccurate or incomplete data.\n• Right to Erasure (Right to be Forgotten): Request deletion of your data, subject to legal retention obligations.\n• Right to Restrict Processing: Request that we limit how we use your data.\n• Right to Data Portability: Request your data in a structured, machine-readable format.\n• Right to Object: Object to processing based on legitimate interests or direct marketing.\n• Right to Lodge a Complaint: You have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) in Kenya (${ODPC_URL}) or your local supervisory authority in the EU.`
  },
  {
    id: 'security',
    title: '10. Data Security',
    body: `We implement robust technical and organizational measures to protect your data, including:\n• End-to-end encryption for data in transit (TLS 1.3) and at rest (AES-256).\n• Role-based access controls (RBAC) for our internal team.\n• Regular security audits and penetration testing.\n• Secure payment tokenization via M-Pesa and Payhero.\nWhile we strive to protect your data, no internet transmission is 100% secure, and we cannot guarantee absolute security.`
  },
  {
    id: 'children',
    title: '11. Children\'s Privacy',
    body: `Pika Plan is not intended for individuals under the age of 18. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child without parental consent, we will take immediate steps to delete such information.`
  },
  {
    id: 'cookies',
    title: '12. Cookies & Analytics',
    body: `We use essential cookies to maintain your session and secure your account. We also use analytics tools to understand platform usage and improve our AI recommendations. You can manage your cookie preferences through your browser settings. For more details, please refer to our Cookie Policy.`
  },
  {
    id: 'changes',
    title: '13. Changes to This Policy',
    body: `We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. The "Last Updated" date at the top of this page indicates when the policy was last revised. Material changes will be communicated via email or a prominent notice on the platform.`
  },
  {
    id: 'contact',
    title: '14. Contact Information',
    body: `If you have any questions, concerns, or wish to exercise your data protection rights, please contact our Data Protection Officer:\n\nEmail: ${DPO_EMAIL}\nCompany: ${COMPANY_NAME}\nAddress: Nairobi, Kenya\n\nYou also have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) at ${ODPC_URL}.`
  }
]

export default function PrivacyPage() {
  // 📋 JSON-LD structured data for rich search results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PrivacyPolicy',
    name: 'Privacy Policy',
    url: 'https://pikaplan.com/privacy',
    dateModified: POLICY_EFFECTIVE_DATE,
    datePublished: POLICY_EFFECTIVE_DATE,
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
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="font-poppins bg-[#F6F8F6] text-gray-900 min-h-screen print:bg-white print:text-black">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#1A5C3A] via-[#145032] to-[#0d3d26] text-white print:bg-white print:text-black print:border-b print:border-gray-300">
          <div className="max-w-7xl mx-auto px-6 py-16 print:py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5 print:bg-gray-100 print:border-gray-300 print:text-gray-700">
              <Shield size={14} />
              Legal & Compliance
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="text-white/80 mt-3 max-w-2xl text-lg print:text-gray-600">
              Your data, protected. Learn how {COMPANY_NAME} collects, uses, and safeguards your personal information in compliance with the Data Protection Act, 2019 and GDPR.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/70 print:text-gray-600">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span><strong className="text-white print:text-black">Effective Date:</strong> {formattedDate}</span>
              </div>
              <span className="hidden sm:block text-white/30">|</span>
              <div className="flex items-center gap-2">
                <Scale size={14} />
                <span><strong className="text-white print:text-black">Jurisdiction:</strong> Kenya & EU (GDPR)</span>
              </div>
              <span className="hidden sm:block text-white/30">|</span>
              <div className="flex items-center gap-2">
                <FileLock size={14} />
                <span><strong className="text-white print:text-black">Version:</strong> 2.1</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <PrintButton />
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="max-w-7xl mx-auto px-6 py-10 print:py-4">
          <div className="grid lg:grid-cols-4 gap-8">

            {/* Sticky Sidebar Navigation (Desktop) */}
            <aside className="hidden lg:block lg:col-span-1 print:hidden">
              <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Table of Contents</h3>
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

            {/* Legal Content */}
            <div className="lg:col-span-3 space-y-6">

              {/* Compliance Badges */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8 print:hidden">
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <Lock className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Security First</h3>
                    <p className="text-sm text-gray-600 mt-1">AES-256 encryption and strict access controls.</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <Eye className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Full Transparency</h3>
                    <p className="text-sm text-gray-600 mt-1">Clear explanations of data usage and sharing.</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <UserCheck className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Your Rights</h3>
                    <p className="text-sm text-gray-600 mt-1">Full GDPR & DPA 2019 data subject rights.</p>
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
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      {section.title}
                    </h2>
                    <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-line text-[15px]">
                      {section.body}
                    </div>
                  </article>
                ))}
              </div>

              {/* Competitive Advantage / Trust Box */}
              <div className="mt-8 bg-gradient-to-br from-[#1A5C3A] to-[#0d3d26] text-white rounded-2xl p-8 shadow-lg print:hidden">
                <div className="flex items-center gap-3 mb-4">
                  <Database size={24} className="text-[#32CD32]" />
                  <h3 className="text-xl font-bold">Our Privacy Commitment</h3>
                </div>
                <p className="text-white/80 leading-relaxed max-w-3xl">
                  {COMPANY_NAME} combines practical meal intelligence with privacy-conscious design. We focus on high-value personalization without over-collecting data, giving users strong utility and trust. We never sell your data, and our AI models are trained on anonymized datasets to ensure your personal habits remain private.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-white/70">
                  <a href={`mailto:${DPO_EMAIL}`} className="flex items-center gap-2 hover:text-white transition">
                    <Mail size={16} className="text-[#32CD32]" /> {DPO_EMAIL}
                  </a>
                  <a href={ODPC_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition">
                    <Globe size={16} className="text-[#32CD32]" /> ODPC Kenya
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}