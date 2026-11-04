'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image, { type StaticImageData } from 'next/image'
import { useEffect, useRef } from 'react'

import crownGlass from '@/assets/glass/crown.webp'
import nations from '@/assets/gallery/nations-crowd.webp'
import destinies from '@/assets/photos/destinies-raised.webp'
import medical from '@/assets/photos/medical-outreach.webp'
import welfare from '@/assets/photos/welfare.webp'
import glassTubeRender from '@/assets/renders/glass-tube.webp'
import glassFlameRender from '@/assets/renders/glass-flame.webp'
import { rebuildOnLite } from '@/lib/lite'
import { AnniversaryCard } from '../AnniversaryCard'
import { GlassImage } from '../GlassImage'
import { CardCase } from './CardCase'

type Story = { image: StaticImageData; alt: string; title: string; text: string; place: string }

/**
 * Official photographs from dunamisgospel.org; swap via the CMS once the comms team supplies originals.
 * `place` puts each photo at the end of its line: percentages of the stage, phone then desktop.
 */
const stories: Story[] = [
  {
    image: destinies,
    alt: 'Dr. Paul Enenche holding a baby during a service',
    title: 'Lives changed',
    text: 'Thirty years of people being healed and given a fresh start.',
    place: 'left-[3.6%] top-[56.25%] lg:left-[5.65%] lg:top-[29.5%]',
  },
  {
    image: nations,
    alt: 'Worshippers holding a flag during a service',
    title: 'The nations come',
    text: 'People from 109 countries visited the Glory Dome in 2025.',
    place: 'left-[51.3%] top-[56.25%] lg:left-[72.6%] lg:top-[29.5%]',
  },
  {
    image: welfare,
    alt: 'Dr. Paul and Dr. Becky Paul-Enenche sharing food items',
    title: 'Reaching out',
    text: 'Food for families, homes for orphans, scholarships for students.',
    place: 'left-[3.6%] top-[78.4%] lg:left-[13.7%] lg:top-[66.7%]',
  },
  {
    image: medical,
    alt: 'A free medical outreach by Dunamis',
    title: 'Free medical care',
    text: 'Our medical outreaches take care to communities that need it.',
    place: 'left-[51.3%] top-[78.4%] lg:left-[64.5%] lg:top-[66.7%]',
  },
]

/**
 * The arc under the card and the line from each of its points to a photo. Paths run in the same
 * order as `stories`, in the coordinates of the stage (390×640 on phones, 1240×780 on desktop).
 */
const phone = {
  arc: 'M69.5 222A126 126 0 0 0 320.5 222',
  lines: ['M137 322V360', 'M253 322V360', 'M69.5 222H6V563H14', 'M320.5 222H384V563H376'],
  points: [
    [137, 322],
    [253, 322],
    [69.5, 222],
    [320.5, 222],
  ],
}
const desktop = {
  arc: 'M406 380A215 215 0 0 0 834 380',
  lines: ['M406 380H340', 'M834 380H900', 'M520 548H440', 'M720 548H800'],
  points: [
    [406, 380],
    [834, 380],
    [520, 548],
    [720, 548],
  ],
}

/** Glass drifting past on both sides while the card travels: percentages of the section height. */
const passing = [
  {
    art: glassTubeRender,
    place: 'top-[3%] -left-[16%] w-[38vw] max-w-[420px] lg:-left-[4%] lg:w-[26vw]',
    from: -14,
    to: 22,
  },
  {
    art: glassFlameRender,
    place: 'top-[14%] -right-[7%] w-[26vw] max-w-[230px] lg:right-[9%] lg:w-[14vw]',
    from: 16,
    to: -18,
  },
  {
    art: crownGlass,
    place: 'top-[30%] -left-[9%] w-[30vw] max-w-[260px] lg:left-[8%] lg:w-[17vw]',
    from: -12,
    to: 14,
  },
  {
    art: glassTubeRender,
    place: 'top-[34%] -right-[16%] w-[38vw] max-w-[420px] lg:-right-[4%] lg:w-[26vw]',
    from: 90,
    to: 130,
  },
]

function Connectors({ shape, viewBox }: { shape: typeof phone; viewBox: string }) {
  return (
    <svg
      aria-hidden
      viewBox={viewBox}
      fill="none"
      stroke="rgb(255 255 255 / 0.6)"
      strokeWidth="1.25"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* Length 1000, not 1: GSAP rounds this value to whole numbers, which would make the lines pop in */}
      <path data-arc pathLength={1000} strokeDasharray="1000" d={shape.arc} />
      {shape.lines.map((d, i) => (
        <path key={d} data-line={i} pathLength={1000} strokeDasharray="1000" d={d} />
      ))}
      {shape.points.map(([cx, cy], i) => (
        <circle key={cx} data-point={i} cx={cx} cy={cy} r="4.5" fill="#fff" stroke="none" />
      ))}
    </svg>
  )
}

/**
 * Right after the hero, as in the reference: nothing on the page ever freezes. The case pulls away
 * upwards while the card travels down the screen to near the bottom, with the page and the glass
 * moving behind it. The stage is ordinary page content rising from below, so it reaches the card
 * just as the card lands; from there they scroll on together, and the arc, lines and photos come
 * up into place as the scroll continues.
 */
export function CardScene() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    gsap.registerPlugin(ScrollTrigger)
    return rebuildOnLite((lite) => {
      const ctx = gsap.context(() => {
        const column = el.querySelector<HTMLElement>('[data-column]')!
        const mover = el.querySelector<HTMLElement>('[data-mover]')!
        const spacer = el.querySelector<HTMLElement>('[data-spacer]')!
        const stage = el.querySelector<HTMLElement>('[data-stage]')!
        // The scroll spent travelling, and how far down the screen the card goes in that time.
        const travel = () => column.offsetHeight - mover.offsetHeight
        const drop = () => spacer.offsetHeight - travel()

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.set(mover, { y: drop() })
          return
        }

        const journey = {
          trigger: column,
          start: () => `top ${parseFloat(getComputedStyle(mover).top)}px`,
          end: () => `+=${travel()}`,
          scrub: true,
          invalidateOnRefresh: true,
        }
        gsap.to(mover, { y: drop, ease: 'sine.inOut', scrollTrigger: journey })
        // It grows, straightens up and turns to face you on the way down.
        gsap.fromTo(
          '[data-card]',
          lite
            ? { rotation: -6, scale: 0.86 }
            : { rotation: -6, rotationY: -18, scale: 0.86, transformPerspective: 1400 },
          {
            rotation: 0,
            ...(lite ? {} : { rotationY: 0 }),
            scale: 1,
            ease: 'none',
            scrollTrigger: journey,
          },
        )

        if (!lite) {
          gsap.utils.toArray<HTMLElement>('[data-passing]').forEach((object) => {
            gsap.fromTo(
              object,
              { rotation: Number(object.dataset.from) },
              {
                rotation: Number(object.dataset.to),
                yPercent: -45,
                ease: 'none',
                scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.3 },
              },
            )
          })
        }

        // Only animate the set of lines on screen: the other one is display: none.
        gsap
          .matchMedia()
          .add({ phone: '(max-width: 1023px)', desktop: '(min-width: 1024px)' }, (context) => {
            const isPhone = context.conditions?.phone
            const scope = isPhone ? '[data-connectors-phone]' : '[data-connectors-desktop]'
            // Redrawing lines on every frame is costly, so on a slow phone they're simply there and the photos rise in.
            if (!lite) {
              // The arc draws as its first point comes up over the bottom of the screen.
              const firstPoint = () => stage.offsetHeight * (isPhone ? 222 / 640 : 380 / 780)
              gsap.fromTo(
                `${scope} [data-arc]`,
                { strokeDashoffset: 1000 },
                {
                  strokeDashoffset: 0,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: stage,
                    start: () => `top+=${firstPoint()} bottom`,
                    end: () => `top+=${firstPoint()} 62%`,
                    scrub: 0.3,
                    invalidateOnRefresh: true,
                  },
                },
              )
            }
            // Each photo: its point, then its line, then the photo itself fades in, rising into place.
            stories.forEach((_, i) => {
              const story = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                  trigger: `[data-story="${i}"]`,
                  start: 'top 106%',
                  end: 'top 80%',
                  scrub: 0.3,
                },
              })
              if (!lite) {
                story
                  .fromTo(
                    `${scope} [data-point="${i}"]`,
                    { scale: 0, transformOrigin: 'center' },
                    { scale: 1, duration: 0.15 },
                    0,
                  )
                  .fromTo(
                    `${scope} [data-line="${i}"]`,
                    { strokeDashoffset: 1000 },
                    { strokeDashoffset: 0, duration: 0.35 },
                    0.1,
                  )
              }
              story.fromTo(
                `[data-story="${i}"] [data-story-in]`,
                { autoAlpha: 0, y: 70, scale: 0.92 },
                { autoAlpha: 1, y: 0, scale: 1, duration: 0.65 },
                lite ? 0 : 0.3,
              )
            })
          })
      }, el)
      return () => ctx.revert()
    })
  }, [])

  return (
    <section
      ref={root}
      data-runway
      aria-label="Thirty years of impact"
      className="card-run relative isolate overflow-x-clip"
    >
      {passing.map((g, i) => (
        <div
          key={i}
          aria-hidden
          data-passing
          data-from={g.from}
          data-to={g.to}
          className={`pointer-events-none absolute -z-10 ${g.place}`}
        >
          <GlassImage src={g.art} className="h-auto w-full" />
        </div>
      ))}

      {/* The ground the card covers on its way down */}
      <div data-spacer style={{ height: 'calc(var(--travel) + var(--drop))' }} />

      {/* The stage is ordinary page content: it rises to meet the card */}
      <div className="relative pb-10 lg:pb-16">
        <div aria-hidden className="flare absolute inset-x-0 bottom-0 -z-10 h-[86%] opacity-70" />
        <div
          data-stage
          className="relative mx-auto aspect-[390/640] lg:aspect-[1240/780]"
          style={{ width: 'var(--stage)' }}
        >
          <div data-connectors-phone className="contents lg:hidden">
            <Connectors shape={phone} viewBox="0 0 390 640" />
          </div>
          <div data-connectors-desktop className="hidden lg:contents">
            <Connectors shape={desktop} viewBox="0 0 1240 780" />
          </div>

          {stories.map((s, i) => (
            <figure
              key={s.title}
              data-story={i}
              className={`group absolute w-[45.1%] lg:w-[21.8%] ${s.place}`}
            >
              <div data-story-in>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/15 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.85)] lg:rounded-2xl">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    placeholder="blur"
                    sizes="(min-width: 1024px) 270px, 46vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pt-7 pb-2 text-[13px] leading-tight font-medium text-fg sm:text-[15px] lg:hidden"
                  >
                    {s.title}
                  </span>
                </div>
                <figcaption className="sr-only lg:not-sr-only lg:mt-3 lg:block">
                  <span className="block text-lg leading-tight font-medium text-fg">{s.title}</span>
                  <span className="mt-1 line-clamp-2 hidden text-[15px] leading-snug [@media(min-height:820px)]:block">
                    {s.text}
                  </span>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>

      {/* The card sticks while the page moves behind it, and lets go exactly where the stage has its place */}
      <div
        data-column
        className="pointer-events-none absolute inset-x-0 top-0 z-20"
        style={{ height: 'calc(var(--travel) + var(--card-h))' }}
      >
        <div
          data-mover
          className="sticky mx-auto will-change-transform"
          style={{ top: 'var(--pin)', width: 'var(--card-w)' }}
        >
          <div data-card className="relative aspect-[302/479]">
            <div className="animate-float h-full w-full">
              <AnniversaryCard className="h-full w-full shadow-[0_40px_90px_-30px_rgba(227,154,23,0.55)]" />
            </div>
          </div>
        </div>
      </div>

      {/* The case holds the card at first, then keeps moving with the page */}
      <div
        data-case
        className="pointer-events-none absolute top-0 left-1/2 z-30 -translate-x-1/2 motion-reduce:hidden"
        style={{ width: 'calc(var(--card-w) * 1.03)' }}
      >
        <CardCase variant="top" className="aspect-[325/488] w-full" />
      </div>
    </section>
  )
}
