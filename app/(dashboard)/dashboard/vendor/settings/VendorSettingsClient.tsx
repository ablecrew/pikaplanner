'use client'

import { useState, useCallback, useRef, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Store, Clock, CreditCard, Bell, Shield, FileText, Brain, Save, Upload, Check, CheckCircle2, AlertCircle, Camera, MapPin, Phone, Mail, Globe, DollarSign, Smartphone, Building2, Eye, EyeOff, Lock, Key, Trash2, AlertTriangle, ChevronRight, Info, Zap, Target, Award, Loader2, RefreshCw, ExternalLink, Users, Package, Receipt, CircleDollarSign, Image as ImageIcon, Sparkles
} from 'lucide-react'
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa'
import { createClient } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { 
  VendorSettings, DaySchedule, saveVendorSettingsAction, updatePasswordAction, deactivateVendorAccountAction 
} from './actions'

type TabKey = 'profile' | 'operations' | 'payments' | 'preferences' | 'security' | 'documents'

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'profile', label: 'Business Profile', icon: Store }, { key: 'operations', label: 'Operations', icon: Clock },
  { key: 'payments', label: 'Payments & Payouts', icon: CreditCard }, { key: 'preferences', label: 'Preferences', icon: Settings },
  { key: 'security', label: 'Security', icon: Shield }, { key: 'documents', label: 'Verification', icon: FileText },
]

const CATEGORIES = ['Restaurant', 'Cafe', 'Bakery', 'Food Truck', 'Catering', 'Home Kitchen', 'Cloud Kitchen', 'Fast Food']
const CUISINES = ['African', 'Asian', 'Chinese', 'Indian', 'Italian', 'Japanese', 'Kenyan', 'Mediterranean', 'Mexican', 'Swahili', 'Thai', 'Other']

const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
const selectClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition text-gray-900 bg-white"
const textareaClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition resize-y text-gray-900 min-h-[80px]"

const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) => (
  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition cursor-pointer">
    <div><p className="text-sm font-semibold text-gray-900">{label}</p>{description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}</div>
    <button type="button" onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  </label>
)

export default function VendorSettingsClient({ initialData, userId, userEmail }: { initialData: VendorSettings | null, userId: string, userEmail: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [profile, setProfile] = useState<Omit<VendorSettings, 'schedule' | 'preferences' | 'security'>>({
    id: initialData?.id || '', businessName: initialData?.businessName || '', email: initialData?.email || userEmail, phone: initialData?.phone || '',
    description: initialData?.description || '', category: initialData?.category || 'Restaurant', cuisine: initialData?.cuisine || 'Kenyan',
    locationCity: initialData?.locationCity || '', locationAddress: initialData?.locationAddress || '', logoUrl: initialData?.logoUrl || '',
    coverUrl: initialData?.coverUrl || '', website: initialData?.website || '', instagram: initialData?.instagram || '', facebook: initialData?.facebook || '',
    twitter: initialData?.twitter || '', isVerified: initialData?.isVerified || false, isActive: initialData?.isActive ?? true,
    isAcceptingOrders: initialData?.isAcceptingOrders ?? true, minimumOrder: initialData?.minimumOrder || 500, deliveryRadius: initialData?.deliveryRadius || 10,
    deliveryFee: initialData?.deliveryFee || 100, prepTime: initialData?.prepTime || 30, withdrawalThreshold: initialData?.withdrawalThreshold || 500,
    payoutMethod: initialData?.payoutMethod || 'mpesa', mpesaNumber: initialData?.mpesaNumber || '', bankName: initialData?.bankName || '',
    bankAccount: initialData?.bankAccount || '', taxId: initialData?.taxId || '', businessRegistration: initialData?.businessRegistration || '',
    business_reg_document_url: initialData?.business_reg_document_url || '', food_handler_cert_url: initialData?.food_handler_cert_url || '',
    tax_compliance_cert_url: initialData?.tax_compliance_cert_url || '', national_id_url: initialData?.national_id_url || '', bank_statement_url: initialData?.bank_statement_url || '',
  })

  const [schedule, setSchedule] = useState<DaySchedule[]>(initialData?.schedule || [])
  const [preferences, setPreferences] = useState(initialData?.preferences || { emailNotifications: true, smsNotifications: false, pushNotifications: true, orderAlerts: true, paymentAlerts: true, reviewAlerts: true, marketingEmails: false, aiInsights: true, theme: 'light' as const, language: 'en', currency: 'KES', timezone: 'Africa/Nairobi' })
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', ...(initialData?.security || { twoFactorEnabled: false, loginAlerts: true, sessionTimeout: 30 }) })

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const updateProfile = useCallback((updates: Partial<typeof profile>) => setProfile(prev => ({ ...prev, ...updates })), [])
  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => setPreferences(prev => ({ ...prev, ...updates })), [])
  const updateSecurity = useCallback((updates: Partial<typeof security>) => setSecurity(prev => ({ ...prev, ...updates })), [])

  const uploadFile = async (file: File, type: string) => {
    const supabase = createClient()
    if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB')
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) throw new Error('Invalid file type')
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`
    const { error } = await supabase.storage.from('vendor-uploads').upload(fileName, file, { cacheControl: '3600', upsert: true })
    if (error) throw error
    return supabase.storage.from('vendor-uploads').getPublicUrl(fileName).data.publicUrl
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | string, field?: keyof typeof profile) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(u => ({ ...u, [type]: true }))
    setError(null)
    try {
      const url = await uploadFile(file, type)
      if (field) updateProfile({ [field]: url } as any)
      else updateProfile({ [`${type}Url`]: url } as any)
      setInfoMessage(`${type} uploaded. Click Save to apply.`)
    } catch (err: any) { setError(err.message) } finally {
      setUploading(u => ({ ...u, [type]: false }))
      e.target.value = ''
    }
  }

  const handleSave = async (tab: TabKey) => {
    if (!profile.id) return
    setSaving(true); setError(null); setInfoMessage(null)
    try {
      if (tab === 'security' && security.newPassword) {
        if (security.newPassword !== security.confirmPassword) throw new Error('Passwords do not match')
        if (security.newPassword.length < 8) throw new Error('Password must be at least 8 characters')
        await updatePasswordAction(security.newPassword)
        updateSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
      
      let payload: any = {}
      if (tab === 'profile') payload = profile
      else if (tab === 'operations') payload = { ...profile, schedule }
      else if (tab === 'payments') payload = profile
      else if (tab === 'preferences') payload = preferences
      else if (tab === 'security') payload = security
      else if (tab === 'documents') payload = profile

      await saveVendorSettingsAction(profile.id, tab, payload)
      setInfoMessage(`✓ ${tab.charAt(0).toUpperCase() + tab.slice(1)} settings saved`)
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    try { await deactivateVendorAccountAction(userId) } catch (err: any) { setError(err.message); setSaving(false) } finally { setConfirmDelete(false) }
  }

  const aiRecommendations = [
    { icon: <Camera size={16} />, title: 'Complete Your Profile', description: !profile.logoUrl ? 'Add a logo to increase customer trust by 40%.' : !profile.description ? 'Add a description to showcase your story.' : 'Your profile is looking great!', color: 'emerald' },
    { icon: <Target size={16} />, title: 'Delivery Zone', description: profile.deliveryRadius < 15 ? `Expand radius from ${profile.deliveryRadius}km to 15km for 3x more customers.` : 'Your delivery zone is well-optimized.', color: 'violet' },
    { icon: <Sparkles size={16} />, title: 'Verification', description: !profile.isVerified ? 'Get verified to unlock premium placement and trust badges.' : 'You\'re verified! Enjoy premium placement.', color: 'amber' },
  ]

  if (!initialData) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-500">Vendor profile not found.</p></div>

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900">Settings</h1>
            {profile.isVerified && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-xs font-bold text-emerald-700"><CheckCircle2 size={12} /> Verified</span>}
          </div>
          <p className="mt-1 text-sm text-gray-500">Manage your vendor account, store settings, and preferences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave(activeTab)} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1A5C3A] to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Changes
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={16} /> {error}</motion.div>}
        {infoMessage && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> {infoMessage}</motion.div>}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-3xl font-black text-emerald-700 overflow-hidden">
                {profile.logoUrl ? <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : profile.businessName.charAt(0).toUpperCase() || 'V'}
              </div>
              {profile.isVerified && <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center"><Check size={12} className="text-white" strokeWidth={3} /></div>}
            </div>
            <h3 className="font-bold text-gray-900">{profile.businessName || 'Your Store'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{profile.category} · {profile.cuisine}</p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${profile.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}><span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />{profile.isActive ? 'Active' : 'Inactive'}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${profile.isAcceptingOrders ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}><Package size={10} />{profile.isAcceptingOrders ? 'Taking Orders' : 'Paused'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => startTransition(() => setActiveTab(tab.key))} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === tab.key ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-200' : 'text-gray-700 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2.5"><tab.icon size={15} /><span>{tab.label}</span></div>
                {activeTab === tab.key && <ChevronRight size={14} />}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-white flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center"><Brain size={14} className="text-violet-600" /></div><h3 className="font-bold text-gray-900 text-sm">AI Recommendations</h3></div>
            <div className="p-3 space-y-2">
              {aiRecommendations.map((rec, i) => (
                <div key={i} className={`border-l-2 border-l-${rec.color}-500 bg-${rec.color}-50/50 rounded-r-lg p-2.5`}>
                  <div className="flex items-start gap-2"><div className="mt-0.5">{rec.icon}</div><div className="flex-1"><p className="text-xs font-bold text-gray-900">{rec.title}</p><p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{rec.description}</p></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'profile' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Camera size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Store Branding</h3><p className="text-xs text-gray-500">Upload your logo and cover image</p></div></div>
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Cover Image</label>
                  <div className="relative h-40 rounded-xl bg-gradient-to-br from-emerald-100 to-amber-100 overflow-hidden group">
                    {profile.coverUrl ? <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center gap-2"><ImageIcon size={32} className="text-emerald-600" /><span className="text-xs text-emerald-700">No cover image</span></div>}
                    <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileUpload(e, 'cover')} className="hidden" />
                    <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploading.cover} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-semibold text-sm disabled:opacity-50">{uploading.cover ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{uploading.cover ? 'Uploading...' : 'Change Cover'}</button>
                  </div>
                </div>
                <div className="flex items-end gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-4xl font-black text-emerald-700 overflow-hidden border-4 border-white shadow-lg">{profile.logoUrl ? <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : profile.businessName.charAt(0).toUpperCase() || 'V'}</div>
                    <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" />
                    <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploading.logo} className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 transition disabled:opacity-50">{uploading.logo ? <Loader2 size={12} className="animate-spin" /> : <Camera size={14} />}</button>
                  </div>
                  <div><p className="text-sm font-semibold text-gray-900">Logo</p><p className="text-xs text-gray-500">Recommended: 400x400px, PNG or JPG</p>{profile.logoUrl && <button type="button" onClick={() => updateProfile({ logoUrl: '' })} className="text-xs text-red-600 hover:text-red-700 mt-1 flex items-center gap-1">Remove</button>}</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Store size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Business Information</h3></div></div>
                <div className="space-y-4">
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Business Name *</label><input type="text" value={profile.businessName} onChange={(e) => updateProfile({ businessName: e.target.value })} className={inputClass} /></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Description</label><textarea value={profile.description} onChange={(e) => updateProfile({ description: e.target.value })} maxLength={500} className={textareaClass} /><p className="text-xs text-gray-400 mt-1"><span className={profile.description.length > 450 ? 'text-amber-600 font-semibold' : ''}>{profile.description.length}</span>/500</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Category</label><select value={profile.category} onChange={(e) => updateProfile({ category: e.target.value })} className={selectClass}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Cuisine</label><select value={profile.cuisine} onChange={(e) => updateProfile({ cuisine: e.target.value })} className={selectClass}>{CUISINES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Phone size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Contact Information</h3></div></div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Email *</label><input type="email" value={profile.email} onChange={(e) => updateProfile({ email: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Phone</label><input type="tel" value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} className={inputClass} /></div>
                  </div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Street Address</label><input type="text" value={profile.locationAddress} onChange={(e) => updateProfile({ locationAddress: e.target.value })} className={inputClass} /></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">City</label><input type="text" value={profile.locationCity} onChange={(e) => updateProfile({ locationCity: e.target.value })} className={inputClass} /></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Globe size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Social Media & Website</h3></div></div>
                <div className="space-y-4">
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Website</label><input type="url" value={profile.website} onChange={(e) => updateProfile({ website: e.target.value })} className={inputClass} /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Instagram</label><input type="text" value={profile.instagram} onChange={(e) => updateProfile({ instagram: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Facebook</label><input type="text" value={profile.facebook} onChange={(e) => updateProfile({ facebook: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Twitter</label><input type="text" value={profile.twitter} onChange={(e) => updateProfile({ twitter: e.target.value })} className={inputClass} /></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'operations' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Zap size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Store Status</h3></div></div>
                <div className="space-y-3">
                  <Toggle checked={profile.isActive} onChange={(v) => updateProfile({ isActive: v })} label="Store Active" description="When disabled, your store won't appear in search results" />
                  <Toggle checked={profile.isAcceptingOrders} onChange={(v) => updateProfile({ isAcceptingOrders: v })} label="Accept Orders" description="Temporarily pause orders while keeping store visible" />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Clock size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Operating Hours</h3></div></div>
                <div className="space-y-3">
                  {schedule.map((day, i) => (
                    <div key={day.day} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
                      <button type="button" onClick={() => setSchedule(s => s.map((d, j) => j === i ? { ...d, isOpen: !d.isOpen } : d))} className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${day.isOpen ? 'bg-emerald-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${day.isOpen ? 'translate-x-5' : ''}`} /></button>
                      <div className="w-24 font-semibold text-sm text-gray-900">{day.day}</div>
                      {day.isOpen ? (<>
                        <input type="time" value={day.openTime} onChange={(e) => setSchedule(s => s.map((d, j) => j === i ? { ...d, openTime: e.target.value } : d))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" />
                        <span className="text-gray-400">to</span>
                        <input type="time" value={day.closeTime} onChange={(e) => setSchedule(s => s.map((d, j) => j === i ? { ...d, closeTime: e.target.value } : d))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 text-gray-900" />
                      </>) : <span className="text-sm text-gray-400 italic">Closed</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Package size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Delivery Settings</h3></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Minimum Order (KES)</label><input type="number" value={profile.minimumOrder} onChange={(e) => updateProfile({ minimumOrder: Number(e.target.value) })} className={inputClass} /></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Delivery Fee (KES)</label><input type="number" value={profile.deliveryFee} onChange={(e) => updateProfile({ deliveryFee: Number(e.target.value) })} className={inputClass} /></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Delivery Radius (km)</label><input type="number" value={profile.deliveryRadius} onChange={(e) => updateProfile({ deliveryRadius: Number(e.target.value) })} className={inputClass} /></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Preparation Time (min)</label><input type="number" value={profile.prepTime} onChange={(e) => updateProfile({ prepTime: Number(e.target.value) })} className={inputClass} /></div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><CreditCard size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Payout Method</h3></div></div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button type="button" onClick={() => updateProfile({ payoutMethod: 'mpesa' })} className={`p-4 rounded-xl border-2 text-left transition ${profile.payoutMethod === 'mpesa' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}><Smartphone size={24} className={profile.payoutMethod === 'mpesa' ? 'text-emerald-600' : 'text-gray-400'} /><p className="text-sm font-bold text-gray-900 mt-2">M-Pesa</p></button>
                  <button type="button" onClick={() => updateProfile({ payoutMethod: 'bank' })} className={`p-4 rounded-xl border-2 text-left transition ${profile.payoutMethod === 'bank' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}><Building2 size={24} className={profile.payoutMethod === 'bank' ? 'text-emerald-600' : 'text-gray-400'} /><p className="text-sm font-bold text-gray-900 mt-2">Bank Transfer</p></button>
                </div>
                {profile.payoutMethod === 'mpesa' ? <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">M-Pesa Number *</label><input type="tel" value={profile.mpesaNumber} onChange={(e) => updateProfile({ mpesaNumber: e.target.value })} className={inputClass} /></div> : (
                  <div className="grid grid-cols-2 gap-4"><div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Bank Name *</label><input type="text" value={profile.bankName} onChange={(e) => updateProfile({ bankName: e.target.value })} className={inputClass} /></div><div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Account Number *</label><input type="text" value={profile.bankAccount} onChange={(e) => updateProfile({ bankAccount: e.target.value })} className={inputClass} /></div></div>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><DollarSign size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Withdrawal Settings</h3></div></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Minimum Withdrawal Threshold (KES)</label><input type="number" value={profile.withdrawalThreshold} onChange={(e) => updateProfile({ withdrawalThreshold: Number(e.target.value) })} className={inputClass} /></div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Receipt size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Tax Information</h3></div></div>
                <div className="space-y-4">
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Tax ID / KRA PIN</label><input type="text" value={profile.taxId} onChange={(e) => updateProfile({ taxId: e.target.value })} className={inputClass} /></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Business Registration Number</label><input type="text" value={profile.businessRegistration} onChange={(e) => updateProfile({ businessRegistration: e.target.value })} className={inputClass} /></div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'preferences' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Bell size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Notifications</h3></div></div>
                <div className="space-y-2">
                  <Toggle checked={preferences.emailNotifications} onChange={(v) => updatePreferences({ emailNotifications: v })} label="Email Notifications" />
                  <Toggle checked={preferences.smsNotifications} onChange={(v) => updatePreferences({ smsNotifications: v })} label="SMS Notifications" />
                  <Toggle checked={preferences.pushNotifications} onChange={(v) => updatePreferences({ pushNotifications: v })} label="Push Notifications" />
                  <Toggle checked={preferences.orderAlerts} onChange={(v) => updatePreferences({ orderAlerts: v })} label="Order Alerts" />
                  <Toggle checked={preferences.paymentAlerts} onChange={(v) => updatePreferences({ paymentAlerts: v })} label="Payment Alerts" />
                  <Toggle checked={preferences.reviewAlerts} onChange={(v) => updatePreferences({ reviewAlerts: v })} label="Review Alerts" />
                  <Toggle checked={preferences.aiInsights} onChange={(v) => updatePreferences({ aiInsights: v })} label="AI Insights" />
                  <Toggle checked={preferences.marketingEmails} onChange={(v) => updatePreferences({ marketingEmails: v })} label="Marketing Emails" />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Eye size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Display Preferences</h3></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Theme</label><select value={preferences.theme} onChange={(e) => updatePreferences({ theme: e.target.value as any })} className={selectClass}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System Default</option></select></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Language</label><select value={preferences.language} onChange={(e) => updatePreferences({ language: e.target.value })} className={selectClass}><option value="en">English</option><option value="sw">Swahili</option></select></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Currency</label><select value={preferences.currency} onChange={(e) => updatePreferences({ currency: e.target.value })} className={selectClass}><option value="KES">KES</option><option value="USD">USD</option></select></div>
                  <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Timezone</label><select value={preferences.timezone} onChange={(e) => updatePreferences({ timezone: e.target.value })} className={selectClass}><option value="Africa/Nairobi">Africa/Nairobi</option><option value="UTC">UTC</option></select></div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Lock size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Change Password</h3></div></div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">New Password</label><input type={showPassword ? 'text' : 'password'} value={security.newPassword} onChange={(e) => updateSecurity({ newPassword: e.target.value })} className={inputClass} /></div>
                    <div><label className="mb-1.5 block text-xs font-semibold text-gray-700">Confirm Password</label><input type={showPassword ? 'text' : 'password'} value={security.confirmPassword} onChange={(e) => updateSecurity({ confirmPassword: e.target.value })} className={inputClass} /></div>
                  </div>
                  {security.newPassword && security.newPassword !== security.confirmPassword && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} /> Passwords do not match</p>}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><Key size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Two-Factor Authentication</h3></div></div>
                <Toggle checked={security.twoFactorEnabled} onChange={(v) => updateSecurity({ twoFactorEnabled: v })} label="Enable 2FA" />
              </div>
              <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle size={18} className="text-red-600" /></div><div><h3 className="font-bold text-gray-900">Danger Zone</h3></div></div>
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-between">
                  <div><p className="text-sm font-bold text-gray-900">Deactivate Vendor Account</p><p className="text-xs text-gray-600 mt-0.5">Hide your store from search.</p></div>
                  <button type="button" onClick={() => setConfirmDelete(true)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition flex items-center gap-2"><Trash2 size={14} /> Deactivate</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'documents' && (
            <>
              <div className={`rounded-2xl p-6 shadow-sm ${profile.isVerified ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'}`}>
                <div className="flex items-center gap-2 mb-2">{profile.isVerified ? <><Award size={24} /><h3 className="text-xl font-black">Verified Vendor</h3></> : <><AlertCircle size={24} /><h3 className="text-xl font-black">Verification Pending</h3></>}</div>
                <p className="text-sm opacity-90">{profile.isVerified ? 'Your account is verified.' : 'Complete verification to unlock premium features.'}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center"><FileText size={18} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Required Documents</h3></div></div>
                <div className="space-y-3">
                  {([ { key: 'business-reg', name: 'Business Registration', field: 'business_reg_document_url' as const }, { key: 'food-handler', name: 'Food Handler Cert', field: 'food_handler_cert_url' as const }, { key: 'tax-compliance', name: 'Tax Compliance', field: 'tax_compliance_cert_url' as const }, { key: 'national-id', name: 'National ID', field: 'national_id_url' as const }, { key: 'bank-statement', name: 'Bank Statement', field: 'bank_statement_url' as const } ]).map((doc) => (
                    <div key={doc.key} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition">
                      <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile[doc.field] ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}><FileText size={18} /></div><p className="text-sm font-semibold text-gray-900">{doc.name}</p></div>
                      <div className="flex items-center gap-2">
                        {profile[doc.field] && <a href={profile[doc.field]} target="_blank" className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1"><ExternalLink size={12} /> View</a>}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, doc.key, doc.field)} className="hidden" id={`doc-${doc.key}`} />
                        <label htmlFor={`doc-${doc.key}`} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${uploading[doc.key] ? 'bg-gray-100 text-gray-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>{uploading[doc.key] ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}{uploading[doc.key] ? 'Uploading...' : profile[doc.field] ? 'Replace' : 'Upload'}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={confirmDelete} title="Deactivate Vendor Account" message="This will deactivate your store. You can reactivate later by contacting support." confirmLabel="Deactivate" confirmVariant="danger" onConfirm={handleDeleteAccount} onCancel={() => setConfirmDelete(false)} />
    </motion.div>
  )
}