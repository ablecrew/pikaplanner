'use client'

import { Settings } from 'lucide-react'
import { clearStoredConsent } from './useCookieConsent'

/**
 * Place this in your Footer.tsx so users can re-open the banner
 * any time to change their consent. Required by GDPR & Kenya DPA 2019.
 */
export default function CookieSettingsButton({
  className = '',
  label = 'Cookie Settings',
}: {
  className?: string
  label?: string
}) {
  return (
    <button
      onClick={clearStoredConsent}
      className={
        className ||
        'inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A5C3A] transition'
      }
    >
      <Settings size={14} />
      {label}
    </button>
  )
}