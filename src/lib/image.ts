import type { StaticImageData } from 'next/image'

/** Built-in photos come with a tiny blurred preview. Photos from the CMS don't, so they get none. */
export const blurFor = (src: StaticImageData | string) => (typeof src === 'string' ? 'empty' : 'blur')
