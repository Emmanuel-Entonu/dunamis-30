'use client'

import { toast } from 'sonner'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { categoryLabels } from '@/lib/categories'
import type { DashboardData } from '@/lib/dashboardData'
import { cn } from '@/lib/utils'
import { A, Arrow, Glyph, Header, Plain, shortDate, Tile, TilesLoading, toneClass, Trouble, type Tone } from './bits'
import { addIcon, downloadIcon, planeIcon, playIcon, userIcon } from './icons'
import { FormSwitch } from './Overview'
import { useData } from './store'

export type Section = {
  key: 'testimonies' | 'stories' | 'guests'
  title: string
  collection: string
  field: string
  tabs: [string, string][]
  select: string[]
  add?: string
}

const reviewTabs: [string, string][] = [
  ['pending', 'Waiting'],
  ['approved', 'On the website'],
  ['rejected', 'Rejected'],
  ['', 'Everything'],
]

export const sections: Record<Section['key'], Section> = {
  testimonies: {
    key: 'testimonies',
    title: 'Testimonies',
    collection: 'testimonies',
    field: 'status',
    tabs: reviewTabs,
    select: ['title', 'name', 'category', 'status', 'hasVideo', 'createdAt'],
    add: 'Add a testimony',
  },
  stories: {
    key: 'stories',
    title: 'Sons of the Prophet',
    collection: 'sons-stories',
    field: 'status',
    tabs: reviewTabs,
    select: ['headline', 'name', 'location', 'status', 'hasVideo', 'createdAt'],
    add: 'Add a story',
  },
  guests: {
    key: 'guests',
    title: 'International guests',
    collection: 'international-registrations',
    field: 'logisticsStatus',
    tabs: [
      ['new', 'New'],
      ['contacted', 'Contacted'],
      ['confirmed', 'Confirmed'],
      ['declined', 'Cannot accommodate'],
      ['', 'Everyone'],
    ],
    select: ['fullName', 'country', 'logisticsStatus', 'arrivalDate', 'needsPickup', 'needsAccommodation', 'travellingWith', 'createdAt'],
  },
}

export function listUrl(section: Section, tab: string, limit: number) {
  const params = new URLSearchParams({ limit: String(limit), depth: '0', sort: '-createdAt' })
  section.select.forEach((field) => params.set(`select[${field}]`, 'true'))
  if (tab) params.set(`where[${section.field}][equals]`, tab)
  return `/api/${section.collection}?${params}`
}

export const detailUrl = (section: Section, id: string | number) => `/api/${section.collection}/${id}?depth=1`

type Row = {
  id: number
  title?: string
  headline?: string
  fullName?: string
  name?: string | null
  category?: string
  location?: string | null
  country?: string
  status?: string
  logisticsStatus?: string | null
  hasVideo?: boolean
  arrivalDate?: string | null
  needsPickup?: boolean | null
  needsAccommodation?: boolean | null
  travellingWith?: number | null
  createdAt: string
}

const palette: Tone[] = ['teal', 'pink', 'butter', 'lilac']

const statusWord: Record<string, string> = { pending: 'Waiting', approved: 'On the website', rejected: 'Rejected', new: 'New', contacted: 'Contacted', confirmed: 'Confirmed', declined: 'Cannot accommodate' }

function RowTile({ section, row }: { section: Section; row: Row }) {
  const guest = section.key === 'guests'
  const title = row.title ?? row.headline ?? row.fullName ?? ''
  const label = guest ? row.country : section.key === 'stories' ? row.location || 'Story' : (categoryLabels[row.category ?? ''] ?? 'Testimony')
  const state = row.status ?? row.logisticsStatus ?? 'new'
  const who = guest
    ? [row.arrivalDate ? `Arrives ${shortDate(row.arrivalDate)}` : null, row.travellingWith ? `+${row.travellingWith} travelling` : null].filter(Boolean).join(' · ')
    : [row.name || 'No name given', shortDate(row.createdAt)].join(' · ')
  const href = `/dashboard/${section.key}/${row.id}`
  return (
    <A href={href} warm={detailUrl(section, row.id)} className={cn('group flex min-h-[210px] flex-col rounded-[28px] p-6', toneClass(palette[row.id % palette.length]))}>
      <span className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          {row.hasVideo && <Glyph icon={playIcon} className="size-4" />}
          {guest && (row.needsPickup || row.needsAccommodation) && <Glyph icon={planeIcon} className="size-4" />}
          <span className="truncate">
            {label}
            {row.hasVideo ? ' · Video' : ''}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold">{statusWord[state] ?? state}</span>
      </span>
      <span className="mt-auto line-clamp-3 pt-6 text-[23px] leading-[1.18] font-medium tracking-[-0.01em]">{title}</span>
      <span className="mt-3 flex items-end justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-soft">
          {!guest && <Glyph icon={userIcon} className="size-4" />}
          <span className="truncate">{who}</span>
        </span>
        <Arrow />
      </span>
    </A>
  )
}

function GuestSide({ data }: { data: DashboardData }) {
  const guests = data.guests
  if (!guests) return null
  return (
    <div className="grid gap-4">
      <Tile tone="butter">
        <h3 className="text-xl font-medium">What they need</h3>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          {[
            ['Airport pickup', guests.pickup],
            ['Accommodation', guests.accommodation],
          ].map(([label, value]) => (
            <div key={label}>
              <dd className="text-[34px] leading-none font-medium tabular-nums">{value}</dd>
              <dt className="mt-1.5 text-sm text-soft">{label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm font-medium">{guests.travelling} people travelling in all</p>
      </Tile>
      <Button asChild className="h-14 rounded-2xl text-[15px]">
        <a href="/api/international-registrations/export.csv" onClick={() => toast.success('Your spreadsheet is downloading')}>
          <Glyph icon={downloadIcon} /> Download the guest list
        </a>
      </Button>
    </div>
  )
}

const opened = new Map<string, number>()

export function SectionList({ section: key, query, you }: { section: Section['key']; query: string; you: string }) {
  const section = sections[key]
  const asked = new URLSearchParams(query).get('tab')
  const tab = asked ?? section.tabs[0][0]
  // How far each list was opened, so coming back to it shows the same rows.
  const [limit, setShown] = useState(() => opened.get(`${key}|${tab}`) ?? 24)
  const setLimit = (next: (n: number) => number) =>
    setShown((n) => {
      const value = next(n)
      opened.set(`${key}|${tab}`, value)
      return value
    })
  const url = listUrl(section, tab, limit)
  const { data, failed } = useData<{ docs: Row[]; totalDocs: number; hasNextPage: boolean }>(url)
  const { data: overview } = useData<DashboardData>('/dashboard/data')
  const counts = overview?.[key] as Record<string, number> | null | undefined

  return (
    <>
      <Header title={section.title} count={counts?.all} you={you} />

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Show" className="flex max-w-full gap-6 overflow-x-auto [scrollbar-width:none]">
          {section.tabs.map(([value, label]) => {
            const count = value ? (counts?.[value] ?? 0) : (counts?.all ?? 0)
            const active = value === tab
            return (
              <A
                key={label}
                href={`/dashboard/${key}${value === section.tabs[0][0] ? '' : `?tab=${value}`}`}
                warm={listUrl(section, value, 24)}
                aria-current={active ? 'page' : undefined}
                className={cn('flex shrink-0 items-center gap-2 border-b-2 py-2 text-[15px] transition-colors', active ? 'border-ink font-semibold text-ink' : 'border-transparent font-medium text-soft hover:text-ink')}
              >
                {label}
                <span className="text-sm font-medium text-mist tabular-nums">{count}</span>
              </A>
            )
          })}
        </nav>
        {section.add && (
          <Button asChild className="h-13 rounded-2xl px-6 text-[15px]">
            <A href={`/dashboard/${key}/new`}>
              <Glyph icon={addIcon} /> {section.add}
            </A>
          </Button>
        )}
      </div>

      <div className={cn('mt-6 grid grid-cols-1 gap-6', key !== 'stories' && 'xl:grid-cols-[minmax(0,1fr)_330px]')}>
        <div className="min-w-0">
          {!data && failed ? (
            <Trouble url={url} />
          ) : !data ? (
            <TilesLoading />
          ) : data.docs.length ? (
            <>
              <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', key === 'stories' && 'xl:grid-cols-3')}>
                {data.docs.map((row) => (
                  <RowTile key={row.id} section={section} row={row} />
                ))}
              </div>
              {data.hasNextPage && (
                <div className="mt-5 flex justify-center">
                  <Button variant="outline" className="h-12 rounded-2xl border-0 bg-white px-6 shadow-none" onClick={() => setLimit((n) => n + 24)}>
                    Show more
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Tile>
              <Plain>Nothing here yet.</Plain>
            </Tile>
          )}
        </div>
        {key === 'testimonies' && overview && (
          <div>
            <FormSwitch open={overview.formOpen} />
          </div>
        )}
        {key === 'guests' && overview && <GuestSide data={overview} />}
      </div>
    </>
  )
}
