import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  devIndicators: false,
  // Testimony / story forms carry a photo (already shrunk in the browser to ~0.5 MB).
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
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
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The card generator can use the camera. Nothing on the site needs the rest.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
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
