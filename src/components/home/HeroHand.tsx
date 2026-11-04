'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import crest from '@/assets/brand/crest-official.webp'
import heroHand from '@/assets/brand/hero-hand.webp'
import glassTube from '@/assets/renders/glass-tube.webp'
import { GlassImage } from '../GlassImage'

/*
 * HERO HAND — src/assets/brand/hero-hand.webp: the iridescent glass offering hand
 * (edited to five digits, background removed). To swap the artwork, replace that file
 * (statically imported, so its size is read automatically and the URL is content-hashed)
 * and nudge PALM to where the new palm hollow sits.
 */
const PALM = { left: '52%', bottom: '42%' } // centre-bottom of the floating crest

/** Open glass hand presenting the official crest. */
export function HeroHand() {
  return (
    // Wider than the viewport on phones (the section clips it) so the hand reads big everywhere.
    <div aria-hidden className="relative left-1/2 w-[112vw] max-w-[960px] -translate-x-1/2 [perspective:2000px] sm:w-[92vw] lg:w-[64vw]">
      <div className="animate-hand-in relative origin-[50%_60%]">
        <Image src={heroHand} alt="" preload sizes="(min-width: 1024px) 64vw, 112vw" className="relative h-auto w-full" />
      </div>

      {/* The official 30th-anniversary crest, floating in the palm (shown at its native size so it stays sharp) */}
      <div className="animate-crest-in absolute z-10 w-[27%] max-w-[270px] -translate-x-1/2" style={PALM}>
        <div className="animate-float">
          <div aria-hidden className="glow absolute -inset-[35%] [--glow-strength:0.42]" />
          <Image
            src={crest}
            alt="Dunamis International Gospel Centre 30th Anniversary, 1996 – 2026"
            preload
            sizes="270px"
            className="relative h-auto w-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.6)]"
          />
        </div>
      </div>
    </div>
  )
}

/** Two glass tubes crossing the hero on a −18° layer. */
export function HeroTubes() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      // Only the drift: the layer's -18° tilt comes from its class, and adds to any rotation set here.
      frame = requestAnimationFrame(() => (el.style.transform = `translateY(${Math.min(window.scrollY, 1400) * 0.2}px)`))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])
  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-x-[-20%] top-[34%] -z-10 hidden h-[520px] rotate-[-18deg] sm:top-[38%] sm:block">
      <GlassImage lazy src={glassTube} className="absolute top-1/2 left-[8%] w-[26vw] max-w-[400px] -translate-y-1/2 rotate-90 sm:left-[6%]" />
      <GlassImage lazy src={glassTube} className="absolute top-1/2 right-[8%] w-[26vw] max-w-[400px] -translate-y-1/2 -rotate-90 sm:right-[6%]" />
    </div>
  )
}
