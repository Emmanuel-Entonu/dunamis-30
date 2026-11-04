import type { ReactNode } from 'react'

import { PageHero } from './PageHero'

export type LegalSection = { id: string; title: string; body: ReactNode }

/** Privacy and terms: contents beside the text on desktop, one comfortable column on phones. */
export function LegalPage({ title, intro, updated, sections }: { title: string; intro: string; updated: string; sections: LegalSection[] }) {
  return (
    <>
      <PageHero title={title} intro={intro} />
      <section className="pb-24">
        <div className="container-site grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-[70px]">
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-28 grid gap-1 text-base">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block py-1.5 transition-colors hover:text-gold">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="max-w-[760px]">
            <p className="text-base">Last updated: {updated}</p>
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="mt-10 scroll-mt-28 first:mt-6 [&_a]:text-gold [&_a:hover]:underline [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
                <h2 className="h-card">{s.title}</h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
