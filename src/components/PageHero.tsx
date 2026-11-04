import Image from 'next/image'
import type { ReactNode } from 'react'

import { renders } from '@/assets/renders'
import { Label } from './blocks'
import { FallingLines } from './FallingLines'

/** Inner-page hero: grey top glow, two glass tubes on a tilted layer, centred title. */
export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden pt-[130px] pb-16 text-center sm:pt-[170px] sm:pb-24">
      <div aria-hidden className="bg-ticks absolute inset-0 -z-20" />
      <FallingLines className="-z-20" />
      <div aria-hidden className="absolute -top-[120px] left-1/2 -z-10 h-[300px] w-[1584px] -translate-x-1/2 rounded-[50%] bg-[#1c1c1c] blur-[150px]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 rotate-[-13deg]">
        <Image src={renders.glassTube} alt="" sizes="30vw" className="absolute top-[55%] -left-[14%] hidden w-[30vw] max-w-[420px] rotate-90 sm:block" />
        <Image src={renders.glassTube} alt="" sizes="30vw" className="absolute top-[-4%] -right-[26%] w-[42vw] max-w-[420px] -rotate-90 sm:top-[5%] sm:-right-[14%] sm:w-[30vw]" />
      </div>
      <div className="container-site">
        {eyebrow && <Label className="mb-6">{eyebrow}</Label>}
        <h1 className="h-hero mx-auto max-w-[750px]">{title}</h1>
        {intro && <p className="mx-auto mt-5 max-w-[600px]">{intro}</p>}
        {children}
      </div>
    </section>
  )
}
