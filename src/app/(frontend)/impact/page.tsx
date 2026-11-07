import type { Metadata } from 'next'
import Image, { type StaticImageData } from 'next/image'
import Link from '@/components/SiteLink'

import { GlassImage } from '@/components/GlassImage'
import { glass } from '@/assets/glass'
import kpgPoster from '@/assets/posters/kpg-2026.webp'
import { ClosingBand, CrusadeLabel, GlassArt, Label, StorySplit } from '@/components/blocks'
import { ArrowRight } from '@/components/icons'
import { CountUp, GrowFrame, ScrubText, SidewaysScroll } from '@/components/motion'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { getImpactPage, mediaUrl, testimonyFormOpen } from '@/lib/content'
import { blurFor } from '@/lib/image'
import { defaultStats } from '@/lib/ministry'
import { crusadePhotos, photos } from '@/lib/photos'
import type { Media } from '@/payload-types'

export const revalidate = 300

export const metadata: Metadata = {
  title: '30 Years of Impact',
  description: 'Lives changed, churches planted, nations reached and people cared for: thirty years of Dunamis International Gospel Centre.',
}

type Area = { label: string; title: string; text: string; image: StaticImageData | string; art: StaticImageData; href?: string; cta?: string }

const areas: Area[] = [
  { label: 'Testimonies', title: 'Lives changed', text: 'People healed, families restored, destinies turned around. They can tell you better than we can.', image: photos.altarCall, art: glass.heart, href: '/testimonies', cta: 'Read the testimonies' },
  { label: 'Branches', title: 'Churches planted', text: 'More than 800 branches and over 5,000 home church locations, in Nigeria and around the world.', image: photos.domeInteriorWide, art: glass.church },
  { label: 'Nations', title: 'People from everywhere', text: 'Pilgrims from 109 countries visited the Glory Dome in 2025.', image: photos.nationsCameroon, art: glass.flag },
  { label: 'Crusades', title: 'Crusades in the nations', text: 'In 2026 the crusades have gone to Venezuela, Argentina, Canada, Romania, Latvia, Angola, Lesotho and Zambia.', image: crusadePhotos.romaniaCrowd.src, art: glass.world },
  { label: 'Ministers', title: 'Ministers raised', text: 'Sons and daughters of this house now serve God in many places. Delegations from over 68 nations came to the Flaming Fire conference in 2025.', image: photos.handsRaised, art: glass.crown, href: '/sons-of-the-prophet', cta: 'Sons of the Prophet' },
  { label: 'Welfare', title: 'Caring for people in need', text: 'Boreholes, electricity, roads and orphanage homes for communities that need them, plus food, clothes and scholarships.', image: photos.welfareFood, art: glass.cap },
  { label: 'Medical', title: 'Free medical care', text: 'In February 2026, a team took free care to communities in Kogi and Benue. Reports put the number reached at 5,000.', image: photos.medicalCare, art: glass.medical },
]

/** Sideways panel: official photograph beside the story, with its glass object. */
function AreaPanel({ area }: { area: Area }) {
  return (
    <article className="card group relative flex h-full w-[84vw] shrink-0 flex-col overflow-hidden sm:w-[560px] lg:w-[820px] lg:flex-row">
      <div className="relative min-h-0 flex-1">
        <Image src={area.image} alt={area.title} fill sizes="(min-width: 1024px) 420px, 84vw" placeholder={blurFor(area.image)} className="object-cover" />
      </div>
      <div className="flex shrink-0 flex-col justify-between gap-4 p-5 sm:p-8 lg:w-1/2">
        <div className="flex items-start justify-between gap-3">
          <Label>{area.label}</Label>
          <GlassImage src={area.art} className="h-auto w-[62px] transition-transform duration-500 group-hover:scale-110 sm:w-[96px] lg:w-[150px]" />
        </div>
        <div>
          <h3 className="h-card">{area.title}</h3>
          <p className="mt-2 text-[15px] leading-snug sm:mt-3 sm:text-lg sm:leading-normal">{area.text}</p>
          {area.href && (
            <Link href={area.href} className="link-arrow mt-3 text-base sm:mt-5">
              {area.cta} <ArrowRight width={20} height={20} />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

const statArt = [glass.church, glass.house, glass.mic, glass.dome, glass.plane, glass.thirty]

const gatherings = [
  { chip: 'Every November', title: 'Kingdom Power & Glory World Conference', text: 'Our yearly anniversary conference. The whole Dunamis family comes home for it.', art: glass.coinCrown },
  { chip: 'Every August', title: 'International Ministers’ Flaming Fire Conference', text: 'For ministers, from across Nigeria and beyond.', art: glass.coinFlame },
  { chip: 'Every January', title: 'Nations Worship in His Presence', text: 'A night of worship with singers from Nigeria and other nations.', art: glass.coinCross },
]

export default async function ImpactPage() {
  const formOpen = await testimonyFormOpen()
  const page = await getImpactPage()
  const stats = page.stats?.length ? page.stats.map((s) => ({ value: s.value, suffix: s.suffix ?? undefined, label: s.label, note: undefined as string | undefined })) : defaultStats
  const panels: Area[] = page.stories?.length
    ? page.stories.map((s, i) => ({ ...areas[i % areas.length], label: 'Impact', title: s.title, text: s.body ?? '', image: mediaUrl(s.image as Media | null, 'hero') || areas[i % areas.length].image, href: undefined }))
    : areas

  return (
    <>
      <PageHero eyebrow="30 Years of Impact" title="30 years of impact" intro={page.intro || 'Numbers can’t tell the whole story, but they give you an idea.'} />

      {/* The figures count up as you scroll */}
      <section>
        <div className="container-site grid grid-cols-2 gap-4 sm:gap-[25px] lg:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={(i % 3) * 80} className="card group relative flex min-h-[220px] flex-col justify-end gap-3 overflow-hidden p-5 sm:min-h-[320px] sm:p-10">
              <GlassArt fit art={statArt[i % statArt.length]} className="!absolute top-3 right-3 size-[70px] sm:top-6 sm:right-6 sm:size-[130px]" dots="inset-[-45%]" />
              <CountUp value={s.value} suffix={s.suffix} className="relative text-[clamp(1.6rem,1.1rem+3.2vw,4.25rem)] leading-none font-medium tracking-[-0.02em] text-fg" />
              <div className="relative">
                <p className="text-[15px] leading-snug font-medium text-gold-light sm:text-xl">{s.label}</p>
                {s.note && <p className="mt-1.5 hidden text-base sm:block">{s.note}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <ScrubText
            as="h2"
            text="We don’t share these numbers to boast. Every one of them points back to what God has done."
            className="max-w-[1040px] text-[clamp(1.75rem,1.2rem+2.8vw,3.75rem)] leading-[1.18] font-medium tracking-[-0.02em] text-fg"
          />
          <GrowFrame className="mt-10 aspect-[4/3] sm:aspect-[16/9] lg:mt-[60px]" overlay={<CrusadeLabel photo={crusadePhotos.argentinaHands} />}>
            <Image src={crusadePhotos.argentinaHands.src} alt={crusadePhotos.argentinaHands.alt} fill sizes="96vw" placeholder="blur" className="object-cover" />
          </GrowFrame>
        </div>
      </section>

      {/* Sideways scene */}
      <SidewaysScroll
        className="mt-6 lg:mt-10"
        header={
          <Reveal as="h2" className="h-section">
            Where it shows
          </Reveal>
        }
      >
        {panels.map((area) => (
          <AreaPanel key={area.title} area={area} />
        ))}
      </SidewaysScroll>

      {/* A significant project: the Glory Dome */}
      <section className="pt-6">
        <div className="container-site">
          <StorySplit
            title="A house built without debt"
            visual={
              <div className="card relative aspect-[4/3] overflow-hidden lg:aspect-[8/7]">
                <Image src={photos.domeExterior} alt="The Glory Dome from the outside" fill placeholder="blur" sizes="(min-width: 1024px) 640px, 96vw" className="object-cover" />
              </div>
            }
          >
            <p>The Glory Dome seats 100,000 people, and it was finished without borrowing from any bank.</p>
            <p>The foundation was laid on 14 September 2014 on the Lord’s Garden, along Airport Road in Abuja. It was dedicated on 24 November 2018, during Kingdom Power &amp; Glory.</p>
          </StorySplit>
        </div>
      </section>

      {/* Major conventions */}
      <section className="section">
        <div className="container-site">
          <Reveal>
            <h2 className="h-section">Our big gatherings</h2>
            <p className="mt-4 max-w-[560px]">Every year, people travel to the Glory Dome for these.</p>
          </Reveal>
          <Reveal className="card relative mt-10 aspect-[1280/631] overflow-hidden lg:mt-[60px]">
            <Image src={kpgPoster} alt="Kingdom Power and Glory World Conference 2026 poster: Open Heavens" fill placeholder="blur" sizes="(min-width: 1240px) 1200px, 96vw" className="object-cover" />
          </Reveal>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:mt-[60px] lg:grid-cols-3 lg:gap-5">
            {gatherings.map((g, i) => (
              <Reveal key={g.title} delay={i * 80} as="article" className="group">
                <div className="card bg-ticks relative grid aspect-[387/340] place-items-center overflow-hidden">
                  <span className="absolute top-5 left-5 z-10 rounded-lg border border-line bg-hair px-4 py-2 text-sm text-fg">{g.chip}</span>
                  <GlassArt art={g.art} className="w-[52%]" dots="inset-[-35%]" />
                </div>
                <h3 className="h-card mt-6 transition-colors group-hover:text-gold">{g.title}</h3>
                <p className="mt-2 text-base sm:text-lg">{g.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ClosingBand
        title={formOpen ? 'Has God done something for you?' : 'Read what God has done'}
        text={formOpen ? 'Your testimony belongs in this story too.' : 'Real stories from people God has touched through this ministry.'}
        shareUrl="/impact"
        shareText="30 years of impact through Dunamis International Gospel Centre"
      >
        <Link href={formOpen ? '/testimonies#share' : '/testimonies'} className="btn btn-primary">
          {formOpen ? 'Share your testimony' : 'Read testimonies'}
        </Link>
        <Link href="/social-card" className="btn btn-outline">
          I Am Attending
        </Link>
      </ClosingBand>
    </>
  )
}
