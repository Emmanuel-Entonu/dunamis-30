import type { Metadata } from 'next'

import { glass } from '@/assets/glass'
import { CrusadeTile, GlassArt } from '@/components/blocks'
import { Calendar, Globe, MapPin } from '@/components/icons'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { crusadePhotos } from '@/lib/photos'
import { InternationalForm } from './InternationalForm'

export const metadata: Metadata = {
  title: 'International Guests',
  description: 'Coming from outside Nigeria for Dunamis at 30? Tell us if you need airport pickup or help with accommodation.',
}

const facts = [
  { Icon: Calendar, title: '30th Anniversary Service', text: 'Tuesday, 10 November 2026, 9:30am WAT' },
  { Icon: Calendar, title: 'Kingdom Power & Glory 2026', text: '24 to 29 November 2026. The theme is Open Heavens.' },
  { Icon: MapPin, title: 'The Glory Dome', text: 'Lord’s Garden, Airport Road, Abuja' },
  { Icon: Globe, title: 'Arriving by air', text: 'Nnamdi Azikiwe International Airport, Abuja (ABV)' },
]

export default function InternationalPage() {
  return (
    <>
      <PageHero
        eyebrow="International Guests"
        title="Coming From Outside Nigeria?"
        intro="Tell us about your trip. If you need airport pickup or help finding somewhere to stay, this is the form to fill."
      />
      <section className="pb-24">
        <div className="container-site grid gap-8 lg:grid-cols-[380px_1fr] lg:gap-[25px]">
          <aside className="card group h-fit overflow-hidden p-6 sm:p-10">
            <GlassArt art={glass.plane} className="mx-auto mb-8 w-[150px] sm:w-[190px]" dots="inset-[-40%]" />
            <h2 className="h-card">Planning your visit</h2>
            <ul className="mt-6">
              {facts.map(({ Icon, title, text }) => (
                <li key={title} className="flex items-start justify-between gap-5 border-b border-hair py-5 first:pt-0 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-fg">{title}</p>
                    <p className="mt-1 text-base">{text}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-[3px] bg-hair text-gold">
                    <Icon width={22} height={22} />
                  </span>
                </li>
              ))}
            </ul>
          </aside>
          <InternationalForm />
        </div>
      </section>

      <section className="pb-24">
        <div className="container-site">
          <Reveal>
            <h2 className="h-section max-w-[620px]">You’ve welcomed us. Now let us welcome you.</h2>
            <p className="mt-4 max-w-[560px]">From Zambia to Canada, the nations have received the team with open arms. We’d love to do the same for you at the Glory Dome.</p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-[25px] lg:mt-[60px]">
            <CrusadeTile photo={crusadePhotos.zambiaDrums} sizes="(min-width: 640px) 400px, 96vw" className="aspect-[4/3]" />
            <CrusadeTile photo={crusadePhotos.cambodiaWelcome} sizes="(min-width: 640px) 400px, 96vw" delay={80} className="aspect-[4/3]" />
            <CrusadeTile photo={crusadePhotos.canadaWelcome} sizes="(min-width: 640px) 400px, 96vw" delay={160} className="aspect-[4/3]" />
          </div>
        </div>
      </section>
    </>
  )
}
