'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image, { type StaticImageData } from 'next/image'
import { useEffect, useRef, type CSSProperties } from 'react'

import crest from '@/assets/brand/crest-official.webp'
import { coins } from '@/assets/coins'
import rays from '@/assets/coins/rays.webp'
import { isLite, rebuildOnLite } from '@/lib/lite'
import { GlassImage } from '../GlassImage'

type Orbiter = {
  art: StaticImageData
  /** Size, as a share of the ring. */
  size: number
  /** How close in and far out it swings, as a share of the ring's radius. */
  near: number
  far: number
  /** Timings in seconds, all different, so the circle never looks mechanical. */
  swing: number
  sway: number
  dance: number
  /** Most of a coin's turn left and right, in degrees. Small enough that it never looks upside down. */
  flip: number
  /**
   * As the page scrolls: how far it flies outward, as a share of the screen, how far it falls down the page,
   * as a share of the hero, how far it leans as it goes, in degrees, and how much it grows, as if coming closer.
   */
  away: number
  down: number
  tumble: number
  grow: number
}

/** The coins in the main circle, in order round it. The big ones and small ones take turns. */
const circle: Orbiter[] = [
  { art: coins.cross, size: 31, near: 0.96, far: 1.1, swing: 5.2, sway: 7.3, dance: 4.6, flip: 26, away: 0.08, down: 1.3, tumble: -12, grow: 0.2 },
  { art: coins.heart, size: 24, near: 0.86, far: 1.04, swing: 6.4, sway: 5.9, dance: 3.9, flip: -30, away: 1, down: 0.12, tumble: 26, grow: 0.1 },
  { art: coins.flame, size: 29, near: 0.98, far: 1.14, swing: 4.7, sway: 8.1, dance: 5.1, flip: 28, away: 0.2, down: 1.08, tumble: 22, grow: 0.22 },
  { art: coins.bible, size: 25, near: 0.88, far: 1.06, swing: 5.8, sway: 6.6, dance: 4.2, flip: -24, away: 1.05, down: 0, tumble: -24, grow: 0.1 },
  { art: coins.thirty, size: 32, near: 0.94, far: 1.12, swing: 6.9, sway: 5.4, dance: 5.6, flip: 22, away: 0.14, down: 1.42, tumble: 16, grow: 0.28 },
  { art: coins.dove, size: 26, near: 0.9, far: 1.08, swing: 4.4, sway: 7.8, dance: 3.7, flip: -30, away: 0.92, down: 0.2, tumble: -22, grow: 0.1 },
  { art: coins.crown, size: 30, near: 0.97, far: 1.13, swing: 6.1, sway: 6.2, dance: 4.9, flip: 27, away: 0.24, down: 1.16, tumble: -20, grow: 0.2 },
  { art: coins.chain, size: 24, near: 0.86, far: 1.05, swing: 5.0, sway: 8.6, dance: 4.1, flip: -26, away: 1.1, down: -0.1, tumble: 28, grow: 0.1 },
  { art: coins.globe, size: 29, near: 0.95, far: 1.12, swing: 7.2, sway: 5.6, dance: 5.3, flip: 24, away: 0.3, down: 0.96, tumble: 24, grow: 0.16 },
  { art: coins.mountain, size: 24, near: 0.88, far: 1.06, swing: 4.9, sway: 7.1, dance: 3.8, flip: -28, away: 1, down: 0.16, tumble: -20, grow: 0.1 },
  { art: coins.dome, size: 30, near: 0.96, far: 1.11, swing: 5.6, sway: 6.9, dance: 4.7, flip: 25, away: 0.16, down: 1.26, tumble: 14, grow: 0.24 },
]

/** A wide oval going the other way, on screens with room for it. It fills the sides and stays clear of the words. */
const outer: Orbiter[] = [
  { art: coins.globe, size: 21, near: 0.96, far: 1.04, swing: 8.4, sway: 9.6, dance: 6.1, flip: 20, away: 0.7, down: 0.5, tumble: 22, grow: 0.1 },
  { art: coins.cross, size: 18, near: 0.97, far: 1.03, swing: 9.1, sway: 8.2, dance: 5.4, flip: -18, away: 0.85, down: 0.1, tumble: -12, grow: 0.1 },
  { art: coins.dove, size: 22, near: 0.95, far: 1.05, swing: 7.6, sway: 10.2, dance: 6.6, flip: 20, away: 0.4, down: 0.9, tumble: -24, grow: 0.14 },
  { art: coins.thirty, size: 19, near: 0.96, far: 1.04, swing: 8.9, sway: 8.8, dance: 5.8, flip: -22, away: 0.9, down: 0.05, tumble: 18, grow: 0.1 },
  { art: coins.crown, size: 22, near: 0.95, far: 1.05, swing: 7.9, sway: 9.4, dance: 6.3, flip: 18, away: 0.3, down: 1.05, tumble: -20, grow: 0.16 },
  { art: coins.flame, size: 18, near: 0.97, far: 1.03, swing: 9.4, sway: 7.9, dance: 5.2, flip: -20, away: 0.8, down: 0.2, tumble: 24, grow: 0.1 },
  { art: coins.dome, size: 21, near: 0.96, far: 1.04, swing: 8.2, sway: 9.9, dance: 6.4, flip: 19, away: 0.35, down: 0.85, tumble: 16, grow: 0.14 },
  { art: coins.heart, size: 18, near: 0.97, far: 1.03, swing: 8.7, sway: 8.5, dance: 5.6, flip: -20, away: 0.9, down: 0.3, tumble: -18, grow: 0.1 },
]

function Coin({ coin, angle, order, delay }: { coin: Orbiter; angle: number; order: number; delay: number }) {
  // Each wrapper does one job, so the browser's graphics chip can run them all without the page's help.
  return (
    <div
      className="hero-arm"
      style={
        {
          '--a': `${angle}deg`,
          '--near': coin.near,
          '--far': coin.far,
          '--s': coin.size,
          '--flip': `${coin.flip}deg`,
          '--sway-time': `${coin.sway}s`,
          '--sway-from': `${-order * 1.3}s`,
        } as CSSProperties
      }
    >
      <div className="hero-burst" style={{ animationDelay: `${delay}ms` }}>
        {/* Moves along the coin's arm, so this one is always straight out from the crest */}
        <div className="hero-fly" data-fly-out={coin.away}>
          <div className="hero-out" style={{ animationDuration: `${coin.swing}s`, animationDelay: `${-order * 0.9}s` }}>
            <div className="hero-upright">
              <div className="hero-undo-oval">
                {/* By here the coin is upright again, so this one is always straight down the screen */}
                <div className="hero-fly" data-fly-down={coin.down} data-tumble={coin.tumble} data-grow={coin.grow}>
                  <div className="hero-dance" style={{ animationDuration: `${coin.dance}s`, animationDelay: `${-order * 0.7}s` }}>
                    <GlassImage src={coin.art} className="hero-coin-art" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The crest in the exact middle, with commemorative coins dancing round it in a loose circle. */
export function HeroRing() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    const hero = el?.closest('section')
    if (!el || !hero) return
    gsap.registerPlugin(ScrollTrigger)

    // The ring and each coin's counter-turn must stop and start together, or the coins would end up
    // leaning over. So the whole ring rests as one, once the coins that fell have also scrolled away.
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) delete el.dataset.resting
        else el.dataset.resting = '1'
      },
      { rootMargin: '160% 0px' },
    )
    watcher.observe(hero)

    // The scatter is only a few moving parts, so slow phones get it too.
    const stopScroll = rebuildOnLite(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined
      const ctx = gsap.context(() => {
        const words = gsap.utils.toArray<HTMLElement>('[data-hero-words]', hero)
        // Coins on hidden rings don't need moving.
        const shown = (selector: string) => gsap.utils.toArray<HTMLElement>(selector, el).filter((node) => node.getClientRects().length > 0)
        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: hero, start: 'top top', end: () => `+=${hero.offsetHeight * 1.4}`, scrub: 0.4, invalidateOnRefresh: true },
        })
        timeline
          .to('[data-ring-centre]', { scale: 0.74, autoAlpha: 0, duration: 0.42 }, 0.1)
          .to('[data-ring-light]', { autoAlpha: 0, duration: 0.42 }, 0.1)
          .to(words, { y: -70, autoAlpha: 0, duration: 0.3 }, 0)
        // Some coins fly off past the edges of the screen, picking up speed.
        shown('[data-fly-out]').forEach((node) => {
          timeline.to(node, { x: () => Number(node.dataset.flyOut) * Math.max(window.innerWidth, window.innerHeight) * 0.8, ease: 'power1.in', duration: 0.75 }, 0)
        })
        // Others fall down the page behind what comes next. They start quickly and slow to a stop on the
        // page, so they then scroll away with it. That's what stops them looking pinned to the screen.
        shown('[data-fly-down]').forEach((node) => {
          timeline.to(
            node,
            {
              y: () => Number(node.dataset.flyDown) * hero.offsetHeight,
              rotation: Number(node.dataset.tumble),
              scale: 1 + Number(node.dataset.grow),
              ease: 'sine.out',
              duration: 1,
            },
            0,
          )
        })
      }, el)
      return () => ctx.revert()
    })

    // With a mouse, the ring leans gently towards the pointer.
    let stopPointer = () => {}
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !isLite()) {
      const layers = gsap.utils.toArray<HTMLElement>('[data-ring-lean]', el).map((layer) => ({
        reach: Number(layer.dataset.ringLean),
        x: gsap.quickTo(layer, 'x', { duration: 1.2, ease: 'power3' }),
        y: gsap.quickTo(layer, 'y', { duration: 1.2, ease: 'power3' }),
      }))
      const onMove = (event: PointerEvent) => {
        if (isLite()) return
        const box = hero.getBoundingClientRect()
        const across = (event.clientX - box.left) / box.width - 0.5
        const down = (event.clientY - box.top) / box.height - 0.5
        layers.forEach((layer) => {
          layer.x(across * layer.reach)
          layer.y(down * layer.reach)
        })
      }
      hero.addEventListener('pointermove', onMove)
      stopPointer = () => hero.removeEventListener('pointermove', onMove)
    }

    return () => {
      watcher.disconnect()
      stopScroll()
      stopPointer()
    }
  }, [])

  return (
    <div ref={root} data-rests-together className="hero-ring">
      <div className="hero-origin">
        <div aria-hidden data-ring-light className="pointer-events-none">
          <GlassImage src={rays} className="hero-rays" />
          <div className="glow hero-halo [--glow-strength:0.5]" />
        </div>

        <div aria-hidden className="hero-spread pointer-events-none">
          <div data-ring-lean="46" className="hero-lean">
            <div className="hero-oval hidden lg:block">
              <div className="hero-rotor hero-rotor-outer">
                <span className="hero-orbit-line" />
                {outer.map((coin, i) => (
                  <Coin key={i} coin={coin} order={i} angle={(i / outer.length) * 360 + 18} delay={420 + i * 40} />
                ))}
              </div>
            </div>
          </div>
          <div data-ring-lean="26" className="hero-lean">
            <div className="hero-rotor">
              <span className="hero-orbit-line" />
              {circle.map((coin, i) => (
                <Coin key={i} coin={coin} order={i} angle={(i / circle.length) * 360 - 90 + (i % 2 ? 1.5 : -1.5)} delay={80 + i * 55} />
              ))}
            </div>
          </div>
        </div>

        {/* The 30th anniversary crest, in a slowly turning seal */}
        <div data-ring-centre className="hero-centre">
          <div data-ring-lean="-12" className="hero-seal">
            <svg aria-hidden viewBox="0 0 200 200" className="hero-seal-text">
              <defs>
                <path id="hero-seal-line" d="M100 100m-88 0a88 88 0 1 1 176 0a88 88 0 1 1-176 0" />
              </defs>
              <circle cx="100" cy="100" r="98" fill="none" stroke="rgb(240 169 43 / 0.35)" strokeWidth="0.75" strokeDasharray="1 4" />
              <text fill="#ffd27a" fontSize="10.5" fontWeight="500" letterSpacing="0.6">
                <textPath href="#hero-seal-line" textLength="548" lengthAdjust="spacing">
                  THIRTY YEARS OF GOD’S FAITHFULNESS · 1996 – 2026 · SAME MISSION · GREATER IMPACT ·
                </textPath>
              </text>
            </svg>
            <Image src={crest} alt="Dunamis International Gospel Centre 30th Anniversary, 1996 – 2026" preload sizes="240px" className="hero-crest" />
          </div>
        </div>
      </div>
    </div>
  )
}
