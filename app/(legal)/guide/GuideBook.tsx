'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, BookOpen, Clock, List, X,
  AlertTriangle, Info, Lightbulb, Sparkles, Home, Search,
  // Icons used in chapter data
  Rocket, User, ChefHat, Calendar, ShoppingCart, CreditCard,
  Truck, Store, Smartphone, Shield, LifeBuoy,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { GuideChapter, GuideSection, IconName } from './_data/chapters'

// ── 🗺️ Icon Map (string → component) ─────────────────────────
const ICON_MAP: Record<IconName, LucideIcon> = {
  'rocket': Rocket,
  'user': User,
  'chef-hat': ChefHat,
  'calendar': Calendar,
  'shopping-cart': ShoppingCart,
  'credit-card': CreditCard,
  'truck': Truck,
  'store': Store,
  'smartphone': Smartphone,
  'shield': Shield,
  'sparkles': Sparkles,
  'life-buoy': LifeBuoy,
}

function ChapterIcon({
  name,
  size = 24,
  className = '',
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const Icon = ICON_MAP[name] ?? BookOpen
  return <Icon size={size} className={className} />
}

// ── Types ─────────────────────────────────────────────────────
type Page = {
  id: string
  chapterIdx: number
  sectionIdx: number | null
  chapter: GuideChapter
  section?: GuideSection
}

// ── Main Component ────────────────────────────────────────────
export default function GuideBook({ chapters }: { chapters: GuideChapter[] }) {
  // Flatten into pages
  const pages = useMemo<Page[]>(() => {
    const arr: Page[] = []
    chapters.forEach((ch, ci) => {
      arr.push({ id: `${ch.id}-title`, chapterIdx: ci, sectionIdx: null, chapter: ch })
      ch.sections.forEach((sec, si) => {
        arr.push({ id: sec.id, chapterIdx: ci, sectionIdx: si, chapter: ch, section: sec })
      })
    })
    return arr
  }, [chapters])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipping, setFlipping] = useState<'next' | 'prev' | null>(null)
  const [showToc, setShowToc] = useState(false)
  const [search, setSearch] = useState('')
  const bookRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const currentPage = pages[currentIdx]
  const totalPages = pages.length
  const progress = ((currentIdx + 1) / totalPages) * 100

  // ── Navigation ─────────────────────────────────────────────
  const goTo = (idx: number, direction?: 'next' | 'prev') => {
    if (idx < 0 || idx >= totalPages || flipping) return
    const dir = direction ?? (idx > currentIdx ? 'next' : 'prev')
    setFlipping(dir)
    setTimeout(() => {
      setCurrentIdx(idx)
      setTimeout(() => setFlipping(null), 50)
    }, 350)
  }

  const next = () => goTo(currentIdx + 1, 'next')
  const prev = () => goTo(currentIdx - 1, 'prev')

  // ── Keyboard ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      }
      if (e.key === 'Home') {
        e.preventDefault()
        goTo(0)
      }
      if (e.key === 'End') {
        e.preventDefault()
        goTo(totalPages - 1)
      }
      if (e.key === 'Escape') setShowToc(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, flipping])

  // ── Touch / Swipe ──────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) next()
      else prev()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  // ── Search ─────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return pages
      .filter((p) => {
        const text = [
          p.chapter.title,
          p.section?.title ?? '',
          ...(p.section?.paragraphs ?? []),
          ...(p.section?.steps ?? []),
        ].join(' ').toLowerCase()
        return text.includes(q)
      })
      .slice(0, 8)
  }, [search, pages])

  return (
    <div className="w-full">
      {/* ── Top Toolbar ────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowToc(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-gray-50 shadow-sm transition"
            aria-label="Open table of contents"
          >
            <List size={16} />
            <span className="hidden sm:inline">Contents</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-gray-50 shadow-sm transition"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500">
            Page {currentIdx + 1} / {totalPages}
          </span>
          <div className="hidden sm:block h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── The Book ───────────────────────────────────────── */}
      <div
        ref={bookRef}
        className="book-container relative mx-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="book-binding hidden sm:block" aria-hidden="true" />

        <div
          key={currentPage.id}
          className={`book-page ${flipping === 'next' ? 'flipping-next' : ''} ${
            flipping === 'prev' ? 'flipping-prev' : ''
          }`}
        >
          {currentPage.sectionIdx === null ? (
            <ChapterTitlePage chapter={currentPage.chapter} index={currentPage.chapterIdx} />
          ) : (
            <SectionPage
              chapter={currentPage.chapter}
              section={currentPage.section!}
              chapterIdx={currentPage.chapterIdx}
              sectionIdx={currentPage.sectionIdx!}
            />
          )}
        </div>

        <div className="book-edge-shadow hidden sm:block" aria-hidden="true" />
      </div>

      {/* ── Page Navigation ────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between gap-3 px-2">
        <button
          onClick={prev}
          disabled={currentIdx === 0 || flipping !== null}
          className="inline-flex items-center gap-2 rounded-xl bg-white border-2 border-gray-200 px-5 py-3 text-sm font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="hidden md:flex items-center gap-1.5 max-w-md overflow-hidden">
          {pages.slice(Math.max(0, currentIdx - 4), currentIdx + 5).map((p, i) => {
            const realIdx = Math.max(0, currentIdx - 4) + i
            return (
              <button
                key={p.id}
                onClick={() => goTo(realIdx)}
                disabled={flipping !== null}
                className={`h-2 rounded-full transition-all ${
                  realIdx === currentIdx
                    ? 'w-8 bg-[#126e3d]'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${realIdx + 1}`}
              />
            )
          })}
        </div>

        <button
          onClick={next}
          disabled={currentIdx === totalPages - 1 || flipping !== null}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-5 py-3 text-sm font-black text-white hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-gray-400 sm:hidden">
        ← Swipe to turn pages →
      </p>
      <p className="mt-3 hidden sm:block text-center text-xs text-gray-400">
        Use the arrow keys or click Next/Previous to navigate
      </p>

      {/* ── Table of Contents Drawer ───────────────────────── */}
      {showToc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-stretch justify-end"
          onClick={() => setShowToc(false)}
        >
          <aside
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#32CD32]" />
                <h2 className="font-black text-lg">Table of Contents</h2>
              </div>
              <button
                onClick={() => setShowToc(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the guide..."
                  className="w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]/20"
                />
              </div>
            </div>

            {/* Search Results */}
            {search.trim() && (
              <div className="p-3 border-b border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 mb-2">
                  Search results ({searchResults.length})
                </p>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-gray-500 px-2 py-3">No matches found.</p>
                ) : (
                  searchResults.map((p) => {
                    const idx = pages.indexOf(p)
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          goTo(idx)
                          setShowToc(false)
                          setSearch('')
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        <p className="text-xs text-gray-400">{p.chapter.title}</p>
                        <p className="text-sm font-bold text-slate-700">
                          {p.section?.title ?? 'Chapter introduction'}
                        </p>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {/* All Chapters */}
            {!search.trim() && (
              <nav className="p-3">
                {chapters.map((ch, ci) => {
                  const titlePageIdx = pages.findIndex((p) => p.id === `${ch.id}-title`)
                  const isCurrentChapter = currentPage.chapterIdx === ci

                  return (
                    <div key={ch.id} className="mb-1">
                      <button
                        onClick={() => {
                          goTo(titlePageIdx)
                          setShowToc(false)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                          isCurrentChapter ? 'bg-[#f0fdf4]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                          style={{ backgroundColor: ch.bg, color: ch.color }}
                        >
                          <ChapterIcon name={ch.iconName} size={14} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Chapter {ci + 1}
                          </p>
                          <p
                            className={`text-sm font-bold leading-tight ${
                              isCurrentChapter ? 'text-[#126e3d]' : 'text-slate-700'
                            }`}
                          >
                            {ch.title}
                          </p>
                        </div>
                      </button>

                      <div className="ml-11 mt-1 space-y-0.5">
                        {ch.sections.map((sec, si) => {
                          const secIdx = pages.findIndex((p) => p.id === sec.id)
                          const isCurrent = currentIdx === secIdx
                          return (
                            <button
                              key={sec.id}
                              onClick={() => {
                                goTo(secIdx)
                                setShowToc(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                                isCurrent
                                  ? 'bg-[#126e3d] text-white font-bold'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span className="text-[10px] mr-2 opacity-60">
                                {ci + 1}.{si + 1}
                              </span>
                              {sec.title}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </nav>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

// ── Chapter Title Page ──────────────────────────────────────
function ChapterTitlePage({ chapter, index }: { chapter: GuideChapter; index: number }) {
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center text-center px-8 py-12 rounded-r-2xl rounded-l-md"
      style={{ background: `linear-gradient(135deg, ${chapter.bg} 0%, white 100%)` }}
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-3xl mb-6 shadow-lg"
        style={{ backgroundColor: chapter.color, color: 'white' }}
      >
        <ChapterIcon name={chapter.iconName} size={42} />
      </div>
      <p
        className="text-xs font-black uppercase tracking-[0.3em] mb-2"
        style={{ color: chapter.color }}
      >
        Chapter {index + 1}
      </p>
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight">
        {chapter.title}
      </h1>
      <p className="text-sm sm:text-base text-gray-600 max-w-md leading-relaxed">
        {chapter.description}
      </p>
      <div className="mt-8 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Clock size={12} /> {chapter.readTime} min read
        </span>
        <span>·</span>
        <span>{chapter.sections.length} sections</span>
      </div>
    </div>
  )
}

// ── Section Page ────────────────────────────────────────────
function SectionPage({
  chapter,
  section,
  chapterIdx,
  sectionIdx,
}: {
  chapter: GuideChapter
  section: GuideSection
  chapterIdx: number
  sectionIdx: number
}) {
  return (
    <div className="h-full w-full overflow-y-auto px-6 sm:px-10 py-8 sm:py-10 custom-scrollbar">
      <div
        className="flex items-center gap-2 mb-5 text-xs font-black uppercase tracking-wider"
        style={{ color: chapter.color }}
      >
        <span>Chapter {chapterIdx + 1}</span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-400">{chapter.title}</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-5 leading-tight">
        <span className="text-gray-400 mr-2 font-black text-lg">
          {chapterIdx + 1}.{sectionIdx + 1}
        </span>
        {section.title}
      </h2>

      {section.paragraphs?.map((p, i) => (
        <p key={i} className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
          {p}
        </p>
      ))}

      {section.steps && (
        <ol className="mt-5 space-y-3">
          {section.steps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black"
                style={{ backgroundColor: chapter.bg, color: chapter.color }}
              >
                {i + 1}
              </span>
              <span className="text-sm sm:text-base text-gray-700 leading-relaxed pt-1">
                {step}
              </span>
            </li>
          ))}
        </ol>
      )}

      {section.tips?.map((tip, i) => {
        const TipIcon =
          tip.type === 'warning'
            ? AlertTriangle
            : tip.type === 'info'
              ? Info
              : Lightbulb
        const colors =
          tip.type === 'warning'
            ? { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#991b1b' }
            : tip.type === 'info'
              ? { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e40af' }
              : { bg: '#fff7ed', border: '#fed7aa', icon: '#f97316', text: '#9a3412' }
        return (
          <div
            key={i}
            className="mt-5 flex items-start gap-3 rounded-xl border p-4"
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          >
            <TipIcon size={18} className="flex-shrink-0 mt-0.5" style={{ color: colors.icon }} />
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
              {tip.type === 'warning' && <strong>Heads up: </strong>}
              {tip.type === 'info' && <strong>Note: </strong>}
              {tip.type === 'tip' && <strong>Pro tip: </strong>}
              {tip.text}
            </p>
          </div>
        )
      })}

      {section.faqs && section.faqs.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
            <Sparkles size={12} /> Frequently asked
          </p>
          {section.faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-lg border border-gray-100 bg-gray-50 overflow-hidden"
            >
              <summary className="flex items-start justify-between gap-3 px-4 py-3 cursor-pointer list-none">
                <span className="text-sm font-bold text-slate-700 flex-1">{faq.q}</span>
                <ChevronRight
                  size={16}
                  className="text-gray-400 flex-shrink-0 transition-transform group-open:rotate-90 mt-0.5"
                />
              </summary>
              <div className="px-4 pb-3 -mt-1">
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}