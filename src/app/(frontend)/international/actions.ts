'use server'

import { registrationReference } from '@/fields/shared'
import { getPayloadClient } from '@/lib/content'

export type ApplyState = {
  ok?: boolean
  reference?: string
  error?: string
  fieldErrors?: Partial<Record<string, string>>
}

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime())
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Application form for guests travelling from outside Nigeria (airport pickup / accommodation). */
export async function applyInternational(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const get = (key: string) => String(formData.get(key) ?? '').trim()

  // Honeypot: real visitors never see or fill this field.
  if (get('company')) return { ok: true, reference: 'DIGC-INT-RECEIVED' }

  const data = {
    fullName: get('fullName'),
    email: get('email').toLowerCase(),
    whatsapp: get('whatsapp'),
    country: get('country'),
    nationality: get('nationality'),
    arrivalDate: get('arrivalDate'),
    arrivalTime: get('arrivalTime'),
    airline: get('airline'),
    flightNumber: get('flightNumber').toUpperCase(),
    airport: get('airport'),
    departureDate: get('departureDate'),
    needsPickup: get('needsPickup'),
    needsAccommodation: get('needsAccommodation'),
    travellingWith: Number(get('travellingWith') || 0),
    specialRequests: get('specialRequests'),
  }

  const fieldErrors: ApplyState['fieldErrors'] = {}
  if (data.fullName.length < 2) fieldErrors.fullName = 'Please enter your full name.'
  if (!isEmail(data.email)) fieldErrors.email = 'Please enter a valid email address.'
  if (data.whatsapp.replace(/\D/g, '').length < 7) fieldErrors.whatsapp = 'Please enter your WhatsApp number with country code.'
  if (!data.country) fieldErrors.country = 'Please tell us the country you live in.'
  if (!isDate(data.arrivalDate)) fieldErrors.arrivalDate = 'Please choose your arrival date.'
  if (data.departureDate && (!isDate(data.departureDate) || data.departureDate < data.arrivalDate))
    fieldErrors.departureDate = 'Departure should be on or after your arrival date.'
  if (!['yes', 'no'].includes(data.needsPickup)) fieldErrors.needsPickup = 'Please let us know if you need transport.'
  if (!['yes', 'no'].includes(data.needsAccommodation)) fieldErrors.needsAccommodation = 'Please let us know if you need accommodation.'
  if (!Number.isInteger(data.travellingWith) || data.travellingWith < 0 || data.travellingWith > 50)
    fieldErrors.travellingWith = 'Please enter a number between 0 and 50.'
  if (formData.get('consent') !== 'on') fieldErrors.consent = 'Please agree so our logistics team can contact you.'
  if (Object.keys(fieldErrors).length) return { fieldErrors }

  const reference = registrationReference('DIGC-INT')
  let payload: Awaited<ReturnType<typeof getPayloadClient>>
  try {
    payload = await getPayloadClient()
    await payload.create({
      collection: 'international-registrations',
      overrideAccess: true,
      data: {
        reference,
        fullName: data.fullName,
        email: data.email,
        whatsapp: data.whatsapp,
        country: data.country,
        nationality: data.nationality || undefined,
        arrivalDate: data.arrivalDate,
        arrivalTime: data.arrivalTime || undefined,
        airline: data.airline || undefined,
        flightNumber: data.flightNumber || undefined,
        airport: data.airport || undefined,
        departureDate: data.departureDate || undefined,
        needsPickup: data.needsPickup === 'yes',
        needsAccommodation: data.needsAccommodation === 'yes',
        travellingWith: data.travellingWith,
        specialRequests: data.specialRequests || undefined,
      },
    })
  } catch (error) {
    console.error('[international] could not save application', error)
    return {
      error: 'We couldn’t submit your application just now. Please try again in a few minutes or contact the international desk.',
    }
  }

  // Confirmation + logistics alert (best effort — the application is already saved).
  if (process.env.RESEND_API_KEY) {
    const needs = [data.needsPickup === 'yes' && 'airport pickup / transport', data.needsAccommodation === 'yes' && 'accommodation'].filter(Boolean).join(' and ')
    try {
      await payload.sendEmail({
        to: data.email,
        subject: `We received your application (${reference})`,
        html: `<p>Dear ${esc(data.fullName)},</p><p>Thank you for applying to join the Dunamis 30th Anniversary celebration from ${esc(data.country)}. Your reference is <strong>${reference}</strong>.</p><p>${needs ? `You asked for help with ${needs}. ` : ''}<strong>This is not yet a confirmation of airport pickup or accommodation</strong> — our international logistics team will contact you to confirm arrangements.</p><p>Dunamis International Gospel Centre</p>`,
      })
      if (process.env.LOGISTICS_NOTIFY_EMAIL) {
        await payload.sendEmail({
          to: process.env.LOGISTICS_NOTIFY_EMAIL,
          subject: `New international guest: ${data.fullName} (${data.country}) — ${reference}`,
          html: `<p><strong>${esc(data.fullName)}</strong> · ${esc(data.email)} · WhatsApp ${esc(data.whatsapp)}</p><p>Arrives ${esc(data.arrivalDate)} ${esc(data.arrivalTime)} ${esc(data.airline)} ${esc(data.flightNumber)} at ${esc(data.airport)}; departs ${esc(data.departureDate || '—')}.</p><p>Pickup: ${data.needsPickup} · Accommodation: ${data.needsAccommodation} · Travelling with: ${data.travellingWith}</p><p>${esc(data.specialRequests)}</p>`,
        })
      }
    } catch (error) {
      console.error('[international] email failed', error)
    }
  }

  return { ok: true, reference }
}
