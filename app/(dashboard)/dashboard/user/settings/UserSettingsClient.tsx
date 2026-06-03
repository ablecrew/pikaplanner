'use client'

import { useState, useCallback, useRef, memo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, User, Bell, Shield, MapPin, Phone, Camera, Loader2,
  Save, RefreshCw, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Key,
  Trash2, AlertTriangle, Smartphone, ChevronRight, Globe, CreditCard, 
  ShieldCheck, Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { saveUserProfile, getUserProfile } from '@/app/actions/manageProfile'
import { deactivateAccount } from './actions'

// ── Types ────────────────────────────────────────────────
type TabKey = 'profile' | 'addresses' | 'payments' | 'preferences' | 'security'

type UserProfile = { id: string; fullName: string; email: string; phone: string; avatarUrl: string; city: string; address: string }
type SavedAddress = { id: string; label: string; city: string; address: string; isDefault: boolean }
type SavedPaymentMethod = { id: string; type: 'mpesa' | 'card'; label: string; detail: string; isDefault: boolean }

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'profile', label: 'Profile Settings', icon: User },
  { key: 'addresses', label: 'Delivery Addresses', icon: MapPin },
  { key: 'payments', label: 'Payment Methods', icon: CreditCard },
  { key: 'preferences', label: 'Preferences', icon: Settings },
  { key: 'security', label: 'Security & Privacy', icon: Shield },
]

const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
const selectClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900 bg-white"


// ── Memoized Components (Prevents cross-tab re-renders) ──
const Toggle = memo(function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition cursor-pointer">
      <div><p className="text-sm font-semibold text-gray-900">{label}</p>{description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}</div>
      <button type="button" onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  )
})

const ProfileTab = memo(function ProfileTab({ profile, updateProfile, uploading, avatarInputRef, handleAvatarUpload }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><User size={18} /></div><div><h3 className="font-bold text-gray-900 text-sm">Personal Information</h3><p className="text-xs text-gray-400">Update name and primary contact settings</p></div></div>
      <div className="space-y-4">
        <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Full Name *</label><input type="text" value={profile.fullName} onChange={(e) => updateProfile({ fullName: e.target.value })} placeholder="e.g. John Doe" className={inputClass} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Email Address *</label><input type="email" value={profile.email} disabled className={inputClass} /></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Primary Contact Phone</label><div className="relative"><Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><input type="tel" value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} placeholder="+254 700 000000" className={inputClass + " pl-9"} /></div></div>
        </div>
      </div>
    </div>
  )
})

const AddressesTab = memo(function AddressesTab({ savedAddresses, addressForm, setAddressForm, handleAddAddress, handleDeleteAddress }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><MapPin size={18} /></div><div><h3 className="font-bold text-gray-900 text-sm">Saved Delivery Addresses</h3><p className="text-xs text-gray-400">Manage delivery addresses for faster order checkout</p></div></div>
      {savedAddresses.length === 0 ? <p className="text-xs text-gray-400 italic py-4 text-center">No saved delivery addresses found.</p> : (
        <div className="space-y-2 mb-6">{savedAddresses.map((addr: any) => (
          <div key={addr.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><MapPin size={15} /></div><div><div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-900">{addr.label}</span>{addr.isDefault && <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-emerald-100">Default</span>}</div><p className="text-xs text-gray-500 mt-0.5">{addr.address}, {addr.city}</p></div></div>
            <button type="button" onClick={() => handleDeleteAddress(addr.id)} className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition"><Trash2 size={13} /></button>
          </div>
        ))}</div>
      )}
      <form onSubmit={handleAddAddress} className="pt-4 border-t border-gray-100 space-y-4">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Add New Address</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1 block text-[11px] font-semibold text-gray-500">Address Label</label><select value={addressForm.label} onChange={(e) => setAddressForm((p: any) => ({ ...p, label: e.target.value }))} className={selectClass}><option value="Home">Home</option><option value="Work">Work</option><option value="Other">Other</option></select></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-gray-500">City</label><input type="text" value={addressForm.city} onChange={(e) => setAddressForm((p: any) => ({ ...p, city: e.target.value }))} placeholder="Nairobi" className={inputClass} /></div>
        </div>
        <div><label className="mb-1 block text-[11px] font-semibold text-gray-500">Street / Apartment / Office Address</label><input type="text" value={addressForm.address} onChange={(e) => setAddressForm((p: any) => ({ ...p, address: e.target.value }))} placeholder="e.g. Kenyatta Ave" className={inputClass} /></div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm((p: any) => ({ ...p, isDefault: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-emerald-600" /><span className="text-xs font-semibold text-gray-700">Set as default delivery address</span></label>
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition"><Plus size={13} /> Add Saved Address</button>
      </form>
    </div>
  )
})

const PaymentsTab = memo(function PaymentsTab({ paymentMethods, paymentForm, setPaymentForm, handleAddPaymentMethod, handleDeletePaymentMethod }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CreditCard size={18} /></div><div><h3 className="font-bold text-gray-900 text-sm">Saved Payment Wallets</h3><p className="text-xs text-gray-400">Configure M-Pesa express profiles or card methods</p></div></div>
      {paymentMethods.length === 0 ? <p className="text-xs text-gray-400 italic py-4 text-center">No saved payment methods configured.</p> : (
        <div className="space-y-2 mb-6">{paymentMethods.map((pay: any) => (
          <div key={pay.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">{pay.type === 'mpesa' ? <Smartphone size={14} /> : <CreditCard size={14} />}</div><div><div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-900">{pay.label}</span>{pay.isDefault && <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-emerald-100">Default</span>}</div><p className="text-xs text-gray-500 mt-0.5 font-mono">{pay.detail}</p></div></div>
            <button type="button" onClick={() => handleDeletePaymentMethod(pay.id)} className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition"><Trash2 size={13} /></button>
          </div>
        ))}</div>
      )}
      <form onSubmit={handleAddPaymentMethod} className="pt-4 border-t border-gray-100 space-y-4">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Configure New Wallet</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setPaymentForm((p: any) => ({ ...p, type: 'mpesa' }))} className={`p-3 rounded-xl border-2 text-left transition ${paymentForm.type === 'mpesa' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}><Smartphone size={18} className={paymentForm.type === 'mpesa' ? 'text-emerald-600' : 'text-gray-400'} /><p className="text-xs font-bold text-gray-900 mt-1">M-Pesa Express</p></button>
          <button type="button" onClick={() => setPaymentForm((p: any) => ({ ...p, type: 'card' }))} className={`p-3 rounded-xl border-2 text-left transition ${paymentForm.type === 'card' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}><CreditCard size={18} className={paymentForm.type === 'card' ? 'text-emerald-600' : 'text-gray-400'} /><p className="text-xs font-bold text-gray-900 mt-1">Credit / Debit Card</p></button>
        </div>
        {paymentForm.type === 'mpesa' ? (
          <div><label className="mb-1 block text-[11px] font-semibold text-gray-500">M-Pesa Phone Number</label><input type="tel" value={paymentForm.phone} onChange={(e) => setPaymentForm((p: any) => ({ ...p, phone: e.target.value }))} placeholder="e.g. 07XXXXXXXX" className={inputClass} /></div>
        ) : (
          <div className="space-y-3">
            <div><label className="mb-1 block text-[11px] font-semibold text-gray-500">Card Number</label><input type="text" value={paymentForm.cardNumber} onChange={(e) => setPaymentForm((p: any) => ({ ...p, cardNumber: e.target.value }))} placeholder="4111 2222 3333 4444" className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-[11px] font-semibold text-gray-500">Expiry Date</label><input type="text" value={paymentForm.cardExpiry} onChange={(e) => setPaymentForm((p: any) => ({ ...p, cardExpiry: e.target.value }))} placeholder="MM/YY" className={inputClass} /></div><div><label className="mb-1 block text-[11px] font-semibold text-gray-500">CVV</label><input type="text" value={paymentForm.cardCvv} onChange={(e) => setPaymentForm((p: any) => ({ ...p, cardCvv: e.target.value }))} placeholder="123" className={inputClass} /></div></div>
          </div>
        )}
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition"><Plus size={13} /> Add Payment Method</button>
      </form>
    </div>
  )
})

const PreferencesTab = memo(function PreferencesTab({ preferences, updatePreferences }: any) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Bell size={18} /></div><div><h3 className="font-bold text-gray-900 text-sm">Notifications Alerts</h3><p className="text-xs text-gray-400">Control what alerts you receive</p></div></div>
        <div className="space-y-3">
          <Toggle checked={preferences.emailNotifications} onChange={(v) => updatePreferences({ emailNotifications: v })} label="Email Notifications" description="Receive updates and billing invoices via email" />
          <Toggle checked={preferences.smsNotifications} onChange={(v) => updatePreferences({ smsNotifications: v })} label="SMS Notifications" description="Get order statuses pushed to your phone" />
          <Toggle checked={preferences.pushNotifications} onChange={(v) => updatePreferences({ pushNotifications: v })} label="Push Alerts" description="Receive browser push notifications" />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <Toggle checked={preferences.orderAlerts} onChange={(v) => updatePreferences({ orderAlerts: v })} label="Order Tracking Alerts" />
          <Toggle checked={preferences.paymentAlerts} onChange={(v) => updatePreferences({ paymentAlerts: v })} label="Payment Receipts" />
          <Toggle checked={preferences.marketingEmails} onChange={(v) => updatePreferences({ marketingEmails: v })} label="Marketing Promos" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Globe size={18} /></div><div><h3 className="font-bold text-gray-900 text-sm">Display Preferences</h3></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Theme</label><select value={preferences.theme} onChange={(e) => updatePreferences({ theme: e.target.value })} className={selectClass}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System Default</option></select></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Language</label><select value={preferences.language} onChange={(e) => updatePreferences({ language: e.target.value })} className={selectClass}><option value="en">English</option><option value="sw">Swahili</option></select></div>
        </div>
      </div>
    </>
  )
})

const SecurityTab = memo(function SecurityTab({ security, updateSecurity, showPassword, setShowPassword, setConfirmDelete }: any) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Lock size={18} /></div><div><h3 className="font-bold text-gray-900 text-sm">Change Password</h3></div></div>
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Current Password</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={security.currentPassword} onChange={(e) => updateSecurity({ currentPassword: e.target.value })} placeholder="Enter current password" className={inputClass} /><button type="button" onClick={() => setShowPassword((p: boolean) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">New Password</label><input type={showPassword ? 'text' : 'password'} value={security.newPassword} onChange={(e) => updateSecurity({ newPassword: e.target.value })} placeholder="Enter new password" className={inputClass} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Confirm Password</label><input type={showPassword ? 'text' : 'password'} value={security.confirmPassword} onChange={(e) => updateSecurity({ confirmPassword: e.target.value })} placeholder="Confirm new password" className={inputClass} /></div>
          </div>
          {security.newPassword && security.newPassword !== security.confirmPassword && (<p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} /> Passwords do not match</p>)}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Key size={18} /></div><div><h3 className="font-bold text-gray-900 text-sm">Two-Factor Authentication</h3></div></div>
        <Toggle checked={security.twoFactorEnabled} onChange={(v) => updateSecurity({ twoFactorEnabled: v })} label="Enable Two-Factor (2FA)" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck size={18} /></div><div><h3 className="font-bold text-gray-900 text-sm">Privacy & Data Settings</h3></div></div>
        <div className="space-y-3">
          <Toggle checked={security.profileVisibility} onChange={(v) => updateSecurity({ profileVisibility: v })} label="Public Profile Visibility" />
          <Toggle checked={security.shareUsageStats} onChange={(v) => updateSecurity({ shareUsageStats: v })} label="Share Usage Statistics" />
          <Toggle checked={security.allowMerchantSearch} onChange={(v) => updateSecurity({ allowMerchantSearch: v })} label="Allow Merchant Search" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle size={18} className="text-red-600 animate-pulse" /></div><div><h3 className="font-bold text-gray-900">Danger Zone</h3></div></div>
        <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-between">
          <div><p className="text-sm font-bold text-gray-900">Deactivate Customer Account</p><p className="text-xs text-gray-600 mt-0.5">Sign out and mark account inactive.</p></div>
          <button type="button" onClick={() => setConfirmDelete(true)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition flex items-center gap-2"><Trash2 size={14} /> Deactivate</button>
        </div>
      </div>
    </>
  )
})

// ── Main Client Component ────────────────────────────────
export default function UserSettingsClient({ user, initialProfile }: { user: any, initialProfile: any }) {
  const supabase = createClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // INSTANT STATE INITIALIZATION (No useEffect fetch!)
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    fullName: initialProfile?.full_name || user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: initialProfile?.phone || '',
    avatarUrl: initialProfile?.avatar_url || user?.user_metadata?.avatar_url || '',
    city: initialProfile?.city || '',
    address: initialProfile?.address || '',
  })

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    if (initialProfile?.saved_addresses) return initialProfile.saved_addresses
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`pikaplan-addresses-${user?.id}`)
      if (stored) return JSON.parse(stored)
    }
    return initialProfile?.address ? [{ id: 'addr-default', label: 'Home', city: initialProfile.city || 'Nairobi', address: initialProfile.address, isDefault: true }] : []
  })

  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>(() => {
    if (initialProfile?.payment_methods) return initialProfile.payment_methods
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`pikaplan-payments-${user?.id}`)
      if (stored) return JSON.parse(stored)
    }
    return initialProfile?.phone ? [{ id: 'pay-default', type: 'mpesa', label: 'M-Pesa Number', detail: initialProfile.phone, isDefault: true }] : []
  })

  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`pikaplan-prefs-${user?.id}`)
      if (stored) return JSON.parse(stored)
    }
    return { emailNotifications: true, smsNotifications: false, pushNotifications: true, orderAlerts: true, paymentAlerts: true, marketingEmails: false, theme: 'light', language: 'en', currency: 'KES' }
  })

  const [security, setSecurity] = useState(() => {
    const ps = initialProfile?.privacy_settings
    return { currentPassword: '', newPassword: '', confirmPassword: '', twoFactorEnabled: false, sessionTimeout: 30, profileVisibility: ps?.profile_visibility ?? true, shareUsageStats: ps?.share_usage_stats ?? true, allowMerchantSearch: ps?.allow_merchant_search ?? true }
  })

  const [addressForm, setAddressForm] = useState({ label: 'Home', city: '', address: '', isDefault: false })
  const [paymentForm, setPaymentForm] = useState({ type: 'mpesa' as 'mpesa' | 'card', phone: '', cardNumber: '', cardExpiry: '', cardCvv: '' })

  const updateProfile = useCallback((u: Partial<UserProfile>) => setProfile(p => ({ ...p, ...u })), [])
  const updatePreferences = useCallback((u: any) => setPreferences((p: any) => ({ ...p, ...u })), [])
  const updateSecurity = useCallback((u: any) => setSecurity((p: any) => ({ ...p, ...u })), [])

  // ── Handlers ───────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true); setError(null)
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Photo must be less than 5MB')
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from('vendor-uploads').upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('vendor-uploads').getPublicUrl(fileName)
      updateProfile({ avatarUrl: data.publicUrl })
      setInfoMessage('✓ Profile picture uploaded. Click Save Changes.')
      setTimeout(() => setInfoMessage(null), 3000)
    } catch (err: any) { setError(err.message) } finally { setUploading(false); if (avatarInputRef.current) avatarInputRef.current.value = '' }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressForm.city.trim() || !addressForm.address.trim() || !user) return
    const newAddr: SavedAddress = { id: `addr-${Date.now()}`, label: addressForm.label, city: addressForm.city.trim(), address: addressForm.address.trim(), isDefault: addressForm.isDefault || savedAddresses.length === 0 }
    let updated = newAddr.isDefault ? savedAddresses.map(a => ({ ...a, isDefault: false })) : [...savedAddresses]
    updated.push(newAddr)
    setSavedAddresses(updated)
    localStorage.setItem(`pikaplan-addresses-${user.id}`, JSON.stringify(updated))
    const def = updated.find(a => a.isDefault)
    await saveUserProfile({ id: user.id, savedAddresses: updated, city: def?.city, address: def?.address })
    setAddressForm({ label: 'Home', city: '', address: '', isDefault: false })
    setInfoMessage('✓ Address saved!'); setTimeout(() => setInfoMessage(null), 3000)
  }

  const handleDeleteAddress = async (id: string) => {
    if (!user) return
    let updated = savedAddresses.filter(a => a.id !== id)
    if (updated.length > 0 && !updated.some(a => a.isDefault)) updated[0].isDefault = true
    setSavedAddresses(updated)
    localStorage.setItem(`pikaplan-addresses-${user.id}`, JSON.stringify(updated))
    const def = updated.find(a => a.isDefault)
    await saveUserProfile({ id: user.id, savedAddresses: updated, city: def?.city, address: def?.address })
  }

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    let newPay: SavedPaymentMethod
    if (paymentForm.type === 'mpesa') {
      if (!paymentForm.phone.trim()) return
      newPay = { id: `pay-${Date.now()}`, type: 'mpesa', label: 'M-Pesa Number', detail: paymentForm.phone.trim(), isDefault: paymentMethods.length === 0 }
    } else {
      if (!paymentForm.cardNumber.trim()) return
      newPay = { id: `pay-${Date.now()}`, type: 'card', label: 'Credit / Debit Card', detail: `•••• •••• •••• ${paymentForm.cardNumber.trim().slice(-4)}`, isDefault: paymentMethods.length === 0 }
    }
    let updated = newPay.isDefault ? paymentMethods.map(p => ({ ...p, isDefault: false })) : [...paymentMethods]
    updated.push(newPay)
    setPaymentMethods(updated)
    localStorage.setItem(`pikaplan-payments-${user.id}`, JSON.stringify(updated))
    const def = updated.find(p => p.isDefault && p.type === 'mpesa')
    await saveUserProfile({ id: user.id, paymentMethods: updated, phone: def?.detail || profile.phone })
    setPaymentForm({ type: 'mpesa', phone: '', cardNumber: '', cardExpiry: '', cardCvv: '' })
    setInfoMessage('✓ Payment method saved!'); setTimeout(() => setInfoMessage(null), 3000)
  }

  const handleDeletePaymentMethod = async (id: string) => {
    if (!user) return
    let updated = paymentMethods.filter(p => p.id !== id)
    if (updated.length > 0 && !updated.some(p => p.isDefault)) updated[0].isDefault = true
    setPaymentMethods(updated)
    localStorage.setItem(`pikaplan-payments-${user.id}`, JSON.stringify(updated))
    const def = updated.find(p => p.isDefault && p.type === 'mpesa')
    await saveUserProfile({ id: user.id, paymentMethods: updated, phone: def?.detail || '' })
  }

  const handleSave = async (tab: TabKey) => {
    if (!user) return
    setSaving(true); setError(null); setInfoMessage(null)
    try {
      if (tab === 'profile') {
        if (!profile.fullName.trim()) throw new Error('Full name is required')
        await supabase.auth.updateUser({ data: { full_name: profile.fullName.trim(), phone: profile.phone.trim() || null, avatar_url: profile.avatarUrl || null } })
        const res = await saveUserProfile({ id: user.id, fullName: profile.fullName.trim(), avatarUrl: profile.avatarUrl, phone: profile.phone.trim(), city: profile.city.trim(), address: profile.address.trim() })
        if (!res.success) throw new Error(res.error)
        setInfoMessage('✓ Profile saved!')
      } else if (tab === 'addresses') {
        const def = savedAddresses.find(a => a.isDefault)
        const res = await saveUserProfile({ id: user.id, savedAddresses, city: def?.city, address: def?.address })
        if (!res.success) throw new Error(res.error)
        setInfoMessage('✓ Addresses saved!')
      } else if (tab === 'payments') {
        const def = paymentMethods.find(p => p.isDefault && p.type === 'mpesa')
        const res = await saveUserProfile({ id: user.id, paymentMethods, phone: def?.detail || profile.phone })
        if (!res.success) throw new Error(res.error)
        setInfoMessage('✓ Payments saved!')
      } else if (tab === 'preferences') {
        localStorage.setItem(`pikaplan-prefs-${user.id}`, JSON.stringify(preferences))
        setInfoMessage('✓ Preferences saved!')
      } else if (tab === 'security') {
        if (security.newPassword) {
          if (security.newPassword !== security.confirmPassword) throw new Error('Passwords do not match')
          if (security.newPassword.length < 8) throw new Error('Password must be at least 8 characters')
          const { error } = await supabase.auth.updateUser({ password: security.newPassword })
          if (error) throw error
          updateSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
        }
        const res = await saveUserProfile({ id: user.id, privacySettings: { profile_visibility: security.profileVisibility, share_usage_stats: security.shareUsageStats, allow_merchant_search: security.allowMerchantSearch } })
        if (!res.success) throw new Error(res.error)
        localStorage.setItem(`pikaplan-privacy-${user.id}`, JSON.stringify({ profileVisibility: security.profileVisibility, shareUsageStats: security.shareUsageStats, allowMerchantSearch: security.allowMerchantSearch }))
        setInfoMessage('✓ Security saved!')
      }
      setTimeout(() => setInfoMessage(null), 3000)
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setSaving(true)
    const res = await deactivateAccount(user.id)
    if (res.success) router.push('/login')
    else setError(res.error || 'Failed to deactivate')
    setSaving(false); setConfirmDelete(false)
  }

  const refreshData = async () => {
    if (!user) return
    const res = await getUserProfile(user.id)
    if (res.success && res.data) {
      updateProfile({ fullName: res.data.full_name, phone: res.data.phone, avatarUrl: res.data.avatar_url, city: res.data.city, address: res.data.address })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-3xl font-black text-gray-900">Settings</h1><p className="mt-1 text-sm text-gray-500">Manage profile data, delivery parameters, checkout methods, and security.</p></div>
        <button onClick={refreshData} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"><RefreshCw size={15} /></button>
      </div>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</motion.div>}
        {infoMessage && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {infoMessage}</motion.div>}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-3xl font-black text-emerald-700 overflow-hidden shadow-md">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : (profile.fullName.charAt(0).toUpperCase() || 'F')}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploading} className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition disabled:opacity-50">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <h3 className="font-bold text-gray-900">{profile.fullName || 'User Account'}</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{profile.email}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => startTransition(() => setActiveTab(tab.key))} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${isActive ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-200' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2.5"><Icon size={15} /><span>{tab.label}</span></div>
                  {isActive && <ChevronRight size={14} />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'profile' && <ProfileTab profile={profile} updateProfile={updateProfile} uploading={uploading} avatarInputRef={avatarInputRef} handleAvatarUpload={handleAvatarUpload} />}
          {activeTab === 'addresses' && <AddressesTab savedAddresses={savedAddresses} addressForm={addressForm} setAddressForm={setAddressForm} handleAddAddress={handleAddAddress} handleDeleteAddress={handleDeleteAddress} />}
          {activeTab === 'payments' && <PaymentsTab paymentMethods={paymentMethods} paymentForm={paymentForm} setPaymentForm={setPaymentForm} handleAddPaymentMethod={handleAddPaymentMethod} handleDeletePaymentMethod={handleDeletePaymentMethod} />}
          {activeTab === 'preferences' && <PreferencesTab preferences={preferences} updatePreferences={updatePreferences} />}
          {activeTab === 'security' && <SecurityTab security={security} updateSecurity={updateSecurity} showPassword={showPassword} setShowPassword={setShowPassword} setConfirmDelete={setConfirmDelete} />}

          <div className="sticky bottom-4 z-10 mt-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center justify-between">
              <div className="hidden sm:block"><p className="text-sm font-bold text-gray-900">Remember to save changes</p></div>
              <button onClick={() => handleSave(activeTab)} disabled={saving} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:shadow-lg transition disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={confirmDelete} title="Deactivate Account" message="Are you sure you want to deactivate your customer profile? You will be signed out." confirmLabel="Deactivate Account" confirmVariant="danger" onConfirm={handleDeleteAccount} onCancel={() => setConfirmDelete(false)} />
    </motion.div>
  )
}