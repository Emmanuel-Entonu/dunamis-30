import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  devIndicators: false,
  // Don't tell visitors which software runs the site (Next.js and Payload both added it).
  poweredByHeader: false,
  // Testimony / story forms carry a photo (already shrunk in the browser to ~0.5 MB).
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    // YouTube's thumbnails, for cards of testimonies and stories that are YouTube videos.
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
    formats: ['image/webp'],
    // Every photo is served at quality 90: Next uses the closest allowed value, so this one entry covers them all.
    qualities: [90],
    // Fewer sizes means each one is shared by more visitors, so more of them are already cached.
    // 2048 lets wide photos stay sharp on high-density screens.
    deviceSizes: [640, 828, 1080, 1440, 1920, 2048],
    imageSizes: [96, 128, 256, 384, 512],
    // Built-in images have the file's fingerprint in their address, and uploads get new names.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // The dashboard everyone uses is at /dashboard. Payload's screens stay behind it as a fallback.
  async redirects() {
    return [
      { source: '/admin', destination: '/dashboard', permanent: false },
      { source: '/admin/login', destination: '/dashboard', permanent: false },
    ]
  },
  async headers() {
    return [
      // The home page's film carries its version in the address, so browsers can keep it.
      { source: '/films/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The card generator can use the camera. Nothing on the site needs the rest.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          // Only the parts of a security policy that can't break the site: no injected <base> tag or plugins,
          // no framing by other sites, and forms only ever post to this site. Scripts and pictures aren't restricted.
          { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'" },
        ],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
