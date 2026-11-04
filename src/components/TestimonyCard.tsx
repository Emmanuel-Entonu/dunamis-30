import Image from 'next/image'
import Link from 'next/link'

import { categoryLabels, categoryTints } from '@/lib/categories'
import { mediaUrl, type CardTestimony } from '@/lib/content'
import { Play } from './icons'

/** Testimony: an identity bar above a quote card, or a photo card when there is a picture. */
export function TestimonyCard({ testimony }: { testimony: CardTestimony }) {
  const { title, name, category, summary, slug, videoUrl, photo } = testimony
  const [tintA, tintB] = categoryTints[category] ?? categoryTints.other
  const href = slug ? `/testimonies/${slug}` : '/testimonies'
  const image = mediaUrl(photo, 'card')
  const thumb = mediaUrl(photo, 'thumb')
  const label = categoryLabels[category] ?? 'Testimony'
  const who = name ?? 'A Dunamis member'

  return (
    <article className="group relative flex h-full flex-col gap-3">
      <div className="flex h-[65px] items-center justify-between gap-3 rounded-2xl border border-hair bg-surface p-2">
        <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg text-lg font-medium text-white" style={{ background: `linear-gradient(140deg, ${tintA}, ${tintB})` }}>
          {thumb ? <Image src={thumb} alt="" fill sizes="48px" className="object-cover" /> : who.charAt(0)}
        </span>
        <span className="truncate rounded-lg bg-hair px-[15px] py-3 text-sm text-fg">{label}</span>
      </div>

      <div className="relative flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-2xl border border-hair bg-surface p-6 sm:p-8">
        {image ? (
          <>
            <Image src={image} alt={photo?.alt || title} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 96vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            {videoUrl && (
              <span className="absolute top-[38%] left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl text-white shadow-[inset_0_0_6px_rgba(255,255,255,0.6)] backdrop-blur-[5px] transition-shadow group-hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.7)]">
                <Play width={22} height={22} />
              </span>
            )}
            <div className="relative mt-auto">
              <h3 className="h-card">{title}</h3>
              <p className="mt-2 line-clamp-2 text-base text-soft">{summary}</p>
              <p className="mt-3 text-base text-fg">{who}</p>
            </div>
          </>
        ) : (
          <>
            <div aria-hidden className="absolute right-[-5%] bottom-[-4%] size-[40%] rounded-full bg-gold/30 blur-[90px]" />
            <svg aria-hidden width="21" height="17" viewBox="0 0 21 17" className="relative fill-white">
              <path d="M0 17V10.2C0 4.4 3 1 8.1 0l.9 2.4C6.3 3.3 5 5.2 4.8 7.8H9V17H0Zm12 0V10.2C12 4.4 15 1 20.1 0l.9 2.4c-2.7.9-4 2.8-4.2 5.4H21V17h-9Z" />
            </svg>
            <h3 className="relative mt-6 text-xl leading-[1.3] font-medium text-fg sm:text-2xl">{title}</h3>
            <p className="relative mt-4 line-clamp-4 text-base">{summary}</p>
            <div className="relative mt-auto border-l border-muted pt-0 pl-5">
              <p className="text-lg text-fg">{who}</p>
              <p className="mt-1 text-base">{label}</p>
            </div>
          </>
        )}
        <Link href={href} className="absolute inset-0" aria-label={`${videoUrl ? 'Watch' : 'Read'}: ${title}`} />
      </div>
    </article>
  )
}
