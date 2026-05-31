'use client'

import Link from 'next/link'
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock3,
  Send,
  ShieldCheck,
  Handshake,
  Sparkles,
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

const contactCards = [
  {
    icon: Mail,
    title: 'Email Support',
    value: 'pikaplan.app@gmail.com',
    desc: 'General questions and account support',
  },
  {
    icon: Phone,
    title: 'Phone',
    value: '+254 797 846 624',
    desc: 'Mon - Fri, 8:00 AM to 6:00 PM EAT',
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'Nairobi, Kenya',
    desc: 'Serving users across Kenya and beyond',
  },
]

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="font-poppins bg-[#F6F8F6] text-gray-900">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#1A5C3A] via-[#145032] to-[#0d3d26] text-white">
          <div className="max-w-6xl mx-auto px-6 py-18">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5">
              <Sparkles size={14} />
              Contact Pika Plan
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight max-w-3xl">
              We are here to help you plan smarter
            </h1>
            <p className="text-white/80 mt-4 max-w-2xl leading-relaxed">
              Whether you need support, partnership information, or product guidance, our team is ready to help.
            </p>
          </div>
        </section>

        {/* Contact cards */}
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-3 gap-5">
            {contactCards.map((c) => (
              <div key={c.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                  <c.icon className="text-[#1A5C3A]" size={18} />
                </div>
                <h3 className="font-bold mb-1">{c.title}</h3>
                <p className="text-[#1A5C3A] font-semibold">{c.value}</p>
                <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Form + value block */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
              <h2 className="text-2xl font-extrabold mb-2">Send Us a Message</h2>
              <p className="text-gray-600 mb-6">
                Tell us what you need and we will get back to you as soon as possible.
              </p>

              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">First Name</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Last Name</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Subject</label>
                  <select className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
                    <option>General Inquiry</option>
                    <option>Account Support</option>
                    <option>Billing / Subscription</option>
                    <option>Partnership</option>
                    <option>Vendor Onboarding</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Message</label>
                  <textarea
                    rows={5}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 resize-none"
                    placeholder="Tell us more..."
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A5C3A] hover:bg-[#154d30] text-white font-bold transition"
                >
                  Send Message
                  <Send size={16} />
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4">Why Teams Choose Pika Plan</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="text-[#1A5C3A] mt-0.5" size={18} />
                    <p className="text-sm text-gray-700">Local-first planning with practical grocery execution</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Handshake className="text-[#1A5C3A] mt-0.5" size={18} />
                    <p className="text-sm text-gray-700">Vendor and user workflows in one connected product</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="text-[#1A5C3A] mt-0.5" size={18} />
                    <p className="text-sm text-gray-700">Fast support and guided onboarding for new users</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#F4A535] to-[#e8921f] rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Clock3 size={18} />
                  <h4 className="font-bold">Support Hours</h4>
                </div>
                <p className="text-white/90 text-sm">Monday - Friday: 8:00 AM - 6:00 PM EAT</p>
                <p className="text-white/90 text-sm mt-1">Sunday: 9:00 AM - 1:00 PM EAT</p>
                <p className="text-white/90 text-sm mt-1">Saturday: Closed</p>
              </div>

              <Link
                href="/about"
                className="block text-center px-5 py-3 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 font-semibold text-gray-800 transition"
              >
                Learn More About Pika Plan
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}