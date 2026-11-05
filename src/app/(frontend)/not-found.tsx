import type { Metadata } from 'next'

import { PageHero } from '@/components/PageHero'
import Link from '@/components/SiteLink'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <PageHero eyebrow="Page not found" title="We can’t find that page" intro="It may have moved, or there may be a small mistake in the link.">
      <div className="mt-8 flex justify-center">
        <Link href="/" className="btn btn-primary">
          Go to the home page
        </Link>
      </div>
    </PageHero>
  )
}
