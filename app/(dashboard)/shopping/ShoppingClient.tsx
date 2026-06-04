'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, CheckCircle2, Trash2, Smartphone, Info, ShieldCheck, Loader2, Circle, AlertCircle,
  RefreshCw, Sparkles, PackageCheck, ListChecks, Truck, ArrowRight, Wallet, Plus, MapPin,
  UtensilsCrossed, Store, BadgePercent, ShieldAlert, Search, X,
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import { 
  ShoppingPageData, ShoppingList, ShoppingListItem, RecommendedMeal, 
  ensureShoppingListAction, addShoppingItemAction, addMealIngredientsAction, 
  toggleItemAction, removeItemAction, fetchShoppingPageData
} from './actions'

export default function ShoppingClient({ initialData }: { initialData: ShoppingPageData }) {
  const [list, setList] = useState<ShoppingList | null>(initialData.list)
  const [addOns, setAddOns] = useState(initialData.addOns)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [addingItemId, setAddingItemId] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [isPending, startTransition] = useTransition()

  const items = useMemo(() => list?.shopping_list_items || [], [list])
  const checkedItems = useMemo(() => items.filter((item) => item.is_checked).length, [items])
  const remainingItems = Math.max(items.length - checkedItems, 0)
  const completionPercentage = useMemo(() => items.length === 0 ? 0 : Math.round((checkedItems / items.length) * 100), [checkedItems, items.length])

  const totals = useMemo(() => {
    const itemsTotal = items.reduce((sum, item) => sum + (Number(item.estimated_price) || 0), 0)
    const delivery = itemsTotal > 0 ? 200 : 0
    return { itemsTotal, delivery, grandTotal: itemsTotal + delivery }
  }, [items])

  const preferenceChips = useMemo(() => {
    const profile = addOns.profile
    return [...(profile?.dietary_preferences ?? []), ...(profile?.cuisine_preferences ?? []), ...(profile?.meal_types ?? []), profile?.budget_range, profile?.location_city || profile?.location].filter(Boolean).slice(0, 8) as string[]
  }, [addOns.profile])

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
    setList({ ...newList, shopping_list_items: [] })
    return newList
  }

  const addShoppingItem = async (item: { id: string; name: string; quantity?: string; unit?: string; estimatedPrice?: number }) => {
    setAddingItemId(item.id); setError(null); setSuccessMessage(null)
    try {
      const activeList = await ensureList()
      const tempId = crypto.randomUUID()
      const optimisticItem: ShoppingListItem = { id: tempId, ingredient_name: item.name, name: item.name, quantity: item.quantity || '1', unit: item.unit || null, estimated_price: item.estimatedPrice || 0, is_checked: false }
      
      setList((prev) => prev ? { ...prev, shopping_list_items: [...(prev.shopping_list_items ?? []), optimisticItem] } : prev)
      const savedItem = await addShoppingItemAction(activeList.id, item)
      
      setList((prev) => prev ? { ...prev, shopping_list_items: (prev.shopping_list_items ?? []).map(i => i.id === tempId ? savedItem : i) } : prev)
      setSuccessMessage(`${item.name} added to your shopping list.`)
    } catch (err: any) { setError(err.message) } finally { setAddingItemId(null) }
  }

  const addMealIngredients = async (meal: RecommendedMeal) => {
    setAddingItemId(meal.id); setError(null); setSuccessMessage(null)
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

  const handleMpesaCheckout = async () => {
    if (!list || totals.grandTotal <= 0) { setError('Your shopping list is empty.'); return }
    if (!phoneNumber || phoneNumber.replace(/[^0-9]/g, '').length < 10) { setShowPhoneInput(true); return }
    setIsPaying(true); setError(null); setSuccessMessage(null)
    try {
      const res = await fetch('/api/mpesa/stkpush', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: totals.grandTotal, phone: phoneNumber.replace(/[^0-9]/g, ''), orderId: list.id }) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Payment initiation failed')
      setSuccessMessage('STK Push sent! Check your phone.')
      setShowPhoneInput(false)
    } catch (err: any) { setError(err.message) } finally { setIsPaying(false) }
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] font-poppins text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-[32px] bg-[#0a2d1d] text-white shadow-xl">
          <div className="relative p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(50,205,50,0.18),transparent_30%),radial-gradient(circle_at_90%_70%,rgba(249,115,22,0.22),transparent_35%)]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur"><ShoppingCart className="h-4 w-4 text-[#32CD32]" /> Smart Shopping</div>
                <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">Smart Shopping List</h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white/75 md:text-base">Automatically calculated from your current meal plan, with market-aware pricing and fast checkout.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleRefresh} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/15"><RefreshCw size={16} className={isPending ? 'animate-spin' : ''} /> Refresh</button>
                <Link href="/meal-generator" className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#ea580c]"><Sparkles size={16} /> Generate Plan</Link>
              </div>
            </div>
          </div>
        </section>

        {error && <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700"><AlertCircle size={16} /><span className="text-sm font-semibold">{error}</span></div>}
        {successMessage && <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700"><CheckCircle2 size={16} /><span className="text-sm font-semibold">{successMessage}</span></div>}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ListChecks size={20} /></div><div><p className="text-2xl font-black text-slate-900">{items.length}</p><p className="text-sm font-bold text-gray-500">Total items</p></div></div></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><PackageCheck size={20} /></div><div><p className="text-2xl font-black text-slate-900">{remainingItems}</p><p className="text-sm font-bold text-gray-500">Remaining</p></div></div></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Wallet size={20} /></div><div><p className="text-2xl font-black text-slate-900">KES {totals.grandTotal.toFixed(0)}</p><p className="text-sm font-bold text-gray-500">Estimated total</p></div></div></div>
        </section>

        {items.length > 0 && (
          <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><p className="text-sm font-black uppercase tracking-wide text-slate-700">Shopping progress</p><p className="text-sm font-black text-emerald-600">{completionPercentage}% complete</p></div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] transition-all" style={{ width: `${completionPercentage}%` }} /></div>
          </section>
        )}

        <section className="mb-8 rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-[#126e3d]"><Sparkles className="h-4 w-4" /> Smart Add-ons</div>
              <h2 className="text-2xl font-black text-slate-950">Preference-aware suggestions</h2>
            </div>
            <button onClick={handleRefresh} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-black text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50"><RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} /> Refresh</button>
          </div>

          {preferenceChips.length > 0 && <div className="mb-6 flex flex-wrap gap-2">{preferenceChips.map((chip) => (<span key={chip} className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-black text-[#126e3d]">{chip}</span>))}</div>}

          {isPending && !list ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-3xl bg-[#f8faf8]"><Loader2 className="h-6 w-6 animate-spin text-[#126e3d]" /></div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700"><UtensilsCrossed className="h-4 w-4 text-[#126e3d]" /> Recommended Meals</h3>
                {addOns.recommendedMeals.length === 0 ? <div className="rounded-3xl bg-[#f8faf8] p-6 text-sm font-semibold text-gray-500">No recommendations yet.</div> : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {addOns.recommendedMeals.map((meal) => (
                      <div key={`${meal.source}-${meal.id}`} className="rounded-3xl border border-gray-100 bg-[#f8faf8] p-5">
                        <div className="mb-3 flex items-start justify-between gap-3"><div><p className="text-base font-black text-slate-900">{meal.title}</p><p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-gray-500">{meal.description}</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-[#126e3d]">{meal.source === 'vendor_meal' ? 'Vendor' : 'Recipe'}</span></div>
                        <div className="mb-3 flex flex-wrap gap-2">{meal.matchReasons.map((reason) => (<span key={reason} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-gray-600">{reason === 'Near you' && <MapPin className="h-3 w-3 text-[#f97316]" />}{reason === 'Allergy-safe' && <ShieldAlert className="h-3 w-3 text-[#126e3d]" />}{reason === 'Budget-friendly' && <BadgePercent className="h-3 w-3 text-[#f97316]" />}{reason}</span>))}</div>
                        <div className="mb-4 space-y-1 text-xs font-semibold text-gray-500">{meal.vendorName && <p className="flex items-center gap-2"><Store className="h-3.5 w-3.5 text-[#126e3d]" /> {meal.vendorName}</p>}{meal.price > 0 && <p>KES {meal.price.toFixed(0)}</p>}</div>
                        <button onClick={() => addMealIngredients(meal)} disabled={addingItemId === meal.id} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#126e3d] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#0f5c33] disabled:opacity-60">{addingItemId === meal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add items</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700"><Search className="h-4 w-4 text-[#f97316]" /> Missing ingredients</h3>
                {addOns.suggestedIngredients.length === 0 ? <div className="rounded-3xl bg-[#fff7ed] p-6 text-sm font-semibold text-orange-800">No missing ingredients found.</div> : (
                  <div className="space-y-3">
                    {addOns.suggestedIngredients.map((ingredient) => (
                      <div key={ingredient.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-black text-gray-900">{ingredient.name}</p><p className="text-xs font-semibold text-gray-500">{ingredient.quantity} {ingredient.unit} · From {ingredient.sourceMeal}</p></div>
                          <button onClick={() => addShoppingItem({ id: ingredient.id, name: ingredient.name, quantity: ingredient.quantity, unit: ingredient.unit, estimatedPrice: ingredient.estimatedPrice })} disabled={addingItemId === ingredient.id} className="inline-flex items-center gap-1 rounded-xl bg-[#f97316] px-3 py-2 text-xs font-black text-white transition hover:bg-[#ea580c] disabled:opacity-60">{addingItemId === ingredient.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add</button>
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
            {items.length === 0 ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50"><ShoppingCart size={30} className="text-emerald-500" /></div>
                <p className="text-lg font-black text-gray-900">No shopping items yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-gray-500">Generate a meal plan and Pika Plan will automatically build a smart shopping list.</p>
                <Link href="/meal-generator" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#126e3d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0f5c33]">Generate Meal Plan <ArrowRight size={16} /></Link>
              </div>
            ) : (
              items.map((item) => {
                const label = item.ingredient_name || item.item_name || item.name || 'Item'
                const qty = [item.quantity, item.unit].filter(Boolean).join(' ')
                return (
                  <div key={item.id} className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                    <div className="flex min-w-0 items-center gap-4">
                      <button onClick={() => toggleItem(item)} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border-2 border-emerald-100 transition-colors hover:border-emerald-500" aria-label={item.is_checked ? 'Mark unchecked' : 'Mark checked'}>
                        {item.is_checked ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-gray-300" />}
                      </button>
                      <div className="min-w-0">
                        <p className={`truncate font-black ${item.is_checked ? 'text-emerald-700 line-through' : 'text-gray-800'}`}>{label}</p>
                        <p className="text-xs font-semibold text-gray-500">{qty || 'Qty not set'} · KES {Number(item.estimated_price || 0).toFixed(0)}</p>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="flex-shrink-0 rounded-xl p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Remove item"><Trash2 size={18} /></button>
                  </div>
                )
              })
            )}
          </section>

          <aside className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] bg-emerald-950 p-8 text-white shadow-2xl shadow-emerald-950/20">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10"><ShoppingCart size={120} /></div>
              <h3 className="mb-6 text-xl font-black">Order Summary</h3>
              <div className="mb-8 space-y-4">
                <div className="flex justify-between text-sm text-emerald-100/70"><span>Items Total</span><span>KES {totals.itemsTotal.toFixed(0)}</span></div>
                <div className="flex justify-between text-sm text-emerald-100/70"><span>Delivery Fee</span><span>KES {totals.delivery.toFixed(0)}</span></div>
                <div className="flex justify-between border-t border-white/10 pt-4 text-xl font-black"><span>Total</span><span>KES {totals.grandTotal.toFixed(0)}</span></div>
              </div>
              {showPhoneInput ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><p className="text-sm font-bold text-emerald-100">Enter M-Pesa number</p><button onClick={() => setShowPhoneInput(false)} className="rounded-lg p-1 text-emerald-100/50 hover:text-white"><X size={16} /></button></div>
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="07XX XXX XXX" className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  <button onClick={handleMpesaCheckout} disabled={isPaying || phoneNumber.replace(/[^0-9]/g, '').length < 10} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-widest text-emerald-950 transition-all hover:bg-orange-400 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">{isPaying ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}{isPaying ? 'Processing...' : 'Send STK Push'}</button>
                </div>
              ) : (
                <button onClick={handleMpesaCheckout} disabled={isPaying || totals.grandTotal <= 0} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-widest text-emerald-950 transition-all hover:bg-orange-400 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">{isPaying ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}{isPaying ? 'Processing...' : 'Pay via M-Pesa'}</button>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-100/45"><ShieldCheck size={12} /> Secure Transaction</div>
            </div>
            <div className="flex gap-4 rounded-3xl border border-orange-100 bg-orange-50 p-6"><Info className="flex-shrink-0 text-orange-500" size={20} /><p className="text-xs font-semibold leading-relaxed text-orange-800">Vendor prep items are calculated based on your local market availability in Nairobi.</p></div>
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Truck size={18} /></div><div><p className="text-sm font-black text-gray-900">Smart delivery grouping</p><p className="text-xs font-semibold text-gray-500">Coming soon</p></div></div>
              <p className="text-xs font-medium leading-relaxed text-gray-500">Pika Plan can group shopping items by nearby vendors to reduce delivery cost and improve freshness.</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}