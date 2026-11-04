import type { Metadata } from 'next'
import Image from 'next/image'
import Link from '@/components/SiteLink'

import { GlassImage } from '@/components/GlassImage'
import anointingBook from '@/assets/books/anointing-of-the-holy-spirit.webp'
import formerLatterRain from '@/assets/books/former-and-latter-rain.webp'
import triggersBook from '@/assets/books/triggers-of-the-move-of-god.webp'
import { glass } from '@/assets/glass'
import { ClosingBand, FeatureTile, GlassArt, GlassTile, PhotoWithGlass, ShowcaseCard, SplitHeader, StorySplit } from '@/components/blocks'
import { ArrowRight, Play } from '@/components/icons'
import { ScrubText } from '@/components/motion'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { blurFor } from '@/lib/image'
import { getPastorPage, mediaUrl } from '@/lib/content'
import { photos } from '@/lib/photos'
import { embedUrl } from '@/lib/video'
import type { Media } from '@/payload-types'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Our Senior Pastor: Dr. Paul Enenche',
  description: 'The life and calling of Dr. Paul Enenche, founder and senior pastor of Dunamis International Gospel Centre.',
  openGraph: { images: [{ url: photos.pastorPaulPreaching.src, width: photos.pastorPaulPreaching.width, height: photos.pastorPaulPreaching.height }] },
}

const asMedia = (value: unknown) => (value && typeof value === 'object' ? (value as Media) : null)

const paragraphs = (text: string) => text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)

const defaultAchievements = [
  { year: '1996', text: 'Founds Dunamis International Gospel Centre in Abuja.' },
  { year: '2014', text: 'The foundation of the Glory Dome is laid.' },
  { year: '2018', text: 'The Glory Dome is dedicated, finished without debt.' },
  { year: '2023', text: 'Benue State University gives him an honorary doctorate in divinity.' },
]

const books = [
  { title: 'The Anointing of the Holy Spirit', cover: anointingBook },
  { title: 'The Former and the Latter Rain', cover: formerLatterRain },
  { title: 'Triggers of the End-Time Move of God', cover: triggersBook },
]

export default async function SeniorPastorPage() {
  const page = await getPastorPage()
  const portrait = mediaUrl(asMedia(page.portrait), 'hero')
  const name = page.fullName || 'Dr. Paul Enenche'
  const achievements = page.achievements?.items?.length ? page.achievements.items : defaultAchievements
  const videos = (page.videos ?? []).map((v) => ({ ...v, embed: embedUrl(v.url) }))

  return (
    <>
      <PageHero eyebrow="Our Senior Pastor" title="The Visionary Leader" intro="The life and calling of the founder and senior pastor of Dunamis." />

      {/* The official portrait with a glass crown */}
      <section>
        <div className="container-site">
          <ShowcaseCard
            visual={
              <div className="relative w-[78%] max-w-[380px]">
                <div aria-hidden className="dots absolute inset-[-22%]" />
                <div className="relative aspect-[5/7] overflow-hidden rounded-2xl border border-line">
                  <Image src={portrait || photos.pastorPaulPreaching} alt={name} fill sizes="(min-width: 1024px) 380px, 78vw" placeholder={blurFor(portrait || photos.pastorPaulPreaching)} className="object-cover" />
                </div>
                <GlassImage src={glass.crown} className="absolute -top-9 -right-7 h-auto w-[104px] rotate-[10deg] drop-shadow-[0_18px_26px_rgba(0,0,0,0.8)] sm:-top-12 sm:-right-14 sm:w-[160px]" />
              </div>
            }
            title={name}
            text={
              page.biography?.body ? (
                paragraphs(page.biography.body)
              ) : (
                <>
                  <p className="text-gold-light">Founder and Senior Pastor, Dunamis International Gospel Centre</p>
                  <p>He worked as a medical doctor until 1996, when he put his certificate aside to start a church in Abuja. He leads Dunamis with his wife, Dr. Becky Paul-Enenche, who is also a doctor and a senior pastor.</p>
                  <p>Benue State University gave him an honorary doctorate in divinity in 2023. He also writes and sings gospel music.</p>
                </>
              )
            }
            actions={
              <>
                <a href="#calling" className="btn btn-primary">
                  Read his story
                </a>
                <a href="#messages" className="btn btn-outline">
                  Watch messages
                </a>
              </>
            }
          />
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <ScrubText
            as="h2"
            text={page.biography?.heading || 'He had a job in a hospital and plans to study in London. God asked him to put it all aside.'}
            className="max-w-[1040px] text-[clamp(1.75rem,1.2rem+2.8vw,3.75rem)] leading-[1.18] font-medium tracking-[-0.02em] text-fg"
          />
        </div>
      </section>

      {/* B — Spiritual journey and calling */}
      <section id="calling" className="section scroll-mt-16">
        <div className="container-site">
          <StorySplit
            title={page.calling?.heading || 'From medicine to ministry'}
            visual={<PhotoWithGlass photo={mediaUrl(asMedia(page.calling?.image), 'hero') || photos.prayerBlackWhite} alt="A woman in prayer during a service" art={glass.cross} />}
          >
            {page.calling?.body ? (
              paragraphs(page.calling.body)
            ) : (
              <>
                <p>In May 1996 he went to seek God about what to do next, and spent three days fasting on a mountain outside Jos. He was told to go to Abuja and start a church that would restore human destiny and dignity.</p>
                <p>Dr. Becky prayed about it herself and confirmed it. They left their jobs and went, and for the first 13 months they lived in one room in Zone 7.</p>
              </>
            )}
          </StorySplit>
        </div>
      </section>

      {/* C — Ministry and leadership */}
      <section className="section">
        <div className="container-site">
          <SplitHeader title={page.leadership?.heading || 'What he’s given his life to'}>
            <p>{page.leadership?.body || 'Thirty years of preaching, praying for people and raising others to do the same.'}</p>
          </SplitHeader>
          <div className="mt-10 flex flex-col gap-4 sm:gap-[25px] lg:mt-[60px]">
            <div className="flex flex-col gap-4 sm:gap-[25px] lg:flex-row">
              <FeatureTile className="lg:flex-[1.6]" label="The word" title="Teaching" text="The Seeds of Destiny devotional, midnight prayer on Commanding the Day at 11pm every night, and weekly services at the Glory Dome." art={glass.bible} />
              <FeatureTile className="lg:flex-1" label="The harvest" title="Winning souls" text="Crusades since the early days of the Gospel Power Team have led hundreds of thousands to Christ." art={glass.flame} delay={100} />
            </div>
            <div className="flex flex-col gap-4 sm:gap-[25px] lg:flex-row">
              <FeatureTile className="lg:flex-1" label="The leaders" title="Raising ministers" text="Ministers from 48 nations came to the Flaming Fire conference in 2023." art={glass.mic} />
              <FeatureTile className="lg:flex-[1.6]" label="The nations" title="Going far beyond Abuja" text="People from Nigeria and 53 other countries came for Kingdom Power & Glory in 2023." art={glass.flag} delay={100} />
            </div>
          </div>
        </div>
      </section>

      {/* D — Achievements: a big glass 30 beside the years */}
      <section className="section">
        <div className="container-site">
          <Reveal as="h2" className="h-section max-w-[640px]">
            {page.achievements?.heading || 'Some dates that matter'}
          </Reveal>
          <div className="mt-10 grid gap-4 sm:gap-[25px] lg:mt-[60px] lg:grid-cols-[1fr_1.1fr]">
            <Reveal className="card group relative grid min-h-[320px] place-items-center overflow-hidden p-8 lg:min-h-0">
              <GlassArt art={glass.thirty} className="w-[80%] max-w-[420px]" dots="inset-[-25%]" />
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-[25px]">
              {achievements.map((a, i) => (
                <Reveal key={`${a.year}-${i}`} delay={(i % 2) * 80} className="card flex min-h-[200px] flex-col justify-between gap-6 p-5 sm:min-h-[250px] sm:p-8">
                  <p className="text-[clamp(1.75rem,1.5rem+1.2vw,2.5rem)] leading-none font-medium tracking-[-0.02em] text-gold-light">{a.year}</p>
                  <p className="text-base text-fg sm:text-lg">{a.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* E — Family */}
      <section className="section">
        <div className="container-site">
          <StorySplit
            flip
            title={page.family?.heading || 'He and Dr. Becky'}
            visual={<PhotoWithGlass photo={mediaUrl(asMedia(page.family?.image), 'hero') || photos.seniorPastors} alt="Dr. Paul Enenche and Dr. Becky Paul-Enenche in Basotho blankets, arriving in Lesotho" art={glass.heart} className="mx-auto aspect-square max-w-[470px]" />}
          >
            {page.family?.body ? (
              paragraphs(page.family.body)
            ) : (
              <p>When the call came, Dr. Becky was nursing their first baby, only a few months old. She’s a medical doctor too, and she stepped out with him. They’ve led the church side by side ever since.</p>
            )}
          </StorySplit>
        </div>
      </section>

      {/* F — Messages and video highlights */}
      <section id="messages" className="section scroll-mt-16">
        <div className="container-site">
          <Reveal as="h2" className="h-section">
            Watch and listen
          </Reveal>

          {videos.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-[60px]">
              {videos.map((v) => (
                <Reveal key={v.id ?? v.url}>
                  {v.embed ? (
                    <div className="card aspect-video overflow-hidden">
                      <iframe src={v.embed} title={v.title} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
                    </div>
                  ) : (
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="card grid aspect-video place-items-center text-fg transition-colors hover:text-gold">
                      <Play width={36} height={36} />
                    </a>
                  )}
                  <h3 className="h-card mt-4">{v.title}</h3>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:gap-[25px] lg:mt-[60px] lg:grid-cols-3">
              <GlassTile
                title="His messages"
                text="Sermons and teachings on YouTube."
                art={glass.mic}
                action={
                  <a href="https://www.youtube.com/@DrPastorPaulEnenche" target="_blank" rel="noopener noreferrer" className="btn-chip">
                    Watch on YouTube
                  </a>
                }
              />
              <GlassTile
                delay={80}
                title="Dunamis TV"
                text="Services and programmes from the Glory Dome."
                art={glass.play}
                action={
                  <a href="https://www.youtube.com/@dunamistvworldwide" target="_blank" rel="noopener noreferrer" className="btn-chip">
                    Watch Dunamis TV
                  </a>
                }
              />
              <GlassTile
                delay={160}
                title="Seeds of Destiny"
                text="His daily devotional, on the app and online."
                art={glass.sprout}
                action={
                  <a href="https://dunamisgospel.org/seeds-of-destiny/" target="_blank" rel="noopener noreferrer" className="btn-chip">
                    Read today’s seed
                  </a>
                }
              />
            </div>
          )}

          {/* Books */}
          <div className="mt-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mt-[100px]">
            <Reveal as="h3" className="h-section max-w-[520px]">
              His newest books
            </Reveal>
            <a href="https://dunamisgospel.org/" target="_blank" rel="noopener noreferrer" className="btn btn-outline self-start sm:self-auto">
              Read online
            </a>
          </div>
          <div className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-5">
            {books.map((b, i) => (
              <Reveal key={b.title} delay={i * 80} as="article" className="group relative">
                <div className="card bg-ticks relative grid aspect-[387/430] place-items-center overflow-hidden">
                  <div aria-hidden className="absolute inset-x-[20%] bottom-[8%] h-1/2 rounded-full bg-gold/20 blur-[80px]" />
                  <Image src={b.cover} alt={`${b.title} by Paul Enenche MD`} placeholder="blur" sizes="(min-width: 640px) 220px, 56vw" className="relative w-[56%] rounded-md shadow-[0_30px_50px_-15px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:-translate-y-2" />
                </div>
                <h4 className="h-card mt-5 transition-colors group-hover:text-gold">{b.title}</h4>
                <a href="https://dunamisgospel.org/" target="_blank" rel="noopener noreferrer" className="link-arrow mt-3 after:absolute after:inset-0">
                  Read now <ArrowRight width={22} height={22} />
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ClosingBand
        title="Come and celebrate with them"
        text="Join Dr. Paul and Dr. Becky at the Glory Dome on 10 November, or tell us what this ministry has meant to you."
        shareUrl="/senior-pastor"
        shareText="Dr. Paul Enenche, founder and senior pastor of Dunamis"
      >
        <Link href="/social-card" className="btn btn-primary">
          I Am Attending
        </Link>
        <Link href="/sons-of-the-prophet#share" className="btn btn-outline">
          Share your story
        </Link>
      </ClosingBand>
    </>
  )
}
