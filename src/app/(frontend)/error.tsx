'use client'

import { PageHero } from '@/components/PageHero'

/** If a page fails while loading, visitors stay on the site and can try again. */
export default function PageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageHero eyebrow="Something went wrong" title="That page didn’t load" intro="This is usually a passing problem, often a weak connection. Please try again.">
      <div className="mt-8 flex justify-center">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
      </div>
    </PageHero>
  )
}
