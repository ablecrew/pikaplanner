'use client'

import { useState, useTransition } from 'react'
import { ThumbsUp, ThumbsDown, Quote, MessageCircle } from 'lucide-react'
import StarRating from './StarRating'
import ReviewBadges from './ReviewBadges'
import { voteReviewAction, type Review } from './actions'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function ReviewCard({ review }: { review: Review }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count)
  const [voted, setVoted] = useState<'helpful' | 'not_helpful' | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleVote = (vote: 'helpful' | 'not_helpful') => {
    if (voted) return
    setVoted(vote)
    if (vote === 'helpful') setHelpfulCount((c) => c + 1)
    startTransition(async () => {
      await voteReviewAction(review.id, vote)
    })
  }

  const initials = review.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-emerald-100 transition flex flex-col h-full">
      {/* Top: badges + time */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <ReviewBadges
          isVerified={review.is_verified}
          verificationType={review.verification_type}
          tier={review.subscription_tier_at_review}
          isFeatured={review.is_featured}
        />
        <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
          {timeAgo(review.created_at)}
        </span>
      </div>

      {/* Rating */}
      <div className="mb-3">
        <StarRating value={review.overall_rating} readonly size={18} />
      </div>

      {/* Title */}
      <h4 className="text-base font-black text-slate-900 leading-tight mb-2">
        {review.title}
      </h4>

      {/* Body with quote mark */}
      <div className="relative mb-4 flex-1">
        <Quote size={20} className="absolute -top-1 -left-1 text-emerald-200" />
        <p className="text-sm text-slate-700 leading-relaxed pl-6 line-clamp-5">
          {review.body}
        </p>
      </div>

      {/* Photos */}
      {review.photo_urls && review.photo_urls.length > 0 && (
        <div className="flex gap-1.5 mb-4">
          {review.photo_urls.slice(0, 3).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="h-14 w-14 rounded-lg object-cover border border-slate-200"
            />
          ))}
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-[#1A5C3A] text-white text-sm font-black flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">{review.display_name}</p>
          {review.display_role && (
            <p className="text-xs text-slate-500 truncate">{review.display_role}</p>
          )}
        </div>
      </div>

      {/* Admin response */}
      {review.admin_response && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageCircle size={11} className="text-emerald-700" />
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
              Pika Plan Response
            </p>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{review.admin_response}</p>
        </div>
      )}

      {/* Helpful */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => handleVote('helpful')}
          disabled={isPending || !!voted}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            voted === 'helpful'
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          } disabled:opacity-50`}
        >
          <ThumbsUp size={12} />
          Helpful {helpfulCount > 0 && `(${helpfulCount})`}
        </button>
      </div>
    </article>
  )
}