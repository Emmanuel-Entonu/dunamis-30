import type { Metadata } from 'next'
import { LoadingImage } from '@/components/LoadingImage'
import Link from '@/components/SiteLink'

import { glass } from '@/assets/glass'
import { ClosingBand, FeatureTile, FormStage, GlassArt, ShowcaseCard } from '@/components/blocks'
import { ArrowRight, Play } from '@/components/icons'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { getSonsStories, mediaUrl, type CardSonsStory } from '@/lib/content'
import { StoryForm } from './StoryForm'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Sons of the Prophet',
  description: 'Before and after stories from people raised, nurtured and changed through Dunamis International Gospel Centre.',
}

function StoryCard({ story }: { story: CardSonsStory }) {
  const before = mediaUrl(story.beforePhoto, 'card')
  const after = mediaUrl(story.afterPhoto ?? story.videoPoster, 'card')
  // With no photo at all, the YouTube video's own thumbnail fills the frame.
  const thumb = before || after ? null : story.videoThumb
  const href = `/sons-of-the-prophet/${story.slug}`
  const title = story.headline || story.name

  return (
    <article className="card group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-hair">
        {before && after ? (
          <div className="grid h-full grid-cols-2 gap-0.5">
            <LoadingImage src={before} alt={`${story.name} before`} width={400} height={400} sizes="(min-width: 1024px) 200px, 48vw" className="h-full w-full object-cover" />
            <LoadingImage src={after} alt={`${story.name} today`} width={400} height={400} sizes="(min-width: 1024px) 200px, 48vw" className="h-full w-full object-cover" />
          </div>
        ) : after || before ? (
          <LoadingImage src={(after || before)!} alt={story.name} fill sizes="(min-width: 1024px) 400px, 96vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : thumb ? (
          <>
            {/* The thumbnail whole, titles and all, on a blurred copy of itself. The widescreen frame also trims the
                black bands YouTube's smaller thumbnail carries, and the enlarged backdrop pushes them out of sight. */}
            <LoadingImage src={thumb} alt="" fill sizes="(min-width: 1024px) 400px, 96vw" className="scale-150 object-cover opacity-60 blur-2xl" />
            <div className="absolute inset-x-0 top-1/2 aspect-video -translate-y-1/2 overflow-hidden">
              <LoadingImage src={thumb} alt={story.name} fill sizes="(min-width: 1024px) 400px, 96vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center">
            <GlassArt art={glass.crown} className="w-[130px]" />
          </div>
        )}
        {story.hasVideo && (
          <span aria-hidden className="absolute top-4 right-4 grid size-11 place-items-center rounded-xl bg-black/35 text-white shadow-[inset_0_0_6px_rgba(255,255,255,0.6)] backdrop-blur-[5px]">
            <Play width={18} height={18} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <h3 className="h-card line-clamp-3 transition-colors [overflow-wrap:anywhere] group-hover:text-gold">{title}</h3>
        {story.before && <p className="mt-3 line-clamp-3 text-base">{story.before}</p>}
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="min-w-0 text-base">
            <span className="block truncate text-fg">{story.name}</span>
            {(story.currentRole || story.location) && <span className="block truncate">{story.currentRole || story.location}</span>}
          </span>
          <span className="link-arrow shrink-0 text-base">
            {story.hasVideo ? 'Watch' : 'Read'} <ArrowRight width={20} height={20} />
          </span>
        </div>
      </div>
      <Link href={href} className="absolute inset-0" aria-label={`${story.hasVideo ? 'Watch' : 'Read'} the story of ${story.name}`} />
    </article>
  )
}

export default async function SonsPage() {
  const stories = await getSonsStories()

  return (
    <>
      <PageHero eyebrow="Sons of the Prophet" title="Sons of the Prophet" intro="The stories, the journey, the transformation." />

      {/* The invitation */}
      <section>
        <div className="container-site">
          <ShowcaseCard
            visual={<GlassArt art={glass.crown} className="w-[60%] max-w-[340px]" dots="inset-[-35%]" />}
            title="Did this house raise you?"
            text={<p>Many people can point to Dunamis as the place that shaped them. If that’s you, we’d love to hear who you were when you came, and who you are now.</p>}
            actions={
              <>
                <a href="#share" className="btn btn-primary">
                  Share your story
                </a>
                {stories.length > 0 && (
                  <a href="#stories" className="btn btn-outline">
                    Read the stories
                  </a>
                )}
              </>
            }
          />
        </div>
      </section>

      {stories.length > 0 && (
        <section id="stories" className="section scroll-mt-16">
          <div className="container-site">
            <h2 className="h-section">Their stories</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-[60px] lg:grid-cols-3">
              {stories.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What every story tells */}
      <section className="section">
        <div className="container-site">
          <Reveal>
            <h2 className="h-section">What we’d love you to tell us</h2>
            <p className="mt-4 max-w-[560px]">Write as much or as little as you like. Add photos, a video, and any milestones along the way.</p>
          </Reveal>
          <div className="mt-10 flex flex-col gap-4 sm:gap-[25px] lg:mt-[60px]">
            <div className="flex flex-col gap-4 sm:gap-[25px] lg:flex-row">
              <FeatureTile className="lg:flex-1" label="Before" title="Who you were" text="Where you were in life when you first came to Dunamis." art={glass.person} />
              <FeatureTile className="lg:flex-[1.6]" label="The encounter" title="What happened" text="The service, the word, the moment God met you through this ministry." art={glass.flame} delay={100} />
            </div>
            <div className="flex flex-col gap-4 sm:gap-[25px] lg:flex-row">
              <FeatureTile className="lg:flex-[1.6]" label="The change" title="What changed" text="In your walk with God, your family, your calling, your work." art={glass.dove} />
              <FeatureTile className="lg:flex-1" label="Today" title="Where you are now" text="What you’re doing today, and how you got there." art={glass.cap} delay={100} />
            </div>
            <FeatureTile label="In your words" title="What Dunamis means to you" text="A personal word of thanks to the house that raised you." art={glass.heart} />
          </div>
        </div>
      </section>

      <FormStage id="share" title="Share your story and become part of the 30-year legacy" text="Our communications team reads every story before it goes up. Your contacts stay private. If you’d rather not write, you can upload a video instead.">
        <StoryForm />
      </FormStage>

      <ClosingBand
        title="Know someone who should tell their story?"
        text="Send them this page."
        shareUrl="/sons-of-the-prophet"
        shareText="Sons of the Prophet: share your story for Dunamis at 30"
      />
    </>
  )
}
