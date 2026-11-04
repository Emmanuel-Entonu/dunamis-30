'use server'

import { getPayloadClient } from '@/lib/content'
import { checkSubmission, esc, isEmail } from '@/lib/spam'

export type SonsState = { ok?: boolean; firstName?: string; error?: string; fieldErrors?: Partial<Record<string, string>> }

const MAX_PHOTO = 6 * 1024 * 1024

/** Public "Share your story" form. Everything lands as "Pending review" for the comms team. */
export async function submitSonsStory(_prev: SonsState, formData: FormData): Promise<SonsState> {
  const spam = await checkSubmission(formData, 'sons-story')
  if (!spam.ok) return spam.silent ? { ok: true } : { error: spam.message }

  const get = (key: string) => String(formData.get(key) ?? '').trim()
  const data = {
    name: get('name'),
    location: get('location'),
    email: get('email').toLowerCase(),
    phone: get('phone'),
    headline: get('headline'),
    currentRole: get('currentRole'),
    before: get('before'),
    encounter: get('encounter'),
    transformation: get('transformation'),
    today: get('today'),
    meaning: get('meaning'),
    milestones: get('milestones'),
    appreciation: get('appreciation'),
    videoUrl: get('videoUrl'),
    showName: formData.get('showName') === 'on',
  }

  const fieldErrors: SonsState['fieldErrors'] = {}
  if (data.name.length < 2) fieldErrors.name = 'Please enter your full name.'
  if (data.location.length < 2) fieldErrors.location = 'Please tell us where you are based.'
  if (!isEmail(data.email)) fieldErrors.email = 'Please enter a valid email address.'
  if (data.phone.replace(/\D/g, '').length < 7) fieldErrors.phone = 'Please enter a phone number we can reach you on.'
  if (data.videoUrl && !/^https?:\/\/\S+$/i.test(data.videoUrl)) fieldErrors.videoUrl = 'Please paste a full link, starting with https://'
  const written = [data.before, data.encounter, data.transformation, data.today, data.meaning].join('').length
  if (written < 60 && !data.videoUrl) fieldErrors.before = 'Please write your story below, or add a link to a video of it.'
  if (formData.get('consent') !== 'on') fieldErrors.consent = 'Please confirm we may publish your story.'

  const photos = { beforePhoto: formData.get('beforePhoto'), afterPhoto: formData.get('afterPhoto') }
  for (const [key, photo] of Object.entries(photos)) {
    if (!(photo instanceof File) || photo.size === 0) continue
    if (!photo.type.startsWith('image/')) fieldErrors[key] = 'Please upload an image file.'
    else if (photo.size > MAX_PHOTO) fieldErrors[key] = 'Please upload a photo under 6 MB.'
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors }

  try {
    const payload = await getPayloadClient()
    const upload = async (photo: FormDataEntryValue | null, label: string) => {
      if (!(photo instanceof File) || photo.size === 0) return undefined
      const media = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: `${data.name} — ${label}` },
        file: { data: Buffer.from(await photo.arrayBuffer()), mimetype: photo.type, name: `story-${label}-${Date.now()}.jpg`, size: photo.size },
      })
      return media.id
    }
    const [beforePhoto, afterPhoto] = [await upload(photos.beforePhoto, 'before'), await upload(photos.afterPhoto, 'today')]

    await payload.create({
      collection: 'sons-stories',
      overrideAccess: true,
      data: {
        name: data.name,
        location: data.location,
        headline: data.headline || undefined,
        currentRole: data.currentRole || undefined,
        beforePhoto,
        afterPhoto,
        videoUrl: data.videoUrl || undefined,
        story: {
          before: data.before || undefined,
          encounter: data.encounter || undefined,
          transformation: data.transformation || undefined,
          today: data.today || undefined,
          meaning: data.meaning || undefined,
        },
        milestones: data.milestones
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 20)
          .map((text) => ({ text })),
        appreciation: data.appreciation || undefined,
        status: 'pending',
        consentToPublish: true,
        showName: data.showName,
        submitter: { email: data.email, phone: data.phone },
      },
    })

    // Let the communications team know (best effort).
    if (process.env.RESEND_API_KEY && process.env.TESTIMONY_NOTIFY_EMAIL) {
      await payload
        .sendEmail({
          to: process.env.TESTIMONY_NOTIFY_EMAIL,
          subject: `New Sons of the Prophet story to review: ${data.name}`,
          html: `<p><strong>${esc(data.name)}</strong> — ${esc(data.location)}</p><p>${esc(data.headline || data.before.slice(0, 200))}</p><p>${esc(data.email)} · ${esc(data.phone)}</p><p>Review it in the admin under Stories → Sons of the Prophet.</p>`,
        })
        .catch((e: unknown) => console.error('[sons] notify failed', e))
    }
  } catch (error) {
    console.error('[sons] could not save', error)
    return { error: 'We couldn’t send your story just now. Please try again in a few minutes.' }
  }

  return { ok: true, firstName: data.name.split(/\s+/)[0] }
}
