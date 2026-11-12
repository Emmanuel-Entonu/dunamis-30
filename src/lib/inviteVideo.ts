import { recordReveal } from './cardFrames'
import { drawInvite, INVITE, TIMING, type InviteScene } from './inviteFrames'

const FPS = 30

/**
 * Encodes frames painted on a canvas into an MP4, frame by frame, which is quicker than playing them and never
 * drops one. Null where the browser can't encode H.264, so the caller can record it as it plays instead.
 */
export async function encodeMp4(canvas: HTMLCanvasElement, seconds: number, paint: (t: number) => void, onProgress: (share: number) => void): Promise<{ blob: Blob; ext: 'mp4' } | null> {
  try {
    const { BufferTarget, CanvasSource, canEncodeVideo, Mp4OutputFormat, Output, QUALITY_HIGH } = await import('mediabunny')
    if (!(await canEncodeVideo('avc', { width: canvas.width, height: canvas.height, bitrate: QUALITY_HIGH }))) return null
    const target = new BufferTarget()
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target })
    const source = new CanvasSource(canvas, { codec: 'avc', quality: QUALITY_HIGH })
    output.addVideoTrack(source, { frameRate: FPS })
    await output.start()
    const frames = Math.round(seconds * FPS)
    for (let i = 0; i < frames; i++) {
      paint(i / FPS)
      await source.add(i / FPS, 1 / FPS)
      if (i % 5 === 0) onProgress(i / frames)
    }
    source.close()
    await output.finalize()
    onProgress(1)
    return target.buffer ? { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4' } : null
  } catch {
    return null
  }
}

/** The flat invitation as a video, for browsers without 3D. */
export async function makeInviteVideo(scene: InviteScene, onProgress: (share: number) => void): Promise<{ blob: Blob; ext: 'mp4' | 'webm' }> {
  const canvas = document.createElement('canvas')
  canvas.width = INVITE.w
  canvas.height = INVITE.h
  const ctx = canvas.getContext('2d')!
  const encoded = await encodeMp4(canvas, TIMING.duration + TIMING.hold, (t) => drawInvite(ctx, scene, t), onProgress)
  if (encoded) return encoded
  return recordReveal(canvas, (t) => drawInvite(ctx, scene, t * TIMING.duration), { duration: TIMING.duration * 1000, hold: TIMING.hold * 1000 })
}
