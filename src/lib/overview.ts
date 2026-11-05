import { categoryLabels } from '@/lib/categories'

/** Everyone reviewing is in Nigeria, so a day starts and ends on Lagos time, whatever the server's clock says. */
const TIME_ZONE = 'Africa/Lagos'
const DAY_MS = 86_400_000

const CHART_DAYS = 30
const SPARK_DAYS = 14
const LIST_LENGTH = 6

const keyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const shortFormat = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' })
const longFormat = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const dayKey = (value: string | Date) => keyFormat.format(new Date(value))
export const shortDay = (value: string | Date) => shortFormat.format(new Date(value))
export const longDay = (value: string | Date) => longFormat.format(new Date(value))

/** The last few days, oldest first, ending today. */
const pastDays = (count: number, now: Date) => Array.from({ length: count }, (_, i) => new Date(now.getTime() - (count - 1 - i) * DAY_MS))

export function timeAgo(value: string | Date, now: Date) {
  const then = new Date(value)
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return shortDay(then)
}

export type TestimonyRow = {
  id: number
  title?: string | null
  name?: string | null
  status?: string | null
  category?: string | null
  hasVideo?: boolean | null
  createdAt: string
  publishedAt?: string | null
}

export type StoryRow = {
  id: number
  name?: string | null
  headline?: string | null
  status?: string | null
  hasVideo?: boolean | null
  createdAt: string
  publishedAt?: string | null
}

export type GuestRow = {
  id: number
  fullName?: string | null
  country?: string | null
  logisticsStatus?: string | null
  needsPickup?: boolean | null
  needsAccommodation?: boolean | null
  travellingWith?: number | null
  arrivalDate?: string | null
  createdAt: string
}

export type ItemKind = 'testimony' | 'story' | 'guest'
export type ItemTone = 'waiting' | 'done' | 'quiet'

export type OverviewItem = {
  kind: ItemKind
  id: number
  href: string
  title: string
  detail: string
  status: string
  tone: ItemTone
  receivedAt: string
}

export type ChartDay = { key: string; label: string; total: number; testimonies: number; stories: number; guests: number }

const reviewStatus: Record<string, { label: string; tone: ItemTone }> = {
  pending: { label: 'Waiting for review', tone: 'waiting' },
  approved: { label: 'On the website', tone: 'done' },
  rejected: { label: 'Rejected', tone: 'quiet' },
}

const guestStatus: Record<string, { label: string; tone: ItemTone }> = {
  new: { label: 'New request', tone: 'waiting' },
  contacted: { label: 'Contacted', tone: 'done' },
  confirmed: { label: 'Confirmed', tone: 'done' },
  declined: { label: 'Cannot accommodate', tone: 'quiet' },
}

const perDay = (dates: (string | null | undefined)[], days: Date[]) => {
  const counts = new Map<string, number>()
  for (const date of dates) {
    if (!date) continue
    const key = dayKey(date)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return days.map((day) => counts.get(dayKey(day)) ?? 0)
}

/** Works out everything on the overview from the rows themselves, so the numbers can't disagree with each other. */
export function buildOverview({ testimonies, stories, guests, now }: { testimonies: TestimonyRow[]; stories: StoryRow[]; guests: GuestRow[]; now: Date }) {
  const pendingTestimonies = testimonies.filter((t) => t.status === 'pending')
  const pendingStories = stories.filter((s) => s.status === 'pending')
  const newGuests = guests.filter((g) => (g.logisticsStatus ?? 'new') === 'new')
  const liveTestimonies = testimonies.filter((t) => t.status === 'approved')
  const liveStories = stories.filter((s) => s.status === 'approved')
  const comingGuests = guests.filter((g) => g.logisticsStatus !== 'declined')

  const everything = [...testimonies, ...stories, ...guests].map((row) => row.createdAt)
  const fortnight = perDay(everything, pastDays(SPARK_DAYS, now))
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

  const chartDays = pastDays(CHART_DAYS, now)
  const dailyTestimonies = perDay(testimonies.map((t) => t.createdAt), chartDays)
  const dailyStories = perDay(stories.map((s) => s.createdAt), chartDays)
  const dailyGuests = perDay(guests.map((g) => g.createdAt), chartDays)
  const days: ChartDay[] = chartDays.map((day, i) => ({
    key: dayKey(day),
    label: shortDay(day),
    testimonies: dailyTestimonies[i],
    stories: dailyStories[i],
    guests: dailyGuests[i],
    total: dailyTestimonies[i] + dailyStories[i] + dailyGuests[i],
  }))

  const sparkDays = pastDays(SPARK_DAYS, now)

  const today = dayKey(now)
  const nextArrival = comingGuests
    .filter((g): g is GuestRow & { arrivalDate: string } => Boolean(g.arrivalDate) && dayKey(g.arrivalDate as string) >= today)
    .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate))[0]

  const typeCounts = new Map<string, number>()
  for (const testimony of testimonies) {
    if (testimony.status === 'rejected' || !testimony.category) continue
    typeCounts.set(testimony.category, (typeCounts.get(testimony.category) ?? 0) + 1)
  }

  const testimonyItems: OverviewItem[] = testimonies.map((t) => ({
    kind: 'testimony',
    id: t.id,
    href: `/admin/collections/testimonies/${t.id}`,
    title: t.title || 'Untitled testimony',
    detail: [`Testimony${t.name ? ` from ${t.name}` : ''}`, t.hasVideo ? 'with a video' : ''].filter(Boolean).join(', '),
    status: reviewStatus[t.status ?? 'pending']?.label ?? 'Waiting for review',
    tone: reviewStatus[t.status ?? 'pending']?.tone ?? 'waiting',
    receivedAt: t.createdAt,
  }))
  const storyItems: OverviewItem[] = stories.map((s) => ({
    kind: 'story',
    id: s.id,
    href: `/admin/collections/sons-stories/${s.id}`,
    title: s.headline || s.name || 'Untitled story',
    detail: [`Sons of the Prophet story${s.name && s.headline ? ` from ${s.name}` : ''}`, s.hasVideo ? 'with a video' : ''].filter(Boolean).join(', '),
    status: reviewStatus[s.status ?? 'pending']?.label ?? 'Waiting for review',
    tone: reviewStatus[s.status ?? 'pending']?.tone ?? 'waiting',
    receivedAt: s.createdAt,
  }))
  const guestItems: OverviewItem[] = guests.map((g) => {
    const needs = [g.needsPickup ? 'pickup' : '', g.needsAccommodation ? 'accommodation' : ''].filter(Boolean).join(' and ')
    return {
      kind: 'guest',
      id: g.id,
      href: `/admin/collections/international-registrations/${g.id}`,
      title: g.fullName || 'Unnamed guest',
      detail: [`Guest${g.country ? ` from ${g.country}` : ''}`, needs ? `needs ${needs}` : ''].filter(Boolean).join(', '),
      status: guestStatus[g.logisticsStatus ?? 'new']?.label ?? 'New request',
      tone: guestStatus[g.logisticsStatus ?? 'new']?.tone ?? 'waiting',
      receivedAt: g.createdAt,
    }
  })
  const all = [...testimonyItems, ...storyItems, ...guestItems]
  // Whatever has waited longest comes first, so nobody gets forgotten. The newest of the rest fill the list.
  const waitingFirst = all.filter((item) => item.tone === 'waiting').sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
  const others = all.filter((item) => item.tone !== 'waiting').sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))

  return {
    waiting: {
      total: pendingTestimonies.length + pendingStories.length + newGuests.length,
      testimonies: pendingTestimonies.length,
      stories: pendingStories.length,
      guests: newGuests.length,
      videos: [...pendingTestimonies, ...pendingStories].filter((row) => row.hasVideo).length,
      spark: perDay([...pendingTestimonies, ...pendingStories, ...newGuests].map((row) => row.createdAt), sparkDays),
    },
    received: {
      thisWeek: sum(fortnight.slice(-7)),
      lastWeek: sum(fortnight.slice(0, -7)),
      spark: fortnight,
    },
    live: {
      total: liveTestimonies.length + liveStories.length,
      testimonies: liveTestimonies.length,
      stories: liveStories.length,
      spark: perDay([...liveTestimonies, ...liveStories].map((row) => row.publishedAt), sparkDays),
    },
    guests: {
      total: guests.length,
      coming: comingGuests.length,
      people: comingGuests.reduce((total, g) => total + 1 + (g.travellingWith ?? 0), 0),
      pickup: comingGuests.filter((g) => g.needsPickup).length,
      accommodation: comingGuests.filter((g) => g.needsAccommodation).length,
      byStatus: Object.keys(guestStatus).map((value) => ({
        value,
        label: guestStatus[value].label,
        count: guests.filter((g) => (g.logisticsStatus ?? 'new') === value).length,
      })),
      nextArrival: nextArrival ? { name: nextArrival.fullName ?? '', country: nextArrival.country ?? '', date: shortDay(nextArrival.arrivalDate) } : null,
      spark: perDay(guests.map((g) => g.createdAt), sparkDays),
    },
    days,
    received30: days.reduce((total, day) => total + day.total, 0),
    types: Object.entries(categoryLabels)
      .map(([value, label]) => ({ value, label, count: typeCounts.get(value) ?? 0 }))
      .sort((a, b) => b.count - a.count),
    items: [...waitingFirst, ...others].slice(0, LIST_LENGTH),
    totalItems: all.length,
  }
}

export type Overview = ReturnType<typeof buildOverview>
