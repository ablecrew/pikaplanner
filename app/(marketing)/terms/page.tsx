'use client'

import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import { FileText, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using Pika Plan, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.',
  },
  {
    title: '2. Service Overview',
    content:
      'Pika Plan provides AI-assisted meal planning, grocery list generation, budgeting features, and optional integrations with food vendors for meal fulfillment.',
  },
  {
    title: '3. User Accounts',
    content:
      'You are responsible for maintaining accurate account details and safeguarding your login credentials. You agree not to share your account with unauthorized users.',
  },
  {
    title: '4. Payments and Subscriptions',
    content:
      'Paid plans are billed according to your selected cycle. Charges are non-refundable except where required by law. You may cancel renewal at any time from account settings.',
  },
  {
    title: '5. Vendor and Third-Party Services',
    content:
      'When placing orders with external vendors, those services are fulfilled by third parties. Pika Plan facilitates discovery and workflow but does not control third-party operations.',
  },
  {
    title: '6. Acceptable Use',
    content:
      'You agree not to misuse the platform, attempt unauthorized access, upload malicious content, or engage in activity that disrupts the service for other users.',
  },
  {
    title: '7. Intellectual Property',
    content:
      'All product features, branding, and platform content are owned by Pika Plan or licensed appropriately. You may not copy or redistribute materials without permission.',
  },
  {
    title: '8. Service Availability',
    content:
      'We strive for high uptime but do not guarantee uninterrupted service. Features may be updated, modified, or discontinued to improve product quality and security.',
  },
  {
    title: '9. Limitation of Liability',
    content:
      'To the maximum extent permitted by law, Pika Plan is not liable for indirect, incidental, or consequential damages arising from platform usage.',
  },
  {
    title: '10. Contact and Updates',
    content:
      'We may update these Terms periodically. Continued use indicates acceptance of updated Terms. For legal questions, contact legal@pikaplan.com.',
  },
]

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <main className="font-poppins bg-[#F6F8F6] text-gray-900 min-h-screen">
        <section className="bg-gradient-to-br from-[#1A5C3A] via-[#145032] to-[#0d3d26] text-white">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5">
              <FileText size={14} />
              Terms of Service
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold">Terms & Conditions</h1>
            <p className="text-white/80 mt-3 max-w-2xl">
              Last updated: January 2026. These terms govern your use of Pika Plan.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-[#1A5C3A] mt-0.5" size={18} />
              <p className="text-gray-700 text-sm leading-relaxed">
                Pika Plan is committed to transparent policies that protect users while enabling practical meal planning,
                budgeting, and vendor-supported fulfillment.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((s) => (
              <article key={s.title} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-lg mb-2">{s.title}</h2>
                <p className="text-gray-600 leading-relaxed">{s.content}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-[#1A5C3A]" size={18} />
                <h3 className="font-bold">Fair Use Commitment</h3>
              </div>
              <p className="text-sm text-gray-600">
                We optimize infrastructure to keep Pika Plan affordable while maintaining high-quality recommendations and service reliability.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-[#F4A535]" size={18} />
                <h3 className="font-bold">Important Note</h3>
              </div>
              <p className="text-sm text-gray-600">
                Meal suggestions are informational and should not replace professional medical or dietary advice for clinical conditions.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}