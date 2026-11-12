import type { Metadata } from 'next'

import { PageHero } from '@/components/PageHero'
import { InviteStudio } from './InviteStudio'

export const metadata: Metadata = {
  title: 'Invite Someone',
  description: 'Write your name on a Dunamis at 30 envelope and send a personal invitation to the 30th anniversary celebration, 23 to 29 November at the Glory Dome, Abuja.',
}

export default function InvitePage() {
  return (
    <>
      {/* On phones the envelope is the first thing on the screen. */}
      <div className="hidden lg:block">
        <PageHero
          eyebrow="Invite someone"
          title="Invite someone to Dunamis at 30"
          intro="Write your name on the envelope and open it. Inside is a personal invitation from you, ready to send on WhatsApp, Instagram or Facebook."
        />
      </div>
      <h1 className="sr-only lg:hidden">Invite someone to Dunamis at 30</h1>
      {/* The envelope's glow reaches past its box; the page itself never scrolls sideways. */}
      <section className="overflow-x-clip pt-[92px] pb-12 lg:pt-0 lg:pb-24">
        <div className="container-site">
          <InviteStudio />
        </div>
      </section>
    </>
  )
}
