'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Store, Star, MapPin, Clock, ArrowRight, Filter, Phone,
  Globe, Compass, CheckCircle2, ChevronRight, Loader2, RefreshCw,
  AlertCircle, ShieldCheck, ShoppingBag
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'

// ── Types ────────────────────────────────────────────────

type VendorRecord = {
  id: string
  name: string
  email: string
  phone: string
  category: string
  location: string
  status: 'Active' | 'Pending' | 'Suspended' | 'Archived'
  joinedAt: string
  totalOrders: number
  rating: number
  isAcceptingOrders: boolean
  isVerified: boolean
  logoUrl: string
  coverUrl: string
}

const CATEGORIES = ['All', 'Healthy', 'Indian', 'Salads', 'Asian', 'Burgers', 'Japanese', 'Mexican', 'Italian', 'Fast Food', 'Kenyan', 'Swahili']

const supabase = createClient()

export default function UserVendorsPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [error, setError] = useState<string | null>(null)

  // ── Fetch Vendors ──────────────────────────────────────
  const fetchVendors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true) // Only retrieve active vendors
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      const mapped: VendorRecord[] = (data || []).map((v: any) => {
        // Derive vendor status
        let status: 'Active' | 'Pending' | 'Suspended' | 'Archived' = 'Pending'
        if (v.is_verified && v.is_active) status = 'Active'
        else if (v.is_verified && !v.is_active) status = 'Suspended'
        else if (!v.is_verified && !v.is_active) status = 'Archived'

        return {
          id: v.id,
          name: v.business_name || v.name || 'Unnamed Kitchen',
          email: v.email || '',
          phone: v.phone || '',
          category: v.category || 'General',
          location: v.location_city || '',
          status,
          joinedAt: v.created_at
            ? new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : '—',
          totalOrders: Number(v.total_orders || 0),
          rating: Number(v.rating || 0),
          isAcceptingOrders: Boolean(v.is_accepting_orders),
          isVerified: Boolean(v.is_verified),
          logoUrl: v.logo_url || '',
          coverUrl: v.cover_url || '',
        }
      })

      setVendors(mapped)
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
      setError(err instanceof Error ? err.message : 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchVendors()
  }, [fetchVendors])

  // ── Filters & Search ───────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return vendors.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)

      const matchCat = categoryFilter === 'All' || v.category.toLowerCase() === categoryFilter.toLowerCase()

      return matchSearch && matchCat
    })
  }, [vendors, search, categoryFilter])

  // ── Calculated Statistics ──────────────────────────────
  const stats = useMemo(() => {
    const activeList = vendors.filter(v => v.status === 'Active' || v.isVerified)
    const avgRating = activeList.length > 0
      ? activeList.reduce((acc, v) => acc + v.rating, 0) / activeList.length
      : 0

    const uniqueCategories = new Set(vendors.map(v => v.category.trim()).filter(Boolean))

    return {
      total: activeList.length,
      categoriesCount: uniqueCategories.size,
      avgRating: avgRating > 0 ? avgRating.toFixed(1) : 'New',
    }
  }, [vendors])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <PageHeader
        title="Browse Kitchens"
        subtitle="Discover top-rated food vendors and home kitchens near you."
        action={
          <button
            onClick={() => void fetchVendors()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Alerts */}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available Kitchens', value: stats.total, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Cuisine Categories', value: stats.categoriesCount, color: 'bg-blue-50 text-blue-700' },
          { label: 'Average Rating', value: stats.avgRating, suffix: ' ★', color: 'bg-amber-50 text-amber-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color.split(' ')[1]}`}>
              {s.value}
              {s.value !== 'New' && s.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="relative flex-1 w-full lg:max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search kitchens, cities, foods..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition text-gray-900"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Filter size={13} />
            Filter Categories
          </div>
          <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  categoryFilter === c
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="bg-gray-100 rounded-xl h-28 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Store size={28} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-800 text-lg">No kitchens found</p>
          <p className="text-xs text-gray-400 max-w-sm mt-1">Try adjusting your category search filters or input query parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((vendor, i) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full"
            >
              {/* Header Banner */}
              <div className="h-28 bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] p-4 flex items-end relative overflow-hidden">
                {vendor.coverUrl && (
                  <img
                    src={vendor.coverUrl}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute top-4 right-4 flex gap-1.5">
                  <span className="bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                    {vendor.category}
                  </span>
                  {vendor.isAcceptingOrders ? (
                    <span className="bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                      Open
                    </span>
                  ) : (
                    <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                      Closed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white text-[#1A5C3A] flex items-center justify-center text-lg font-black shadow-md overflow-hidden border border-white/20">
                    {vendor.logoUrl ? (
                      <img src={vendor.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      vendor.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight flex items-center gap-1">
                      {vendor.name}
                      {vendor.isVerified && (
                        <ShieldCheck size={14} className="text-emerald-400 fill-white" />
                      )}
                    </h3>
                    <div className="flex items-center gap-1 text-emerald-100 text-xs mt-0.5 font-medium">
                      <MapPin size={11} />
                      {vendor.location || 'Nairobi'}
                    </div>
                  </div>
                </div>
              </div>
              {/* Body */}
              <div className="p-4 flex flex-col flex-1">
                <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
                  <div className="text-center rounded-xl bg-gray-50/50 p-2 border border-gray-50">
                    <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-sm">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">Rating</p>
                  </div>
                  <div className="text-center rounded-xl bg-gray-50/50 p-2 border border-gray-50">
                    <p className="font-bold text-sm text-gray-900">{vendor.totalOrders}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">Orders</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs">
                  <div className="flex items-center gap-1 text-gray-400 font-medium">
                    <Clock size={12} />
                    Active since {vendor.joinedAt}
                  </div>
                  <a
                    href={`/dashboard/user/meals?vendor=${vendor.id}`}
                    className="inline-flex items-center gap-1 text-[#1A5C3A] font-bold hover:text-emerald-700 transition group-hover:gap-1.5"
                  >
                    View Menu <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
