'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'

import { BotFields, Field, inputClass, shrinkPhoto } from '@/components/forms/Field'
import { categoryLabels } from '@/lib/categories'
import { submitTestimony, type TestimonyState } from './actions'

export function TestimonyForm() {
  const [state, dispatch, pending] = useActionState<TestimonyState, FormData>(submitTestimony, {})
  const [, startTransition] = useTransition()
  const [startedAt, setStartedAt] = useState(0)
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [photoNote, setPhotoNote] = useState('')
  const [summaryLength, setSummaryLength] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const e = state.fieldErrors ?? {}

  useEffect(() => setStartedAt(Date.now()), [])
  useEffect(() => () => void (photo && URL.revokeObjectURL(photo.url)), [photo])

  const pickPhoto = async (file?: File) => {
    setPhotoNote('')
    if (!file) return
    try {
      const blob = await shrinkPhoto(file)
      setPhoto({ blob, url: URL.createObjectURL(blob) })
    } catch {
      setPhotoNote('That photo couldn’t be opened. Please try a JPG or PNG.')
    }
  }

  // Dispatch from onSubmit (not the form `action`): React resets forms after an `action`
  // completes, which would wipe a long testimony whenever validation fails.
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (photo) data.set('photo', new File([photo.blob], 'photo.jpg', { type: 'image/jpeg' }))
    startTransition(() => dispatch(data))
  }

  if (state.ok) {
    return (
      <div role="status" className="rounded-2xl border border-hair bg-[#171717] p-6 text-center sm:p-12">
        <p className="text-sm tracking-[0.18em] text-gold uppercase">Testimony received</p>
        <p className="mt-4 text-2xl font-medium text-fg sm:text-3xl">Thank you{state.firstName ? `, ${state.firstName}` : ''}. God be praised!</p>
        <p className="mx-auto mt-4 max-w-[480px]">
          Our communications team will read it and may get in touch before it goes up on the website.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative rounded-2xl border border-hair bg-[#171717] p-5 sm:p-10">
      <BotFields startedAt={startedAt} />

      <h3 className="h-card">About you</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-[25px]">
        <Field name="name" label="Full name" required error={e.name}>
          <input id="name" name="name" autoComplete="name" className={inputClass} aria-invalid={!!e.name} />
        </Field>
        <Field name="email" label="Email address" required error={e.email}>
          <input id="email" name="email" type="email" autoComplete="email" className={inputClass} aria-invalid={!!e.email} />
        </Field>
        <Field name="phone" label="Phone number" required error={e.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputClass} aria-invalid={!!e.phone} />
        </Field>
        <Field name="category" label="Category" required error={e.category}>
          <select id="category" name="category" defaultValue="" className={`${inputClass} appearance-none`} aria-invalid={!!e.category}>
            <option value="" disabled>
              Choose a category
            </option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <h3 className="h-card mt-10">Your testimony</h3>
      <div className="mt-6 grid gap-5">
        <Field name="title" label="Title" required error={e.title} hint="A short headline, e.g. “Healed after twelve years”.">
          <input id="title" name="title" maxLength={90} className={inputClass} aria-invalid={!!e.title} />
        </Field>
        <Field name="summary" label="Short description" required error={e.summary} hint={`${summaryLength}/320. This shows on your testimony card.`}>
          <textarea
            id="summary"
            name="summary"
            rows={3}
            maxLength={320}
            onChange={(ev) => setSummaryLength(ev.target.value.length)}
            className={`${inputClass} py-4`}
            aria-invalid={!!e.summary}
          />
        </Field>
        <Field name="body" label="Full testimony" required error={e.body}>
          <textarea id="body" name="body" rows={8} className={`${inputClass} py-4`} aria-invalid={!!e.body} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-[25px]">
          <Field name="photo" label="Photo (optional)" error={e.photo ?? photoNote}>
            <div className="flex items-center gap-4">
              <div className="grid size-[64px] shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-hair">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                {photo ? <img src={photo.url} alt="Your photo" className="h-full w-full object-cover" /> : <span className="text-xs">None</span>}
              </div>
              <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-outline !min-h-[44px] flex-1">
                {photo ? 'Change photo' : 'Add a photo'}
              </button>
              <input id="photo" ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(ev) => pickPhoto(ev.target.files?.[0])} />
            </div>
          </Field>
          <Field name="videoUrl" label="Video link (optional)" error={e.videoUrl} hint="YouTube, Facebook, Instagram or Google Drive.">
            <input id="videoUrl" name="videoUrl" type="url" inputMode="url" placeholder="https://" className={inputClass} aria-invalid={!!e.videoUrl} />
          </Field>
        </div>
      </div>

      <div className="mt-8 grid gap-4 text-[15px]">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="showName" defaultChecked className="mt-1 size-4 accent-[#f0a92b]" />
          <span>Show my name with my testimony.</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consent" className="mt-1 size-4 accent-[#f0a92b]" />
          <span>
            I consent to Dunamis International Gospel Centre publishing this testimony (and my photo or video, if provided) on its website and
            channels.<span className="text-gold"> *</span>
            {e.consent && <span className="mt-1 block text-[#ff8a7a]">{e.consent}</span>}
          </span>
        </label>
      </div>

      {state.error && (
        <p role="alert" className="mt-6 rounded-lg border border-[#ff8a7a]/40 bg-[#ff8a7a]/10 p-4 text-[15px] text-[#ffb3a8]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-8 w-full disabled:opacity-60 sm:w-[260px]">
        {pending ? 'Sending…' : 'Share My Testimony'}
      </button>
      <p className="mt-4 text-sm">Our communications team reads every testimony before it goes up.</p>
    </form>
  )
}
