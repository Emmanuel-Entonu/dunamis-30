import Image, { type ImageProps } from 'next/image'

/**
 * The glass objects are small transparent files, already sized for the site. They skip the image
 * optimiser and come straight from the CDN, so they arrive instantly and keep their fine edges. They
 * start loading with the page, behind everything more important, so each is ready before it's
 * scrolled to. `lazy` is for the few that stay hidden on phones, which would otherwise download for nothing.
 */
export function GlassImage({ lazy = false, alt = '', ...props }: Omit<ImageProps, 'alt' | 'unoptimized' | 'loading' | 'sizes' | 'fetchPriority'> & { alt?: string; lazy?: boolean }) {
  return <Image {...props} alt={alt} unoptimized loading={lazy ? 'lazy' : 'eager'} fetchPriority="low" />
}
