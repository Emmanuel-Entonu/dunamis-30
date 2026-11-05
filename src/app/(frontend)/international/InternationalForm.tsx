'use client'

import type { FormEvent } from 'react'

import { BotFields, Field, inputClass as input } from '@/components/forms/Field'
import { needsFixing, useSubmission } from '@/components/forms/useSubmission'
import { applyInternational } from './actions'

function YesNo({ name, legend, error }: { name: string; legend: string; error?: string }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-base text-fg">
        {legend}
        <span className="text-gold"> *</span>
      </legend>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { v: 'yes', l: 'Yes, please' },
          { v: 'no', l: 'No, thanks' },
        ].map((o) => (
          <label
            key={o.v}
            className="flex min-h-[50px] cursor-pointer items-center gap-3 rounded-lg border border-line bg-hair px-4 text-base text-fg transition-colors has-checked:border-gold has-checked:bg-gold/10"
          >
            <input type="radio" name={name} value={o.v} data-invalid={error ? 'true' : undefined} className="size-5 shrink-0 scroll-mt-28 accent-[#f0a92b]" />
            {o.l}
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-[#ff8a7a]">{error}</p>}
    </fieldset>
  )
}

export function InternationalForm() {
  const { formRef, state, show, busy, setBusy, startedAt, onFormChange, attempt } = useSubmission('international')
  const e = state.fieldErrors ?? {}

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    show({})
    const data = new FormData(event.currentTarget)
    const result = await attempt(() => applyInternational(data))
    if (result) show(result)
    setBusy(false)
  }

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-hair bg-[#171717] p-6 text-center sm:p-10" role="status">
        <p className="text-lg">Application received</p>
        <p className="mt-3 text-4xl font-medium tracking-tight text-fg sm:text-5xl">{state.reference}</p>
        <p className="mx-auto mt-5 max-w-[460px]">
          Keep this reference. Our international logistics team will contact you on WhatsApp or email to confirm your airport pickup and
          accommodation arrangements.
        </p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} onChange={onFormChange} noValidate className="relative rounded-2xl border border-hair bg-[#171717] p-5 sm:p-10">
      <BotFields startedAt={startedAt} />

      <h2 className="h-card">About You</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-[25px]">
        <Field name="fullName" label="Full name" required error={e.fullName}>
          <input id="fullName" name="fullName" autoComplete="name" className={input} aria-invalid={!!e.fullName} />
        </Field>
        <Field name="email" label="Email address" required error={e.email}>
          <input id="email" name="email" type="email" autoComplete="email" className={input} aria-invalid={!!e.email} />
        </Field>
        <Field name="whatsapp" label="WhatsApp number" required error={e.whatsapp} hint="Include your country code, e.g. +44 7…">
          <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" className={input} aria-invalid={!!e.whatsapp} />
        </Field>
        <Field name="country" label="Country of residence" required error={e.country}>
          <input id="country" name="country" autoComplete="country-name" className={input} aria-invalid={!!e.country} />
        </Field>
        <Field name="nationality" label="Nationality">
          <input id="nationality" name="nationality" className={input} />
        </Field>
        <Field name="travellingWith" label="People travelling with you" error={e.travellingWith}>
          <input id="travellingWith" name="travellingWith" type="number" min={0} max={50} defaultValue={0} inputMode="numeric" className={input} aria-invalid={!!e.travellingWith} />
        </Field>
      </div>

      <h2 className="h-card mt-10">Your Trip</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-[25px]">
        <Field name="arrivalDate" label="Arrival date" required error={e.arrivalDate}>
          <input id="arrivalDate" name="arrivalDate" type="date" className={`${input} [color-scheme:dark]`} aria-invalid={!!e.arrivalDate} />
        </Field>
        <Field name="arrivalTime" label="Expected arrival time">
          <input id="arrivalTime" name="arrivalTime" type="time" className={`${input} [color-scheme:dark]`} />
        </Field>
        <Field name="airline" label="Airline">
          <input id="airline" name="airline" className={input} />
        </Field>
        <Field name="flightNumber" label="Flight number">
          <input id="flightNumber" name="flightNumber" className={input} />
        </Field>
        <Field name="airport" label="Airport of arrival">
          <input id="airport" name="airport" defaultValue="Nnamdi Azikiwe International Airport, Abuja (ABV)" className={input} />
        </Field>
        <Field name="departureDate" label="Departure date" error={e.departureDate}>
          <input id="departureDate" name="departureDate" type="date" className={`${input} [color-scheme:dark]`} aria-invalid={!!e.departureDate} />
        </Field>
      </div>

      <h2 className="h-card mt-10">Support You Need</h2>
      <div className="mt-6 grid gap-6">
        <YesNo name="needsPickup" legend="Do you need airport pickup / transport?" error={e.needsPickup} />
        <YesNo name="needsAccommodation" legend="Do you need help with accommodation?" error={e.needsAccommodation} />
        <Field name="specialRequests" label="Anything else we should know?">
          <textarea id="specialRequests" name="specialRequests" rows={4} className={`${input} min-h-[140px] py-4`} />
        </Field>
      </div>

      <div className="mt-8 rounded-xl border border-gold/30 bg-gold/[0.07] p-4 text-[15px] sm:p-5">
        <strong className="text-fg">Please note:</strong> applying is not a confirmation of airport pickup or accommodation. Our international
        logistics team will contact you to confirm arrangements.
      </div>

      <label className="mt-6 flex items-start gap-3 text-[15px]">
        <input type="checkbox" name="consent" aria-invalid={!!e.consent} className="mt-0.5 size-5 shrink-0 scroll-mt-28 accent-[#f0a92b]" />
        <span>
          I agree that Dunamis may store these details and contact me about my visit.
          {e.consent && <span className="mt-1 block text-[#ff8a7a]">{e.consent}</span>}
        </span>
      </label>

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
        {busy ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  )
}
