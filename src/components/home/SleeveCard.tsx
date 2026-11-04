import { AnniversaryCard } from '../AnniversaryCard'
import { CardCase } from './CardCase'

/**
 * Closing scene above the footer, as in the reference: the card is pinned (CSS sticky) while
 * its slip rises with the page and swallows it — the motion follows the scroll 1:1.
 * The slip overlaps the footer band; the footer makes room via [data-sleeve-scene] (styles.css).
 */
export function SleeveCard() {
  return (
    <div data-sleeve-scene aria-hidden className="relative z-10 -mb-[200px] overflow-x-clip sm:-mb-[270px]">
      {/* Dotted guides converging on the card */}
      <svg
        className="absolute top-[18vh] left-1/2 h-[34vh] w-[1440px] max-w-none -translate-x-1/2"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        fill="none"
        stroke="rgb(255 255 255 / 0.16)"
        strokeDasharray="2 7"
      >
        <path d="M0 300C330 120 540 70 640 64M1440 300C1110 120 900 70 800 64" />
      </svg>

      <div className="relative mx-auto h-[135svh] w-[62vw] max-w-[300px]">
        <span className="absolute top-0 left-1/2 h-[24svh] border-l border-dashed border-white/20" />
        {/* The card stays put while the slip below scrolls up into it */}
        <div className="sticky top-[24svh] z-0 px-[4%]">
          <AnniversaryCard className="aspect-[302/479] w-full shadow-[0_40px_90px_-30px_rgba(227,154,23,0.5)]" />
        </div>
        <div className="absolute inset-x-[-4%] bottom-0 z-10">
          <CardCase variant="bottom" className="aspect-[325/488] w-full" />
        </div>
      </div>
    </div>
  )
}
