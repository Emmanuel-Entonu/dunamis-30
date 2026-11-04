import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/content'
import { navItems, siteUrl } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [...navItems.map((n) => n.href), '/privacy', '/terms'].map((href) => ({
    url: `${siteUrl}${href === '/' ? '' : href}`,
    changeFrequency: 'weekly',
    priority: href === '/' ? 1 : 0.8,
  }))

  try {
    const payload = await getPayloadClient()
    const approved = { status: { equals: 'approved' } } as const
    const [testimonies, sons] = await Promise.all([
      payload.find({ collection: 'testimonies', where: approved, limit: 5000, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'sons-stories', where: approved, limit: 5000, select: { slug: true, updatedAt: true } }),
    ])
    for (const t of testimonies.docs) {
      if (t.slug) pages.push({ url: `${siteUrl}/testimonies/${t.slug}`, lastModified: t.updatedAt, priority: 0.6 })
    }
    for (const s of sons.docs) {
      if (s.slug) pages.push({ url: `${siteUrl}/sons-of-the-prophet/${s.slug}`, lastModified: s.updatedAt, priority: 0.6 })
    }
  } catch {
    // Database not reachable — static pages only.
  }
  return pages
}
