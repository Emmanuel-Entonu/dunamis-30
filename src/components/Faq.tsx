'use client'

import { useState } from 'react'

export type FaqItem = { question: string; answer: string }

/** Single-open accordion (grid-rows 0fr → 1fr), first item open. */
export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0)
  return (
    <ul className="mx-auto grid max-w-[725px] gap-[15px]">
      {items.map((item, i) => {
        const active = open === i
        return (
          <li key={item.question} className="rounded-2xl border border-line bg-surface">
            <button
              type="button"
              aria-expanded={active}
              onClick={() => setOpen(active ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-2 pr-2 pl-5 text-left sm:pl-[25px]"
            >
              <span className="text-lg leading-snug font-medium text-soft sm:text-xl">{item.question}</span>
              <span className={`relative grid h-12 w-16 shrink-0 place-items-center rounded-lg transition-colors sm:w-[100px] ${active ? 'bg-gold' : 'bg-hair'}`}>
                <span className={`absolute h-0.5 w-4 rounded ${active ? 'bg-gold-ink' : 'bg-fg'}`} />
                <span className={`absolute h-4 w-0.5 rounded transition-transform duration-300 ${active ? 'rotate-90 bg-gold-ink' : 'bg-fg'}`} />
              </span>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ${active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <p className="px-5 pt-1 pb-5 text-base sm:pr-[100px] sm:pl-[25px] sm:text-lg">{item.answer}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
