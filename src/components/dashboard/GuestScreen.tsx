'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { A, Glyph, Header, longDate, Tile } from './bits'
import { backIcon, letterIcon, phoneIcon, planeIcon, userIcon } from './icons'
import { detailUrl, sections } from './Lists'
import { buttonSize } from './ReviewScreen'
import { api, refreshWhere, setData, useData } from './store'

type Guest = {
  id: number
  fullName?: string
  country?: string
  nationality?: string | null
  reference?: string | null
  email?: string
  whatsapp?: string
  arrivalDate?: string | null
  arrivalTime?: string | null
  departureDate?: string | null
  airline?: string | null
  flightNumber?: string | null
  airport?: string | null
  needsPickup?: boolean | null
  needsAccommodation?: boolean | null
  travellingWith?: number | null
  specialRequests?: string | null
  logisticsStatus?: string | null
  logisticsNotes?: string | null
}

const steps: [string, string][] = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['confirmed', 'Confirmed'],
  ['declined', 'Cannot accommodate'],
]

const Fact = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div>
      <dt className="text-[13.5px] text-soft">{label}</dt>
      <dd className="text-[16px] font-medium">{value}</dd>
    </div>
  ) : null

export function GuestScreen({ id, you }: { id: string; you: string }) {
  const section = sections.guests
  const url = detailUrl(section, id)
  const { data: guest, failed } = useData<Guest>(url)
  const [notes, setNotes] = useState<string | null>(null)

  const back = (
    <A href="/dashboard/guests" aria-label="Back to international guests" className="grid size-12 shrink-0 place-items-center rounded-full bg-white">
      <Glyph icon={backIcon} />
    </A>
  )

  if (!guest) {
    return (
      <>
        <Header title={failed ? 'This isn’t here any more' : <Skeleton className="h-12 w-[300px] rounded-2xl bg-white" />} you={you} />
        {failed ? (
          <div className="mt-6">{back}</div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[240px] rounded-[28px] bg-white" />
            <Skeleton className="h-[240px] rounded-[28px] bg-white" />
          </div>
        )}
      </>
    )
  }

  const everywhere = () => refreshWhere((other) => other === '/dashboard/data' || other.startsWith(`/api/${section.collection}?`))

  /** The new status shows at once. If it doesn't save, it goes back and says so. */
  const setStatus = async (value: string) => {
    const before = guest.logisticsStatus
    setData<Guest>(url, (current) => current && { ...current, logisticsStatus: value })
    try {
      await api(url, { method: 'PATCH', json: { logisticsStatus: value } })
      toast.success('Status updated')
      everywhere()
    } catch {
      setData<Guest>(url, (current) => current && { ...current, logisticsStatus: before })
      toast.error('That didn’t save', { description: 'Please check your connection and try again.' })
    }
  }

  const saveNotes = async () => {
    try {
      await api(url, { method: 'PATCH', json: { logisticsNotes: notes ?? '' } })
      setData<Guest>(url, (current) => current && { ...current, logisticsNotes: notes })
      setNotes(null)
      toast.success('Notes saved')
    } catch {
      toast.error('That didn’t save', { description: 'Please check your connection and try again.' })
    }
  }

  const others = guest.travellingWith ?? 0
  const current = guest.logisticsStatus ?? 'new'
  const arrival = [guest.arrivalDate ? longDate(guest.arrivalDate) : null, guest.arrivalTime ? `at ${guest.arrivalTime}` : null].filter(Boolean).join(' ')
  const whatsapp = (guest.whatsapp ?? '').replace(/[^\d]/g, '')

  return (
    <>
      <Header title={guest.fullName} you={you} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {back}
        <nav aria-label="Status" className="flex max-w-full gap-6 overflow-x-auto [scrollbar-width:none]">
          {steps.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={value === current}
              onClick={() => value !== current && void setStatus(value)}
              className={cn('shrink-0 border-b-2 py-2 text-[15px] transition-colors', value === current ? 'border-ink font-semibold text-ink' : 'border-transparent font-medium text-soft hover:text-ink')}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Tile tone="teal">
          <h2 className="flex items-center gap-2 text-xl font-medium">
            <Glyph icon={userIcon} className="size-6" /> Who they are
          </h2>
          <dl className="mt-4 grid gap-3">
            <Fact label="Comes from" value={guest.country} />
            <Fact label="Nationality" value={guest.nationality} />
            <Fact label="Travelling with" value={others ? `${others} other ${others === 1 ? 'person' : 'people'}` : 'Nobody else'} />
            <Fact label="Reference" value={guest.reference} />
          </dl>
        </Tile>
        <Tile tone="butter">
          <h2 className="flex items-center gap-2 text-xl font-medium">
            <Glyph icon={planeIcon} className="size-6" /> Their trip
          </h2>
          <dl className="mt-4 grid gap-3">
            <Fact label="Arrives" value={arrival} />
            <Fact label="Flight" value={[guest.airline, guest.flightNumber].filter(Boolean).join(' ')} />
            <Fact label="Airport" value={guest.airport} />
            <Fact label="Leaves" value={guest.departureDate ? longDate(guest.departureDate) : null} />
          </dl>
        </Tile>
        <Tile tone="pink">
          <h2 className="text-xl font-medium">What they need</h2>
          <dl className="mt-4 grid gap-3">
            <Fact label="Airport pickup" value={guest.needsPickup ? 'Yes' : 'No'} />
            <Fact label="Accommodation" value={guest.needsAccommodation ? 'Yes' : 'No'} />
            <Fact label="Special requests" value={guest.specialRequests} />
          </dl>
        </Tile>
        <Tile tone="lilac">
          <h2 className="text-xl font-medium">How to reach them</h2>
          <div className="mt-3 grid gap-2 text-[15px] font-medium">
            {guest.email && (
              <a href={`mailto:${guest.email}`} className="flex items-center gap-2 break-all">
                <Glyph icon={letterIcon} /> {guest.email}
              </a>
            )}
            {guest.whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Glyph icon={phoneIcon} /> {guest.whatsapp}
              </a>
            )}
          </div>
        </Tile>
        <Tile className="md:col-span-2">
          <h2 className="text-xl font-medium">Notes for the team</h2>
          <Textarea
            aria-label="Notes for the team"
            rows={3}
            value={notes ?? guest.logisticsNotes ?? ''}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-3 rounded-[20px] border-0 bg-canvas p-4 text-base"
          />
          {notes !== null && (
            <Button className={`${buttonSize} mt-3`} onClick={() => void saveNotes()}>
              Save notes
            </Button>
          )}
        </Tile>
      </div>
    </>
  )
}
