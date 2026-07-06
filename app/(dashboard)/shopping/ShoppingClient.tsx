'use client'

import { useState, useMemo, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, CheckCircle2, Trash2, Smartphone, Info, ShieldCheck, Loader2, Circle, AlertCircle,
  RefreshCw, Sparkles, PackageCheck, ListChecks, Truck, ArrowRight, Wallet, Plus, MapPin,
  UtensilsCrossed, Store, BadgePercent, ShieldAlert, Search, X, ShoppingBag, Clock, Copy, Check,
  Phone, Edit3,
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  ShoppingPageData, ShoppingList, ShoppingListItem, RecommendedMeal,
  ensureShoppingListAction, addShoppingItemAction, addMealIngredientsAction,
  toggleItemAction, removeItemAction, fetchShoppingPageData,
  checkoutShoppingListAction, fetchTransactionStatusAction, clearPaidItemsAction,
  addMealToCartAction,
} from './actions'

// ✅ Cart item type (matches localStorage)
type LocalStorageCartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  vendorId: string
  vendorName: string
}

// Helper to format Kenyan phone for display
function formatKenyanPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) {
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return phone
}

// ──  Phone Selection Component ──────────────────────────
function PhoneSelector({
  savedPhone,
  selectedPhone,
  onChange,
  disabled,
}: {
  savedPhone: string | null
  selectedPhone: string
  onChange: (phone: string) => void
  disabled?: boolean
}) {
  const [useDifferent, setUseDifferent] = useState(!savedPhone)
  const [customPhone, setCustomPhone] = useState(savedPhone ? '' : selectedPhone)

  // Sync changes to parent
  useEffect(() => {
    if (useDifferent) {
      onChange(customPhone)
    } else if (savedPhone) {
      onChange(savedPhone)
    }
  }, [useDifferent, customPhone, savedPhone, onChange])

  return (
    <div className="space-y-3">
      {savedPhone && (
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${
          !useDifferent
            ? 'border-emerald-300 bg-emerald-50/30'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        }`}>
          <input
            type="radio"
            name="phone-choice"
            checked={!useDifferent}
            onChange={() => setUseDifferent(false)}
            disabled={disabled}
            className="mt-1 accent-emerald-500"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Phone size={12} className={!useDifferent ? 'text-emerald-300' : 'text-emerald-100/60'} />
              <p className={`text-sm font-black ${!useDifferent ? 'text-white' : 'text-emerald-100/80'}`}>
                Use saved number
              </p>
            </div>
            <p className={`text-xs mt-0.5 font-mono ${!useDifferent ? 'text-emerald-100' : 'text-emerald-100/50'}`}>
              {formatKenyanPhoneDisplay(savedPhone)}
            </p>
          </div>
        </label>
      )}

      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${
        useDifferent
          ? 'border-emerald-300 bg-emerald-50/30'
          : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}>
        <input
          type="radio"
          name="phone-choice"
          checked={useDifferent}
          onChange={() => setUseDifferent(true)}
          disabled={disabled}
          className="mt-1 accent-emerald-500"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Edit3 size={12} className={useDifferent ? 'text-emerald-300' : 'text-emerald-100/60'} />
            <p className={`text-sm font-black ${useDifferent ? 'text-white' : 'text-emerald-100/80'}`}>
              Use a different number
            </p>
          </div>
          {useDifferent && (
            <input
              type="tel"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="07XX XXX XXX"
              disabled={disabled}
              autoFocus={!savedPhone}
              className="w-full mt-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          )}
        </div>
      </label>
    </div>
  )
}

// ── Payment Status Modal ──────────────────────────────────
function PaymentStatusModal({
  reference,
  amount,
  onClose,
  onSuccess,
}: {
  reference: string
  amount: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [status, setStatus] = useState<string>('processing')
  const [statusMessage, setStatusMessage] = useState<string>('Check your phone for the M-Pesa prompt.')
  const [mpesaReceipt, setMpesaReceipt] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const poll = async () => {
      const data = await fetchTransactionStatusAction(reference)
      if (data) {
        setStatus(data.status)
        if (data.status_message) setStatusMessage(data.status_message)
        if (data.mpesa_receipt) setMpesaReceipt(data.mpesa_receipt)

        if (['success', 'failed', 'cancelled', 'expired'].includes(data.status)) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (timerRef.current) clearInterval(timerRef.current)
          if (data.status === 'success') {
            setTimeout(onSuccess, 2000)
          }
        }
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [reference, onSuccess])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const isProcessing = ['pending', 'processing'].includes(status)
  const isSuccess = status === 'success'
  const isFailed = ['failed', 'cancelled', 'expired'].includes(status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className={`px-6 py-8 text-center ${
          isSuccess ? 'bg-emerald-50' : isFailed ? 'bg-red-50' : 'bg-amber-50'
        }`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
            {isProcessing && <Smartphone size={28} className="text-amber-600 animate-pulse" />}
            {isSuccess && <CheckCircle2 size={28} className="text-emerald-600" />}
            {isFailed && <X size={28} className="text-red-600" />}
          </div>

          <h2 className="text-xl font-black text-slate-900">
            {isProcessing && 'Check your phone'}
            {isSuccess && 'Payment successful! 🎉'}
            {isFailed && 'Payment failed'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{statusMessage}</p>
          {isProcessing && <p className="mt-2 text-xs font-bold text-slate-500">Waiting… {elapsed}s</p>}
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-xs font-bold text-slate-500 uppercase">Amount</span>
            <span className="text-lg font-black text-slate-900">KES {amount.toLocaleString()}</span>
          </div>

          {mpesaReceipt && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-bold text-slate-500 uppercase">M-Pesa Receipt</span>
              <span className="text-sm font-mono font-bold text-[#126e3d]">{mpesaReceipt}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Reference</span>
            <button
              onClick={handleCopy}
              className="text-xs font-mono font-bold text-slate-700 hover:text-[#126e3d] inline-flex items-center gap-1.5"
            >
              {reference}
              {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            </button>
          </div>

          {isProcessing && elapsed > 30 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 mt-3">
              <Clock size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Still waiting? Check your phone for the M-Pesa prompt, or ensure you have network coverage.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-gray-100">
          {isSuccess && (
            <button
              onClick={onSuccess}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#1A5C3A] py-3 text-sm font-black uppercase text-white shadow-md transition hover:shadow-lg"
            >
              <Sparkles size={14} /> Continue
              <ArrowRight size={14} />
            </button>
          )}

          {isFailed && (
            <button
              onClick={onClose}
              className="w-full rounded-xl border-2 border-slate-200 py-3 text-sm font-black uppercase text-slate-700"
            >
              Try Again
            </button>
          )}

          {isProcessing && (
            <button
              onClick={onClose}
              className="w-full rounded-xl border-2 border-slate-200 py-3 text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Close (payment will continue)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────
export default function ShoppingClient({ initialData }: { initialData: ShoppingPageData }) {
  const [list, setList] = useState<ShoppingList | null>(initialData.list)
  const [addOns, setAddOns] = useState(initialData.addOns)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [addingItemId, setAddingItemId] = useState<string | null>(null)

  // 🆕 Phone state — uses saved phone by default
  const savedPhone = initialData.addOns.profile?.phone ?? null
  const [paymentPhone, setPaymentPhone] = useState<string>(savedPhone ?? '')
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)

  const [activeTransactionRef, setActiveTransactionRef] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ✅ NEW: LocalStorage cart state
  const [localStorageCart, setLocalStorageCart] = useState<LocalStorageCartItem[]>([])

  const items = useMemo(() => list?.shopping_list_items || [], [list])
  
  // ✅ UPDATED: Cart items from database
  const dbCartItems = useMemo(() => items.filter((item) => item.is_cart_item), [items])
  const shoppingItems = useMemo(() => items.filter((item) => !item.is_cart_item), [items])

  // ✅ UPDATED: Combined cart (localStorage + database)
  const cartItems = useMemo(() => {
    // Convert localStorage cart to ShoppingListItem format for display
    const localStorageAsShoppingItems: ShoppingListItem[] = localStorageCart.map((item) => ({
      id: `local-${item.id}`,
      ingredient_name: item.name,
      name: item.name,
      quantity: String(item.quantity),
      unit: 'meal',
      estimated_price: item.price,
      is_checked: false,
      is_cart_item: true,
      meal_id: item.id,
      vendor_id: item.vendorId,
      vendor_name: item.vendorName,
    }))

    return [...dbCartItems, ...localStorageAsShoppingItems]
  }, [dbCartItems, localStorageCart])

  const checkedItems = useMemo(() => shoppingItems.filter((item) => item.is_checked).length, [shoppingItems])
  const remainingItems = Math.max(shoppingItems.length - checkedItems, 0)
  const completionPercentage = useMemo(
    () => (shoppingItems.length === 0 ? 0 : Math.round((checkedItems / shoppingItems.length) * 100)),
    [checkedItems, shoppingItems.length]
  )

  // 🆕 Totals WITHOUT delivery fee
  const totals = useMemo(() => {
    const cartTotal = cartItems.reduce((sum, item) => sum + (Number(item.estimated_price) || 0), 0)
    const shoppingTotal = shoppingItems.reduce((sum, item) => sum + (Number(item.estimated_price) || 0), 0)
    const itemsTotal = cartTotal + shoppingTotal
    return { cartTotal, shoppingTotal, itemsTotal, grandTotal: itemsTotal }
  }, [cartItems, shoppingItems])

  const preferenceChips = useMemo(() => {
    const profile = addOns.profile
    return [
      ...(profile?.dietary_preferences ?? []),
      ...(profile?.cuisine_preferences ?? []),
      ...(profile?.meal_types ?? []),
      profile?.budget_range,
      profile?.location_city || profile?.location,
    ].filter(Boolean).slice(0, 8) as string[]
  }, [addOns.profile])

  // ✅ NEW: Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('pikaplan-cart')
      if (storedCart) {
        const parsed = JSON.parse(storedCart) as LocalStorageCartItem[]
        setLocalStorageCart(parsed)
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e)
    }
  }, [])

  // ✅ NEW: Sync localStorage cart to database on mount (if user is authenticated)
  useEffect(() => {
    const syncCartToDatabase = async () => {
      if (localStorageCart.length === 0 || !list) return

      try {
        // Sync each localStorage item to database
        for (const item of localStorageCart) {
          // Check if item already exists in database
          const exists = dbCartItems.some((dbItem) => dbItem.meal_id === item.id)
          if (!exists) {
            // Add to database
            await addMealToCartAction({
              id: item.id,
              title: item.name,
              price: item.price,
              source: 'vendor_meal',
              vendorId: item.vendorId,
              vendorName: item.vendorName,
            })
          }
        }

        // Clear localStorage after syncing
        localStorage.removeItem('pikaplan-cart')
        setLocalStorageCart([])
        
        // Refresh list to show synced items
        const data = await fetchShoppingPageData()
        setList(data.list)
      } catch (err) {
        console.error('Failed to sync cart to database:', err)
      }
    }

    syncCartToDatabase()
  }, [list]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!error && !successMessage) return
    const t = setTimeout(() => {
      setError(null)
      setSuccessMessage(null)
    }, 5000)
    return () => clearTimeout(t)
  }, [error, successMessage])

  const handleRefresh = async () => {
    startTransition(async () => {
      const data = await fetchShoppingPageData()
      setList(data.list)
      setAddOns(data.addOns)
    })
  }

  const ensureList = async () => {
    if (list) return list
    const newList = await ensureShoppingListAction()
    setList({ ...newList, shopping_list_items: newList.shopping_list_items || [] })
    return newList
  }

  const addShoppingItem = async (item: { id: string; name: string; quantity?: string; unit?: string; estimatedPrice?: number }) => {
    setAddingItemId(item.id)
    setError(null)
    setSuccessMessage(null)
    try {
      const activeList = await ensureList()
      const tempId = crypto.randomUUID()
      const optimisticItem: ShoppingListItem = {
        id: tempId,
        ingredient_name: item.name,
        name: item.name,
        quantity: item.quantity || '1',
        unit: item.unit || null,
        estimated_price: item.estimatedPrice || 0,
        is_checked: false,
        is_cart_item: false,
      }
      setList((prev) => prev ? { ...prev, shopping_list_items: [...(prev.shopping_list_items ?? []), optimisticItem] } : prev)
      const savedItem = await addShoppingItemAction(activeList.id, item)
      setList((prev) => prev ? { ...prev, shopping_list_items: (prev.shopping_list_items ?? []).map(i => i.id === tempId ? savedItem : i) } : prev)
      setSuccessMessage(`${item.name} added to your shopping list.`)
    } catch (err: any) { setError(err.message) } finally { setAddingItemId(null) }
  }

  const addMealToCart = async (meal: RecommendedMeal) => {
    setAddingItemId(meal.id)
    setError(null)
    setSuccessMessage(null)
    try {
      const saved = await addMealToCartAction({
        id: meal.id,
        title: meal.title,
        price: meal.price || 0,
        source: meal.source,
        vendorId: meal.vendorId,
        vendorName: meal.vendorName,
      })
      setList((prev) => prev ? { ...prev, shopping_list_items: [...(prev.shopping_list_items ?? []), saved] } : prev)
      setSuccessMessage(`${meal.title} added to cart. Ready to checkout!`)
    } catch (err: any) { setError(err.message) } finally { setAddingItemId(null) }
  }

  const addMealIngredients = async (meal: RecommendedMeal) => {
    setAddingItemId(meal.id)
    setError(null)
    setSuccessMessage(null)
    try {
      const activeList = await ensureList()
      const savedItems = await addMealIngredientsAction(activeList.id, meal.id, meal.source, meal.title, meal.price)
      setList((prev) => prev ? { ...prev, shopping_list_items: [...(prev.shopping_list_items ?? []), ...(Array.isArray(savedItems) ? savedItems : [savedItems])] } : prev)
      setSuccessMessage(`${meal.title} ingredients added.`)
    } catch (err: any) { setError(err.message) } finally { setAddingItemId(null) }
  }

  const toggleItem = async (item: ShoppingListItem) => {
    const next = !item.is_checked
    setList((prev) => prev ? { ...prev, shopping_list_items: (prev.shopping_list_items || []).map((i) => i.id === item.id ? { ...i, is_checked: next } : i) } : prev)
    try { await toggleItemAction(item.id, next) } catch (err: any) { setError(err.message); handleRefresh() }
  }

  const removeItem = async (itemId: string) => {
    const previous = list
    setList((prev) => prev ? { ...prev, shopping_list_items: (prev.shopping_list_items || []).filter((item) => item.id !== itemId) } : prev)
    try { await removeItemAction(itemId) } catch (err: any) { setError(err.message); setList(previous) }
  }

  // 🆕 Initiate checkout — opens the form if not already shown
  const handleStartCheckout = () => {
    if (!list || totals.grandTotal <= 0) {
      setError('Your shopping list is empty.')
      return
    }
    setShowCheckoutForm(true)
  }

  // 🆕 Actual checkout submission
  const handleCheckout = async () => {
    if (!list || totals.grandTotal <= 0) {
      setError('Your shopping list is empty.')
      return
    }

    if (!paymentPhone || paymentPhone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid phone number.')
      return
    }

    setIsPaying(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await checkoutShoppingListAction({
        listId: list.id,
        phone: paymentPhone,
        amount: totals.grandTotal,
      })

      if (!result.success) {
        setError(result.error)
        setIsPaying(false)
        return
      }

      setActiveTransactionRef(result.reference)
      setSuccessMessage(result.message)
      setShowCheckoutForm(false)
      setIsPaying(false)
    } catch (err: any) {
      setError(err.message)
      setIsPaying(false)
    }
  }

  const handlePaymentSuccess = async () => {
    if (!list) return
    try {
      await clearPaidItemsAction(list.id)
      const data = await fetchShoppingPageData()
      setList(data.list)
      setAddOns(data.addOns)
      setActiveTransactionRef(null)
      setSuccessMessage('🎉 Your order is on its way. Check your dashboard for tracking.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] font-poppins text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8 overflow-hidden rounded-[32px] bg-[#0a2d1d] text-white shadow-xl">
          <div className="relative p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(50,205,50,0.18),transparent_30%),radial-gradient(circle_at_90%_70%,rgba(249,115,22,0.22),transparent_35%)]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur">
                  <ShoppingCart className="h-4 w-4 text-[#32CD32]" /> Smart Shopping
                  {cartItems.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f97316] text-[10px] font-black uppercase ml-1">
                      <ShoppingBag size={10} /> {cartItems.length} in cart
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">Smart Shopping List</h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/75 md:text-base">
                  Add ingredients or order meals directly from vendors. Pay securely with M-Pesa via Payhero.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleRefresh} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/15">
                  <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} /> Refresh
                </button>
                <Link href="/meal-generator" className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#ea580c]">
                  <Sparkles size={16} /> Generate Plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Banners */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle size={16} /><span className="text-sm font-semibold">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 size={16} /><span className="text-sm font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><ShoppingBag size={20} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{cartItems.length}</p>
                <p className="text-sm font-bold text-gray-500">In cart (ready to order)</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ListChecks size={20} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{shoppingItems.length}</p>
                <p className="text-sm font-bold text-gray-500">Shopping items</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Wallet size={20} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">KES {totals.grandTotal.toFixed(0)}</p>
                <p className="text-sm font-bold text-gray-500">Total</p>
              </div>
            </div>
          </div>
        </section>

        {/* Progress */}
        {shoppingItems.length > 0 && (
          <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black uppercase tracking-wide text-slate-700">Shopping progress</p>
              <p className="text-sm font-black text-emerald-600">{completionPercentage}% complete</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] transition-all" style={{ width: `${completionPercentage}%` }} />
            </div>
          </section>
        )}

        {/* Smart Add-ons */}
        <section className="mb-8 rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-[#126e3d]">
                <Sparkles className="h-4 w-4" /> Smart Add-ons
              </div>
              <h2 className="text-2xl font-black text-slate-950">Preference-aware suggestions</h2>
            </div>
            <button onClick={handleRefresh} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-black text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50">
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {preferenceChips.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {preferenceChips.map((chip) => (
                <span key={chip} className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-black text-[#126e3d]">{chip}</span>
              ))}
            </div>
          )}

          {isPending && !list ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-3xl bg-[#f8faf8]">
              <Loader2 className="h-6 w-6 animate-spin text-[#126e3d]" />
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
                  <UtensilsCrossed className="h-4 w-4 text-[#126e3d]" /> Recommended Meals
                </h3>
                {addOns.recommendedMeals.length === 0 ? (
                  <div className="rounded-3xl bg-[#f8faf8] p-6 text-sm font-semibold text-gray-500">No recommendations yet.</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {addOns.recommendedMeals.map((meal) => (
                      <div key={`${meal.source}-${meal.id}`} className="rounded-3xl border border-gray-100 bg-[#f8faf8] p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-black text-slate-900">{meal.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-gray-500">{meal.description}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-[#126e3d]">
                            {meal.source === 'vendor_meal' ? 'Vendor' : 'Recipe'}
                          </span>
                        </div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {meal.matchReasons.map((reason) => (
                            <span key={reason} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-gray-600">
                              {reason === 'Near you' && <MapPin className="h-3 w-3 text-[#f97316]" />}
                              {reason === 'Allergy-safe' && <ShieldAlert className="h-3 w-3 text-[#126e3d]" />}
                              {reason === 'Budget-friendly' && <BadgePercent className="h-3 w-3 text-[#f97316]" />}
                              {reason}
                            </span>
                          ))}
                        </div>
                        <div className="mb-4 space-y-1 text-xs font-semibold text-gray-500">
                          {meal.vendorName && (
                            <p className="flex items-center gap-2"><Store className="h-3.5 w-3.5 text-[#126e3d]" /> {meal.vendorName}</p>
                          )}
                          {meal.price > 0 && <p>KES {meal.price.toFixed(0)}</p>}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          {meal.source === 'vendor_meal' && meal.price > 0 ? (
                            <>
                              <button
                                onClick={() => addMealToCart(meal)}
                                disabled={addingItemId === meal.id}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#f97316] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#ea580c] disabled:opacity-60"
                              >
                                {addingItemId === meal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                                Order Meal
                              </button>
                              <button
                                onClick={() => addMealIngredients(meal)}
                                disabled={addingItemId === meal.id}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 hover:border-emerald-200 transition disabled:opacity-60"
                              >
                                <ListChecks className="h-3.5 w-3.5" />
                                Add Ingredients
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addMealIngredients(meal)}
                              disabled={addingItemId === meal.id}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#126e3d] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#0f5c33] disabled:opacity-60"
                            >
                              {addingItemId === meal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              Add ingredients
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
                  <Search className="h-4 w-4 text-[#f97316]" /> Missing ingredients
                </h3>
                {addOns.suggestedIngredients.length === 0 ? (
                  <div className="rounded-3xl bg-[#fff7ed] p-6 text-sm font-semibold text-orange-800">No missing ingredients found.</div>
                ) : (
                  <div className="space-y-3">
                    {addOns.suggestedIngredients.map((ingredient) => (
                      <div key={ingredient.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-gray-900">{ingredient.name}</p>
                            <p className="text-xs font-semibold text-gray-500">{ingredient.quantity} {ingredient.unit} · From {ingredient.sourceMeal}</p>
                          </div>
                          <button
                            onClick={() => addShoppingItem({ id: ingredient.id, name: ingredient.name, quantity: ingredient.quantity, unit: ingredient.unit, estimatedPrice: ingredient.estimatedPrice })}
                            disabled={addingItemId === ingredient.id}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#f97316] px-3 py-2 text-xs font-black text-white transition hover:bg-[#ea580c] disabled:opacity-60"
                          >
                            {addingItemId === ingredient.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            {/* Cart Items */}
            {cartItems.length > 0 && (
              <div className="rounded-3xl border-2 border-[#f97316]/20 bg-orange-50/30 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#9a3412]">
                    <ShoppingBag size={14} /> Cart Items
                  </h3>
                  <span className="text-xs font-black text-[#9a3412]">
                    {cartItems.length} ready to order
                  </span>
                </div>
                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const label = item.ingredient_name || item.item_name || item.name || 'Item'
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f97316] flex-shrink-0">
                            <UtensilsCrossed size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 truncate">{label}</p>
                            <p className="text-xs font-semibold text-gray-500 truncate">
                              {item.vendor_name && <span>From {item.vendor_name} · </span>}
                              KES {Number(item.estimated_price || 0).toFixed(0)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex-shrink-0 rounded-xl p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Shopping Items */}
            {shoppingItems.length === 0 && cartItems.length === 0 ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                  <ShoppingCart size={30} className="text-emerald-500" />
                </div>
                <p className="text-lg font-black text-gray-900">No shopping items yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-gray-500">
                  Browse recommendations above to add meals or ingredients to your list.
                </p>
                <Link href="/meal-generator" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#126e3d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0f5c33]">
                  Generate Meal Plan <ArrowRight size={16} />
                </Link>
              </div>
            ) : shoppingItems.length > 0 ? (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-700 px-1">
                  <ListChecks size={14} className="text-emerald-600" /> Shopping Items
                </h3>
                {shoppingItems.map((item) => {
                  const label = item.ingredient_name || item.item_name || item.name || 'Item'
                  const qty = [item.quantity, item.unit].filter(Boolean).join(' ')
                  return (
                    <div key={item.id} className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                      <div className="flex min-w-0 items-center gap-4">
                        <button
                          onClick={() => toggleItem(item)}
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border-2 border-emerald-100 transition-colors hover:border-emerald-500"
                          aria-label={item.is_checked ? 'Mark unchecked' : 'Mark checked'}
                        >
                          {item.is_checked ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-gray-300" />}
                        </button>
                        <div className="min-w-0">
                          <p className={`truncate font-black ${item.is_checked ? 'text-emerald-700 line-through' : 'text-gray-800'}`}>{label}</p>
                          <p className="text-xs font-semibold text-gray-500">{qty || 'Qty not set'} · KES {Number(item.estimated_price || 0).toFixed(0)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 rounded-xl p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </section>

          {/* Checkout Sidebar */}
          <aside className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] bg-emerald-950 p-8 text-white shadow-2xl shadow-emerald-950/20">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10"><ShoppingCart size={120} /></div>
              <h3 className="mb-6 text-xl font-black">Order Summary</h3>

              {/* 🆕 Summary — no delivery fee */}
              <div className="mb-8 space-y-4">
                {cartItems.length > 0 && (
                  <div className="flex justify-between text-sm text-emerald-100/70">
                    <span>Cart ({cartItems.length} item{cartItems.length === 1 ? '' : 's'})</span>
                    <span>KES {totals.cartTotal.toFixed(0)}</span>
                  </div>
                )}
                {shoppingItems.length > 0 && (
                  <div className="flex justify-between text-sm text-emerald-100/70">
                    <span>Ingredients ({shoppingItems.length})</span>
                    <span>KES {totals.shoppingTotal.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-4 text-xl font-black">
                  <span>Total</span>
                  <span>KES {totals.grandTotal.toFixed(0)}</span>
                </div>
              </div>

              {/* 🆕 Checkout flow */}
              {!showCheckoutForm ? (
                <button
                  onClick={handleStartCheckout}
                  disabled={isPaying || totals.grandTotal <= 0}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-widest text-emerald-950 transition-all hover:bg-orange-400 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Smartphone size={18} />
                  Pay via M-Pesa
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-emerald-100 flex items-center gap-1.5">
                      <Phone size={12} /> Payment phone
                    </p>
                    <button
                      onClick={() => setShowCheckoutForm(false)}
                      className="rounded-lg p-1 text-emerald-100/50 hover:text-white"
                      aria-label="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <PhoneSelector
                    savedPhone={savedPhone}
                    selectedPhone={paymentPhone}
                    onChange={setPaymentPhone}
                    disabled={isPaying}
                  />

                  <button
                    onClick={handleCheckout}
                    disabled={isPaying || !paymentPhone || paymentPhone.replace(/[^0-9]/g, '').length < 10}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-widest text-emerald-950 transition-all hover:bg-orange-400 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPaying ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}
                    {isPaying ? 'Processing...' : `Send STK Push · KES ${totals.grandTotal.toFixed(0)}`}
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-100/45">
                <ShieldCheck size={12} /> Powered by Payhero · Secure
              </div>
            </div>

            <div className="flex gap-4 rounded-3xl border border-orange-100 bg-orange-50 p-6">
              <Info className="flex-shrink-0 text-orange-500" size={20} />
              <p className="text-xs font-semibold leading-relaxed text-orange-800">
                Vendor meals are ordered directly. Shopping ingredients are for your own grocery run.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Truck size={18} /></div>
                <div>
                  <p className="text-sm font-black text-gray-900">Smart delivery grouping</p>
                  <p className="text-xs font-semibold text-gray-500">Coming soon</p>
                </div>
              </div>
              <p className="text-xs font-medium leading-relaxed text-gray-500">
                Pika Plan will group cart items by nearby vendors to reduce delivery cost and improve freshness.
              </p>
            </div>
          </aside>
        </div>

        {/* Payment Status Modal */}
        {activeTransactionRef && (
          <PaymentStatusModal
            reference={activeTransactionRef}
            amount={totals.grandTotal}
            onClose={() => setActiveTransactionRef(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}