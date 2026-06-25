import { ArrowRight, Check, CircleHelp, Handshake, Zap } from "lucide-react";
import Link from "next/link";
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

const plans = [
  { 
    name: "Daily", 
    price: "21 KES", 
    frequency: "daily",
    popular: false,
    gradient: "from-slate-600 to-slate-800",
  },
  { 
    name: "Weekly", 
    price: "67 KES", 
    frequency: "weekly",
    popular: true,
    gradient: "from-[#32CD32] to-[#1A5C3A]",
  },
  { 
    name: "Monthly", 
    price: "217 KES", 
    frequency: "monthly",
    popular: false,
    gradient: "from-[#F4A535] to-[#f97316]",
  },
  { 
    name: "Annual", 
    price: "2500 KES", 
    frequency: "annual",
    popular: false,
    gradient: "from-[#1A5C3A] to-[#0a2d1d]",
    badge: "Best Value",
  },
];

const faqs = [
  {
    question: "Can users switch between AI and manual planning?",
    answer:
      "Yes. Users can generate plans with AI, then edit or replace meals manually before finalizing their weekly schedule.",
  },
  {
    question: "How is payment handled?",
    answer:
      "Payments run through your Edge Functions, while plan status and entitlements are synced in subscriptions tables.",
  },
  {
    question: "What happens after subscription expiry?",
    answer:
      "The app can gracefully limit premium actions and prompt users to renew while still preserving their existing data.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. Your plan will remain active until the end of the billing period.",
  },
];

export default function PricingPage() {
  return (
    <>
       <Navbar />
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">Pricing</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/80 mx-auto">
            Simple, transparent plans for every user stage, from quick daily usage to annual meal planning.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-16 lg:px-10 lg:py-20 -mt-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`relative bg-white border-2 rounded-2xl p-6 ${
                  plan.popular ? 'border-[#32CD32] shadow-xl shadow-[#32CD32]/20' : 'border-slate-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                {plan.popular && !plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#32CD32] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap size={12} /> Popular
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                  <Check size={24} className="text-white" />
                </div>
                
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#126e3d]">{plan.name}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{plan.price}</p>
                <p className="text-sm text-slate-600">Billed {plan.frequency}</p>
                
                <ul className="mt-4 space-y-2">
                  {["AI generation", "Manual planning", "Recipe access", "Shopping lists"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-[#22c55e]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:sales@pikaplan.app?subject=PikaPlan%20Enterprise%20Plan"
              className="inline-flex items-center gap-2 border-2 border-[#f97316] px-6 py-3 text-sm font-semibold text-[#f97316] rounded-lg transition hover:bg-[#fff7ed]"
            >
              <Handshake className="h-4 w-4" />
              Contact Sales
            </a>
            <Link
              href="/meal-generator"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-3 text-sm font-semibold text-white rounded-lg transition hover:shadow-lg hover:shadow-[#32CD32]/30"
            >
              Generate Your First Plan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#f8faf8] px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            <CircleHelp className="h-6 w-6 text-[#126e3d]" />
            Frequently Asked Questions
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2332CD32' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Ready to Start Planning?</h2>
              <p className="mt-3 max-w-2xl text-white/80 mx-auto">
                Launch your first meal plan now and let users manage subscriptions, recipes, and shopping workflows in one place.
              </p>
              <Link
                href="/meal-generator"
                className="mt-8 inline-flex items-center gap-2 bg-[#f97316] px-8 py-4 text-sm font-semibold text-white rounded-xl transition hover:bg-[#ea580c] hover:shadow-lg hover:shadow-[#f97316]/30"
              >
                Generate Your First Plan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
    </>
  );
}