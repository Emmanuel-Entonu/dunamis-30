'use client'

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { ChevronLeft, ChevronRight } from '../icons'

/**
 * Native scroll-snap carousel (swipe on touch, arrows on desktop).
 * The track bleeds to the right edge of the viewport like a film strip.
 */
export function Carousel({ children, label, header }: { children: ReactNode; label: string; header: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const go = (dir: 1 | -1) => {
    const el = track.current
    const first = el?.firstElementChild as HTMLElement | null
    if (!el || !first) return
    el.scrollBy({ left: dir * (first.offsetWidth + 24), behavior: 'smooth' })
  }

  const arrow =
    'grid size-12 place-items-center rounded-full border border-line bg-surface text-gold transition-colors hover:border-gold disabled:opacity-35 disabled:hover:border-line'

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      <div className="container-site flex items-end justify-between gap-6">
        <div className="min-w-0 flex-1">{header}</div>
        <div className="hidden shrink-0 gap-3 sm:flex">
          <button type="button" className={arrow} onClick={() => go(-1)} disabled={edge.start} aria-label="Previous">
            <ChevronLeft />
          </button>
          <button type="button" className={arrow} onClick={() => go(1)} disabled={edge.end} aria-label="Next">
            <ChevronRight />
          </button>
        </div>
      </div>
      <div
        ref={track}
        onScroll={update}
        tabIndex={0}
        className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: 'max(1rem, calc((100vw - 75rem) / 2 + 1.5rem))', scrollPaddingInline: 'max(1rem, calc((100vw - 75rem) / 2 + 1.5rem))' }}
      >
        {Children.map(children, (child) => (
          <div className="w-[86vw] max-w-[580px] shrink-0 snap-start" role="group" aria-roledescription="slide">
            {child}
          </div>
        ))}
      </div>
    </section>
  )
}
