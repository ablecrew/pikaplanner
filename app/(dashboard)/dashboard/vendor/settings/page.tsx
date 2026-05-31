'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Store, Clock, CreditCard, Bell, Shield, FileText, Brain,
  Save, Upload, Check, CheckCircle2, AlertCircle, Camera,
  MapPin, Phone, Mail, Globe, DollarSign,
  Smartphone, Building2, Eye, EyeOff, Lock, Key, Trash2, AlertTriangle,
  ChevronRight, Info, Zap, TrendingUp, Target, Award,
  Loader2, RefreshCw, ExternalLink, Users, Package,
  Receipt, CircleDollarSign, Rocket, Image as ImageIcon,
  Sparkles
} from 'lucide-react'
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa'
import { createClient } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// ── Types ────────────────────────────────────────────────

type TabKey = 'profile' | 'operations' | 'payments' | 'preferences' | 'security' | 'documents'

type DaySchedule = {
  day: string
  isOpen: boolean
  openTime: string
  closeTime: string
}

type VendorProfile = {
  id: string
  businessName: string
  email: string
  phone: string
  description: string
  category: string
  cuisine: string
  locationCity: string
  locationAddress: string
  logoUrl: string
  coverUrl: string
  website: string
  instagram: string
  facebook: string
  twitter: string
  isVerified: boolean
  isActive: boolean
  isAcceptingOrders: boolean
  minimumOrder: number
  deliveryRadius: number
  deliveryFee: number
  prepTime: number
  withdrawalThreshold: number
  payoutMethod: 'mpesa' | 'bank'
  mpesaNumber: string
  bankName: string
  bankAccount: string
  taxId: string
  businessRegistration: string
  business_reg_document_url?: string
  food_handler_cert_url?: string
  tax_compliance_cert_url?: string
  national_id_url?: string
  bank_statement_url?: string
}

// ── Constants ────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'profile',     label: 'Business Profile',   icon: Store },
  { key: 'operations',  label: 'Operations',         icon: Clock },
  { key: 'payments',    label: 'Payments & Payouts', icon: CreditCard },
  { key: 'preferences', label: 'Preferences',        icon: Settings },
  { key: 'security',    label: 'Security',           icon: Shield },
  { key: 'documents',   label: 'Verification',       icon: FileText },
]

const CATEGORIES = ['Restaurant', 'Cafe', 'Bakery', 'Food Truck', 'Catering', 'Home Kitchen', 'Cloud Kitchen', 'Fast Food']
const CUISINES = ['African', 'Asian', 'Chinese', 'Indian', 'Italian', 'Japanese', 'Kenyan', 'Mediterranean', 'Mexican', 'Swahili', 'Thai', 'Other']
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const INITIAL_SCHEDULE: DaySchedule[] = DAYS_OF_WEEK.map(day => ({
  day,
  isOpen: day !== 'Sunday',
  openTime: '08:00',
  closeTime: '22:00',
}))

// ── Shared class names (stable references) ───────────────
const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
const selectClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900 bg-white"
const textareaClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition resize-y text-gray-900 min-h-[80px]"

// ── Toggle Component (defined OUTSIDE to prevent remounting) ──
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

// ── MAIN PAGE ────────────────────────────────────────────

export default function VendorSettingsPage() {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // ── Form State ─────────────────────────────────────────
  const [profile, setProfile] = useState<VendorProfile>({
    id: '',
    businessName: '',
    email: '',
    phone: '',
    description: '',
    category: 'Restaurant',
    cuisine: 'Kenyan',
    locationCity: '',
    locationAddress: '',
    logoUrl: '',
    coverUrl: '',
    website: '',
    instagram: '',
    facebook: '',
    twitter: '',
    isVerified: false,
    isActive: true,
    isAcceptingOrders: true,
    minimumOrder: 500,
    deliveryRadius: 10,
    deliveryFee: 100,
    prepTime: 30,
    withdrawalThreshold: 500,
    payoutMethod: 'mpesa',
    mpesaNumber: '',
    bankName: '',
    bankAccount: '',
    taxId: '',
    businessRegistration: '',
    business_reg_document_url: '',
    food_handler_cert_url: '',
    tax_compliance_cert_url: '',
    national_id_url: '',
    bank_statement_url: '',
  })

  const [schedule, setSchedule] = useState<DaySchedule[]>(INITIAL_SCHEDULE)

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderAlerts: true,
    paymentAlerts: true,
    reviewAlerts: true,
    marketingEmails: false,
    aiInsights: true,
    theme: 'light' as 'light' | 'dark' | 'system',
    language: 'en',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
  })

  // File upload refs (stable across renders)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  // ── Stable field update handlers (useCallback) ─────────
  const updateProfile = useCallback((updates: Partial<VendorProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }, [])

  const updateSecurity = useCallback((updates: Partial<typeof security>) => {
    setSecurity(prev => ({ ...prev, ...updates }))
  }, [])

  // ── Fetch Data ─────────────────────────────────────────
  const fetchVendor = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: vendor, error: vendorErr } = await supabase
        .from('vendors')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (vendorErr) throw vendorErr

      if (vendor) {
        setVendorId(vendor.id)
        setProfile({
          id: vendor.id,
          businessName: vendor.business_name || '',
          email: vendor.email || user.email || '',
          phone: vendor.phone || '',
          description: vendor.description || '',
          category: vendor.category || 'Restaurant',
          cuisine: vendor.cuisine || 'Kenyan',
          locationCity: vendor.location_city || '',
          locationAddress: vendor.location_address || '',
          logoUrl: vendor.logo_url || '',
          coverUrl: vendor.cover_url || '',
          website: vendor.website || '',
          instagram: vendor.instagram || '',
          facebook: vendor.facebook || '',
          twitter: vendor.twitter || '',
          isVerified: vendor.is_verified || false,
          isActive: vendor.is_active ?? true,
          isAcceptingOrders: vendor.is_accepting_orders ?? true,
          minimumOrder: Number(vendor.minimum_order || 500),
          deliveryRadius: Number(vendor.delivery_radius || 10),
          deliveryFee: Number(vendor.delivery_fee || 100),
          prepTime: Number(vendor.prep_time || 30),
          withdrawalThreshold: Number(vendor.withdrawal_threshold || 500),
          payoutMethod: (vendor.payout_method as 'mpesa' | 'bank') || 'mpesa',
          mpesaNumber: vendor.mpesa_number || '',
          bankName: vendor.bank_name || '',
          bankAccount: vendor.bank_account || '',
          taxId: vendor.tax_id || '',
          businessRegistration: vendor.business_registration || '',
          business_reg_document_url: vendor.business_reg_document_url || '',
          food_handler_cert_url: vendor.food_handler_cert_url || '',
          tax_compliance_cert_url: vendor.tax_compliance_cert_url || '',
          national_id_url: vendor.national_id_url || '',
          bank_statement_url: vendor.bank_statement_url || '',
        })

        // Load operating hours if present
        if (vendor.operating_hours && Array.isArray(vendor.operating_hours) && vendor.operating_hours.length > 0) {
          setSchedule(vendor.operating_hours)
        }

        // Load preferences if present
        if (vendor.notification_preferences) {
          const np = vendor.notification_preferences as any
          setPreferences(prev => ({
            ...prev,
            emailNotifications: np.email ?? prev.emailNotifications,
            smsNotifications: np.sms ?? prev.smsNotifications,
            pushNotifications: np.push ?? prev.pushNotifications,
            orderAlerts: np.order_alerts ?? prev.orderAlerts,
            paymentAlerts: np.payment_alerts ?? prev.paymentAlerts,
            reviewAlerts: np.review_alerts ?? prev.reviewAlerts,
            aiInsights: np.ai_insights ?? prev.aiInsights,
            marketingEmails: np.marketing ?? prev.marketingEmails,
          }))
        }
        if (vendor.theme) setPreferences(prev => ({ ...prev, theme: vendor.theme as any }))
        if (vendor.language) setPreferences(prev => ({ ...prev, language: vendor.language }))
        if (vendor.currency) setPreferences(prev => ({ ...prev, currency: vendor.currency }))
        if (vendor.timezone) setPreferences(prev => ({ ...prev, timezone: vendor.timezone }))

        // Load security settings if present
        if (vendor.two_factor_enabled !== undefined) {
          setSecurity(prev => ({
            ...prev,
            twoFactorEnabled: vendor.two_factor_enabled,
            sessionTimeout: vendor.session_timeout || 30,
            loginAlerts: vendor.login_alerts ?? true,
          }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch vendor:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchVendor()
  }, [fetchVendor])

  // ── File Upload ────────────────────────────────────────
  const uploadFile = async (file: File, type: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) throw new Error('File size must be less than 5MB')

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be JPEG, PNG, WebP, or PDF')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('vendor-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-uploads')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err) {
      console.error('Upload failed:', err)
      throw err
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(u => ({ ...u, logo: true }))
    setError(null)

    try {
      const url = await uploadFile(file, 'logo')
      setProfile(p => ({ ...p, logoUrl: url }))
      setInfoMessage('Logo uploaded. Click Save to apply.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setUploading(u => ({ ...u, logo: false }))
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(u => ({ ...u, cover: true }))
    setError(null)

    try {
      const url = await uploadFile(file, 'cover')
      setProfile(p => ({ ...p, coverUrl: url }))
      setInfoMessage('Cover uploaded. Click Save to apply.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload cover')
    } finally {
      setUploading(u => ({ ...u, cover: false }))
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleDocumentUpload = async (file: File, docType: string, field: keyof VendorProfile) => {
    setUploading(u => ({ ...u, [docType]: true }))
    setError(null)

    try {
      const url = await uploadFile(file, 'document')
      setProfile(p => ({ ...p, [field]: url }))
      setInfoMessage(`${docType} uploaded. Click Save to apply.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to upload ${docType}`)
    } finally {
      setUploading(u => ({ ...u, [docType]: false }))
    }
  }

  // ── Save Handler ───────────────────────────────────────
  const handleSave = async (tab: TabKey) => {
    setSaving(true)
    setError(null)
    setInfoMessage(null)

    try {
      if (!vendorId) throw new Error('Vendor not found')

      if (tab === 'profile') {
        if (!profile.businessName.trim()) throw new Error('Business name is required')
        if (!profile.email.trim()) throw new Error('Email is required')

        const { error: updateErr } = await supabase
          .from('vendors')
          .update({
            business_name: profile.businessName.trim(),
            email: profile.email.trim(),
            phone: profile.phone.trim(),
            description: profile.description.trim(),
            category: profile.category,
            cuisine: profile.cuisine,
            location_city: profile.locationCity.trim(),
            location_address: profile.locationAddress.trim(),
            logo_url: profile.logoUrl,
            cover_url: profile.coverUrl,
            website: profile.website.trim(),
            instagram: profile.instagram.trim(),
            facebook: profile.facebook.trim(),
            twitter: profile.twitter.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', vendorId)

        if (updateErr) throw updateErr
        setInfoMessage('✓ Business profile updated')
      } else if (tab === 'operations') {
        if (profile.minimumOrder < 0) throw new Error('Minimum order cannot be negative')
        if (profile.deliveryRadius <= 0) throw new Error('Delivery radius must be greater than 0')
        if (profile.deliveryFee < 0) throw new Error('Delivery fee cannot be negative')

        const { error: updateErr } = await supabase
          .from('vendors')
          .update({
            is_active: profile.isActive,
            is_accepting_orders: profile.isAcceptingOrders,
            minimum_order: profile.minimumOrder,
            delivery_radius: profile.deliveryRadius,
            delivery_fee: profile.deliveryFee,
            prep_time: profile.prepTime,
            operating_hours: schedule,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vendorId)

        if (updateErr) throw updateErr
        setInfoMessage('✓ Operations updated')
      } else if (tab === 'payments') {
        if (profile.payoutMethod === 'mpesa' && !profile.mpesaNumber.trim()) {
          throw new Error('M-Pesa number is required')
        }
        if (profile.payoutMethod === 'bank') {
          if (!profile.bankName.trim()) throw new Error('Bank name is required')
          if (!profile.bankAccount.trim()) throw new Error('Account number is required')
        }

        const { error: updateErr } = await supabase
          .from('vendors')
          .update({
            withdrawal_threshold: profile.withdrawalThreshold,
            payout_method: profile.payoutMethod,
            mpesa_number: profile.payoutMethod === 'mpesa' ? profile.mpesaNumber.trim() : null,
            bank_name: profile.payoutMethod === 'bank' ? profile.bankName.trim() : null,
            bank_account: profile.payoutMethod === 'bank' ? profile.bankAccount.trim() : null,
            tax_id: profile.taxId.trim() || null,
            business_registration: profile.businessRegistration.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vendorId)

        if (updateErr) throw updateErr
        setInfoMessage('✓ Payment settings updated')
      } else if (tab === 'preferences') {
        const { error: updateErr } = await supabase
          .from('vendors')
          .update({
            theme: preferences.theme,
            language: preferences.language,
            currency: preferences.currency,
            timezone: preferences.timezone,
            notification_preferences: {
              email: preferences.emailNotifications,
              sms: preferences.smsNotifications,
              push: preferences.pushNotifications,
              order_alerts: preferences.orderAlerts,
              payment_alerts: preferences.paymentAlerts,
              review_alerts: preferences.reviewAlerts,
              ai_insights: preferences.aiInsights,
              marketing: preferences.marketingEmails,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', vendorId)

        if (updateErr) throw updateErr
        setInfoMessage('✓ Preferences saved')
      } else if (tab === 'security') {
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

        const { error: updateErr } = await supabase
          .from('vendors')
          .update({
            two_factor_enabled: security.twoFactorEnabled,
            session_timeout: security.sessionTimeout,
            login_alerts: security.loginAlerts,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vendorId)

        if (updateErr) throw updateErr
        setInfoMessage('✓ Security settings updated')
      } else if (tab === 'documents') {
        const { error: updateErr } = await supabase
          .from('vendors')
          .update({
            business_reg_document_url: profile.business_reg_document_url || null,
            food_handler_cert_url: profile.food_handler_cert_url || null,
            tax_compliance_cert_url: profile.tax_compliance_cert_url || null,
            national_id_url: profile.national_id_url || null,
            bank_statement_url: profile.bank_statement_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vendorId)

        if (updateErr) throw updateErr
        setInfoMessage('✓ Documents saved')
      }

      await fetchVendor()
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
      await supabase.from('vendors').update({ is_active: false, is_accepting_orders: false }).eq('profile_id', user.id)
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Delete failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to deactivate account')
      setSaving(false)
    } finally {
      setConfirmDelete(false)
    }
  }

  // ── AI Recommendations ─────────────────────────────────
  const aiRecommendations = [
    {
      icon: <Camera size={16} />,
      title: 'Complete Your Profile',
      description: !profile.logoUrl ? 'Add a logo to increase customer trust by 40%.' : !profile.description ? 'Add a description to showcase your story.' : 'Your profile is looking great!',
      priority: !profile.logoUrl ? 'high' : 'low',
      color: 'emerald',
    },
    {
      icon: <Target size={16} />,
      title: 'Delivery Zone',
      description: profile.deliveryRadius < 15 ? `Expand radius from ${profile.deliveryRadius}km to 15km for 3x more customers.` : 'Your delivery zone is well-optimized.',
      priority: profile.deliveryRadius < 15 ? 'high' : 'low',
      color: 'violet',
    },
    {
      icon: <Sparkles size={16} />,
      title: 'Verification',
      description: !profile.isVerified ? 'Get verified to unlock premium placement and trust badges.' : 'You\'re verified! Enjoy premium placement.',
      priority: !profile.isVerified ? 'high' : 'low',
      color: 'amber',
    },
  ]

  if (loading) {
    return (
      <div className="font-poppins flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Settings</h1>
            {profile.isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={12} /> Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">Manage your vendor account, store settings, and preferences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchVendor()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => handleSave(activeTab)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
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
          {/* Vendor Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-3xl font-black text-emerald-700 overflow-hidden">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  profile.businessName.charAt(0).toUpperCase() || 'V'
                )}
              </div>
              {profile.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-900">{profile.businessName || 'Your Store'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{profile.category} · {profile.cuisine}</p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                profile.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                profile.isAcceptingOrders ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
              }`}>
                <Package size={10} />
                {profile.isAcceptingOrders ? 'Taking Orders' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
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

          {/* AI Recommendations */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Brain size={14} className="text-violet-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">AI Recommendations</h3>
            </div>
            <div className="p-3 space-y-2">
              {aiRecommendations.map((rec, i) => {
                const colors: Record<string, string> = {
                  emerald: 'border-l-emerald-500 bg-emerald-50/50',
                  blue: 'border-l-blue-500 bg-blue-50/50',
                  violet: 'border-l-violet-500 bg-violet-50/50',
                  amber: 'border-l-amber-500 bg-amber-50/50',
                }
                return (
                  <div key={i} className={`border-l-2 ${colors[rec.color]} rounded-r-lg p-2.5`}>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{rec.icon}</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900">{rec.title}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content - NO AnimatePresence or motion on content to prevent focus loss */}
        <div className="lg:col-span-3 space-y-4">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              {/* Cover & Logo */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Camera size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Store Branding</h3>
                    <p className="text-xs text-gray-500">Upload your logo and cover image</p>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Cover Image</label>
                  <div className="relative h-40 rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 overflow-hidden group">
                    {profile.coverUrl ? (
                      <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <ImageIcon size={32} className="text-emerald-600" />
                        <span className="text-xs text-emerald-700">No cover image</span>
                      </div>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploading.cover}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-semibold text-sm disabled:opacity-50"
                    >
                      {uploading.cover ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {uploading.cover ? 'Uploading...' : 'Change Cover'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Recommended: 1200x400px. Max 5MB. JPEG, PNG, or WebP.</p>
                </div>

                {/* Logo */}
                <div className="flex items-end gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-4xl font-black text-emerald-700 overflow-hidden border-4 border-white shadow-lg">
                      {profile.logoUrl ? (
                        <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        profile.businessName.charAt(0).toUpperCase() || 'V'
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading.logo}
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition disabled:opacity-50"
                    >
                      {uploading.logo ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Camera size={14} />
                      )}
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Logo</p>
                    <p className="text-xs text-gray-500">Recommended: 400x400px, PNG or JPG</p>
                    {profile.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setProfile(p => ({ ...p, logoUrl: '' }))}
                        className="text-xs text-red-600 hover:text-red-700 mt-1 flex items-center gap-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Store size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Business Information</h3>
                    <p className="text-xs text-gray-500">Core details customers see</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Business Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={profile.businessName}
                      onChange={(e) => updateProfile({ businessName: e.target.value })}
                      placeholder="e.g. Green Bowl Kitchen"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Description</label>
                    <textarea
                      value={profile.description}
                      onChange={(e) => updateProfile({ description: e.target.value })}
                      placeholder="Tell customers about your story, specialties..."
                      maxLength={500}
                      className={textareaClass}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      <span className={profile.description.length > 450 ? 'text-amber-600 font-semibold' : ''}>
                        {profile.description.length}
                      </span>
                      /500 characters
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Category</label>
                      <select
                        value={profile.category}
                        onChange={(e) => updateProfile({ category: e.target.value })}
                        className={selectClass}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Cuisine</label>
                      <select
                        value={profile.cuisine}
                        onChange={(e) => updateProfile({ cuisine: e.target.value })}
                        className={selectClass}
                      >
                        {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Phone size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Contact Information</h3>
                    <p className="text-xs text-gray-500">How customers can reach you</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Email <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => updateProfile({ email: e.target.value })}
                          className={inputClass + " pl-10"}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Phone</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => updateProfile({ phone: e.target.value })}
                          placeholder="+254 700 000000"
                          className={inputClass + " pl-10"}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Street Address</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={profile.locationAddress}
                        onChange={(e) => updateProfile({ locationAddress: e.target.value })}
                        placeholder="123 Kenyatta Ave, Nairobi"
                        className={inputClass + " pl-10"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">City</label>
                    <input
                      type="text"
                      value={profile.locationCity}
                      onChange={(e) => updateProfile({ locationCity: e.target.value })}
                      placeholder="Nairobi"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Globe size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Social Media & Website</h3>
                    <p className="text-xs text-gray-500">Connect your online presence</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Website</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="url"
                        value={profile.website}
                        onChange={(e) => updateProfile({ website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className={inputClass + " pl-10"}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Instagram</label>
                      <div className="relative">
                        <FaInstagram size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.instagram}
                          onChange={(e) => updateProfile({ instagram: e.target.value })}
                          placeholder="@handle"
                          className={inputClass + " pl-10"}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Facebook</label>
                      <div className="relative">
                        <FaFacebook size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.facebook}
                          onChange={(e) => updateProfile({ facebook: e.target.value })}
                          placeholder="Page name"
                          className={inputClass + " pl-10"}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Twitter</label>
                      <div className="relative">
                        <FaTwitter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={profile.twitter}
                          onChange={(e) => updateProfile({ twitter: e.target.value })}
                          placeholder="@handle"
                          className={inputClass + " pl-10"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* OPERATIONS TAB */}
          {activeTab === 'operations' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Zap size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Store Status</h3>
                    <p className="text-xs text-gray-500">Control when your store is open</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Toggle
                    checked={profile.isActive}
                    onChange={(v) => updateProfile({ isActive: v })}
                    label="Store Active"
                    description="When disabled, your store won't appear in search results"
                  />
                  <Toggle
                    checked={profile.isAcceptingOrders}
                    onChange={(v) => updateProfile({ isAcceptingOrders: v })}
                    label="Accept Orders"
                    description="Temporarily pause orders while keeping store visible"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Clock size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Operating Hours</h3>
                    <p className="text-xs text-gray-500">Set when your store is open each day</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {schedule.map((day, i) => (
                    <div key={day.day} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
                      <button
                        type="button"
                        onClick={() => setSchedule(s => s.map((d, j) => j === i ? { ...d, isOpen: !d.isOpen } : d))}
                        className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${day.isOpen ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${day.isOpen ? 'translate-x-5' : ''}`} />
                      </button>
                      <div className="w-24 font-semibold text-sm text-gray-900">{day.day}</div>
                      {day.isOpen ? (
                        <>
                          <input
                            type="time"
                            value={day.openTime}
                            onChange={(e) => setSchedule(s => s.map((d, j) => j === i ? { ...d, openTime: e.target.value } : d))}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={day.closeTime}
                            onChange={(e) => setSchedule(s => s.map((d, j) => j === i ? { ...d, closeTime: e.target.value } : d))}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900"
                          />
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Package size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Delivery Settings</h3>
                    <p className="text-xs text-gray-500">Configure your delivery parameters</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Minimum Order (KES)</label>
                    <div className="relative">
                      <CircleDollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="number"
                        value={profile.minimumOrder}
                        onChange={(e) => updateProfile({ minimumOrder: Number(e.target.value) })}
                        className={inputClass + " pl-10"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Delivery Fee (KES)</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="number"
                        value={profile.deliveryFee}
                        onChange={(e) => updateProfile({ deliveryFee: Number(e.target.value) })}
                        className={inputClass + " pl-10"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Delivery Radius (km)</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="number"
                        value={profile.deliveryRadius}
                        onChange={(e) => updateProfile({ deliveryRadius: Number(e.target.value) })}
                        className={inputClass + " pl-10"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Preparation Time (min)</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="number"
                        value={profile.prepTime}
                        onChange={(e) => updateProfile({ prepTime: Number(e.target.value) })}
                        className={inputClass + " pl-10"}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Delivery Zone Preview</p>
                  <div className="relative h-32 rounded-lg bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="rounded-full border-2 border-dashed border-emerald-500 bg-emerald-500/10 transition-all"
                        style={{
                          width: `${Math.min(profile.deliveryRadius * 8, 100)}%`,
                          height: `${Math.min(profile.deliveryRadius * 8, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="relative w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                      <MapPin size={16} className="text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {profile.deliveryRadius}km radius from your location
                  </p>
                </div>
              </div>
            </>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <CreditCard size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Payout Method</h3>
                    <p className="text-xs text-gray-500">Choose how to receive earnings</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => updateProfile({ payoutMethod: 'mpesa' })}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      profile.payoutMethod === 'mpesa'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone size={24} className={profile.payoutMethod === 'mpesa' ? 'text-emerald-600' : 'text-gray-400'} />
                    <p className="text-sm font-bold text-gray-900 mt-2">M-Pesa</p>
                    <p className="text-xs text-gray-500">Instant payouts</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProfile({ payoutMethod: 'bank' })}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      profile.payoutMethod === 'bank'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 size={24} className={profile.payoutMethod === 'bank' ? 'text-emerald-600' : 'text-gray-400'} />
                    <p className="text-sm font-bold text-gray-900 mt-2">Bank Transfer</p>
                    <p className="text-xs text-gray-500">1-3 business days</p>
                  </button>
                </div>

                {profile.payoutMethod === 'mpesa' ? (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">M-Pesa Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={profile.mpesaNumber}
                      onChange={(e) => updateProfile({ mpesaNumber: e.target.value })}
                      placeholder="07XX XXX XXX"
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Bank Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={profile.bankName}
                        onChange={(e) => updateProfile({ bankName: e.target.value })}
                        placeholder="Equity Bank"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Account Number <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={profile.bankAccount}
                        onChange={(e) => updateProfile({ bankAccount: e.target.value })}
                        placeholder="0123456789"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <DollarSign size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Withdrawal Settings</h3>
                    <p className="text-xs text-gray-500">Configure payout preferences</p>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Minimum Withdrawal Threshold (KES)</label>
                  <input
                    type="number"
                    value={profile.withdrawalThreshold}
                    onChange={(e) => updateProfile({ withdrawalThreshold: Number(e.target.value) })}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum amount required before you can withdraw</p>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <p className="font-semibold mb-1">How Payouts Work</p>
                      <p className="leading-relaxed">
                        Payouts are processed every Friday at 5:00 PM. A platform fee of 2.5% applies to each withdrawal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Receipt size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Tax Information</h3>
                    <p className="text-xs text-gray-500">For compliance and invoicing</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Tax ID / KRA PIN</label>
                    <input
                      type="text"
                      value={profile.taxId}
                      onChange={(e) => updateProfile({ taxId: e.target.value })}
                      placeholder="A0123456789B"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Business Registration Number</label>
                    <input
                      type="text"
                      value={profile.businessRegistration}
                      onChange={(e) => updateProfile({ businessRegistration: e.target.value })}
                      placeholder="BR-123456"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Bell size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500">Control what notifications you receive</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Toggle checked={preferences.emailNotifications} onChange={(v) => updatePreferences({ emailNotifications: v })} label="Email Notifications" description="Receive updates via email" />
                  <Toggle checked={preferences.smsNotifications} onChange={(v) => updatePreferences({ smsNotifications: v })} label="SMS Notifications" description="Get text message alerts" />
                  <Toggle checked={preferences.pushNotifications} onChange={(v) => updatePreferences({ pushNotifications: v })} label="Push Notifications" description="Browser and mobile push alerts" />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <Toggle checked={preferences.orderAlerts} onChange={(v) => updatePreferences({ orderAlerts: v })} label="Order Alerts" description="New orders and status changes" />
                  <Toggle checked={preferences.paymentAlerts} onChange={(v) => updatePreferences({ paymentAlerts: v })} label="Payment Alerts" description="Payment confirmations" />
                  <Toggle checked={preferences.reviewAlerts} onChange={(v) => updatePreferences({ reviewAlerts: v })} label="Review Alerts" description="New customer reviews" />
                  <Toggle checked={preferences.aiInsights} onChange={(v) => updatePreferences({ aiInsights: v })} label="AI Insights" description="Smart recommendations" />
                  <Toggle checked={preferences.marketingEmails} onChange={(v) => updatePreferences({ marketingEmails: v })} label="Marketing Emails" description="Platform updates and promotions" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Eye size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Display Preferences</h3>
                    <p className="text-xs text-gray-500">Customize your dashboard experience</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Currency</label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => updatePreferences({ currency: e.target.value })}
                      className={selectClass}
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Timezone</label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => updatePreferences({ timezone: e.target.value })}
                      className={selectClass}
                    >
                      <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Lock size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Change Password</h3>
                    <p className="text-xs text-gray-500">Keep your account secure</p>
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
                  <div className="grid grid-cols-2 gap-4">
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

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Key size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-500">Add extra security to your account</p>
                  </div>
                </div>
                <Toggle
                  checked={security.twoFactorEnabled}
                  onChange={(v) => updateSecurity({ twoFactorEnabled: v })}
                  label="Enable 2FA"
                  description="Require verification code on new devices"
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Users size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Login Preferences</h3>
                    <p className="text-xs text-gray-500">Manage session settings</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Toggle
                    checked={security.loginAlerts}
                    onChange={(v) => updateSecurity({ loginAlerts: v })}
                    label="Login Alerts"
                    description="Get notified when accessed from new devices"
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Session Timeout (minutes)</label>
                    <select
                      value={security.sessionTimeout}
                      onChange={(e) => updateSecurity({ sessionTimeout: Number(e.target.value) })}
                      className={selectClass}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={480}>8 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Danger Zone</h3>
                    <p className="text-xs text-gray-500">Irreversible actions</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Deactivate Vendor Account</p>
                      <p className="text-xs text-gray-600 mt-0.5">Hide your store from search. Can reactivate later.</p>
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

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <>
              <div className={`rounded-2xl p-6 shadow-sm ${
                profile.isVerified
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {profile.isVerified ? (
                        <>
                          <Award size={24} />
                          <h3 className="text-xl font-black">Verified Vendor</h3>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={24} />
                          <h3 className="text-xl font-black">Verification Pending</h3>
                        </>
                      )}
                    </div>
                    <p className="text-sm opacity-90">
                      {profile.isVerified
                        ? 'Your account is verified. Enjoy premium placement and trust badges.'
                        : 'Complete verification to unlock premium features.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <FileText size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Required Documents</h3>
                    <p className="text-xs text-gray-500">Upload documents to verify your account</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {([
                    { key: 'business-reg', name: 'Business Registration Certificate', field: 'business_reg_document_url' as const, required: true },
                    { key: 'food-handler', name: 'Food Handler\'s Certificate', field: 'food_handler_cert_url' as const, required: true },
                    { key: 'tax-compliance', name: 'Tax Compliance Certificate', field: 'tax_compliance_cert_url' as const, required: true },
                    { key: 'national-id', name: 'National ID / Passport', field: 'national_id_url' as const, required: true },
                    { key: 'bank-statement', name: 'Bank Statement / Proof of Account', field: 'bank_statement_url' as const, required: false },
                  ]).map((doc) => {
                    const docUrl = profile[doc.field]
                    const isUploading = uploading[doc.key]
                    const status = docUrl ? 'verified' : 'missing'

                    return (
                      <div key={doc.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
                          }`}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.required ? <span className="text-red-500">Required</span> : <span className="text-gray-400">Optional</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {docUrl && (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                                <Check size={12} /> Uploaded
                              </span>
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1"
                              >
                                <ExternalLink size={12} /> View
                              </a>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleDocumentUpload(file, doc.key, doc.field)
                              e.target.value = ''
                            }}
                            className="hidden"
                            id={`doc-${doc.key}`}
                          />
                          <label
                            htmlFor={`doc-${doc.key}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isUploading ? 'bg-gray-100 text-gray-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                          >
                            {isUploading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Upload size={12} />
                            )}
                            {isUploading ? 'Uploading...' : docUrl ? 'Replace' : 'Upload'}
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Award size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Benefits of Verification</h3>
                    <p className="text-xs text-gray-500">Why complete verification</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <CheckCircle2 size={18} />, title: 'Trust Badge', desc: 'Verified badge on storefront' },
                    { icon: <TrendingUp size={18} />, title: 'Premium Placement', desc: 'Higher search ranking' },
                    { icon: <Zap size={18} />, title: 'Instant Payouts', desc: 'Faster withdrawal processing' },
                    { icon: <Shield size={18} />, title: 'Insurance', desc: 'High-value order protection' },
                    { icon: <Target size={18} />, title: 'Advanced Analytics', desc: 'Deeper business insights' },
                    { icon: <Users size={18} />, title: 'Priority Support', desc: 'Dedicated account manager' },
                  ].map((benefit, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                      <div className="text-emerald-600 mb-2">{benefit.icon}</div>
                      <p className="text-sm font-bold text-gray-900">{benefit.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{benefit.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Deactivate Vendor Account"
        message="This will deactivate your store. You can reactivate later by contacting support."
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </motion.div>
  )
}
