import Image from 'next/image'

import crest from '@/assets/brand/crest-official.webp'

/** Sign-in screen. */
export function Logo() {
  return (
    <span className="brand-sign-in">
      <Image src={crest} alt="" width={84} height={94} priority />
      <strong>Dunamis at 30</strong>
      <span>Sign in to the dashboard</span>
    </span>
  )
}

/** Top-left of the page on phones. */
export function Icon() {
  return <Image src={crest} alt="Dunamis at 30" width={24} height={24} style={{ width: 24, height: 'auto' }} />
}
