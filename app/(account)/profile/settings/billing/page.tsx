import Link from 'next/link'
import { fetchProfile } from '../actions'
import { redirect } from 'next/navigation'
import {
  CreditCard, Crown, Sparkles, Check, ArrowRight, FileText, Download, ExternalLink,
} from 'lucide-react'

export default async function BillingPage() {
  const profile = await fetchProfile()
  if (!profile) redirect('/login')

  const isPremium = profile.subscription_tier === 'premium'

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <section className={`rounded-2xl shadow-sm p-6 ${
        isPremium
          ? 'bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white border-0'
          : 'bg-white border border-gray-100'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-xs font-black uppercase tracking-wider mb-1 ${
              isPremium ? 'text-[#32CD32]' : 'text-[#126e3d]'
            }`}>
              Current Plan
            </p>
            <h2 className={`text-2xl font-black ${isPremium ? 'text-white' : 'text-slate-900'}`}>
              {isPremium ? '⭐ Premium' : '🆓 Free'}
            </h2>
            <p className={`text-sm mt-1 ${isPremium ? 'text-white/70' : 'text-slate-500'}`}>
              {isPremium
                ? 'You have access to all premium features'
                : 'Upgrade for unlimited AI plans and more variety'}
            </p>
          </div>
          {isPremium && <Crown size={32} className="text-[#F4A535]" />}
        </div>

        {!isPremium && (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-5 py-2.5 text-xs font-black uppercase text-white transition"
          >
            <Sparkles size={12} /> Upgrade to Premium <ArrowRight size={12} />
          </Link>
        )}
      </section>

      {/* Plan Features */}
      {!isPremium && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-black text-slate-900 mb-4">Premium Includes</h3>
          <ul className="space-y-2.5">
            {[
              'Unlimited AI meal plan generations',
              '4 meals per day (incl. snacks)',
              'Priority vendor matching',
              'Advanced dietary customization',
              'Family sharing (up to 5 members)',
              'Premium recipe library',
              'Ad-free experience',
              'Priority customer support',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                <Check size={14} className="text-[#126e3d] flex-shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/pricing"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-5 py-2.5 text-xs font-black uppercase text-white shadow-md hover:shadow-lg transition"
          >
            <Crown size={12} /> View Premium Plans
          </Link>
        </section>
      )}

      {/* Payment Methods */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-[#126e3d]" /> Payment Methods
        </h3>
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <CreditCard size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No payment methods on file</p>
          <button
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#126e3d] hover:underline"
          >
            + Add Payment Method
          </button>
        </div>
      </section>

      {/* Invoices */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <FileText size={16} className="text-[#126e3d]" /> Invoices & Receipts
        </h3>
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <FileText size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">No invoices yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Receipts for premium subscriptions and orders will appear here
          </p>
        </div>
      </section>
    </div>
  )
}