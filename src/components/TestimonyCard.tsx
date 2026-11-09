import Image from 'next/image'
import Link from '@/components/SiteLink'

import { categoryLabels, categoryTints } from '@/lib/categories'
import { mediaUrl, type CardTestimony } from '@/lib/content'
import { LoadingImage } from './LoadingImage'
import { Play } from './icons'

/** Testimony: an identity bar above a quote card, or a photo card when there is a picture. */
export function TestimonyCard({ testimony }: { testimony: CardTestimony }) {
  const { title, name, category, teaser, slug, hasVideo, photo, videoPoster, videoThumb } = testimony
  const [tintA, tintB] = categoryTints[category] ?? categoryTints.other
  const href = slug ? `/testimonies/${slug}` : '/testimonies'
  // A person's own photo goes first. A video's cover stands in when there isn't one.
  const cover = photo ?? videoPoster
  const image = mediaUrl(cover, 'card')
  const thumb = mediaUrl(cover, 'thumb')
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

      <div className={`relative flex ${image || teaser || videoThumb ? 'min-h-[400px]' : 'min-h-[240px]'} flex-1 flex-col overflow-hidden rounded-2xl border border-hair bg-surface p-6 sm:p-8`}>
        {!image && videoThumb ? (
          <>
            {/* A YouTube video with no photo: its own thumbnail across the top, the words below. */}
            <div className="relative -mx-6 -mt-6 aspect-video overflow-hidden border-b border-hair bg-black sm:-mx-8 sm:-mt-8">
              <LoadingImage src={videoThumb} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 96vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-black/50 text-white shadow-[inset_0_0_6px_rgba(255,255,255,0.6)] backdrop-blur-md transition-shadow group-hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.7)]">
                <Play width={22} height={22} />
              </span>
            </div>
            <h3 className="relative mt-6 line-clamp-3 text-xl leading-[1.3] font-medium text-fg [overflow-wrap:anywhere] sm:text-2xl">{title}</h3>
            {teaser && <p className="relative mt-3 line-clamp-2 text-base [overflow-wrap:anywhere]">{teaser}</p>}
            {/* The same footing as a written card, so names line up across a row. */}
            <div className="relative mt-auto pt-6">
              <div className="border-l border-muted pl-5">
                <p className="text-lg text-fg [overflow-wrap:anywhere]">{who}</p>
                <p className="mt-1 text-base">{label}</p>
              </div>
            </div>
          </>
        ) : image ? (
          <>
            <LoadingImage src={image} alt={cover?.alt || title} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 96vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            {hasVideo && (
              <span className="absolute top-[38%] left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl text-white shadow-[inset_0_0_6px_rgba(255,255,255,0.6)] backdrop-blur-[5px] transition-shadow group-hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.7)]">
                <Play width={22} height={22} />
              </span>
            )}
            <div className="relative mt-auto">
              <h3 className="h-card line-clamp-3 [overflow-wrap:anywhere]">{title}</h3>
              {teaser && <p className="mt-2 line-clamp-2 text-base text-soft [overflow-wrap:anywhere]">{teaser}</p>}
              <p className="mt-3 text-base text-fg [overflow-wrap:anywhere]">{who}</p>
            </div>
          </>
        ) : (
          <>
            <div aria-hidden className="glow absolute right-[-35%] bottom-[-40%] size-[110%] [--glow-strength:0.13]" />
            <svg aria-hidden width="21" height="17" viewBox="0 0 21 17" className="relative fill-white">
              <path d="M0 17V10.2C0 4.4 3 1 8.1 0l.9 2.4C6.3 3.3 5 5.2 4.8 7.8H9V17H0Zm12 0V10.2C12 4.4 15 1 20.1 0l.9 2.4c-2.7.9-4 2.8-4.2 5.4H21V17h-9Z" />
            </svg>
            {hasVideo && (
              <span className="absolute top-6 right-6 grid size-11 place-items-center rounded-xl border border-line bg-hair text-fg sm:top-8 sm:right-8">
                <Play width={18} height={18} />
              </span>
            )}
            <h3 className="relative mt-6 line-clamp-3 text-xl leading-[1.3] font-medium text-fg [overflow-wrap:anywhere] sm:text-2xl">{title}</h3>
            {teaser && <p className="relative mt-4 line-clamp-4 text-base [overflow-wrap:anywhere]">{teaser}</p>}
            <div className="relative mt-auto border-l border-muted pt-0 pl-5">
              <p className="text-lg text-fg [overflow-wrap:anywhere]">{who}</p>
              <p className="mt-1 text-base">{label}</p>
            </div>
          </>
        )}
        <Link href={href} className="absolute inset-0" aria-label={`${hasVideo ? 'Watch' : 'Read'}: ${title}`} />
      </div>
    </article>
  )
}
