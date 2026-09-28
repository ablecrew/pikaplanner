import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/discover', '/meal-plans', '/shopping-list', '/profile', '/vendor']
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']
const PUBLIC_ROUTES = ['/', '/vendor-signup']
// Simple in-memory rate limiting (use Redis in production for multi-instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  // Skip public routes entirely — no auth check needed
  if (PUBLIC_ROUTES.some(r => pathname === r)) {
    return NextResponse.next({ request })
  }
  // Rate limit auth endpoints aggressively
  const isAuthEndpoint = pathname.startsWith('/api/auth') || AUTH_ROUTES.some(r => pathname.startsWith(r))
  if (isAuthEndpoint) {
    const allowed = checkRateLimit(`auth:${ip}`, 20, 60 * 1000)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
    }
  }
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  // Redirect logged-in users away from auth pages
  if (user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  // Protect routes that require authentication — redirect to login if not signed in
  if (!user && PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }
  // ─── Role-based route protection ─────────────────────────────────────
  // Only check roles if user is authenticated AND on a role-specific route
  // The dashboard layout.tsx handles showing the correct sidebar
  // This middleware only BLOCKS unauthorized access
  if (user && (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/vendor') || (pathname.startsWith('/vendor') && !pathname.startsWith('/vendor-signup')))) {
    let userRole: string | null = null
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      userRole = profile?.role ?? null
    } catch {
      // If profile query fails (RLS, network, etc.), let the page handle it
      // Do NOT redirect — that causes the infinite loop
      userRole = null
    }
    // Only block if we SUCCESSFULLY got a profile and the role is wrong
    // If userRole is null (query failed), let through — page.tsx will handle it
    if (userRole !== null) {
      // Block non-admins from admin routes
      if (pathname.startsWith('/dashboard/admin') && !['admin', 'superadmin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // Block non-vendors from vendor routes
      if (
        (pathname.startsWith('/dashboard/vendor') || (pathname.startsWith('/vendor') && !pathname.startsWith('/vendor-signup'))) &&
        !['vendor', 'admin', 'superadmin'].includes(userRole)
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    // If userRole is null, we let the request through
    // The layout.tsx and page.tsx will handle role checks client-side
  }
  // Security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : ''
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
  
      // ✅ Allow Google Tag Manager + Google Analytics scripts
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com`,
  
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' data: https://fonts.gstatic.com`,
  
      // ✅ Allow GA tracking pixels and GTM preview images
      `img-src 'self' data: blob: https: https://www.google-analytics.com https://www.googletagmanager.com`,
  
      // ✅ Allow outgoing connections to Supabase, GA, and GTM
      `connect-src 'self' ${supabaseUrl} wss://${supabaseHost} https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.supabase.co wss://*.supabase.co`,
  
      // ✅ Allow GTM's iframe (used for preview/debug mode)
      `frame-src 'self' https://www.googletagmanager.com`,
  
      `object-src 'none'`,
      `base-uri 'self'`,
    ].join('; ')
  )
  return supabaseResponse
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}