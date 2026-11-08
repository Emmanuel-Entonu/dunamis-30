'use client'

import type { VideoTicket } from '@/lib/videoStorage'
import { api } from './store'

export type NewVideo = {
  videoFile: { path: string; sizeBytes: number; durationSec: number; width: number; height: number }
  videoPoster: number | null
  playHere: string
}

/** Reads, shrinks and uploads a video. The heavy libraries load only now, when someone actually picks one. */
export async function sendVideo(file: File, collection: string, onProgress: (words: string, share?: number) => void): Promise<NewVideo> {
  const { inspectVideo, MAX_DASHBOARD_VIDEO_SECONDS, prepareVideo, uploadVideo } = await import('@/lib/videoPipeline')
  const controller = new AbortController()
  onProgress('Reading the video…')
  const details = await inspectVideo(file)
  if (details.durationSec > MAX_DASHBOARD_VIDEO_SECONDS) throw new Error(`That video is too long. Please use one under ${MAX_DASHBOARD_VIDEO_SECONDS / 60} minutes.`)

  const ticket = await api<VideoTicket>(`/api/${collection}/video-ticket`, { method: 'POST' })
  const prepared = await prepareVideo(file, details, ticket.maxBytes, (share) => onProgress('Getting it ready…', share), controller.signal)
  try {
    await uploadVideo(prepared, ticket, (share) => onProgress('Uploading…', share), controller.signal, {})
  } catch (error) {
    // Storage says why in a status code. Turn the ones people can act on into plain words.
    const status = (error as { originalResponse?: { getStatus(): number } | null })?.originalResponse?.getStatus() ?? 0
    if (status === 413) throw new Error('That video is bigger than storage allows. Please ask the web team to raise the upload limit in Supabase.')
    throw new Error('The upload didn’t finish. Please check your connection and try again.')
  }

  let videoPoster: number | null = null
  if (details.poster) {
    const form = new FormData()
    form.set('file', new File([details.poster], `${ticket.path.split('/').pop()}.jpg`, { type: 'image/jpeg' }))
    form.set('_payload', JSON.stringify({ alt: 'Cover of a video testimony', pendingReview: true, fromSubmission: true }))
    const saved = await api<{ doc: { id: number } }>('/api/media', { method: 'POST', body: form }).catch(() => null)
    videoPoster = saved?.doc.id ?? null
  }

  return {
    videoFile: { path: ticket.path, sizeBytes: prepared.blob.size, durationSec: Math.round(prepared.durationSec), width: prepared.width, height: prepared.height },
    videoPoster,
    playHere: URL.createObjectURL(prepared.blob),
  }
}

/** Shrinks and stores a photo. Like every submission's photo, it stays private until the entry is approved. */
export async function sendPhoto(file: File, alt: string) {
  const { shrinkPhoto } = await import('@/components/forms/Field')
  const blob = await shrinkPhoto(file)
  const form = new FormData()
  form.set('file', new File([blob], `${crypto.randomUUID()}.jpg`, { type: 'image/jpeg' }))
  form.set('_payload', JSON.stringify({ alt, pendingReview: true, fromSubmission: true }))
  const { doc } = await api<{ doc: { id: number; url?: string } }>('/api/media', { method: 'POST', body: form })
  return { id: doc.id, preview: URL.createObjectURL(blob) }
}

export const removePhoto = (id: number) => api(`/api/media/${id}`, { method: 'DELETE' }).catch(() => undefined)
