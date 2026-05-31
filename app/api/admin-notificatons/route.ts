import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
type Audience = 'all' | 'users' | 'vendors' | 'admins' | 'single'
function getAdminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return { url, serviceRoleKey }
}
function createServerSupabase(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // no-op for route handler
        },
      },
    },
  )
}
async function adminRest<T>(path: string, options?: RequestInit): Promise<T> {
  const config = getAdminConfig()
  if (!config) throw new Error('Missing Supabase server configuration.')
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
  if (response.status === 204) {
    return null as T
  }
  return (await response.json()) as T
}
async function ensureAdmin(request: NextRequest) {
  const supabase = createServerSupabase(request)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'superadmin'].includes((profile as { role?: string }).role || '')) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true as const, userId: user.id }
}
async function getRecipients(audience: Audience, targetUserId?: string) {
  if (audience === 'single') {
    return targetUserId ? [targetUserId] : []
  }
  const roleFilter =
    audience === 'users' ? 'user' : audience === 'vendors' ? 'vendor' : audience === 'admins' ? 'admin' : null
  const query = roleFilter
    ? `profiles?select=id&role=eq.${roleFilter}`
    : 'profiles?select=id'
  const rows = await adminRest<Array<{ id: string }>>(query, { method: 'GET' })
  return rows.map((row) => row.id)
}
export async function GET(request: NextRequest) {
  const admin = await ensureAdmin(request)
  if (!admin.ok) return admin.response
  try {
    const rows = await adminRest<Array<Record<string, unknown>>>(
      'notification_logs?select=*&order=created_at.desc&limit=200',
      { method: 'GET' },
    )
    return NextResponse.json({ success: true, notifications: rows })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch notifications.' },
      { status: 400 },
    )
  }
}
export async function POST(request: NextRequest) {
  const admin = await ensureAdmin(request)
  if (!admin.ok) return admin.response
  try {
    const body = (await request.json()) as {
      title: string
      message: string
      type: 'info' | 'success' | 'warning' | 'error'
      audience: Audience
      targetUserId?: string
    }
    const recipients = await getRecipients(body.audience, body.targetUserId)
    const payload = recipients.map((userId) => ({
      user_id: userId,
      title: body.title,
      message: body.message,
      type: body.type,
      read: false,
      channel: 'in_app',
      created_at: new Date().toISOString(),
    }))
    if (payload.length === 0) {
      return NextResponse.json({ success: false, error: 'No recipients found.' }, { status: 400 })
    }
    await adminRest('notification_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
    })
    return NextResponse.json({ success: true, message: 'Notifications sent successfully.' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send notification.' },
      { status: 400 },
    )
  }
}
export async function PATCH(request: NextRequest) {
  const admin = await ensureAdmin(request)
  if (!admin.ok) return admin.response
  try {
    const body = (await request.json()) as {
      id?: string
      action: 'mark-read' | 'mark-all-read'
    }
    if (body.action === 'mark-all-read') {
      await adminRest('notification_logs?read=eq.false', {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ read: true }),
      })
      return NextResponse.json({ success: true })
    }
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Notification id is required.' }, { status: 400 })
    }
    await adminRest(`notification_logs?id=eq.${body.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ read: true }),
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update notification.' },
      { status: 400 },
    )
  }
}
export async function DELETE(request: NextRequest) {
  const admin = await ensureAdmin(request)
  if (!admin.ok) return admin.response
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const clearAll = url.searchParams.get('clear') === 'true'
    if (clearAll) {
      await adminRest('notification_logs?id=not.is.null', {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      })
      return NextResponse.json({ success: true })
    }
    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification id is required.' }, { status: 400 })
    }
    await adminRest(`notification_logs?id=eq.${id}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete notification.' },
      { status: 400 },
    )
  }
}