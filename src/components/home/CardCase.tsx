import Image from 'next/image'

import emblem from '@/assets/brand/emblem-official.webp'

/**
 * The dark case ("slip") the anniversary card lives in — kept simple: the Dunamis logo beside
 * the "Dunamis" wordmark (no anniversary artwork; that lives on the card).
 * `top`: notch at the bottom, lockup down the left edge (reads top → bottom).
 * `bottom`: notch at the top, lockup up the right edge (reads bottom → top).
 * Finish: graphite gradient, sunburst lines from the notch, a soft sheen and reflection, a lit
 * rim around the notch and edges, and a drop shadow that follows the notch shape.
 */
export function CardCase({ variant, notch: size = 17, className = '' }: { variant: 'top' | 'bottom'; notch?: number; className?: string }) {
  const top = variant === 'top'
  const at = `50% ${top ? '100%' : '0%'}`
  const notch = `radial-gradient(circle at ${at}, transparent ${size}%, #000 ${size + 0.4}%)`

  return (
    <div className={`@container relative ${className}`} style={{ filter: 'drop-shadow(0 30px 34px rgba(0,0,0,0.7)) drop-shadow(0 6px 10px rgba(0,0,0,0.45))' }}>
      <div
        className="absolute inset-0 overflow-hidden rounded-[22px]"
        style={{ background: 'linear-gradient(180deg, #282828 0%, #171717 46%, #0c0c0c 100%)', maskImage: notch, WebkitMaskImage: notch }}
      >
        {/* Sunburst lines radiating from the notch */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `repeating-conic-gradient(from ${top ? '270deg' : '90deg'} at ${at}, rgb(255 255 255 / 0.07) 0deg 0.5deg, transparent 0.5deg 5.5deg)`,
            maskImage: `radial-gradient(120% 95% at ${at}, #000 15%, transparent 78%)`,
            WebkitMaskImage: `radial-gradient(120% 95% at ${at}, #000 15%, transparent 78%)`,
          }}
        />
        {/* Sheen and a diagonal reflection */}
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(110% 55% at 0% 0%, rgba(255,255,255,0.13), transparent 62%)' }} />
        <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(118deg, transparent 36%, rgba(255,255,255,0.075) 46%, transparent 57%)' }} />
        {/* Lit rim around the notch, and the edges */}
        <div aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(circle at ${at}, transparent ${size + 0.3}%, rgba(255,255,255,0.22) ${size + 0.7}%, transparent 20%)` }} />
        <div aria-hidden className="absolute inset-0 rounded-[22px]" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.16)' }} />

        {/* Lockup: Dunamis logo turned sideways with the wordmark */}
        <div className={`absolute flex items-center gap-[2.5cqw] ${top ? 'top-[7%] left-[8%] flex-col' : 'right-[8%] bottom-[7%] flex-col-reverse'}`}>
          <Image src={emblem} alt="" sizes="96px" className={`h-auto w-[17cqw] ${top ? 'rotate-90' : '-rotate-90'}`} />
          <span className="text-[9.5cqw] leading-none font-medium text-fg" style={{ writingMode: 'vertical-rl', transform: top ? undefined : 'rotate(180deg)' }}>
            Dunamis
          </span>
        </div>
      </div>
    </div>
  )
}
