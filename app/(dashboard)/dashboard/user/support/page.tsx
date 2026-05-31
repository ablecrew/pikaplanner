'use client'

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, MessageSquare, Mail, Phone, MapPin, Clock, CheckCircle2,
  AlertCircle, Loader2, RefreshCw, Sparkles, ChevronDown, ChevronUp,
  Search, Send, ArrowRight, FileText, Star, ThumbsUp, ExternalLink,
  ShieldCheck, Store, Wallet, Package, CreditCard, Users, Bell,
  Copy, Heart, Truck, Ban
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';

type FaqItem = {
  id: string
  question: string
  answer: string
  category: string
  priority: number
}

type TicketRow = {
  id: string
  subject: string | null
  message: string | null
  status: string | null
  priority: string | null
  created_at: string | null
  updated_at: string | null
}

const faqCategories = ['All', 'Orders', 'Payments', 'Account', 'Delivery', 'Vendors', 'Technical']

const defaultFaqs: FaqItem[] = [
  { id: 'faq-1', question: 'How do I place an order?', answer: 'Browse meals from vendors, tap Order Now to add items to your cart, then proceed to checkout. You can pay using M-Pesa or other available methods.', category: 'Orders', priority: 1 },
  { id: 'faq-2', question: 'How can I track my order?', answer: 'Go to My Orders in your dashboard. Active orders show real-time status including Preparing, On the way, and Completed. You can also see the estimated delivery time.', category: 'Orders', priority: 2 },
  { id: 'faq-3', question: 'What payment methods are accepted?', answer: 'We accept M-Pesa mobile money, bank transfers, and card payments. M-Pesa is the fastest and most recommended payment method.', category: 'Payments', priority: 1 },
  { id: 'faq-4', question: 'How do I get a refund?', answer: 'If your order has an issue, contact support within 24 hours. Refunds are processed to your original payment method within 3-5 business days.', category: 'Payments', priority: 2 },
  { id: 'faq-5', question: 'How do I update my profile?', answer: 'Go to Settings in your dashboard to update your name, email, phone number, and delivery address. Changes are saved immediately.', category: 'Account', priority: 1 },
  { id: 'faq-6', question: 'How do I reset my password?', answer: 'Click Forgot Password on the login page. Enter your email and follow the instructions sent to your inbox to reset your password securely.', category: 'Account', priority: 2 },
  { id: 'faq-7', question: 'What is the delivery time?', answer: 'Delivery times vary by vendor distance. Most orders are delivered within 25-45 minutes. You can see the exact ETA during checkout.', category: 'Delivery', priority: 1 },
  { id: 'faq-8', question: 'Can I change my delivery address?', answer: 'Yes, you can change your delivery address before placing an order in the checkout page. Once the order is confirmed, contact support for changes.', category: 'Delivery', priority: 2 },
  { id: 'faq-9', question: 'How do I become a vendor?', answer: 'Contact our support team or sign up as a vendor through the app. You will need to provide business details, verification documents, and menu information.', category: 'Vendors', priority: 1 },
  { id: 'faq-10', question: 'The app is not loading properly', answer: 'Try refreshing the page or clearing your browser cache. If the issue persists, contact our technical support team with details about the error.', category: 'Technical', priority: 1 },
]

function formatRelativeTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000))
  if (diff < 60) return `${diff}m ago`
  const hours = Math.round(diff / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function UserSupportPage() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<any>(null)
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [faqCategory, setFaqCategory] = useState('All')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formSubject, setFormSubject] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('profiles').select('id, full_name, email, phone').eq('id', user.id).maybeSingle()
        setProfile(p ?? null)

        const { data: t } = await supabase
          .from('support_tickets')
          .select('id, subject, message, status, priority, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
        setTickets((t ?? []) as TicketRow[])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load support data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void loadData() }, [loadData])

  const filteredFaqs = useMemo(() => {
    const q = search.toLowerCase()
    return defaultFaqs.filter(f => {
      const s = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      const c = faqCategory === 'All' || f.category === faqCategory
      return s && c
    }).sort((a, b) => a.priority - b.priority)
  }, [search, faqCategory])

  const handleSubmitTicket = async () => {
    if (!formSubject.trim() || !formMessage.trim()) return
    setSending(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in')

      const { error: ie } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: formSubject.trim(),
        message: formMessage.trim(),
        status: 'Open',
        priority: 'Medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (ie) throw ie

      setInfo('Your ticket has been submitted. We will get back to you shortly.')
      setFormSubject('')
      setFormMessage('')
      setShowForm(false)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket')
    } finally {
      setSending(false)
    }
  }

  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'Pending')
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed')

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="font-poppins">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2.5">
            Help & Support
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 text-xs font-bold text-violet-600">
              <Sparkles size={12} /> {tickets.length} tickets
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Get help with your orders, account, and payments.</p>
        </div>
        <button onClick={() => void loadData()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {info && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} /> {info}
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Tickets', value: String(openTickets.length), icon: MessageSquare, bg: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'Resolved', value: String(resolvedTickets.length), icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'FAQs Available', value: String(defaultFaqs.length), icon: HelpCircle, bg: 'bg-violet-50', text: 'text-violet-600' },
          { label: 'Response Time', value: '&lt; 24h', icon: Clock, bg: 'bg-sky-50', text: 'text-sky-600' },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -2 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${s.bg} ${s.text}`}><s.icon size={18} /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
              <p className="text-lg font-extrabold text-gray-900">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Frequently Asked Questions</p>
                <h2 className="text-xl font-black text-gray-900 mt-1">FAQs</h2>
              </div>
              <button
                onClick={() => { setShowForm(true); setExpandedTicket(null) }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <MessageSquare size={14} /> Open Ticket
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FAQs..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 text-gray-900" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {faqCategories.map(c => (
                    <button key={c} onClick={() => setFaqCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${faqCategory === c ? 'bg-violet-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredFaqs.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">No FAQs match your search.</div>
              ) : (
                filteredFaqs.map(faq => {
                  const isExpanded = expandedFaq === faq.id
                  return (
                    <div key={faq.id}>
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 shrink-0"><HelpCircle size={14} /></div>
                          <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-violet-500 shrink-0" /> : <ChevronDown size={16} className="text-gray-300 shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-5 pb-4 pt-0">
                              <div className="pl-10 pr-4">
                                <p className="text-sm text-gray-600 leading-6">{faq.answer}</p>
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">{faq.category}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(faq.answer).catch(() => {}) }} className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"><Copy size={11} /> Copy</button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {tickets.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Support History</p>
                <h2 className="text-xl font-black text-gray-900 mt-1">Your Tickets</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {tickets.slice(0, 5).map(ticket => {
                  const isExpanded = expandedTicket === ticket.id
                  return (
                    <div key={ticket.id}>
                      <button
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${ticket.status === 'Open' || ticket.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {ticket.status === 'Open' || ticket.status === 'Pending' ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{ticket.subject || 'No subject'}</p>
                            <p className="text-xs text-gray-400">{ticket.status} · {formatRelativeTime(ticket.created_at)}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                          ticket.status === 'Open' || ticket.status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}>{ticket.status}</span>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                            <div className="px-5 pb-4 pt-0">
                              <div className="pl-10 pr-4 space-y-3">
                                <div className="rounded-xl bg-gray-50 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Message</p>
                                  <p className="text-sm text-gray-600">{ticket.message || 'No message'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Priority</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5 capitalize">{ticket.priority || 'Medium'}</p>
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Created</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDateTime(ticket.created_at)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Contact</p>
                <h2 className="text-xl font-black text-gray-900 mt-1">Get in Touch</h2>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600"><MessageSquare size={18} /></div>
            </div>

            {!showForm ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
                  <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5"><Mail size={14} className="text-violet-500" /> pikaplan.app@gmail.com</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</p>
                  <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5"><Phone size={14} className="text-violet-500" /> +254 797 846 624</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hours</p>
                  <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5"><Clock size={14} className="text-violet-500" /> Sun-Fri, 8AM - 8PM</p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <MessageSquare size={16} /> Open a Support Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Subject</label>
                  <input value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Brief description of your issue" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 text-gray-900" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Message</label>
                  <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} rows={5} placeholder="Describe your issue in detail..." className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 text-gray-900 resize-y min-h-[100px]" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                  <button
                    onClick={() => void handleSubmitTicket()}
                    disabled={sending || !formSubject.trim() || !formMessage.trim()}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {sending ? 'Sending...' : 'Submit Ticket'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Quick Actions</p>
                <h2 className="text-xl font-black text-gray-900 mt-1">Self Service</h2>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><Sparkles size={18} /></div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'View My Orders', desc: 'Track active and past orders', icon: Package, href: '/dashboard/user/orders' },
                { label: 'Update Profile', desc: 'Edit your account details', icon: Users, href: '/dashboard/user/settings' },
                { label: 'Payment Methods', desc: 'Manage your payment options', icon: CreditCard, href: '/dashboard/user/settings' },
                { label: 'Read FAQs', desc: 'Find answers quickly', icon: HelpCircle, href: '#faqs' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500 shrink-0"><item.icon size={16} /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition shrink-0" />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl p-5 text-white shadow-lg">
            <Bell size={24} className="mb-3 opacity-80" />
            <p className="text-lg font-black tracking-tight">Need urgent help?</p>
            <p className="text-sm text-white/80 mt-1">Our support team typically responds within 24 hours. For urgent order issues, contact us directly.</p>
            <a href="tel:+254797846624" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/30 transition">
              <Phone size={14} /> Call Support
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}