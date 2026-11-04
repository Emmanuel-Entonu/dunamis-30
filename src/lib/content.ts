import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Event, Gallery, Homepage, ImpactPage, Media, Milestone, PastorPage, Site, SonsStory, StoryPage, Testimony } from '@/payload-types'
import { defaults, defaultSocials } from './site'

export const getPayloadClient = cache(() => getPayload({ config }))

/**
 * Content must never take the site down: if the database is unreachable
 * (or not configured yet) we log and render sensible defaults instead.
 */
async function safely<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.warn(`[content] ${label} unavailable, using fallback:`, (error as Error).message)
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
  photo?: Media | null
}

const publicName = (t: { name: string; showName?: boolean | null }) => (t.showName === false ? null : t.name)

const toCard = (t: Testimony): CardTestimony => ({ ...t, name: publicName(t), photo: typeof t.photo === 'object' ? t.photo : null })

export type TestimonyPage = { docs: CardTestimony[]; page: number; totalPages: number; total: number }

/**
 * Public testimony library. overrideAccess: false makes Payload apply the collection's access
 * rules as an anonymous visitor: only approved testimonies, and never the submitter's contacts.
 */
export const getTestimonies = cache(
  async ({ q, category, year, oldest, page = 1 }: { q?: string; category?: string; year?: number; oldest?: boolean; page?: number }): Promise<TestimonyPage> =>
    safely(
      'testimonies',
      async () => {
        const and: Where[] = [{ status: { equals: 'approved' } }]
        if (category) and.push({ category: { equals: category } })
        if (year) and.push({ publishedAt: { greater_than_equal: `${year}-01-01T00:00:00.000Z`, less_than: `${year + 1}-01-01T00:00:00.000Z` } })
        if (q) and.push({ or: [{ title: { like: q } }, { summary: { like: q } }, { name: { like: q } }, { body: { like: q } }] })
        const res = await (await getPayloadClient()).find({
          collection: 'testimonies',
          where: { and },
          sort: oldest ? 'publishedAt' : '-publishedAt',
          limit: 12,
          page,
          depth: 1,
          overrideAccess: false,
        })
        return { docs: res.docs.map(toCard), page: res.page ?? 1, totalPages: res.totalPages, total: res.totalDocs }
      },
      { docs: [], page: 1, totalPages: 0, total: 0 },
    ),
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
      return t ? { ...toCard(t), body: t.body, location: t.location, publishedAt: t.publishedAt } : null
    },
    null,
  ),
)

export type CardSonsStory = Pick<SonsStory, 'id' | 'name' | 'headline' | 'location' | 'currentRole' | 'slug'> & {
  before?: string | null
  beforePhoto?: Media | null
  afterPhoto?: Media | null
}

const toSonsCard = (s: SonsStory): CardSonsStory => ({
  ...s,
  name: s.showName === false ? 'A son of the ministry' : s.name,
  before: s.story?.before,
  beforePhoto: typeof s.beforePhoto === 'object' ? s.beforePhoto : null,
  afterPhoto: typeof s.afterPhoto === 'object' ? s.afterPhoto : null,
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
      return s ? { ...toSonsCard(s), story: s.story, milestones: s.milestones, appreciation: s.appreciation, videoUrl: s.videoUrl, publishedAt: s.publishedAt } : null
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

export const mediaUrl = (media: Media | null | undefined, size: 'thumb' | 'card' | 'hero' | 'og' = 'card') =>
  media?.sizes?.[size]?.url || media?.url || null
