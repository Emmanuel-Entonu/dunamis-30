import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'

import { isIssuedVideoPath, MAX_VIDEO_BYTES, readVideoSize, removeVideo } from './videoStorage'

const MAX_PHOTO = 6 * 1024 * 1024
const MAX_POSTER = 1024 * 1024

export type SubmittedVideo = { path: string; sizeBytes: number; durationSec: number; width: number; height: number }

const whole = (value: FormDataEntryValue | null, max: number) => {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n > 0 && n <= max ? n : undefined
}

/**
 * Checks the video a form says it uploaded: this server issued that address, the file is really in
 * storage, and it's within the size limit. Nothing a browser sends is trusted on its own.
 */
export async function readSubmittedVideo(formData: FormData): Promise<{ video?: SubmittedVideo; error?: string }> {
  const path = String(formData.get('videoPath') ?? '')
  if (!path) return {}
  const failed = { error: 'We couldn’t find your uploaded video. Please try sending it again.' }
  if (!isIssuedVideoPath(path, String(formData.get('videoProof') ?? ''))) return failed
  const size = await readVideoSize(path)
  if (!size) return failed
  if (size > MAX_VIDEO_BYTES) {
    await removeVideo(path).catch(() => undefined)
    return { error: 'That video is too large. Please choose a shorter one.' }
  }
  return {
    video: {
      path,
      sizeBytes: size,
      durationSec: whole(formData.get('videoDuration'), 7200) ?? 0,
      width: whole(formData.get('videoWidth'), 8192) ?? 0,
      height: whole(formData.get('videoHeight'), 8192) ?? 0,
    },
  }
}

/** True when a form has a stored video that passed its check, so the spam check already ran for it. */
export const claimsVideo = (formData: FormData) => isIssuedVideoPath(String(formData.get('videoPath') ?? ''), String(formData.get('videoProof') ?? ''))

/**
 * True when a saved submission already has this video. A ticket only works once, so nobody can reuse
 * one to skip the spam check. It also means a retry after a dropped connection can't save a duplicate.
 */
export async function videoAlreadySaved(payload: Payload, path: string) {
  const where = { 'videoFile.path': { equals: path } }
  const [testimonies, stories] = await Promise.all([payload.count({ collection: 'testimonies', where, overrideAccess: true }), payload.count({ collection: 'sons-stories', where, overrideAccess: true })])
  return testimonies.totalDocs + stories.totalDocs > 0
}

export const photoProblem = (photo: FormDataEntryValue | null) => {
  if (!(photo instanceof File) || photo.size === 0) return undefined
  if (!photo.type.startsWith('image/')) return 'Please upload an image file.'
  if (photo.size > MAX_PHOTO) return 'Please upload a photo under 6 MB.'
  return undefined
}

/**
 * Saves a photo from a public form. It stays private until the submission is approved. The name
 * and description never include the person's name, because they may have asked not to be named.
 */
export async function saveSubmissionPhoto(payload: Payload, photo: FormDataEntryValue | null, alt: string, limit = MAX_PHOTO) {
  if (!(photo instanceof File) || photo.size === 0 || photo.size > limit || !photo.type.startsWith('image/')) return undefined
  const media = await payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt, pendingReview: true, fromSubmission: true },
    file: { data: Buffer.from(await photo.arrayBuffer()), mimetype: photo.type, name: `${randomUUID()}.jpg`, size: photo.size },
  })
  return media.id
}

export const savePoster = (payload: Payload, poster: FormDataEntryValue | null, alt: string) => saveSubmissionPhoto(payload, poster, alt, MAX_POSTER)
