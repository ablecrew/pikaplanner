'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

// ── Types ──────────────────────────────────────────────────
export type ContactCategory =
  | 'account' | 'order' | 'payment' | 'meal-plan'
  | 'vendor' | 'technical' | 'feedback' | 'other'

export type ContactPriority = 'low' | 'normal' | 'high' | 'urgent'

export type AttachmentMeta = {
  path: string
  name: string
  size: number
  type: string
}

export type ContactFormData = {
  name: string
  email: string
  phone?: string
  category: ContactCategory
  priority: ContactPriority
  subject: string
  message: string
  attachments?: AttachmentMeta[]
  pageUrl?: string
  userAgent?: string
}

export type ContactResult =
  | { success: true; ticketNumber: string }
  | { success: false; error: string; field?: keyof ContactFormData }

// ── Validation ─────────────────────────────────────────────
function validate(data: ContactFormData): ContactResult | null {
  if (!data.name.trim() || data.name.length < 2) {
    return { success: false, error: 'Please enter your full name.', field: 'name' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { success: false, error: 'Please enter a valid email address.', field: 'email' }
  }
  if (data.phone && !/^\+?\d[\d\s\-]{7,}$/.test(data.phone)) {
    return { success: false, error: 'Please enter a valid phone number.', field: 'phone' }
  }
  if (!data.subject.trim() || data.subject.length < 5) {
    return { success: false, error: 'Subject must be at least 5 characters.', field: 'subject' }
  }
  if (data.subject.length > 200) {
    return { success: false, error: 'Subject must be under 200 characters.', field: 'subject' }
  }
  if (!data.message.trim() || data.message.length < 20) {
    return { success: false, error: 'Please describe your issue in at least 20 characters.', field: 'message' }
  }
  if (data.message.length > 5000) {
    return { success: false, error: 'Message must be under 5,000 characters.', field: 'message' }
  }
  return null
}

// ── File Upload Action ─────────────────────────────────────
export async function uploadAttachmentAction(
  formData: FormData
): Promise<{ success: true; meta: AttachmentMeta } | { success: false; error: string }> {
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, error: 'No file provided.' }
  }

  // Size check (10 MB)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: `${file.name} exceeds the 10 MB limit.` }
  }

  // Type check
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain',
  ]
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: `${file.name} is not a supported file type.` }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Build a safe path: <userId or anon>/<timestamp>-<safe-filename>
  const userPrefix = user?.id ?? 'anon'
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 100)
  const path = `${userPrefix}/${Date.now()}-${safeName}`

  const { error: uploadErr } = await supabase.storage
    .from('support-attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadErr) {
    console.error('[uploadAttachmentAction] upload error:', uploadErr)
    return { success: false, error: `Failed to upload ${file.name}.` }
  }

  return {
    success: true,
    meta: { path, name: file.name, size: file.size, type: file.type },
  }
}

// ── Submit Ticket Action ───────────────────────────────────
export async function submitContactAction(data: ContactFormData): Promise<ContactResult> {
  // Validate first
  const validation = validate(data)
  if (validation) return validation

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Rate limit: max 3 tickets per hour per user/email ───
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .or(user ? `user_id.eq.${user.id}` : `email.eq.${data.email}`)
    .gte('created_at', oneHourAgo)

  if ((recentCount ?? 0) >= 3) {
    return {
      success: false,
      error: 'You have submitted multiple tickets recently. Please wait before submitting another or reply to your existing ticket via email.',
    }
  }

  // ── Generate human-readable ticket number ──────────────
  const ticketNumber = generateTicketNumber()

  // ── Insert ticket ──────────────────────────────────────
  const { error: insertErr } = await supabase
    .from('support_tickets')
    .insert({
      ticket_number: ticketNumber,
      user_id: user?.id ?? null,
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      category: data.category,
      priority: data.priority,
      subject: data.subject.trim(),
      message: data.message.trim(),
      attachments: data.attachments ?? [],
      page_url: data.pageUrl ?? null,
      user_agent: data.userAgent ?? null,
      status: 'open',
    })

  if (insertErr) {
    console.error('[submitContactAction] insert error:', insertErr)
    return { success: false, error: 'Could not submit your ticket. Please try again.' }
  }

  // ── Notify the support team (best-effort, non-blocking) ─
  try {
    await notifySupportTeam({ ticketNumber, ...data })
  } catch (err) {
    // Don't fail the user submission if email fails
    console.error('[submitContactAction] notify error:', err)
  }

  revalidatePath('/support/contact')
  return { success: true, ticketNumber }
}

// ── Helpers ────────────────────────────────────────────────
function generateTicketNumber() {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `PP-${year}-${random}`
}

async function notifySupportTeam(payload: ContactFormData & { ticketNumber: string }) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Pika Plan Support <noreply@pikaplan.com>',
      to: 'team@pikaplan.com',
      replyTo: payload.email,
      subject: `[${payload.priority.toUpperCase()}] ${payload.ticketNumber} - ${payload.subject}`,
      html: `
        <h2>New Support Ticket</h2>
        <p><strong>Ticket:</strong> ${payload.ticketNumber}</p>
        <p><strong>From:</strong> ${payload.name} (${payload.email})</p>
        <p><strong>Phone:</strong> ${payload.phone || 'Not provided'}</p>
        <p><strong>Category:</strong> ${payload.category}</p>
        <p><strong>Priority:</strong> ${payload.priority}</p>
        <hr/>
        <h3>${payload.subject}</h3>
        <pre style="white-space:pre-wrap;font-family:inherit">${payload.message}</pre>
        <hr/>
        <p><small>Page: ${payload.pageUrl || 'n/a'}</small></p>
        <p><small>UA: ${payload.userAgent || 'n/a'}</small></p>
        <p><small>Attachments: ${payload.attachments?.length || 0}</small></p>
      `,
    })
  }