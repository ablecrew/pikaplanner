'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Search, Filter, Heart, Clock, Flame, Users, ChefHat,
  BookOpen, Sparkles, X, Loader2, Bookmark, CheckCircle2, Globe,
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import { RecipesPageData, Recipe, toggleSaveRecipeAction } from './actions'

export default function RecipesClient({ initialData }: { initialData: RecipesPageData }) {
  const [recipes, setRecipes] = useState(initialData.recipes)
  const [search, setSearch] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showOnlySaved, setShowOnlySaved] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filteredRecipes = useMemo(() => {
    const q = search.toLowerCase().trim()
    return recipes.filter((r) => {
      const matchSearch = !q ||
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q))
      const matchCuisine = selectedCuisine === 'all' || r.cuisine === selectedCuisine
      const matchCategory = selectedCategory === 'all' || r.category === selectedCategory
      const matchSaved = !showOnlySaved || r.is_saved
      return matchSearch && matchCuisine && matchCategory && matchSaved
    })
  }, [recipes, search, selectedCuisine, selectedCategory, showOnlySaved])

  const handleSave = async (recipe: Recipe) => {
    setSavingId(recipe.id)
    startTransition(async () => {
      const result = await toggleSaveRecipeAction(recipe.id)
      if (result.success) {
        setRecipes((prev) =>
          prev.map((r) => (r.id === recipe.id ? { ...r, is_saved: result.saved } : r))
        )
      }
      setSavingId(null)
    })
  }

  const activeFilterCount = [
    selectedCuisine !== 'all',
    selectedCategory !== 'all',
    showOnlySaved,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#f8faf8] font-poppins">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8 overflow-hidden rounded-[32px] bg-[#0a2d1d] text-white shadow-xl">
          <div className="relative p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(50,205,50,0.18),transparent_30%),radial-gradient(circle_at_90%_70%,rgba(249,115,22,0.22),transparent_35%)]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
                  <BookOpen size={14} className="text-[#32CD32]" /> Recipe Library
                </div>
                <h1 className="text-3xl font-black uppercase md:text-5xl">All Recipes</h1>
                <p className="mt-3 text-sm text-white/75 md:text-base max-w-2xl">
                  Browse our curated collection. Click any recipe for full ingredients, step-by-step instructions, and pro tips.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white/80">
                    <Sparkles size={11} className="text-[#32CD32]" />
                    {recipes.length} recipes available
                  </span>
                  {initialData.savedRecipeIds.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white/80">
                      <Heart size={11} className="text-red-300" />
                      {initialData.savedRecipeIds.length} saved
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes by name, ingredient, or tag..."
                className="w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-11 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32]/20 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Saved toggle */}
            <button
              onClick={() => setShowOnlySaved(!showOnlySaved)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                showOnlySaved
                  ? 'bg-red-50 text-red-700 border-2 border-red-200'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Heart size={14} className={showOnlySaved ? 'fill-red-500 text-red-500' : ''} />
              Saved ({initialData.savedRecipeIds.length})
            </button>
          </div>

          {/* Cuisine pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCuisine('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                selectedCuisine === 'all'
                  ? 'bg-[#1A5C3A] text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Cuisines
            </button>
            {initialData.cuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                  selectedCuisine === cuisine
                    ? 'bg-[#1A5C3A] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cuisine.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                selectedCategory === 'all'
                  ? 'bg-[#f97316] text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {initialData.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                  selectedCategory === cat
                    ? 'bg-[#f97316] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
          </p>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
              <Search size={28} className="text-slate-400" />
            </div>
            <p className="text-lg font-black text-slate-900">No recipes match your filters</p>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Try adjusting your search or removing some filters.
            </p>
            <button
              onClick={() => {
                setSearch('')
                setSelectedCuisine('all')
                setSelectedCategory('all')
                setShowOnlySaved(false)
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#126e3d] px-5 py-2.5 text-sm font-black text-white"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSave={() => handleSave(recipe)}
                isSaving={savingId === recipe.id}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

// ── Recipe Card ───────────────────────────────────────────
function RecipeCard({
  recipe, onSave, isSaving,
}: {
  recipe: Recipe
  onSave: () => void
  isSaving: boolean
}) {
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition"
    >
      {/* Image / placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-emerald-100 to-amber-100 overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ChefHat size={48} className="text-emerald-600/40" />
          </div>
        )}

        {/* Save button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSave()
          }}
          disabled={isSaving}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-white transition disabled:opacity-60"
          aria-label={recipe.is_saved ? 'Unsave recipe' : 'Save recipe'}
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin text-slate-500" />
          ) : (
            <Heart
              size={14}
              className={recipe.is_saved ? 'fill-red-500 text-red-500' : 'text-slate-400'}
            />
          )}
        </button>

        {/* Premium badge */}
        {recipe.is_premium && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase">
            Premium
          </div>
        )}

        {/* Cuisine tag */}
        {recipe.cuisine && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-white text-[10px] font-bold uppercase">
            <Globe size={9} />
            {recipe.cuisine.replace(/_/g, ' ')}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4">
        <h3 className="font-black text-slate-900 text-base leading-tight line-clamp-2 mb-2 group-hover:text-[#126e3d] transition">
          {recipe.name}
        </h3>

        {recipe.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-auto flex items-center gap-3 text-[10px] font-bold text-slate-500">
          {recipe.calories_per_serving && (
            <span className="flex items-center gap-0.5">
              <Flame size={10} className="text-orange-500" />
              {recipe.calories_per_serving} kcal
            </span>
          )}
          {totalTime > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock size={10} className="text-[#126e3d]" />
              {totalTime}m
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-0.5">
              <Users size={10} className="text-violet-500" />
              {recipe.servings}
            </span>
          )}
          {recipe.difficulty_level && (
            <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600 capitalize">
              {recipe.difficulty_level}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}