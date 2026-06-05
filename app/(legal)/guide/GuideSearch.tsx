'use client'

import { useState, useDeferredValue, useEffect } from 'react'
import { Search, X } from 'lucide-react'

export default function GuideSearch() {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)

  useEffect(() => {
    const q = deferred.toLowerCase().trim()
    let matchCount = 0

    // Hide/show sections based on data-search content
    document.querySelectorAll<HTMLElement>('[data-search]').forEach((el) => {
      const text = (el.dataset.search ?? '').toLowerCase()
      const matches = q === '' || text.includes(q)
      el.style.display = matches ? '' : 'none'
      if (matches && q !== '') matchCount++
    })

    // Hide chapters where ALL sections are hidden
    document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((chapter) => {
      const visibleSections = chapter.querySelectorAll<HTMLElement>('[data-search]:not([style*="display: none"])')
      chapter.style.display = visibleSections.length > 0 || q === '' ? '' : 'none'
    })

    // No results banner
    const banner = document.getElementById('no-results-banner')
    if (banner) banner.style.display = q !== '' && matchCount === 0 ? '' : 'none'
  }, [deferred])

  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the guide..."
        className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm pl-11 pr-11 py-3 text-white placeholder:text-white/60 focus:border-[#32CD32] focus:bg-white/20 focus:outline-none transition"
        aria-label="Search user guide"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}