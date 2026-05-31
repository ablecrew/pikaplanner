'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

type Role = 'user' | 'vendor' | 'admin' | 'superadmin'

type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  subscription_tier: string
  is_verified: boolean
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function normalizeRole(value: unknown): Role | null {
  if (value === 'user' || value === 'vendor' || value === 'admin' || value === 'superadmin') {
    return value
  }
  return null
}

function resolveRole(
  currentUser: User | null | undefined,
  profileRole?: unknown
): Role {
  return (
    normalizeRole(profileRole) ||
    normalizeRole(currentUser?.app_metadata?.role) ||
    normalizeRole(currentUser?.user_metadata?.role) ||
    'user'
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const buildFallbackProfile = useCallback((currentUser: User): Profile => {
    const fullName =
      (currentUser.user_metadata?.full_name as string | undefined) ||
      (currentUser.user_metadata?.name as string | undefined) ||
      null

    return {
      id: currentUser.id,
      email: currentUser.email || '',
      full_name: fullName,
      avatar_url:
        (currentUser.user_metadata?.avatar_url as string | undefined) ||
        (currentUser.user_metadata?.picture as string | undefined) ||
        null,
      role: resolveRole(currentUser),
      subscription_tier: 'free',
      is_verified: false,
    }
  }, [])

  const fetchProfile = useCallback(
    async (userId: string, currentUser: User | null = null) => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, role')
          .eq('id', userId)
          .maybeSingle()

        const resolvedRole = resolveRole(currentUser, profileData?.role)

        // Fetch subscription separately (avoids broken join)
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('tier, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)

        if (profileData) {
          setProfile({
            id: profileData.id,
            email: profileData.email,
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            role: resolvedRole,
            is_verified: true,
            subscription_tier: subs?.[0]?.tier || 'free',
          })
          return
        }

        // If the profile row isn't available for any reason, fall back to auth user metadata
        if (currentUser) {
          setProfile({
            ...buildFallbackProfile(currentUser),
            role: resolvedRole,
            subscription_tier: subs?.[0]?.tier || 'free',
          })
          return
        }

        setProfile(null)
      } catch {
        // Final fallback: preserve a usable profile from the auth session if possible
        if (currentUser) {
          setProfile(buildFallbackProfile(currentUser))
        } else {
          setProfile(null)
        }
      }
    },
    [supabase, buildFallbackProfile]
  )

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id, user)
  }, [user, fetchProfile])

  useEffect(() => {
    let cancelled = false

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (cancelled) return

        const currentSession = data.session
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          void fetchProfile(currentSession.user.id, currentSession.user)
        } else {
          setProfile(null)
        }

        setIsLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, currentSession: Session | null) => {
        if (cancelled) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id, currentSession.user)
        } else {
          setProfile(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!user,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}