'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, X, AlertCircle, Loader2, FileText, Image as ImageIcon,
  Paperclip, Send, ShieldCheck, Sparkles, Zap, AlertTriangle, Info,
  User, Mail, Phone, Tag, MessageSquare,
} from 'lucide-react'
import {
  submitContactAction,
  uploadAttachmentAction,
  type ContactCategory,
  type ContactPriority,
  type AttachmentMeta,
  type ContactFormData,
} from './actions'

const CATEGORIES: { value: ContactCategory; label: string; description: string }[] = [
  { value: 'account', label: 'Account & Login', description: 'Sign-in, password, profile' },
  { value: 'order', label: 'Order Issue', description: 'Delivery, missing items, refunds' },
  { value: 'payment', label: 'Payment & Billing', description: 'M-Pesa, cards, invoices' },
  { value: 'meal-plan', label: 'Meal Plans & AI', description: 'Generation, preferences' },
  { value: 'vendor', label: 'Vendor Support', description: 'Listings, payouts, applications' },
  { value: 'technical', label: 'Technical Bug', description: 'App errors, crashes, glitches' },
  { value: 'feedback', label: 'Feedback & Ideas', description: 'Suggestions, feature requests' },
  { value: 'other', label: 'Other', description: 'Anything else' },
]

const PRIORITIES: { value: ContactPriority; label: string; description: string; color: string }[] = [
  { value: 'low', label: 'Low', description: 'General question', color: '#6b7280' },
  { value: 'normal', label: 'Normal', description: 'Standard issue', color: '#1A5C3A' },
  { value: 'high', label: 'High', description: 'Significant problem', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', description: 'Service down, payment failed', color: '#dc2626' },
]

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// 🎨 Shared input classes — keeps text color consistent and high-contrast
const INPUT_BASE =
  'w-full rounded-xl border-2 px-4 py-3 text-sm font-medium text-slate-900 bg-white ' +
  'placeholder:text-slate-400 transition focus:outline-none focus:border-[#32CD32] ' +
  'focus:ring-2 focus:ring-[#32CD32]/20 disabled:bg-slate-50 disabled:text-slate-500'

const INPUT_ERROR = 'border-red-300 bg-red-50 text-slate-900'
const INPUT_NORMAL = 'border-slate-200'

type Props = {
  initialEmail?: string
  initialName?: string
}

export default function ContactForm({ initialEmail = '', initialName = '' }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState<ContactCategory>('account')
  const [priority, setPriority] = useState<ContactPriority>('normal')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Auto-detect high priority from message content
  useEffect(() => {
    const urgentWords = /\b(urgent|emergency|broken|cannot login|payment failed|charged twice|fraud|hacked)\b/i
    if (urgentWords.test(message) && priority === 'normal') {
      setPriority('high')
    }
  }, [message, priority])

  // ── File Upload ─────────────────────────────────────────
  const handleFiles = async (files: FileList | File[]) => {
    setGlobalError(null)
    const arr = Array.from(files)

    if (attachments.length + arr.length > MAX_FILES) {
      setGlobalError(`Maximum ${MAX_FILES} files allowed. You currently have ${attachments.length}.`)
      return
    }

    for (const file of arr) {
      if (file.size > MAX_FILE_SIZE) {
        setGlobalError(`${file.name} exceeds the 10 MB limit.`)
        continue
      }

      setUploadingFiles((prev) => [...prev, file.name])

      const fd = new FormData()
      fd.append('file', file)

      const result = await uploadAttachmentAction(fd)
      setUploadingFiles((prev) => prev.filter((n) => n !== file.name))

      if (result.success) {
        setAttachments((prev) => [...prev, result.meta])
      } else {
        setGlobalError(result.error)
      }
    }
  }

  const removeAttachment = (path: string) => {
    setAttachments((prev) => prev.filter((a) => a.path !== path))
  }

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGlobalError(null)

    const data: ContactFormData = {
      name,
      email,
      phone,
      category,
      priority,
      subject,
      message,
      attachments,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }

    startTransition(async () => {
      const result = await submitContactAction(data)

      if (!result.success) {
        if (result.field) {
          setErrors({ [result.field]: result.error })
        } else {
          setGlobalError(result.error)
        }
        return
      }

      router.push(`/support/contact/success?ticket=${encodeURIComponent(result.ticketNumber)}`)
    })
  }

  const fileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon
    return FileText
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <fieldset className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
        <legend className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#126e3d] mb-5">
          <User size={16} />
          Your Information
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="e.g. Jane Doe"
              className={`${INPUT_BASE} ${errors.name ? INPUT_ERROR : INPUT_NORMAL}`}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={`${INPUT_BASE} ${errors.email ? INPUT_ERROR : INPUT_NORMAL}`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.email}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-1.5">
              Phone Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className={`${INPUT_BASE} ${errors.phone ? INPUT_ERROR : INPUT_NORMAL}`}
            />
            {errors.phone && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.phone}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1.5">
              For faster WhatsApp/SMS follow-up on urgent issues
            </p>
          </div>
        </div>
      </fieldset>

      {/* Category */}
      <fieldset className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
        <legend className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#126e3d] mb-5">
          <Tag size={16} />
          What can we help with?
        </legend>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex flex-col items-start text-left rounded-xl border-2 p-3 transition ${
                category === cat.value
                  ? 'border-[#32CD32] bg-[#f0fdf4]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <span
                className={`text-xs font-black ${
                  category === cat.value ? 'text-[#126e3d]' : 'text-slate-700'
                }`}
              >
                {cat.label}
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                {cat.description}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Priority */}
      <fieldset className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
        <legend className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#126e3d] mb-5">
          <Zap size={16} />
          How urgent is this?
        </legend>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`relative rounded-xl border-2 p-3 text-left transition ${
                priority === p.value ? 'shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
              style={
                priority === p.value
                  ? { borderColor: p.color, backgroundColor: `${p.color}10` }
                  : {}
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span
                  className="text-xs font-black"
                  style={
                    priority === p.value ? { color: p.color } : { color: '#475569' }
                  }
                >
                  {p.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 leading-tight">{p.description}</p>
            </button>
          ))}
        </div>

        {priority === 'urgent' && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 leading-relaxed">
              <strong>Urgent tickets</strong> are reviewed within 1 hour during business hours.
              For payment fraud or account hacks, also call us directly at{' '}
              <strong>+254 797 846 624</strong>.
            </p>
          </div>
        )}
      </fieldset>

      {/* Subject + Message */}
      <fieldset className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
        <legend className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#126e3d] mb-5">
          <MessageSquare size={16} />
          Describe your issue
        </legend>

        <div className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-bold text-slate-700 mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              placeholder="Short summary (e.g. 'M-Pesa payment not reflecting on order #1234')"
              className={`${INPUT_BASE} ${errors.subject ? INPUT_ERROR : INPUT_NORMAL}`}
            />
            <div className="flex items-center justify-between mt-1.5">
              {errors.subject ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.subject}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  A clear summary helps us route your ticket faster
                </p>
              )}
              <span
                className={`text-xs ${
                  subject.length > 180 ? 'text-amber-600' : 'text-gray-400'
                }`}
              >
                {subject.length}/200
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-1.5">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={5000}
              rows={7}
              placeholder="Please include:&#10;• What were you trying to do?&#10;• What actually happened?&#10;• Any error messages you saw&#10;• Steps to reproduce the issue&#10;&#10;The more detail you provide, the faster we can help."
              className={`${INPUT_BASE} resize-y leading-relaxed ${
                errors.message ? INPUT_ERROR : INPUT_NORMAL
              }`}
            />
            <div className="flex items-center justify-between mt-1.5">
              {errors.message ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500">Minimum 20 characters</p>
              )}
              <span
                className={`text-xs ${
                  message.length > 4800 ? 'text-amber-600' : 'text-gray-400'
                }`}
              >
                {message.length}/5000
              </span>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Attachments */}
      <fieldset className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
        <legend className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#126e3d] mb-5">
          <Paperclip size={16} />
          Attachments{' '}
          <span className="text-gray-400 font-normal normal-case">(optional)</span>
        </legend>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            isDragging
              ? 'border-[#32CD32] bg-[#f0fdf4]'
              : 'border-slate-300 hover:border-[#32CD32]/50 hover:bg-[#f8faf8]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">
            {isDragging ? 'Drop files here' : 'Click or drag files to attach'}
          </p>
          <p className="text-xs text-gray-500 mt-1.5">
            Screenshots, PDFs, or text files • Up to {MAX_FILES} files • Max 10 MB each
          </p>
        </div>

        {/* Uploading */}
        {uploadingFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadingFiles.map((name) => (
              <div
                key={name}
                className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3"
              >
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                <span className="text-sm text-amber-800 truncate">
                  Uploading {name}...
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Attached files */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((file) => {
              const Icon = fileIcon(file.type)
              return (
                <div
                  key={file.path}
                  className="flex items-center gap-3 bg-[#f0fdf4] border border-[#32CD32]/30 rounded-lg p-3"
                >
                  <Icon size={18} className="text-[#126e3d] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(file.path)}
                    className="text-slate-400 hover:text-red-500 transition flex-shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </fieldset>

      {/* Global Error */}
      {globalError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-800">{globalError}</p>
        </div>
      )}

      {/* Privacy notice */}
      <div className="rounded-2xl border border-gray-100 bg-[#f8faf8] p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-[#126e3d] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 leading-relaxed">
          We will use your information solely to respond to this enquiry. Attachments are
          stored securely and accessible only to our support team. See our{' '}
          <a href="/privacy" className="text-[#126e3d] font-bold hover:underline">
            Privacy Policy
          </a>{' '}
          for details.
        </p>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#f97316]" />
          We typically respond within{' '}
          <strong className="text-slate-700">1 hour</strong> during business hours.
        </p>
        <button
          type="submit"
          disabled={isPending || uploadingFiles.length > 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-8 py-4 text-sm font-black uppercase text-white shadow-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Ticket
            </>
          )}
        </button>
      </div>
    </form>
  )
}