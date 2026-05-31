'use client'

import Link from 'next/link'
import {
  Sparkles,
  Target,
  ShieldCheck,
  Brain,
  ShoppingCart,
  Truck,
  BarChart3,
  Globe,
  Leaf,
  CheckCircle2,
  ArrowRight,
  Users,
  Clock3,
  Wallet,
  UtensilsCrossed,
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

const advantages = [
  {
    icon: Brain,
    title: 'AI Meal Intelligence',
    desc: 'Personalized plans based on budget, cuisine preferences, nutrition goals, and real household behavior.',
  },
  {
    icon: ShoppingCart,
    title: 'Auto Grocery Lists',
    desc: 'Ingredient-level quantities, grouped by category, with less waste and fewer missed items.',
  },
  {
    icon: Truck,
    title: 'Cook or Order Flexibility',
    desc: 'Users can either cook meals or order directly from local verified vendors in one workflow.',
  },
  {
    icon: BarChart3,
    title: 'Budget & Nutrition Tracking',
    desc: 'Every plan has measurable cost and nutrition data to make healthy eating financially sustainable.',
  },
  {
    icon: Globe,
    title: 'Local-First + Global Variety',
    desc: 'Built for Kenyan and regional food culture while supporting international meal styles.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust & Data Privacy',
    desc: 'Secure architecture with user-first privacy standards and controlled data access.',
  },
]

const stats = [
  { label: 'Meals Planned Monthly', value: '50,000+', icon: UtensilsCrossed },
  { label: 'Avg Household Savings', value: 'KES 2,000+', icon: Wallet },
  { label: 'Weekly Time Saved', value: '5+ hrs', icon: Clock3 },
  { label: 'Growing Community', value: '10,000+', icon: Users },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="font-poppins bg-[#F6F8F6] text-gray-900">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1A5C3A] via-[#145032] to-[#0d3d26]">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#F4A535]/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-white/5 blur-2xl" />

          <div className="relative max-w-6xl mx-auto px-6 py-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-5">
              <Sparkles size={14} />
              About Pika Plan
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-white max-w-3xl">
              Building a smarter way to plan, shop, cook, and order meals
            </h1>

            <p className="mt-5 text-white/80 max-w-2xl text-base leading-relaxed">
              Pika Plan helps households and individuals eat better while spending less. We combine AI,
              local food context, and practical daily tools to make healthy meals achievable and consistent.
            </p>
          </div>
        </section>

        {/* Mission + Vision */}
        <section className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <Target className="text-[#1A5C3A]" size={20} />
              </div>
              <h2 className="text-xl font-bold mb-3">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To make meal planning simple, affordable, and personalized for everyone by connecting
                nutrition, budgeting, and convenience into one seamless experience.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                <Leaf className="text-[#F4A535]" size={20} />
              </div>
              <h2 className="text-xl font-bold mb-3">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                A future where every household can confidently answer “What are we eating this week?”
                with a plan that is healthy, culturally relevant, and financially smart.
              </p>
            </div>
          </div>
        </section>

        {/* Competitive Advantage */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold">Why Pika Plan is Different</h3>
            <p className="text-gray-600 mt-2 max-w-3xl">
              Most apps solve one part of the food journey. Pika Plan connects planning, budgeting, shopping,
              and fulfillment in one platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {advantages.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                  <item.icon className="text-[#1A5C3A]" size={18} />
                </div>
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Impact stats */}
        <section className="max-w-6xl mx-auto px-6 pb-14">
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
            <h3 className="text-xl font-extrabold mb-6">Measured Impact</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center mb-3">
                    <s.icon className="text-[#1A5C3A]" size={17} />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <h3 className="text-2xl font-extrabold mb-6">Our Core Values</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'User-first decisions in product and experience',
              'Affordability and practicality in everyday planning',
              'Data-backed recommendations, not guesswork',
              'Local relevance and cultural inclusivity',
            ].map((v) => (
              <div key={v} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4">
                <CheckCircle2 className="text-[#1A5C3A] mt-0.5" size={18} />
                <p className="text-gray-700">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="rounded-2xl p-8 bg-gradient-to-r from-[#1A5C3A] to-[#1f7a4c] text-white">
            <h4 className="text-2xl font-extrabold">Ready to experience smarter meal planning?</h4>
            <p className="text-white/85 mt-2 max-w-2xl">
              Join Pika Plan and turn meal planning into a repeatable, stress-free routine.
            </p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F4A535] hover:bg-[#e8921f] text-white font-bold transition"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 font-semibold transition"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}