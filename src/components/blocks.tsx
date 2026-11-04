import Image, { type StaticImageData } from 'next/image'
import type { ReactNode } from 'react'

import { glass } from '@/assets/glass'
import { blurFor } from '@/lib/image'
import { GlassImage } from './GlassImage'
import { Flame, Sparkle } from './icons'
import { WorldRise } from './motion'
import { Reveal } from './Reveal'
import { ShareButtons } from './ShareButtons'

/** Section header: title left, paragraph or action right. */
export function SplitHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
      <Reveal as="h2" className="h-section lg:max-w-[470px]">
        {title}
      </Reveal>
      <Reveal delay={100} className="lg:max-w-[530px]">
        {children}
      </Reveal>
    </div>
  )
}

/** Outlined card label with a spinning star (radius 8). */
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 self-start rounded-lg border border-white/35 px-4 py-[9px] text-sm leading-none text-fg ${className}`}>
      <Sparkle width={15} height={15} className="animate-spin-slow" />
      {children}
    </span>
  )
}

/** 40×40 dark icon tile. */
export function IconTile({ Icon, className = '' }: { Icon: typeof Flame; className?: string }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-lg bg-hair text-muted ${className}`}>
      <Icon width={20} height={20} />
    </span>
  )
}

export function StarList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 py-2 text-base sm:text-lg">
          <Sparkle width={15} height={15} className="animate-spin-slow mt-1.5 shrink-0 text-fg" />
          {item}
        </li>
      ))}
    </ul>
  )
}

/** A glass object on its field of halftone dots. */
export function GlassArt({ art, className = '', dots = 'inset-[-30%]', fit = false }: { art: StaticImageData; className?: string; dots?: string; fit?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <div aria-hidden className={`dots absolute ${dots}`} />
      <GlassImage src={art} className={`relative w-full transition-transform duration-500 group-hover:scale-105 ${fit ? 'h-full object-contain' : 'h-auto'}`} />
    </div>
  )
}

/** Title and text on top, a glass object in the middle, a small action at the foot, warm corner. */
export function GlassTile({ title, text, art, action, delay = 0 }: { title: string; text?: string; art: StaticImageData; action?: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className="card group relative isolate flex min-h-[440px] flex-col overflow-hidden p-5 sm:min-h-[520px] sm:p-10">
      <div aria-hidden className="warm-corner absolute inset-0 -z-10" />
      <h2 className="h-card">{title}</h2>
      {text && <p className="mt-3 text-base sm:text-lg">{text}</p>}
      <div className="my-6 grid flex-1 place-items-center">
        <GlassArt art={art} className="w-[128px] sm:w-[150px]" dots="inset-[-70%]" />
      </div>
      {action && <div className="relative flex flex-wrap gap-2">{action}</div>}
    </Reveal>
  )
}

/** Bento tile: label top-left, a glass object leaning in from the top right, copy at the foot. */
export function FeatureTile({
  label,
  title,
  text,
  art,
  artClassName = 'size-[112px] sm:size-[170px]',
  className = '',
  delay = 0,
  children,
}: {
  label?: string
  title: string
  text?: string
  art: StaticImageData
  artClassName?: string
  className?: string
  delay?: number
  children?: ReactNode
}) {
  return (
    <Reveal delay={delay} className={`card group relative flex min-h-[320px] flex-col justify-between gap-20 overflow-hidden p-5 sm:min-h-[352px] sm:gap-[120px] sm:p-10 ${className}`}>
      {label ? <Label className="relative z-10">{label}</Label> : <span />}
      <GlassArt fit art={art} className={`!absolute top-4 right-4 sm:top-6 sm:right-6 ${artClassName}`} dots="inset-[-45%]" />
      <div className="relative">
        <h3 className="h-card">{title}</h3>
        {text && <p className="mt-3 text-base sm:text-lg">{text}</p>}
        {children}
      </div>
    </Reveal>
  )
}

/** Large two-sided card: a visual on one side; heading, actions and two figures on the other. */
export function ShowcaseCard({
  visual,
  label,
  title,
  text,
  actions,
  stats,
  as: Heading = 'h2',
}: {
  visual: ReactNode
  label?: string
  title: string
  text?: ReactNode
  actions?: ReactNode
  stats?: { value: string; text: string }[]
  as?: 'h1' | 'h2'
}) {
  return (
    <Reveal className="card group grid overflow-hidden lg:grid-cols-[1fr_1fr]">
      <div className="relative grid min-h-[320px] place-items-center p-6 sm:min-h-[420px] sm:p-10">{visual}</div>
      <div className="flex flex-col justify-center gap-8 p-5 pt-0 sm:p-10 lg:py-[60px] lg:pr-[60px] lg:pl-4">
        <div>
          {label && <Label className="mb-5">{label}</Label>}
          <Heading className="h-section">{title}</Heading>
          {text && <div className="mt-4 grid gap-4">{text}</div>}
          {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {stats && (
          <dl className="grid grid-cols-2 border-t border-hair pt-6">
            {stats.map((s, i) => (
              <div key={s.value} className={i ? 'border-l border-hair pl-5 sm:pl-7' : 'pr-5'}>
                <dt className="text-xl font-medium text-fg sm:text-2xl">{s.value}</dt>
                <dd className="mt-1.5 text-[15px] leading-snug sm:text-base">{s.text}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Reveal>
  )
}

/** A heading and a few paragraphs on one side; a big visual on the other. */
export function StorySplit({ title, children, visual, flip = false }: { title: string; children: ReactNode; visual: ReactNode; flip?: boolean }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-[70px]">
      <Reveal className={flip ? 'lg:order-2' : ''}>
        <h2 className="h-section">{title}</h2>
        <div className="mt-5 grid gap-4">{children}</div>
      </Reveal>
      <Reveal delay={100} className={`relative ${flip ? 'lg:order-1' : ''}`}>
        {visual}
      </Reveal>
    </div>
  )
}

/** A photograph in a card with a glass object leaning over its corner. */
export function PhotoWithGlass({ photo, alt, art, className = 'aspect-[5/4] lg:aspect-[4/5]', sizes = '(min-width: 1024px) 600px, 96vw' }: { photo: StaticImageData | string; alt: string; art: StaticImageData; className?: string; sizes?: string }) {
  return (
    <div className="relative">
      <div className={`card relative overflow-hidden ${className}`}>
        <Image src={photo} alt={alt} fill sizes={sizes} placeholder={blurFor(photo)} className="object-cover" />
      </div>
      <GlassImage src={art} className="pointer-events-none absolute -top-8 -right-1 h-auto w-[104px] drop-shadow-[0_20px_30px_rgba(0,0,0,0.75)] sm:-top-10 sm:-right-5 sm:w-[160px]" />
    </div>
  )
}

const pins = [
  { left: '19%', top: '44%' },
  { left: '39%', top: '20%' },
  { left: '50%', top: '53%' },
  { left: '66%', top: '26%' },
  { left: '82%', top: '56%' },
]

/** Centred heading above a huge glass world, cut off by the horizon, with pins on it. */
export function GlobalPresence({ title, text, stats }: { title: string; text: string; stats?: ReactNode }) {
  return (
    <section className="section overflow-hidden">
      <div className="container-site">
        <Reveal className="mx-auto max-w-[620px] text-center">
          <h2 className="h-section">{title}</h2>
          <p className="mt-4">{text}</p>
        </Reveal>
        <WorldRise className="relative mt-10 aspect-[2/1] overflow-hidden lg:mt-[60px]">
          <div data-world className="absolute inset-x-0 top-0 origin-bottom will-change-transform">
            <GlassImage src={glass.world} className="h-auto w-full" />
            {pins.map((p) => (
              <svg key={p.left} data-pin aria-hidden viewBox="0 0 24 32" className="absolute w-[5%] max-w-[40px] min-w-[20px] -translate-x-1/2 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" style={p}>
                <path fill="#fff" d="M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 32 12 32s12-11.6 12-20.3C24 5.2 18.6 0 12 0Z" />
                <circle cx="12" cy="11.7" r="4.2" fill="#0a0a0a" />
              </svg>
            ))}
          </div>
        </WorldRise>
        {stats}
      </div>
    </section>
  )
}

/** Closing band for the inner pages: an invitation, the next step and sharing. */
export function ClosingBand({ title, text, shareUrl, shareText, children }: { title: string; text: string; shareUrl: string; shareText: string; children?: ReactNode }) {
  return (
    <section className="section pb-24">
      <div className="container-site">
        <Reveal className="relative isolate overflow-hidden rounded-2xl border-2 border-white/[0.11] bg-surface px-5 py-14 text-center sm:px-10 sm:py-[90px]">
          <div aria-hidden className="flare absolute inset-x-0 bottom-0 -z-10 h-full opacity-60" />
          <h2 className="h-section mx-auto max-w-[640px]">{title}</h2>
          <p className="mx-auto mt-4 max-w-[560px]">{text}</p>
          {children && <div className="mx-auto mt-9 flex max-w-[520px] flex-col justify-center gap-3 sm:flex-row">{children}</div>}
          <ShareButtons url={shareUrl} text={shareText} className="mt-9 justify-center" />
        </Reveal>
      </div>
    </section>
  )
}

/** A form lifted on warm stripes, with a centred heading above it. */
export function FormStage({ id, title, text, children }: { id?: string; title: string; text: string; children: ReactNode }) {
  return (
    <section id={id} className="section relative isolate scroll-mt-16 pb-20 sm:pb-[120px]">
      <div aria-hidden className="stripes absolute inset-x-0 bottom-0 -z-10 h-[62%]" />
      <div className="container-site">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <h2 className="h-section">{title}</h2>
          <p className="mt-4">{text}</p>
        </Reveal>
        <div className="mx-auto mt-10 max-w-[860px] lg:mt-[60px]">{children}</div>
      </div>
    </section>
  )
}
