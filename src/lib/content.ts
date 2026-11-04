import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Event, Gallery, Homepage, ImpactPage, Media, Milestone, PastorPage, Site, SonsStory, StoryPage, Testimony } from '@/payload-types'
import { defaults, defaultSocials } from './site'
import { mixTestimonies } from './testimonyMix'

// After a failed connection, wait before trying again. Otherwise every section of every page
// makes its own attempt, and an outage makes the whole site crawl while it waits on the database.
const RETRY_AFTER_MS = 30_000
let retryAt = 0
let warnedAt = 0

export const getPayloadClient = cache(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  if (Date.now() < retryAt) throw new Error('the database was unreachable moments ago')
  try {
    return await getPayload({ config })
  } catch (error) {
    retryAt = Date.now() + RETRY_AFTER_MS
    throw error
  }
})

/**
 * Content must never take the site down: if the database is unreachable
 * (or not configured yet) we log once and render sensible defaults instead.
 */
async function safely<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (Date.now() - warnedAt > RETRY_AFTER_MS) {
      warnedAt = Date.now()
      console.warn(`[content] Showing default content, ${label} is unavailable: ${(error as Error).message}`)
    }
    return fallback
  }
}

export type EventInfo = {
  title: string
  startsAt: string
  dateConfirmed: boolean
  venue: string
  venueConfirmed: boolean
  city: string
  onlineAttendance: boolean
  livestreamUrl?: string | null
}

// Published on the official church calendar, so treated as confirmed until the CMS says otherwise.
const officialEvent: EventInfo = {
  title: defaults.eventTitle,
  startsAt: defaults.eventStartsAt,
  dateConfirmed: true,
  venue: defaults.venue,
  venueConfirmed: true,
  city: defaults.city,
  onlineAttendance: true,
}

export const getEvent = cache(
  async (): Promise<EventInfo> =>
    safely<EventInfo>(
      'event',
      async () => {
        const payload = await getPayloadClient()
        const event: Event = await payload.findGlobal({ slug: 'event' })
        if (!event.startsAt) return officialEvent
        return {
          title: event.title || defaults.eventTitle,
          startsAt: event.startsAt,
          dateConfirmed: Boolean(event.dateConfirmed),
          venue: event.venue || defaults.venue,
          venueConfirmed: Boolean(event.venueConfirmed),
          city: event.city || defaults.city,
          onlineAttendance: event.onlineAttendance ?? true,
          livestreamUrl: event.livestreamUrl,
        }
      },
      officialEvent,
    ),
)

export const getHomepage = cache(async () =>
  safely<Partial<Homepage>>(
    'homepage',
    async () => (await getPayloadClient()).findGlobal({ slug: 'homepage', depth: 1 }),
    {},
  ),
)

type Social = { id?: string | null; platform: keyof typeof import('@/components/icons').socialIcons; url: string }

export const getSite = cache(async () => {
  const site = await safely<Partial<Site>>('site', async () => (await getPayloadClient()).findGlobal({ slug: 'site' }), {})
  const socials: Social[] = site.socials?.length ? site.socials : defaultSocials.map((s) => ({ ...s }))
  return { ...site, socials, officialWebsite: site.officialWebsite || defaults.officialWebsite }
})

export type CardTestimony = Pick<Testimony, 'id' | 'title' | 'category' | 'summary' | 'slug' | 'videoUrl'> & {
  name: string | null
  hasVideo: boolean
  photo?: Media | null
  videoPoster?: Media | null
}

const publicName = (t: { name?: string | null; showName?: boolean | null }) => (t.showName === false ? null : (t.name ?? null))

const populated = (value: unknown) => (typeof value === 'object' && value !== null ? (value as Media) : null)

const toCard = (t: Testimony): CardTestimony => ({
  id: t.id,
  title: t.title,
  category: t.category,
  summary: t.summary,
  slug: t.slug,
  videoUrl: t.videoUrl,
  name: publicName(t),
  hasVideo: Boolean(t.hasVideo),
  photo: populated(t.photo),
  videoPoster: populated(t.videoPoster),
})

export type TestimonyPage = { docs: CardTestimony[]; page: number; totalPages: number; total: number }

export type TestimonyQuery = {
  q?: string
  category?: string
  year?: number
  /** Only testimonies with a video. */
  videos?: boolean
  /** "mix" shuffles written and video testimonies together. Newest and oldest are plain date order. */
  sort?: 'mix' | 'newest' | 'oldest'
  /** The shuffle to use, so one visitor's pages stay consistent. */
  seed?: number
  page?: number
}

const PAGE_SIZE = 12

/**
 * Public testimony library. overrideAccess: false makes Payload apply the collection's access
 * rules as an anonymous visitor: only approved testimonies, and never the submitter's contacts.
 */
async function findTestimonies({ q, category, year, videos, sort = 'mix', seed = 0, page = 1 }: TestimonyQuery): Promise<TestimonyPage> {
  const payload = await getPayloadClient()
  const and: Where[] = [{ status: { equals: 'approved' } }]
  if (category) and.push({ category: { equals: category } })
  if (videos) and.push({ hasVideo: { equals: true } })
  if (year) and.push({ publishedAt: { greater_than_equal: `${year}-01-01T00:00:00.000Z`, less_than: `${year + 1}-01-01T00:00:00.000Z` } })
  if (q) and.push({ or: [{ title: { like: q } }, { summary: { like: q } }, { name: { like: q } }, { body: { like: q } }] })

  if (sort !== 'mix') {
    const res = await payload.find({
      collection: 'testimonies',
      where: { and },
      sort: sort === 'oldest' ? 'publishedAt' : '-publishedAt',
      limit: PAGE_SIZE,
      page,
      depth: 1,
      overrideAccess: false,
    })
    return { docs: res.docs.map(toCard), page: res.page ?? 1, totalPages: res.totalPages, total: res.totalDocs }
  }

  // The shuffle needs to see the whole library, but only a few fields of it.
  const { docs: rows } = await payload.find({
    collection: 'testimonies',
    where: { and },
    pagination: false,
    depth: 0,
    select: { hasVideo: true, category: true, name: true, showName: true, publishedAt: true },
    overrideAccess: false,
  })
  const order = mixTestimonies(
    rows.map((t) => ({ id: t.id, hasVideo: t.hasVideo, category: t.category, person: publicName(t)?.toLowerCase(), publishedAt: t.publishedAt })),
    seed,
  )
  const totalPages = Math.ceil(order.length / PAGE_SIZE)
  const current = Math.min(page, Math.max(totalPages, 1))
  const pageIds = order.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((t) => t.id)
  if (!pageIds.length) return { docs: [], page: 1, totalPages: 0, total: 0 }
  const { docs } = await payload.find({ collection: 'testimonies', where: { id: { in: pageIds } }, limit: PAGE_SIZE, depth: 1, overrideAccess: false })
  const byId = new Map(docs.map((t) => [t.id, t]))
  return {
    docs: pageIds.flatMap((id) => {
      const doc = byId.get(id as number)
      return doc ? [toCard(doc)] : []
    }),
    page: current,
    totalPages,
    total: order.length,
  }
}

// Holding each page of results for a minute keeps the database calm at busy moments. Approving a
// testimony clears this straight away. Searches skip it, because each one is different.
const cachedTestimonies = unstable_cache(findTestimonies, ['testimony-library'], { revalidate: 60, tags: ['testimonies'] })

export const getTestimonies = cache(
  async (query: TestimonyQuery): Promise<TestimonyPage> =>
    safely('testimonies', () => (query.q ? findTestimonies(query) : cachedTestimonies(query)), { docs: [], page: 1, totalPages: 0, total: 0 }),
)

export const getTestimonyBySlug = cache(async (slug: string) =>
  safely(
    'testimony',
    async () => {
      const { docs } = await (await getPayloadClient()).find({
        collection: 'testimonies',
        where: { and: [{ slug: { equals: slug } }, { status: { equals: 'approved' } }] },
        limit: 1,
        depth: 1,
        overrideAccess: false,
      })
      const t = docs[0]
      return t ? { ...toCard(t), body: t.body, location: t.location, publishedAt: t.publishedAt, videoFile: t.videoFile } : null
    },
    null,
  ),
)

export type CardSonsStory = Pick<SonsStory, 'id' | 'name' | 'headline' | 'location' | 'currentRole' | 'slug'> & {
  before?: string | null
  beforePhoto?: Media | null
  afterPhoto?: Media | null
  videoPoster?: Media | null
  hasVideo?: boolean | null
}

const toSonsCard = (s: SonsStory): CardSonsStory => ({
  ...s,
  name: s.showName === false ? 'A son of the ministry' : s.name,
  before: s.story?.before,
  beforePhoto: typeof s.beforePhoto === 'object' ? s.beforePhoto : null,
  afterPhoto: typeof s.afterPhoto === 'object' ? s.afterPhoto : null,
  videoPoster: populated(s.videoPoster),
  hasVideo: Boolean(s.hasVideo),
})

/** Public Sons of the Prophet list: approved stories only, never the submitter's contacts. */
export const getSonsStories = cache(async (): Promise<CardSonsStory[]> =>
  safely(
    'sons stories',
    async () => {
      const { docs } = await (await getPayloadClient()).find({
        collection: 'sons-stories',
        where: { status: { equals: 'approved' } },
        sort: '-publishedAt',
        limit: 60,
        depth: 1,
        overrideAccess: false,
      })
      return docs.map(toSonsCard)
    },
    [],
  ),
)

export const getSonsStoryBySlug = cache(async (slug: string) =>
  safely(
    'sons story',
    async () => {
      const { docs } = await (await getPayloadClient()).find({
        collection: 'sons-stories',
        where: { and: [{ slug: { equals: slug } }, { status: { equals: 'approved' } }] },
        limit: 1,
        depth: 1,
        overrideAccess: false,
      })
      const s = docs[0]
      return s ? { ...toSonsCard(s), story: s.story, milestones: s.milestones, appreciation: s.appreciation, videoUrl: s.videoUrl, videoFile: s.videoFile, publishedAt: s.publishedAt } : null
    },
    null,
  ),
)

export const getStoryPage = cache(async () =>
  safely<Partial<StoryPage>>('story page', async () => (await getPayloadClient()).findGlobal({ slug: 'story-page', depth: 1 }), {}),
)

export const getPastorPage = cache(async () =>
  safely<Partial<PastorPage>>('pastor page', async () => (await getPayloadClient()).findGlobal({ slug: 'pastor-page', depth: 1 }), {}),
)

export const getImpactPage = cache(async () =>
  safely<Partial<ImpactPage>>('impact page', async () => (await getPayloadClient()).findGlobal({ slug: 'impact-page', depth: 1 }), {}),
)

export const getMilestones = cache(async (): Promise<Milestone[]> =>
  safely(
    'milestones',
    async () => (await (await getPayloadClient()).find({ collection: 'milestones', sort: 'year', limit: 100, depth: 1 })).docs,
    [],
  ),
)

export const getGalleryItems = cache(async (): Promise<Gallery[]> =>
  safely(
    'gallery',
    async () => (await (await getPayloadClient()).find({ collection: 'gallery', sort: '-year', limit: 300, depth: 1 })).docs,
    [],
  ),
)

/**
 * A photo's address as a path on this site. Payload adds the site's domain once one is configured,
 * and the image optimiser only accepts /api/media/file/ as a local path.
 */
export const mediaUrl = (media: Media | null | undefined, size: 'thumb' | 'card' | 'hero' | 'og' = 'card') => {
  const url = media?.sizes?.[size]?.url || media?.url
  return url ? url.replace(/^https?:\/\/[^/]+(?=\/)/, '') : null
}
