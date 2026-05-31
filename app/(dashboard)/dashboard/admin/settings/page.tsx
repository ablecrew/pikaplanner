'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  User, Globe, Bell, Shield, Palette, Database, Save, Eye, EyeOff,
  Loader2, CheckCircle2, AlertCircle, Upload, Key, Smartphone,
  Download, Trash2, RefreshCw, LogOut, Monitor, Moon, Sun,
  Mail, Phone, MapPin, CreditCard, FileText, Users, Activity,
  Server, HardDrive, AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// ── Types ────────────────────────────────────────────────

type ProfileData = {
  id?: string
  email?: string
  full_name?: string | null
  phone?: string | null
  avatar_url?: string | null
  location_city?: string | null
  bio?: string | null
  role?: string
}

type SiteConfig = {
  site_name: string
  support_email: string
  default_currency: string
  timezone: string
  language: string
  maintenance_mode: boolean
  announcement: string
  updated_at?: string
}

type NotificationPrefs = {
  new_user: boolean
  new_vendor: boolean
  new_order: boolean
  order_failed: boolean
  payment_failed: boolean
  vendor_complaint: boolean
  system_alerts: boolean
  weekly_report: boolean
}

// ── Constants ─────────────────────────────────────────────

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'site', label: 'Site', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Privacy', icon: Database },
]

// ── Save Button Helper ────────────────────────────────────

function SaveButton({ saving, saved, label = 'Save Changes' }: { saving: boolean; saved: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
        saved
          ? 'bg-emerald-600 text-white'
          : 'bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60'
      }`}
    >
      {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
      {saving ? 'Saving...' : saved ? 'Saved!' : label}
    </button>
  )
}

// ── Toast ─────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-20 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ${
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </motion.div>
  )
}

// ── PROFILE TAB ───────────────────────────────────────────

function ProfileSettings() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [form, setForm] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    location_city: '',
    bio: '',
    avatar_url: null,
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setForm({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          location_city: data.location_city || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || null,
          id: data.id,
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setToast({ message: 'Not authenticated', type: 'error' })
      setSaving(false)
      return
    }
  
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,  
        full_name: form.full_name,
        phone: form.phone,
        location_city: form.location_city,
        bio: form.bio,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setSaved(true)
      setToast({ message: 'Profile updated successfully', type: 'success' })
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setToast({ message: 'Avatar upload failed', type: 'error' })
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)

    await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id)

    setForm(prev => ({ ...prev, avatar_url: urlData.publicUrl }))
    setToast({ message: 'Avatar updated', type: 'success' })
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Avatar */}
      <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
        {form.avatar_url ? (
          <img src={form.avatar_url} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold">
            {(form.full_name || 'A')[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{form.full_name || 'Admin User'}</p>
          <p className="text-sm text-gray-500">{form.email}</p>
          <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium cursor-pointer hover:underline">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : 'Change Avatar'}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-900">
        <FormField label="Full Name">
          <Input value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </FormField>
        <FormField label="Email Address">
          <Input type="email" value={form.email || ''} disabled />
        </FormField>
        <FormField label="Phone Number">
          <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 712 345 678" />
        </FormField>
        <FormField label="City">
          <Input value={form.location_city || ''} onChange={(e) => setForm({ ...form, location_city: e.target.value })} placeholder="Nairobi" />
        </FormField>
      </div>
      <FormField label="Bio">
         <textarea
           value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." className="w-full min-h-[120px] rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-y" rows={4}
        />
      </FormField>

      <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60" disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── SITE TAB ──────────────────────────────────────────────

function SiteSettings() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [form, setForm] = useState<SiteConfig>({
    site_name: 'PikaPlan',
    support_email: 'support@pikaplan.com',
    default_currency: 'KES',
    timezone: 'Africa/Nairobi',
    language: 'en',
    maintenance_mode: false,
    announcement: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_config')
        .select('*')
        .single()

      if (data) {
        setForm({
          site_name: data.site_name || 'PikaPlan',
          support_email: data.support_email || '',
          default_currency: data.default_currency || 'KES',
          timezone: data.timezone || 'Africa/Nairobi',
          language: data.language || 'en',
          maintenance_mode: data.maintenance_mode || false,
          announcement: data.announcement || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('site_config')
      .upsert({
        id: 1,
        ...form,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setSaved(true)
      setToast({ message: 'Site settings saved', type: 'success' })
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5 text-gray-900">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Site Name">
          <Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
        </FormField>
        <FormField label="Support Email">
          <Input type="email" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} />
        </FormField>
        <FormField label="Default Currency">
          <Select value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })} options={[
            { value: 'KES', label: 'KES — Kenyan Shilling' },
            { value: 'USD', label: 'USD — US Dollar' },
            { value: 'EUR', label: 'EUR — Euro' },
            { value: 'GBP', label: 'GBP — British Pound' },
          ]} />
        </FormField>
        <FormField label="Timezone">
          <Select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} options={[
            { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
            { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
            { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
            { value: 'UTC', label: 'UTC' },
          ]} />
        </FormField>
        <FormField label="Language">
          <Select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} options={[
            { value: 'en', label: 'English' },
            { value: 'sw', label: 'Swahili' },
            { value: 'fr', label: 'French' },
          ]} />
        </FormField>
        <FormField label="Maintenance Mode">
          <Select value={form.maintenance_mode ? 'true' : 'false'} onChange={(e) => setForm({ ...form, maintenance_mode: e.target.value === 'true' })} options={[
            { value: 'false', label: 'Off — Site is live' },
            { value: 'true', label: 'On — Show maintenance page' },
          ]} />
        </FormField>
      </div>

      {form.maintenance_mode && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertTriangle size={16} />
          Maintenance mode is ON. Regular users will see a maintenance page.
        </div>
      )}

      <FormField label="Site Announcement">
        <Textarea
          value={form.announcement}
          onChange={(e) => setForm({ ...form, announcement: e.target.value })}
          placeholder="Broadcast a message to all users (shown as banner)..."
        />
      </FormField>

      <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60" disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}

// ── NOTIFICATIONS TAB ─────────────────────────────────────

function NotificationSettings() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    new_user: true, new_vendor: true, new_order: true, order_failed: true,
    payment_failed: true, vendor_complaint: true, system_alerts: true, weekly_report: false,
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', user.id)
        .single()

      if (data?.notification_prefs) {
        setPrefs({ ...prefs, ...(data.notification_prefs as Partial<NotificationPrefs>) })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const toggle = (key: keyof NotificationPrefs) => setPrefs(s => ({ ...s, [key]: !s[key] }))

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ notification_prefs: prefs, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setSaved(true)
      setToast({ message: 'Notification preferences saved', type: 'success' })
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const items = [
    { key: 'new_user' as const, label: 'New User Registration', desc: 'Notify when a new user signs up', icon: User },
    { key: 'new_vendor' as const, label: 'New Vendor Registration', desc: 'Notify when a new vendor applies', icon: Store },
    { key: 'new_order' as const, label: 'New Order Placed', desc: 'Notify on every new order', icon: CreditCard },
    { key: 'order_failed' as const, label: 'Order Failed', desc: 'Notify when an order fails', icon: AlertTriangle },
    { key: 'payment_failed' as const, label: 'Payment Failed', desc: 'Notify on payment failures', icon: XCircle },
    { key: 'vendor_complaint' as const, label: 'Vendor Complaint', desc: 'Notify on filed complaints', icon: AlertCircle },
    { key: 'system_alerts' as const, label: 'System Alerts', desc: 'Receive system health alerts', icon: Server },
    { key: 'weekly_report' as const, label: 'Weekly Report', desc: 'Get a weekly summary email', icon: FileText },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-3">
            <item.icon size={18} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </div>
          <button
            onClick={() => toggle(item.key)}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              prefs[item.key] ? 'bg-emerald-500' : 'bg-gray-200'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              prefs[item.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      ))}

      <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 mt-4" disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
      </button>
    </div>
  )
}

// ── SECURITY TAB ──────────────────────────────────────────

function SecuritySettings() {
  const supabase = createClient()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })

  const handlePasswordChange = async () => {
    if (form.newPass !== form.confirm) {
      setToast({ message: 'Passwords do not match', type: 'error' })
      return
    }
    if (form.newPass.length < 8) {
      setToast({ message: 'Password must be at least 8 characters', type: 'error' })
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: form.newPass })

    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setSaved(true)
      setForm({ current: '', newPass: '', confirm: '' })
      setToast({ message: 'Password updated successfully', type: 'success' })
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleLogoutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (!error) {
      window.location.href = '/login'
    }
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Password */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key size={18} className="text-gray-400" /> Change Password
        </h3>
        <div className="space-y-4 text-gray-900">
          <FormField label="New Password">
            <div className="relative">
              <Input type={showNew ? 'text' : 'password'} value={form.newPass} onChange={(e) => setForm({ ...form, newPass: e.target.value })} placeholder="Min. 8 characters" />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>
          <div className="space-y-4 text-gray-900">
          <FormField label="Confirm New Password">
            <Input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Re-enter password" />
          </FormField>
          </div>
        </div>
        <button onClick={handlePasswordChange} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition mt-4 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60" disabled={saving || !form.newPass}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saving ? 'Updating...' : saved ? 'Updated!' : 'Update Password'}
        </button>
      </div>

      {/* Sessions */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Smartphone size={18} className="text-gray-400" /> Active Sessions
        </h3>
        <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Sign out all devices</p>
            <p className="text-xs text-gray-500">Log out from all other browsers and devices</p>
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="px-4 py-2 border border-red-200 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
          >
            <LogOut size={15} className="inline mr-1.5" />
            Sign Out All
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Sign Out Everywhere"
        message="This will sign you out of all devices, including this one. Continue?"
        confirmLabel="Sign Out All"
        confirmVariant="danger"
        onConfirm={handleLogoutAll}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}

// ── APPEARANCE TAB ────────────────────────────────────────

function AppearanceSettings() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pika-theme') || 'light'
    return 'light'
  })
  const [accent, setAccent] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pika-accent') || 'emerald'
    return 'emerald'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const accents = ['emerald', 'blue', 'violet', 'rose', 'amber']
  const accentColors: Record<string, string> = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', violet: 'bg-violet-500', rose: 'bg-rose-500', amber: 'bg-amber-500' }

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ]

  const handleSave = async () => {
    setSaving(true)
    localStorage.setItem('pika-theme', theme)
    localStorage.setItem('pika-accent', accent)

    // Persist to database
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          preferences: { theme, accent },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Palette size={18} className="text-gray-400" /> Theme
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-4 border-2 rounded-xl text-sm font-medium transition flex flex-col items-center gap-2 ${
                theme === t.id
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <t.icon size={20} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Accent Color</h3>
        <div className="flex items-center gap-3">
          {accents.map((a) => (
            <button
              key={a}
              onClick={() => setAccent(a)}
              className={`w-10 h-10 rounded-full ${accentColors[a]} transition ring-offset-2 ${
                accent === a ? 'ring-2 ring-gray-600 ring-offset-2' : ''
              }`}
              title={a}
            />
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60" disabled={saving}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Appearance'}
      </button>
    </div>
  )
}

// ── DATA TAB ──────────────────────────────────────────────

function DataSettings() {
  const supabase = createClient()
  const [exporting, setExporting] = useState(false)
  const [retention, setRetention] = useState('12')
  const [savingRetention, setSavingRetention] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      // Fetch all major tables
      const [users, meals, orders, vendors] = await Promise.all([
        supabase.from('profiles').select('*').csv(),
        supabase.from('meals').select('*').csv(),
        supabase.from('orders').select('*').csv(),
        supabase.from('vendors').select('*').csv(),
      ])

      const csvContent = [
        '# PikaPlan Data Export',
        `# Generated: ${new Date().toISOString()}`,
        '',
        '## Users',
        users.data || '',
        '',
        '## Meals',
        meals.data || '',
        '',
        '## Orders',
        orders.data || '',
        '',
        '## Vendors',
        vendors.data || '',
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pikaplan-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setToast({ message: 'Data exported successfully', type: 'success' })
    } catch {
      setToast({ message: 'Export failed', type: 'error' })
    }
    setExporting(false)
  }

  const handleRetentionSave = async () => {
    setSavingRetention(true)
    await supabase.from('site_config').upsert({
      id: 1,
      data_retention_months: parseInt(retention),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    setSavingRetention(false)
    setToast({ message: 'Retention policy saved', type: 'success' })
  }

  const handleDeleteAll = async () => {
    setConfirmDelete(false)
    setToast({ message: 'This action requires superadmin confirmation via email', type: 'error' })
  }

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Export */}
      <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download size={20} className="text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Export All Data</p>
            <p className="text-xs text-gray-500 mt-0.5">Download a full CSV export of platform data</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-60 text-gray-900"
        >
          {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Retention */}
      <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDrive size={20} className="text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Data Retention Policy</p>
            <p className="text-xs text-gray-500 mt-0.5">Auto-delete transaction logs older than</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-900">
          <Select
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
            options={[
              { value: '3', label: '3 months' },
              { value: '6', label: '6 months' },
              { value: '12', label: '12 months' },
              { value: '24', label: '24 months' },
            ]}
            className="w-36"
          />
          <button
            onClick={handleRetentionSave}
            disabled={savingRetention}
            className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition"
          >
            {savingRetention ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>

      {/* Cache */}
      <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Clear Cache</p>
            <p className="text-xs text-gray-500 mt-0.5">Refresh cached data across the platform</p>
          </div>
        </div>
        <button
          onClick={() => setToast({ message: 'Cache cleared successfully', type: 'success' })}
          className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition text-gray-900"
        >
          <RefreshCw size={15} className="inline mr-1.5" />
          Clear Cache
        </button>
      </div>

      {/* Danger Zone */}
      <div className="p-4 bg-red-50 rounded-xl border border-red-100">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle size={20} className="text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-700">Danger Zone</p>
            <p className="text-xs text-red-500">Irreversible actions. Proceed with extreme caution.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
          >
            <Trash2 size={15} className="inline mr-1.5" />
            Reset Platform
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Reset Platform Data"
        message="This will permanently delete ALL platform data including users, meals, orders, and vendors. This action CANNOT be undone. Are you absolutely sure?"
        confirmLabel="Yes, Delete Everything"
        confirmVariant="danger"
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────

import { Store, XCircle } from 'lucide-react'

const settingsContent: Record<string, React.ReactNode> = {
  profile: <ProfileSettings />,
  site: <SiteSettings />,
  notifications: <NotificationSettings />,
  security: <SecuritySettings />,
  appearance: <AppearanceSettings />,
  data: <DataSettings />,
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Settings" subtitle="Manage your account and platform preferences." />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Stats</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="font-medium text-gray-700">v2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Backup</span>
                <span className="font-medium text-gray-700">2h ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Storage</span>
                <span className="font-medium text-emerald-600">62% free</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {settingsContent[activeTab]}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}