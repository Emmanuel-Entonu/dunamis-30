import Image from 'next/image'

import emblem from '@/assets/brand/emblem-official.png'

/** Sign-in screen. */
export function Logo() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: 'var(--theme-text)' }}>
      <Image src={emblem} alt="" width={44} height={44} style={{ width: 44, height: 'auto' }} />
      <span style={{ fontSize: 24, fontWeight: 600 }}>Dunamis@30</span>
    </span>
  )
}

/** Top-left of the admin. */
export function Icon() {
  return <Image src={emblem} alt="Dunamis@30" width={22} height={22} style={{ width: 22, height: 'auto' }} />
}
