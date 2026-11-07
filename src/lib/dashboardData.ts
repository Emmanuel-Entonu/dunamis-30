import type { Payload, TypedUser } from 'payload'

import { hasRole } from '@/access/roles'
import { dayKey } from '@/lib/overview'
import { readTraffic, type Traffic } from '@/lib/siteEvents'

type Pool = { query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }

const pool = (payload: Payload) => (payload.db as unknown as { pool: Pool }).pool
const number = (value: unknown) => Number(value) || 0

export type SectionCounts = Record<string, number>
export type LatestItem = { kind: 'testimony' | 'story' | 'guest'; id: number; title: string; who: string; waiting: boolean; at: string }

export type DashboardData = {
  /** Null for a section this account can't open. */
  testimonies: SectionCounts | null
  stories: SectionCounts | null
  guests: (SectionCounts & { pickup: number; accommodation: number; travelling: number }) | null
  waiting: { testimonies: string[]; stories: string[]; guests: string[] }
  latest: LatestItem[]
  activeDays: Record<string, number>
  formOpen: boolean | null
  traffic: Traffic | null
}

const countBy = (rows: Record<string, unknown>[], field: string) => {
  const counts: SectionCounts = { all: 0 }
  for (const row of rows) {
    const n = number(row.n)
    counts[String(row[field] ?? 'new')] = n
    counts.all += n
  }
  return counts
}

const dateOf = (value: unknown) => String(value)

/** The whole overview in one trip, as a handful of small counting queries running side by side. */
export async function readDashboard(payload: Payload, user: TypedUser, now: Date): Promise<DashboardData> {
  const db = pool(payload)
  const reviews = hasRole(user as never, 'admin', 'editor')
  const logistics = hasRole(user as never, 'admin', 'logistics')
  const since = dayKey(new Date(now.getTime() - 62 * 86_400_000))
  const none = Promise.resolve({ rows: [] as Record<string, unknown>[] })
  const latestParts = [
    ...(reviews
      ? [
          `select 'testimony' as kind, id, title, name as who, status = 'pending' as waiting, created_at from payload.testimonies`,
          `select 'story' as kind, id, headline as title, name as who, status = 'pending' as waiting, created_at from payload.sons_stories`,
        ]
      : []),
    ...(logistics ? [`select 'guest' as kind, id, full_name as title, country as who, coalesce(logistics_status = 'new', true) as waiting, created_at from payload.international_registrations`] : []),
  ]

  const [testimonies, stories, guests, needs, waitingT, waitingS, waitingG, latest, active, form, traffic] = await Promise.all([
    reviews ? db.query(`select status, count(*) as n from payload.testimonies group by 1`) : none,
    reviews ? db.query(`select status, count(*) as n from payload.sons_stories group by 1`) : none,
    logistics ? db.query(`select logistics_status as status, count(*) as n from payload.international_registrations group by 1`) : none,
    logistics
      ? db.query(
          `select count(*) filter (where needs_pickup) as pickup, count(*) filter (where needs_accommodation) as accommodation, coalesce(sum(1 + coalesce(travelling_with, 0)), 0) as travelling
           from payload.international_registrations where logistics_status is distinct from 'declined'`,
        )
      : none,
    reviews ? db.query(`select name from payload.testimonies where status = 'pending' order by created_at desc limit 4`) : none,
    reviews ? db.query(`select name from payload.sons_stories where status = 'pending' order by created_at desc limit 4`) : none,
    logistics ? db.query(`select full_name as name from payload.international_registrations where logistics_status = 'new' or logistics_status is null order by created_at desc limit 4`) : none,
    latestParts.length ? db.query(`select * from (${latestParts.join(' union all ')}) rows order by waiting desc, created_at desc limit 6`) : none,
    db.query(
      `select day, sum(n) as n from (
         select to_char(created_at at time zone 'Africa/Lagos', 'YYYY-MM-DD') as day, count(*) as n from payload.testimonies where created_at >= $1 group by 1
         union all
         select to_char(created_at at time zone 'Africa/Lagos', 'YYYY-MM-DD'), count(*) from payload.sons_stories where created_at >= $1 group by 1
         union all
         select to_char(created_at at time zone 'Africa/Lagos', 'YYYY-MM-DD'), count(*) from payload.international_registrations where created_at >= $1 group by 1
       ) days group by 1`,
      [since],
    ),
    payload.findGlobal({ slug: 'testimony-settings', depth: 0 }).catch(() => null),
    readTraffic(payload, now),
  ])

  const names = (rows: Record<string, unknown>[]) => rows.map((row) => String(row.name ?? ''))
  const need = needs.rows[0] ?? {}

  return {
    testimonies: reviews ? countBy(testimonies.rows, 'status') : null,
    stories: reviews ? countBy(stories.rows, 'status') : null,
    guests: logistics ? { ...countBy(guests.rows, 'status'), pickup: number(need.pickup), accommodation: number(need.accommodation), travelling: number(need.travelling) } : null,
    waiting: { testimonies: names(waitingT.rows), stories: names(waitingS.rows), guests: names(waitingG.rows) },
    latest: latest.rows.map((row) => ({
      kind: row.kind as LatestItem['kind'],
      id: number(row.id),
      title: String(row.title ?? ''),
      who: String(row.who ?? ''),
      waiting: Boolean(row.waiting),
      at: dateOf(row.created_at),
    })),
    activeDays: Object.fromEntries(active.rows.map((row) => [String(row.day), number(row.n)])),
    formOpen: form ? form.formOpen !== false : null,
    traffic,
  }
}

export type SearchHit = { kind: LatestItem['kind']; id: number; title: string; who: string }

/** Titles and names across everything this account can open. */
export async function searchDashboard(payload: Payload, user: TypedUser, words: string): Promise<SearchHit[]> {
  const db = pool(payload)
  const like = `%${words.replace(/[%_\\]/g, '\\$&')}%`
  const parts: string[] = []
  if (hasRole(user as never, 'admin', 'editor')) {
    parts.push(`select 'testimony' as kind, id, title, name as who, created_at from payload.testimonies where title ilike $1 or name ilike $1`)
    parts.push(`select 'story', id, headline, name, created_at from payload.sons_stories where headline ilike $1 or name ilike $1`)
  }
  if (hasRole(user as never, 'admin', 'logistics')) parts.push(`select 'guest', id, full_name, country, created_at from payload.international_registrations where full_name ilike $1 or country ilike $1`)
  if (!parts.length) return []
  const { rows } = await db.query(`select * from (${parts.join(' union all ')}) hits order by created_at desc limit 8`, [like])
  return rows.map((row) => ({ kind: row.kind as SearchHit['kind'], id: number(row.id), title: String(row.title ?? ''), who: String(row.who ?? '') }))
}
