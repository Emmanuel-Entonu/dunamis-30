'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { DashboardData } from '@/lib/dashboardData'
import type { TrafficDay } from '@/lib/siteEvents'
import { kpg } from '@/lib/site'
import { cn } from '@/lib/utils'
import {
  A,
  Arrow,
  Faces,
  Glyph,
  Header,
  kindHref,
  SectionTitle,
  Tile,
  toneClass,
  Trouble,
  type Tone,
} from './bits'
import {
  backIcon,
  bookIcon,
  cardIcon,
  chatIcon,
  computerIcon,
  forwardIcon,
  globeIcon,
  planeIcon,
  smartphoneIcon,
  usersIcon,
} from './icons'
import { listUrl, sections } from './Lists'
import { api, setData, useData } from './store'

const number = (value: number) => value.toLocaleString('en-GB')

function Waiting({
  tone,
  label,
  href,
  count,
  names,
  warm,
}: {
  tone: Tone
  label: string
  href: string
  count: number
  names: string[]
  warm: string
}) {
  return (
    <A
      href={href}
      warm={warm}
      className={cn(
        'group relative flex h-[210px] flex-col justify-end rounded-[28px] p-6',
        toneClass(tone),
      )}
    >
      <span className="absolute top-6 right-6 text-[15px] font-semibold">
        {count ? `${number(count)} new` : 'All done'}
      </span>
      {count > 0 && <Faces names={names} extra={Math.max(0, count - 4)} />}
      <span className="mt-4 flex items-end justify-between gap-3">
        <span className="text-[26px] leading-[1.12] font-medium tracking-[-0.01em]">{label}</span>
        <Arrow />
      </span>
    </A>
  )
}

function Stat({
  tone,
  label,
  value,
  href,
  onClick,
}: {
  tone: Tone
  label: string
  value: number
  href?: string
  onClick?: () => void
}) {
  const inner = (
    <>
      <span className="text-[17px] leading-tight font-medium">{label}</span>
      <span className="flex items-end justify-between gap-2">
        <span className="text-[50px] leading-none font-medium tracking-[-0.02em] tabular-nums">
          {number(value)}
        </span>
        <Arrow />
      </span>
    </>
  )
  const look = cn(
    'group flex h-[160px] flex-col justify-between rounded-[28px] p-6 text-left',
    toneClass(tone),
  )
  return href ? (
    <A href={href} className={look}>
      {inner}
    </A>
  ) : (
    <button type="button" onClick={onClick} className={look}>
      {inner}
    </button>
  )
}

function Bars({ days, noun }: { days: TrafficDay[]; noun: string }) {
  const highest = Math.max(...days.map((day) => day.total), 1)
  return (
    <div
      role="img"
      aria-label={`${noun} each day for the last 30 days`}
      className="flex h-[150px] items-end gap-[3px] sm:gap-1"
    >
      {days.map((day) => (
        <Tooltip key={day.key}>
          <TooltipTrigger asChild>
            <span className="flex h-full flex-1 items-end">
              <i
                className={cn(
                  'block w-full rounded-t-[4px]',
                  day.total ? 'bg-ink' : 'h-[3px] rounded-[2px] bg-butter-deep',
                )}
                style={
                  day.total ? { height: `${Math.max(5, (day.total / highest) * 100)}%` } : undefined
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {day.label}: {number(day.total)} {noun.toLowerCase()}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

type TrafficTab = 'visitors' | 'cards'

function Traffic({
  data,
  tab,
  setTab,
}: {
  data: DashboardData
  tab: TrafficTab
  setTab: (tab: TrafficTab) => void
}) {
  const traffic = data.traffic
  if (!traffic) {
    return (
      <div id="traffic" className="scroll-mt-6">
        <Tile tone="butter">
          <h3 className="text-xl font-medium">Visitors and social cards</h3>
          <p className="mt-2 text-[15px] text-soft">
            These numbers start counting when this update goes live.
          </p>
        </Tile>
      </div>
    )
  }
  const count = traffic[tab]
  return (
    <div id="traffic" className="scroll-mt-6">
      <Tile tone="butter">
        <Tabs value={tab} onValueChange={(value) => setTab(value as TrafficTab)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-medium">Last 30 days</h3>
            <TabsList className="h-auto gap-5 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="visitors"
                className="h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-1 pb-1.5 text-[15px] font-medium text-soft shadow-none data-[state=active]:border-ink data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-ink data-[state=active]:shadow-none"
              >
                <Glyph icon={usersIcon} className="size-4" /> Visitors
              </TabsTrigger>
              <TabsTrigger
                value="cards"
                className="h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pt-1 pb-1.5 text-[15px] font-medium text-soft shadow-none data-[state=active]:border-ink data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-ink data-[state=active]:shadow-none"
              >
                <Glyph icon={cardIcon} className="size-4" /> Social cards
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
        <dl className="mt-5 grid grid-cols-3 gap-3">
          {[
            ['Today', count.today],
            ['Last 7 days', count.week],
            ['All time', count.total],
          ].map(([label, value]) => (
            <div key={label}>
              <dd className="text-[30px] leading-none font-medium tabular-nums">
                {number(value as number)}
              </dd>
              <dt className="mt-1.5 text-sm text-soft">{label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-6">
          <Bars days={count.days} noun={tab === 'visitors' ? 'Visitors' : 'Cards'} />
        </div>
        {tab === 'cards' && (
          <p className="mt-4 text-sm font-medium">
            {number(traffic.cards.downloads)} downloaded · {number(traffic.cards.shares)} shared
          </p>
        )}
      </Tile>
    </div>
  )
}

function Places({ data }: { data: DashboardData }) {
  const traffic = data.traffic
  if (!traffic) return null
  const highest = Math.max(...traffic.countries.map((place) => place.count), 1)
  const devices = traffic.phones + traffic.computers
  return (
    <Tile tone="pink">
      <h3 className="flex items-center gap-2 text-xl font-medium">
        <Glyph icon={globeIcon} className="size-6" /> Where visitors come from
      </h3>
      {traffic.countries.length ? (
        <ul className="mt-5 grid gap-3.5 sm:grid-cols-2 sm:gap-x-8">
          {traffic.countries.map((place) => (
            <li key={place.name}>
              <span className="flex justify-between gap-3 text-[15px] font-medium">
                {place.name}
                <span className="tabular-nums">{number(place.count)}</span>
              </span>
              <Progress
                value={(place.count / highest) * 100}
                className="mt-1.5 h-2 rounded-[3px] bg-pink-deep [&_[data-slot=progress-indicator]]:bg-ink"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[15px] text-soft">
          Countries will show here once people start visiting.
        </p>
      )}
      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
        <span className="flex items-center gap-1.5">
          <Glyph icon={smartphoneIcon} className="size-[18px]" />{' '}
          {devices ? Math.round((traffic.phones / devices) * 100) : 0}% on phones
        </span>
        <span className="flex items-center gap-1.5">
          <Glyph icon={computerIcon} className="size-[18px]" />{' '}
          {devices ? Math.round((traffic.computers / devices) * 100) : 0}% on computers
        </span>
      </p>
    </Tile>
  )
}

const lagosToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date())
const key = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const kpgDays = (() => {
  const start = new Date(kpg.startsAt).getTime()
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(
      new Date(start + i * 86_400_000),
    ),
  )
})()

/** The month at a glance: Kingdom Power & Glory in black, the days something came in, and today in a dashed ring. */
function Calendar({ active }: { active: Record<string, number> }) {
  const today = lagosToday()
  const [month, setMonth] = useState(() => {
    const [y, m] = today.split('-').map(Number)
    return { y, m: m - 1 }
  })
  const first = new Date(Date.UTC(month.y, month.m, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const length = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate()
  const cells = Array.from({ length: Math.ceil((lead + length) / 7) * 7 }, (_, i) => {
    const date = new Date(Date.UTC(month.y, month.m, i - lead + 1))
    return {
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month.m,
      id: key(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    }
  })
  const shift = (by: number) =>
    setMonth(({ y, m }) => ({
      y: m + by < 0 ? y - 1 : m + by > 11 ? y + 1 : y,
      m: (m + by + 12) % 12,
    }))

  return (
    <Tile className="p-4 sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-[22px] font-medium">
          {new Intl.DateTimeFormat('en-GB', {
            timeZone: 'UTC',
            month: 'long',
            year: 'numeric',
          }).format(first)}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shift(-1)}
            className="grid size-10 place-items-center rounded-full hover:bg-canvas"
          >
            <Glyph icon={backIcon} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shift(1)}
            className="grid size-10 place-items-center rounded-full hover:bg-canvas"
          >
            <Glyph icon={forwardIcon} />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 justify-items-center gap-y-1.5 text-center">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => (
          <span key={name} className="pb-1 text-xs font-medium text-mist uppercase">
            {name}
          </span>
        ))}
        {cells.map((cell) => {
          const conference = kpgDays.includes(cell.id)
          const busy = !conference && (active[cell.id] ?? 0) > 0
          return (
            <span
              key={cell.id}
              title={conference ? kpg.title : busy ? `${active[cell.id]} received` : undefined}
              className={cn(
                'grid size-9 place-items-center rounded-full text-[15px] font-medium tabular-nums sm:size-10',
                !cell.inMonth && 'text-[#c4c8cd]',
                conference && 'bg-ink text-white',
                busy && 'bg-teal',
                cell.id === today && !conference && 'border-2 border-dashed border-ink',
              )}
            >
              {cell.day}
            </span>
          )
        })}
      </div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-soft">
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-ink" /> {kpg.title}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-teal-deep" /> Submissions came in
        </span>
      </p>
    </Tile>
  )
}

const kindIcon = { testimony: chatIcon, story: bookIcon, guest: planeIcon }
const kindWord = {
  testimony: 'Testimony',
  story: 'Sons of the Prophet story',
  guest: 'International guest',
}

function Latest({ data }: { data: DashboardData }) {
  if (!data.latest.length)
    return <Tile tone="teal">Nothing has come in yet. New submissions will show up here.</Tile>
  return (
    <ul className="grid grid-cols-1 gap-3">
      {data.latest.map((item) => (
        <li key={`${item.kind}-${item.id}`}>
          <A
            href={`${kindHref[item.kind]}/${item.id}`}
            className="group flex items-center gap-4 rounded-[24px] bg-teal p-4 pl-5"
          >
            <Glyph icon={kindIcon[item.kind]} className="size-6" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15.5px] font-medium">{item.title}</span>
              <span className="block truncate text-[13.5px] text-soft">
                {kindWord[item.kind]}
                {item.who && item.kind !== 'guest'
                  ? ` from ${item.who}`
                  : item.who
                    ? `, ${item.who}`
                    : ''}
              </span>
            </span>
            {item.waiting && (
              <span className="text-[13.5px] font-semibold">New</span>
            )}
          </A>
        </li>
      ))}
    </ul>
  )
}

/** Flips the moment it's pressed, then saves. If saving fails it flips back and says so. */
export function FormSwitch({ open }: { open: boolean | null }) {
  if (open === null) return null
  const flip = async (next: boolean) => {
    setData<DashboardData>(
      '/dashboard/data',
      (current) => current && { ...current, formOpen: next },
    )
    try {
      await api('/api/globals/testimony-settings', { method: 'POST', json: { formOpen: next } })
      toast.success(next ? 'The testimony form is on' : 'The testimony form is off', {
        description: next
          ? 'People can send testimonies from the website.'
          : 'It’s hidden from the website.',
      })
    } catch {
      setData<DashboardData>(
        '/dashboard/data',
        (current) => current && { ...current, formOpen: !next },
      )
      toast.error('That didn’t save', {
        description: 'Please check your connection and try again.',
      })
    }
  }
  return (
    <Tile tone="lilac">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-medium">Testimony form</h3>
          <p className="mt-1 text-[15px] text-soft">
            {open ? 'People can send testimonies.' : 'Hidden from the website.'}
          </p>
        </div>
        <Switch
          size="lg"
          checked={open}
          onCheckedChange={(next) => void flip(next)}
          aria-label="Testimony form"
          className="shadow-none data-[state=unchecked]:bg-lilac-deep [&_[data-slot=switch-thumb]]:bg-white"
        />
      </div>
    </Tile>
  )
}

export function Overview({ you }: { you: string }) {
  const { data, failed } = useData<DashboardData>('/dashboard/data')
  const [tab, setTab] = useState<TrafficTab>('visitors')
  const show = (next: TrafficTab) => {
    setTab(next)
    document.getElementById('traffic')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const waiting =
    (data?.testimonies?.pending ?? 0) + (data?.stories?.pending ?? 0) + (data?.guests?.new ?? 0)

  return (
    <>
      <Header
        you={you}
        title="Overview"
      />
      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-9 xl:grid-cols-[minmax(0,1fr)_minmax(0,410px)]">
        <div className="min-w-0">
          <SectionTitle count={data ? waiting : undefined}>Waiting for you</SectionTitle>
          {data ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.testimonies && (
                <Waiting
                  tone="teal"
                  label="Testimonies"
                  href="/dashboard/testimonies"
                  warm={listUrl(sections.testimonies, 'pending', 24)}
                  count={data.testimonies.pending ?? 0}
                  names={data.waiting.testimonies}
                />
              )}
              {data.guests && (
                <Waiting
                  tone="pink"
                  label="International guests"
                  href="/dashboard/guests"
                  warm={listUrl(sections.guests, 'new', 24)}
                  count={data.guests.new ?? 0}
                  names={data.waiting.guests}
                />
              )}
              {data.stories && (
                <div className="sm:col-span-2">
                  <A
                    href="/dashboard/stories"
                    warm={listUrl(sections.stories, 'pending', 24)}
                    className="group flex items-center justify-between gap-3 rounded-[28px] bg-lilac p-6"
                  >
                    <span>
                      <span className="block text-[26px] leading-tight font-medium tracking-[-0.01em]">
                        Sons of the Prophet
                      </span>
                      <span className="mt-1 block text-sm font-semibold">
                        {data.stories.pending ? `${number(data.stories.pending)} new` : 'All done'}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
                      {(data.stories.pending ?? 0) > 0 && (
                        <Faces
                          names={data.waiting.stories}
                          extra={Math.max(0, (data.stories.pending ?? 0) - 4)}
                        />
                      )}
                      <Arrow />
                    </span>
                  </A>
                </div>
              )}
            </div>
          ) : failed ? (
            <Trouble url="/dashboard/data" />
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-[210px] rounded-[28px] bg-white" />
              <Skeleton className="h-[210px] rounded-[28px] bg-white" />
            </div>
          )}

          <div className="mt-9">
            <SectionTitle>How it’s going</SectionTitle>
          </div>
          {data ? (
            <>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat
                  tone="teal"
                  label="Visitors today"
                  value={data.traffic?.visitors.today ?? 0}
                  onClick={() => show('visitors')}
                />
                <Stat
                  tone="butter"
                  label="Cards made"
                  value={data.traffic?.cards.total ?? 0}
                  onClick={() => show('cards')}
                />
                <Stat
                  tone="lilac"
                  label="On the website"
                  value={(data.testimonies?.approved ?? 0) + (data.stories?.approved ?? 0)}
                  href="/dashboard/testimonies?tab=approved"
                />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <Traffic data={data} tab={tab} setTab={setTab} />
                <Places data={data} />
              </div>
            </>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-[160px] rounded-[28px] bg-white" />
              <Skeleton className="h-[160px] rounded-[28px] bg-white" />
              <Skeleton className="h-[160px] rounded-[28px] bg-white" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <SectionTitle>This month</SectionTitle>
          <div className="mt-5 grid grid-cols-1 gap-4">
            <Calendar active={data?.activeDays ?? {}} />
            {data ? (
              <FormSwitch open={data.formOpen} />
            ) : (
              <Skeleton className="h-[96px] rounded-[28px] bg-white" />
            )}
            {data ? (
              <Latest data={data} />
            ) : (
              <Skeleton className="h-[260px] rounded-[28px] bg-white" />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
