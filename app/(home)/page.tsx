import LandingPage from './LandingPage'
import {
  fetchReviewsAction,
  fetchReviewStatsAction,
} from '@/app/(public)/_components/reviews/actions'

export const revalidate = 60 // ISR — refresh every 60 seconds

export default async function HomePage() {
  // Fetch live reviews + stats in parallel
  const [reviews, stats] = await Promise.all([
    fetchReviewsAction({ limit: 12 }),
    fetchReviewStatsAction(),
  ])

  return <LandingPage initialReviews={reviews} initialStats={stats} />
}