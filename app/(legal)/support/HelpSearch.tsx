'use client'

import { useState, useDeferredValue, useEffect } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Lightweight client-only search that filters DOM elements by data-search attribute.
 * No external dependencies, no re-renders of unrelated content.
 */
export default function HelpSearch() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    const q = deferredQuery.toLowerCase().trim()
    const items = document.querySelectorAll<HTMLElement>('[data-search]')
    let visibleCount = 0

    items.forEach((el) => {
      const text = (el.dataset.search ?? '').toLowerCase()
      const matches = q === '' || text.includes(q)
      el.style.display = matches ? '' : 'none'
      if (matches) visibleCount++
    })

    // Hide section headings if all their children are hidden
    document.querySelectorAll<HTMLElement>('[data-section]').forEach((section) => {
      const visibleItems = section.querySelectorAll<HTMLElement>(
        '[data-search]:not([style*="display: none"])'
      )
      section.style.display = visibleItems.length > 0 || q === '' ? '' : 'none'
    })

    // Show "no results" banner
    const banner = document.getElementById('no-results-banner')
    if (banner) banner.style.display = q !== '' && visibleCount === 0 ? '' : 'none'
  }, [deferredQuery])

  return (
    <div className="relative">
      <Search
        size={20}
        className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search help articles, FAQs, and topics..."
        className="w-full rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-14 py-4 text-white placeholder:text-white/60 focus:border-[#32CD32] focus:bg-white/20 focus:outline-none transition"
        aria-label="Search help articles"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}