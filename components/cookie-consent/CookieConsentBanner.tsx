'use client'

import { useEffect, useState } from 'react'
import { Cookie } from 'lucide-react'
import Link from 'next/link'
import CookiePreferencesModal from './CookiePreferencesModal'
import {
  type ConsentCategories,
  getStoredConsent,
  setStoredConsent,
  CONSENT_EVENT,
} from './useCookieConsent'

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false)
  const [openPrefs, setOpenPrefs] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Determine whether to display the banner (SSR-safe)
  useEffect(() => {
    setMounted(true)
    const consent = getStoredConsent()
    setShow(!consent)

    // Listen for external clear (e.g., "Cookie Settings" button)
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail === null) {
        setShow(true)
        setOpenPrefs(true)
      } else {
        setShow(false)
      }
    }
    window.addEventListener(CONSENT_EVENT, handler)
    return () => window.removeEventListener(CONSENT_EVENT, handler)
  }, [])

  if (!mounted) return null

  const handleAcceptAll = () => {
    setStoredConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    })
    setShow(false)
  }

  const handleRejectAll = () => {
    setStoredConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    })
    setShow(false)
  }

  const handleSaveCustom = (categories: ConsentCategories) => {
    setStoredConsent(categories)
    setOpenPrefs(false)
    setShow(false)
  }

  return (
    <>
      {show && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-[90] p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-5xl mx-auto pointer-events-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              {/* Message */}
              <div className="flex-1 flex items-start gap-3">
                <div className="hidden sm:flex h-10 w-10 rounded-full bg-emerald-50 items-center justify-center flex-shrink-0">
                  <Cookie className="text-[#1A5C3A]" size={20} />
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="font-semibold text-gray-900 mb-1">
                    We value your privacy
                  </p>
                  <p>
                    Pika Plan uses cookies to deliver core functionality, analyse usage, and
                    improve our AI meal recommendations. You can accept all, reject non-essential
                    cookies, or customise your preferences. Read our{' '}
                    <Link
                      href="/cookies"
                      className="underline font-medium text-[#1A5C3A] hover:text-[#0d3d26]"
                    >
                      Cookie Policy
                    </Link>{' '}
                    for full details.
                  </p>
                </div>
              </div>

              {/* Actions — equal visual weight (Reject as prominent as Accept) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex gap-2 lg:gap-2 lg:flex-shrink-0">
                <button
                  onClick={() => setOpenPrefs(true)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
                >
                  Customise
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2.5 rounded-lg bg-[#1A5C3A] hover:bg-[#145032] text-white text-sm font-semibold transition"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CookiePreferencesModal
        open={openPrefs}
        initial={getStoredConsent()?.categories ?? null}
        onClose={() => setOpenPrefs(false)}
        onSave={handleSaveCustom}
      />
    </>
  )
}