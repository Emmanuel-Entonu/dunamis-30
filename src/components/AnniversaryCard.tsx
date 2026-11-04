import Image from 'next/image'

import crest from '@/assets/brand/crest-official.webp'

/** Mottled gold light: several soft light pools over a warm base (like light on metal foil). */
export const goldCardBackground = [
  'radial-gradient(60% 45% at 22% 12%, #ffe9b3 0%, rgba(255,233,179,0) 70%)',
  'radial-gradient(55% 50% at 88% 28%, rgba(255,207,112,0.9) 0%, rgba(255,207,112,0) 70%)',
  'radial-gradient(70% 55% at 25% 88%, rgba(212,118,8,0.85) 0%, rgba(212,118,8,0) 70%)',
  'radial-gradient(60% 55% at 96% 96%, #a35a04 0%, rgba(163,90,4,0) 70%)',
  'linear-gradient(155deg, #ffc45a 0%, #f2a227 50%, #cf770c 100%)',
].join(', ')

/** Tiny "×" marks — a fine micro-pattern, as an SVG tile. */
const crossTile = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Cpath d='M4.5 4.5l3 3M7.5 4.5l-3 3' stroke='%23fff' stroke-opacity='.6' stroke-width='.9' stroke-linecap='round'/%3E%3C/svg%3E")`

/**
 * The one anniversary card used everywhere: gold foil with the official 30th-anniversary crest
 * and "Dunamis@30". Sizes are container units (cqw) so it looks the same at every size.
 */
export function AnniversaryCard({ className = '' }: { className?: string }) {
  return (
    <div className={`@container relative isolate overflow-hidden rounded-[20px] ${className}`} style={{ background: goldCardBackground }}>
      {/* Micro pattern, strongest in the middle */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: crossTile,
          maskImage: 'radial-gradient(60% 44% at 50% 42%, #000 0%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(60% 44% at 50% 42%, #000 0%, transparent 78%)',
        }}
      />
      {/* Shine: a soft top sheen plus a gloss band that sweeps across now and then */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="animate-card-shine absolute inset-y-[-20%] -left-full w-full"
          style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.42) 48%, rgba(255,255,255,0.08) 56%, transparent 68%)' }}
        />
      </span>
      {/* Rim light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -16px 28px -12px rgba(110,52,0,0.4)' }}
      />

      <div className="relative flex h-full flex-col items-center justify-between px-[8cqw] pt-[16cqw] pb-[9cqw]">
        <Image
          src={crest}
          alt="Dunamis International Gospel Centre 30th Anniversary, 1996 – 2026"
          sizes="(min-width: 1024px) 240px, 140px"
          className="w-[68cqw] drop-shadow-[0_10px_16px_rgba(90,40,0,0.45)]"
        />
        <span className="text-[10cqw] leading-none font-semibold tracking-[-0.02em] text-gold-ink">Dunamis@30</span>
      </div>
    </div>
  )
}
