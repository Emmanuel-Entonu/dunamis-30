'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { glass } from '@/assets/glass'
import { inputClass } from '@/components/forms/Field'
import { ChevronLeft, ChevronRight, Close, Play } from '@/components/icons'

export type GalleryCard = {
  key: string | number
  title: string
  description?: string | null
  category: string
  event?: string | null
  year?: number | null
  src?: string | null
  thumb?: string | null
  width?: number | null
  height?: number | null
  blur?: string | null
  /** Embeddable player URL, or the plain link when the host cannot be embedded. */
  video?: string | null
  videoLink?: string | null
}

const selectClass = `${inputClass} appearance-none`

/** Search, browse by category, year or event, and open anything in a lightbox. */
export function GalleryBrowser({ items, categories }: { items: GalleryCard[]; categories: Record<string, string> }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [year, setYear] = useState('')
  const [event, setEvent] = useState('')
  const [openKey, setOpenKey] = useState<GalleryCard['key'] | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  const years = useMemo(() => [...new Set(items.map((i) => i.year).filter(Boolean) as number[])].sort((a, b) => b - a), [items])
  const events = useMemo(() => [...new Set(items.map((i) => i.event).filter(Boolean) as string[])].sort(), [items])
  const presentCategories = useMemo(() => Object.entries(categories).filter(([value]) => items.some((i) => i.category === value)), [categories, items])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(
      (i) =>
        (!category || i.category === category) &&
        (!year || String(i.year) === year) &&
        (!event || i.event === event) &&
        (!q || [i.title, i.event, i.description, i.year].filter(Boolean).join(' ').toLowerCase().includes(q)),
    )
  }, [items, query, category, year, event])

  const openIndex = openKey === null ? -1 : shown.findIndex((i) => i.key === openKey)
  const current = openIndex >= 0 ? shown[openIndex] : null

  const step = useCallback(
    (by: number) => {
      if (openIndex < 0 || !shown.length) return
      setOpenKey(shown[(openIndex + by + shown.length) % shown.length].key)
    },
    [openIndex, shown],
  )

  const isOpen = current !== null
  useEffect(() => {
    if (!isOpen) return
    closeButton.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenKey(null)
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, step])

  // Swipe between photos on phones.
  const touchX = useRef<number | null>(null)
  const clear = () => {
    setQuery('')
    setCategory('')
    setYear('')
    setEvent('')
  }

  return (
    <>
      <div className="grid gap-2.5 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <label htmlFor="gallery-search" className="sr-only">
            Search the gallery
          </label>
          <input id="gallery-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search photos and videos" className={inputClass} />
        </div>
        {years.length > 0 && (
          <div>
            <label htmlFor="gallery-year" className="sr-only">
              Year
            </label>
            <select id="gallery-year" value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
              <option value="">Any year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
        {events.length > 0 && (
          <div>
            <label htmlFor="gallery-event" className="sr-only">
              Event
            </label>
            <select id="gallery-event" value={event} onChange={(e) => setEvent(e.target.value)} className={selectClass}>
              <option value="">Any event</option>
              {events.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div role="group" aria-label="Gallery categories" className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {[['', 'All'], ...presentCategories].map(([value, label]) => (
          <button
            key={value || 'all'}
            type="button"
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
            className={`shrink-0 rounded-lg px-5 py-2.5 text-[15px] transition-colors ${category === value ? 'bg-white text-canvas' : 'bg-hair text-soft hover:bg-line hover:text-gold'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {shown.length} items shown
      </p>

      {shown.length > 0 ? (
        <ul className="mt-8 columns-2 gap-3 sm:gap-5 lg:columns-3">
          {shown.map((item) => (
            <li key={item.key} className="mb-3 break-inside-avoid sm:mb-5">
              <button
                type="button"
                onClick={() => setOpenKey(item.key)}
                className="group relative block w-full overflow-hidden rounded-xl border border-hair bg-surface text-left sm:rounded-2xl"
                aria-label={`Open ${item.title}`}
              >
                {item.thumb ? (
                  <Image
                    src={item.thumb}
                    alt=""
                    width={item.width ?? 700}
                    height={item.height ?? 600}
                    placeholder={item.blur ? 'blur' : 'empty'}
                    blurDataURL={item.blur ?? undefined}
                    sizes="(min-width: 1024px) 400px, 48vw"
                    className="block h-auto w-full transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="bg-ticks block aspect-video" />
                )}
                {(item.video || item.videoLink) && (
                  <span className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-black/30 text-white shadow-[inset_0_0_6px_rgba(255,255,255,0.6)] backdrop-blur-[5px]">
                    <Play width={22} height={22} />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-12 text-[13px] leading-snug text-fg sm:p-5 sm:pt-16 sm:text-base">
                  {item.title}
                  {item.year ? <span className="text-soft"> · {item.year}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-8 flex flex-col items-center p-8 text-center sm:p-14">
          <Image src={glass.camera} alt="" sizes="150px" className="mb-8 h-auto w-[120px] sm:w-[150px]" />
          <p className="h-card">Nothing matches that search</p>
          <p className="mx-auto mt-3 max-w-[460px]">Try another word, or clear your filters to see everything.</p>
          <button type="button" onClick={clear} className="btn btn-primary mt-7">
            Clear Filters
          </button>
        </div>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          className="fixed inset-0 z-[70] flex flex-col bg-black/95 backdrop-blur-[6px]"
          onClick={(e) => e.target === e.currentTarget && setOpenKey(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
          }}
        >
          <div className="flex items-center justify-between gap-4 p-3 sm:p-5">
            <p className="min-w-0 truncate text-[15px] text-soft sm:text-lg">
              {openIndex + 1} / {shown.length}
            </p>
            <button ref={closeButton} type="button" onClick={() => setOpenKey(null)} aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-lg bg-hair text-fg transition-colors hover:bg-line">
              <Close width={22} height={22} />
            </button>
          </div>

          <div className="relative min-h-0 flex-1 px-3 sm:px-20" onClick={(e) => e.target === e.currentTarget && setOpenKey(null)}>
            {current.video ? (
              <div className="mx-auto flex h-full max-w-[1100px] items-center">
                <iframe src={current.video} title={current.title} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full rounded-xl" />
              </div>
            ) : current.videoLink ? (
              <div className="grid h-full place-items-center">
                <a href={current.videoLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <Play width={20} height={20} /> Watch The Video
                </a>
              </div>
            ) : current.src ? (
              <div className="relative h-full w-full">
                <Image src={current.src} alt={current.title} fill sizes="100vw" className="object-contain" />
              </div>
            ) : null}
            {shown.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Previous" className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 place-items-center rounded-lg bg-hair text-fg transition-colors hover:bg-line sm:grid">
                  <ChevronLeft width={24} height={24} />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next" className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 place-items-center rounded-lg bg-hair text-fg transition-colors hover:bg-line sm:grid">
                  <ChevronRight width={24} height={24} />
                </button>
              </>
            )}
          </div>

          <div className="mx-auto w-full max-w-[860px] p-4 text-center sm:p-6">
            <p className="text-lg font-medium text-fg sm:text-xl">{current.title}</p>
            <p className="mt-1 text-sm sm:text-base">{[categories[current.category], current.event, current.year].filter(Boolean).join(' · ')}</p>
            {current.description && <p className="mt-2 text-sm sm:text-base">{current.description}</p>}
          </div>
        </div>
      )}
    </>
  )
}
