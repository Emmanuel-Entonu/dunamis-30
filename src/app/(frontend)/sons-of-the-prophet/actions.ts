'use server'

import type { SubmissionState } from '@/components/forms/useSubmission'
import { getPayloadClient } from '@/lib/content'
import { checkSubmission, esc, isEmail } from '@/lib/spam'
import { claimsVideo, photoProblem, readSubmittedVideo, savePoster, saveSubmissionPhoto, videoAlreadySaved } from '@/lib/submissions'
import { issueVideoTicket, videoStorageReady, type VideoTicket } from '@/lib/videoStorage'

const read = (formData: FormData) => {
  const get = (key: string) => String(formData.get(key) ?? '').trim()
  return {
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
    showName: formData.get('showName') === 'on',
  }
}

/** A video can stand in for the written story. */
function validate(data: ReturnType<typeof read>, formData: FormData, hasVideo: boolean) {
  const fieldErrors: NonNullable<SubmissionState['fieldErrors']> = {}
  if (data.name.length < 2) fieldErrors.name = 'Please enter your full name.'
  if (data.location.length < 2) fieldErrors.location = 'Please tell us where you are based.'
  if (data.headline.length < 4) fieldErrors.headline = 'Please give your story a title.'
  if (!isEmail(data.email)) fieldErrors.email = 'Please enter a valid email address.'
  if (data.phone.replace(/\D/g, '').length < 7) fieldErrors.phone = 'Please enter a phone number we can reach you on.'
  const written = [data.before, data.encounter, data.transformation, data.today, data.meaning].join('').length
  if (written < 60 && !hasVideo) fieldErrors.before = 'Please write your story below, or add a video of it.'
  if (formData.get('consent') !== 'on') fieldErrors.consent = 'Please confirm we may publish your story.'
  for (const key of ['beforePhoto', 'afterPhoto']) {
    const problem = photoProblem(formData.get(key))
    if (problem) fieldErrors[key] = problem
  }
  return fieldErrors
}

/** The first step when a video is attached: check everything before asking someone to spend data on an upload. */
export async function prepareStoryVideo(formData: FormData): Promise<SubmissionState & { ticket?: VideoTicket }> {
  const spam = await checkSubmission(formData, 'sons-story')
  if (!spam.ok) return spam.silent ? { ok: true } : { error: spam.message }

  const fieldErrors = validate(read(formData), formData, true)
  if (Object.keys(fieldErrors).length) return { fieldErrors }
  if (formData.get('needsTicket') !== '1') return {}

  if (!videoStorageReady()) return { error: 'Video uploads aren’t available just now. You can write your story instead, or try again later.' }
  try {
    return { ticket: await issueVideoTicket() }
  } catch (error) {
    console.error('[sons] could not start a video upload', error)
    return { error: 'We couldn’t start your video upload just now. Please try again in a few minutes.' }
  }
}

/** Public "Share your story" form. Everything lands as "Pending review" for the comms team. */
export async function submitSonsStory(formData: FormData): Promise<SubmissionState> {
  if (!claimsVideo(formData)) {
    const spam = await checkSubmission(formData, 'sons-story')
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
    const title = data.headline
    const [beforePhoto, afterPhoto, videoPoster] = await Promise.all([
      saveSubmissionPhoto(payload, formData.get('beforePhoto'), `${title}, before`),
      saveSubmissionPhoto(payload, formData.get('afterPhoto'), `${title}, today`),
      video ? savePoster(payload, formData.get('poster'), title) : undefined,
    ])

    await payload.create({
      collection: 'sons-stories',
      overrideAccess: true,
      data: {
        name: data.name,
        location: data.location,
        headline: data.headline,
        currentRole: data.currentRole || undefined,
        beforePhoto,
        afterPhoto,
        videoPoster,
        videoFile: video,
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
          subject: `New Sons of the Prophet ${video ? 'video ' : ''}story to review: ${data.name}`,
          html: `<p><strong>${esc(data.name)}</strong> — ${esc(data.location)}</p><p>${esc(data.headline || data.before.slice(0, 200))}</p><p>${esc(data.email)} · ${esc(data.phone)}</p>`,
        })
        .catch((e: unknown) => console.error('[sons] notify failed', e))
    }
  } catch (error) {
    console.error('[sons] could not save', error)
    return { error: 'We couldn’t send your story just now. Please try again in a few minutes.' }
  }

  return { ok: true, firstName: data.name.split(/\s+/)[0] }
}
