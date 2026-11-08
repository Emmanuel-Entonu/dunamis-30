import type { Metadata } from 'next'
import { getImageProps } from 'next/image'
import { LoadingImage } from '@/components/LoadingImage'
import Link from '@/components/SiteLink'
import { notFound } from 'next/navigation'

import { ArrowRight, ChevronLeft } from '@/components/icons'
import { ShareButtons } from '@/components/ShareButtons'
import { TestimonyVideo } from '@/components/TestimonyVideo'
import { categoryLabels } from '@/lib/categories'
import { getTestimonyBySlug, mediaUrl, testimonyFormOpen } from '@/lib/content'
import { shareImage } from '@/lib/site'
import { findYouTubeLink, withoutYouTubeLinks } from '@/lib/video'
import { playableVideo, videoThumbnail } from '@/lib/youtube'

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = await getTestimonyBySlug((await params).slug)
  if (!t) return { title: 'Testimony not found' }
  const og = mediaUrl(t.photo ?? t.videoPoster ?? null, 'og')
  // With no photo, a shared link shows the YouTube video's own thumbnail.
  const thumb = og ? null : await videoThumbnail(t.videoLink).catch(() => null)
  return {
    title: t.title,
    description: t.teaser || undefined,
    openGraph: { type: 'article', title: t.title, description: t.teaser || undefined, images: og ? [{ url: og, width: 1200, height: 630 }] : thumb ? [{ url: thumb }] : [shareImage] },
  }
}

export default async function TestimonyPage({ params }: Params) {
  const { slug } = await params
  const [t, formOpen] = await Promise.all([getTestimonyBySlug(slug), testimonyFormOpen()])
  if (!t) notFound()

  const image = mediaUrl(t.photo ?? null, 'hero')
  const posterUrl = mediaUrl(t.videoPoster ?? t.photo ?? null, 'hero')
  const poster = posterUrl ? getImageProps({ src: posterUrl, alt: '', width: 860, height: 484 }).props.src : null
  // A video link, or a YouTube link pasted into the testimony (clips included), plays right on the page.
  // An uploaded file shows its size and length; its storage address is private and never reaches this page.
  const uploaded = Boolean(t.videoFile?.sizeBytes || t.videoFile?.durationSec)
  const link = t.videoUrl || (uploaded ? null : findYouTubeLink(t.summary, t.body))
  const video = await playableVideo(link)
  const summary = withoutYouTubeLinks(t.summary)
  const date = t.publishedAt ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(t.publishedAt)) : null
  const paragraphs = withoutYouTubeLinks(t.body).split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <article className="pt-[120px] pb-24 sm:pt-[150px]">
      <div className="container-site max-w-[860px]">
        <Link href="/testimonies" className="link-arrow text-base">
          <ChevronLeft width={20} height={20} /> All testimonies
        </Link>
        <p className="mt-8">
          <span className="rounded-lg bg-hair px-4 py-2 text-sm text-fg">{categoryLabels[t.category] ?? 'Testimony'}</span>
        </p>
        <h1 className="h-hero mt-6 !text-[clamp(2rem,1.4rem+2.6vw,3.25rem)]">{t.title}</h1>
        <p className="mt-4 text-base">
          {[t.name, t.location, date].filter(Boolean).join(' · ')}
        </p>

        {uploaded && !t.videoUrl ? (
          <TestimonyVideo src={`/watch/testimony/${t.id}`} poster={poster} title={t.title} width={t.videoFile?.width} height={t.videoFile?.height} className="mt-10" />
        ) : video ? (
          <div className="card mt-10 aspect-video overflow-hidden">
            <iframe src={video} title={t.title} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
          </div>
        ) : image ? (
          <div className="card relative mt-10 aspect-[16/10] overflow-hidden">
            <LoadingImage src={image} alt={t.title} fill priority sizes="(min-width: 900px) 860px, 100vw" className="object-cover" />
          </div>
        ) : null}

        {summary && <p className="mt-10 text-xl leading-relaxed text-fg [overflow-wrap:anywhere] sm:text-2xl">{summary}</p>}
        {paragraphs.length > 0 && (
          <div className={`${summary ? 'mt-8' : 'mt-10'} grid gap-5 text-lg leading-relaxed [overflow-wrap:anywhere]`}>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        {link && !video && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-8">
            Watch the video
          </a>
        )}

        <div className="mt-12 border-t border-hair pt-8">
          <ShareButtons url={`/testimonies/${slug}`} text={`${t.title}: a testimony from Dunamis`} />
        </div>

        {formOpen && (
          <div className="card mt-12 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="h-card">Has God done something for you too?</h2>
              <p className="mt-2">We’d love to hear about it.</p>
            </div>
            <Link href="/testimonies#share" className="btn btn-primary self-start sm:self-auto">
              Share your testimony <ArrowRight width={18} height={18} />
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}
