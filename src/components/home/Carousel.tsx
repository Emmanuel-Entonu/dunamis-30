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
  const [active, setActive] = useState(0)
  const count = Children.count(children)

  const step = () => {
    const first = track.current?.firstElementChild as HTMLElement | null
    return first ? first.offsetWidth + 24 : 1
  }

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    const end = el.scrollLeft + el.clientWidth > el.scrollWidth - 8
    setEdge({ start: el.scrollLeft < 8, end })
    const first = el.firstElementChild as HTMLElement | null
    const at = first ? Math.round(el.scrollLeft / (first.offsetWidth + 24)) : 0
    setActive(end ? count - 1 : Math.min(count - 1, Math.max(0, at)))
  }, [count])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * step(), behavior: 'smooth' })
  const goTo = (i: number) => track.current?.scrollTo({ left: i * step(), behavior: 'smooth' })

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
      {/* Shows there's more to see: a swipe hint on phones, and a dot for each slide that can be tapped. */}
      <div className="container-site mt-4 flex flex-col items-center gap-3">
        <p className={`flex items-center gap-1.5 text-sm text-soft transition-opacity sm:hidden ${edge.start ? 'opacity-100' : 'opacity-0'}`} aria-hidden>
          Swipe to see more <ChevronRight width={16} height={16} />
        </p>
        <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label={`${label}: choose a slide`}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1} of ${count}`}
              onClick={() => goTo(i)}
              className="grid size-5 place-items-center"
            >
              <span className={`block rounded-full transition-all ${i === active ? 'size-2.5 bg-gold' : 'size-1.5 bg-white/30'}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
