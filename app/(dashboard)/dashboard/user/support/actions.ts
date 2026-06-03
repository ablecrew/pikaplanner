'use server'

import { createClient } from '@/lib/supabase/server'

export type FaqItem = {
  id: string
  question: string
  answer: string
  category: string
  priority: number
}

export type TicketRow = {
  id: string
  subject: string | null
  message: string | null
  status: string | null
  priority: string | null
  created_at: string | null
  updated_at: string | null
}

export type UserProfileLite = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

export type SupportPayload = {
  profile: UserProfileLite | null
  faqs: FaqItem[]
  tickets: TicketRow[]
  stats: {
    openCount: number
    resolvedCount: number
  }
}

const DEFAULT_FAQS: FaqItem[] = [
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

// 👇 Just remove `export` — only async functions can be exported from a 'use server' file
const FAQ_CATEGORIES = [
  'All', 'Orders', 'Payments', 'Account', 'Delivery', 'Vendors', 'Technical',
]

const CACHE_TTL = 60

async function fetchSupportRaw(): Promise<SupportPayload> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: UserProfileLite | null = null
  let tickets: TicketRow[] = []

  if (user) {
    const [profileRes, ticketRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('support_tickets')
        .select('id, subject, message, status, priority, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    profile = (profileRes.data ?? null) as UserProfileLite | null
    tickets = (ticketRes.data ?? []) as TicketRow[]
  }

  const openCount = tickets.filter(
    (t) => t.status === 'Open' || t.status === 'Pending',
  ).length
  const resolvedCount = tickets.filter(
    (t) => t.status === 'Resolved' || t.status === 'Closed',
  ).length

  return {
    profile,
    faqs: DEFAULT_FAQS,
    tickets,
    stats: { openCount, resolvedCount },
  }
}

export async function fetchUserSupport(): Promise<SupportPayload> {
  try {
    return await fetchSupportRaw()
  } catch (err) {
    console.error('Cached support failed, falling back:', err)
    return fetchSupportRaw()
  }
}

export async function submitSupportTicket(
  subject: string,
  message: string,
): Promise<TicketRow> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in')

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      status: 'Open',
      priority: 'Medium',
      created_at: now,
      updated_at: now,
    })
    .select('id, subject, message, status, priority, created_at, updated_at')
    .single()

  if (error) throw error
  return data as TicketRow
}