import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import { createClient } from '@/lib/supabase/server'
import {
  LifeBuoy, ArrowLeft, Mail, MessageCircle, Phone, Clock,
  ShieldCheck, CheckCircle2, Sparkles,
} from 'lucide-react'
import ContactForm from './ContactForm'

const SUPPORT_EMAIL = 'support@pikaplan.com'
const SUPPORT_PHONE = '+254 797 846 624'
const WHATSAPP_URL = 'https://wa.me/254797846624'

export const metadata: Metadata = {
  title: 'Contact Support | Pika Plan',
  description:
    'Get in touch with the Pika Plan support team. Submit an issue report, attach screenshots, and receive a personalised response within 1 hour during business hours.',
  alternates: { canonical: '/support/contact' },
  openGraph: {
    title: 'Contact Support | Pika Plan',
    description: 'Submit a support ticket with file attachments. Fast response guaranteed.',
    url: '/support/contact',
    siteName: 'Pika Plan',
    type: 'website',
    locale: 'en_KE',
  },
}

export default async function ContactPage() {
  // Prefill if user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialName = ''
  let initialEmail = user?.email ?? ''

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, name, email')
      .eq('id', user.id)
      .maybeSingle()
    initialName = profile?.full_name ?? profile?.name ?? ''
    initialEmail = profile?.email ?? user.email ?? ''
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white">
          <div className="mx-auto max-w-4xl px-6 py-14 lg:py-16">
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition mb-5"
            >
              <ArrowLeft size={16} /> Back to Help Center
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur">
              <LifeBuoy size={14} className="text-[#32CD32]" />
              Contact Support
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              How can we help?
            </h1>
            <p className="mt-3 text-base text-white/80 max-w-2xl">
              Submit a detailed ticket and our team will respond within an hour during business hours.
              Attach screenshots or logs to help us resolve your issue faster.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-white/15 transition"
              >
                <MessageCircle size={14} />
                WhatsApp Chat
              </a>
              <a
                href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-white/15 transition"
              >
                <Phone size={14} />
                Call Us
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-white/15 transition"
              >
                <Mail size={14} />
                Email Us
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Clock, label: '< 1hr', sub: 'Avg. response' },
              { icon: CheckCircle2, label: '98%', sub: 'Resolution rate' },
              { icon: ShieldCheck, label: 'Secure', sub: 'Encrypted uploads' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <Icon className="mx-auto text-[#126e3d]" size={20} />
                <p className="font-black text-slate-900 mt-2">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            ))}
          </div>

          <ContactForm initialEmail={initialEmail} initialName={initialName} />
        </div>
      </main>
      <Footer />
    </>
  )
}