import type { Payload, TypedUser } from 'payload'

import { hasRole } from '@/access/roles'
import { categoryLabels } from '@/lib/categories'
import { dayKey } from '@/lib/overview'

type Pool = { query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
const pool = (payload: Payload) => (payload.db as unknown as { pool: Pool }).pool
const n = (value: unknown) => Number(value) || 0

/** One day of everything, Lagos time. */
export type ReportDay = {
  day: string
  visits: number
  newVisitors: number
  cards: number
  downloads: number
  shares: number
  testimonies: number | null
  stories: number | null
  guests: number | null
}
export type Counted = { name: string; count: number }

export type Report = {
  generatedAt: string
  firstDay: string
  lastDay: string
  totals: { visitors: number; visits: number; cards: number; downloads: number; shares: number; phones: number; computers: number; unknownCountry: number }
  countries: { name: string; visits: number; visitors: number }[]
  cardDesigns: { name: string; downloads: number; shares: number }[]
  days: ReportDay[]
  testimonies: { status: Counted[]; categories: Counted[]; videos: number } | null
  stories: { status: Counted[]; videos: number } | null
  guests: { status: Counted[]; countries: Counted[]; pickup: number; accommodation: number; travelling: number } | null
}

const regions = new Intl.DisplayNames(['en'], { type: 'region' })
const countryName = (code: string) => {
  try {
    return regions.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

const DESIGNS: Record<string, string> = { pearl: 'White & Gold', glory: 'Glory Dome', nations: 'Nations', emerald: 'Emerald', royal: 'Royal', onyx: 'Onyx' }
const REVIEW_STATUS: Record<string, string> = { approved: 'On the website', pending: 'Waiting for review', rejected: 'Rejected' }
const GUEST_STATUS: Record<string, string> = { new: 'New request', contacted: 'Contacted', confirmed: 'Arrangements confirmed', declined: 'Cannot accommodate' }

const LAGOS_DAY = (column: string) => `to_char(${column} at time zone 'Africa/Lagos', 'YYYY-MM-DD')`

/** Everything since the first day, for the statistics report. Only the parts this account may open. */
export async function readReport(payload: Payload, user: TypedUser, now: Date): Promise<Report> {
  const db = pool(payload)
  const reviews = hasRole(user as never, 'admin', 'editor')
  const logistics = hasRole(user as never, 'admin', 'logistics')
  const none = Promise.resolve({ rows: [] as Record<string, unknown>[] })

  const [traffic, cardDays, places, unknown, devices, designs, tDays, sDays, gDays, tStatus, tCategory, tVideo, sStatus, sVideo, gStatus, gCountry, gNeeds] = await Promise.all([
    db.query(
      `select to_char(day, 'YYYY-MM-DD') as day,
              count(*) filter (where kind = 'visit') as visits,
              count(*) filter (where kind = 'visit' and first) as new_visitors,
              count(*) filter (where kind = 'card') as cards
         from payload.site_events group by 1`,
    ),
    db.query(`select ${LAGOS_DAY('created_at')} as day, count(*) filter (where action = 'download') as downloads, count(*) filter (where action = 'share') as shares from payload.card_events group by 1`),
    db.query(`select country, count(*) as visits, count(*) filter (where first) as visitors from payload.site_events where kind = 'visit' and country is not null group by 1 order by 2 desc`),
    db.query(`select count(*) as n from payload.site_events where kind = 'visit' and country is null`),
    db.query(`select device, count(*) as n from payload.site_events where kind = 'visit' group by 1`),
    db.query(`select coalesce(template, '') as template, count(*) filter (where action = 'download') as downloads, count(*) filter (where action = 'share') as shares from payload.card_events group by 1 order by count(*) desc`),
    reviews ? db.query(`select ${LAGOS_DAY('created_at')} as day, count(*) as n from payload.testimonies group by 1`) : none,
    reviews ? db.query(`select ${LAGOS_DAY('created_at')} as day, count(*) as n from payload.sons_stories group by 1`) : none,
    logistics ? db.query(`select ${LAGOS_DAY('created_at')} as day, count(*) as n from payload.international_registrations group by 1`) : none,
    reviews ? db.query(`select status, count(*) as n from payload.testimonies group by 1 order by 2 desc`) : none,
    reviews ? db.query(`select category, count(*) as n from payload.testimonies group by 1 order by 2 desc`) : none,
    reviews ? db.query(`select count(*) as n from payload.testimonies where has_video`) : none,
    reviews ? db.query(`select status, count(*) as n from payload.sons_stories group by 1 order by 2 desc`) : none,
    reviews ? db.query(`select count(*) as n from payload.sons_stories where has_video`) : none,
    logistics ? db.query(`select coalesce(logistics_status, 'new') as status, count(*) as n from payload.international_registrations group by 1 order by 2 desc`) : none,
    logistics ? db.query(`select initcap(trim(country)) as country, count(*) as n from payload.international_registrations group by 1 order by 2 desc, 1`) : none,
    logistics
      ? db.query(
          `select count(*) filter (where needs_pickup) as pickup, count(*) filter (where needs_accommodation) as accommodation, coalesce(sum(1 + coalesce(travelling_with, 0)), 0) as travelling
             from payload.international_registrations where logistics_status is distinct from 'declined'`,
        )
      : none,
  ])

  // Every day from the first thing recorded to today, with the empty days in, so the charts don't skip.
  const byDay = (rows: Record<string, unknown>[]) => new Map(rows.map((row) => [String(row.day), row]))
  const t = byDay(traffic.rows)
  const c = byDay(cardDays.rows)
  const ts = byDay(tDays.rows)
  const ss = byDay(sDays.rows)
  const gs = byDay(gDays.rows)
  const today = dayKey(now)
  const known = [...t.keys(), ...c.keys(), ...ts.keys(), ...ss.keys(), ...gs.keys()].filter((day) => day <= today).sort()
  const firstDay = known[0] ?? today
  const days: ReportDay[] = []
  for (let at = new Date(`${firstDay}T12:00:00Z`); ; at = new Date(at.getTime() + 86_400_000)) {
    const day = at.toISOString().slice(0, 10)
    if (day > today) break
    days.push({
      day,
      visits: n(t.get(day)?.visits),
      newVisitors: n(t.get(day)?.new_visitors),
      cards: n(t.get(day)?.cards),
      downloads: n(c.get(day)?.downloads),
      shares: n(c.get(day)?.shares),
      testimonies: reviews ? n(ts.get(day)?.n) : null,
      stories: reviews ? n(ss.get(day)?.n) : null,
      guests: logistics ? n(gs.get(day)?.n) : null,
    })
  }

  const sum = (pick: (day: ReportDay) => number) => days.reduce((total, day) => total + pick(day), 0)
  const device = (name: string) => n(devices.rows.find((row) => row.device === name)?.n)
  const counted = (rows: Record<string, unknown>[], key: string, labels?: Record<string, string>) =>
    rows.map((row) => ({ name: labels?.[String(row[key])] ?? (String(row[key] ?? '') || 'Not given'), count: n(row.n) }))

  return {
    generatedAt: now.toISOString(),
    firstDay,
    lastDay: today,
    totals: {
      visitors: sum((day) => day.newVisitors),
      visits: sum((day) => day.visits),
      cards: sum((day) => day.cards),
      downloads: sum((day) => day.downloads),
      shares: sum((day) => day.shares),
      phones: device('phone'),
      computers: device('computer'),
      unknownCountry: n(unknown.rows[0]?.n),
    },
    countries: places.rows.map((row) => ({ name: countryName(String(row.country)), visits: n(row.visits), visitors: n(row.visitors) })),
    cardDesigns: designs.rows.map((row) => ({ name: DESIGNS[String(row.template)] ?? (String(row.template) || 'Not recorded'), downloads: n(row.downloads), shares: n(row.shares) })),
    days,
    testimonies: reviews ? { status: counted(tStatus.rows, 'status', REVIEW_STATUS), categories: counted(tCategory.rows, 'category', categoryLabels), videos: n(tVideo.rows[0]?.n) } : null,
    stories: reviews ? { status: counted(sStatus.rows, 'status', REVIEW_STATUS), videos: n(sVideo.rows[0]?.n) } : null,
    guests: logistics
      ? {
          status: counted(gStatus.rows, 'status', GUEST_STATUS),
          countries: counted(gCountry.rows, 'country'),
          pickup: n(gNeeds.rows[0]?.pickup),
          accommodation: n(gNeeds.rows[0]?.accommodation),
          travelling: n(gNeeds.rows[0]?.travelling),
        }
      : null,
  }
}
