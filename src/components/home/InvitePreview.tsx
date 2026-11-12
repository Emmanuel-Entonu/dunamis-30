'use client'

import { useEffect, useRef, useState } from 'react'

import { isLite } from '@/lib/lite'

/** Bump when the film is made again (scripts/render-invite-film.mjs), so nobody keeps the old one. */
const VERSION = 1
const FILM = '/films/invitation'

/**
 * The invitation on the home page, playing by itself: a short film of the real 3D envelope opening and
 * unfolding, made by scripts/render-invite-film.mjs. A film costs a phone almost nothing to play, where
 * drawing the 3D live would cost a slow one dearly. It loads only when the section is close and plays only
 * while it's on screen. A phone saving data, and anyone who asks for less motion, see the still.
 */
export function InvitePreview({ className = '' }: { className?: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const [load, setLoad] = useState(false)

  useEffect(() => {
    const el = video.current
    if (!el || isLite() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        near.disconnect()
        setLoad(true)
      },
      { rootMargin: '600px 0px' },
    )
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => undefined)
      else el.pause()
    })
    near.observe(el)
    seen.observe(el)
    return () => {
      near.disconnect()
      seen.disconnect()
    }
  }, [])

  // Once its sources are in, the film loads and, if it's on screen, plays.
  useEffect(() => {
    const el = video.current
    if (!load || !el) return
    el.load()
    const box = el.getBoundingClientRect()
    if (box.top < window.innerHeight && box.bottom > 0) el.play().catch(() => undefined)
  }, [load])

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#0b0906] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.06] ${className}`}
      style={{ aspectRatio: '9 / 16' }}
    >
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="none"
        poster={`${FILM}-poster.webp?v=${VERSION}`}
        aria-label="A black envelope with the Dunamis button opens, and an invitation to the Dunamis 30th Anniversary Celebration comes out and unfolds"
        className="absolute inset-0 h-full w-full object-cover"
      >
        {load && (
          <>
            <source src={`${FILM}.webm?v=${VERSION}`} type='video/webm; codecs="vp9"' />
            <source src={`${FILM}.mp4?v=${VERSION}`} type="video/mp4" />
          </>
        )}
      </video>
    </div>
  )
}
