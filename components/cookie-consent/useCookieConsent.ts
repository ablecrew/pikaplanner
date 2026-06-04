'use client'

import { useEffect, useState, useCallback } from 'react'

// 🔧 Bump this version whenever your Cookie Policy materially changes.
// Users will be re-prompted to consent.
export const CONSENT_VERSION = '1.0.0'
export const CONSENT_STORAGE_KEY = 'pika_consent'
export const CONSENT_EVENT = 'pika:consent-changed'

export type ConsentCategories = {
  necessary: true // always true, cannot be disabled
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export type ConsentState = {
  version: string
  timestamp: string
  categories: ConsentCategories
}

export const DEFAULT_CONSENT: ConsentCategories = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
}

/** Read consent from localStorage (SSR-safe). */
export function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

/** Persist consent and broadcast change. */
export function setStoredConsent(categories: ConsentCategories): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: { ...categories, necessary: true },
  }
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }))
  return state
}

/** Clear consent (used by "Cookie Settings" to re-prompt). */
export function clearStoredConsent() {
  window.localStorage.removeItem(CONSENT_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }))
}

/**
 * useCookieConsent — reactive hook.
 * Use this in components to conditionally render scripts/widgets:
 *
 *   const { categories } = useCookieConsent()
 *   if (categories?.analytics) loadGoogleAnalytics()
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setConsent(getStoredConsent())
    setIsReady(true)

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState | null>).detail
      setConsent(detail)
    }
    window.addEventListener(CONSENT_EVENT, handler)
    return () => window.removeEventListener(CONSENT_EVENT, handler)
  }, [])

  const update = useCallback((categories: ConsentCategories) => {
    setStoredConsent(categories)
  }, [])

  const reset = useCallback(() => {
    clearStoredConsent()
  }, [])

  return {
    isReady,                       // hydrated yet?
    hasConsented: !!consent,       // has user made any choice?
    categories: consent?.categories ?? null,
    timestamp: consent?.timestamp ?? null,
    update,
    reset,
  }
}