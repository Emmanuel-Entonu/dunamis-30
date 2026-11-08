import type { VideoTicket } from './videoStorage'

/**
 * Everything that happens to a video in the visitor's browser: read it, shrink it, upload it.
 *
 * Phones record about 130 MB a minute, and many people here pay for every megabyte. So the video is
 * re-encoded to 720p H.264 first, which also means it plays on every phone (iPhones record in a
 * format some browsers can't play). If this browser can't re-encode, a small enough original is sent
 * as it is. The two libraries are large, so they load only once someone actually picks a video.
 */

/** The public forms take phone videos up to 5 minutes. The team can add longer ones in the dashboard. */
export const MAX_VIDEO_SECONDS = 5 * 60
export const MAX_DASHBOARD_VIDEO_SECONDS = 30 * 60
const LONG_SIDE = 1280
const MAX_VIDEO_BITRATE = 2_500_000
const MIN_VIDEO_BITRATE = 500_000
const AUDIO_BITRATE = 96_000
/**
 * The size to aim for: just under the ticket's limit, leaving room for the file's own overhead (44 MB on
 * the public forms). The shrunk video is held in memory before it's sent, so it never aims above 700 MB.
 */
const targetBytes = (maxBytes: number) => Math.min(Math.floor(maxBytes * 0.88), 700 * 1024 * 1024)
/** Already-small H.264 clips are left alone. */
const LEAVE_ALONE_BYTES = 15 * 1024 * 1024
const CHUNK_BYTES = 6 * 1024 * 1024 // Supabase requires exactly this size for resumable uploads.

export class VideoProblem extends Error {
  cancelled: boolean
  constructor(message: string, cancelled = false) {
    super(message)
    this.name = 'VideoProblem'
    this.cancelled = cancelled
  }
}

const cancelled = () => new VideoProblem('Cancelled.', true)

export type VideoDetails = { durationSec: number; width: number; height: number; poster: Blob | null }
export type PreparedVideo = { blob: Blob; contentType: string; width: number; height: number; durationSec: number }

const withTimeout = <T,>(run: (done: (value: T) => void) => void, ms: number, fallback: T) =>
  new Promise<T>((resolve) => {
    const timer = window.setTimeout(() => resolve(fallback), ms)
    run((value) => {
      window.clearTimeout(timer)
      resolve(value)
    })
  })

function drawPoster(video: HTMLVideoElement) {
  const scale = Math.min(1, LONG_SIDE / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  // A frame that is nearly all black makes a bad cover, and some phones return black when they haven't decoded yet.
  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let total = 0
  let count = 0
  for (let i = 0; i < sample.length; i += 4 * 97) {
    total += sample[i] + sample[i + 1] + sample[i + 2]
    count++
  }
  return total / Math.max(count, 1) / 3 < 10 ? null : canvas
}

/** Reads the length and shape of a video, and takes a frame from it to use as the cover. */
export async function inspectVideo(file: File): Promise<VideoDetails> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = url
  try {
    const readable = await withTimeout<boolean>((done) => {
      video.onloadedmetadata = () => done(true)
      video.onerror = () => done(false)
    }, 15_000, false)

    if (readable && video.videoWidth && Number.isFinite(video.duration) && video.duration > 0) {
      let poster: Blob | null = null
      for (const at of [Math.min(1.5, video.duration * 0.2), Math.min(4, video.duration * 0.5)]) {
        const ready = await withTimeout<boolean>((done) => {
          video.onseeked = () => done(true)
          video.currentTime = at
        }, 6000, false)
        if (!ready) continue
        const canvas = drawPoster(video)
        if (!canvas) continue
        poster = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
        break
      }
      return { durationSec: video.duration, width: video.videoWidth, height: video.videoHeight, poster }
    }
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }

  // This browser can't show the video (an iPhone recording on an older computer, say), but the
  // re-encoder may still be able to read it.
  const { ALL_FORMATS, BlobSource, Input } = await import('mediabunny')
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  try {
    const track = await input.getPrimaryVideoTrack()
    if (!track) throw new Error('no video track')
    return { durationSec: await input.computeDuration(), width: track.displayWidth, height: track.displayHeight, poster: null }
  } catch {
    throw new VideoProblem('We couldn’t open that video. Please try an MP4 or MOV file.')
  } finally {
    input.dispose()
  }
}

/** Sends a file as it is, if storage will accept it. */
function asOriginal(file: File, details: VideoDetails, maxBytes: number): PreparedVideo | null {
  const type = file.type.toLowerCase()
  const isWebm = type === 'video/webm' || /\.webm$/i.test(file.name)
  const isMp4Like = ['video/mp4', 'video/quicktime', 'video/x-m4v'].includes(type) || /\.(mp4|mov|m4v)$/i.test(file.name)
  if (file.size > maxBytes || (!isWebm && !isMp4Like)) return null
  // MOV and MP4 are close relatives. Labelled as MP4, a MOV plays in far more browsers.
  return { blob: file, contentType: isWebm ? 'video/webm' : 'video/mp4', width: details.width, height: details.height, durationSec: details.durationSec }
}

/**
 * Re-encodes a video to 720p H.264 and AAC, at whatever bitrate keeps it under the limit, and
 * reports progress from 0 to 1. Falls back to the original when that's the only option.
 */
export async function prepareVideo(file: File, details: VideoDetails, maxBytes: number, onProgress: (share: number) => void, signal: AbortSignal): Promise<PreparedVideo> {
  const tooBig = () =>
    new VideoProblem('This browser can’t make your video smaller, and it’s too large to send as it is. Please try a shorter clip, or open this page in Chrome or Safari.')
  const fallback = () => {
    const original = asOriginal(file, details, maxBytes)
    if (!original) throw tooBig()
    return original
  }

  let mediabunny: typeof import('mediabunny')
  try {
    mediabunny = await import('mediabunny')
  } catch {
    return fallback()
  }
  const { ALL_FORMATS, BlobSource, BufferTarget, canEncodeAudio, canEncodeVideo, Conversion, Input, Mp4OutputFormat, Output } = mediabunny

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  try {
    const track = await input.getPrimaryVideoTrack()
    if (!track) return fallback()
    const audio = await input.getPrimaryAudioTrack()
    const durationSec = await input.computeDuration()

    if (file.size <= LEAVE_ALONE_BYTES && track.codec === 'avc' && (!audio || audio.codec === 'aac')) {
      const original = asOriginal(file, details, maxBytes)
      if (original) return original
    }

    const scale = Math.min(1, LONG_SIDE / Math.max(track.displayWidth, track.displayHeight))
    const even = (n: number) => Math.max(2, Math.round(n / 2) * 2)
    const width = even(track.displayWidth * scale)
    const height = even(track.displayHeight * scale)
    const bitrate = Math.round(Math.max(MIN_VIDEO_BITRATE, Math.min(MAX_VIDEO_BITRATE, (targetBytes(maxBytes) * 8) / Math.max(durationSec, 1) - AUDIO_BITRATE)))

    if (!(await canEncodeVideo('avc', { width, height, bitrate }))) return fallback()
    const canEncodeAac = await canEncodeAudio('aac', { bitrate: AUDIO_BITRATE })

    const stats = await track.computePacketStats(120).catch(() => null)
    const frameRate = stats && stats.averagePacketRate > 32 ? 30 : undefined

    const target = new BufferTarget()
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target })
    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      showWarnings: false,
      video: { width, height, fit: 'fill', codec: 'avc', bitrate, frameRate, forceTranscode: true },
      // Without an AAC encoder, keep the original sound if it can be copied across.
      audio: canEncodeAac ? { codec: 'aac', bitrate: AUDIO_BITRATE } : {},
    })
    if (!conversion.isValid) return fallback()
    // A testimony that silently loses its sound is worse than no compression at all.
    if (conversion.discardedTracks.some((d) => d.track.isAudioTrack() || d.track.isVideoTrack())) return fallback()

    conversion.onProgress = (share) => onProgress(Math.min(1, share))
    const stop = () => void conversion.cancel()
    signal.addEventListener('abort', stop, { once: true })
    try {
      await conversion.execute()
    } finally {
      signal.removeEventListener('abort', stop)
    }
    if (signal.aborted) throw cancelled()

    const buffer = target.buffer
    if (!buffer?.byteLength) return fallback()
    if (buffer.byteLength > maxBytes) throw new VideoProblem('Your video is still too large after compressing it. Please choose a shorter one.')
    return { blob: new Blob([buffer], { type: 'video/mp4' }), contentType: 'video/mp4', width, height, durationSec }
  } catch (error) {
    if (error instanceof VideoProblem) throw error
    if (signal.aborted) throw cancelled()
    console.warn('[video] compression failed, trying the original', error)
    return fallback()
  } finally {
    input.dispose()
  }
}

const statusOf = (error: unknown) => (error as { originalResponse?: { getStatus(): number } | null })?.originalResponse?.getStatus() ?? 0

/** Waits for the phone to report signal again, or for a while in case it never says so. */
async function waitForSignal(signal: AbortSignal) {
  await new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timer)
      window.removeEventListener('online', finish)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    // Already online means the server was unreachable, so just leave it a moment.
    const timer = window.setTimeout(finish, navigator.onLine ? 3000 : 120_000)
    window.addEventListener('online', finish)
    signal.addEventListener('abort', finish)
  })
  if (signal.aborted) throw cancelled()
}

/**
 * Uploads in 6 MB pieces, picking up from the last good byte when a connection drops. The library
 * retries weak connections by itself but gives up at once when the phone reports no signal at all,
 * and a piece in flight can hang for minutes when signal goes. So losing signal stops the piece at
 * once, and this waits and carries on. It only gives up after several rounds with no progress.
 * Returns only once the file is stored. `resume` lets a later Try again continue the same upload.
 */
export async function uploadVideo(
  video: PreparedVideo,
  ticket: VideoTicket,
  onProgress: (share: number) => void,
  signal: AbortSignal,
  resume: { url?: string | null },
  onWaiting?: (waiting: boolean) => void,
): Promise<void> {
  const { Upload } = await import('tus-js-client')
  let furthest = 0
  let progressed = false

  const attempt = () =>
    new Promise<void>((resolve, reject) => {
      const stop = () => {
        settle()
        resume.url = upload.url
        void upload.abort()
        reject(cancelled())
      }
      const dropped = () => {
        settle()
        resume.url = upload.url
        void upload.abort()
        reject(new Error('No signal'))
      }
      const settle = () => {
        signal.removeEventListener('abort', stop)
        window.removeEventListener('offline', dropped)
      }
      const upload = new Upload(video.blob, {
        endpoint: ticket.endpoint,
        uploadUrl: resume.url ?? undefined,
        chunkSize: CHUNK_BYTES,
        retryDelays: [0, 1000, 3000, 5000, 10_000, 20_000],
        storeFingerprintForResuming: false,
        headers: { apikey: ticket.apikey, 'x-signature': ticket.token },
        metadata: { bucketName: ticket.bucket, objectName: ticket.path, contentType: video.contentType, cacheControl: '86400' },
        onProgress: (sent, total) => {
          if (sent > furthest) {
            furthest = sent
            progressed = true
          }
          onProgress(total ? sent / total : 0)
        },
        onSuccess: () => {
          settle()
          resolve()
        },
        onError: (error) => {
          settle()
          resume.url = upload.url
          reject(error)
        },
        onAfterResponse: () => {
          resume.url = upload.url
        },
      })
      signal.addEventListener('abort', stop, { once: true })
      window.addEventListener('offline', dropped, { once: true })
      upload.start()
    })

  for (let idle = 0; ; idle = progressed ? 0 : idle + 1) {
    progressed = false
    try {
      await attempt()
      return
    } catch (error) {
      if (error instanceof VideoProblem) throw error
      const status = statusOf(error)
      // A refusal, such as an expired ticket, won't change by waiting. 409 and 423 mean try again shortly.
      const refused = status >= 400 && status < 500 && status !== 409 && status !== 423
      if (refused || (!progressed && idle >= 7)) throw error
      onWaiting?.(true)
      await waitForSignal(signal)
      onWaiting?.(false)
    }
  }
}
