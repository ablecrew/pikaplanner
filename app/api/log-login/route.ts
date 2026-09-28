import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    // ✅ Check if this is the user's first login by seeing if they already
    // have any notification logs with the 'login' trigger
    const { data: existingLogs } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('metadata->>trigger', 'login')
      .limit(1)

    const isFirstLogin = !existingLogs || existingLogs.length === 0

    await supabase.from('notification_logs').insert({
      user_id: user.id,
      title: isFirstLogin
        ? `🎉 Welcome to PikaPlan, ${fullName}!`
        : `👋 Welcome back, ${fullName}!`,
      body: isFirstLogin
        ? 'Start exploring delicious meals, create your first meal plan, and discover local vendors.'
        : 'Ready to continue your meal planning journey?',
      type: 'system',
      channel: 'in_app',
      is_read: false,
      sent_at: new Date().toISOString(),
      metadata: { trigger: 'login', first_login: isFirstLogin },
    })

    return NextResponse.json({ ok: true, firstLogin: isFirstLogin })
  } catch (err) {
    console.error('log-login error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}