'use server'

import { createClient } from '@supabase/supabase-js'

export async function createUser(formData: FormData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string

  // 1. Create the Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role },
  })

  if (authError) return { error: authError.message }

  // 2. Create the Profile Row
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      full_name: name,
      role: role === 'Admin' ? 'admin' : 'user',
      is_active: true,
    })

  if (profileError) return { error: profileError.message }

  return { success: true }
}