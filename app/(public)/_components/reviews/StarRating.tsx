'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

type Props = {
  value: number
  onChange?: (rating: number) => void
  size?: number
  readonly?: boolean
  showLabel?: boolean
  label?: string
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

export default function StarRating({
  value, onChange, size = 32, readonly = false, showLabel = false, label,
}: Props) {
  const [hover, setHover] = useState<number>(0)
  const displayValue = hover || value

  return (
    <div className="flex flex-col items-start gap-1">
      {label && (
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</span>
      )}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`transition-all ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'
            }`}
            aria-label={`Rate ${star} stars`}
          >
            <Star
              size={size}
              className={`transition-colors ${
                star <= displayValue
                  ? 'fill-[#F4A535] text-[#F4A535]'
                  : 'fill-slate-200 text-slate-300'
              }`}
            />
          </button>
        ))}
        {showLabel && displayValue > 0 && (
          <span className="ml-3 text-sm font-black text-slate-700">
            {LABELS[displayValue]}
          </span>
        )}
      </div>
    </div>
  )
}