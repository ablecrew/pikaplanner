import type { Metadata } from 'next'
import CareersAdminClient from './CareersAdminClient'
import { fetchCareers } from './actions'

export const metadata: Metadata = {
  title: 'Careers Admin | Pika Plan',
  description: 'Manage job postings on Pika Plan.',
  robots: { index: false, follow: false },
}

export default async function CareersAdminPage() {
  const careers = await fetchCareers()

  return (
      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <CareersAdminClient initial={careers} />
        </div>
      </main>
  )
}