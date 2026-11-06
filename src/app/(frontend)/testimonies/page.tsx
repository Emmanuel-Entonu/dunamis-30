import type { Metadata } from 'next'
import { Fragment } from 'react'
import Link from '@/components/SiteLink'

import { glass } from '@/assets/glass'
import { FormStage, GlassArt } from '@/components/blocks'
import { inputClass } from '@/components/forms/Field'
import { Play } from '@/components/icons'
import { PageHero } from '@/components/PageHero'
import { TestimonyCard } from '@/components/TestimonyCard'
import { categoryLabels } from '@/lib/categories'
import { getTestimonies, testimonyFormOpen } from '@/lib/content'
import { readMixSeed } from '@/lib/testimonyMix'
import { TestimonyForm } from './TestimonyForm'

export const metadata: Metadata = {
  title: 'Testimonies',
  description:
    'Real stories from people God has touched through Dunamis International Gospel Centre. Read them, or share yours.',
}

/** The first and last pages and the ones around this page, so a long library still fits a phone. */
const pageList = (current: number, total: number) => {
  const shown = [...new Set([1, current - 1, current, current + 1, total])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  return shown.map((n, i) => ({ n, gapBefore: i > 0 && n - shown[i - 1] > 1 }))
}

type Search = { q?: string; category?: string; year?: string; sort?: string; page?: string; type?: string; mix?: string }

export default async function TestimoniesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const category = sp.category && categoryLabels[sp.category] ? sp.category : ''
  const page = Math.max(1, Number(sp.page) || 1)
  const thisYear = new Date().getFullYear()
  const years = Array.from({ length: thisYear - 1995 }, (_, i) => thisYear - i)
  const year = years.includes(Number(sp.year)) ? Number(sp.year) : undefined
  const sort = sp.sort === 'oldest' ? 'oldest' : sp.sort === 'newest' ? 'newest' : 'mix'
  const videos = sp.type === 'video'
  // Pages of one visit share a shuffle, so nothing repeats or goes missing between them.
  const seed = readMixSeed(sp.mix)
  const [result, formOpen] = await Promise.all([getTestimonies({ q, category, year, videos, sort, seed, page }), testimonyFormOpen()])

  const href = (next: { category?: string; page?: number; videos?: boolean }) => {
    const p = new URLSearchParams()
    const nc = next.category ?? category
    const nv = next.videos ?? videos
    if (q) p.set('q', q)
    if (nc) p.set('category', nc)
    if (nv) p.set('type', 'video')
    if (year) p.set('year', String(year))
    if (sort !== 'mix') p.set('sort', sort)
    if (next.page && next.page > 1) {
      p.set('page', String(next.page))
      if (sort === 'mix') p.set('mix', String(seed))
    }
    const s = p.toString()
    return `/testimonies${s ? `?${s}` : ''}#library`
  }

  return (
    <>
      <PageHero
        eyebrow="Testimonies"
        title="30 years of testimonies"
        intro={formOpen ? 'Real stories from people God has touched through this ministry. Read them, or add yours.' : 'Real stories from people God has touched through this ministry.'}
      >
        {formOpen && (
          <div className="mt-8 flex justify-center">
            <a href="#share" className="btn btn-primary">
              Share your testimony
            </a>
          </div>
        )}
      </PageHero>

      <section id="library" className="scroll-mt-28 pb-20">
        <div className="container-site">
          <form action="/testimonies#library" className="grid grid-cols-2 gap-2.5 lg:grid-cols-[1fr_170px_170px_auto]">
            {category && <input type="hidden" name="category" value={category} />}
            {videos && <input type="hidden" name="type" value="video" />}
            <label htmlFor="q" className="sr-only">
              Search testimonies
            </label>
            <input id="q" name="q" defaultValue={q} placeholder="Search by keyword or name" className={`${inputClass} col-span-2 lg:col-span-1`} />
            <label htmlFor="year" className="sr-only">
              Year published
            </label>
            <select id="year" name="year" defaultValue={year ?? ''} className={`${inputClass} appearance-none`}>
              <option value="">Any year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <label htmlFor="sort" className="sr-only">
              Order
            </label>
            <select id="sort" name="sort" defaultValue={sort === 'mix' ? '' : sort} className={`${inputClass} appearance-none`}>
              <option value="">Mixed</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button type="submit" className="btn btn-primary col-span-2 lg:col-span-1">
              Search
            </button>
          </form>

          <nav aria-label="Testimony categories" className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <Link
              href={href({ videos: !videos, page: 1 })}
              aria-current={videos ? 'true' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-[15px] transition-colors ${videos ? 'bg-gold text-gold-ink' : 'bg-hair text-soft hover:bg-line hover:text-gold'}`}
            >
              <Play width={14} height={14} /> Videos
            </Link>
            {[['', 'All'], ...Object.entries(categoryLabels)].map(([value, label]) => (
              <Link
                key={value || 'all'}
                href={href({ category: value, page: 1 })}
                aria-current={category === value ? 'page' : undefined}
                className={`shrink-0 rounded-lg px-5 py-2.5 text-[15px] transition-colors ${
                  category === value ? 'bg-white text-canvas' : 'bg-hair text-soft hover:bg-line hover:text-gold'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {(q || category || year || videos) && (
            <p className="mt-6 text-base">
              {result.total} {videos ? 'video ' : ''}
              {result.total === 1 ? 'testimony' : 'testimonies'}
              {category && <> in {categoryLabels[category]}</>}
              {year && <> from {year}</>}
              {q && <> matching “{q}”</>} ·{' '}
              <Link href="/testimonies#library" className="text-gold hover:underline">
                Clear
              </Link>
            </p>
          )}

          {result.docs.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.docs.map((t) => (
                <TestimonyCard key={t.id} testimony={t} />
              ))}
            </div>
          ) : (
            <div className="card group mt-8 flex flex-col items-center p-8 text-center sm:p-14">
              <GlassArt art={glass.quote} className="mb-8 w-[120px] sm:w-[150px]" dots="inset-[-60%]" />
              <p className="h-card">{q || category || year || videos ? 'No testimonies found' : 'Testimonies are coming'}</p>
              <p className="mx-auto mt-3 max-w-[460px]">
                {q || category || year || videos
                  ? formOpen
                    ? 'Try another word or category, or share your own.'
                    : 'Try another word or category.'
                  : formOpen
                    ? 'We’re gathering them now. Be one of the first to share yours.'
                    : 'We’re gathering them now. Please check back soon.'}
              </p>
              {formOpen && (
                <a href="#share" className="btn btn-primary mt-7">
                  Share your testimony
                </a>
              )}
            </div>
          )}

          {result.totalPages > 1 && (
            <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {pageList(result.page, result.totalPages).map(({ n, gapBefore }) => (
                <Fragment key={n}>
                  {gapBefore && (
                    <span aria-hidden className="px-0.5 text-[15px] text-muted">
                      …
                    </span>
                  )}
                  <Link
                    href={href({ page: n })}
                    aria-current={n === result.page ? 'page' : undefined}
                    className={`grid size-11 place-items-center rounded-lg text-[15px] ${n === result.page ? 'bg-white text-canvas' : 'bg-hair text-soft hover:bg-line'}`}
                  >
                    {n}
                  </Link>
                </Fragment>
              ))}
            </nav>
          )}
        </div>
      </section>

      {formOpen ? (
        <FormStage id="share" title="Share your testimony" text="What has God done for you? Our communications team reads every testimony before it goes up, and your email and phone stay private.">
          <TestimonyForm />
        </FormStage>
      ) : (
        <section id="share" className="scroll-mt-28 pb-20">
          <div className="container-site">
            <div className="card p-8 text-center sm:p-14">
              <p className="h-card">We’re not taking new testimonies at the moment</p>
              <p className="mx-auto mt-3 max-w-[460px]">Thank you to everyone who has shared what God has done in their lives.</p>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
