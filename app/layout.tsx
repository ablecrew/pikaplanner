import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import CookieConsentBanner from '@/components/cookie-consent/CookieConsentBanner'

const inter = Inter({ subsets: ['latin'] })

// 🌐 Environment-based site URL
// Set NEXT_PUBLIC_SITE_URL=https://pikaplan.com in Vercel for production.
// Preview/staging deployments will fall back to the Vercel URL and stay noindex.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pikaplanner.vercel.app'
const isProduction = SITE_URL === 'https://pikaplan.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Pika Plan – Smart Meal Planning',
    template: '%s | Pika Plan',
  },
  description: 'Plan your meals, cook or order from local vendors.',
  applicationName: 'Pika Plan',
  keywords: [
    'meal planning',
    'smart meal planner',
    'food delivery Kenya',
    'AI meal plans',
    'Pika Plan',
  ],
  authors: [{ name: 'Pika Plan Technologies Ltd' }],
  creator: 'Pika Plan Technologies Ltd',
  publisher: 'Pika Plan Technologies Ltd',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pika Plan – Smart Meal Planning',
    description: 'Plan your meals, cook or order from local vendors.',
    url: SITE_URL,
    siteName: 'Pika Plan',
    locale: 'en_KE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pika Plan – Smart Meal Planning',
    description: 'Plan your meals, cook or order from local vendors.',
  },
  robots: {
    index: isProduction,
    follow: isProduction,
    googleBot: {
      index: isProduction,
      follow: isProduction,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* 🍪 Global cookie consent — must mount on every page */}
        <CookieConsentBanner />
      </body>
    </html>
  )
}