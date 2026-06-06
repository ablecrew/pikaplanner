'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Types ──────────────────────────────────────────────────
export type CareerStatus = 'draft' | 'published' | 'closed' | 'archived'
export type WorkType = 'full-time' | 'part-time' | 'contract' | 'internship'
export type WorkMode = 'remote' | 'hybrid' | 'on-site'
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead'

export type Career = {
  id: string
  title: string
  slug: string
  department: string
  location: string
  work_type: WorkType
  work_mode: WorkMode
  experience_level: ExperienceLevel
  salary_min?: number | null
  salary_max?: number | null
  currency?: string | null
  short_description: string
  description: string
  responsibilities: string[]
  requirements: string[]
  benefits: string[]
  skills: string[]
  application_url?: string | null
  application_email?: string | null
  application_deadline?: string | null
  is_featured: boolean
  status: CareerStatus
  views: number
  applications_count: number
  created_at: string
  updated_at: string
  published_at?: string | null
}

export type CareerFormInput = Omit<
  Career,
  'id' | 'views' | 'applications_count' | 'created_at' | 'updated_at' | 'published_at' | 'slug'
> & {
  slug?: string
}

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ── Helpers ────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

async function ensureUniqueSlug(supabase: any, baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  while (true) {
    let query = supabase.from('careers').select('id').eq('slug', slug)
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return slug
    counter++
    slug = `${baseSlug}-${counter}`
  }
}

// ── Fetch ──────────────────────────────────────────────────
export async function fetchCareers(): Promise<Career[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchCareers]', error)
    return []
  }
  return (data as Career[]) ?? []
}

// ── Create ─────────────────────────────────────────────────
export async function createCareerAction(input: CareerFormInput): Promise<ActionResult<Career>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be signed in.' }
  }

  if (!input.title?.trim() || input.title.length < 3) {
    return { success: false, error: 'Title must be at least 3 characters.' }
  }
  if (!input.short_description?.trim()) {
    return { success: false, error: 'Short description is required.' }
  }
  if (!input.description?.trim() || input.description.length < 50) {
    return { success: false, error: 'Description must be at least 50 characters.' }
  }
  if (!input.application_url && !input.application_email) {
    return { success: false, error: 'Provide an application URL or email.' }
  }

  const slug = await ensureUniqueSlug(supabase, slugify(input.slug || input.title))

  const { data, error } = await supabase
    .from('careers')
    .insert({
      title: input.title.trim(),
      slug,
      department: input.department.trim(),
      location: input.location.trim(),
      work_type: input.work_type,
      work_mode: input.work_mode,
      experience_level: input.experience_level,
      salary_min: input.salary_min || null,
      salary_max: input.salary_max || null,
      currency: input.currency || 'KES',
      short_description: input.short_description.trim(),
      description: input.description.trim(),
      responsibilities: input.responsibilities ?? [],
      requirements: input.requirements ?? [],
      benefits: input.benefits ?? [],
      skills: input.skills ?? [],
      application_url: input.application_url?.trim() || null,
      application_email: input.application_email?.trim() || null,
      application_deadline: input.application_deadline || null,
      is_featured: input.is_featured ?? false,
      status: input.status ?? 'draft',
      posted_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[createCareerAction]', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  return { success: true, data: data as Career }
}

// ── Update ─────────────────────────────────────────────────
export async function updateCareerAction(id: string, input: CareerFormInput): Promise<ActionResult<Career>> {
  const supabase = await createClient()

  const slug = await ensureUniqueSlug(supabase, slugify(input.slug || input.title), id)

  const { data, error } = await supabase
    .from('careers')
    .update({
      title: input.title.trim(),
      slug,
      department: input.department.trim(),
      location: input.location.trim(),
      work_type: input.work_type,
      work_mode: input.work_mode,
      experience_level: input.experience_level,
      salary_min: input.salary_min || null,
      salary_max: input.salary_max || null,
      currency: input.currency || 'KES',
      short_description: input.short_description.trim(),
      description: input.description.trim(),
      responsibilities: input.responsibilities ?? [],
      requirements: input.requirements ?? [],
      benefits: input.benefits ?? [],
      skills: input.skills ?? [],
      application_url: input.application_url?.trim() || null,
      application_email: input.application_email?.trim() || null,
      application_deadline: input.application_deadline || null,
      is_featured: input.is_featured ?? false,
      status: input.status ?? 'draft',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateCareerAction]', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  revalidatePath(`/careers/${slug}`)
  return { success: true, data: data as Career }
}

// ── Status Toggle ──────────────────────────────────────────
export async function updateCareerStatusAction(id: string, status: CareerStatus): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('careers').update({ status }).eq('id', id)

  if (error) {
    console.error('[updateCareerStatusAction]', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  return { success: true }
}

// ── Toggle Featured ────────────────────────────────────────
export async function toggleCareerFeaturedAction(id: string, is_featured: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('careers').update({ is_featured }).eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  return { success: true }
}

// ── Delete ─────────────────────────────────────────────────
export async function deleteCareerAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('careers').delete().eq('id', id)

  if (error) {
    console.error('[deleteCareerAction]', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  return { success: true }
}

// ── Duplicate ──────────────────────────────────────────────
export async function duplicateCareerAction(id: string): Promise<ActionResult<Career>> {
  const supabase = await createClient()
  const { data: original, error: fetchErr } = await supabase
    .from('careers')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !original) {
    return { success: false, error: 'Original career not found.' }
  }

  const newTitle = `${original.title} (Copy)`
  const newSlug = await ensureUniqueSlug(supabase, slugify(newTitle))

  const {
    id: _id, created_at: _ca, updated_at: _ua, published_at: _pa,
    views: _v, applications_count: _ac, ...rest
  } = original

  const { data, error } = await supabase
    .from('careers')
    .insert({
      ...rest,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      is_featured: false,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/careers')
  return { success: true, data: data as Career }
}