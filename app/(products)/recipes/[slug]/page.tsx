import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchRecipeBySlug } from '../actions'
import RecipeDetailClient from './RecipeDetailClient'

export const dynamic = 'force-dynamic'

export default async function RecipeDetailPage({
    params,
  }: {
    params: Promise<{ slug: string }>
  }) {
    const { slug } = await params
    console.log(`📄 Page hit! Slug: ${slug}`)
  
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('👤 User:', user?.id, authError)
    
    if (!user) redirect('/login')
  
    const recipe = await fetchRecipeBySlug(slug)
    console.log('📝 Recipe result:', recipe ? 'Found' : 'NULL')
  
    if (!recipe) notFound()
  
    return <RecipeDetailClient recipe={recipe} />
  }