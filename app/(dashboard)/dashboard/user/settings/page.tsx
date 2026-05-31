'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, User, Bell, Shield, MapPin, Phone, Mail, Camera, Loader2,
  Save, RefreshCw, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, Key,
  Trash2, AlertTriangle, Smartphone, ChevronRight, Globe, Info, Gift,
  DollarSign, Clock, CreditCard, ShieldCheck, Plus, Building2, HelpCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { saveUserProfile, getUserProfile } from '@/app/actions/manageProfile'

// ── Types ────────────────────────────────────────────────

type TabKey = 'profile' | 'addresses' | 'payments' | 'preferences' | 'security'

type UserProfile = {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl: string
  city: string
  address: string
}

type SavedAddress = {
  id: string
  label: string // 'Home' | 'Work' | 'Other'
  city: string
  address: string
  isDefault: boolean
}

type SavedPaymentMethod = {
  id: string
  type: 'mpesa' | 'card'
  label: string // M-Pesa Number or Masked Card
  detail: string
  isDefault: boolean
}

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'profile',     label: 'Profile Settings',   icon: User },
  { key: 'addresses',   label: 'Delivery Addresses', icon: MapPin },
  { key: 'payments',    label: 'Payment Methods',    icon: CreditCard },
  { key: 'preferences', label: 'Preferences',        icon: Settings },
  { key: 'security',    label: 'Security & Privacy', icon: Shield },
]

// ── Shared Tailwind Classes (Stable references) ──────────
const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
const selectClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900 bg-white"

// ── Toggle Component (defined OUTSIDE to prevent focus loss) ──
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition cursor-pointer">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  )
}

const supabase = createClient()

export default function UserSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // ── Form States ────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: '',
    city: '',
    address: '',
  })

  // Delivery Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [addressForm, setAddressForm] = useState({ label: 'Home', city: '', address: '', isDefault: false })

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([])
  const [paymentForm, setPaymentForm] = useState({ type: 'mpesa' as 'mpesa' | 'card', phone: '', cardNumber: '', cardExpiry: '', cardCvv: '' })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderAlerts: true,
    paymentAlerts: true,
    marketingEmails: false,
    theme: 'light' as 'light' | 'dark' | 'system',
    language: 'en',
    currency: 'KES',
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: 30,
    profileVisibility: true,
    shareUsageStats: true,
    allowMerchantSearch: true,
  })

  // File upload states
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // ── Stable Field Update Handlers ───────────────────────
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }, [])

  const updateSecurity = useCallback((updates: Partial<typeof security>) => {
    setSecurity(prev => ({ ...prev, ...updates }))
  }, [])

  // ── Fetch User Settings ───────────────────────────────
  const fetchUserSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get profile info via Server Action to bypass client RLS SELECT policies
      const res = await getUserProfile(user.id)
      if (!res.success) throw new Error(res.error || 'Failed to fetch user profile.')
      const prof = res.data

      setProfile({
        id: user.id,
        fullName: prof?.full_name || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: prof?.phone || '',
        avatarUrl: prof?.avatar_url || user.user_metadata?.avatar_url || '',
        city: prof?.city || '',
        address: prof?.address || '',
      })

      // Load preferences
      const storedPrefs = localStorage.getItem(`pikaplan-prefs-${user.id}`)
      if (storedPrefs) setPreferences(JSON.parse(storedPrefs))

      // Load Saved Addresses from DB (with fallback to local storage)
      if (prof?.saved_addresses && Array.isArray(prof.saved_addresses)) {
        setSavedAddresses(prof.saved_addresses)
      } else {
        const storedAddresses = localStorage.getItem(`pikaplan-addresses-${user.id}`)
        if (storedAddresses) {
          setSavedAddresses(JSON.parse(storedAddresses))
        } else {
          const defaults: SavedAddress[] = prof?.address ? [{
            id: 'addr-default',
            label: 'Home',
            city: prof.city || 'Nairobi',
            address: prof.address,
            isDefault: true
          }] : []
          setSavedAddresses(defaults)
        }
      }

      // Load Payment Methods from DB (with fallback to local storage)
      if (prof?.payment_methods && Array.isArray(prof.payment_methods)) {
        setPaymentMethods(prof.payment_methods)
      } else {
        const storedPayments = localStorage.getItem(`pikaplan-payments-${user.id}`)
        if (storedPayments) {
          setPaymentMethods(JSON.parse(storedPayments))
        } else {
          const defaults: SavedPaymentMethod[] = prof?.phone ? [{
            id: 'pay-default',
            type: 'mpesa',
            label: 'M-Pesa Number',
            detail: prof.phone,
            isDefault: true
          }] : []
          setPaymentMethods(defaults)
        }
      }

      // Load Privacy Settings from DB
      if (prof?.privacy_settings) {
        const ps = prof.privacy_settings as any
        setSecurity(prev => ({
          ...prev,
          profileVisibility: ps.profile_visibility ?? prev.profileVisibility,
          shareUsageStats: ps.share_usage_stats ?? prev.shareUsageStats,
          allowMerchantSearch: ps.allow_merchant_search ?? prev.allowMerchantSearch,
        }))
      } else {
        const storedPriv = localStorage.getItem(`pikaplan-privacy-${user.id}`)
        if (storedPriv) {
          const ps = JSON.parse(storedPriv)
          setSecurity(prev => ({
            ...prev,
            profileVisibility: ps.profileVisibility ?? prev.profileVisibility,
            shareUsageStats: ps.shareUsageStats ?? prev.shareUsageStats,
            allowMerchantSearch: ps.allowMerchantSearch ?? prev.allowMerchantSearch,
          }))
        }
      }

    } catch (err) {
      console.error('Failed to load settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUserSettings()
  }, [fetchUserSettings])

  // ── File Upload Handler ────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) throw new Error('Photo must be less than 5MB')

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) throw new Error('Only JPEG, PNG, and WebP are allowed')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

      // Upload file
      const { error: uploadErr } = await supabase.storage
        .from('vendor-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-uploads')
        .getPublicUrl(fileName)

      setProfile(p => ({ ...p, avatarUrl: publicUrl }))
      setInfoMessage('✓ Profile picture uploaded. Click Save Changes at the bottom.')
      setTimeout(() => setInfoMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  // ── Delivery Addresses Actions ──────────────────────────
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressForm.city.trim() || !addressForm.address.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    const id = user?.id || profile.id
    if (!id) return

    const newAddress: SavedAddress = {
      id: `addr-${Date.now()}`,
      label: addressForm.label,
      city: addressForm.city.trim(),
      address: addressForm.address.trim(),
      isDefault: addressForm.isDefault || savedAddresses.length === 0
    }

    let updated = [...savedAddresses]
    if (newAddress.isDefault) {
      updated = updated.map(a => ({ ...a, isDefault: false }))
    }
    updated.push(newAddress)

    // Save to Database instantly via Server Action to bypass client RLS issues
    const defaultAddr = updated.find(a => a.isDefault)
    const res = await saveUserProfile({
      id,
      email: profile.email || user.email || undefined,
      savedAddresses: updated,
      city: defaultAddr ? defaultAddr.city : profile.city,
      address: defaultAddr ? defaultAddr.address : profile.address,
    })

    if (!res.success) {
      console.warn('DB update failed, using localStorage only:', res.error)
    }

    setSavedAddresses(updated)
    localStorage.setItem(`pikaplan-addresses-${id}`, JSON.stringify(updated))
    setAddressForm({ label: 'Home', city: '', address: '', isDefault: false })
    setInfoMessage('✓ Address saved successfully!')
    setTimeout(() => setInfoMessage(null), 3000)
  }

  const handleDeleteAddress = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const uId = user?.id || profile.id
    if (!uId) return

    const updated = savedAddresses.filter(a => a.id !== id)
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true
    }

    // Save to Database instantly via Server Action to bypass client RLS issues
    const defaultAddr = updated.find(a => a.isDefault)
    const res = await saveUserProfile({
      id: uId,
      email: profile.email || user.email || undefined,
      savedAddresses: updated,
      city: defaultAddr ? defaultAddr.city : '',
      address: defaultAddr ? defaultAddr.address : '',
    })

    if (!res.success) {
      console.warn('DB delete failed, using localStorage only:', res.error)
    }

    setSavedAddresses(updated)
    localStorage.setItem(`pikaplan-addresses-${uId}`, JSON.stringify(updated))
  }

  // ── Payment Methods Actions ─────────────────────────────
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    const id = user?.id || profile.id
    if (!id) return

    let newPayment: SavedPaymentMethod
    if (paymentForm.type === 'mpesa') {
      if (!paymentForm.phone.trim()) return
      newPayment = {
        id: `pay-${Date.now()}`,
        type: 'mpesa',
        label: 'M-Pesa Number',
        detail: paymentForm.phone.trim(),
        isDefault: paymentMethods.length === 0
      }
    } else {
      if (!paymentForm.cardNumber.trim()) return
      const maskedCard = `•••• •••• •••• ${paymentForm.cardNumber.trim().slice(-4)}`
      newPayment = {
        id: `pay-${Date.now()}`,
        type: 'card',
        label: 'Credit / Debit Card',
        detail: maskedCard,
        isDefault: paymentMethods.length === 0
      }
    }

    let updated = [...paymentMethods]
    if (newPayment.isDefault) {
      updated = updated.map(p => ({ ...p, isDefault: false }))
    }
    updated.push(newPayment)

    // Save to Database instantly via Server Action to bypass client RLS issues
    const defaultMpesa = updated.find(p => p.isDefault && p.type === 'mpesa')
    const res = await saveUserProfile({
      id,
      email: profile.email || user.email || undefined,
      paymentMethods: updated,
      phone: defaultMpesa ? defaultMpesa.detail : profile.phone,
    })

    if (!res.success) {
      console.warn('DB update failed, using localStorage only:', res.error)
    }

    setPaymentMethods(updated)
    localStorage.setItem(`pikaplan-payments-${id}`, JSON.stringify(updated))
    setPaymentForm({ type: 'mpesa', phone: '', cardNumber: '', cardExpiry: '', cardCvv: '' })
    setInfoMessage('✓ Payment method saved successfully!')
    setTimeout(() => setInfoMessage(null), 3000)
  }

  const handleDeletePaymentMethod = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const uId = user?.id || profile.id
    if (!uId) return

    const updated = paymentMethods.filter(p => p.id !== id)
    if (updated.length > 0 && !updated.some(p => p.isDefault)) {
      updated[0].isDefault = true
    }

    // Save to Database instantly via Server Action to bypass client RLS issues
    const defaultMpesa = updated.find(p => p.isDefault && p.type === 'mpesa')
    const res = await saveUserProfile({
      id: uId,
      email: profile.email || user.email || undefined,
      paymentMethods: updated,
      phone: defaultMpesa ? defaultMpesa.detail : '',
    })

    if (!res.success) {
      console.warn('DB delete failed, using localStorage only:', res.error)
    }

    setPaymentMethods(updated)
    localStorage.setItem(`pikaplan-payments-${uId}`, JSON.stringify(updated))
  }

  // ── Save Action ────────────────────────────────────────
  const handleSave = async (tab: TabKey) => {
    setSaving(true)
    setError(null)
    setInfoMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (tab === 'profile') {
        if (!profile.fullName.trim()) throw new Error('Full name is required')

        // 1. Update Auth User Metadata - always allowed, bypasses RLS and updates local user session instantly
        const { error: authErr } = await supabase.auth.updateUser({
          data: {
            full_name: profile.fullName.trim(),
            phone: profile.phone.trim() || null,
            avatar_url: profile.avatarUrl || null,
          }
        })
        if (authErr) console.warn('Auth user metadata update warning:', authErr)

        // 2. Update Database Profiles Table via Server Action (bypasses RLS issues)
        const res = await saveUserProfile({
          id: user.id,
          email: profile.email || user.email || undefined,
          fullName: profile.fullName.trim(),
          avatarUrl: profile.avatarUrl || undefined,
          phone: profile.phone.trim() || undefined,
          city: profile.city.trim() || undefined,
          address: profile.address.trim() || undefined,
        })

        if (!res.success) throw new Error(res.error || 'Failed to update profile settings.')
        setInfoMessage('✓ Profile settings saved successfully!')
      } 
      else if (tab === 'addresses') {
        // Sync default address & save all addresses to DB via Server Action
        const defaultAddr = savedAddresses.find(a => a.isDefault)
        const res = await saveUserProfile({
          id: user.id,
          email: profile.email || user.email || undefined,
          savedAddresses,
          city: defaultAddr ? defaultAddr.city : profile.city,
          address: defaultAddr ? defaultAddr.address : profile.address,
        })

        if (!res.success) throw new Error(res.error || 'Failed to update delivery addresses.')
        setInfoMessage('✓ Delivery addresses configured successfully!')
      }
      else if (tab === 'payments') {
        // Sync default phone & save all payment methods to DB via Server Action
        const defaultMpesa = paymentMethods.find(p => p.isDefault && p.type === 'mpesa')
        const res = await saveUserProfile({
          id: user.id,
          email: profile.email || user.email || undefined,
          paymentMethods,
          phone: defaultMpesa ? defaultMpesa.detail : profile.phone,
        })

        if (!res.success) throw new Error(res.error || 'Failed to update payment preferences.')
        setInfoMessage('✓ Payment preferences configured successfully!')
      }
      else if (tab === 'preferences') {
        localStorage.setItem(`pikaplan-prefs-${user.id}`, JSON.stringify(preferences))
        setInfoMessage('✓ Preferences saved successfully!')
      } 
      else if (tab === 'security') {
        if (security.newPassword || security.confirmPassword) {
          if (security.newPassword !== security.confirmPassword) {
            throw new Error('Passwords do not match')
          }
          if (security.newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters')
          }

          const { error: pwErr } = await supabase.auth.updateUser({
            password: security.newPassword,
          })
          if (pwErr) throw pwErr
          setSecurity(s => ({ ...s, currentPassword: '', newPassword: '', confirmPassword: '' }))
        }
        
        // Save privacy parameters directly to DB via Server Action
        const res = await saveUserProfile({
          id: user.id,
          email: profile.email || user.email || undefined,
          privacySettings: {
            profile_visibility: security.profileVisibility,
            share_usage_stats: security.shareUsageStats,
            allow_merchant_search: security.allowMerchantSearch,
          }
        })

        if (!res.success) throw new Error(res.error || 'Failed to update privacy settings.')

        localStorage.setItem(`pikaplan-privacy-${user.id}`, JSON.stringify({
          profileVisibility: security.profileVisibility,
          shareUsageStats: security.shareUsageStats,
          allowMerchantSearch: security.allowMerchantSearch,
        }))

        setInfoMessage('✓ Security and privacy settings updated successfully!')
      }

      setTimeout(() => setInfoMessage(null), 3000)
      await fetchUserSettings()
    } catch (err) {
      console.error('Save failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('profiles').update({ is_active: false }).eq('id', user.id)
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Deactivation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to deactivate account')
      setSaving(false)
    } finally {
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="font-poppins flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-[#1A5C3A]" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage profile data, delivery parameters, checkout methods, and security privacy preferences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchUserSettings()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
        {infoMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} /> {infoMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* User Brief Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-3xl font-black text-emerald-700 overflow-hidden shadow-md">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.fullName.charAt(0).toUpperCase() || 'F'
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <h3 className="font-bold text-gray-900">{profile.fullName || 'User Account'}</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{profile.email}</p>
          </div>

          {/* Navigation tabs selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Panel (Direct JSX to bypass cursor focus bugs) */}
        <div className="lg:col-span-3 space-y-4">
          {/* PROFILE SETTINGS TAB */}
          {activeTab === 'profile' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Personal Information</h3>
                    <p className="text-xs text-gray-400">Update name and primary contact settings</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => updateProfile({ fullName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Email Address *</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Primary Contact Phone</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => updateProfile({ phone: e.target.value })}
                          placeholder="+254 700 000000"
                          className={inputClass + " pl-9"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* DELIVERY ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <>
              {/* Saved Addresses List */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Saved Delivery Addresses</h3>
                    <p className="text-xs text-gray-400">Manage delivery addresses for faster order checkout</p>
                  </div>
                </div>

                {savedAddresses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">No saved delivery addresses found.</p>
                ) : (
                  <div className="space-y-2 mb-6">
                    {savedAddresses.map(addr => (
                      <div key={addr.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <MapPin size={15} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-emerald-100">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{addr.address}, {addr.city}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition"
                          title="Delete address"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Address Form */}
                <form onSubmit={handleAddAddress} className="pt-4 border-t border-gray-100 space-y-4">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Add New Address</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Address Label</label>
                      <select
                        value={addressForm.label}
                        onChange={(e) => setAddressForm(p => ({ ...p, label: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm(p => ({ ...p, city: e.target.value }))}
                        placeholder="Nairobi"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Street / Apartment / Office Address</label>
                    <input
                      type="text"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="e.g. Kenyatta Ave, Mars Towers 4th Floor"
                      className={inputClass}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm(p => ({ ...p, isDefault: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-gray-700">Set as default delivery address</span>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition"
                  >
                    <Plus size={13} /> Add Saved Address
                  </button>
                </form>
              </div>
            </>
          )}

          {/* PAYMENT METHODS TAB */}
          {activeTab === 'payments' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Saved Payment Wallets</h3>
                    <p className="text-xs text-gray-400">Configure M-Pesa express profiles or card methods</p>
                  </div>
                </div>

                {paymentMethods.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">No saved payment methods configured.</p>
                ) : (
                  <div className="space-y-2 mb-6">
                    {paymentMethods.map(pay => (
                      <div key={pay.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            {pay.type === 'mpesa' ? <Smartphone size={14} /> : <CreditCard size={14} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">{pay.label}</span>
                              {pay.isDefault && (
                                <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-emerald-100">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">{pay.detail}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentMethod(pay.id)}
                          className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition"
                          title="Remove wallet"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Payment Wallet */}
                <form onSubmit={handleAddPaymentMethod} className="pt-4 border-t border-gray-100 space-y-4">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Configure New Wallet</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentForm(p => ({ ...p, type: 'mpesa' }))}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        paymentForm.type === 'mpesa'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Smartphone size={18} className={paymentForm.type === 'mpesa' ? 'text-emerald-600' : 'text-gray-400'} />
                      <p className="text-xs font-bold text-gray-900 mt-1">M-Pesa Express</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentForm(p => ({ ...p, type: 'card' }))}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        paymentForm.type === 'card'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard size={18} className={paymentForm.type === 'card' ? 'text-emerald-600' : 'text-gray-400'} />
                      <p className="text-xs font-bold text-gray-900 mt-1">Credit / Debit Card</p>
                    </button>
                  </div>

                  {paymentForm.type === 'mpesa' ? (
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">M-Pesa Phone Number</label>
                      <input
                        type="tel"
                        value={paymentForm.phone}
                        onChange={(e) => setPaymentForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="e.g. 07XXXXXXXX"
                        className={inputClass}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">Card Number</label>
                        <input
                          type="text"
                          value={paymentForm.cardNumber}
                          onChange={(e) => setPaymentForm(p => ({ ...p, cardNumber: e.target.value }))}
                          placeholder="4111 2222 3333 4444"
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">Expiry Date</label>
                          <input
                            type="text"
                            value={paymentForm.cardExpiry}
                            onChange={(e) => setPaymentForm(p => ({ ...p, cardExpiry: e.target.value }))}
                            placeholder="MM/YY"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">CVV</label>
                          <input
                            type="text"
                            value={paymentForm.cardCvv}
                            onChange={(e) => setPaymentForm(p => ({ ...p, cardCvv: e.target.value }))}
                            placeholder="123"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl text-xs font-bold text-white shadow-sm hover:shadow-md transition"
                  >
                    <Plus size={13} /> Add Payment Method
                  </button>
                </form>
              </div>
            </>
          )}

          {/* PREFERENCES SETTINGS TAB */}
          {activeTab === 'preferences' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Notifications Alerts</h3>
                    <p className="text-xs text-gray-400">Control what alerts you receive and where</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Toggle checked={preferences.emailNotifications} onChange={(v) => updatePreferences({ emailNotifications: v })} label="Email Notifications" description="Receive updates and billing invoices via email" />
                  <Toggle checked={preferences.smsNotifications} onChange={(v) => updatePreferences({ smsNotifications: v })} label="SMS Notifications" description="Get order statuses pushed to your phone" />
                  <Toggle checked={preferences.pushNotifications} onChange={(v) => updatePreferences({ pushNotifications: v })} label="Push Alerts" description="Receive browser push notifications" />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <Toggle checked={preferences.orderAlerts} onChange={(v) => updatePreferences({ orderAlerts: v })} label="Order Tracking Alerts" description="Status update signals (Confirmed, Preparing, Ready)" />
                  <Toggle checked={preferences.paymentAlerts} onChange={(v) => updatePreferences({ paymentAlerts: v })} label="Payment Receipts" description="Transactional M-Pesa statements and confirmations" />
                  <Toggle checked={preferences.marketingEmails} onChange={(v) => updatePreferences({ marketingEmails: v })} label="Marketing Promos" description="Weekend specials, coupons, and discounts" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Display Preferences</h3>
                    <p className="text-xs text-gray-400">Customize dashboard locales and layouts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Theme</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => updatePreferences({ theme: e.target.value as any })}
                      className={selectClass}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => updatePreferences({ language: e.target.value })}
                      className={selectClass}
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECURITY & PRIVACY TAB */}
          {activeTab === 'security' && (
            <>
              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Change Password</h3>
                    <p className="text-xs text-gray-400">Ensure a strong password to protect your account</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={security.currentPassword}
                        onChange={(e) => updateSecurity({ currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={security.newPassword}
                        onChange={(e) => updateSecurity({ newPassword: e.target.value })}
                        placeholder="Enter new password"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Confirm Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={security.confirmPassword}
                        onChange={(e) => updateSecurity({ confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {security.newPassword && security.newPassword !== security.confirmPassword && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Key size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-400">Secure authorization checks</p>
                  </div>
                </div>
                <Toggle
                  checked={security.twoFactorEnabled}
                  onChange={(v) => updateSecurity({ twoFactorEnabled: v })}
                  label="Enable Two-Factor (2FA)"
                  description="Use mobile confirmation checks when logging in"
                />
              </div>

              {/* Privacy Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Privacy & Data Settings</h3>
                    <p className="text-xs text-gray-400">Configure your profile visibility and privacy metrics</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Toggle
                    checked={security.profileVisibility}
                    onChange={(v) => updateSecurity({ profileVisibility: v })}
                    label="Public Profile Visibility"
                    description="Allow other users to search and view your gourmet favorites"
                  />
                  <Toggle
                    checked={security.shareUsageStats}
                    onChange={(v) => updateSecurity({ shareUsageStats: v })}
                    label="Share Usage Statistics"
                    description="Allow AI engine to analyze ordering habits for smart recipe recommendations"
                  />
                  <Toggle
                    checked={security.allowMerchantSearch}
                    onChange={(v) => updateSecurity({ allowMerchantSearch: v })}
                    label="Allow Merchant Search"
                    description="Allow kitchens to locate your contact details for custom quotes"
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Danger Zone</h3>
                    <p className="text-xs text-gray-500">Deactivation options</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Deactivate Customer Account</p>
                      <p className="text-xs text-gray-600 mt-0.5">This will sign you out and deactivate your account profile.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Sticky Save Button at Bottom */}
          <div className="sticky bottom-4 z-10 mt-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center justify-between">
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900">Remember to save changes</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeTab === 'profile' && 'Profile edits will be applied instantly.'}
                  {activeTab === 'addresses' && 'Sync default delivery locations.'}
                  {activeTab === 'payments' && 'Configure M-Pesa and card details.'}
                  {activeTab === 'preferences' && 'Dashboard preferences settings.'}
                  {activeTab === 'security' && 'Security & privacy configurations.'}
                </p>
              </div>
              <button
                onClick={() => handleSave(activeTab)}
                disabled={saving}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:shadow-lg transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Deactivate Account"
        message="Are you sure you want to deactivate your customer profile? You will be signed out and your account status marked inactive."
        confirmLabel="Deactivate Account"
        confirmVariant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </motion.div>
  )
}