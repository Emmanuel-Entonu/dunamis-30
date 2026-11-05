import Image from 'next/image'

import { crusadeStrip } from '@/lib/photos'

/** A slow moving row of photographs from the crusades, just above the footer. The set repeats so the loop has no seam. */
export function CrusadeStrip() {
  const run = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
      {crusadeStrip.map((photo) => (
        <li key={photo.alt} className="relative h-[112px] w-[168px] shrink-0 overflow-hidden rounded-xl sm:h-[156px] sm:w-[234px]">
          <Image src={photo.src} alt={hidden ? '' : photo.alt} fill sizes="(min-width: 640px) 234px, 168px" placeholder="blur" className="object-cover" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 text-[13px] leading-none font-medium text-white">{photo.place}</span>
        </li>
      ))}
    </ul>
  )
  return (
    <div aria-label="Photographs from the crusades" role="group" className="relative overflow-hidden">
      <div className="marquee animate-strip">
        {run(false)}
        {run(true)}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-canvas to-transparent sm:w-24" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-canvas to-transparent sm:w-24" />
    </div>
  )
}
