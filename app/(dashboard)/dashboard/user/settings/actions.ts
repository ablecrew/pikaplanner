'use server'

import { createClient } from '@/lib/supabase/server'

export async function deactivateAccount(userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.auth.signOut()
  return { success: true }
}