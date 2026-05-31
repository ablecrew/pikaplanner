'use client'

import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import { Shield, Lock, Database, Eye, UserCheck, Mail, FileLock } from 'lucide-react'

const privacySections = [
  {
    title: '1. Information We Collect',
    body:
      'We collect account information (name, email), meal preferences, dietary choices, and usage interactions necessary to personalize your planning experience.',
  },
  {
    title: '2. How We Use Data',
    body:
      'Your data is used to generate personalized meal plans, optimize shopping lists, improve recommendations, and provide customer support.',
  },
  {
    title: '3. Data Sharing',
    body:
      'We do not sell personal data. Limited data may be shared with trusted service providers strictly to operate core platform functions and payment processing.',
  },
  {
    title: '4. Vendor Interactions',
    body:
      'If you place orders with a vendor, relevant order information is shared with that vendor to fulfill your request.',
  },
  {
    title: '5. Data Security',
    body:
      'We apply technical and organizational safeguards including encrypted transport, secure access controls, and role-based permissions.',
  },
  {
    title: '6. Your Rights',
    body:
      'You may request access, correction, or deletion of your personal data, subject to legal and operational requirements.',
  },
  {
    title: '7. Retention',
    body:
      'Data is retained only as long as required for service delivery, legal compliance, and fraud prevention.',
  },
  {
    title: '8. Cookies and Analytics',
    body:
      'We may use cookies and analytics tools to improve performance, usability, and product decision-making.',
  },
  {
    title: '9. Children’s Privacy',
    body:
      'Pika Plan is not intended for children under 13 without parental consent and supervision.',
  },
  {
    title: '10. Contact',
    body:
      'For privacy questions, contact privacy@pikaplan.com. We may update this policy periodically and will post updates here.',
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <main className="font-poppins bg-[#F6F8F6] text-gray-900 min-h-screen">
        <section className="bg-gradient-to-br from-[#1A5C3A] via-[#145032] to-[#0d3d26] text-white">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5">
              <Shield size={14} />
              Privacy Policy
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold">Your Data, Protected</h1>
            <p className="text-white/80 mt-3 max-w-2xl">
              Last updated: January 2026. This policy explains how Pika Plan collects, uses, and protects your personal information.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <Lock className="text-[#1A5C3A] mb-2" size={18} />
              <h3 className="font-bold">Security First</h3>
              <p className="text-sm text-gray-600 mt-1">Secure infrastructure and controlled access patterns.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <Eye className="text-[#1A5C3A] mb-2" size={18} />
              <h3 className="font-bold">Transparency</h3>
              <p className="text-sm text-gray-600 mt-1">Clear explanations of what data we use and why.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <UserCheck className="text-[#1A5C3A] mb-2" size={18} />
              <h3 className="font-bold">User Control</h3>
              <p className="text-sm text-gray-600 mt-1">You can request data changes or deletion.</p>
            </div>
          </div>

          <div className="space-y-4">
            {privacySections.map((s) => (
              <article key={s.title} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-lg mb-2">{s.title}</h2>
                <p className="text-gray-600 leading-relaxed">{s.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Database className="text-[#1A5C3A]" size={18} />
              <h3 className="font-bold">Competitive Privacy Advantage</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Pika Plan combines practical meal intelligence with privacy-conscious design. We focus on high-value personalization
              without over-collecting data, giving users strong utility and trust at the same time.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <Mail size={15} className="text-[#1A5C3A]" />
              privacy@pikaplan.com
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}