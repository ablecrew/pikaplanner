'use server'

import { createClient } from '@/lib/supabase/server'
import type { Career } from '@/app/(dashboard)/dashboard/admin/careers/actions'

// Re-export types for client components
export type { Career } from '@/app/(dashboard)/dashboard/admin/careers/actions'

// Public: only fetch published careers
export async function fetchPublishedCareers(): Promise<Career[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchPublishedCareers]', error)
    return []
  }

  return (data as Career[]) ?? []
}

export async function fetchCareerBySlug(slug: string): Promise<Career | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('[fetchCareerBySlug]', error)
    return null
  }

  // Fire-and-forget view increment (don't block render)
  if (data) {
    supabase
      .from('careers')
      .update({ views: (data.views ?? 0) + 1 })
      .eq('id', data.id)
      .then(() => {})
  }

  return data as Career
}

export async function fetchRelatedCareers(
  currentSlug: string,
  department: string,
  limit = 3
): Promise<Career[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('status', 'published')
    .eq('department', department)
    .neq('slug', currentSlug)
    .limit(limit)

  if (error || !data) return []
  return data as Career[]
}