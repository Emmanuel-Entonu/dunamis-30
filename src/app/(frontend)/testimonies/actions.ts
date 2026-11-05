'use server'

import type { SubmissionState } from '@/components/forms/useSubmission'
import { categoryLabels } from '@/lib/categories'
import { getPayloadClient, testimonyFormOpen } from '@/lib/content'
import { checkSubmission, esc, isEmail } from '@/lib/spam'
import { claimsVideo, photoProblem, readSubmittedVideo, savePoster, saveSubmissionPhoto, videoAlreadySaved } from '@/lib/submissions'
import { issueVideoTicket, videoStorageReady, type VideoTicket } from '@/lib/videoStorage'

const read = (formData: FormData) => {
  const get = (key: string) => String(formData.get(key) ?? '').trim()
  return {
    name: get('name'),
    email: get('email').toLowerCase(),
    phone: get('phone'),
    category: get('category'),
    title: get('title'),
    summary: get('summary'),
    body: get('body'),
    showName: formData.get('showName') === 'on',
  }
}

/** A video can stand in for the written testimony, so the long text is only required without one. */
function validate(data: ReturnType<typeof read>, formData: FormData, hasVideo: boolean) {
  const fieldErrors: NonNullable<SubmissionState['fieldErrors']> = {}
  if (data.name.length < 2) fieldErrors.name = 'Please enter your full name.'
  if (!isEmail(data.email)) fieldErrors.email = 'Please enter a valid email address.'
  if (data.phone.replace(/\D/g, '').length < 7) fieldErrors.phone = 'Please enter a phone number we can reach you on.'
  if (!categoryLabels[data.category]) fieldErrors.category = 'Please choose a category.'
  if (data.title.length < 4) fieldErrors.title = 'Please give your testimony a short title.'
  if (data.summary.length < 20) fieldErrors.summary = 'Please write a sentence or two about what God did.'
  if (data.summary.length > 320) fieldErrors.summary = 'Please keep the short description under 320 characters.'
  if (!hasVideo && data.body.length < 40) fieldErrors.body = 'Please tell us the full testimony, or add a video of it.'
  if (formData.get('consent') !== 'on') fieldErrors.consent = 'Please confirm we may publish your testimony.'
  const photo = photoProblem(formData.get('photo'))
  if (photo) fieldErrors.photo = photo
  return fieldErrors
}

const CLOSED = 'We’re not taking new testimonies at the moment. Thank you for wanting to share.'

/**
 * The first step when a video is attached: check everything before asking someone to spend data on
 * an upload. Returns a ticket for storage, unless this attempt already has one.
 */
export async function prepareTestimonyVideo(formData: FormData): Promise<SubmissionState & { ticket?: VideoTicket }> {
  if (!(await testimonyFormOpen())) return { error: CLOSED }

  const spam = await checkSubmission(formData, 'testimony')
  if (!spam.ok) return spam.silent ? { ok: true } : { error: spam.message }

  const data = read(formData)
  const fieldErrors = validate(data, formData, true)
  if (Object.keys(fieldErrors).length) return { fieldErrors }
  if (formData.get('needsTicket') !== '1') return {}

  if (!videoStorageReady()) return { error: 'Video uploads aren’t available just now. You can write your testimony instead, or try again later.' }
  try {
    return { ticket: await issueVideoTicket() }
  } catch (error) {
    console.error('[testimony] could not start a video upload', error)
    return { error: 'We couldn’t start your video upload just now. Please try again in a few minutes.' }
  }
}

/** Public "Share your testimony" form. Everything lands as "Pending review" for the comms team. */
export async function submitTestimony(formData: FormData): Promise<SubmissionState> {
  if (!(await testimonyFormOpen())) return { error: CLOSED }

  // A form with a video passed this check in the first step, and its ticket proves it.
  if (!claimsVideo(formData)) {
    const spam = await checkSubmission(formData, 'testimony')
    if (!spam.ok) return spam.silent ? { ok: true } : { error: spam.message }
  }

  const data = read(formData)
  const { video, error: videoError } = await readSubmittedVideo(formData)
  if (videoError) return { fieldErrors: { video: videoError } }
  const fieldErrors = validate(data, formData, Boolean(video))
  if (Object.keys(fieldErrors).length) return { fieldErrors }

  try {
    const payload = await getPayloadClient()
    if (video && (await videoAlreadySaved(payload, video.path))) return { ok: true, firstName: data.name.split(/\s+/)[0] }
    const [photo, videoPoster] = await Promise.all([saveSubmissionPhoto(payload, formData.get('photo'), data.title), video ? savePoster(payload, formData.get('poster'), data.title) : undefined])
    await payload.create({
      collection: 'testimonies',
      overrideAccess: true,
      data: {
        title: data.title,
        name: data.name,
        category: data.category as 'healing',
        summary: data.summary,
        body: data.body || undefined,
        photo,
        videoPoster,
        videoFile: video,
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
          subject: `New ${video ? 'video ' : ''}testimony to review: ${data.title}`,
          html: `<p><strong>${esc(data.title)}</strong> — ${esc(categoryLabels[data.category])}</p><p>${esc(data.summary)}</p><p>From ${esc(data.name)} · ${esc(data.email)} · ${esc(data.phone)}</p>`,
        })
        .catch((e: unknown) => console.error('[testimony] notify failed', e))
    }
  } catch (error) {
    console.error('[testimony] could not save', error)
    return { error: 'We couldn’t send your testimony just now. Please try again in a few minutes.' }
  }

  return { ok: true, firstName: data.name.split(/\s+/)[0] }
}
