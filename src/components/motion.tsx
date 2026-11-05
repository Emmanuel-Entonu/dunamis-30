'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Children, useEffect, useRef, type ReactNode } from 'react'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Words light up one by one as the block scrolls through the viewport. */
export function ScrubText({ text, as: Tag = 'p', className = '' }: { text: string; as?: 'p' | 'h2'; className?: string }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || reducedMotion()) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-word]',
        { opacity: 0.16 },
        { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: 0.4 } },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <Tag ref={root as never} aria-label={text} className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} aria-hidden>
          <span data-word>{word}</span>{' '}
        </span>
      ))}
    </Tag>
  )
}

/** A picture that opens from an inset, rounded frame to its full width as it scrolls in. `overlay` sits on top and stays put. */
export function GrowFrame({ children, overlay, className = '' }: { children: ReactNode; overlay?: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || reducedMotion()) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-frame]',
        { scale: 0.82, borderRadius: 40 },
        { scale: 1, borderRadius: 24, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 25%', scrub: 0.4 } },
      )
      gsap.fromTo('[data-frame-image]', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'bottom 30%', scrub: 0.4 } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className={className}>
      <div data-frame className="relative h-full w-full overflow-hidden rounded-3xl border border-hair will-change-transform">
        <div data-frame-image className="absolute inset-0 will-change-transform">
          {children}
        </div>
        {overlay}
      </div>
    </div>
  )
}

/**
 * Cards stick and pile up as you scroll: each new card slides over the last, which sinks back
 * slightly. Sticky positioning keeps it 1:1 with the scroll on phones as well as desktop.
 */
export function StackedCards({ children, className = '' }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || reducedMotion()) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-stack]', el)
      cards.forEach((card, i) => {
        const next = cards[i + 1]
        if (!next) return
        const scrollTrigger = { trigger: next, start: 'top bottom', end: 'top 22%', scrub: true }
        gsap.to(card.firstElementChild, { scale: 0.94, ease: 'none', scrollTrigger })
        gsap.to(card.querySelector('[data-dim]'), { opacity: 0.62, ease: 'none', scrollTrigger })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className={`grid gap-6 ${className}`}>
      {Children.map(children, (child, i) => (
        <div data-stack className="sticky" style={{ top: `${88 + Math.min(i, 4) * 6}px` }}>
          <div className="relative origin-top will-change-transform">
            {child}
            <div data-dim aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl bg-black opacity-0 md:rounded-3xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Sideways scene: the section holds still (CSS sticky) while vertical scrolling slides the
 * panels across, so phones get the same motion as desktop.
 */
export function SidewaysScroll({ header, children, className = '' }: { header?: ReactNode; children: ReactNode; className?: string }) {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    const row = track.current
    if (!el || !row || reducedMotion()) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.to(row, {
        x: () => Math.min(0, window.innerWidth - row.scrollWidth),
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.3, invalidateOnRefresh: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  const count = Children.count(children)
  return (
    <section ref={root} className={`relative motion-reduce:!h-auto ${className}`} style={{ height: `${Math.max(180, count * 62)}svh` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center gap-6 overflow-hidden py-[88px] motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-x-auto sm:gap-10">
        {header && <div className="container-site shrink-0">{header}</div>}
        <div ref={track} className="flex min-h-0 w-max flex-1 gap-4 pr-5 pl-[max(20px,calc((100vw-1200px)/2))] will-change-transform sm:gap-6 lg:max-h-[560px]">
          {children}
        </div>
      </div>
    </section>
  )
}

/** A figure that counts up as it scrolls into place (and back down if you scroll back). */
export function CountUp({ value, suffix = '', className = '' }: { value: number; suffix?: string; className?: string }) {
  const root = useRef<HTMLSpanElement>(null)
  const format = (n: number) => Math.round(n).toLocaleString('en-US')

  useEffect(() => {
    const el = root.current
    if (!el || reducedMotion()) return
    gsap.registerPlugin(ScrollTrigger)
    const state = { n: 0 }
    const tween = gsap.to(state, {
      n: value,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 45%', scrub: 0.4 },
      onUpdate: () => {
        el.textContent = `${format(state.n)}${suffix}`
      },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [value, suffix])

  // Server markup carries the true figure, so it reads correctly without JavaScript.
  return (
    <span ref={root} className={`tabular-nums ${className}`}>
      {format(value)}
      {suffix}
    </span>
  )
}

/** The glass world rising over the horizon as you scroll, with pins dropping on to it. */
export function WorldRise({ children, className = '' }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || reducedMotion()) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const scrollTrigger = { trigger: el, start: 'top 95%', end: 'top 25%', scrub: 0.4 }
      gsap.fromTo('[data-world]', { yPercent: 34, scale: 0.86 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger })
      gsap.fromTo('[data-pin]', { y: -46, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 60%', end: 'top 20%', scrub: 0.4 } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  )
}
