'use client'

import { useAllFormFields, useField } from '@payloadcms/ui'
import { useEffect, useState, type ReactNode } from 'react'

import { categoryLabels } from '@/lib/categories'
import { ReviewActions } from './ReviewActions'
import { VideoReview } from './VideoReview'

/**
 * A submission opens as something to read, not a form: the words and video first, the decision
 * above and below them, and the editable boxes tucked away for when something needs correcting.
 */
const useValues = () => {
  const [fields] = useAllFormFields()
  const text = (path: string) => {
    const value = fields?.[path]?.value
    return typeof value === 'string' ? value.trim() : ''
  }
  const raw = (path: string) => fields?.[path]?.value
  const rows = (path: string) => fields?.[path]?.rows ?? []
  return { text, raw, rows }
}

function Words({ label, text }: { label: string; text: string }) {
  if (!text) return null
  return (
    <section className="review-block">
      <h3>{label}</h3>
      <p className="review-words">{text}</p>
    </section>
  )
}

function Photo({ path, label }: { path: string; label: string }) {
  const { value, setValue } = useField<number | null>({ path })
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!value) return
    let live = true
    fetch(`/api/media/${value}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc: { url?: string; sizes?: { card?: { url?: string } } } | null) => {
        if (live) setUrl(doc?.sizes?.card?.url || doc?.url || '')
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [value])
  if (!value) return null
  return (
    <figure className="review-photo">
      <figcaption>{label}</figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt={label} /> : <p className="review-muted">Loading the photo…</p>}
      <button type="button" className="review-link" onClick={() => setValue(null)}>
        Remove this photo, then press Save
      </button>
    </figure>
  )
}

function Contact({ email, phone, whatsapp }: { email?: string; phone?: string; whatsapp?: string }) {
  if (!email && !phone && !whatsapp) return null
  return (
    <section className="review-block review-contact">
      <h3>How to reach them</h3>
      <p className="review-muted">Private. Never shown on the website.</p>
      <p>
        {email && <a href={`mailto:${email}`}>{email}</a>}
        {phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            WhatsApp {whatsapp}
          </a>
        )}
      </p>
    </section>
  )
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, value]) => value)
  if (!shown.length) return null
  return (
    <dl className="review-facts">
      {shown.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const day = (value: unknown) => (typeof value === 'string' && value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '')

export function TestimonyPanel() {
  const { text, raw } = useValues()
  const body = text('body')
  return (
    <div className="review">
      <ReviewActions basePath="/testimonies" />
      <Facts
        rows={[
          ['From', text('name')],
          ['Location', text('location')],
          ['Type', categoryLabels[text('category')]],
        ]}
      />
      {raw('showName') === false && <p className="review-note">They asked for their name not to be shown on the website.</p>}
      <VideoReview kind="testimony" />
      <Photo path="photo" label="Their photo" />
      <Words label="In short" text={text('summary')} />
      <Words label="Their testimony" text={body} />
      {!body && <p className="review-note">They didn’t write a full testimony, only the short version above and any video.</p>}
      <Contact email={text('submitter.email')} phone={text('submitter.phone')} />
      {(body.length > 600 || Boolean(raw('hasVideo'))) && <ReviewActions basePath="/testimonies" />}
    </div>
  )
}

export function StoryPanel() {
  const { text, raw, rows } = useValues()
  const milestones = rows('milestones')
  return (
    <div className="review">
      <ReviewActions basePath="/sons-of-the-prophet" />
      <Facts
        rows={[
          ['Headline', text('headline')],
          ['From', text('name')],
          ['Location', text('location')],
          ['Today', text('currentRole')],
        ]}
      />
      {raw('showName') === false && <p className="review-note">They asked for their name not to be shown on the website.</p>}
      <VideoReview kind="story" />
      <div className="review-photos">
        <Photo path="beforePhoto" label="Their photo from before" />
        <Photo path="afterPhoto" label="Their photo today" />
      </div>
      <Words label="Who they were before Dunamis" text={text('story.before')} />
      <Words label="Their journey and encounter" text={text('story.encounter')} />
      <Words label="How they were transformed" text={text('story.transformation')} />
      <Words label="Where they are today" text={text('story.today')} />
      <Words label="What Dunamis means to them" text={text('story.meaning')} />
      {milestones.length > 0 && (
        <section className="review-block">
          <h3>Milestones</h3>
          <ul className="review-list">
            {milestones.map((row, i) => (
              <li key={row.id ?? i}>{[text(`milestones.${i}.year`), text(`milestones.${i}.text`)].filter(Boolean).join(': ')}</li>
            ))}
          </ul>
        </section>
      )}
      <Words label="Their message of appreciation" text={text('appreciation')} />
      <Contact email={text('submitter.email')} phone={text('submitter.phone')} />
      <ReviewActions basePath="/sons-of-the-prophet" />
    </div>
  )
}

export function GuestPanel() {
  const { text, raw } = useValues()
  const others = Number(raw('travellingWith') ?? 0)
  const arrival = [day(raw('arrivalDate')), text('arrivalTime') && `at ${text('arrivalTime')}`].filter(Boolean).join(' ')
  return (
    <div className="review">
      <Facts
        rows={[
          ['Comes from', text('country')],
          ['Nationality', text('nationality')],
          ['Reference', text('reference')],
        ]}
      />
      <section className="review-block">
        <h3>Their trip</h3>
        <Facts
          rows={[
            ['Arrives', arrival],
            ['Flight', [text('airline'), text('flightNumber')].filter(Boolean).join(' ')],
            ['Airport', text('airport')],
            ['Leaves', day(raw('departureDate'))],
          ]}
        />
      </section>
      <section className="review-block">
        <h3>What they need</h3>
        <Facts
          rows={[
            ['Airport pickup', raw('needsPickup') ? 'Yes' : 'No'],
            ['Accommodation', raw('needsAccommodation') ? 'Yes' : 'No'],
            ['Travelling with', others ? `${others} other ${others === 1 ? 'person' : 'people'}` : 'Nobody else'],
          ]}
        />
      </section>
      <Words label="Special requests" text={text('specialRequests')} />
      <Contact email={text('email')} whatsapp={text('whatsapp')} />
    </div>
  )
}
