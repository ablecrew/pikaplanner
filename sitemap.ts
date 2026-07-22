import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pikaplanner.com'

  // Static routes
  const staticRoutes = [
    '',
    '/login',
    '/signup',
    '/forgot-password',
    '/onboarding',
    '/shopping',
    '/meal-generator',
  ]

  // Dynamic routes (add your actual routes)
  const dynamicRoutes = [
    '/dashboard/user/overview',
    '/dashboard/user/subscription',
    '/dashboard/user/history',
    '/dashboard/user/transactions',
    '/dashboard/admin/overview',
    '/dashboard/admin/transactions',
    '/dashboard/admin/analytics',
    '/dashboard/vendor/overview',
    '/dashboard/vendor/subscription',
  ]

  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Static routes
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Dynamic routes (authenticated - lower priority)
    ...dynamicRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
  ]
}