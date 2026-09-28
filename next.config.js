/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'rzimgfcypixkoyefrfga.supabase.co' },
      { protocol: 'https', hostname: 'pikaplanner.com' },
      { protocol: 'https', hostname: 'pikaplanner.vercel.app' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.africanbites.com' },
      { protocol: 'https', hostname: 'africanbites.com' }
    ],
  },

  reactStrictMode: true,
  turbopack: {},

  // ✅ Only non-CSP security headers here (CSP is handled in middleware.ts)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

export default nextConfig