export type ChangeType = 'feature' | 'improvement' | 'fix' | 'security' | 'breaking' | 'performance'

export type ChangeItem = {
  type: ChangeType
  title: string
  description: string
  area?: string  // e.g., "Meal Plans", "Vendor Dashboard", "AI"
}

export type Release = {
  version: string
  date: string                       // ISO
  title: string
  summary: string
  isMajor?: boolean
  isBeta?: boolean
  heroChange?: string                 // featured change to highlight
  changes: ChangeItem[]
  // ── Analytics ──
  metrics?: {
    usersImpacted?: number            // e.g., 8543
    adoptionRate?: number             // 0-100
    feedbackScore?: number            // 0-5
    feedbackCount?: number
    bugsFixed?: number
    performanceGain?: string          // e.g., "+34% faster"
  }
}

// ── Type Metadata ─────────────────────────────────────────
export const CHANGE_TYPE_META: Record<ChangeType, {
  label: string
  iconName: 'sparkles' | 'zap' | 'wrench' | 'shield' | 'alert-triangle' | 'rocket'
  color: string
  bg: string
}> = {
  feature:     { label: 'New Feature',  iconName: 'sparkles',        color: '#1A5C3A', bg: '#f0fdf4' },
  improvement: { label: 'Improvement',  iconName: 'zap',             color: '#2563eb', bg: '#eff6ff' },
  fix:         { label: 'Bug Fix',      iconName: 'wrench',          color: '#f97316', bg: '#fff7ed' },
  security:    { label: 'Security',     iconName: 'shield',          color: '#dc2626', bg: '#fef2f2' },
  breaking:    { label: 'Breaking',     iconName: 'alert-triangle',  color: '#F4A535', bg: '#fffbeb' },
  performance: { label: 'Performance',  iconName: 'rocket',          color: '#7c3aed', bg: '#f5f3ff' },
}

// ── Releases ──────────────────────────────────────────────
export const RELEASES: Release[] = [
  {
    version: '2.4.0',
    date: '2026-05-28T10:00:00Z',
    title: 'Smarter AI, Faster Plans',
    summary: 'Major AI upgrade delivers more variety, better cuisine matching, and 40% faster meal plan generation.',
    isMajor: true,
    heroChange: 'Meal plan generation is now 40% faster, with 3× better cuisine variety',
    metrics: {
      usersImpacted: 8543,
      adoptionRate: 87,
      feedbackScore: 4.7,
      feedbackCount: 1240,
      bugsFixed: 12,
      performanceGain: '+40% faster',
    },
    changes: [
      {
        type: 'feature',
        area: 'AI',
        title: 'Snack slot for premium users',
        description: 'Premium subscribers now get 4 meals per day (breakfast, lunch, dinner, and snack) for more balanced nutrition.',
      },
      {
        type: 'feature',
        area: 'Meal Plans',
        title: 'Smart variety engine',
        description: 'Our AI now prevents back-to-back repeats and ensures cuisine variety across the week.',
      },
      {
        type: 'performance',
        area: 'AI',
        title: '40% faster generation',
        description: 'Meal plans now generate in under 8 seconds (down from 13s) thanks to GPT-4o-mini optimizations.',
      },
      {
        type: 'improvement',
        area: 'Vendor Dashboard',
        title: 'Bulk order management',
        description: 'Vendors can now accept, reject, or update multiple orders at once from the dashboard.',
      },
      {
        type: 'fix',
        title: 'Fixed meal plan empty state',
        description: 'Resolved an issue where some users saw an empty page after generating a plan.',
      },
      {
        type: 'fix',
        area: 'Notifications',
        title: 'Push notifications working again',
        description: 'Fixed a regression that prevented push notifications on Android browsers.',
      },
    ],
  },
  {
    version: '2.3.2',
    date: '2026-05-12T09:00:00Z',
    title: 'Mobile Polish & Stability',
    summary: 'Smaller release focused on mobile UX improvements and stability fixes reported by our community.',
    metrics: {
      usersImpacted: 6240,
      bugsFixed: 8,
      feedbackScore: 4.5,
      feedbackCount: 380,
    },
    changes: [
      {
        type: 'improvement',
        area: 'Mobile',
        title: 'Improved touch targets',
        description: 'All buttons and links now meet accessibility minimums (44×44px) on mobile devices.',
      },
      {
        type: 'fix',
        area: 'Shopping List',
        title: 'Fixed swipe-to-check on iOS',
        description: 'Resolved a Safari-specific bug that prevented swiping items off the list.',
      },
      {
        type: 'fix',
        area: 'Auth',
        title: 'Fixed Google sign-in on Android',
        description: 'OAuth callback now correctly redirects after Google sign-in on Android Chrome.',
      },
      {
        type: 'performance',
        title: 'Smaller bundle size',
        description: 'Reduced the JavaScript bundle by 18% (240 KB → 197 KB) for faster page loads.',
      },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-04-22T11:00:00Z',
    title: 'Vendor Marketplace Goes Live',
    summary: 'The biggest update yet — order meals directly from local vendors, with M-Pesa checkout and real-time tracking.',
    isMajor: true,
    heroChange: 'Order meals from 200+ vendors with M-Pesa checkout in under 30 seconds',
    metrics: {
      usersImpacted: 12500,
      adoptionRate: 64,
      feedbackScore: 4.8,
      feedbackCount: 2150,
      performanceGain: 'New marketplace',
    },
    changes: [
      {
        type: 'feature',
        area: 'Marketplace',
        title: 'Browse and order from vendors',
        description: 'Discover 200+ home chefs, restaurants, and food trucks. Filter by cuisine, price, and delivery time.',
      },
      {
        type: 'feature',
        area: 'Payments',
        title: 'M-Pesa STK Push checkout',
        description: 'Complete payments in 30 seconds with M-Pesa STK Push. No copy-paste needed.',
      },
      {
        type: 'feature',
        area: 'Orders',
        title: 'Real-time order tracking',
        description: 'See live status from kitchen → out for delivery → delivered, with SMS notifications.',
      },
      {
        type: 'feature',
        area: 'Reviews',
        title: 'Rate your meals',
        description: 'Leave a star rating and optional photo review after each order.',
      },
      {
        type: 'improvement',
        area: 'Recommendations',
        title: 'Personalized vendor suggestions',
        description: 'Vendors are now ranked by your taste history and proximity for faster discovery.',
      },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-04-05T08:00:00Z',
    title: 'Multi-Device Sync & Offline Mode',
    summary: 'Your meal plans, shopping list, and preferences now sync seamlessly across all devices — even offline.',
    metrics: {
      usersImpacted: 9800,
      adoptionRate: 76,
      feedbackScore: 4.6,
      feedbackCount: 890,
      bugsFixed: 5,
    },
    changes: [
      {
        type: 'feature',
        title: 'Progressive Web App support',
        description: 'Install Pika Plan on your home screen for an app-like experience without the App Store.',
      },
      {
        type: 'feature',
        area: 'Shopping List',
        title: 'Offline shopping list',
        description: 'Check items off in the supermarket even with no internet — syncs when you reconnect.',
      },
      {
        type: 'improvement',
        title: 'Real-time cross-device sync',
        description: 'Changes on your phone instantly reflect on desktop and tablet, powered by Supabase Realtime.',
      },
      {
        type: 'security',
        title: 'Enhanced session security',
        description: 'Added device fingerprinting to detect and alert on unusual sign-ins.',
      },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-18T10:30:00Z',
    title: 'Account Security Upgrade',
    summary: 'Two-factor authentication, session management, and a complete account settings overhaul.',
    metrics: {
      usersImpacted: 7200,
      adoptionRate: 42,
      feedbackScore: 4.9,
      feedbackCount: 1100,
    },
    changes: [
      {
        type: 'security',
        title: 'Two-factor authentication (2FA)',
        description: 'Protect your account with an authenticator app like Google Authenticator or Authy.',
      },
      {
        type: 'feature',
        area: 'Settings',
        title: 'New Account Settings hub',
        description: 'Beautifully redesigned settings with tabs for General, Security, Notifications, Privacy, and Billing.',
      },
      {
        type: 'feature',
        area: 'Privacy',
        title: 'GDPR-compliant data export',
        description: 'Download all your personal data in one click. Required reading: our updated Privacy Policy.',
      },
      {
        type: 'feature',
        area: 'Security',
        title: 'Active sessions management',
        description: 'View and revoke any device signed into your account.',
      },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-02-14T12:00:00Z',
    title: 'Pika Plan 2.0',
    summary: 'A complete platform redesign, our first AI meal generator, and a brand-new vendor onboarding flow.',
    isMajor: true,
    heroChange: 'Generate personalized 7-day meal plans in seconds with our new AI engine',
    metrics: {
      usersImpacted: 5800,
      adoptionRate: 92,
      feedbackScore: 4.7,
      feedbackCount: 2400,
      performanceGain: '+200% faster overall',
    },
    changes: [
      {
        type: 'feature',
        area: 'AI',
        title: 'AI Meal Plan Generator',
        description: 'Generate a personalized 7-day meal plan based on your dietary preferences, budget, and household size.',
      },
      {
        type: 'feature',
        title: 'Complete redesign',
        description: 'Fresh new look with our forest green brand palette, premium typography, and a polished mobile experience.',
      },
      {
        type: 'feature',
        area: 'Vendors',
        title: 'Vendor signup portal',
        description: 'New 5-step application flow for vendors to join the platform with auto-document review.',
      },
      {
        type: 'breaking',
        title: 'New API endpoints',
        description: 'Third-party integrations should migrate to v2 endpoints by Aug 2026. See migration guide.',
      },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-01-20T09:00:00Z',
    title: 'Holiday Polish',
    summary: 'New holiday-themed meals, performance improvements, and various community-requested fixes.',
    metrics: {
      usersImpacted: 4200,
      bugsFixed: 14,
      feedbackScore: 4.5,
      feedbackCount: 520,
    },
    changes: [
      {
        type: 'feature',
        area: 'Recipes',
        title: '30+ holiday meal recipes',
        description: 'New Kenyan holiday classics including pilau, mukimo, and special Christmas day menus.',
      },
      {
        type: 'improvement',
        area: 'Search',
        title: 'Faster search with fuzzy matching',
        description: 'Find meals 3× faster, even with typos or partial ingredient matches.',
      },
      {
        type: 'performance',
        title: 'Image loading optimizations',
        description: 'Meal images now lazy-load with blur placeholders for a smoother browsing experience.',
      },
    ],
  },
]

// ── Helper Functions ──────────────────────────────────────
export function getTotalReleasesThisYear(): number {
  const year = new Date().getFullYear()
  return RELEASES.filter((r) => new Date(r.date).getFullYear() === year).length
}

export function getAllChanges(): ChangeItem[] {
  return RELEASES.flatMap((r) => r.changes)
}

export function getChangesByType(type: ChangeType): number {
  return getAllChanges().filter((c) => c.type === type).length
}

export function getAverageReleaseSize(): number {
  if (!RELEASES.length) return 0
  return Math.round(RELEASES.reduce((sum, r) => sum + r.changes.length, 0) / RELEASES.length)
}

export function getTotalUsersImpacted(): number {
  return Math.max(...RELEASES.map((r) => r.metrics?.usersImpacted ?? 0))
}

export function getAverageFeedbackScore(): number {
  const scores = RELEASES
    .map((r) => r.metrics?.feedbackScore)
    .filter((s): s is number => typeof s === 'number')
  if (!scores.length) return 0
  return scores.reduce((a, b) => a + b, 0) / scores.length
}