import { describe, expect, it } from 'vitest'

import { buildOverview, dayKey, timeAgo } from '@/lib/overview'

const now = new Date('2026-11-05T10:00:00.000Z')
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()
const empty = { testimonies: [], stories: [], guests: [], now }

describe('the overview numbers', () => {
  it('counts a day on Lagos time, not the server’s', () => {
    expect(dayKey('2026-11-04T23:30:00.000Z')).toBe('2026-11-05')
    expect(dayKey('2026-11-04T22:30:00.000Z')).toBe('2026-11-04')
  })

  it('shows thirty days ending today, and fourteen in each small chart, even with nothing in them', () => {
    const overview = buildOverview(empty)
    expect(overview.days).toHaveLength(30)
    expect(overview.days.at(-1)?.key).toBe('2026-11-05')
    expect(overview.days.every((day) => day.total === 0)).toBe(true)
    expect(overview.received.spark).toHaveLength(14)
    expect(overview.waiting.spark).toHaveLength(14)
    expect(overview.types).toHaveLength(9)
    expect(overview.items).toEqual([])
  })

  it('compares this week with last week across all three forms', () => {
    const overview = buildOverview({
      ...empty,
      testimonies: [
        { id: 1, status: 'pending', createdAt: daysAgo(0) },
        { id: 2, status: 'approved', createdAt: daysAgo(6) },
        { id: 3, status: 'approved', createdAt: daysAgo(7) },
      ],
      stories: [{ id: 1, status: 'rejected', createdAt: daysAgo(13) }],
      guests: [{ id: 1, createdAt: daysAgo(2) }, { id: 2, createdAt: daysAgo(14) }],
    })
    expect(overview.received.thisWeek).toBe(3)
    expect(overview.received.lastWeek).toBe(2)
  })

  it('adds up what is waiting, and which of it has a video', () => {
    const overview = buildOverview({
      ...empty,
      testimonies: [
        { id: 1, status: 'pending', hasVideo: true, createdAt: daysAgo(1) },
        { id: 2, status: 'approved', hasVideo: true, createdAt: daysAgo(1) },
        { id: 3, status: 'rejected', createdAt: daysAgo(1) },
      ],
      stories: [{ id: 1, status: 'pending', createdAt: daysAgo(1) }],
      guests: [{ id: 1, logisticsStatus: 'new', createdAt: daysAgo(1) }, { id: 2, logisticsStatus: 'confirmed', createdAt: daysAgo(1) }],
    })
    expect(overview.waiting).toMatchObject({ total: 3, testimonies: 1, stories: 1, guests: 1, videos: 1 })
    expect(overview.live).toMatchObject({ total: 1, testimonies: 1, stories: 0 })
  })

  it('puts what has waited longest first, then the newest of the rest', () => {
    const { items } = buildOverview({
      ...empty,
      testimonies: [
        { id: 1, title: 'Newer waiting', status: 'pending', createdAt: daysAgo(1) },
        { id: 2, title: 'Older waiting', status: 'pending', createdAt: daysAgo(5) },
        { id: 3, title: 'Old approved', status: 'approved', createdAt: daysAgo(9) },
        { id: 4, title: 'New approved', status: 'approved', createdAt: daysAgo(2) },
      ],
    })
    expect(items.map((item) => item.title)).toEqual(['Older waiting', 'Newer waiting', 'New approved', 'Old approved'])
    expect(items[0].href).toBe('/admin/collections/testimonies/2')
  })

  it('never lists more than six', () => {
    const testimonies = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, status: 'pending', createdAt: daysAgo(i) }))
    const overview = buildOverview({ ...empty, testimonies })
    expect(overview.items).toHaveLength(6)
    expect(overview.totalItems).toBe(9)
  })

  it('leaves guests who can’t be accommodated out of the travel numbers', () => {
    const { guests } = buildOverview({
      ...empty,
      guests: [
        { id: 1, fullName: 'Later', country: 'Ghana', logisticsStatus: 'new', travellingWith: 2, needsPickup: true, arrivalDate: '2026-11-22T00:00:00.000Z', createdAt: daysAgo(1) },
        { id: 2, fullName: 'Sooner', country: 'Togo', logisticsStatus: 'confirmed', needsAccommodation: true, arrivalDate: '2026-11-10T00:00:00.000Z', createdAt: daysAgo(1) },
        { id: 3, fullName: 'Declined', logisticsStatus: 'declined', travellingWith: 5, needsPickup: true, arrivalDate: '2026-11-08T00:00:00.000Z', createdAt: daysAgo(1) },
        { id: 4, fullName: 'Gone', logisticsStatus: 'confirmed', arrivalDate: '2026-11-01T00:00:00.000Z', createdAt: daysAgo(9) },
      ],
    })
    expect(guests).toMatchObject({ total: 4, coming: 3, people: 5, pickup: 1, accommodation: 1 })
    expect(guests.nextArrival).toEqual({ name: 'Sooner', country: 'Togo', date: '10 Nov' })
    expect(guests.byStatus.find((status) => status.value === 'declined')?.count).toBe(1)
  })

  it('ranks the kinds of testimony, leaving out rejected ones', () => {
    const { types } = buildOverview({
      ...empty,
      testimonies: [
        { id: 1, status: 'approved', category: 'career', createdAt: daysAgo(1) },
        { id: 2, status: 'pending', category: 'career', createdAt: daysAgo(1) },
        { id: 3, status: 'approved', category: 'healing', createdAt: daysAgo(1) },
        { id: 4, status: 'rejected', category: 'family', createdAt: daysAgo(1) },
      ],
    })
    expect(types[0]).toMatchObject({ value: 'career', count: 2 })
    expect(types[1]).toMatchObject({ value: 'healing', count: 1 })
    expect(types.find((type) => type.value === 'family')?.count).toBe(0)
  })
})

describe('how long ago', () => {
  it('reads naturally', () => {
    expect(timeAgo(new Date(now.getTime() - 20_000), now)).toBe('Just now')
    expect(timeAgo(new Date(now.getTime() - 60_000), now)).toBe('1 minute ago')
    expect(timeAgo(new Date(now.getTime() - 3 * 3_600_000), now)).toBe('3 hours ago')
    expect(timeAgo(daysAgo(1), now)).toBe('Yesterday')
    expect(timeAgo(daysAgo(4), now)).toBe('4 days ago')
    expect(timeAgo('2026-10-12T10:00:00.000Z', now)).toBe('12 Oct')
  })
})
