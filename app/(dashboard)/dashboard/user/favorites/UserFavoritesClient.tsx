'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Heart, Trash2, Plus, ShoppingCart, Calendar, Star,
  Clock, Users, Flame, ChefHat, Store, MapPin,
  UtensilsCrossed, Sparkles, Search, Filter,
  ExternalLink, Package, Loader2, X, Check,
  BookOpen, ListChecks, RefreshCw
} from 'lucide-react'
import { 
  EnrichedFavorite, ItemType, MealData, VendorData, VendorMealData,
  removeFavoriteAction, bulkRemoveAction, addToMealPlanAction, addToShoppingListAction 
} from './actions'

const TABS: { value: ItemType; label: string; icon: typeof Heart }[] = [
  { value: 'all', label: 'All', icon: Heart },
  { value: 'meal', label: 'Meals', icon: UtensilsCrossed },
  { value: 'recipe', label: 'Recipes', icon: BookOpen },
  { value: 'vendor', label: 'Vendors', icon: Store },
  { value: 'vendor_meal', label: 'Vendor Meals', icon: Package },
]

function getField(obj: Record<string, unknown> | null, ...keys: string[]): string {
  if (!obj) return ''
  for (const key of keys) {
    const val = obj[key]
    if (typeof val === 'string' && val.trim()) return val
    if (typeof val === 'number') return String(val)
  }
  return ''
}

function getArrayField(obj: Record<string, unknown> | null, ...keys: string[]): string[] {
  if (!obj) return []
  for (const key of keys) if (Array.isArray(obj[key])) return obj[key].map(String)
  return []
}

export default function UserFavoritesClient({ initialFavorites, userId }: { initialFavorites: EnrichedFavorite[], userId: string }) {
  const [favorites, setFavorites] = useState<EnrichedFavorite[]>(initialFavorites)
  const [activeTab, setActiveTab] = useState<ItemType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [isPending, startTransition] = useTransition()

  const showFeedback = (id: string, message: string) => {
    setActionFeedback({ id, message })
    setTimeout(() => setActionFeedback(null), 2500)
  }

  const handleRemove = async (favoriteId: string) => {
    setRemovingId(favoriteId)
    setFavorites(prev => prev.filter(f => f.favorite.id !== favoriteId)) // Optimistic UI
    await removeFavoriteAction(favoriteId)
    setRemovingId(null)
  }

  const handleBulkRemove = async () => {
    const ids = Array.from(selectedIds)
    setFavorites(prev => prev.filter(f => !selectedIds.has(f.favorite.id)))
    setSelectedIds(new Set())
    setBulkMode(false)
    await bulkRemoveAction(ids)
  }

  const handleAddToPlan = async (itemId: string) => {
    showFeedback(itemId, 'Added to meal plan!')
    await addToMealPlanAction(userId, itemId)
  }

  const handleAddToShoppingList = async (itemId: string) => {
    showFeedback(itemId, 'Ingredients added to shopping list!')
    await addToShoppingListAction(userId, itemId)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Instant in-memory filtering
  const filtered = useMemo(() => {
    return favorites.filter(f => {
      if (activeTab !== 'all' && f.favorite.item_type !== activeTab) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const name = getField(f.data as any, 'name', 'title', 'business_name', 'meal_name').toLowerCase()
        const desc = getField(f.data as any, 'description', 'summary', 'notes').toLowerCase()
        if (!name.includes(q) && !desc.includes(q)) return false
      }
      return true
    })
  }, [favorites, activeTab, searchQuery])

  const counts = useMemo(() => ({
    all: favorites.length,
    meal: favorites.filter(f => f.favorite.item_type === 'meal').length,
    recipe: favorites.filter(f => f.favorite.item_type === 'recipe').length,
    vendor: favorites.filter(f => f.favorite.item_type === 'vendor').length,
    vendor_meal: favorites.filter(f => f.favorite.item_type === 'vendor_meal').length,
  }), [favorites])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6 font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" /> Favorites
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your saved meals, recipes, and vendors in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          {favorites.length > 0 && (
            <>
              <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()) }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${bulkMode ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {bulkMode ? <X className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
                {bulkMode ? 'Cancel' : 'Select'}
              </button>
              <Link href="/meal-generator" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                <Sparkles className="w-4 h-4" /> Generate Plan
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {bulkMode && selectedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#126e3d] text-white rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm font-medium">{selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected</p>
            <div className="flex items-center gap-2">
              <button onClick={() => { selectedIds.forEach(id => handleAddToPlan(favorites.find(f=>f.favorite.id===id)?.favorite.item_id || '')); setBulkMode(false); setSelectedIds(new Set()) }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors">
                <Calendar className="w-3.5 h-3.5" /> Add to Plan
              </button>
              <button onClick={handleBulkRemove} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-xs font-semibold transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={e => startTransition(() => setSearchQuery(e.target.value))} placeholder="Search favorites..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#32CD32]/20 focus:border-[#32CD32] transition-all" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const IconComp = tab.icon
            const count = counts[tab.value]
            return (
              <button key={tab.value} onClick={() => startTransition(() => setActiveTab(tab.value))} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.value ? 'bg-[#126e3d] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                <IconComp className="w-4 h-4" /> {tab.label}
                {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.value ? 'bg-white/20' : 'bg-gray-200'}`}>{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center"><Heart className="w-10 h-10 text-red-300" /></div>
          <h3 className="text-lg font-bold text-gray-900">{searchQuery ? 'No matches found' : 'No favorites yet'}</h3>
          <p className="text-gray-500 text-sm text-center max-w-md">{searchQuery ? `No favorites match "${searchQuery}".` : 'Save meals, recipes, or vendors to find them quickly later.'}</p>
          {!searchQuery && (
            <div className="flex flex-wrap gap-3 mt-2">
              <Link href="/dashboard/user/meals" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all"><UtensilsCrossed className="w-4 h-4" /> Browse Meals</Link>
              <Link href="/dashboard/user/vendors" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"><Store className="w-4 h-4" /> Find Vendors</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(item => {
              const isSelected = selectedIds.has(item.favorite.id)
              const borderClass = isSelected ? 'border-[#32CD32] ring-2 ring-[#32CD32]/20' : 'border-gray-100'
              
              // MEAL / RECIPE CARD
              if (item.favorite.item_type === 'meal' || item.favorite.item_type === 'recipe') {
                const isRecipe = item.favorite.item_type === 'recipe'
                const d = item.data as MealData | null
                const name = getField(d as any, 'name', 'title', 'meal_name') || 'Unnamed Meal'
                const image = getField(d as any, 'image_url', 'photo_url')
                
                return (
                  <motion.div key={item.favorite.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg group ${borderClass}`}>
                    <div className="relative h-44 bg-gradient-to-br from-[#f0fdf4] to-[#f8faf8] overflow-hidden">
                      {image ? <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center">{isRecipe ? <BookOpen className="w-12 h-12 text-[#32CD32]/30" /> : <UtensilsCrossed className="w-12 h-12 text-[#32CD32]/30" />}</div>}
                      <button onClick={() => handleRemove(item.favorite.id)} disabled={removingId === item.favorite.id} className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors">
                        {removingId === item.favorite.id ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                      </button>
                      {bulkMode && <button onClick={() => toggleSelect(item.favorite.id)} className={`absolute bottom-3 left-3 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-[#32CD32] border-[#32CD32] text-white' : 'bg-white/90 border-gray-300'}`}>{isSelected && <Check className="w-4 h-4" />}</button>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-base truncate">{name}</h3>
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button onClick={() => handleAddToPlan(item.favorite.item_id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#126e3d] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"><Calendar className="w-3.5 h-3.5" /> Add to Plan</button>
                        {isRecipe && <button onClick={() => handleAddToShoppingList(item.favorite.item_id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><ShoppingCart className="w-3.5 h-3.5" /> Shopping List</button>}
                      </div>
                    </div>
                  </motion.div>
                )
              }

              // VENDOR CARD
              if (item.favorite.item_type === 'vendor') {
                const d = item.data as VendorData | null
                const name = getField(d as any, 'business_name', 'name') || 'Unnamed Vendor'
                const logo = getField(d as any, 'logo_url', 'image_url')
                
                return (
                  <motion.div key={item.favorite.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg ${borderClass}`}>
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {logo ? <img src={logo} alt={name} className="w-full h-full object-cover rounded-xl" /> : <Store className="w-7 h-7 text-[#32CD32]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{name}</h3>
                        </div>
                        <button onClick={() => handleRemove(item.favorite.id)} disabled={removingId === item.favorite.id} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0">
                          {removingId === item.favorite.id ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                        <Link href={`/dashboard/user/vendors?id=${item.favorite.item_id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#126e3d] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"><Store className="w-3.5 h-3.5" /> View Vendor</Link>
                      </div>
                    </div>
                  </motion.div>
                )
              }

              // VENDOR MEAL CARD
              if (item.favorite.item_type === 'vendor_meal') {
                const d = item.data as VendorMealData | null
                const name = getField(d as any, 'name', 'title') || 'Vendor Meal'
                const image = getField(d as any, 'image_url', 'photo_url')
                const price = getField(d as any, 'price')
                
                return (
                  <motion.div key={item.favorite.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg group ${borderClass}`}>
                    <div className="relative h-40 bg-gradient-to-br from-orange-50 to-[#f8faf8] overflow-hidden">
                      {image ? <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-[#F4A535]/30" /></div>}
                      {price && <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-[#126e3d]">{price} KES</div>}
                      <button onClick={() => handleRemove(item.favorite.id)} disabled={removingId === item.favorite.id} className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors">
                        {removingId === item.favorite.id ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 truncate">{name}</h3>
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button onClick={() => window.location.href = `/dashboard/user/orders?reorder=${item.favorite.item_id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#f97316] rounded-lg hover:bg-[#ea580c] transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Order Again</button>
                        <button onClick={() => handleAddToPlan(item.favorite.item_id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#126e3d] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"><Calendar className="w-3.5 h-3.5" /> Add to Plan</button>
                      </div>
                    </div>
                  </motion.div>
                )
              }
              return null
            })}
          </AnimatePresence>
        </div>
      )}
      
      {!isPending && filtered.length > 0 && <p className="text-center text-xs text-gray-400 pb-4">Showing {filtered.length} of {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}</p>}
    </motion.div>
  )
}