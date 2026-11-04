import Image from 'next/image'
import Link from 'next/link'

import lockup from '@/assets/brand/lockup-white.webp'

/** Official Dunamis 30th-anniversary lockup (crest + emblem + wordmark), from dunamisgospel.org. */
export function Logo({ className = '', size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <Link href="/" aria-label="Dunamis International Gospel Centre — 30th Anniversary, home" className={`inline-flex shrink-0 ${className}`}>
      <Image
        src={lockup}
        alt="Dunamis International Gospel Centre — 30th Anniversary 1996–2026"
        preload={size === 'md'}
        sizes={size === 'lg' ? '320px' : '170px'}
        className={size === 'lg' ? 'h-auto w-[260px] sm:w-[320px]' : 'h-auto w-[150px] sm:w-[170px]'}
      />
    </Link>
  )
}
