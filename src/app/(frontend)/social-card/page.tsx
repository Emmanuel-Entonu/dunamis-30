import type { Metadata } from 'next'

import { PageHero } from '@/components/PageHero'
import { CardStudio } from './CardStudio'

export const metadata: Metadata = {
  title: 'I Am Attending',
  description:
    'Make your own Dunamis at 30 card: take or upload a photo, add your name and tell people you’re coming.',
}

export default function SocialCardPage() {
  return (
    <>
      {/* On phones the editor is the whole first screen, so there's nothing to scroll past. */}
      <div className="hidden lg:block">
        <PageHero
          eyebrow="I Am Attending"
          title="I am attending Dunamis at 30!"
          intro="Take a photo or upload one, add your name, and you’ll have a card to post on WhatsApp, Instagram or Facebook. You don’t need to register."
        />
      </div>
      <h1 className="sr-only lg:hidden">I am attending Dunamis at 30!</h1>
      <section className="pt-[84px] pb-10 lg:pt-0 lg:pb-24">
        <div className="container-site">
          <CardStudio />
        </div>
      </section>
    </>
  )
}
