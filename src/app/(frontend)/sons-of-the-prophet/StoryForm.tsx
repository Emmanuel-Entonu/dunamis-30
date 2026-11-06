'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

import { BotFields, Field, inputClass, shrinkPhoto } from '@/components/forms/Field'
import { needsFixing, useSubmission } from '@/components/forms/useSubmission'
import { addVideoToForm, useVideoAttachment, VideoField, VideoProgress } from '@/components/forms/VideoAttachment'
import { prepareStoryVideo, submitSonsStory } from './actions'

type Picked = { blob: Blob; url: string }

function PhotoPicker({ id, label, value, onPick, error }: { id: string; label: string; value: Picked | null; onPick: (file?: File) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <Field name={id} label={label} error={error}>
      <div className="flex items-center gap-4">
        <div className="grid size-[64px] shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-hair">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
          {value ? <img src={value.url} alt={label} className="h-full w-full object-cover" /> : <span className="text-xs">None</span>}
        </div>
        <button type="button" onClick={() => input.current?.click()} className="btn btn-outline !min-h-[44px] flex-1">
          {value ? 'Change photo' : 'Add a photo'}
        </button>
        <input id={id} ref={input} type="file" accept="image/*" className="hidden" onChange={(ev) => onPick(ev.target.files?.[0])} />
      </div>
    </Field>
  )
}

const chapters = [
  { name: 'before', label: 'Who I was before encountering Dunamis' },
  { name: 'encounter', label: 'My journey and encounter' },
  { name: 'transformation', label: 'The transformation I experienced' },
  { name: 'today', label: 'Where I am today' },
  { name: 'meaning', label: 'What Dunamis means to me' },
]

export function StoryForm() {
  const { formRef, state, show, busy, setBusy, onFormChange, attempt } = useSubmission('story')
  const video = useVideoAttachment()
  const [before, setBefore] = useState<Picked | null>(null)
  const [after, setAfter] = useState<Picked | null>(null)
  const [photoNote, setPhotoNote] = useState('')
  const e = state.fieldErrors ?? {}

  useEffect(() => () => void (before && URL.revokeObjectURL(before.url)), [before])
  useEffect(() => () => void (after && URL.revokeObjectURL(after.url)), [after])

  const pick = (set: (p: Picked) => void) => async (file?: File) => {
    setPhotoNote('')
    if (!file) return
    try {
      const blob = await shrinkPhoto(file)
      set({ blob, url: URL.createObjectURL(blob) })
    } catch {
      setPhotoNote('That photo couldn’t be opened. Please try a JPG or PNG.')
    }
  }

  /** Check the words first, then send the video, then save, so nobody uploads for nothing. */
  const send = async (withVideo: boolean) => {
    const form = formRef.current
    if (!form || busy) return
    setBusy(true)
    show({})
    try {
      const data = new FormData(form)
      if (before) data.set('beforePhoto', new File([before.blob], 'before.jpg', { type: 'image/jpeg' }))
      if (after) data.set('afterPhoto', new File([after.blob], 'today.jpg', { type: 'image/jpeg' }))

      if (withVideo && video.file) {
        const check = new FormData(form)
        check.delete('beforePhoto')
        check.delete('afterPhoto')
        if (!video.hasTicket()) check.set('needsTicket', '1')
        const prepared = await attempt(() => prepareStoryVideo(check))
        if (!prepared) return
        if (prepared.error || prepared.fieldErrors || prepared.ok) return show(prepared)
        const sent = await video.send(prepared.ticket)
        if (!sent) return
        addVideoToForm(data, video, sent)
      }

      const result = await attempt(() => submitSonsStory(data))
      if (result) show(result)
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void send(Boolean(video.file))
  }

  if (state.ok) {
    return (
      <div role="status" className="rounded-2xl border border-hair bg-[#171717] p-6 text-center sm:p-12">
        <p className="text-sm tracking-[0.18em] text-gold uppercase">Story received</p>
        <p className="mt-4 text-2xl font-medium text-fg sm:text-3xl">Thank you{state.firstName ? `, ${state.firstName}` : ''}. You are part of the legacy.</p>
        <p className="mx-auto mt-4 max-w-[480px]">Our communications team will read it and may get in touch before it goes up on the website.</p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} onChange={onFormChange} noValidate className="relative rounded-2xl border border-hair bg-[#171717] p-5 sm:p-10">
      <BotFields />

      <h3 className="h-card">About you</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-[25px]">
        <Field name="name" label="Full name" required error={e.name}>
          <input id="name" name="name" autoComplete="name" className={inputClass} aria-invalid={!!e.name} />
        </Field>
        <Field name="location" label="Where you are based" required error={e.location}>
          <input id="location" name="location" autoComplete="address-level2" placeholder="City, country" className={inputClass} aria-invalid={!!e.location} />
        </Field>
        <Field name="email" label="Email address" required error={e.email}>
          <input id="email" name="email" type="email" autoComplete="email" className={inputClass} aria-invalid={!!e.email} />
        </Field>
        <Field name="phone" label="Phone number" required error={e.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputClass} aria-invalid={!!e.phone} />
        </Field>
        <Field name="headline" label="A headline for your story" hint="e.g. “From the back row to the pulpit”.">
          <input id="headline" name="headline" maxLength={90} className={inputClass} />
        </Field>
        <Field name="currentRole" label="What you do today" hint="e.g. “Pastor and church planter”.">
          <input id="currentRole" name="currentRole" maxLength={90} className={inputClass} />
        </Field>
      </div>

      <h3 className="h-card mt-10">Before and after</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-[25px]">
        <PhotoPicker id="beforePhoto" label="Photo from before (optional)" value={before} onPick={pick(setBefore)} error={e.beforePhoto ?? photoNote} />
        <PhotoPicker id="afterPhoto" label="Photo from today (optional)" value={after} onPick={pick(setAfter)} error={e.afterPhoto} />
      </div>
      <div className="mt-5">
        <VideoField video={video} label="Video of your story (optional)" hint="Up to 5 minutes, and it can stand in for the writing below. We shrink it on your phone first, so it uses less data." error={e.video} />
      </div>

      <h3 className="h-card mt-10">Your story</h3>
      <div className="mt-6 grid gap-5">
        {chapters.map((c, i) => (
          <Field key={c.name} name={c.name} label={c.label} error={i === 0 ? e.before : undefined}>
            <textarea id={c.name} name={c.name} rows={4} className={`${inputClass} py-4`} aria-invalid={i === 0 ? !!e.before : undefined} />
          </Field>
        ))}
        <Field name="milestones" label="Ministry and career milestones (optional)" hint="One per line.">
          <textarea id="milestones" name="milestones" rows={3} className={`${inputClass} py-4`} />
        </Field>
        <Field name="appreciation" label="A personal message of appreciation (optional)">
          <textarea id="appreciation" name="appreciation" rows={3} className={`${inputClass} py-4`} />
        </Field>
      </div>

      <div className="mt-8 grid gap-4 text-[15px]">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="showName" defaultChecked className="mt-0.5 size-5 shrink-0 accent-[#f0a92b]" />
          <span>Show my name with my story.</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consent" aria-invalid={!!e.consent} className="mt-0.5 size-5 shrink-0 scroll-mt-28 accent-[#f0a92b]" />
          <span>
            I consent to Dunamis International Gospel Centre publishing this story (and my photos or video, if provided) on its website and channels.<span className="text-gold"> *</span>
            {e.consent && <span className="mt-1 block text-[#ff8a7a]">{e.consent}</span>}
          </span>
        </label>
      </div>

      <VideoProgress
        video={video}
        onRetry={() => void send(true)}
        onSendWithout={() => {
          video.clear()
          void send(false)
        }}
        withoutLabel="Send without the video"
      />

      {state.error && (
        <p role="alert" className="mt-6 rounded-lg border border-[#ff8a7a]/40 bg-[#ff8a7a]/10 p-4 text-[15px] text-[#ffb3a8]">
          {state.error}
        </p>
      )}
      {needsFixing(state) && (
        <p role="alert" className="mt-6 text-[15px] text-[#ff8a7a]">
          Please check the fields marked above.
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary mt-8 w-full disabled:opacity-60 sm:w-[260px]">
        {busy ? (video.working ? 'Sending your video…' : 'Sending…') : 'Share My Story'}
      </button>
      <p className="mt-4 text-sm">Our communications team reads every story before it goes up.</p>
    </form>
  )
}
