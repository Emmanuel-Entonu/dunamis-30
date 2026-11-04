'use client'

import { gsap } from 'gsap'
import { useCallback, useEffect, useRef, useState } from 'react'

import crestImg from '@/assets/brand/crest-official.png'
import emblemImg from '@/assets/brand/emblem-official.png'
import domeImg from '@/assets/photos/glory-dome-interior.webp'
import nationsImg from '@/assets/photos/nations.webp'
import { CardCase } from '@/components/home/CardCase'
import { Close, Share } from '@/components/icons'
import {
  CARD,
  drawCard,
  recordReveal,
  TEMPLATE_ORDER,
  TEMPLATES,
  type CardAssets,
  type CardInput,
  type PhotoSource,
  type TemplateId,
} from '@/lib/cardFrames'
import { logCardEvent } from './actions'

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/** Picker thumbnails for each backdrop. */
const swatch: Record<TemplateId, React.CSSProperties> = {
  glory: { background: `linear-gradient(rgba(8,6,3,.5), rgba(8,6,3,.72)), url(${domeImg.src}) center/cover` },
  pearl: { background: 'linear-gradient(160deg,#fffefb,#f5e9cf)', boxShadow: 'inset 0 0 0 1px rgba(154,106,12,.25)' },
  nations: { background: `linear-gradient(rgba(5,7,12,.55), rgba(5,7,12,.72)), url(${nationsImg.src}) center 65%/cover` },
  emerald: { background: 'linear-gradient(160deg,#0f3b2c,#03110c)' },
  royal: { background: 'radial-gradient(90% 80% at 50% 15%,#6d17b8,#3a0a66 50%,#140325)' },
  onyx: { background: 'linear-gradient(150deg,#1b1915,#060606)' },
}

const input =
  'min-h-[50px] w-full rounded-lg border border-line bg-hair px-4 text-base text-fg placeholder:text-[#999] focus:border-white focus:outline-none'

/** Front-camera capture with a live, mirrored preview. */
function CameraModal({ onCapture, onClose }: { onCapture: (c: HTMLCanvasElement) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream: MediaStream | undefined
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1440 }, height: { ideal: 1440 } }, audio: false })
      .then((s) => {
        stream = s
        if (video.current) video.current.srcObject = s
      })
      .catch(() => setError('We couldn’t open your camera. You can upload a photo instead.'))
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])

  const snap = () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext('2d')!
    // Mirror so the photo matches what the visitor saw.
    ctx.translate(c.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(v, 0, 0)
    onCapture(c)
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Take a photo" className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4 backdrop-blur">
      <div className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-surface p-3 sm:p-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-black">
          {error ? (
            <p className="absolute inset-0 grid place-items-center p-6 text-center">{error}</p>
          ) : (
            <video ref={video} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
          )}
          <span aria-hidden className="pointer-events-none absolute inset-[10%] rounded-[24px] border-2 border-dashed border-white/40" />
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline flex-1">
            Cancel
          </button>
          <button type="button" onClick={snap} disabled={!!error} className="btn btn-primary flex-1 disabled:opacity-50">
            Take Photo
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * The "generating" moment, with no loading text: the editor is gone and the sealed pack rises.
 * It shakes in three growing bursts as if the card is straining to get out, then holds still,
 * and the card is drawn slowly out of the pack and presented on its own.
 * The pack is tall enough to hide the whole 9:16 card until it comes out.
 */
const PACK = { top: 0.25, height: 1.2, inside: 0.42, tucked: 0.14 }
const BURSTS: [start: number, end: number, strength: number][] = [
  [0, 0.2, 0.32],
  [0.3, 0.56, 0.62],
  [0.66, 1, 1],
]

function Presentation({
  url,
  firstName,
  busy,
  onEdit,
  onDownload,
  onVideo,
  onShare,
}: {
  url: string
  firstName: string
  busy: '' | 'video' | 'share'
  onEdit: () => void
  onDownload: () => void
  onVideo: () => void
  onShare: () => void
}) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onEdit()
    window.addEventListener('keydown', onKey)

    const slot = el.querySelector<HTMLElement>('[data-slot]')!
    const first = el.querySelector<HTMLButtonElement>('[data-first]')!
    const H = slot.offsetHeight
    const top = slot.getBoundingClientRect().top
    const VH = window.innerHeight
    const packBottom = PACK.top + PACK.height
    // Sealed: the pack alone, large and centred.
    const sealedScale = Math.min(0.92, (VH * 0.82) / (PACK.height * H))
    const sealedY = VH / 2 - top - sealedScale * ((PACK.top + packBottom) / 2) * H
    // Pulled out: card and pack together span the screen, so scale them to fit.
    const pulledTop = PACK.top + PACK.tucked - 1
    const pull = pulledTop * H
    const pulledScale = Math.min(0.74, (VH * 0.92) / ((packBottom - pulledTop) * H))
    const pulledY = VH / 2 - top - pulledScale * ((pulledTop + packBottom) / 2) * H
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const shake = el.querySelector<HTMLElement>('[data-shake]')!
      const rattle = { t: 0 }
      const RATTLE = 3
      const tl = gsap.timeline()
      tl.set('[data-rig]', { scale: sealedScale, y: VH - top + 60 })
        .set('[data-card]', { y: PACK.inside * H })
        .set('[data-glow]', { autoAlpha: 0 })
        .set('[data-reveal]', { autoAlpha: 0, y: 16 })
        .from('[data-backdrop]', { autoAlpha: 0, duration: 0.6 }, 0)
        .to('[data-rig]', { y: sealedY, duration: 1.4, ease: 'power3.out' }, 0.2)
        .add(() => navigator.vibrate?.([70, 240, 110, 200, 180, 120, 260]), 1.9)
        // Three growing bursts of shaking, with the glow building behind the pack.
        .to(
          rattle,
          {
            t: 1,
            duration: RATTLE,
            ease: 'none',
            onUpdate: () => {
              const burst = BURSTS.find(([a, b]) => rattle.t >= a && rattle.t <= b)
              const swell = burst ? Math.sin(((rattle.t - burst[0]) / (burst[1] - burst[0])) * Math.PI) ** 0.6 * burst[2] : 0
              const at = rattle.t * RATTLE
              gsap.set(shake, {
                x: swell * 9 * Math.sin(at * 2 * Math.PI * 15),
                y: swell * 3.5 * Math.sin(at * 2 * Math.PI * 21 + 1.3),
                rotation: swell * 2.1 * Math.sin(at * 2 * Math.PI * 11 + 0.6),
              })
            },
          },
          1.9,
        )
        .to('[data-glow]', { autoAlpha: 0.3, duration: 0.5 }, 1.9)
        .to('[data-glow]', { autoAlpha: 0.55, duration: 0.6 }, 2.8)
        .to('[data-glow]', { autoAlpha: 0.9, duration: 0.8 }, 3.8)
        .set(shake, { x: 0, y: 0, rotation: 0 }, 4.9)
        // A held breath, then the card comes out slowly.
        .to('[data-card]', { y: pull, duration: 2.1, ease: 'power2.inOut' }, 5.2)
        .to('[data-rig]', { y: pulledY, scale: pulledScale, duration: 2.1, ease: 'power2.inOut' }, 5.2)
        .to('[data-pocket]', { y: H * 1.5, autoAlpha: 0, duration: 1.1, ease: 'power2.in' }, 7.2)
        .to('[data-rig]', { y: 0, scale: 1, duration: 1.5, ease: 'power3.inOut' }, 7.5)
        .to('[data-card]', { y: 0, duration: 1.5, ease: 'power3.inOut' }, 7.5)
        .to('[data-glow]', { autoAlpha: 1, duration: 1 }, 7.9)
        .add(() => el.querySelector('[data-sweep]')?.classList.add('animate-sweep'), 8.7)
        .to('[data-reveal]', { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 }, 8.6)
        .add(() => {
          slot.classList.add('animate-float')
          first.focus({ preventScroll: true })
        }, 9.1)
      if (reduced) tl.progress(1)
    }, el)

    return () => {
      ctx.revert()
      html.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      navigator.vibrate?.(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- plays once per presentation
  }, [])

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label="Your Dunamis at 30 card" className="fixed inset-0 z-[80] overflow-x-hidden overflow-y-auto">
      <div data-backdrop aria-hidden className="fixed inset-0 bg-canvas">
        <div className="bg-ticks absolute inset-0 opacity-60" />
        <div className="flare absolute inset-x-0 bottom-0 h-[55%] opacity-60" />
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Close and edit"
        className="fixed top-4 right-4 z-10 grid size-11 place-items-center rounded-full border border-white/15 bg-surface/80 text-fg backdrop-blur transition-colors hover:border-gold"
      >
        <Close width={20} height={20} />
      </button>

      <div className="relative flex min-h-full flex-col items-center justify-center gap-6 px-5 py-12">
        <div data-slot className="relative" style={{ height: 'min(62svh, 760px)', aspectRatio: '9 / 16' }}>
          <div data-glow aria-hidden className="absolute -inset-[16%] rounded-full bg-gold/25 blur-[90px]" />
          <div data-rig className="absolute inset-0 [transform-origin:50%_0%]">
            <div data-shake className="absolute inset-0 will-change-transform [transform-origin:50%_80%]">
              <div data-card className="absolute inset-0 overflow-hidden rounded-[16px] shadow-[0_50px_90px_-30px_rgba(0,0,0,0.95)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated in the browser */}
                <img src={url} alt="Your Dunamis at 30 card" className="h-full w-full object-cover" />
                <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                  <span data-sweep className="absolute inset-y-[-10%] left-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0" />
                </span>
              </div>
              <div data-pocket className="absolute z-10 -left-[6%] w-[112%]" style={{ top: `${PACK.top * 100}%`, height: `${PACK.height * 100}%` }}>
                <CardCase variant="bottom" notch={11.8} className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>

        <p data-reveal className="text-center text-lg text-fg sm:text-xl">
          You’re all set{firstName ? `, ${firstName}` : ''}! See you at the Glory Dome.
        </p>
        <div className="grid w-full max-w-[600px] grid-cols-2 gap-2.5 sm:grid-cols-4">
          <button data-reveal data-first type="button" onClick={onDownload} className="btn btn-primary">
            Download
          </button>
          <button data-reveal type="button" onClick={onVideo} disabled={busy === 'video'} className="btn btn-outline disabled:opacity-60">
            {busy === 'video' ? 'Recording…' : 'Video'}
          </button>
          <button data-reveal type="button" onClick={onShare} disabled={busy === 'share'} className="btn btn-light disabled:opacity-60">
            <Share width={18} height={18} /> Share
          </button>
          <button data-reveal type="button" onClick={onEdit} className="btn btn-outline">
            Edit Card
          </button>
        </div>
      </div>

    </div>
  )
}

export function CardStudio() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const assets = useRef<CardAssets | null>(null)
  const font = useRef('sans-serif')
  const fileInput = useRef<HTMLInputElement>(null)
  const imageRef = useRef<Blob | null>(null)

  const [ready, setReady] = useState(false)
  const [photo, setPhoto] = useState<PhotoSource | null>(null)
  const [thumb, setThumb] = useState('')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [zoom, setZoom] = useState(1)
  const [template, setTemplate] = useState<TemplateId>('glory')
  const [camera, setCamera] = useState(false)
  const [presented, setPresented] = useState('') // object URL of the generated card
  const [busy, setBusy] = useState<'' | 'video' | 'share'>('')
  const [note, setNote] = useState('')

  const cardInput = useCallback((): CardInput => ({ name, city, photo, zoom, template, font: font.current }), [name, city, photo, zoom, template])

  // Load the backdrop artwork and the site font once.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const [crest, emblem, dome, nations] = await Promise.all([loadImage(crestImg.src), loadImage(emblemImg.src), loadImage(domeImg.src), loadImage(nationsImg.src)])
      font.current = getComputedStyle(document.body).fontFamily
      await Promise.all([700, 600, 500].map((w) => document.fonts.load(`${w} 40px ${font.current}`).catch(() => undefined)))
      if (!alive) return
      assets.current = { crest, emblem, dome, nations }
      setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  // Live preview.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ready || !ctx || !assets.current) return
    drawCard(ctx, cardInput(), assets.current, 1)
  }, [ready, cardInput])

  useEffect(() => () => void (presented && URL.revokeObjectURL(presented)), [presented])

  const applyPhoto = (source: PhotoSource, url: string) => {
    setPhoto(source)
    setThumb(url)
    setZoom(1)
  }

  const onFile = async (file?: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    try {
      applyPhoto(await loadImage(url), url) // browsers apply EXIF orientation when decoding
    } catch {
      setNote('That file couldn’t be opened. Please try a JPG or PNG photo.')
    }
  }

  const renderImage = () =>
    new Promise<Blob>((resolve, reject) => {
      const c = document.createElement('canvas')
      c.width = CARD.w
      c.height = CARD.h
      drawCard(c.getContext('2d')!, cardInput(), assets.current!, 1)
      // High-quality JPEG: a photo-heavy card at a fraction of the PNG size (quicker to share on phones).
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('export failed'))), 'image/jpeg', 0.92)
    })

  const generate = async () => {
    if (!assets.current) return
    const blob = await renderImage()
    imageRef.current = blob
    setNote('')
    setPresented(URL.createObjectURL(blob))
  }

  const fileName = (ext: string) => `dunamis-at-30-${(name.trim() || 'my-card').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`

  const save = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName(ext)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const download = () => {
    if (!imageRef.current) return
    save(imageRef.current, 'jpg')
    logCardEvent({ template, format: 'card', action: 'download' })
  }

  const downloadVideo = async () => {
    if (!assets.current) return
    setBusy('video')
    try {
      const c = document.createElement('canvas')
      c.width = CARD.w
      c.height = CARD.h
      const ctx = c.getContext('2d')!
      const data = cardInput()
      const { blob, ext } = await recordReveal(c, (t) => drawCard(ctx, data, assets.current!, t))
      save(blob, ext)
      logCardEvent({ template, format: 'card-video', action: 'download' })
    } catch {
      setNote('Your browser can’t record video, so please download the image instead.')
    } finally {
      setBusy('')
    }
  }

  const share = async () => {
    if (!imageRef.current) return
    setBusy('share')
    try {
      const file = new File([imageRef.current], fileName('jpg'), { type: 'image/jpeg' })
      const text = 'I will be attending the Dunamis 30th Anniversary celebration! #DunamisAt30'
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text })
      } else {
        save(file, 'jpg')
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${window.location.href}`)}`, '_blank', 'noopener')
      }
      logCardEvent({ template, format: 'card', action: 'share' })
    } catch {
      // Share sheet dismissed.
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      {/* Editor — fades away while the card is presented */}
      <div
        aria-hidden={!!presented || undefined}
        className={`grid gap-6 transition-[opacity,transform,filter] duration-500 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-[25px] ${
          presented ? 'pointer-events-none translate-y-6 scale-[0.98] opacity-0 blur-sm' : ''
        }`}
      >
        <div className="card order-2 h-fit p-5 sm:p-8 lg:order-1">
          <h2 className="h-card">Your Photo</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="grid size-[76px] shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-hair">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
              {thumb ? <img src={thumb} alt="Your photo" className="h-full w-full object-cover" /> : <span className="text-xs">No photo</span>}
            </div>
            <div className="grid flex-1 gap-2">
              <button type="button" onClick={() => setCamera(true)} className="btn btn-primary !min-h-[44px]">
                Take A Photo
              </button>
              <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-outline !min-h-[44px]">
                Upload A Photo
              </button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
          </div>
          {photo && (
            <label className="mt-4 block text-[15px]">
              Zoom
              <input type="range" min={1} max={2} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="mt-2 w-full accent-[#f0a92b]" />
            </label>
          )}
          <p className="mt-3 text-sm">Your photo stays on your device. It’s never uploaded.</p>

          <h2 className="h-card mt-8">Your Details</h2>
          <div className="mt-4 grid gap-3">
            <label className="block">
              <span className="mb-2 block text-base text-fg">Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="e.g. Grace Adebayo" className={input} />
            </label>
            <label className="block">
              <span className="mb-2 block text-base text-fg">Where are you from? (optional)</span>
              <input value={city} onChange={(e) => setCity(e.target.value.slice(0, 36))} placeholder="City, country or church branch" className={input} />
            </label>
          </div>

          <h2 className="h-card mt-8">Backdrop</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TEMPLATE_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTemplate(id)}
                aria-pressed={template === id}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-1 text-xs transition-colors ${template === id ? 'text-fg' : 'text-muted hover:text-fg'}`}
              >
                <span
                  className={`relative block aspect-[9/16] w-full overflow-hidden rounded-lg border-2 transition-colors ${template === id ? 'border-gold' : 'border-transparent'}`}
                  style={swatch[id]}
                >
                  <span aria-hidden className="absolute inset-[10%] rounded-[4px] border border-[#f6dc95]/60" />
                </span>
                {TEMPLATES[id].label}
              </button>
            ))}
          </div>

          <button type="button" onClick={generate} disabled={!ready} className="btn btn-primary mt-8 w-full disabled:opacity-60">
            Generate My Card
          </button>
          {note && !presented && (
            <p className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-hair p-3 text-sm">
              {note}
              <button type="button" onClick={() => setNote('')} aria-label="Dismiss">
                <Close width={16} height={16} />
              </button>
            </p>
          )}
        </div>

        {/* Live preview */}
        <div className="order-1 lg:sticky lg:top-[100px] lg:order-2 lg:self-start">
          <div className="card bg-ticks relative grid min-h-[320px] place-items-center overflow-hidden p-4 sm:p-8">
            <div aria-hidden className="flare absolute inset-x-0 bottom-0 h-1/2 opacity-50" />
            <canvas
              ref={canvas}
              width={CARD.w}
              height={CARD.h}
              aria-label="Preview of your Dunamis at 30 card"
              className="relative h-[min(64svh,720px)] w-auto rounded-2xl shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
              style={{ aspectRatio: `${CARD.w} / ${CARD.h}` }}
            />
            {!ready && <p className="absolute">Loading…</p>}
          </div>
        </div>
      </div>

      {presented && (
        <Presentation
          url={presented}
          firstName={name.trim().split(/\s+/)[0] ?? ''}
          busy={busy}
          onEdit={() => setPresented('')}
          onDownload={download}
          onVideo={downloadVideo}
          onShare={share}
        />
      )}
      {note && presented && (
        <p role="status" className="fixed inset-x-4 bottom-4 z-[85] mx-auto max-w-[480px] rounded-lg border border-line bg-surface p-3 text-center text-sm">
          {note}
        </p>
      )}

      {camera && (
        <CameraModal
          onClose={() => setCamera(false)}
          onCapture={(c) => {
            setCamera(false)
            applyPhoto(c, c.toDataURL('image/jpeg', 0.85))
          }}
        />
      )}
    </>
  )
}
