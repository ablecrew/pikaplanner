'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { CATEGORIES, type BlogCategory } from './_data/posts'

export default function BlogFilters() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<BlogCategory | 'all'>('all')

  useEffect(() => {
    const q = query.toLowerCase().trim()
    let visibleCount = 0

    document.querySelectorAll<HTMLElement>('[data-post]').forEach((el) => {
      const cat = el.dataset.category as BlogCategory
      const text = (el.dataset.search ?? '').toLowerCase()
      const matchesSearch = q === '' || text.includes(q)
      const matchesCategory = activeCategory === 'all' || cat === activeCategory
      const show = matchesSearch && matchesCategory
      el.style.display = show ? '' : 'none'
      if (show) visibleCount++
    })

    const banner = document.getElementById('no-blog-results')
    if (banner) banner.style.display = visibleCount === 0 ? '' : 'none'
  }, [query, activeCategory])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles by title, tag, or keyword..."
          className="w-full rounded-2xl border-2 border-gray-200 bg-white pl-11 pr-11 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]/20 transition shadow-sm"
          aria-label="Search blog"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-700"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition ${
            activeCategory === 'all'
              ? 'bg-[#1A5C3A] text-white shadow-md'
              : 'bg-white border border-gray-200 text-slate-700 hover:border-emerald-300'
          }`}
        >
          All Posts
        </button>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.value
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition border ${
                active ? 'shadow-md border-transparent' : 'bg-white border-gray-200 hover:border-emerald-300'
              }`}
              style={
                active
                  ? { backgroundColor: cat.color, color: 'white' }
                  : { color: '#334155' }
              }
            >
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}