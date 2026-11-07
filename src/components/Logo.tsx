import Image from 'next/image'
import Link from '@/components/SiteLink'

import lockup from '@/assets/brand/lockup-white.webp'

/** Official Dunamis 30th-anniversary lockup: the crest the church sent on 6 November 2026, with the emblem and wordmark. */
export function Logo({ className = '', size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <Link href="/" aria-label="Dunamis International Gospel Centre 30th Anniversary, home" className={`inline-flex shrink-0 ${className}`}>
      <Image
        src={lockup}
        alt="Dunamis International Gospel Centre 30th Anniversary, since 1996"
        preload={size === 'md'}
        sizes={size === 'lg' ? '320px' : '170px'}
        className={size === 'lg' ? 'h-auto w-[260px] sm:w-[320px]' : 'h-auto w-[150px] sm:w-[170px]'}
      />
    </Link>
  )
}
