import type { Metadata } from 'next'
import { getImageProps } from 'next/image'
import { LoadingImage } from '@/components/LoadingImage'
import Link from '@/components/SiteLink'
import { notFound } from 'next/navigation'

import { BeforeAfter } from '@/components/BeforeAfter'
import { StarList } from '@/components/blocks'
import { ArrowRight, ChevronLeft } from '@/components/icons'
import { ShareButtons } from '@/components/ShareButtons'
import { getSonsStoryBySlug, mediaUrl } from '@/lib/content'
import { shareImage } from '@/lib/site'
import { findYouTubeLink, withoutYouTubeLinks } from '@/lib/video'
import { playableVideo, videoThumbnail } from '@/lib/youtube'
import { TestimonyVideo } from '@/components/TestimonyVideo'

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const s = await getSonsStoryBySlug((await params).slug)
  if (!s) return { title: 'Story not found' }
  const title = s.headline ? `${s.headline}: ${s.name}` : s.name
  const description = s.before?.slice(0, 180) || `The story of ${s.name}, a son of the ministry at Dunamis International Gospel Centre.`
  const og = mediaUrl(s.afterPhoto ?? s.beforePhoto ?? s.videoPoster ?? null, 'og')
  // With no photo, a shared link shows the YouTube video's own thumbnail.
  const thumb = og ? null : await videoThumbnail(s.videoLink).catch(() => null)
  return {
    title,
    description,
    openGraph: { type: 'article', title, description, images: og ? [{ url: og, width: 1200, height: 630 }] : thumb ? [{ url: thumb }] : [shareImage] },
  }
}

export default async function SonsStoryPage({ params }: Params) {
  const { slug } = await params
  const s = await getSonsStoryBySlug(slug)
  if (!s) notFound()

  const before = mediaUrl(s.beforePhoto ?? null, 'hero')
  const after = mediaUrl(s.afterPhoto ?? null, 'hero')
  const single = after || before
  const story = s.story ?? {}
  // A video link, or a YouTube link pasted into the story (clips included), plays right on the page.
  // An uploaded file shows its size and length; its storage address is private and never reaches this page.
  const uploaded = Boolean(s.videoFile?.sizeBytes || s.videoFile?.durationSec)
  const link = s.videoUrl || (uploaded ? null : findYouTubeLink(story.before, story.encounter, story.transformation, story.today, story.meaning, s.appreciation))
  const video = await playableVideo(link)
  const appreciation = withoutYouTubeLinks(s.appreciation)
  const posterUrl = mediaUrl(s.videoPoster ?? s.afterPhoto ?? s.beforePhoto ?? null, 'hero')
  const poster = posterUrl ? getImageProps({ src: posterUrl, alt: '', width: 860, height: 484 }).props.src : null
  const chapters = [
    { title: 'Who I was', text: story.before },
    { title: 'My journey and encounter', text: story.encounter },
    { title: 'What changed', text: story.transformation },
    { title: 'Where I am today', text: story.today },
    { title: 'What Dunamis means to me', text: story.meaning },
  ]
    .map((c) => ({ ...c, text: withoutYouTubeLinks(c.text) }))
    .filter((c) => c.text)

  return (
    <article className="pt-[120px] pb-24 sm:pt-[150px]">
      <div className="container-site max-w-[860px]">
        <Link href="/sons-of-the-prophet" className="link-arrow text-base">
          <ChevronLeft width={20} height={20} /> All stories
        </Link>
        <h1 className="h-hero mt-8 !text-[clamp(2rem,1.4rem+2.6vw,3.25rem)]">{s.headline || s.name}</h1>
        <p className="mt-4 text-base">{[s.headline ? s.name : null, s.currentRole, s.location].filter(Boolean).join(' · ')}</p>

        {before && after ? (
          <BeforeAfter before={before} after={after} name={s.name} className="card mt-10 aspect-[4/3]" />
        ) : single ? (
          <div className="card relative mt-10 aspect-[16/10] overflow-hidden">
            <LoadingImage src={single} alt={s.name} fill priority sizes="(min-width: 900px) 860px, 100vw" className="object-cover" />
          </div>
        ) : null}

        {uploaded && !s.videoUrl && (
          <TestimonyVideo src={`/watch/story/${s.id}`} poster={poster} title={`Video: ${s.name}`} width={s.videoFile?.width} height={s.videoFile?.height} className="mt-6" />
        )}
        {video && (
          <div className="card mt-6 aspect-video overflow-hidden">
            <iframe src={video} title={`Video interview: ${s.name}`} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
          </div>
        )}
        {link && !video && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-6">
            Watch the video
          </a>
        )}

        {chapters.length > 0 && (
          <div className="mt-12 grid gap-10">
            {chapters.map((c) => (
              <section key={c.title}>
                <h2 className="h-section">{c.title}</h2>
                <div className="mt-4 grid gap-4 text-lg leading-relaxed [overflow-wrap:anywhere]">
                  {c.text!.split(/\n{2,}|\r\n\r\n/).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {s.milestones && s.milestones.length > 0 && (
          <div className="card mt-12 p-5 sm:p-10">
            <h2 className="h-card">Ministry and career milestones</h2>
            <div className="mt-4">
              <StarList items={s.milestones.map((m) => (m.year ? `${m.year}: ${m.text}` : m.text))} />
            </div>
          </div>
        )}

        {appreciation && (
          <div className="relative isolate mt-6 overflow-hidden rounded-2xl border-2 border-white/[0.11] bg-surface p-6 sm:p-10">
            <div aria-hidden className="flare absolute inset-x-0 bottom-0 -z-10 h-full opacity-40" />
            <p className="text-xl leading-relaxed text-fg [overflow-wrap:anywhere] sm:text-2xl">“{appreciation}”</p>
            <p className="mt-4 text-base">{s.name}</p>
          </div>
        )}

        <div className="mt-12 border-t border-hair pt-8">
          <ShareButtons url={`/sons-of-the-prophet/${slug}`} text={`${s.headline || s.name}: a Sons of the Prophet story`} />
        </div>

        <div className="card mt-12 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="h-card">Raised through Dunamis too?</h2>
            <p className="mt-2">We’d love to hear your story.</p>
          </div>
          <Link href="/sons-of-the-prophet#share" className="btn btn-primary self-start sm:self-auto">
            Share your story <ArrowRight width={18} height={18} />
          </Link>
        </div>
      </div>
    </article>
  )
}
