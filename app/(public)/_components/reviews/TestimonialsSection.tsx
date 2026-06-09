'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { PenLine, Star, ChevronLeft, ChevronRight, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react'
import ReviewCard from './ReviewCard'
import ReviewModal from './ReviewModal'
import { fetchReviewsAction, fetchReviewStatsAction, type Review, type ReviewStats } from './actions'

type Props = {
  initialReviews: Review[]
  initialStats: ReviewStats
}

export default function TestimonialsSection({ initialReviews, initialStats }: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [stats, setStats] = useState(initialStats)
  const [modalOpen, setModalOpen] = useState(false)
  const [scrollIndex, setScrollIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  const handleReviewSuccess = () => {
    startTransition(async () => {
      const [freshReviews, freshStats] = await Promise.all([
        fetchReviewsAction({ limit: 12 }),
        fetchReviewStatsAction(),
      ])
      setReviews(freshReviews)
      setStats(freshStats)
    })
  }

  const visibleCount = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 3 : 1
  const maxIndex = Math.max(0, reviews.length - visibleCount)

  const next = () => setScrollIndex((i) => Math.min(i + 1, maxIndex))
  const prev = () => setScrollIndex((i) => Math.max(i - 1, 0))

  // Auto-scroll every 8 seconds
  useEffect(() => {
    if (reviews.length <= visibleCount) return
    const interval = setInterval(() => {
      setScrollIndex((i) => (i >= maxIndex ? 0 : i + 1))
    }, 8000)
    return () => clearInterval(interval)
  }, [reviews.length, maxIndex, visibleCount])

  return (
    <section className="py-24 px-6 bg-[#FAFAF9]">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-black uppercase tracking-[0.2em] text-[#126e3d] mb-3">
            What Users Say
          </span>
          <h2 className="font-poppins font-extrabold text-[clamp(1.9rem,4vw,2.8rem)] text-[#0f1923] mb-4">
            Loved by thousands across{' '}
            <span className="bg-gradient-to-r from-[#F4A535] to-[#e8921f] bg-clip-text text-transparent">
              Kenya
            </span>
          </h2>

          {/* Stats row */}
          {stats.total > 0 && (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={18}
                      className={
                        s <= Math.round(stats.averageRating)
                          ? 'fill-[#F4A535] text-[#F4A535]'
                          : 'fill-slate-200 text-slate-200'
                      }
                    />
                  ))}
                </div>
                <span className="text-base font-black text-slate-900">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">
                  ({stats.total.toLocaleString()} review{stats.total === 1 ? '' : 's'})
                </span>
              </div>

              {stats.verifiedCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <ShieldCheck size={14} />
                  {stats.verifiedCount.toLocaleString()} verified
                </div>
              )}

              {stats.nps !== null && stats.nps > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-violet-700">
                  <TrendingUp size={14} />
                  NPS {stats.nps}
                </div>
              )}
            </div>
          )}

          <Link
            href="#reviews"
            onClick={(e) => {
              e.preventDefault()
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-poppins font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg mt-2"
            style={{ background: 'linear-gradient(135deg, rgba(26,92,58,0.85) 0%, rgba(244,165,53,0.85) 100%)' }}
          >
            <PenLine size={15} />
            Add Review
          </Link>
        </div>

        {/* Reviews Carousel */}
        {reviews.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Sparkles size={28} className="text-emerald-600" />
            </div>
            <p className="text-lg font-black text-slate-900">Be the first to review</p>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Share your experience and help other Kenyan families discover Pika Plan.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white text-sm font-black uppercase shadow-md hover:shadow-lg transition"
            >
              <PenLine size={14} /> Write a Review
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Nav buttons */}
            {reviews.length > visibleCount && (
              <>
                <button
                  onClick={prev}
                  disabled={scrollIndex === 0}
                  className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg hover:shadow-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft size={20} className="text-slate-700" />
                </button>
                <button
                  onClick={next}
                  disabled={scrollIndex === maxIndex}
                  className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg hover:shadow-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next reviews"
                >
                  <ChevronRight size={20} className="text-slate-700" />
                </button>
              </>
            )}

            <div className="overflow-hidden">
              <div
                className="flex gap-6 transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${scrollIndex * (100 / visibleCount)}%)`,
                }}
              >
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <ReviewCard review={review} />
                  </div>
                ))}
              </div>
            </div>

            {/* Dots indicator (mobile) */}
            {reviews.length > visibleCount && (
              <div className="mt-6 flex justify-center gap-1.5 lg:hidden">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setScrollIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === scrollIndex ? 'w-8 bg-[#126e3d]' : 'w-2 bg-slate-300'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top themes (insights from feedback) */}
        {(stats.topLikes.length > 0 || stats.topImprovements.length > 0) && (
          <div className="mt-16 grid sm:grid-cols-2 gap-6">
            {stats.topLikes.length > 0 && (
              <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-[#126e3d] mb-3">
                  💚 What users love
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.topLikes.map((like) => (
                    <span
                      key={like.tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-xs font-bold text-emerald-700"
                    >
                      {like.tag.replace(/_/g, ' ')}
                      <span className="text-emerald-500">{like.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {stats.topImprovements.length > 0 && (
              <div className="rounded-2xl bg-orange-50/50 border border-orange-100 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-[#f97316] mb-3">
                  🚀 We're working on
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.topImprovements.map((imp) => (
                    <span
                      key={imp.tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-orange-200 text-xs font-bold text-orange-700"
                    >
                      {imp.tag.replace(/_/g, ' ')}
                      <span className="text-orange-500">{imp.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <ReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleReviewSuccess}
      />
    </section>
  )
}