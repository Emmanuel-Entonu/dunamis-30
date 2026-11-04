import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage, type LegalSection } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms governing the use of the Dunamis at 30 website.',
}

const sections: LegalSection[] = [
  {
    id: 'about',
    title: 'About these terms',
    body: <p>This website is operated by Dunamis International Gospel Centre. By using it, you agree to these terms. If you do not agree, please do not use the website.</p>,
  },
  {
    id: 'attending',
    title: 'Attending the celebration',
    body: <p>The 30th Anniversary Service is open to all, and no registration is needed. We may need to change event details such as times or arrangements, and the latest details will appear on this website.</p>,
  },
  {
    id: 'international',
    title: 'International guests',
    body: (
      <p>
        Submitting the <Link href="/international">International Guests form</Link> is not a confirmation of airport pickup or accommodation. Those arrangements are confirmed separately by our logistics team. Visas, flights, insurance and
        other travel requirements remain your own responsibility.
      </p>
    ),
  },
  {
    id: 'submissions',
    title: 'Testimonies and stories',
    body: (
      <>
        <p>When you share a testimony, story, photograph or video, you confirm that:</p>
        <ul>
          <li>it is true and your own, and you have the right to share it, including any photographs or video;</li>
          <li>anyone else who appears in it, or the parent or guardian of any child, is happy for it to be shared;</li>
          <li>it does not contain anything unlawful, offensive or misleading.</li>
        </ul>
        <p>
          You keep ownership of your content, and you give Dunamis permission to publish, edit for length and clarity, and share it on this website and its other channels. We may decline or remove any submission. You can ask us to take down your
          content by <Link href="/contact">contacting us</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'cards',
    title: 'Your anniversary card',
    body: <p>You are welcome to create and share your personal “I Am Attending” card. Please only use a photo you have the right to use. Please do not alter the anniversary branding, or use the card to suggest that any person or message is endorsed by Dunamis.</p>,
  },
  {
    id: 'ip',
    title: 'Our content',
    body: <p>The Dunamis name, the anniversary crest, logos, photographs, videos, text and design of this website belong to Dunamis International Gospel Centre or its licensors. You may share links and use the sharing buttons, but please ask us before reusing our content in any other way.</p>,
  },
  {
    id: 'use',
    title: 'Acceptable use',
    body: <p>Please do not misuse this website, including by submitting false information, sending spam, attempting to access areas you are not authorised to use, or disrupting the website for others.</p>,
  },
  {
    id: 'links',
    title: 'Other websites',
    body: <p>We link to other services such as YouTube, Facebook, Instagram, WhatsApp and Google Maps. We are not responsible for their content or how they handle your information.</p>,
  },
  {
    id: 'liability',
    title: 'No guarantees',
    body: <p>We work hard to keep this website accurate and available, but we provide it “as is” and cannot guarantee that it will always be error-free or uninterrupted. As far as the law allows, we are not liable for losses arising from your use of it.</p>,
  },
  {
    id: 'privacy',
    title: 'Your privacy',
    body: (
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains how we handle your personal information.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes and governing law',
    body: <p>We may update these terms from time to time, and the latest version will always be on this page. These terms are governed by the laws of the Federal Republic of Nigeria.</p>,
  },
]

export default function TermsPage() {
  return <LegalPage title="Terms of use" intro="The terms governing the use of the Dunamis at 30 website." updated="November 2026" sections={sections} />
}
