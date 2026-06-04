import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  FileText, ShieldCheck, AlertTriangle, CheckCircle2,
  Scale, Clock, FileLock, Gavel, Mail, Globe, Users, Ban,
} from 'lucide-react'
import PrintButton from './PrintButton'

// ⚖️ LEGAL DATE MANAGEMENT
// Update this ONLY when the legal text is actually revised.
const TERMS_EFFECTIVE_DATE = '2024-05-24T00:00:00Z'
const COMPANY_NAME = 'Pika Plan Ltd'
const COMPANY_REG = 'PVR-2024-001234'
const LEGAL_EMAIL = 'legal@pikaplan.com'
const SUPPORT_EMAIL = 'support@pikaplan.com'
const JURISDICTION = 'Republic of Kenya'

const formattedDate = new Date(TERMS_EFFECTIVE_DATE).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
})

// 🔍 SEO METADATA
export const metadata: Metadata = {
  title: 'Terms of Service | Pika Plan',
  description:
    'The official Terms of Service governing your use of the Pika Plan platform — meal planning, vendor orders, payments, and user obligations under Kenyan law.',
  keywords: [
    'Pika Plan terms of service',
    'terms and conditions',
    'meal planning terms',
    'food delivery terms Kenya',
    'user agreement',
  ],
  authors: [{ name: COMPANY_NAME }],
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms of Service | Pika Plan',
    description:
      'The legal agreement between you and Pika Plan Technologies Ltd governing your use of the platform.',
    url: '/terms',
    siteName: 'Pika Plan',
    type: 'article',
    locale: 'en_KE',
    publishedTime: TERMS_EFFECTIVE_DATE,
    modifiedTime: TERMS_EFFECTIVE_DATE,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Pika Plan',
    description:
      'Read the terms governing your use of Pika Plan — meal planning, payments, and vendor services.',
  },
  category: 'Legal',
}

const TABLE_OF_CONTENTS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'definitions', title: '2. Definitions' },
  { id: 'eligibility', title: '3. Eligibility' },
  { id: 'service', title: '4. Service Overview' },
  { id: 'accounts', title: '5. User Accounts' },
  { id: 'payments', title: '6. Payments, Subscriptions & Refunds' },
  { id: 'vendors', title: '7. Vendor & Third-Party Services' },
  { id: 'acceptable-use', title: '8. Acceptable Use Policy' },
  { id: 'user-content', title: '9. User Content & Licenses' },
  { id: 'ip', title: '10. Intellectual Property' },
  { id: 'ai-disclaimer', title: '11. AI Recommendations Disclaimer' },
  { id: 'availability', title: '12. Service Availability' },
  { id: 'suspension', title: '13. Suspension & Termination' },
  { id: 'liability', title: '14. Disclaimers & Limitation of Liability' },
  { id: 'indemnification', title: '15. Indemnification' },
  { id: 'governing-law', title: '16. Governing Law & Dispute Resolution' },
  { id: 'changes', title: '17. Changes to These Terms' },
  { id: 'contact', title: '18. Contact Information' },
]

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    body: `These Terms of Service ("Terms") form a legally binding agreement between you ("User", "you") and ${COMPANY_NAME} ("Pika Plan", "we", "us", or "our"), governing your access to and use of the Pika Plan website, mobile applications, and related services (collectively, the "Platform").\n\nBy creating an account, accessing, or otherwise using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not access or use the Platform.`,
  },
  {
    id: 'definitions',
    title: '2. Definitions',
    body: `For the purposes of these Terms:\n\n• "Platform" means the Pika Plan website, mobile apps, APIs, and related technology services.\n• "User" means any individual or entity accessing or using the Platform.\n• "Vendor" means any third-party food service provider listed on the Platform.\n• "Content" means meal plans, recipes, images, text, reviews, or any material made available through the Platform.\n• "Order" means a request placed by a User through the Platform for goods or services from a Vendor.\n• "Subscription" means a recurring paid plan granting access to premium Platform features.`,
  },
  {
    id: 'eligibility',
    title: '3. Eligibility',
    body: `You must be at least eighteen (18) years of age and legally capable of entering into a binding contract under the laws of ${JURISDICTION} to use the Platform. By using the Platform, you represent and warrant that you meet these eligibility requirements.\n\nIf you are using the Platform on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms.`,
  },
  {
    id: 'service',
    title: '4. Service Overview',
    body: `Pika Plan provides:\n\n• AI-assisted meal planning and personalised recipe recommendations.\n• Automated grocery list generation based on selected meal plans.\n• Budget tracking and household-size calculations for meal cost management.\n• Optional integrations with verified food vendors for meal kit delivery or prepared meal fulfillment.\n• Secure payment processing via M-Pesa, Payhero, and supported card networks.\n\nFeatures may vary by region, subscription tier, and ongoing product updates. Pika Plan reserves the right to modify, add, or discontinue features at its discretion.`,
  },
  {
    id: 'accounts',
    title: '5. User Accounts',
    body: `To access most features, you must create an account. You agree to:\n\n• Provide accurate, current, and complete information during registration.\n• Promptly update your information to keep it accurate and current.\n• Maintain the confidentiality of your login credentials and any one-time passwords.\n• Notify us immediately at ${SUPPORT_EMAIL} of any unauthorised access or security breach.\n• Accept responsibility for all activities that occur under your account.\n\nWe reserve the right to suspend or terminate accounts containing false information or used in violation of these Terms.`,
  },
  {
    id: 'payments',
    title: '6. Payments, Subscriptions & Refunds',
    body: `Paid features and Subscriptions are billed according to the cycle you select (e.g., weekly, monthly, annual). By subscribing, you authorise Pika Plan or its payment processors to charge the applicable fees to your chosen payment method.\n\n• All fees are stated in Kenyan Shillings (KES) unless otherwise specified and are inclusive of applicable VAT where required.\n• Subscriptions renew automatically until cancelled. You may cancel renewal at any time via your account settings; cancellation takes effect at the end of the current billing cycle.\n• Except where required by law, fees are non-refundable. Refunds for service failures or duplicate charges will be reviewed on a case-by-case basis.\n• For Vendor orders, refund and cancellation terms are governed by the specific Vendor's policy, displayed at checkout.\n• We reserve the right to change pricing with at least thirty (30) days' prior notice.`,
  },
  {
    id: 'vendors',
    title: '7. Vendor & Third-Party Services',
    body: `Pika Plan acts as a marketplace and technology facilitator. When you place an Order with a Vendor through the Platform:\n\n• The contract for the supply of food or goods is between you and the Vendor directly.\n• The Vendor is solely responsible for the quality, safety, preparation, packaging, and delivery of the Order.\n• Pika Plan does not warrant the accuracy of Vendor menus, prices, allergen information, or estimated delivery times.\n• We facilitate dispute resolution but are not a party to the supply contract.\n\nThird-party services integrated with the Platform (e.g., M-Pesa, Payhero, mapping providers) are governed by their own terms and privacy policies.`,
  },
  {
    id: 'acceptable-use',
    title: '8. Acceptable Use Policy',
    body: `You agree NOT to:\n\n• Use the Platform for any unlawful, fraudulent, or harmful purpose.\n• Attempt to gain unauthorised access to any part of the Platform, other accounts, or connected systems.\n• Upload viruses, malware, or any code intended to damage or interfere with the Platform.\n• Scrape, harvest, or copy Content using automated means without our written consent.\n• Reverse-engineer, decompile, or attempt to derive source code from the Platform.\n• Impersonate any person or entity, or misrepresent your affiliation with any party.\n• Post defamatory, harassing, obscene, discriminatory, or otherwise objectionable content.\n• Use the Platform to send unsolicited communications (spam) to other Users or Vendors.\n\nViolation of this policy may result in immediate account termination and, where applicable, legal action.`,
  },
  {
    id: 'user-content',
    title: '9. User Content & Licenses',
    body: `You retain ownership of any content you submit to the Platform (e.g., reviews, custom recipes, profile photos) ("User Content").\n\nBy submitting User Content, you grant Pika Plan a worldwide, non-exclusive, royalty-free, sublicensable, and transferable licence to host, store, reproduce, modify, display, and distribute such content solely for the purpose of operating, improving, and promoting the Platform.\n\nYou represent and warrant that:\n• You own or have the necessary rights to submit the User Content.\n• Your User Content does not infringe any third-party rights or violate any law.\n\nWe reserve the right (but have no obligation) to remove any User Content that violates these Terms.`,
  },
  {
    id: 'ip',
    title: '10. Intellectual Property',
    body: `All intellectual property rights in the Platform — including software, design, branding, logos, trademarks, AI models, recipe databases, and proprietary algorithms — are and shall remain the exclusive property of ${COMPANY_NAME} or its licensors.\n\nThese Terms grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform for personal, non-commercial purposes only.\n\nYou may not, without our prior written consent:\n• Copy, modify, distribute, sell, or lease any part of the Platform.\n• Use our trademarks or branding in any manner likely to cause confusion.\n• Remove or alter any proprietary notices on the Platform.`,
  },
  {
    id: 'ai-disclaimer',
    title: '11. AI Recommendations Disclaimer',
    body: `Pika Plan uses artificial intelligence and machine learning to generate meal plans, nutritional estimates, and shopping suggestions. While we strive for accuracy:\n\n• AI-generated content is provided for informational and convenience purposes only.\n• Meal recommendations are NOT a substitute for professional medical, nutritional, or dietary advice.\n• Users with allergies, medical conditions (e.g., diabetes, kidney disease), or special dietary needs should consult a qualified healthcare professional before relying on Platform recommendations.\n• Nutritional values and allergen warnings are estimates and may not be exhaustive.\n\nPika Plan disclaims all liability for adverse health outcomes resulting from reliance on AI-generated content.`,
  },
  {
    id: 'availability',
    title: '12. Service Availability',
    body: `We strive to maintain high Platform uptime but do not guarantee uninterrupted, error-free, or secure access. The Platform may be temporarily unavailable due to:\n\n• Scheduled maintenance (we will provide reasonable notice where possible).\n• Unscheduled technical issues, including upstream provider failures.\n• Force majeure events beyond our reasonable control.\n\nWe reserve the right to modify, suspend, or discontinue any feature of the Platform at any time, with or without notice, and shall not be liable to you or any third party for doing so.`,
  },
  {
    id: 'suspension',
    title: '13. Suspension & Termination',
    body: `We may suspend or terminate your access to the Platform, in whole or in part, immediately and without prior notice if we reasonably believe that:\n\n• You have breached these Terms or our Acceptable Use Policy.\n• Your conduct poses a security risk or causes harm to other Users, Vendors, or Pika Plan.\n• We are required to do so by law or regulatory order.\n• You have failed to pay any fees owed.\n\nYou may terminate your account at any time via account settings or by contacting ${SUPPORT_EMAIL}. Upon termination:\n• Your right to use the Platform ceases immediately.\n• Accrued fees remain payable.\n• Provisions intended to survive termination (e.g., IP, liability, governing law) shall remain in effect.`,
  },
  {
    id: 'liability',
    title: '14. Disclaimers & Limitation of Liability',
    body: `THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.\n\nTO THE MAXIMUM EXTENT PERMITTED BY LAW:\n\n• Pika Plan shall NOT be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages — including loss of profits, data, goodwill, or business interruption — arising from or related to your use of the Platform.\n• Our total aggregate liability for any claim arising under these Terms shall not exceed the greater of (a) the total fees paid by you to Pika Plan in the twelve (12) months preceding the claim, or (b) KES 10,000.\n• Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any liability that cannot be excluded by law.`,
  },
  {
    id: 'indemnification',
    title: '15. Indemnification',
    body: `You agree to indemnify, defend, and hold harmless ${COMPANY_NAME}, its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with:\n\n• Your breach of these Terms.\n• Your violation of any law or third-party rights.\n• Your User Content.\n• Your misuse of the Platform.`,
  },
  {
    id: 'governing-law',
    title: '16. Governing Law & Dispute Resolution',
    body: `These Terms are governed by and construed in accordance with the laws of the ${JURISDICTION}, without regard to conflict-of-law principles.\n\nDispute resolution shall proceed as follows:\n\n1. Informal Resolution: You agree to first contact us at ${LEGAL_EMAIL} and attempt to resolve any dispute informally for a period of at least thirty (30) days.\n2. Mediation: If unresolved, the parties shall attempt mediation in Nairobi, Kenya, under a mutually agreed mediator.\n3. Courts: Failing the above, disputes shall be submitted to the exclusive jurisdiction of the competent courts of Nairobi, Kenya.\n\nNothing in this clause prevents either party from seeking urgent injunctive relief in any court of competent jurisdiction.`,
  },
  {
    id: 'changes',
    title: '17. Changes to These Terms',
    body: `We may revise these Terms from time to time to reflect changes in our services, legal requirements, or business operations. When we make material changes, we will:\n\n• Update the "Effective Date" at the top of this page.\n• Notify registered Users via email or a prominent in-app notice at least fourteen (14) days before the changes take effect.\n\nYour continued use of the Platform after the effective date of the revised Terms constitutes your acceptance of the changes. If you do not agree, you must discontinue use of the Platform.`,
  },
  {
    id: 'contact',
    title: '18. Contact Information',
    body: `For any questions, complaints, or legal correspondence regarding these Terms, please contact:\n\n${COMPANY_NAME}\nRegistration No: ${COMPANY_REG}\nLegal & Compliance Department\nNairobi, Kenya\n\nEmail (Legal): ${LEGAL_EMAIL}\nEmail (Support): ${SUPPORT_EMAIL}\n\nWe aim to respond to all legal enquiries within five (5) business days.`,
  },
]

export default function TermsPage() {
  // 📋 JSON-LD structured data for rich search results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service',
    url: 'https://pikaplanner.vercel.app/terms',
    dateModified: TERMS_EFFECTIVE_DATE,
    datePublished: TERMS_EFFECTIVE_DATE,
    inLanguage: 'en-KE',
    publisher: {
      '@type': 'Organization',
      name: COMPANY_NAME,
      email: LEGAL_EMAIL,
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
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#1A5C3A] via-[#145032] to-[#0d3d26] text-white print:bg-white print:text-black print:border-b print:border-gray-300">
          <div className="max-w-7xl mx-auto px-6 py-16 print:py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5 print:bg-gray-100 print:border-gray-300 print:text-gray-700">
              <FileText size={14} />
              Legal & Compliance
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-white/80 mt-3 max-w-2xl text-lg print:text-gray-600">
              The legal agreement between you and {COMPANY_NAME} governing your use of the Pika Plan platform, vendor services, and AI-powered meal planning features.
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
                  <strong className="text-white print:text-black">Jurisdiction:</strong> {JURISDICTION}
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

        {/* Main Content Grid */}
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

            {/* Legal Content */}
            <div className="lg:col-span-3 space-y-6">

              {/* Trust Badges */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8 print:hidden">
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <ShieldCheck className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Transparent Terms</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Plain-language clauses backed by Kenyan contract law.
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <CheckCircle2 className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Fair Use</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Balanced obligations between Users, Vendors, and Pika Plan.
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
                  <Gavel className="text-[#1A5C3A] flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900">Legal Clarity</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Governing law, dispute resolution, and liability defined.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preamble Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm print:break-inside-avoid">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-amber-900">Please Read Carefully</h3>
                    <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                      These Terms contain important provisions including a limitation of liability,
                      indemnification obligation, and dispute resolution clause. By using Pika Plan,
                      you confirm that you accept and understand these obligations.
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

              {/* Acknowledgement Footer */}
              <div className="mt-8 bg-gradient-to-br from-[#1A5C3A] to-[#0d3d26] text-white rounded-2xl p-8 shadow-lg print:hidden">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck size={24} className="text-[#32CD32]" />
                  <h3 className="text-xl font-bold">Acknowledgement</h3>
                </div>
                <p className="text-white/80 leading-relaxed max-w-3xl">
                  By continuing to use Pika Plan, you confirm that you have read these Terms of Service
                  in full and agree to be bound by them. For related policies, please review our{' '}
                  <Link href="/privacy" className="underline text-[#32CD32] hover:text-white transition">
                    Privacy Policy
                  </Link>.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-white/70">
                  <a
                    href={`mailto:${LEGAL_EMAIL}`}
                    className="flex items-center gap-2 hover:text-white transition"
                  >
                    <Mail size={16} className="text-[#32CD32]" /> {LEGAL_EMAIL}
                  </a>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="flex items-center gap-2 hover:text-white transition"
                  >
                    <Users size={16} className="text-[#32CD32]" /> {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>

              {/* Print-only signature block */}
              <div className="hidden print:block mt-12 pt-8 border-t border-gray-300 text-sm text-gray-700">
                <p className="mb-4">
                  This document was printed from the Pika Plan website. The official, binding version
                  of these Terms of Service is the one published online at the URL below.
                </p>
                <p>
                  <strong>{COMPANY_NAME}</strong> — Registration No: {COMPANY_REG}
                  <br />
                  Effective Date: {formattedDate} &nbsp;|&nbsp; Version 2.1
                  <br />
                  Source: https://pikaplanner.vercel.app/terms
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