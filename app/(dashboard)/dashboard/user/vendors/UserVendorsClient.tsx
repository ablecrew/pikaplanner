'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Store, Star, MapPin, Clock, ArrowRight, Filter,
  ShieldCheck, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
  X, Phone, MessageSquare, UtensilsCrossed, Loader2,
} from 'lucide-react'
import {
  fetchUserVendors,
  fetchVendorDetail,
  type VendorsPayload,
  type VendorRecord,
  type VendorDetail,
  type SortOption,
} from './actions'
import { SORT_OPTIONS } from './constants'

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
}

function formatCurrency(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDistance(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export default function UserVendorsClient({
  initialData,
}: {
  initialData: VendorsPayload
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<VendorsPayload>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [, startTransition] = useTransition()

  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') || ''
  )
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get('category') || 'All'
  )
  const [page, setPage] = useState(Number(searchParams.get('page') || 1))
  const [sort, setSort] = useState<SortOption>(
    (initialData.sort as SortOption) || 'newest'
  )
  const [userCoords, setUserCoords] = useState<
    { lat: number; lng: number } | null
  >(null)

  // Modal state
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [vendorDetail, setVendorDetail] = useState<VendorDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const fetchData = useCallback(
    async (next: {
      search?: string
      category?: string
      page?: number
      sort?: SortOption
      coords?: { lat: number; lng: number } | null
    }) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams(searchParams.toString())
        const newSearch = next.search ?? search
        const newCategory = next.category ?? categoryFilter
        const newPage = next.page ?? page
        const newSort = next.sort ?? sort
        const newCoords = next.coords !== undefined ? next.coords : userCoords

        if (newSearch) params.set('search', newSearch)
        else params.delete('search')

        if (newCategory && newCategory !== 'All') params.set('category', newCategory)
        else params.delete('category')

        if (newPage > 1) params.set('page', String(newPage))
        else params.delete('page')

        if (newSort && newSort !== 'newest') params.set('sort', newSort)
        else params.delete('sort')

        startTransition(() => {
          router.push(`?${params.toString()}`)
        })

        const nextData = await fetchUserVendors({
          search: newSearch,
          category: newCategory,
          page: newPage,
          sort: newSort,
          userLat: newCoords?.lat,
          userLng: newCoords?.lng,
        })
        setData(nextData)
        setPage(nextData.page)
        setSort(nextData.sort)
      } catch (err: any) {
        setError(err.message || 'Failed to load vendors')
      } finally {
        setLoading(false)
      }
    },
    [searchParams, router, search, categoryFilter, page, sort, userCoords]
  )

  useEffect(() => {
    fetchData({ page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, sort])

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported on this device.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserCoords({ lat, lng })
        setLocating(false)
        fetchData({ coords: { lat, lng }, page: 1 })
      },
      (err) => {
        console.warn('Geolocation failed:', err)
        setLocating(false)
        setError(
          'Could not access your location. Sorting by distance may be limited.'
        )
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }, [fetchData])

  const handleSortChange = (newSort: SortOption) => {
    if (newSort === 'nearest' && !userCoords) {
      // Ask for location first; we'll re-apply the sort when coords arrive
      requestLocation()
      setSort('nearest')
      return
    }
    setSort(newSort)
    fetchData({ sort: newSort, page: 1 })
  }

  const openVendorDetail = useCallback(async (vendorId: string) => {
    setSelectedVendorId(vendorId)
    setDetailLoading(true)
    setVendorDetail(null)
    try {
      const detail = await fetchVendorDetail(vendorId)
      setVendorDetail(detail)
    } catch (err) {
      console.error('Failed to load vendor detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const closeVendorDetail = useCallback(() => {
    setSelectedVendorId(null)
    setVendorDetail(null)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="font-poppins"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            Browse Kitchens
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-700">
              <Store size={12} /> {data.stats.total} vendors
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Discover top-rated food vendors and home kitchens near you.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={requestLocation}
            disabled={locating}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            {locating ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <MapPin size={15} className="text-emerald-600" />
            )}
            {userCoords ? 'Location On' : 'Use my location'}
          </button>
          <button
            onClick={() => fetchData({})}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available Kitchens', value: data.stats.total, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Cuisine Categories', value: data.stats.categoriesCount, color: 'bg-blue-50 text-blue-700' },
          {
            label: 'Average Rating',
            value: data.stats.avgRating,
            suffix: ' ★',
            color: 'bg-amber-50 text-amber-700',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
              {s.label}
            </p>
            <p className={`text-2xl font-black ${s.color.split(' ')[1]}`}>
              {s.value}
              {s.value !== 'New' && s.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative flex-1 w-full lg:max-w-xs">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search kitchens, cities, foods..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition text-gray-900"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Filter size={13} />
              Sort
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleSortChange(s.value as SortOption)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    sort === s.value
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Categories:
            </span>
            {data.categories.map((c) => (
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

      {/* Banner when "Nearest" selected but no location */}
      {sort === 'nearest' && !userCoords && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="text-amber-900 font-semibold flex items-center gap-2">
            <MapPin size={14} /> Enable location to see vendor distance from you.
          </p>
          <button
            onClick={requestLocation}
            disabled={locating}
            className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition disabled:opacity-50"
          >
            {locating ? 'Locating...' : 'Use my location'}
          </button>
        </div>
      )}

      {/* Vendor Grid */}
      {loading && data.vendors.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3"
            >
              <div className="bg-gray-100 rounded-xl h-28 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : data.vendors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Store size={28} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-800 text-lg">No kitchens found</p>
          <p className="text-xs text-gray-400 max-w-sm mt-1">
            Try adjusting your category, sort, or search filters.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.vendors.map((vendor, i) => {
              const distanceLabel = formatDistance(vendor.distanceKm)
              return (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer"
                  onClick={() => openVendorDetail(vendor.id)}
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
                          {distanceLabel && (
                            <>
                              <span className="opacity-70">•</span>
                              <span className="font-semibold">{distanceLabel}</span>
                            </>
                          )}
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
                      <span className="inline-flex items-center gap-1 text-[#1A5C3A] font-bold group-hover:gap-1.5 transition-all">
                        View Details <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-900">{data.page}</span> of{' '}
                <span className="font-semibold text-gray-900">{data.totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchData({ page: data.page - 1 })}
                  disabled={data.page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <button
                  onClick={() => fetchData({ page: data.page + 1 })}
                  disabled={data.page >= data.totalPages || loading}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vendor Detail Modal */}
      <AnimatePresence>
        {selectedVendorId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeVendorDetail}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {detailLoading || !vendorDetail ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-32 bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] relative overflow-hidden flex-shrink-0">
                    {vendorDetail.coverUrl && (
                      <img
                        src={vendorDetail.coverUrl}
                        alt="Cover"
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                      />
                    )}
                    <button
                      onClick={closeVendorDetail}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition"
                    >
                      <X size={16} />
                    </button>
                    {vendorDetail.isAcceptingOrders ? (
                      <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                        </span>
                        Accepting Orders
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>

                  <div className="px-6 pb-6 overflow-y-auto flex-1">
                    <div className="flex items-start gap-3 -mt-10 mb-4">
                      <div className="w-20 h-20 rounded-2xl bg-white text-[#1A5C3A] flex items-center justify-center text-3xl font-black shadow-md overflow-hidden border-2 border-white">
                        {vendorDetail.logoUrl ? (
                          <img
                            src={vendorDetail.logoUrl}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          vendorDetail.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-1.5">
                          {vendorDetail.name}
                          {vendorDetail.isVerified && (
                            <ShieldCheck size={16} className="text-emerald-500" />
                          )}
                        </h2>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                          <MapPin size={13} />
                          {vendorDetail.location || 'Nairobi'}
                          {vendorDetail.cuisine && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="capitalize">{vendorDetail.cuisine}</span>
                            </>
                          )}
                        </p>
                        {vendorDetail.distanceKm != null && (
                          <p className="text-xs text-emerald-600 mt-1 font-semibold">
                            {formatDistance(vendorDetail.distanceKm)} away
                          </p>
                        )}
                      </div>
                    </div>

                    {vendorDetail.description && (
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        {vendorDetail.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="rounded-xl bg-amber-50 p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-sm">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          {vendorDetail.rating > 0 ? vendorDetail.rating.toFixed(1) : 'New'}
                        </div>
                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wide mt-0.5">Rating</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-3 text-center">
                        <p className="font-bold text-sm text-blue-700">{vendorDetail.totalOrders}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mt-0.5">Orders</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3 text-center">
                        <p className="font-bold text-sm text-emerald-700">
                          {vendorDetail.minOrder > 0 ? formatCurrency(vendorDetail.minOrder) : '—'}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide mt-0.5">Min Order</p>
                      </div>
                      <div className="rounded-xl bg-violet-50 p-3 text-center">
                        <p className="font-bold text-sm text-violet-700">
                          {vendorDetail.prepTime > 0 ? `${vendorDetail.prepTime}m` : '—'}
                        </p>
                        <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wide mt-0.5">Prep</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {vendorDetail.phone && (
                        <a
                          href={`tel:${vendorDetail.phone}`}
                          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                          <Phone size={14} className="text-emerald-600" /> {vendorDetail.phone}
                        </a>
                      )}
                      {vendorDetail.whatsapp && (
                        <a
                          href={`https://wa.me/${vendorDetail.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                          <MessageSquare size={14} className="text-emerald-600" /> WhatsApp
                        </a>
                      )}
                    </div>

                    {vendorDetail.recentMeals.length > 0 && (
                      <>
                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                          <UtensilsCrossed size={14} className="text-emerald-600" />
                          Popular meals
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          {vendorDetail.recentMeals.map((meal) => (
                            <div
                              key={meal.id}
                              className="rounded-xl border border-gray-100 bg-white overflow-hidden"
                            >
                              {meal.imageUrl ? (
                                <img
                                  src={meal.imageUrl}
                                  alt={meal.name}
                                  className="w-full h-20 object-cover"
                                />
                              ) : (
                                <div className="w-full h-20 bg-emerald-50 flex items-center justify-center">
                                  <UtensilsCrossed size={20} className="text-emerald-400" />
                                </div>
                              )}
                              <div className="p-2">
                                <p className="text-xs font-bold text-gray-900 line-clamp-1">{meal.name}</p>
                                <p className="text-[11px] text-gray-500">{formatCurrency(meal.price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <a
                      href={`/dashboard/user/meals?vendor=${vendorDetail.id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:shadow-lg transition"
                    >
                      View Full Menu <ArrowRight size={15} />
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}