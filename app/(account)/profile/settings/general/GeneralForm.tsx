'use client'

import { useState, useTransition, useRef } from 'react'
import {
  User as UserIcon, Camera, Loader2, Mail, AtSign, Briefcase, MapPin, Globe,
} from 'lucide-react'
import SettingsInput, { SettingsTextarea, SettingsSelect, LABEL_CLASS, INPUT_CLASS } from '../_components/SettingsInput'
import SaveBar from '../_components/SaveBar'
import { updateGeneralAction, updateEmailAction, uploadAvatarAction, type Profile } from '../actions'

export default function GeneralForm({ initial }: { initial: Profile }) {
  const [form, setForm] = useState({
    full_name: initial.full_name ?? '',
    bio: initial.bio ?? '',
    phone: initial.phone ?? '',
    location: initial.location ?? '',
    website: initial.website ?? '',
    date_of_birth: initial.date_of_birth ?? '',
    gender: initial.gender ?? '',
  })
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url)
  const [email, setEmail] = useState(initial.email)
  const [emailDirty, setEmailDirty] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const initialJSON = JSON.stringify({ ...initial, full_name: initial.full_name ?? '' })
  const currentJSON = JSON.stringify({ ...initial, ...form })
  const dirty = initialJSON !== currentJSON

  const handleAvatar = async (file: File) => {
    setUploading(true)
    setMessage(null)
    const fd = new FormData()
    fd.append('avatar', file)
    const r = await uploadAvatarAction(fd)
    setUploading(false)
    if (r.success && r.data) {
      setAvatarUrl(r.data.url)
      setMessage({ type: 'success', text: r.message ?? 'Avatar updated.' })
    } else if (!r.success) {
      setMessage({ type: 'error', text: r.error })
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setErrors({})
    setMessage(null)

    startTransition(async () => {
      const r = await updateGeneralAction(form)
      if (!r.success) {
        if (r.field) setErrors({ [r.field]: r.error })
        else setMessage({ type: 'error', text: r.error })
        return
      }
      setMessage({ type: 'success', text: r.message ?? 'Saved.' })
    })
  }

  const handleEmailChange = () => {
    startTransition(async () => {
      const r = await updateEmailAction(email)
      setMessage({ type: r.success ? 'success' : 'error', text: r.success ? r.message! : r.error })
      if (r.success) setEmailDirty(false)
    })
  }

  const initials = form.full_name
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <UserIcon size={18} className="text-[#126e3d]" /> Profile Photo
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] flex items-center justify-center text-white font-black text-3xl shadow-lg">
                {initials}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={24} />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-slate-900">Upload a new photo</p>
            <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF. Max 5 MB.</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1A5C3A] hover:bg-[#0d3d26] px-4 py-2 text-xs font-black uppercase text-white transition disabled:opacity-50"
            >
              <Camera size={12} /> Choose Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
            />
          </div>
        </div>
      </section>

      {/* Email (separate flow) */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Mail size={18} className="text-[#126e3d]" /> Email Address
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailDirty(true) }}
              className={INPUT_CLASS}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              You'll receive a confirmation email to verify any change.
            </p>
          </div>
          {emailDirty && (
            <button
              type="button"
              onClick={handleEmailChange}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-4 py-3 text-xs font-black uppercase text-white transition disabled:opacity-60"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
              Update Email
            </button>
          )}
        </div>
      </section>

      {/* General Info Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <AtSign size={18} className="text-[#126e3d]" /> Personal Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsInput
            label="Full Name"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="e.g. Jane Wanjiku"
            error={errors.full_name}
          />
          <SettingsInput
            label="Phone Number"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+254 7XX XXX XXX"
            error={errors.phone}
            hint="For order updates and SMS alerts"
          />
        </div>

        <SettingsTextarea
          label="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell us a little about yourself..."
          maxLength={300}
          hint={`${form.bio.length}/300 characters`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsInput
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Nairobi, Kenya"
          />
          <SettingsInput
            label="Website"
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://yourwebsite.com"
            error={errors.website}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsInput
            label="Date of Birth"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
          />
          <SettingsSelect
            label="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            options={[
              { value: '', label: 'Prefer not to say' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'non-binary', label: 'Non-binary' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>
      </form>

      <SaveBar
        dirty={dirty}
        saving={isPending}
        message={message}
        onSave={handleSubmit}
        onReset={() => setForm({
          full_name: initial.full_name ?? '',
          bio: initial.bio ?? '',
          phone: initial.phone ?? '',
          location: initial.location ?? '',
          website: initial.website ?? '',
          date_of_birth: initial.date_of_birth ?? '',
          gender: initial.gender ?? '',
        })}
      />
    </div>
  )
}