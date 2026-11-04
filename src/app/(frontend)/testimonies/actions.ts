'use server'

import { categoryLabels } from '@/lib/categories'
import { getPayloadClient } from '@/lib/content'
import { checkSubmission, esc, isEmail } from '@/lib/spam'

export type TestimonyState = { ok?: boolean; firstName?: string; error?: string; fieldErrors?: Partial<Record<string, string>> }

const MAX_PHOTO = 6 * 1024 * 1024

/** Public "Share your testimony" form. Everything lands as "Pending review" for the comms team. */
export async function submitTestimony(_prev: TestimonyState, formData: FormData): Promise<TestimonyState> {
  const spam = await checkSubmission(formData, 'testimony')
  if (!spam.ok) return spam.silent ? { ok: true } : { error: spam.message }

  const get = (key: string) => String(formData.get(key) ?? '').trim()
  const data = {
    name: get('name'),
    email: get('email').toLowerCase(),
    phone: get('phone'),
    category: get('category'),
    title: get('title'),
    summary: get('summary'),
    body: get('body'),
    videoUrl: get('videoUrl'),
    showName: formData.get('showName') === 'on',
  }

  const fieldErrors: TestimonyState['fieldErrors'] = {}
  if (data.name.length < 2) fieldErrors.name = 'Please enter your full name.'
  if (!isEmail(data.email)) fieldErrors.email = 'Please enter a valid email address.'
  if (data.phone.replace(/\D/g, '').length < 7) fieldErrors.phone = 'Please enter a phone number we can reach you on.'
  if (!categoryLabels[data.category]) fieldErrors.category = 'Please choose a category.'
  if (data.title.length < 4) fieldErrors.title = 'Please give your testimony a short title.'
  if (data.summary.length < 20) fieldErrors.summary = 'Please write a sentence or two about what God did.'
  if (data.summary.length > 320) fieldErrors.summary = 'Please keep the short description under 320 characters.'
  if (data.body.length < 40) fieldErrors.body = 'Please tell us the full testimony.'
  if (data.videoUrl && !/^https?:\/\/\S+$/i.test(data.videoUrl)) fieldErrors.videoUrl = 'Please paste a full link, starting with https://'
  if (formData.get('consent') !== 'on') fieldErrors.consent = 'Please confirm we may publish your testimony.'

  const photo = formData.get('photo')
  const hasPhoto = photo instanceof File && photo.size > 0
  if (hasPhoto && !photo.type.startsWith('image/')) fieldErrors.photo = 'Please upload an image file.'
  if (hasPhoto && photo.size > MAX_PHOTO) fieldErrors.photo = 'Please upload a photo under 6 MB.'
  if (Object.keys(fieldErrors).length) return { fieldErrors }

  try {
    const payload = await getPayloadClient()
    let photoId: number | undefined
    if (hasPhoto) {
      const media = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: `${data.name} — ${data.title}` },
        file: { data: Buffer.from(await photo.arrayBuffer()), mimetype: photo.type, name: `testimony-${Date.now()}.jpg`, size: photo.size },
      })
      photoId = media.id
    }
    await payload.create({
      collection: 'testimonies',
      overrideAccess: true,
      data: {
        title: data.title,
        name: data.name,
        category: data.category as 'healing',
        summary: data.summary,
        body: data.body,
        videoUrl: data.videoUrl || undefined,
        photo: photoId,
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
          subject: `New testimony to review: ${data.title}`,
          html: `<p><strong>${esc(data.title)}</strong> — ${esc(categoryLabels[data.category])}</p><p>${esc(data.summary)}</p><p>From ${esc(data.name)} · ${esc(data.email)} · ${esc(data.phone)}</p><p>Review it in the admin under Stories → Testimonies.</p>`,
        })
        .catch((e: unknown) => console.error('[testimony] notify failed', e))
    }
  } catch (error) {
    console.error('[testimony] could not save', error)
    return { error: 'We couldn’t send your testimony just now. Please try again in a few minutes.' }
  }

  return { ok: true, firstName: data.name.split(/\s+/)[0] }
}
