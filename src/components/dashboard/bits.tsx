'use client'

import { Icon, type IconifyIcon } from '@iconify/react/offline'
import { useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { SearchHit } from '@/lib/dashboardData'
import { arrowIcon, bookIcon, chatIcon, planeIcon, searchIcon } from './icons'
import { goBack, go, refresh, useData } from './store'

export type Tone = 'teal' | 'pink' | 'butter' | 'lilac' | 'white'

const tones: Record<Tone, string> = { teal: 'bg-teal', pink: 'bg-pink', butter: 'bg-butter', lilac: 'bg-lilac', white: 'bg-white' }

export const toneClass = (tone: Tone) => tones[tone]

/** A link that swaps the screen in the browser. It behaves like a normal link for new tabs. */
/** A dashboard link. With `back`, it returns to the page this one was opened from (`href` is only the fallback). */
export function A({ href, onClick, warm, back, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; warm?: string; back?: boolean }) {
  return (
    <a
      {...props}
      href={href}
      onPointerEnter={() => {
        if (warm) void refresh(warm)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        if (back) goBack(href)
        else go(href)
      }}
    />
  )
}

export function Glyph({ icon, className }: { icon: IconifyIcon; className?: string }) {
  return <Icon icon={icon} aria-hidden className={cn('size-5 shrink-0', className)} />
}

/** The white circle with an arrow in it. */
export function Arrow({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('grid size-12 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform duration-200 group-hover:scale-110', className)}>
      <Glyph icon={arrowIcon} className="size-5" />
    </span>
  )
}

export function Tile({ tone = 'white', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <section className={cn('rounded-[28px] p-6', toneClass(tone), className)}>{children}</section>
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="text-[28px] leading-tight font-medium tracking-[-0.01em] sm:text-[34px]">
      {children}
      {count !== undefined && <span className="ml-2.5 text-[#b4b9c4]">({count.toLocaleString('en-GB')})</span>}
    </h2>
  )
}

const kindIcon = { testimony: chatIcon, story: bookIcon, guest: planeIcon }
export const kindHref = { testimony: '/dashboard/testimonies', story: '/dashboard/stories', guest: '/dashboard/guests' }

function Search() {
  const [words, setWords] = useState('')
  const [asked, setAsked] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { data } = useData<SearchHit[]>(asked ? `/dashboard/data?q=${encodeURIComponent(asked)}` : null)

  useEffect(() => {
    const wait = setTimeout(() => setAsked(words.trim()), 220)
    return () => clearTimeout(wait)
  }, [words])

  useEffect(() => {
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [])

  return (
    <div ref={box} className="relative hidden w-full max-w-[420px] lg:block">
      <label className="flex h-14 items-center gap-3 rounded-2xl bg-white px-5">
        <Glyph icon={searchIcon} className="text-soft" />
        <span className="sr-only">Search</span>
        <input
          value={words}
          onChange={(event) => {
            setWords(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search testimonies, guests and stories"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mist"
        />
      </label>
      {open && asked && (
        <div className="absolute inset-x-0 top-16 z-40 rounded-[24px] bg-white p-2 shadow-[0_18px_50px_-12px_#0000002e]">
          {data?.length ? (
            data.map((hit) => (
              <A
                key={`${hit.kind}-${hit.id}`}
                href={`${kindHref[hit.kind]}/${hit.id}`}
                onClick={() => {
                  setOpen(false)
                  setWords('')
                }}
                className="flex items-center gap-3 rounded-2xl p-3 hover:bg-canvas"
              >
                <Glyph icon={kindIcon[hit.kind]} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{hit.title}</span>
                  <span className="block truncate text-[13px] text-mist">{hit.who}</span>
                </span>
              </A>
            ))
          ) : (
            <p className="p-3 text-sm text-mist">{data ? 'Nothing found.' : 'Searching…'}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function Header({ title, count, children, you }: { title: ReactNode; count?: number; children?: ReactNode; you: string }) {
  return (
    <header className="flex items-center justify-between gap-4 sm:gap-6">
      <div className="flex min-w-0 items-center gap-4">
        <h1 className="min-w-0 text-[30px] leading-tight font-medium tracking-[-0.015em] sm:text-[46px]">
          {title}
          {count !== undefined && <span className="ml-3 text-[#b4b9c4]">({count.toLocaleString('en-GB')})</span>}
        </h1>
        {children}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4 lg:flex-1">
        <Search />
        <span aria-label={`Signed in as ${you}`} className="grid size-12 shrink-0 place-items-center rounded-full bg-butter text-lg font-semibold sm:size-14">
          {you.charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  )
}

/** The first letters of whoever's waiting, overlapping like the faces in a group. */
export function Faces({ names, extra }: { names: string[]; extra: number }) {
  const colours = ['bg-ink text-white', 'bg-white text-ink', 'bg-soft text-white', 'bg-[#e9edee] text-ink']
  return (
    <div className="flex items-center">
      {names.slice(0, 4).map((name, i) => (
        <span key={i} className={cn('-ml-2 grid size-10 place-items-center rounded-full text-sm font-semibold first:ml-0', colours[i % colours.length])}>
          {(name || '?').charAt(0).toUpperCase()}
        </span>
      ))}
      {extra > 0 && <span className="-ml-2 grid size-10 place-items-center rounded-full bg-white text-xs font-semibold">+{extra}</span>}
    </div>
  )
}

export const shortDate = (value?: string | null) => (value ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '')
export const longDate = (value?: string | null) => (value ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value)) : '')

export function TilesLoading({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-[210px] rounded-[28px] bg-white" />
      ))}
    </div>
  )
}

export function Trouble({ url }: { url: string }) {
  return (
    <Tile className="mt-5">
      <p className="text-[15px] text-soft">This couldn’t load. Please check your connection.</p>
      <button type="button" onClick={() => void refresh(url, { force: true })} className="mt-3 h-11 rounded-2xl bg-ink px-5 text-[15px] font-medium text-white">
        Try again
      </button>
    </Tile>
  )
}

export const Plain = ({ children }: { children: ReactNode }) => <p className="text-[15px] leading-relaxed text-soft">{children}</p>
