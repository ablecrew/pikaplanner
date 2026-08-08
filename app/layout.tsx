import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import CookieConsentBanner from '@/components/cookie-consent/CookieConsentBanner'

const inter = Inter({ subsets: ['latin'] })

// 🌐 Environment-based site URL
// Set NEXT_PUBLIC_SITE_URL=https://pikaplanner.com in Vercel for production.
// Preview/staging deployments will fall back to the Vercel URL and stay noindex.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pikaplanner.vercel.app'
const isProduction = SITE_URL === 'https://pikaplanner.com'

// 📊 Google Analytics 4 Measurement ID
// Replace with your actual GA4 Measurement ID from analytics.google.com
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-Q06D4XG61C'

// ️ Structured Data (Schema.org) for Google Product Listing
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Pika Plan',
  url: SITE_URL,
  description: 'Smart meal planning app for Kenya. Plan meals, generate shopping lists, and order from local vendors.',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KES',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
  author: {
    '@type': 'Organization',
    name: 'Pika Plan Ltd',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
    },
  },
  featureList: [
    'AI-powered meal suggestions',
    'Smart shopping list generation',
    'Local vendor ordering',
    'Nutrition tracking',
    'Dietary preference customization',
  ],
  screenshot: `${SITE_URL}/og-image.png`,
  releaseNotes: 'https://pikaplanner.com/changelog',
}

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
    'grocery shopping',
    'recipe finder',
    'nutrition tracker',
  ],
  authors: [{ name: 'Pika Plan Technologies Ltd' }],
  creator: 'Pika Plan Technologies Ltd',
  publisher: 'Pika Plan Technologies Ltd',
  alternates: {
    canonical: '/',
    languages: {
      'en-KE': '/',
    },
  },
  openGraph: {
    title: 'Pika Plan – Smart Meal Planning',
    description: 'Plan your meals, cook or order from local vendors.',
    url: SITE_URL,
    siteName: 'Pika Plan',
    locale: 'en_KE',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Pika Plan - Smart Meal Planning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pika Plan – Smart Meal Planning',
    description: 'Plan your meals, cook or order from local vendors.',
    images: [`${SITE_URL}/og-image.png`],
    creator: '@pikaplan',
  },
  robots: {
    index: isProduction,
    follow: isProduction,
    googleBot: {
      index: isProduction,
      follow: isProduction,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* 🏷️ Structured Data for Google Product Listing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/*  Google Search Console Verification */}
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta
            name="google-site-verification"
            content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
          />
        )}
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* 🍪 Global cookie consent — must mount on every page */}
        <CookieConsentBanner />

        {/* 📊 Google Analytics 4 - Production Only */}
        {isProduction && (
          <GoogleAnalytics gaId={GA4_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}