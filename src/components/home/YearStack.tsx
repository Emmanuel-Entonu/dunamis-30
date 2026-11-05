'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from '@/components/SiteLink'
import { useEffect, useRef } from 'react'

import { rebuildOnLite } from '@/lib/lite'
import { AnniversaryCard } from '../AnniversaryCard'

const CARDS = 20
const GOLD = 10 // the card that pops up and turns to face the viewer

/**
 * The reference's card stack: dark cards rise into a staircase that climbs to the right
 * (left cards in front), then the gold card pops up face-on. A tall runway with a sticky
 * viewport, so it scrubs the same way on phones and desktop.
 */
export function YearStack({ body, formOpen = true }: { body?: string | null; formOpen?: boolean }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    return rebuildOnLite((lite) => {
      const ctx = gsap.context(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.set('[data-gold]', { yPercent: -30, rotationY: 0 })
          return
        }
        gsap.set('[data-gold]', { rotationY: lite ? 0 : 50 })
        // Hidden cards don't need moving: on a slow phone that's half the work on every frame.
        const cards = gsap.utils
          .toArray<HTMLElement>('[data-card]')
          .filter((card) => card.offsetParent !== null)
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: 'bottom bottom',
              scrub: lite ? true : 1,
            },
          })
          .from(cards, { yPercent: 110, stagger: 0.2, duration: 1 })
          .to(
            '[data-gold]',
            { yPercent: -30, rotationY: 0, duration: 1.4, ease: 'power2.out' },
            '>-0.4',
          )
      }, el)
      return () => ctx.revert()
    })
  }, [])

  return (
    <section ref={root} className="relative h-[220svh]">
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden pt-[100px] lg:pt-[14vh]">
        <div className="container-site">
          <div className="max-w-[520px]">
            <h2 className="h-section">Every year has a testimony</h2>
            <p className="mt-4">
              {body ||
                (formOpen
                  ? 'Healings, babies after years of waiting, jobs, exam results. If God has done something for you through this ministry, we’d love to hear about it.'
                  : 'Healings, babies after years of waiting, jobs, exam results. Read what God has done through this ministry.')}
            </p>
            <div className="relative z-10 mt-6 flex flex-wrap gap-3">
              {formOpen && (
                <Link href="/testimonies#share" className="btn btn-primary">
                  Share your testimony
                </Link>
              )}
              <Link href="/testimonies" className={formOpen ? 'btn btn-outline' : 'btn btn-primary'}>
                Read testimonies
              </Link>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          data-year-stage
          className="relative mx-auto mt-auto mb-[8vh] h-[42svh] w-full max-w-[1600px] overflow-hidden [perspective:2000px] md:mb-0 md:h-[56vh] md:min-h-[440px]"
        >
          {Array.from({ length: CARDS }, (_, i) => {
            const gold = i === GOLD
            const t = i / (CARDS - 1)
            return (
              <div
                key={i}
                data-card
                data-year-card
                className="absolute bottom-0 w-[38%] sm:w-[26%] md:w-[19%]"
                style={{
                  left: `calc((100% - 19%) * ${t * 0.96} + 1%)`,
                  top: `${(1 - t) * 52 + 8}%`,
                  zIndex: CARDS - i,
                }}
              >
                {gold ? (
                  <div data-gold className="h-[78%] w-[120%] [transform-origin:left_center]">
                    <AnniversaryCard className="h-full w-full shadow-[0_40px_80px_-20px_rgba(227,154,23,0.45)]" />
                  </div>
                ) : (
                  <div className="h-[120%] w-full rounded-2xl border-t-2 border-r border-t-white/[0.13] border-r-white/[0.08] bg-[#111] [transform:rotateY(18deg)] [transform-origin:left_center]" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
