import Image, { getImageProps } from 'next/image'
import Link from '@/components/SiteLink'

import sampleCard from '@/assets/brand/sample-card.webp'
import { glass } from '@/assets/glass'
import kpgGuests from '@/assets/guests/kpg-guests.webp'
import { renders } from '@/assets/renders'
import { GlassImage } from '@/components/GlassImage'
import { GlassArt, IconTile, Label, ShowcaseCard, SplitHeader, StarList } from '@/components/blocks'
import { FlipCountdown } from '@/components/Countdown'
import { FallingLines } from '@/components/FallingLines'
import { Faq } from '@/components/Faq'
import { CardScene } from '@/components/home/CardScene'
import CircularCarousel from '@/components/home/CircularCarousel'
import { HeroHand, HeroTubes } from '@/components/home/HeroHand'
import { SleeveCard } from '@/components/home/SleeveCard'
import { YearStack } from '@/components/home/YearStack'
import { ArrowRight, BookOpen, Calendar, CrossIcon, Crown, Flame, Globe, Heart, MapPin, Share, Sparkle } from '@/components/icons'
import { Reveal } from '@/components/Reveal'
import { getEvent, getHomepage, getSite } from '@/lib/content'
import { defaultFaqs, directionsUrl } from '@/lib/ministry'
import { defaultGallery, photos } from '@/lib/photos'
import { defaults, kpg } from '@/lib/site'

export const revalidate = 60

/** The official photographs on the Moments ring, by their gallery key. */
const momentKeys = ['eyes', 'cameroon', 'wide', 'tears', 'prayer', 'celebration', 'singing', 'pews', 'raised', 'ministering']
const moments = momentKeys.flatMap((key) => {
  const photo = defaultGallery.find((g) => g.key === key)
  if (!photo) return []
  // Sized for the ring's cards, rather than the full original.
  const { src } = getImageProps({ src: photo.src, alt: photo.title, width: 320, height: 320 }).props
  const liteSrc = getImageProps({ src: photo.src, alt: photo.title, width: 192, height: 192 }).props.src
  return [{ src, liteSrc, alt: photo.title, title: photo.title, subtitle: photo.event === photo.title ? undefined : photo.event }]
})

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', ...opts }).format(new Date(iso))

const tileBase = 'card group bg-ticks relative flex flex-col overflow-hidden'

/** Bento tile with a label on top and copy anchored to the bottom. */
function TextTile({ label, title, text, children, className = '' }: { label: string; title: string; text: string; children?: React.ReactNode; className?: string }) {
  return (
    <Reveal className={`${tileBase} min-h-[300px] justify-between gap-10 p-5 sm:p-10 lg:min-h-[352px] lg:w-[35%] ${className}`}>
      <Label>{label}</Label>
      <div>
        <h3 className="h-card">{title}</h3>
        <p className="mt-3 text-base sm:text-lg">{text}</p>
        {children}
      </div>
    </Reveal>
  )
}

/** Wide bento tile: copy on the left, visual on the right. */
function VisualTile({ label, title, text, visual, delay = 0 }: { label: string; title: string; text: string; visual: React.ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className={`${tileBase} min-h-[300px] lg:min-h-[352px] lg:flex-1 lg:flex-row`}>
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-10 p-5 sm:p-10">
        <Label>{label}</Label>
        <div className="lg:max-w-[340px]">
          <h3 className="h-card">{title}</h3>
          <p className="mt-3 text-base sm:text-lg">{text}</p>
        </div>
      </div>
      <div className="relative min-h-[260px] lg:w-[46%]">{visual}</div>
    </Reveal>
  )
}

export default async function HomePage() {
  const [event, home, site] = await Promise.all([getEvent(), getHomepage(), getSite()])
  const time = (iso: string) => fmt(iso, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '')
  const eventTime = time(event.startsAt)
  const kpgDay = fmt(kpg.startsAt, { day: 'numeric', month: 'long' })

  return (
    <>
      {/* One background behind the hero and the card scene, as in the reference */}
      <div className="relative isolate">
        <div aria-hidden className="bg-ticks absolute inset-0 -z-10" />
        <FallingLines className="-z-10" />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="glow absolute -top-[420px] left-1/2 -z-10 h-[900px] w-[2184px] -translate-x-1/2 [--glow-strength:0.7] [--glow:28_28_28]" />
        <HeroTubes />
        {/* The gold glow eases out before the hero ends, so it never stops on a hard line */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-[360px] [mask-image:linear-gradient(to_bottom,#000_50%,transparent)] sm:h-[460px]">
          <div className="flare h-full" />
        </div>

        {/* Promote the open event: date, venue, one headline, one action — the hand does the rest. */}
        <div className="container-site relative z-10 pt-[108px] text-center sm:pt-[136px] lg:pt-[136px]">
          <p className="text-[15px] font-medium text-gold-light sm:text-lg">
            {fmt(event.startsAt, { day: 'numeric', month: 'long', year: 'numeric' })} · {event.venue}, Abuja
          </p>
          <h1 className="h-hero mx-auto mt-3 max-w-[1100px] sm:mt-4">{home.hero?.headline || defaults.headline}</h1>
          <div className="mt-7 flex justify-center sm:mt-8">
            <Link href="/social-card" className="btn btn-primary">
              I Am Attending
            </Link>
          </div>
        </div>

        <div className="relative -mt-2 pb-20 sm:-mt-8 sm:pb-16 lg:-mt-14">
          <HeroHand />
        </div>
      </section>

      {/* The card leaves its case and travels down the screen; photos rise up to meet it */}
      <CardScene />
      </div>

      {/* Senior Pastors */}
      <section className="section">
        <div className="container-site flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-20">
          <Reveal className="lg:max-w-[440px]">
            <h2 className="h-section">Dr. Paul and Dr. Becky Paul-Enenche</h2>
            <p className="mt-4">Both were working as doctors when the call came. They left their jobs, moved to Abuja and lived in one room for 13 months while the church took root.</p>
            <Link href="/senior-pastor" className="btn btn-primary mt-8">
              Read their story
            </Link>
          </Reveal>
                    <Reveal delay={120} className="card grid w-full grid-cols-2 gap-2 p-2 sm:gap-3 sm:p-3 lg:w-[580px]">
            {[
              { src: photos.pastorPaul, name: 'Dr. Paul Enenche', role: 'Founder and Senior Pastor' },
              { src: photos.pastorBecky, name: 'Dr. Becky Paul-Enenche', role: 'Senior Pastor' },
            ].map((p) => (
              <figure key={p.name} className="group relative aspect-[5/7] overflow-hidden rounded-xl sm:rounded-2xl">
                <Image src={p.src} alt={p.name} fill placeholder="blur" sizes="(min-width: 1024px) 280px, 46vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-16 sm:p-5 sm:pt-20">
                  <span className="block text-[15px] font-medium text-fg sm:text-lg">{p.name}</span>
                  <span className="block text-xs sm:text-sm">{p.role}</span>
                </figcaption>
              </figure>
            ))}
          </Reveal>
        </div>
      </section>

      {/* This year's conference and its guests */}
      <section className="section relative isolate pb-20 sm:pb-[120px]">
        <div aria-hidden className="flare absolute inset-x-0 bottom-0 -z-10 h-[420px]" />
        <div className="container-site">
          <Reveal className="card flex flex-col overflow-hidden lg:flex-row lg:items-stretch">
            <div className="flex flex-col gap-8 p-5 sm:p-10 lg:w-[45%] lg:justify-between lg:py-[95px] lg:pl-[95px]">
              <div>
                <h2 className="h-section">Stay for Kingdom Power &amp; Glory</h2>
                <p className="mt-4">
                  Our yearly conference starts two weeks after the anniversary. This year’s theme is <span className="text-fg">Open Heavens</span>, and these are the guests joining our Senior Pastors.
                </p>
              </div>
              <StarList items={['Papa E.A. Adeboye', 'Archbishop Margaret Idahosa', 'Bishop David Oyedepo', 'Dr. Paul and Dr. Becky Paul-Enenche']} />
              <div>
                <p className="flex items-center gap-3 text-fg">
                  <Calendar width={18} height={18} className="text-gold" /> 24 to 29 November 2026
                </p>
                <p className="mt-2 flex items-center gap-3 text-fg">
                  <MapPin width={18} height={18} className="text-gold" /> The Glory Dome, Abuja
                </p>
                <a href={kpg.programmeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-8">
                  See the programme
                </a>
              </div>
            </div>
            <div className="relative min-h-[340px] flex-1 sm:min-h-[500px]">
              <div aria-hidden className="glow absolute inset-x-[-12%] bottom-[-14%] h-[105%] [--glow-strength:0.26]" />
              {/* Flush to the card's bottom-right corner: the poster's cut edge sits on the card edge. */}
              <Image
                src={kpgGuests}
                alt="KPG 2026 ministers: Papa E.A. Adeboye, Archbishop Margaret Idahosa, Bishop David Oyedepo, Dr. Paul and Dr. Becky Paul-Enenche"
                sizes="(min-width: 1024px) 620px, 96vw"
                className="absolute right-0 bottom-0 w-[96%] max-w-[620px]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Coming? The card, the international form and the venue, in one place */}
      <section className="section">
        <div className="container-site">
          <SplitHeader title="Coming on the 10th?">
            <p>You don’t need to register. Just come, and bring someone with you.</p>
          </SplitHeader>

          <div className="mt-10 flex flex-col gap-4 sm:gap-[25px] lg:mt-[60px] lg:flex-row">
            <Reveal className="card group relative flex flex-col overflow-hidden p-5 sm:px-[50px] sm:pt-10 lg:w-[40%]">
              <h3 className="h-card">Tell people you’re coming</h3>
              <p className="mt-3 text-base sm:text-lg">Take a photo, add your name and you’ll get your own card to post.</p>
              <Link href="/social-card" className="link-arrow mt-5 after:absolute after:inset-0">
                Make my card <ArrowRight width={22} height={22} />
              </Link>
              <div className="relative mt-8 h-[360px] sm:h-[400px]">
                <div aria-hidden className="absolute inset-x-[-30%] bottom-0 h-full [background:radial-gradient(rgb(255_255_255/0.16)_1px,transparent_1.4px)_0_0/8px_8px] [mask-image:radial-gradient(50%_60%_at_50%_70%,#000,transparent)]" />
                {/* A sample card, rendered by the real generator */}
                <div className="animate-float absolute -bottom-10 left-1/2 w-[58%] max-w-[230px] -translate-x-1/2">
                  <Image src={sampleCard} alt="A sample I Am Attending card" sizes="230px" placeholder="blur" className="-rotate-[7deg] rounded-[12px] shadow-[0_40px_70px_-25px_rgba(0,0,0,0.9)] transition-transform duration-500 group-hover:rotate-0" />
                </div>
              </div>
            </Reveal>

            <div className="flex flex-col gap-4 sm:gap-[25px] lg:flex-1">
              <Reveal delay={100} className="card grid flex-1 overflow-hidden sm:grid-cols-[1fr_1.1fr]">
                <div className="relative min-h-[220px] sm:order-2">
                  <Image src={photos.domeExterior} alt="The Glory Dome from the outside" fill placeholder="blur" sizes="(min-width: 1024px) 400px, 96vw" className="object-cover" />
                </div>
                <div className="flex flex-col justify-between gap-6 p-5 sm:p-10">
                  <div>
                    <h3 className="h-card">Where to find us</h3>
                    <p className="mt-3 text-base sm:text-lg">
                      The Glory Dome, Lord’s Garden, Airport Road, Abuja. We start at {eventTime}.
                    </p>
                  </div>
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary self-start">
                    Get directions
                  </a>
                </div>
              </Reveal>

              <Reveal delay={200} className="card group relative flex flex-1 flex-col justify-between gap-6 overflow-hidden p-5 sm:p-10">
                <GlassArt fit art={glass.plane} className="!absolute top-4 right-4 size-[92px] sm:top-6 sm:right-8 sm:size-[150px]" dots="inset-[-45%]" />
                <div className="relative max-w-[calc(100%-100px)] sm:max-w-[360px]">
                  <h3 className="h-card">Coming from outside Nigeria?</h3>
                  <p className="mt-3 text-base sm:text-lg">Fill one short form and tell us if you need airport pickup or somewhere to stay.</p>
                </div>
                <Link href="/international" className="btn btn-outline relative self-start">
                  Fill the form
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="section">
        <div className="container-site">
          <SplitHeader title="Thirty years of God’s faithfulness">
            <p>{home.welcome || defaults.welcome}</p>
          </SplitHeader>

          <div className="mt-10 flex flex-col gap-4 sm:gap-[25px] lg:mt-[60px]">
            <div className="flex flex-col gap-4 sm:gap-[25px] lg:flex-row">
              <TextTile label="Since 1996" title="It started with a fast" text="Three days on a mountain near Jos, and a clear word from God: go to Abuja." />
              <VisualTile
                delay={100}
                label="Our home"
                title="The Glory Dome"
                text="100,000 seats, dedicated in 2018 and built without debt."
                visual={
                  <>
                    <div className="absolute top-8 right-1/2 flex translate-x-1/2 gap-2 lg:top-[70px] lg:right-10 lg:translate-x-0">
                      {[Flame, BookOpen, Crown, Heart, Globe].map((I, i) => (
                        <IconTile key={i} Icon={I} />
                      ))}
                    </div>
                    <GlassImage
                      src={renders.glassPillar}
                      className="absolute right-1/2 -bottom-3 w-[180px] translate-x-1/2 transition-transform duration-300 group-hover:scale-110 sm:w-[210px] lg:right-[70px] lg:translate-x-0"
                    />
                  </>
                }
              />
            </div>
            <div className="flex flex-col gap-4 sm:gap-[25px] lg:flex-row">
              <VisualTile
                label="Our mandate"
                title="Why we exist"
                text="To restore people’s destinies and dignity, through the word of God and the demonstration of His power."
                visual={
                  <div className="absolute inset-0 flex items-center justify-center gap-6 lg:justify-end lg:pr-10">
                    <span className="flex flex-col gap-5 rounded-full bg-[#141414] px-3 py-5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span key={i} className="size-2.5 rounded-full border border-muted/60" />
                      ))}
                    </span>
                    <span aria-hidden className="absolute top-1/2 right-10 left-[10%] h-px bg-hair lg:left-auto lg:w-[60%]" />
                    <GlassImage src={renders.glassFlame} className="relative w-[130px] transition-transform duration-300 group-hover:scale-110 sm:w-[150px]" />
                    <span className="relative flex flex-col gap-2">
                      {[CrossIcon, Share, Globe, Sparkle, Heart].map((I, i) => (
                        <IconTile key={i} Icon={I} />
                      ))}
                    </span>
                  </div>
                }
              />
              <TextTile label="Our reach" title="800+ branches" text="From one meeting in a hotel hall to churches and home fellowships around the world.">
                <div className="mt-6 border-t border-hair pt-6">
                  <Link href="/our-story" className="btn btn-primary">
                    Read our story
                  </Link>
                </div>
              </TextTile>
            </div>
          </div>
        </div>
      </section>

      {/* Card stack: every year has a testimony */}
      <YearStack body={home.journey?.body} />

      {/* Sons of the Prophet */}
      <section className="section">
        <div className="container-site">
          <ShowcaseCard
            visual={<GlassArt art={glass.crown} className="w-[60%] max-w-[320px]" dots="inset-[-35%]" />}
            label="Sons of the Prophet"
            title="Did you grow up in this house?"
            text={<p>Many people can point to Dunamis as the place that shaped them, and they now serve God in all sorts of places. We’re collecting their stories for the anniversary: who they were, and who they’ve become.</p>}
            actions={
              <>
                <Link href="/sons-of-the-prophet#share" className="btn btn-primary">
                  Share your story
                </Link>
                <Link href="/sons-of-the-prophet" className="btn btn-outline">
                  Read the stories
                </Link>
              </>
            }
          />
        </div>
      </section>

      {/* Moments: official photographs on a ring */}
      <section aria-label="Moments from thirty years" className="section">
        <div className="container-site flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal as="h2" className="h-section max-w-[560px]">
            Some moments we love
          </Reveal>
          <Link href="/gallery" className="btn btn-outline self-start sm:self-auto">
            See the gallery
          </Link>
        </div>
        <div className="relative mt-6 h-[380px] sm:h-[500px] lg:mt-8 lg:h-[600px]">
          <CircularCarousel items={moments} fadeColor="#080808" cardWidth={340} minFit={0.6} captions />
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-site">
          <Reveal as="h2" className="h-section mx-auto max-w-[600px] text-center">
            Questions people ask
          </Reveal>
          <div className="mt-10 lg:mt-[60px]">
            <Faq items={site.faqs?.length ? site.faqs : defaultFaqs} />
          </div>
        </div>
      </section>

      {/* Countdown to this year's conference */}
      <section className="section pb-10">
        <div className="container-site text-center">
          <Reveal as="h2" className="h-section">
            {kpg.title}
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-3">
              {kpgDay} at {time(kpg.startsAt)}, The Glory Dome, Abuja
            </p>
          </Reveal>
          <div className="mx-auto mt-10 max-w-[720px] sm:mt-12">
            <FlipCountdown startsAt={kpg.startsAt} label={`Time left until ${kpg.title}`} endedText="It has started" />
          </div>
          <Reveal delay={520}>
            <a href={kpg.programmeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-10 sm:mt-12">
              See the programme
            </a>
          </Reveal>
        </div>
      </section>

      {/* The card drops into its slip, over the footer band */}
      <SleeveCard />
    </>
  )
}
