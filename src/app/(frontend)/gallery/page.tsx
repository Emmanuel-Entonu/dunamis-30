import type { Metadata } from 'next'

import { PageHero } from '@/components/PageHero'
import { ShareButtons } from '@/components/ShareButtons'
import { getGalleryItems, mediaUrl } from '@/lib/content'
import { defaultGallery } from '@/lib/photos'
import { embedUrl } from '@/lib/video'
import type { Media } from '@/payload-types'
import { GalleryBrowser, type GalleryCard } from './GalleryBrowser'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Media Gallery',
  description: 'Photographs and videos from thirty years of Dunamis International Gospel Centre.',
}

const categories: Record<string, string> = {
  crusades: 'Crusades',
  historical: 'Historical Photographs',
  'old-church': 'Old Church Photographs',
  conventions: 'Major Conventions',
  events: 'Ministry Events',
  pastor: 'The Senior Pastors',
  expansion: 'Ministry Expansion',
  international: 'International Events',
  promo: 'Anniversary Videos',
  documentaries: 'Documentaries & Interviews',
}

export default async function GalleryPage() {
  const cms = await getGalleryItems()

  const items: GalleryCard[] = cms.length
    ? cms.map((g) => {
        const media = g.image && typeof g.image === 'object' ? (g.image as Media) : null
        const video = embedUrl(g.videoUrl)
        return {
          key: g.id,
          title: g.title,
          description: g.description,
          category: g.category ?? 'events',
          event: g.event,
          year: g.year,
          src: mediaUrl(media, 'hero'),
          thumb: mediaUrl(media, 'card'),
          width: media?.sizes?.card?.width ?? media?.width,
          height: media?.sizes?.card?.height ?? media?.height,
          video,
          videoLink: video ? null : g.videoUrl,
        }
      })
    : defaultGallery.map((g) => ({
        key: g.key,
        title: g.title,
        category: g.category,
        event: g.event,
        year: g.year,
        src: g.src.src,
        thumb: g.src.src,
        width: g.src.width,
        height: g.src.height,
        blur: g.src.blurDataURL,
      }))

  return (
    <>
      <PageHero eyebrow="Media Gallery" title="Thirty years in pictures" intro="Search, or browse by event and category. Tap any photo to see it bigger." />
      <section className="pb-24">
        <div className="container-site">
          <GalleryBrowser items={items} categories={categories} />
          <ShareButtons url="/gallery" text="Thirty years of Dunamis in pictures" className="mt-12 justify-center" />
        </div>
      </section>
    </>
  )
}
