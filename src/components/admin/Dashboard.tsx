import Link from 'next/link'
import type { Payload, TypedUser } from 'payload'
import type { ReactNode } from 'react'

import { buildOverview, longDay, timeAgo, type GuestRow, type ItemKind, type StoryRow, type TestimonyRow } from '@/lib/overview'
import { ActivityChart } from './ActivityChart'
import { ChevronIcon, ExternalIcon, GlobeIcon, GuestIcon, InboxIcon, StoryIcon, TestimonyIcon, WaitingIcon } from './AdminIcons'
import { TestimonyFormSwitch } from './TestimonySwitch'

const kindIcon: Record<ItemKind, ReactNode> = {
  testimony: <TestimonyIcon />,
  story: <StoryIcon />,
  guest: <GuestIcon />,
}

/** Fourteen small columns. Empty days stay as short marks, so it reads as a chart even before anything comes in. */
function Spark({ values }: { values: number[] }) {
  const highest = Math.max(...values, 1)
  return (
    <svg aria-hidden className="ov-spark" width={97} height={34} viewBox="0 0 97 34">
      {values.map((value, i) => {
        const height = value ? Math.max(6, (value / highest) * 34) : 2
        return <rect key={i} x={i * 7} y={34 - height} width={4} height={height} rx={value ? 1.5 : 1} className={value ? (i === values.length - 1 ? 'is-today' : 'is-on') : 'is-off'} />
      })}
    </svg>
  )
}

function Stat({ href, icon, label, value, note, spark, loud }: { href: string; icon: ReactNode; label: string; value: number; note: string; spark: number[]; loud?: boolean }) {
  return (
    <Link href={href} prefetch={false} className={`ov-stat${loud ? ' ov-stat--loud' : ''}`}>
      <span className="ov-stat__label">
        <span className="ov-chip">{icon}</span>
        {label}
      </span>
      <span className="ov-stat__row">
        <span className="ov-stat__value">{value.toLocaleString('en-GB')}</span>
        <Spark values={spark} />
      </span>
      <span className="ov-stat__note">{note}</span>
    </Link>
  )
}

function Panel({ title, note, link, children }: { title: string; note?: string; link?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section className="ov-panel">
      <header className="ov-panel__head">
        <div>
          <h2>{title}</h2>
          {note && <p>{note}</p>}
        </div>
        {link && (
          <Link href={link.href} prefetch={false} className="ov-more">
            {link.label}
            <ChevronIcon width={14} height={14} />
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}

const change = (now: number, before: number) => {
  if (now === before) return before ? 'The same as last week' : 'Nothing yet this week'
  return `${now > before ? 'Up' : 'Down'} ${Math.abs(now - before)} on last week`
}

const list = (parts: [number, string, string][]) => {
  const shown = parts.filter(([count]) => count).map(([count, one, many]) => `${count} ${count === 1 ? one : many}`)
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}` : (shown[0] ?? '')
}

/** The first screen after signing in: what needs doing, what has come in, and where things stand. */
export async function Dashboard({ payload, user }: { payload: Payload; user?: TypedUser | null }) {
  const now = new Date()
  // Each person sees only what their account may open, and a problem with one section leaves the others working.
  const rows = async <T,>(find: () => Promise<{ docs: unknown[] }>) => {
    try {
      return (await find()).docs as T[]
    } catch {
      return null
    }
  }
  const shared = { pagination: false, depth: 0, overrideAccess: false, user } as const
  const [testimonies, stories, guests] = await Promise.all([
    rows<TestimonyRow>(() =>
      payload.find({ ...shared, collection: 'testimonies', select: { title: true, name: true, status: true, category: true, hasVideo: true, publishedAt: true, createdAt: true } }),
    ),
    rows<StoryRow>(() => payload.find({ ...shared, collection: 'sons-stories', select: { name: true, headline: true, status: true, hasVideo: true, publishedAt: true, createdAt: true } })),
    rows<GuestRow>(() =>
      payload.find({
        ...shared,
        collection: 'international-registrations',
        select: { fullName: true, country: true, logisticsStatus: true, needsPickup: true, needsAccommodation: true, travellingWith: true, arrivalDate: true, createdAt: true },
      }),
    ),
  ])
  const data = buildOverview({ testimonies: testimonies ?? [], stories: stories ?? [], guests: guests ?? [], now })
  const statusTotal = data.guests.byStatus.reduce((total, status) => total + status.count, 0)
  const types = data.types.filter((type) => type.count)
  const mostOfAType = Math.max(...types.map((type) => type.count), 1)
  // Straight to whatever is waiting, starting with testimonies.
  const waitingLink = data.waiting.testimonies
    ? '/admin/collections/testimonies?where[status][equals]=pending'
    : data.waiting.guests
      ? '/admin/collections/international-registrations?where[logisticsStatus][equals]=new'
      : data.waiting.stories
        ? '/admin/collections/sons-stories?where[status][equals]=pending'
        : '/admin/collections/testimonies'
  const waitingNote = list([
    [data.waiting.testimonies, 'testimony', 'testimonies'],
    [data.waiting.guests, 'guest', 'guests'],
    [data.waiting.stories, 'story', 'stories'],
  ])

  return (
    <div className="ov">
      <header className="ov-head">
        <div>
          <h1>Overview</h1>
          <p>{longDay(now)}. Nothing goes on the website until it is approved here.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="ov-site">
          View the website
          <ExternalIcon width={15} height={15} />
        </a>
      </header>

      <section aria-label="At a glance" className="ov-stats">
        <Stat
          href={waitingLink}
          icon={<WaitingIcon />}
          label="Waiting for you"
          value={data.waiting.total}
          note={waitingNote || 'You’re all caught up'}
          spark={data.waiting.spark}
          loud={data.waiting.total > 0}
        />
        <Stat href="/admin/collections/testimonies" icon={<InboxIcon />} label="Received this week" value={data.received.thisWeek} note={change(data.received.thisWeek, data.received.lastWeek)} spark={data.received.spark} />
        <Stat
          href="/admin/collections/testimonies?where[status][equals]=approved"
          icon={<GlobeIcon />}
          label="On the website"
          value={data.live.total}
          note={list([
            [data.live.testimonies, 'testimony', 'testimonies'],
            [data.live.stories, 'story', 'stories'],
          ]) || 'Nothing approved yet'}
          spark={data.live.spark}
        />
        <Stat
          href="/admin/collections/international-registrations"
          icon={<GuestIcon />}
          label="International guests"
          value={data.guests.coming}
          note={data.guests.people ? `${data.guests.people} ${data.guests.people === 1 ? 'person' : 'people'} travelling in all` : 'No requests yet'}
          spark={data.guests.spark}
        />
      </section>

      <div className="ov-columns">
        <div className="ov-column">
          <Panel title="Submissions received" note={`${data.received30.toLocaleString('en-GB')} across all three forms in the last 30 days`}>
            <ActivityChart days={data.days} />
          </Panel>

          <Panel title="Latest submissions" note="Anything waiting comes first, oldest at the top.">
            {data.items.length ? (
              <ul className="ov-list">
                {data.items.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link href={item.href} prefetch={false} className="ov-item">
                      <span className="ov-chip">{kindIcon[item.kind]}</span>
                      <span className="ov-item__words">
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </span>
                      <span className={`ov-state ov-state--${item.tone}`}>{item.status}</span>
                      <span className="ov-item__when">{timeAgo(item.receivedAt, now)}</span>
                      <ChevronIcon width={15} height={15} className="ov-item__go" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ov-none">Nothing has come in yet. New submissions will show up here as soon as people send them.</p>
            )}
          </Panel>
        </div>

        <div className="ov-column ov-column--side">
          <TestimonyFormSwitch payload={payload} />

          {guests && (
            <Panel title="International guests" link={{ href: '/admin/collections/international-registrations', label: 'See all' }}>
              <div aria-hidden className="ov-split">
                {data.guests.byStatus
                  .filter((status) => status.count)
                  .map((status) => (
                    <span key={status.value} className={`ov-split__part ov-split__part--${status.value}`} style={{ flexGrow: status.count }} />
                  ))}
              </div>
              <ul className="ov-key">
                {data.guests.byStatus.map((status) => (
                  <li key={status.value}>
                    <i aria-hidden className={`ov-key__mark ov-split__part--${status.value}`} />
                    {status.label}
                    <strong>{status.count}</strong>
                  </li>
                ))}
              </ul>
              <p className="ov-needs-label">Guests asking for</p>
              <dl className="ov-needs">
                <div>
                  <dd>{data.guests.pickup}</dd>
                  <dt>Airport pickup</dt>
                </div>
                <div>
                  <dd>{data.guests.accommodation}</dd>
                  <dt>Accommodation</dt>
                </div>
              </dl>
              <p className="ov-next">
                {data.guests.nextArrival ? (
                  <>
                    Next to arrive: <strong>{data.guests.nextArrival.name}</strong>, {data.guests.nextArrival.date}
                  </>
                ) : statusTotal ? (
                  'No arrivals coming up'
                ) : (
                  'Requests from the international guest form will show here.'
                )}
              </p>
            </Panel>
          )}

          <Panel title="Testimonies by type" note="Everything except rejected ones">
            {types.length ? (
              <ul className="ov-types">
                {types.map((type) => (
                  <li key={type.value}>
                    <span className="ov-types__row">
                      {type.label}
                      <strong>{type.count}</strong>
                    </span>
                    <span aria-hidden className="ov-types__track">
                      <i style={{ width: `${(type.count / mostOfAType) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ov-none ov-none--tight">When testimonies come in, you’ll see here what kind people are sending.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
