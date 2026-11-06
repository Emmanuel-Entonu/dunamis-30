import Script from 'next/script'
import type { ReactNode } from 'react'

export const inputClass =
  'min-h-[50px] w-full scroll-mt-28 rounded-lg border border-line bg-hair px-4 text-base text-fg transition-colors placeholder:text-[#999] focus:border-white focus:outline-none aria-invalid:border-[#ff8a7a] sm:pl-6'

export function Field({
  name,
  label,
  required,
  error,
  hint,
  children,
}: {
  name: string
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2.5 block text-base text-fg">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-2 text-sm">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm text-[#ff8a7a]">
          {error}
        </p>
      )}
    </div>
  )
}

const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** Hidden anti-bot fields shared by every public form, plus the Turnstile check once it's configured. */
export function BotFields() {
  return (
    <>
      {/* Truly hidden and neutrally named, so a browser's autofill can't fill it in and lose someone's form. */}
      <div aria-hidden hidden>
        <label>
          Leave this empty <input name="leave_empty" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {turnstileKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
          <div className="cf-turnstile mb-6" data-sitekey={turnstileKey} data-theme="dark" />
        </>
      )}
    </>
  )
}

const MAX_SHRUNK_BYTES = 1_200_000

/** Shrinks a photo in the browser (longest side ≤ max) so uploads stay small on mobile data. */
export async function shrinkPhoto(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * s)
    c.height = Math.round(img.naturalHeight * s)
    const ctx = c.getContext('2d')!
    // A see-through picture would otherwise come out on black.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    const encode = (q: number) => new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', q))
    // A form can carry two photos and a video cover, and the server refuses anything over 4.5 MB in one go.
    let blob = await encode(quality)
    for (const lower of [0.7, 0.55]) {
      if (blob.size <= MAX_SHRUNK_BYTES) break
      blob = await encode(lower)
    }
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
