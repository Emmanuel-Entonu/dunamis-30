import { LoadingImage } from './LoadingImage'

/**
 * A photo shown whole, never cropped. A landscape photo gets a frame of its own shape. A tall one sits whole in
 * the middle of a frame no taller than 4:5 (and never taller than the screen), on a soft, blurred copy of itself.
 */
export function WholePhoto({ src, alt, width, height, className = '' }: { src: string; alt: string; width?: number | null; height?: number | null; className?: string }) {
  const shape = width && height ? Math.max(width / height, 4 / 5) : 16 / 10
  const sizes = '(min-width: 900px) 860px, 100vw'
  return (
    <div className={`relative w-full max-h-[80svh] overflow-hidden bg-canvas ${className}`} style={{ aspectRatio: shape }}>
      <LoadingImage src={src} alt="" aria-hidden fill sizes={sizes} className="scale-110 object-cover opacity-60 blur-2xl" />
      <LoadingImage src={src} alt={alt} fill priority sizes={sizes} className="object-contain" />
    </div>
  )
}
