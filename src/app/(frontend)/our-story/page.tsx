import type { Metadata } from 'next'
import Image, { type StaticImageData } from 'next/image'
import Link from '@/components/SiteLink'

import { GlassImage } from '@/components/GlassImage'
import { glass } from '@/assets/glass'
import { ClosingBand, GlassArt, GlobalPresence, Label, PhotoWithGlass, ShowcaseCard, StorySplit } from '@/components/blocks'
import { Carousel } from '@/components/home/Carousel'
import { CountUp, ScrubText, StackedCards } from '@/components/motion'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { blurFor } from '@/lib/image'
import { getMilestones, getStoryPage, mediaUrl } from '@/lib/content'
import { defaultMilestones, defaultStats, vision, type GlassKey } from '@/lib/ministry'
import { photoByFile, photos } from '@/lib/photos'
import type { Media } from '@/payload-types'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'How Dunamis International Gospel Centre began: a three-day fast near Jos in 1996, a move to Abuja, and thirty years of God’s faithfulness.',
}

type TimelineItem = { key: string | number; date: string; title: string; text: string; image: StaticImageData | string | null; alt: string; art: GlassKey }

const asMedia = (value: unknown) => (value && typeof value === 'object' ? (value as Media) : null)

/** One chapter of the timeline. Always fits the screen, so nothing is hidden when the next card slides over. */
function MilestoneCard({ item }: { item: TimelineItem }) {
  return (
    <article className="card grid h-[calc(100svh-124px)] grid-rows-[minmax(0,1fr)_auto] overflow-hidden lg:h-[min(560px,calc(100svh-124px))] lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1">
      <div className="relative order-2 flex flex-col justify-between gap-5 p-5 sm:p-10 lg:order-1 lg:p-[60px]">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[clamp(1.75rem,1.4rem+2vw,3.25rem)] leading-[1.1] font-medium tracking-[-0.02em] text-fg">{item.date}</p>
          <GlassImage src={glass[item.art]} className="h-auto w-[64px] shrink-0 sm:w-[110px] lg:w-[140px]" />
        </div>
        <div>
          <h3 className="h-card">{item.title}</h3>
          <p className="mt-2.5 text-[15px] leading-snug sm:text-lg sm:leading-normal">{item.text}</p>
        </div>
      </div>
      <div className="relative order-1 min-h-0 lg:order-2">
        {item.image ? (
          <Image src={item.image} alt={item.alt} fill sizes="(min-width: 1024px) 580px, 96vw" placeholder={blurFor(item.image)} className="object-cover" />
        ) : (
          <div className="bg-ticks grid h-full place-items-center">
            <GlassArt art={glass[item.art]} className="w-[160px]" />
          </div>
        )}
      </div>
    </article>
  )
}

const values: { label: string; title: string; text: string; art: StaticImageData }[] = [
  { label: 'Our vision', title: 'Restoring people', text: vision.vision, art: glass.crown },
  { label: 'Our mission', title: 'Filling the earth', text: vision.mission, art: glass.world },
  { label: 'Our goal', title: 'Evidence everywhere', text: vision.goal, art: glass.person },
  { label: 'Principles', title: 'You can hear the gospel', text: 'So we teach the word plainly, in a way people can live by.', art: glass.bible },
  { label: 'Presence', title: 'You can feel the gospel', text: 'So we make room for God’s presence, in worship and in prayer.', art: glass.dove },
  { label: 'Power', title: 'You can see the gospel', text: 'In people healed, delivered and lifted. That’s what the word dunamis means to us.', art: glass.flame },
]

export default async function OurStoryPage() {
  const [page, cmsMilestones] = await Promise.all([getStoryPage(), getMilestones()])

  const timeline: TimelineItem[] = cmsMilestones.length
    ? cmsMilestones.map((m) => {
        const media = asMedia(m.image)
        return { key: m.id, date: m.dateLabel || String(m.year), title: m.title, text: m.description ?? '', image: mediaUrl(media, 'hero'), alt: media?.alt || m.title, art: 'flame' as const }
      })
    : defaultMilestones.map((m) => ({ key: m.key, date: m.date, title: m.title, text: m.text, image: m.photo ? photoByFile[m.photo] : null, alt: m.title, art: m.art }))

  const cmsValues = page.vision?.coreValues ?? []
  const shownValues = cmsValues.length ? cmsValues.map((v, i) => ({ ...values[i % values.length], label: 'Core value', title: v.value, text: '' })) : values

  return (
    <>
      <PageHero eyebrow="Our Story" title="Our story: 30 years of God’s faithfulness" intro="How one fast on a mountain near Jos became a church that fills a 100,000-seat dome." />

      {/* The story in one card */}
      <section>
        <div className="container-site">
          <ShowcaseCard
            visual={<GlassArt art={glass.flame} className="w-[56%] max-w-[300px]" dots="inset-[-40%]" />}
            title={page.beginning?.heading || 'It started with one instruction'}
            text={<p>{page.beginning?.body?.split(/\n{2,}/)[0] || 'Go to Abuja and start a gospel outreach. That was it. Everything you see today grew out of a young couple saying yes.'}</p>}
            actions={
              <a href="#journey" className="btn btn-primary">
                See the journey
              </a>
            }
            stats={[
              { value: '1996', text: 'Founded in Abuja on 10 November.' },
              { value: '2026', text: 'Thirty years on, and still going.' },
            ]}
          />
        </div>
      </section>

      {/* A — The Beginning */}
      <section className="section">
        <div className="container-site">
          <ScrubText
            as="h2"
            text="In May 1996, a young doctor went up a mountain outside Jos to fast and pray. He came down knowing he had to leave medicine and go to Abuja."
            className="max-w-[1040px] text-[clamp(1.75rem,1.2rem+2.8vw,3.75rem)] leading-[1.18] font-medium tracking-[-0.02em] text-fg"
          />

          <div className="mt-14 lg:mt-24">
            <StorySplit title="How it began" visual={<PhotoWithGlass photo={mediaUrl(asMedia(page.beginning?.image), 'hero') || photos.prayerBlackWhite} alt="A woman in prayer during a service" art={glass.mountain} />}>
              <p>Dr. Paul Enenche and his wife, Dr. Becky, were both working in hospitals at the time, and thinking about further study in London. She fasted and prayed as well, and she came to the same conclusion.</p>
              <p>The first outreach held that July, in the banquet hall of the Agura Hotel. They left their jobs and moved to Abuja, and for 13 months home was one room in Zone 7.</p>
            </StorySplit>
          </div>
        </div>
      </section>

      {/* B — Vision and mandate */}
      <div className="section">
        <Carousel
          label="The vision and mandate of Dunamis"
          header={
            <Reveal>
              <h2 className="h-section max-w-[560px]">{page.vision?.heading || 'What we believe we’re here to do'}</h2>
              <p className="mt-4 max-w-[560px]">{page.vision?.body || 'Dunamis is the Greek word for power, from Acts 1:8.'}</p>
            </Reveal>
          }
        >
          {shownValues.map((c) => (
            <article key={c.label + c.title} className="card group relative flex h-full min-h-[400px] flex-col justify-between gap-24 overflow-hidden p-5 sm:min-h-[460px] sm:p-10">
              <Label className="relative z-10">{c.label}</Label>
              <GlassArt art={c.art} className="!absolute -top-6 right-[-5%] w-[52%] max-w-[260px]" dots="inset-[-35%]" />
              <div className="relative">
                <h3 className="h-card">{c.title}</h3>
                {c.text && <p className="mt-3 text-base sm:text-lg">{c.text}</p>}
              </div>
            </article>
          ))}
        </Carousel>
      </div>

      {/* C — The journey: the cards pile up as you scroll */}
      <section id="journey" className="section scroll-mt-16">
        <div className="container-site">
          <Reveal as="h2" className="h-section max-w-[640px]">
            The journey so far
          </Reveal>
          <StackedCards className="mt-10 lg:mt-[60px]">
            {timeline.map((item) => (
              <MilestoneCard key={item.key} item={item} />
            ))}
          </StackedCards>
        </div>
      </section>

      {/* D — Global impact */}
      <GlobalPresence
        title={page.globalImpact?.heading || 'Where we are now'}
        text={page.globalImpact?.body || 'Churches and home fellowships around the world, and visitors to the Glory Dome from over a hundred countries.'}
        stats={
          <div className="relative z-10 -mt-4 grid grid-cols-2 gap-4 sm:gap-[25px] lg:grid-cols-4">
            {defaultStats.slice(0, 4).map((s, i) => (
              <Reveal key={s.label} delay={i * 80} className="card p-5 sm:p-8">
                <CountUp value={s.value} suffix={s.suffix} className="block text-[clamp(1.75rem,1.3rem+2vw,3.25rem)] leading-none font-medium text-fg" />
                <p className="mt-3 text-[15px] leading-snug sm:text-lg">{s.label}</p>
              </Reveal>
            ))}
          </div>
        }
      />

      {/* E — Legacy (the campaign's own line) */}
      <section className="section">
        <div className="container-site text-center">
          <ScrubText
            as="h2"
            text={page.legacy?.heading || 'One ministry. Thirty years. Millions of stories. One continuing legacy.'}
            className="mx-auto max-w-[920px] text-[clamp(2rem,1.3rem+3.4vw,4.25rem)] leading-[1.15] font-medium tracking-[-0.02em] text-fg"
          />
          <Reveal>
            <p className="mx-auto mt-8 max-w-[600px]">{page.legacy?.body || 'We’re grateful for all of it, and we’re not done. The vision is the same as it was in 1996.'}</p>
          </Reveal>
        </div>
      </section>

      <ClosingBand
        title="You’re part of this story"
        text="Come on 10 November, or tell us what God has done in your life."
        shareUrl="/our-story"
        shareText="The story of Dunamis International Gospel Centre, 30 years on"
      >
        <Link href="/social-card" className="btn btn-primary">
          I Am Attending
        </Link>
        <Link href="/testimonies#share" className="btn btn-outline">
          Share your testimony
        </Link>
      </ClosingBand>
    </>
  )
}
