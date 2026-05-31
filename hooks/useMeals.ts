'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Meal, CuisineType, MealCategory } from '@/types/database'

export interface MealWithVendors extends Meal {
  vendor_meals: Array<{
    id: string
    price: number
    is_available: boolean
    preparation_time_minutes: number | null
    vendor: {
      id: string
      business_name: string
      logo_url: string | null
      average_rating: number | null
      location_city: string
      is_accepting_orders: boolean
    }
  }>
}

export interface MealsFilter {
  search?: string
  cuisine?: CuisineType | 'all'
  category?: MealCategory | 'all'
  tags?: string[]
  maxCalories?: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'all'
}

export function useMeals(filters: MealsFilter = {}) {
  const [meals, setMeals] = useState<MealWithVendors[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMeals = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('meals')
        .select(`
          *,
          vendor_meals (
            id,
            price,
            is_available,
            preparation_time_minutes,
            vendor:vendors (
              id,
              business_name,
              logo_url,
              average_rating,
              location_city,
              is_accepting_orders
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Full-text search
      if (filters.search && filters.search.trim()) {
        query = query.textSearch('search_vector', filters.search.trim(), {
          type: 'websearch',
          config: 'english',
        })
      }

      // Cuisine filter
      if (filters.cuisine && filters.cuisine !== 'all') {
        query = query.eq('cuisine', filters.cuisine)
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      // Difficulty filter
      if (filters.difficulty && filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty)
      }

      // Calorie cap
      if (filters.maxCalories) {
        query = query.lte('calories_per_serving', filters.maxCalories)
      }

      // Tags filter (overlap — at least one matching tag)
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      const { data, error: fetchError } = await query.limit(60)

      if (fetchError) throw fetchError
      setMeals((data as MealWithVendors[]) || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch meals')
    } finally {
      setLoading(false)
    }
  }, [
    supabase,
    filters.search,
    filters.cuisine,
    filters.category,
    filters.difficulty,
    filters.maxCalories,
    JSON.stringify(filters.tags),
  ])

  useEffect(() => {
    void fetchMeals()
  }, [fetchMeals])

  return { meals, loading, error, refetch: fetchMeals }
}

// Hook to get a single meal with full recipe
export function useMealDetail(mealId: string | null) {
  const [meal, setMeal] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!mealId) return

    setLoading(true)
    setError(null)

    const fetchMeal = async () => {
      const { data, error: err } = await supabase
        .from('meals')
        .select(`
          *,
          recipe_ingredients (*),
          recipe_steps (*),
          vendor_meals (
            id, price, is_available, preparation_time_minutes,
            vendor:vendors (
              id, business_name, logo_url, average_rating,
              location_city, is_accepting_orders, phone, whatsapp_number
            )
          )
        `)
        .eq('id', mealId)
        .single()

      if (err) setError(err.message)
      else setMeal(data)

      setLoading(false)
    }

    void fetchMeal()
  }, [mealId, supabase])

  return { meal, loading, error }
}

// Hook for subscription plans
export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('price_kes', { ascending: true })

        if (error) throw error
        if (!cancelled) setPlans(data || [])
      } catch {
        if (!cancelled) setPlans([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchPlans()

    return () => {
      cancelled = true
    }
  }, [supabase])

  return { plans, loading }
}

// Hook for current user's active subscription
export function useUserSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, subscription_plans(*)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error
        if (!cancelled) setSubscription(data)
      } catch {
        if (!cancelled) setSubscription(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchSubscription()

    return () => {
      cancelled = true
    }
  }, [userId, supabase])

  return { subscription, loading }
}

// Hook for notifications
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchNotifs = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(20)

    setNotifications(data || [])
    setUnreadCount((data || []).filter((n: any) => !n.is_read).length)
  }, [userId, supabase])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase
      .from('notification_logs')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [userId, supabase])

  useEffect(() => {
    void fetchNotifs()

    // Real-time subscription for new notifications
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          setNotifications(prev => [payload.new as any, ...prev])
          setUnreadCount(c => c + 1)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifs, supabase])

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifs }
}