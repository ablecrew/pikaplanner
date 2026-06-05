import { getCategoryMeta, type BlogCategory } from './_data/posts'

type Props = {
  title: string
  category: BlogCategory
  className?: string
  priority?: boolean
}

/**
 * Beautiful generated cover image — no external fetch, no timeout risk.
 * Renders a gradient + decorative SVG pattern based on the category color.
 */
export default function CoverImage({ title, category, className = '' }: Props) {
  const meta = getCategoryMeta(category)
  const initials = title
    .split(' ')
    .filter((w) => /^[A-Z]/.test(w) || w.length > 3)
    .slice(0, 3)
    .map((w) => w[0])
    .join('')

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${meta.color} 0%, ${darken(meta.color)} 100%)`,
      }}
      aria-label={title}
    >
      {/* Decorative pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 200 200"
      >
        <defs>
          <pattern id={`p-${category}`} patternUnits="userSpaceOnUse" width="40" height="40">
            <circle cx="20" cy="20" r="1.5" fill="white" />
            <path d="M0,20 L40,20 M20,0 L20,40" stroke="white" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#p-${category})`} />
      </svg>

      {/* Glow blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-black/10 blur-3xl pointer-events-none" />

      {/* Big initial monogram */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-white/30 font-black tracking-tight select-none"
          style={{ fontSize: 'clamp(80px, 18vw, 180px)', lineHeight: 1 }}
        >
          {initials || meta.label.charAt(0)}
        </span>
      </div>

      {/* Category label bottom-left */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
        <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
          {meta.label}
        </span>
      </div>
    </div>
  )
}

// Slightly darken a hex color for the gradient end
function darken(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const factor = 0.7
  const dr = Math.round(r * factor).toString(16).padStart(2, '0')
  const dg = Math.round(g * factor).toString(16).padStart(2, '0')
  const db = Math.round(b * factor).toString(16).padStart(2, '0')
  return `#${dr}${dg}${db}`
}