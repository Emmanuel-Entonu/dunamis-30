import Image, { type ImageProps } from 'next/image'

/**
 * The glass objects are small transparent files, already sized for the site. They skip the image
 * optimiser and come straight from the CDN, so they arrive instantly and keep their fine edges. They
 * start loading with the page, behind everything more important, so each is ready before it's
 * scrolled to. `soon` is for the few that are a big part of the first screen.
 */
export function GlassImage({ alt = '', soon = false, ...props }: Omit<ImageProps, 'alt' | 'unoptimized' | 'loading' | 'sizes' | 'fetchPriority'> & { alt?: string; soon?: boolean }) {
  return <Image {...props} alt={alt} unoptimized loading="eager" fetchPriority={soon ? 'high' : 'low'} />
}
