'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import {
  X, Send, Loader2, AlertCircle, CheckCircle2, Camera, Plus,
  Sparkles, ChefHat, ShoppingBag, Calendar, Users, Wallet, BookOpen,
  Zap, Brain, ListChecks, Smartphone, Globe, Heart, Wifi, Trash2, ShieldCheck,
} from 'lucide-react'
import StarRating from './StarRating'
import {
  submitReviewAction,
  uploadReviewPhotoAction,
  type ReviewFormData,
  type ReviewUseCase,
  type ReviewLike,
  type ReviewImprovement,
} from './actions'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultName?: string
}

const USE_CASES: { value: ReviewUseCase; label: string; icon: any }[] = [
  { value: 'meal_planning', label: 'Meal Planning', icon: Calendar },
  { value: 'vendor_orders', label: 'Ordering from Vendors', icon: ChefHat },
  { value: 'shopping_lists', label: 'Shopping Lists', icon: ShoppingBag },
  { value: 'family_meals', label: 'Family Meals', icon: Users },
  { value: 'budget', label: 'Budget Tracking', icon: Wallet },
  { value: 'recipes', label: 'Browsing Recipes', icon: BookOpen },
  { value: 'other', label: 'Other', icon: Sparkles },
]

const LIKES: { value: ReviewLike; label: string; icon: any }[] = [
  { value: 'ai_quality', label: 'AI Quality', icon: Brain },
  { value: 'variety', label: 'Meal Variety', icon: Sparkles },
  { value: 'speed', label: 'Fast Performance', icon: Zap },
  { value: 'ease_of_use', label: 'Ease of Use', icon: ChefHat },
  { value: 'recipes', label: 'Recipe Quality', icon: BookOpen },
  { value: 'vendor_options', label: 'Vendor Options', icon: ShoppingBag },
  { value: 'pricing', label: 'Fair Pricing', icon: Wallet },
  { value: 'support', label: 'Customer Support', icon: Heart },
  { value: 'design', label: 'Beautiful Design', icon: Sparkles },
  { value: 'mobile_app', label: 'Mobile Experience', icon: Smartphone },
]

const IMPROVEMENTS: { value: ReviewImprovement; label: string; icon: any }[] = [
  { value: 'more_cuisines', label: 'More cuisines', icon: Globe },
  { value: 'pricing', label: 'Lower prices', icon: Wallet },
  { value: 'mobile_experience', label: 'Better mobile UX', icon: Smartphone },
  { value: 'meal_variety', label: 'More meal variety', icon: Sparkles },
  { value: 'vendor_coverage', label: 'Vendor coverage', icon: ChefHat },
  { value: 'delivery_speed', label: 'Faster delivery', icon: Zap },
  { value: 'recipe_details', label: 'More recipe details', icon: BookOpen },
  { value: 'family_features', label: 'Family features', icon: Users },
  { value: 'language_support', label: 'Language support', icon: Globe },
  { value: 'offline_mode', label: 'Offline mode', icon: Wifi },
]

// Shared input class — always-visible text
const INPUT_CLASS =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium ' +
  'text-slate-900 placeholder:text-slate-400 transition focus:outline-none ' +
  'focus:border-[#32CD32] focus:ring-2 focus:ring-[#32CD32]/20'

const INPUT_ERROR = 'border-red-300 bg-red-50'

export default function ReviewModal({ open, onClose, onSuccess, defaultName = '' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [displayName, setDisplayName] = useState(defaultName)
  const [displayRole, setDisplayRole] = useState('')

  // Ratings
  const [overallRating, setOverallRating] = useState(0)
  const [mealQuality, setMealQuality] = useState(0)
  const [variety, setVariety] = useState(0)
  const [easeOfUse, setEaseOfUse] = useState(0)
  const [value, setValue] = useState(0)
  const [support, setSupport] = useState(0)
  const [wouldRecommend, setWouldRecommend] = useState<number | null>(null)

  // Text
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  // Categorical
  const [primaryUseCase, setPrimaryUseCase] = useState<ReviewUseCase | null>(null)
  const [likedMost, setLikedMost] = useState<ReviewLike[]>([])
  const [improvements, setImprovements] = useState<ReviewImprovement[]>([])

  // Photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // State
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Reset on open
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1)
        setOverallRating(0)
        setTitle('')
        setBody('')
        setErrors({})
        setGlobalError(null)
        setSuccessMessage(null)
      }, 300)
    }
  }, [open])

  // Lock body scroll + ESC
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const handleUpload = async (file: File) => {
    if (photoUrls.length >= 3) {
      setGlobalError('Maximum 3 photos allowed.')
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('photo', file)
    const result = await uploadReviewPhotoAction(fd)
    setUploading(false)
    if (result.success) {
      setPhotoUrls((prev) => [...prev, result.url])
    } else {
      setGlobalError(result.error)
    }
  }

  const toggleLike = (like: ReviewLike) => {
    setLikedMost((prev) =>
      prev.includes(like) ? prev.filter((l) => l !== like) : [...prev, like]
    )
  }

  const toggleImprovement = (improvement: ReviewImprovement) => {
    setImprovements((prev) =>
      prev.includes(improvement) ? prev.filter((i) => i !== improvement) : [...prev, improvement]
    )
  }

  const canProceedFromStep1 = overallRating > 0 && displayName.trim().length >= 2
  const canProceedFromStep2 = title.trim().length >= 5 && body.trim().length >= 20

  const handleSubmit = () => {
    setErrors({})
    setGlobalError(null)

    const data: ReviewFormData = {
      display_name: displayName,
      display_role: displayRole,
      overall_rating: overallRating,
      meal_quality_rating: mealQuality || undefined,
      variety_rating: variety || undefined,
      ease_of_use_rating: easeOfUse || undefined,
      value_rating: value || undefined,
      customer_support_rating: support || undefined,
      would_recommend: wouldRecommend ?? undefined,
      title,
      body,
      primary_use_case: primaryUseCase ?? undefined,
      liked_most: likedMost,
      would_like_improved: improvements,
      photo_urls: photoUrls,
    }

    startTransition(async () => {
      const result = await submitReviewAction(data)
      if (!result.success) {
        if (result.field) setErrors({ [result.field]: result.error })
        else setGlobalError(result.error)
        return
      }
      setSuccessMessage(result.message)
      onSuccess?.()
      setTimeout(onClose, 1800)
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-5 bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#32CD32] mb-1">
                Step {step} of 3
              </p>
              <h2 className="text-xl font-black">
                {step === 1 && 'Rate your experience'}
                {step === 2 && 'Tell your story'}
                {step === 3 && 'Help us improve'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#32CD32] to-[#F4A535] transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {successMessage ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-[#1A5C3A] shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Thank you! 🎉</h3>
              <p className="mt-2 text-sm text-slate-600">{successMessage}</p>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-6">
              {/* ──────── STEP 1: Ratings ──────── */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Overall rating */}
                  <div className="text-center bg-gradient-to-br from-emerald-50 to-amber-50 rounded-2xl p-6 border border-emerald-100">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-3">
                      Overall Experience
                    </p>
                    <div className="flex justify-center">
                      <StarRating
                        value={overallRating}
                        onChange={setOverallRating}
                        size={40}
                        showLabel
                      />
                    </div>
                    {errors.overall_rating && (
                      <p className="mt-3 text-xs text-red-600 font-bold flex items-center justify-center gap-1">
                        <AlertCircle size={12} /> {errors.overall_rating}
                      </p>
                    )}
                  </div>

                  {/* Detailed ratings */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Rate by category <span className="text-slate-400">(optional)</span>
                    </p>
                    <div className="space-y-4">
                      <RatingRow label="Meal Quality & Recipes" value={mealQuality} onChange={setMealQuality} />
                      <RatingRow label="Variety & Options" value={variety} onChange={setVariety} />
                      <RatingRow label="Ease of Use" value={easeOfUse} onChange={setEaseOfUse} />
                      <RatingRow label="Value for Money" value={value} onChange={setValue} />
                      <RatingRow label="Customer Support" value={support} onChange={setSupport} />
                    </div>
                  </div>

                  {/* NPS */}
                  <div className="border-t border-slate-100 pt-5">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      How likely are you to recommend Pika Plan? <span className="text-slate-400">(0-10)</span>
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: 11 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setWouldRecommend(i)}
                          className={`h-10 w-10 rounded-lg text-sm font-black transition ${
                            wouldRecommend === i
                              ? 'bg-[#1A5C3A] text-white shadow-md scale-110'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Not likely</span>
                      <span>Extremely likely</span>
                    </div>
                  </div>

                  {/* Your name */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Jane W."
                        maxLength={50}
                        className={`${INPUT_CLASS} ${errors.display_name ? INPUT_ERROR : ''}`}
                      />
                      {errors.display_name && (
                        <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle size={11} /> {errors.display_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Your Role <span className="text-slate-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={displayRole}
                        onChange={(e) => setDisplayRole(e.target.value)}
                        placeholder="e.g. Mom of 3, Nairobi"
                        maxLength={80}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ──────── STEP 2: Write your review ──────── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Headline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Sum up your experience"
                      maxLength={100}
                      className={`${INPUT_CLASS} ${errors.title ? INPUT_ERROR : ''}`}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-slate-500">5-100 characters</p>
                      <span className={`text-xs ${title.length > 90 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {title.length}/100
                      </span>
                    </div>
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Your Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={6}
                      maxLength={2000}
                      placeholder="What did you love? What stood out? Be specific — your insights help other Kenyan families discover Pika Plan."
                      className={`${INPUT_CLASS} resize-y leading-relaxed ${errors.body ? INPUT_ERROR : ''}`}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-slate-500">Minimum 20 characters</p>
                      <span className={`text-xs ${body.length > 1800 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {body.length}/2000
                      </span>
                    </div>
                    {errors.body && (
                      <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.body}
                      </p>
                    )}
                  </div>

                  {/* Photos */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Add Photos <span className="text-slate-400">(optional, up to 3, max 5MB each)</span>
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {photoUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover border-2 border-slate-200" />
                          <button
                            onClick={() => setPhotoUrls((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-red-500 text-white shadow-md flex items-center justify-center hover:bg-red-600"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                      {photoUrls.length < 3 && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-300 hover:bg-emerald-50 flex flex-col items-center justify-center gap-1 transition disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="animate-spin text-slate-400" size={18} />
                          ) : (
                            <>
                              <Camera size={18} className="text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500">Add photo</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    />
                  </div>
                </div>
              )}

              {/* ──────── STEP 3: Categorical feedback ──────── */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Primary use case */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      What do you mainly use Pika Plan for?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {USE_CASES.map((uc) => {
                        const Icon = uc.icon
                        const isSelected = primaryUseCase === uc.value
                        return (
                          <button
                            key={uc.value}
                            type="button"
                            onClick={() => setPrimaryUseCase(uc.value)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${
                              isSelected
                                ? 'border-[#32CD32] bg-emerald-50 text-[#126e3d]'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <Icon size={18} className={isSelected ? 'text-[#126e3d]' : 'text-slate-400'} />
                            <span className="text-[11px] font-black text-center leading-tight">{uc.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Liked most */}
                  <div className="border-t border-slate-100 pt-5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      What do you love most? <span className="text-slate-400">(pick any)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LIKES.map((like) => {
                        const Icon = like.icon
                        const isSelected = likedMost.includes(like.value)
                        return (
                          <button
                            key={like.value}
                            type="button"
                            onClick={() => toggleLike(like.value)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                              isSelected
                                ? 'bg-[#32CD32] text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Icon size={12} />
                            {like.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Improvements */}
                  <div className="border-t border-slate-100 pt-5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      What should we improve? <span className="text-slate-400">(pick any)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {IMPROVEMENTS.map((imp) => {
                        const Icon = imp.icon
                        const isSelected = improvements.includes(imp.value)
                        return (
                          <button
                            key={imp.value}
                            type="button"
                            onClick={() => toggleImprovement(imp.value)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                              isSelected
                                ? 'bg-[#f97316] text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Icon size={12} />
                            {imp.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Trust note */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck size={16} className="text-[#126e3d] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      We use your feedback to improve Pika Plan continuously. Your review will appear publicly with the name and role you provided.
                    </p>
                  </div>
                </div>
              )}

              {globalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-800">{globalError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!successMessage && (
          <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={step === 1 ? onClose : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-sm font-bold text-slate-700 transition disabled:opacity-50"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={(step === 1 && !canProceedFromStep1) || (step === 2 && !canProceedFromStep2)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-2.5 text-sm font-black uppercase text-white shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-6 py-2.5 text-sm font-black uppercase text-white shadow-md hover:shadow-lg transition disabled:opacity-60"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {isPending ? 'Submitting...' : 'Post Review'}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  )
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <StarRating value={value} onChange={onChange} size={20} />
    </div>
  )
}