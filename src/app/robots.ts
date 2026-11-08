import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    // Every visit's testimony pages have their own links (the mix= part). The sitemap already lists each
    // testimony, so search engines don't need to wander through those.
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/watch', '/testimonies?*mix='] },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
