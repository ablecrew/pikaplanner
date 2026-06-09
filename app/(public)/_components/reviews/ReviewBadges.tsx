import { ShieldCheck, Crown, Sparkles, Star } from 'lucide-react'

type Props = {
  isVerified?: boolean
  verificationType?: string | null
  tier?: string | null
  isFeatured?: boolean
}

export default function ReviewBadges({ isVerified, verificationType, tier, isFeatured }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isVerified && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-200">
          <ShieldCheck size={10} />
          {verificationType === 'long_term_user' ? 'Long-Term User' :
           verificationType === 'subscriber' ? 'Verified User' : 'Verified'}
        </span>
      )}

      {tier && tier !== 'free' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 border border-amber-200">
          <Crown size={10} className="text-amber-500" /> {tier} Plan
        </span>
      )}

      {isFeatured && (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-700 border border-violet-200">
          <Sparkles size={10} /> Featured
        </span>
      )}
    </div>
  )
}