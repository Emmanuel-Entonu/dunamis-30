import type { Metadata } from 'next'
import Link from '@/components/SiteLink'

import { LegalPage, type LegalSection } from '@/components/LegalPage'
import { whatsappLink } from '@/lib/ministry'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How the Dunamis at 30 website collects, uses and protects your personal information.',
}

const generalLine = '+234 903 498 6089'

const sections: LegalSection[] = [
  {
    id: 'who',
    title: 'Who we are',
    body: (
      <p>
        This website is operated by Dunamis International Gospel Centre (“Dunamis”, “we”), The Glory Dome, Lord’s Garden, Airport Road, Abuja, Nigeria, for the 30th anniversary celebration. We handle personal data in line with the Nigeria Data
        Protection Act 2023.
      </p>
    ),
  },
  {
    id: 'collect',
    title: 'What we collect',
    body: (
      <>
        <p>We only collect what you choose to give us through a form:</p>
        <ul>
          <li>
            <strong className="text-fg">International Guests form:</strong> your name, country of residence, nationality, email, WhatsApp number, travel details, whether you need airport pickup or accommodation, and any special requests.
          </li>
          <li>
            <strong className="text-fg">Share Your Testimony:</strong> your name, email, phone number, your testimony, and any photo or video you add. Photos and videos stay private until our team approves them.
          </li>
          <li>
            <strong className="text-fg">Share Your Story (Sons of the Prophet):</strong> your name, location, email, phone number, your story, milestones, and any photos or video you add. Photos and videos stay private until our team approves them.
          </li>
        </ul>
        <p>
          <strong className="text-fg">“I Am Attending” card:</strong> no registration is needed. Your photo and name are processed in your own browser to make your card and are not uploaded to us. We only count anonymous activity, such as how many
          cards were downloaded or shared.
        </p>
        <p>
          <strong className="text-fg">Invite Someone:</strong> your name and the name of the person you invite are written onto the invitation in your own browser and are never uploaded to us. We only count, anonymously, how many invitations are made, downloaded, shared or turned into a video.
        </p>
        <p>We also collect standard technical information, such as your IP address, which is used briefly to protect the forms from spam. We also count visitors and the cards and invitations people make, so the church can see how the anniversary is reaching people. Those counts are anonymous: your device remembers the last day it was counted, and we keep only the day, the country and whether it was a phone or a computer, never your name or IP address. If analytics are switched on, Google Analytics records anonymous usage such as pages visited and country.</p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use it',
    body: (
      <ul>
        <li>To arrange airport pickup and accommodation assistance for international guests, and to contact you about your request.</li>
        <li>To review testimonies and stories, contact you about them, and publish them where you have consented.</li>
        <li>To keep the website secure and to understand how it is used, so that we can improve it.</li>
      </ul>
    ),
  },
  {
    id: 'publish',
    title: 'What gets published',
    body: (
      <p>
        Nothing you submit is published until our communications team has reviewed and approved it, and only with your consent. You can choose not to show your name. Your email address and phone number are never shown on the website.
      </p>
    ),
  },
  {
    id: 'basis',
    title: 'Our legal basis',
    body: <p>We rely on your consent, which you give when you submit a form, and on our legitimate interest in keeping the website secure and running it well. You may withdraw consent at any time by contacting us.</p>,
  },
  {
    id: 'share',
    title: 'Who can see it',
    body: (
      <>
        <p>Access is limited by role. The international logistics team sees guest requests, and the communications team sees testimonies and stories. We do not sell your personal data.</p>
        <p>We use trusted service providers to run the website, including website hosting, database and file storage, email delivery and analytics. Some of them may process data outside Nigeria, under appropriate safeguards.</p>
      </>
    ),
  },
  {
    id: 'keep',
    title: 'How long we keep it',
    body: <p>We keep travel requests only as long as needed to organise and follow up on the celebration. We keep published testimonies and stories as part of the ministry’s historical record until you ask us to remove them.</p>,
  },
  {
    id: 'security',
    title: 'How we protect it',
    body: <p>All traffic to this website is encrypted. Submissions are stored in a secured database, and staff sign in to a role-restricted dashboard to reach them. No system is perfectly secure, but we work to protect your information and will act promptly if anything goes wrong.</p>,
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>You can ask us to show you the data we hold about you, correct it, delete it, or stop using it, and you can withdraw your consent or ask us to take down something published.</p>
        <p>You may also complain to the Nigeria Data Protection Commission.</p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>Anyone under 18 should ask a parent or guardian before submitting a form. A parent or guardian should give consent for any story or photograph that features a child.</p>,
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <p>
        For anything about your data, message us on WhatsApp at{' '}
        <a href={whatsappLink(generalLine)} target="_blank" rel="noopener noreferrer">
          {generalLine}
        </a>{' '}
        or see the <Link href="/contact">Contact page</Link>.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" intro="How the Dunamis at 30 website collects, uses and protects your personal information." updated="November 2026" sections={sections} />
}
