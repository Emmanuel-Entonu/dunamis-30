'use client'

import Image from 'next/image'
import { useState } from 'react'

/** Drag (or use the arrow keys) to compare the "before" and "after" photographs. */
export function BeforeAfter({ before, after, name, className = '' }: { before: string; after: string; name: string; className?: string }) {
  const [split, setSplit] = useState(50)

  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      <Image src={after} alt="" aria-hidden fill sizes="(min-width: 900px) 860px, 96vw" className="scale-110 object-cover opacity-60 blur-2xl" />
      <Image src={after} alt={`${name} today`} fill sizes="(min-width: 900px) 860px, 96vw" className="object-contain" />
      <div className="absolute inset-0 bg-canvas" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
        <Image src={before} alt="" aria-hidden fill sizes="(min-width: 900px) 860px, 96vw" className="scale-110 object-cover opacity-60 blur-2xl" />
        <Image src={before} alt={`${name} before`} fill sizes="(min-width: 900px) 860px, 96vw" className="object-contain" />
      </div>
      <span className="absolute top-3 left-3 rounded-lg bg-black/60 px-3 py-2 text-sm leading-none text-fg backdrop-blur-[6px]">Before</span>
      <span className="absolute top-3 right-3 rounded-lg bg-black/60 px-3 py-2 text-sm leading-none text-fg backdrop-blur-[6px]">Today</span>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white" style={{ left: `${split}%` }}>
        <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-white text-canvas shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        aria-label={`Compare photographs of ${name} before and today`}
        className="absolute inset-0 h-full w-full cursor-ew-resize touch-pan-y opacity-0"
      />
    </div>
  )
}
