'use client'

import { Button, useAllFormFields, useDocumentInfo, useField, useForm, useFormProcessing, useFormSubmitted } from '@payloadcms/ui'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { shrinkPhoto } from '@/components/forms/Field'
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

function Photo({ path, label, onRemove }: { path: string; label: string; onRemove?: (id: number) => void }) {
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
      <button
        type="button"
        className="review-link"
        onClick={() => {
          onRemove?.(value)
          setValue(null)
        }}
      >
        {onRemove ? 'Remove this photo' : 'Remove this photo, then press Save'}
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

/** One box on the Add form. The real fields sit in the collapsed section, which this form stands in for. */
function Entry({ path, label, hint, required, long }: { path: string; label: string; hint?: string; required?: boolean; long?: boolean }) {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const submitted = useFormSubmitted()
  const box = useRef<HTMLInputElement>(null)
  const missing = Boolean(required && submitted && !value?.trim())
  const id = `add-${path.replace(/\W/g, '-')}`

  // Straight to the box that needs filling in, however far down Save was.
  useEffect(() => {
    if (missing) box.current?.focus()
  }, [missing])

  return (
    <div className="add-entry__field">
      <label htmlFor={id}>
        {label}
        {required && <span className="add-entry__needed"> *</span>}
      </label>
      {long ? (
        <textarea id={id} rows={6} value={value ?? ''} onChange={(event) => setValue(event.target.value)} />
      ) : (
        <input
          ref={box}
          id={id}
          value={value ?? ''}
          aria-invalid={missing || showError || undefined}
          onChange={(event) => setValue(event.target.value)}
          // Enter moves on to nothing here. Only the Save button saves, so a half-finished entry isn't saved by accident.
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault()
          }}
        />
      )}
      {missing ? <p className="review-problem">Please add a title.</p> : showError ? <p className="review-problem">{errorMessage}</p> : hint && <p className="review-muted">{hint}</p>}
    </div>
  )
}

function TypeChoice() {
  const { value, setValue } = useField<string>({ path: 'category' })
  return (
    <div className="add-entry__field">
      <label htmlFor="add-category">Type</label>
      <select id="add-category" value={value ?? 'other'} onChange={(event) => setValue(event.target.value)}>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Shrinks and stores a photo. Like every submission's photo, it stays private until the entry is approved. */
function AddPhoto({ path, label }: { path: string; label: string }) {
  const { value, setValue } = useField<number | null>({ path })
  const input = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

  const pick = async (file?: File) => {
    if (!file) return
    setStatus('Adding the photo…')
    try {
      const blob = await shrinkPhoto(file)
      const form = new FormData()
      form.set('file', new File([blob], `${crypto.randomUUID()}.jpg`, { type: 'image/jpeg' }))
      form.set('_payload', JSON.stringify({ alt: label, pendingReview: true, fromSubmission: true }))
      const saved = await fetch('/api/media', { method: 'POST', credentials: 'include', body: form })
      if (!saved.ok) throw new Error('not saved')
      setValue(((await saved.json()) as { doc: { id: number } }).doc.id)
      setStatus('')
    } catch {
      setStatus('That photo couldn’t be added. Please try a JPG or PNG.')
    }
  }

  if (value) return <Photo path={path} label={label} onRemove={(id) => void fetch(`/api/media/${id}`, { method: 'DELETE', credentials: 'include' })} />
  return (
    <div className="add-entry__field">
      <p className="add-entry__label">{label}</p>
      <div>
        <Button buttonStyle="secondary" size="small" margin={false} disabled={status === 'Adding the photo…'} onClick={() => input.current?.click()}>
          Choose a photo
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => {
          void pick(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {status && <p className="review-muted">{status}</p>}
    </div>
  )
}

function AddForm({ title, kind, children }: { title: string; kind: 'testimony' | 'story'; children: ReactNode }) {
  const { getDataByPath, setSubmitted, submit } = useForm()
  const processing = useFormProcessing()
  // No title, nothing to send: the title box says what's missing.
  const save = () => {
    if (String(getDataByPath(title) ?? '').trim()) void submit()
    else setSubmitted(true)
  }
  return (
    <div className={`review add-entry add-entry--${kind}`}>
      <p className="review-muted">Only the title is needed. Add anything else you have.</p>
      {children}
      <div className="add-entry__save">
        <Button buttonStyle="primary" margin={false} disabled={processing} onClick={save}>
          Save
        </Button>
        <p className="review-muted">Saving doesn’t put it on the website. You can approve it on the next screen.</p>
      </div>
    </div>
  )
}

const WRITE_UP_HINT = 'Leave this empty if there’s nothing to add. The website simply won’t show a write-up.'

function AddTestimony() {
  return (
    <AddForm title="title" kind="testimony">
      <Entry path="title" label="Title" required />
      <Entry path="name" label="Who it’s from (optional)" />
      <TypeChoice />
      <VideoReview kind="testimony" startOpen />
      <AddPhoto path="photo" label="A photo (optional)" />
      <Entry path="body" label="Write-up (optional)" hint={WRITE_UP_HINT} long />
    </AddForm>
  )
}

function AddStory() {
  return (
    <AddForm title="headline" kind="story">
      <Entry path="headline" label="Title" required />
      <Entry path="name" label="Who it’s from (optional)" />
      <Entry path="location" label="Where they’re based (optional)" />
      <Entry path="currentRole" label="What they do today (optional)" />
      <VideoReview kind="story" startOpen />
      <div className="review-photos">
        <AddPhoto path="beforePhoto" label="Photo from before (optional)" />
        <AddPhoto path="afterPhoto" label="Photo from today (optional)" />
      </div>
      <div className="add-entry__field">
        <p className="add-entry__label">Their story (optional)</p>
        <p className="review-muted">Leave any of these empty and that part won’t show on the website.</p>
      </div>
      <Entry path="story.before" label="Who they were before Dunamis" long />
      <Entry path="story.encounter" label="Their journey and encounter" long />
      <Entry path="story.transformation" label="How they were transformed" long />
      <Entry path="story.today" label="Where they are today" long />
      <Entry path="story.meaning" label="What Dunamis means to them" long />
    </AddForm>
  )
}

export function TestimonyPanel() {
  const { id } = useDocumentInfo()
  const { text, raw } = useValues()
  const body = text('body')
  if (!id) return <AddTestimony />
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
      {!body && text('summary') && <p className="review-note">They didn’t write a full testimony, only the short version above and any video.</p>}
      <Contact email={text('submitter.email')} phone={text('submitter.phone')} />
      {(body.length > 600 || Boolean(raw('hasVideo'))) && <ReviewActions basePath="/testimonies" />}
    </div>
  )
}

export function StoryPanel() {
  const { id } = useDocumentInfo()
  const { text, raw, rows } = useValues()
  const milestones = rows('milestones')
  if (!id) return <AddStory />
  return (
    <div className="review">
      <ReviewActions basePath="/sons-of-the-prophet" />
      <Facts
        rows={[
          ['Title', text('headline')],
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
