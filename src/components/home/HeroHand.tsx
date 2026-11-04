'use client'

import { gsap } from 'gsap'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

import crest from '@/assets/brand/crest-official.png'
import heroHand from '@/assets/brand/hero-hand.png'
import { renders } from '@/assets/renders'
import { afterIntro } from '@/lib/intro'

/*
 * HERO HAND — src/assets/brand/hero-hand.png: the iridescent glass offering hand
 * (edited to five digits, background removed). To swap the artwork, replace that file
 * (statically imported, so its size is read automatically and the URL is content-hashed)
 * and nudge PALM to where the new palm hollow sits.
 */
const PALM = { left: '52%', bottom: '42%' } // centre-bottom of the floating crest

/** Open glass hand presenting the official crest. */
export function HeroHand() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let ctx: gsap.Context | undefined
    const cancel = afterIntro(() => {
      ctx = gsap.context(() => {
        gsap
          .timeline({ delay: 0.2 })
          .from('[data-grow]', { scale: 0, duration: 1, ease: 'expo.out', transformOrigin: '50% 60%' })
          .from('[data-thirty]', { scale: 0.3, rotationY: 180, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, 0.35)
      }, el)
    })
    return () => {
      cancel()
      ctx?.revert()
    }
  }, [])

  return (
    // Wider than the viewport on phones (the section clips it) so the hand reads big everywhere.
    <div ref={root} aria-hidden className="relative left-1/2 w-[112vw] max-w-[960px] -translate-x-1/2 [perspective:2000px] sm:w-[92vw] lg:w-[64vw]">
      <div data-grow className="relative">
        <Image src={heroHand} alt="" preload sizes="(min-width: 1024px) 64vw, 112vw" className="relative h-auto w-full" />
      </div>

      {/* The official 30th-anniversary crest, floating in the palm (shown at its native size so it stays sharp) */}
      <div data-thirty className="absolute z-10 w-[27%] max-w-[270px] -translate-x-1/2" style={PALM}>
        <div className="animate-float">
          <div aria-hidden className="absolute inset-[10%] rounded-full bg-gold/45 blur-[60px]" />
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
      <Image src={renders.glassTube} alt="" sizes="35vw" className="absolute top-1/2 left-[8%] w-[26vw] max-w-[400px] -translate-y-1/2 rotate-90 sm:left-[6%]" />
      <Image src={renders.glassTube} alt="" sizes="35vw" className="absolute top-1/2 right-[8%] w-[26vw] max-w-[400px] -translate-y-1/2 -rotate-90 sm:right-[6%]" />
    </div>
  )
}
