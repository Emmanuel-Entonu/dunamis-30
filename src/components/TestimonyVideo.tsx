'use client'

import { useState } from 'react'

/**
 * Plays an uploaded video. Nothing downloads until someone presses play, so opening a testimony
 * costs no data. The player takes the shape of the video, so phone recordings stay upright.
 */
export function TestimonyVideo({ src, poster, title, width, height, className = '' }: { src: string; poster?: string | null; title: string; width?: number | null; height?: number | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  const shape = width && height ? width / height : 16 / 9
  const upright = shape < 1
  // An upright phone video is never taller than 70% of the screen, so its controls are always in view.
  // The width follows from that, which keeps the video's shape on small phones too.
  const size = upright ? { aspectRatio: shape, width: `min(100%, 420px, calc(70vh * ${shape.toFixed(4)}))` } : { aspectRatio: shape }

  return (
    <div className={`card overflow-hidden bg-black ${upright ? 'mx-auto max-w-[min(100%,420px)]' : ''} ${className}`} style={size}>
      {failed ? (
        <div className="grid h-full place-items-center p-6 text-center text-base">This video can’t play on this device right now. Please try again later or in another browser.</div>
      ) : (
        // Testimonies don't come with captions. Each page carries the written summary alongside.
        <video src={src} poster={poster ?? undefined} controls playsInline preload="none" aria-label={title} onError={() => setFailed(true)} className="h-full w-full bg-black object-contain" />
      )}
    </div>
  )
}
