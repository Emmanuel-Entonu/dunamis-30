import type { Payload } from 'payload'

import { dayKey, shortDay } from '@/lib/overview'

const CHART_DAYS = 30
const DAY_MS = 86_400_000

type Pool = { query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }

const pool = (payload: Payload) => (payload.db as unknown as { pool: Pool }).pool

const deviceOf = (userAgent: string) => (/Mobi|Android|iPhone|iPad/i.test(userAgent) ? 'phone' : 'computer')

/** One anonymous count. The country comes from the host, and the address it was worked out from is never kept. */
export async function recordEvent(payload: Payload, kind: 'visit' | 'card', headers: Headers, first = false) {
  await pool(payload).query(`insert into payload.site_events (kind, day, first, country, device) values ($1, $2, $3, $4, $5)`, [
    kind,
    dayKey(new Date()),
    first,
    headers.get('x-vercel-ip-country')?.slice(0, 2) || null,
    deviceOf(headers.get('user-agent') ?? ''),
  ])
}

export type TrafficDay = { key: string; label: string; total: number }
export type TrafficCount = { today: number; week: number; total: number; days: TrafficDay[] }
export type Traffic = {
  visitors: TrafficCount
  cards: TrafficCount & { downloads: number; shares: number }
  countries: { name: string; count: number }[]
  phones: number
  computers: number
}

const regions = new Intl.DisplayNames(['en'], { type: 'region' })
const countryName = (code: string) => {
  try {
    return regions.of(code) ?? code
  } catch {
    return code
  }
}

const count = (value: unknown) => Number(value) || 0

/** Everything the dashboard shows, in a few small queries. Empty until the update that adds the table has gone live. */
export async function readTraffic(payload: Payload, now: Date): Promise<Traffic | null> {
  const keys = Array.from({ length: CHART_DAYS }, (_, i) => dayKey(new Date(now.getTime() - (CHART_DAYS - 1 - i) * DAY_MS)))
  const dates = Array.from({ length: CHART_DAYS }, (_, i) => new Date(now.getTime() - (CHART_DAYS - 1 - i) * DAY_MS))
  try {
    const db = pool(payload)
    const [daily, totals, places, devices, actions] = await Promise.all([
      db.query(`select to_char(day, 'YYYY-MM-DD') as day, kind, count(*) as n from payload.site_events where day >= $1 group by 1, 2`, [keys[0]]),
      db.query(`select kind, count(*) as n, count(*) filter (where first) as firsts from payload.site_events group by 1`),
      db.query(`select country, count(*) as n from payload.site_events where kind = 'visit' and day >= $1 and country is not null group by 1 order by 2 desc limit 6`, [keys[0]]),
      db.query(`select device, count(*) as n from payload.site_events where kind = 'visit' and day >= $1 group by 1`, [keys[0]]),
      db.query(`select action, count(*) as n from payload.card_events group by 1`),
    ])

    const onDay = (kind: string, key: string) => count(daily.rows.find((row) => row.kind === kind && row.day === key)?.n)
    const series = (kind: string) => keys.map((key, i) => ({ key, label: shortDay(dates[i]), total: onDay(kind, key) }))
    const lastWeek = (days: TrafficDay[]) => days.slice(-7).reduce((sum, day) => sum + day.total, 0)
    const total = (kind: string) => totals.rows.find((row) => row.kind === kind)
    const action = (name: string) => count(actions.rows.find((row) => row.action === name)?.n)
    const device = (name: string) => count(devices.rows.find((row) => row.device === name)?.n)

    const visitorDays = series('visit')
    const cardDays = series('card')
    return {
      // People, not visits: someone who comes back every day is counted once in the all-time figure.
      visitors: { today: visitorDays.at(-1)?.total ?? 0, week: lastWeek(visitorDays), total: count(total('visit')?.firsts), days: visitorDays },
      cards: { today: cardDays.at(-1)?.total ?? 0, week: lastWeek(cardDays), total: count(total('card')?.n), days: cardDays, downloads: action('download'), shares: action('share') },
      countries: places.rows.map((row) => ({ name: countryName(String(row.country)), count: count(row.n) })),
      phones: device('phone'),
      computers: device('computer'),
    }
  } catch {
    return null
  }
}
