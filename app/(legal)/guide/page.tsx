import type { Metadata } from 'next'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import GuideBook from './GuideBook'
import { CHAPTERS } from './_data/chapters'

export const metadata: Metadata = {
  title: 'User Guide | Pika Plan',
  description:
    'The complete handbook for using Pika Plan — explore chapter by chapter like a real book.',
  keywords: [
    'Pika Plan user guide',
    'meal planning guide',
    'how to use Pika Plan',
    'AI meal plan tutorial',
    'food delivery Kenya guide',
  ],
  alternates: { canonical: '/guide' },
  openGraph: {
    title: 'User Guide | Pika Plan',
    description: 'Master Pika Plan with our interactive book-style user guide.',
    url: '/guide',
    siteName: 'Pika Plan',
    type: 'article',
    locale: 'en_KE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'User Guide | Pika Plan',
    description: 'Master Pika Plan with our interactive book-style user guide.',
  },
}

export default function GuidePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#f5f1e8] via-[#f0ebe0] to-[#e8e0d0] font-poppins py-6 sm:py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Page title */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-[#3d2817] mb-2 tracking-tight">
              📖 The Pika Plan Handbook
            </h1>
            <p className="text-sm text-[#6b4a2e]">
              Your complete guide to meal planning, ordering, and more.
            </p>
          </div>

          {/* The Book */}
          <GuideBook chapters={CHAPTERS} />
        </div>
      </main>
      <Footer />
    </>
  )
}