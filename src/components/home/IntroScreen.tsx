'use client'

import { gsap } from 'gsap'
import Image from 'next/image'
import { useLayoutEffect, useRef } from 'react'

import crest from '@/assets/brand/crest-official.png'
import { FallingLines } from '@/components/FallingLines'
import { INTRO_REVEAL_EVENT, INTRO_SEEN_KEY } from '@/lib/intro'

// Runs as the page is parsed, so someone who has already seen the intro never sees a flash of it.
const hideIfSeen = `(function(){var e=document.getElementById('intro');try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches)e.style.display='none'}catch(_){}})()`

// If the page's script is this slow to load, go straight to the page instead.
const TOO_LATE_MS = 6000

/**
 * Shown once a session, before the home page: the crest appears, the years count from 1996 to 2026,
 * then the screen lifts away and the hero starts. Tapping skips to the lift.
 */
export function IntroScreen() {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    const remember = () => {
      try {
        sessionStorage.setItem(INTRO_SEEN_KEY, '1')
      } catch {
        // Private browsing: it simply plays again next time.
      }
    }
    let seen = el.style.display === 'none'
    try {
      seen = seen || Boolean(sessionStorage.getItem(INTRO_SEEN_KEY)) || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      // Keep going with what we know.
    }
    if (seen || performance.now() > TOO_LATE_MS) {
      el.style.display = 'none'
      remember()
      return
    }

    html.style.overflow = 'hidden'
    const release = () => {
      html.style.overflow = ''
      el.style.display = 'none'
      remember()
    }
    const LIFT = 3

    const ctx = gsap.context(() => {
      const label = el.querySelector<HTMLElement>('[data-intro-years]')!
      const years = { value: 1996 }
      const tl = gsap.timeline({ onComplete: release })
      tl.fromTo('[data-intro-glow]', { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0.1)
        .fromTo('[data-intro-crest]', { autoAlpha: 0, scale: 0.74 }, { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'expo.out' }, 0.1)
        .fromTo('[data-intro-years]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.5)
        .to(years, { value: 2026, duration: 1.6, ease: 'power2.inOut', onUpdate: () => (label.textContent = String(Math.round(years.value))) }, 0.6)
        .fromTo('[data-intro-line]', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 1.8)
        .add(() => window.dispatchEvent(new Event(INTRO_REVEAL_EVENT)), LIFT)
        .to('[data-intro-content]', { y: -60, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, LIFT)
        .to(el, { yPercent: -100, duration: 0.95, ease: 'power4.inOut' }, LIFT)
      el.addEventListener('pointerdown', () => tl.time() < LIFT && tl.seek(LIFT), { once: true })
    }, el)

    return () => {
      ctx.revert()
      html.style.overflow = ''
    }
  }, [])

  return (
    <>
      <div ref={root} id="intro" aria-hidden suppressHydrationWarning className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-canvas">
        <div className="bg-ticks absolute inset-0" />
        <FallingLines />
        <div data-intro-glow className="invisible absolute top-1/2 left-1/2 -mt-[35vmin] -ml-[35vmin] size-[70vmin] rounded-full bg-gold/20 blur-[90px]" />
        <div data-intro-content className="relative flex flex-col items-center px-6 text-center">
          <Image data-intro-crest src={crest} alt="" preload sizes="220px" className="invisible h-auto w-[170px] drop-shadow-[0_24px_30px_rgba(0,0,0,0.6)] sm:w-[220px]" />
          <p data-intro-years className="invisible mt-6 text-[clamp(3rem,2.4rem+3vw,5rem)] leading-none font-medium tracking-[-0.03em] text-fg tabular-nums">
            1996
          </p>
          <p data-intro-line className="invisible mt-3 text-lg text-soft sm:text-xl">
            30 years of God’s faithfulness
          </p>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: hideIfSeen }} />
      <noscript>
        <style>{'#intro{display:none}'}</style>
      </noscript>
    </>
  )
}
