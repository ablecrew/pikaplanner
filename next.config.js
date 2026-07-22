/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Image optimization from external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'rzimgfcypixkoyefrfga.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'pikaplanner.com',
      },
      {
        protocol: 'https',
        hostname: 'pikaplanner.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // ✅ React strict mode
  reactStrictMode: true,

  // ✅ Silence Turbopack warning (no custom config needed)
  turbopack: {},

  // ✅ Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

export default nextConfig